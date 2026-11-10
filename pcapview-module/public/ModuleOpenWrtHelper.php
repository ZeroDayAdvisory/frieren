<?php
/*
 * Project: Frieren Framework
 * Module: PCAP Analysis (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\pcapview;

/**
 * Runs tcpdump against the saved honeypot captures. The OpenWrt feed for
 * this platform ships no tshark/wireshark-cli, so analysis is BPF-filter
 * based with tcpdump's own decoding (summary / verbose / ASCII / hex).
 * Read-only: it never writes to the capture files, only reads them.
 */
class ModuleOpenWrtHelper
{
    private const CAPTURE_BASE = '/mnt/usb/frieren/aura/mitm-captures';

    // Output decoding modes mapped to tcpdump flags.
    private const MODES = [
        'summary' => '-nn -q',
        'detail'  => '-nn -v',
        'ascii'   => '-nn -A',
        'hex'     => '-nn -X',
    ];

    private const MAX_PACKETS = 5000;
    private const MAX_OUTPUT_BYTES = 262144; // 256 KB cap on returned text

    /**
     * Lists every .pcap under the capture tree with its session and size.
     *
     * @return array{base: string, files: array<array{path: string, session: string, name: string, bytes: int, mtime: int}>}
     */
    public static function getPcapList()
    {
        $base = self::CAPTURE_BASE;
        $files = [];

        if (is_dir($base)) {
            foreach (scandir($base) as $session) {
                if ($session === '.' || $session === '..') {
                    continue;
                }
                $dir = "{$base}/{$session}";
                if (!is_dir($dir)) {
                    continue;
                }
                foreach (scandir($dir) as $f) {
                    if (!preg_match('/\.pcap$/i', $f)) {
                        continue;
                    }
                    $full = "{$dir}/{$f}";
                    if (!is_file($full)) {
                        continue;
                    }
                    $files[] = [
                        'path'    => $full,
                        'session' => $session,
                        'name'    => $f,
                        'bytes'   => (int)filesize($full),
                        'mtime'   => (int)filemtime($full),
                    ];
                }
            }
        }

        usort($files, fn($a, $b) => $b['mtime'] <=> $a['mtime']);

        return ['base' => $base, 'files' => $files];
    }

    /**
     * Runs tcpdump on one capture file with a BPF filter and decoding mode.
     * The filter is passed as a single quoted argument, so the shell never
     * interprets it; tcpdump parses it only as a BPF expression. A bad
     * filter makes tcpdump exit with an error, which is returned as-is.
     *
     * @return array{command: string, output: string, lines: int, truncated: bool, error: ?string}|null
     */
    public static function runFilter($file, $filter, $mode, $limit)
    {
        if (!self::isSafeCapturePath($file) || !is_file($file)) {
            return null;
        }

        $modeFlags = self::MODES[$mode] ?? self::MODES['summary'];
        $limit = max(1, min(self::MAX_PACKETS, (int)$limit));
        $filter = trim($filter);

        $cmd = 'timeout 25 tcpdump -r ' . escapeshellarg($file) . ' ' . $modeFlags .
            ' -c ' . $limit;
        if ($filter !== '') {
            $cmd .= ' ' . escapeshellarg($filter);
        }
        $cmd .= ' 2>&1';

        $raw = (string)shell_exec($cmd);

        $truncated = false;
        if (strlen($raw) > self::MAX_OUTPUT_BYTES) {
            $raw = substr($raw, 0, self::MAX_OUTPUT_BYTES);
            $truncated = true;
        }

        // tcpdump prints filter-parse errors prefixed with "tcpdump: "
        $error = null;
        if (preg_match('/^tcpdump: (.*(syntax error|parse error|unknown|invalid).*)$/mi', $raw, $m)) {
            $error = trim($m[1]);
        }

        $lines = $raw === '' ? 0 : substr_count($raw, "\n");

        // Human-readable command (without the 2>&1 plumbing)
        $display = 'tcpdump -r ' . basename($file) . ' ' . $modeFlags . ' -c ' . $limit .
            ($filter !== '' ? " '{$filter}'" : '');

        return [
            'command'   => $display,
            'output'    => $raw,
            'lines'     => $lines,
            'truncated' => $truncated,
            'error'     => $error,
        ];
    }

    private static function isSafeCapturePath($file)
    {
        if ($file === '' || strpos($file, "\0") !== false) {
            return false;
        }
        $real = realpath($file);
        $base = realpath(self::CAPTURE_BASE);
        return $real !== false && $base !== false && strncmp($real, $base . '/', strlen($base) + 1) === 0;
    }
}
