<?php
/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\theme;

/**
 * Persists a custom color theme (UCI, JSON-encoded) and compiles it into
 * /usr/share/frieren/assets/custom-theme.css — a single stylesheet, linked
 * from index.html right after the core index.css, that re-themes every page
 * via Bootstrap's own --bs-* CSS variables plus two ZeroDay accent
 * variables (--zd-pink / --zd-blue) that every custom module's colors.js
 * consumes through var(--zd-pink, #ff2d78) so inline-styled accents repaint
 * too, not just stylesheet-driven ones.
 *
 * Also switches the sidebar module icons (each custom module ships
 * icon-dark.png / icon-light.png / icon-colored.png alongside its live
 * icon.png) and accepts banner/background image uploads as base64 data
 * URIs, saved to disk under /usr/share/frieren/assets/theme-uploads/.
 */
class ModuleOpenWrtHelper
{
    private const UCI_CONFIG  = 'frieren';
    private const UCI_SECTION = '@settings[0]';
    private const UCI_OPTION  = 'custom_theme';
    private const CSS_PATH    = '/usr/share/frieren/assets/custom-theme.css';
    private const UPLOAD_DIR  = '/usr/share/frieren/assets/theme-uploads';
    private const MODULES_DIR = '/usr/share/frieren/modules';

    // Every custom module that ships pre-rendered icon-<style>.png variants.
    private const ICON_MODULES = [
        'bettercap', 'chanmap', 'hsharvest', 'kismet', 'livecap', 'macfilter',
        'mdk4', 'probetracker', 'wireshark', 'theme', 'captures', 'pcapview', 'syshealth',
    ];
    private const ICON_STYLES = ['dark', 'light', 'colored'];

    private const TOKEN_KEYS = [
        'bodyBg', 'bodyColor', 'surface', 'border',
        'primary', 'accentPink', 'accentBlue',
        'sidebarBg', 'sidebarText',
    ];

    private const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3MB decoded

    private const DEFAULT_THEME = [
        'mode'      => 'dark',
        'iconStyle' => 'colored',
        'colors'    => [
            'bodyBg'      => '#0b0f14',
            'bodyColor'   => '#ff2d78',
            'surface'     => '#121821',
            'border'      => '#263040',
            'primary'     => '#ff2d78',
            'accentPink'  => '#ff2d78',
            'accentBlue'  => '#7dd3fc',
            'sidebarBg'   => '#0b0f14',
            'sidebarText' => '#ff2d78',
        ],
        'images' => [
            'banner'     => null,
            'background' => null,
            'bgOpacity'  => 0.15,
        ],
    ];

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public static function getTheme()
    {
        $raw = self::uciGet();
        return $raw !== null ? self::normalize($raw) : self::DEFAULT_THEME;
    }

    /**
     * @param array $raw Untrusted theme payload from the request.
     * @return array The normalized, persisted theme.
     */
    public static function setTheme($raw)
    {
        $theme = self::normalize($raw);
        self::uciSet($theme);
        self::writeCss($theme);
        self::applyIconStyle($theme['iconStyle']);
        return $theme;
    }

    public static function resetTheme()
    {
        self::uciDelete();
        self::writeCss(self::DEFAULT_THEME);
        self::applyIconStyle(self::DEFAULT_THEME['iconStyle']);
        return self::DEFAULT_THEME;
    }

    /**
     * Decodes a data: URI, validates it's an image under the size cap, and
     * saves it to UPLOAD_DIR. Returns the public URL path to store in the
     * theme's images.banner / images.background field.
     *
     * @param string $kind 'banner' or 'background'
     * @param string $dataUri e.g. "data:image/png;base64,...."
     * @return array{ok: bool, url: ?string, message: string}
     */
    public static function uploadImage($kind, $dataUri)
    {
        if (!in_array($kind, ['banner', 'background'], true)) {
            return ['ok' => false, 'url' => null, 'message' => 'Invalid image kind.'];
        }
        if (!preg_match('/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/s', (string)$dataUri, $m)) {
            return ['ok' => false, 'url' => null, 'message' => 'Not a valid image data URI.'];
        }
        $ext  = $m[1] === 'jpeg' ? 'jpg' : $m[1];
        $data = base64_decode($m[2], true);
        if ($data === false) {
            return ['ok' => false, 'url' => null, 'message' => 'Failed to decode image.'];
        }
        if (strlen($data) > self::MAX_UPLOAD_BYTES) {
            return ['ok' => false, 'url' => null, 'message' => 'Image too large (max 3MB).'];
        }

        @mkdir(self::UPLOAD_DIR, 0755, true);
        $filename = "theme-{$kind}.{$ext}";
        $path     = self::UPLOAD_DIR . '/' . $filename;

        // Clear any stale same-kind file with a different extension.
        foreach (['png', 'jpg', 'jpeg', 'webp', 'gif'] as $staleExt) {
            $stale = self::UPLOAD_DIR . "/theme-{$kind}.{$staleExt}";
            if ($stale !== $path && file_exists($stale)) {
                @unlink($stale);
            }
        }

        if (@file_put_contents($path, $data) === false) {
            return ['ok' => false, 'url' => null, 'message' => 'Failed to write image.'];
        }

        $url = "/assets/theme-uploads/{$filename}?t=" . time();
        return ['ok' => true, 'url' => $url, 'message' => ''];
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private static function isHex($value)
    {
        return is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', trim($value)) === 1;
    }

    private static function normalize($raw)
    {
        $theme = self::DEFAULT_THEME;

        if (isset($raw['mode']) && in_array($raw['mode'], ['dark', 'light', 'auto'], true)) {
            $theme['mode'] = $raw['mode'];
        }
        if (isset($raw['iconStyle']) && in_array($raw['iconStyle'], self::ICON_STYLES, true)) {
            $theme['iconStyle'] = $raw['iconStyle'];
        }

        $colors = is_array($raw['colors'] ?? null) ? $raw['colors'] : [];
        foreach (self::TOKEN_KEYS as $key) {
            if (self::isHex($colors[$key] ?? null)) {
                $theme['colors'][$key] = strtolower(trim($colors[$key]));
            }
        }

        $images = is_array($raw['images'] ?? null) ? $raw['images'] : [];
        if (array_key_exists('banner', $images) && (is_string($images['banner']) || $images['banner'] === null)) {
            $theme['images']['banner'] = $images['banner'];
        }
        if (array_key_exists('background', $images) && (is_string($images['background']) || $images['background'] === null)) {
            $theme['images']['background'] = $images['background'];
        }
        if (isset($images['bgOpacity']) && is_numeric($images['bgOpacity'])) {
            $theme['images']['bgOpacity'] = max(0, min(1, (float)$images['bgOpacity']));
        }

        return $theme;
    }

    private static function uciGet()
    {
        $section = self::UCI_SECTION;
        $out = trim((string)shell_exec(
            'uci -q get ' . escapeshellarg(self::UCI_CONFIG . '.' . $section . '.' . self::UCI_OPTION) . ' 2>/dev/null'
        ));
        if ($out === '') {
            return null;
        }
        $decoded = json_decode($out, true);
        return is_array($decoded) ? $decoded : null;
    }

    private static function uciSet($theme)
    {
        $json = json_encode($theme);
        $key  = self::UCI_CONFIG . '.' . self::UCI_SECTION . '.' . self::UCI_OPTION;
        shell_exec('uci set ' . escapeshellarg($key) . '=' . escapeshellarg($json) . ' 2>&1');
        shell_exec('uci commit ' . escapeshellarg(self::UCI_CONFIG) . ' 2>&1');
    }

    private static function uciDelete()
    {
        $key = self::UCI_CONFIG . '.' . self::UCI_SECTION . '.' . self::UCI_OPTION;
        shell_exec('uci -q delete ' . escapeshellarg($key) . ' 2>&1');
        shell_exec('uci commit ' . escapeshellarg(self::UCI_CONFIG) . ' 2>&1');
    }

    /**
     * Copies icon-<style>.png over icon.png for every module that ships
     * icon style variants. Sidebar icons are plain <img src="/modules/
     * <name>/icon.png"> so overwriting in place is the only way to switch
     * them without a core frontend change.
     */
    private static function applyIconStyle($style)
    {
        if (!in_array($style, self::ICON_STYLES, true)) {
            return;
        }
        foreach (self::ICON_MODULES as $mod) {
            $variant = self::MODULES_DIR . "/{$mod}/icon-{$style}.png";
            $target  = self::MODULES_DIR . "/{$mod}/icon.png";
            if (is_file($variant)) {
                @copy($variant, $target);
            }
        }
    }

    /**
     * Compiles the theme into CSS and writes it to CSS_PATH. Every
     * declaration is !important so it wins over index.css's own
     * [data-bs-theme=dark] block regardless of selector specificity — the
     * only thing that reliably beats that without reordering index.css.
     */
    private static function writeCss($theme)
    {
        $c   = $theme['colors'];
        $img = $theme['images'] ?? self::DEFAULT_THEME['images'];

        $lines = [];
        $lines[] = '/* ZeroDay Theme Customizer — generated file, do not hand-edit. */';
        $lines[] = ':root{';
        $lines[] = "  --bs-body-bg: {$c['bodyBg']} !important;";
        $lines[] = "  --bs-body-color: {$c['bodyColor']} !important;";
        $lines[] = "  --bs-card-bg: {$c['surface']} !important;";
        $lines[] = "  --bs-tertiary-bg: {$c['surface']} !important;";
        $lines[] = "  --bs-secondary-bg: {$c['surface']} !important;";
        $lines[] = "  --bs-border-color: {$c['border']} !important;";
        $lines[] = "  --bs-border-color-translucent: {$c['border']} !important;";
        $lines[] = "  --bs-primary: {$c['primary']} !important;";
        $lines[] = "  --bs-link-color: {$c['primary']} !important;";
        $lines[] = "  --bs-link-hover-color: {$c['primary']} !important;";
        $lines[] = "  --zd-pink: {$c['accentPink']};";
        $lines[] = "  --zd-blue: {$c['accentBlue']};";
        $lines[] = '}';

        if (!empty($img['background'])) {
            $bg  = $img['background'];
            $op  = max(0, min(1, (float)($img['bgOpacity'] ?? 0.15)));
            $dim = 1 - $op;
            $lines[] = "body{background-color: {$c['bodyBg']} !important; color: {$c['bodyColor']} !important; " .
                "background-image: linear-gradient(rgba(0,0,0,{$dim}),rgba(0,0,0,{$dim})), url('{$bg}') !important; " .
                "background-size: cover !important; background-attachment: fixed !important; background-position: center !important;}";
        } else {
            $lines[] = "body{background-color: {$c['bodyBg']} !important; color: {$c['bodyColor']} !important;}";
        }

        $lines[] = "#sidebar{background-color: {$c['sidebarBg']} !important; color: {$c['sidebarText']} !important;}";

        if (!empty($img['banner'])) {
            $banner = $img['banner'];
            $lines[] = ".navbar{background-image: url('{$banner}') !important; background-size: cover !important; background-position: center !important;}";
        }

        $css = implode("\n", $lines) . "\n";

        // nginx's location block for /assets/*.css forces
        // `Content-Encoding: gzip` on every response (the framework's own
        // "poor man's gzip_static" — see index.css, module.umd.js), so the
        // bytes on disk MUST already be gzip-compressed or the browser's
        // gunzip fails outright (net::ERR_CONTENT_DECODING_FAILED).
        @file_put_contents(self::CSS_PATH, gzencode($css, 9));
    }
}
