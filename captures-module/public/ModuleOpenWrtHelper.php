<?php
/*
 * Project: Frieren Framework
 * Module: Captures (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\captures;

/**
 * Browses the per-device pcap sessions the honeypot MITM watcher writes to
 * the USB drive, and shows which devices are connected to the honeypot AP
 * right now (cross-referenced with the shared allow-list and OUI vendor
 * data). Capture files themselves stay on USB; this module only lists,
 * inspects, and prunes them.
 */
class ModuleOpenWrtHelper
{
    private const CAPTURE_BASE = '/mnt/usb/frieren/aura/mitm-captures';
    private const PID_DIR      = '/mnt/usb/frieren/aura/hooks.d/.mitm-pids';
    private const OUI_DB       = '/usr/share/frieren/modules/kismet/conf/kismet_manuf.txt.gz';
    private const AP_IFACE     = 'phy0-ap0';
    private const CLI          = 'frieren-aura-cli';

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Lists every capture session directory with its files (name, size,
     * modified time). Packet counts are computed lazily via getPcapStats so
     * this listing stays fast even with large pcaps.
     *
     * @return array{base: string, sessions: array<array{
     *   dir: string, name: string, mac: string, vendor: string,
     *   startedAt: ?string, totalBytes: int,
     *   files: array<array{name: string, path: string, bytes: int, mtime: int, isPcap: bool}>
     * }>}
     */
    public static function getSessions()
    {
        $sessions = [];
        $base = self::CAPTURE_BASE;

        if (!is_dir($base)) {
            return ['base' => $base, 'sessions' => []];
        }

        foreach (scandir($base) as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }
            $dir = "{$base}/{$entry}";
            if (!is_dir($dir)) {
                continue;
            }

            // Directory name is "<MAC-with-dashes>_<YYYYmmdd_His>"
            [$mac, $startedAt] = self::parseSessionName($entry);

            $files = [];
            $totalBytes = 0;
            foreach (scandir($dir) as $f) {
                if ($f === '.' || $f === '..') {
                    continue;
                }
                $full = "{$dir}/{$f}";
                if (!is_file($full)) {
                    continue;
                }
                $bytes = (int)filesize($full);
                $totalBytes += $bytes;
                $files[] = [
                    'name'   => $f,
                    'path'   => $full,
                    'bytes'  => $bytes,
                    'mtime'  => (int)filemtime($full),
                    'isPcap' => (bool)preg_match('/\.pcap$/i', $f),
                ];
            }

            usort($files, fn($a, $b) => $b['mtime'] <=> $a['mtime']);

            $sessions[] = [
                'dir'        => $dir,
                'name'       => $entry,
                'mac'        => $mac,
                'vendor'     => $mac !== '' ? self::resolveVendor($mac) : 'Unknown vendor',
                'startedAt'  => $startedAt,
                'totalBytes' => $totalBytes,
                'files'      => $files,
            ];
        }

        // Newest session first
        usort($sessions, fn($a, $b) => strcmp((string)$b['startedAt'], (string)$a['startedAt']));

        return ['base' => $base, 'sessions' => $sessions];
    }

    /**
     * Returns packet count and time span for one pcap file (computed on
     * demand with tcpdump, since capinfos isn't installed).
     *
     * @param string $file Absolute path, must live under CAPTURE_BASE.
     * @return array{packets: int, firstTs: ?string, lastTs: ?string, bytes: int}|null
     */
    public static function getPcapStats($file)
    {
        if (!self::isSafeCapturePath($file) || !is_file($file)) {
            return null;
        }

        $packets = (int)trim((string)shell_exec(
            'tcpdump -r ' . escapeshellarg($file) . ' -nn 2>/dev/null | wc -l'
        ));

        $first = trim((string)shell_exec(
            'tcpdump -r ' . escapeshellarg($file) . ' -nn -tttt -c 1 2>/dev/null | awk \'{print $1" "$2}\''
        ));
        $last = trim((string)shell_exec(
            'tcpdump -r ' . escapeshellarg($file) . ' -nn -tttt 2>/dev/null | tail -1 | awk \'{print $1" "$2}\''
        ));

        return [
            'packets' => $packets,
            'firstTs' => $first !== '' ? $first : null,
            'lastTs'  => $last !== '' ? $last : null,
            'bytes'   => (int)filesize($file),
        ];
    }

    /**
     * Deletes one capture session directory (and its files).
     *
     * @param string $dir Absolute path, must live directly under CAPTURE_BASE.
     * @return array{ok: bool, message: string}
     */
    public static function deleteSession($dir)
    {
        if (!self::isSafeSessionDir($dir) || !is_dir($dir)) {
            return ['ok' => false, 'message' => 'Invalid session directory.'];
        }

        shell_exec('rm -rf ' . escapeshellarg($dir) . ' 2>/dev/null');

        return ['ok' => !is_dir($dir), 'message' => is_dir($dir) ? 'Delete failed.' : ''];
    }

    /**
     * Current honeypot AP clients, enriched with allow-list status, OUI
     * vendor, signal, connected time, throughput, and whether a passive
     * capture is actively running for that MAC.
     *
     * @return array{iface: string, clients: array<array{
     *   mac: string, vendor: string, allowed: bool, capturing: bool,
     *   signal: ?int, connectedSec: ?int, rxBytes: ?int, txBytes: ?int
     * }>}
     */
    public static function getLiveClients()
    {
        $allowed = self::getAllowedMacs();

        $dump = (string)shell_exec(
            'iw dev ' . escapeshellarg(self::AP_IFACE) . ' station dump 2>/dev/null'
        );

        $clients = [];
        $cur = null;
        foreach (explode("\n", $dump) as $line) {
            if (preg_match('/^Station\s+([0-9a-fA-F:]{17})/', $line, $m)) {
                if ($cur !== null) {
                    $clients[] = $cur;
                }
                $mac = strtoupper($m[1]);
                $cur = [
                    'mac'          => $mac,
                    'vendor'       => self::resolveVendor($mac),
                    'allowed'      => in_array($mac, $allowed, true),
                    'capturing'    => self::isCapturing($mac),
                    'signal'       => null,
                    'connectedSec' => null,
                    'rxBytes'      => null,
                    'txBytes'      => null,
                ];
            } elseif ($cur !== null) {
                if (preg_match('/signal:\s*(-?\d+)/', $line, $m)) {
                    $cur['signal'] = (int)$m[1];
                } elseif (preg_match('/connected time:\s*(\d+)/', $line, $m)) {
                    $cur['connectedSec'] = (int)$m[1];
                } elseif (preg_match('/rx bytes:\s*(\d+)/', $line, $m)) {
                    $cur['rxBytes'] = (int)$m[1];
                } elseif (preg_match('/tx bytes:\s*(\d+)/', $line, $m)) {
                    $cur['txBytes'] = (int)$m[1];
                }
            }
        }
        if ($cur !== null) {
            $clients[] = $cur;
        }

        return ['iface' => self::AP_IFACE, 'clients' => $clients];
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private static function parseSessionName($name)
    {
        // "AC-8B-A9-0E-5A-F0_20261109_131301"
        if (preg_match('/^([0-9A-Fa-f-]{17})_(\d{8})_(\d{6})$/', $name, $m)) {
            $mac = strtoupper(str_replace('-', ':', $m[1]));
            $d = $m[2];
            $t = $m[3];
            $iso = sprintf(
                '%s-%s-%s %s:%s:%s',
                substr($d, 0, 4), substr($d, 4, 2), substr($d, 6, 2),
                substr($t, 0, 2), substr($t, 2, 2), substr($t, 4, 2)
            );
            return [$mac, $iso];
        }
        return ['', null];
    }

    private static function isCapturing($mac)
    {
        $macSafe = str_replace(':', '-', $mac);
        $pidFile = self::PID_DIR . "/{$macSafe}.capture.pid";
        if (!is_file($pidFile)) {
            return false;
        }
        $pid = trim((string)file_get_contents($pidFile));
        if ($pid === '') {
            return false;
        }
        exec('kill -0 ' . escapeshellarg($pid) . ' 2>/dev/null', $out, $code);
        return $code === 0;
    }

    private static function getAllowedMacs()
    {
        $out = shell_exec(self::CLI . ' filter_list 2>/dev/null');
        $macs = [];
        foreach (explode("\n", trim((string)$out)) as $line) {
            $line = trim($line);
            if (strncmp($line, 'mac ', 4) === 0) {
                $macs[] = strtoupper(trim(substr($line, 4)));
            }
        }
        return $macs;
    }

    private static function loadOuiDatabase()
    {
        static $db = null;
        if ($db !== null) {
            return $db;
        }

        $db = [];
        $raw = shell_exec('zcat ' . escapeshellarg(self::OUI_DB) . ' 2>/dev/null');
        foreach (explode("\n", (string)$raw) as $line) {
            $parts = explode("\t", $line, 2);
            if (count($parts) === 2) {
                $db[strtoupper(trim($parts[0]))] = trim($parts[1]);
            }
        }

        return $db;
    }

    public static function resolveVendor($mac)
    {
        $db = self::loadOuiDatabase();
        $oui = strtoupper(substr($mac, 0, 8));
        return $db[$oui] ?? 'Unknown vendor';
    }

    /**
     * True only for a path that sits directly inside a session directory
     * under CAPTURE_BASE (no traversal, no symlink escape).
     */
    private static function isSafeCapturePath($file)
    {
        if ($file === '' || strpos($file, "\0") !== false) {
            return false;
        }
        $real = realpath($file);
        $base = realpath(self::CAPTURE_BASE);
        return $real !== false && $base !== false && strncmp($real, $base . '/', strlen($base) + 1) === 0;
    }

    /**
     * True only for a directory that is an immediate child of CAPTURE_BASE.
     */
    private static function isSafeSessionDir($dir)
    {
        if ($dir === '' || strpos($dir, "\0") !== false) {
            return false;
        }
        $real = realpath($dir);
        $base = realpath(self::CAPTURE_BASE);
        if ($real === false || $base === false) {
            return false;
        }
        return dirname($real) === $base;
    }
}
