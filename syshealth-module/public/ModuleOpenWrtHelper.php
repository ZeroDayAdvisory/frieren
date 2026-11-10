<?php
/*
 * Project: Frieren Framework
 * Module: System Health (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\syshealth;

/**
 * At-a-glance health for the pentest rig: disk usage for the internal
 * overlay and the USB drive (where captures live), SoC temperature,
 * memory, load/uptime, and whether the key daemons/processes are running.
 * Read-only.
 */
class ModuleOpenWrtHelper
{
    private const CAPTURE_BASE = '/mnt/usb/frieren/aura/mitm-captures';
    private const MITM_FLAG    = '/mnt/usb/frieren/aura/hooks.d/.mitm-active';
    private const THERMAL      = '/sys/class/thermal/thermal_zone0/temp';

    // label => pgrep pattern (-f where the match needs the full cmdline)
    private const PROCESSES = [
        'bettercap' => ['pattern' => 'bettercap', 'full' => false],
        'nginx'     => ['pattern' => 'nginx',     'full' => false],
        'php-fpm'   => ['pattern' => 'php-fpm',   'full' => true],
        'hostapd'   => ['pattern' => 'hostapd',   'full' => false],
        'tcpdump'   => ['pattern' => 'tcpdump',   'full' => false],
    ];

    public static function getHealth()
    {
        return [
            'disks'     => self::getDisks(),
            'temp'      => self::getTemp(),
            'memory'    => self::getMemory(),
            'uptime'    => self::getUptime(),
            'load'      => self::getLoad(),
            'processes' => self::getProcesses(),
            'mitmActive' => file_exists(self::MITM_FLAG),
            'captureBytes' => self::getCaptureBytes(),
            'generatedAt'  => date('c'),
        ];
    }

    private static function getDisks()
    {
        $disks = [];
        foreach ([['overlay', '/overlay'], ['usb', '/mnt/usb']] as [$label, $mount]) {
            $line = trim((string)shell_exec('df -k ' . escapeshellarg($mount) . ' 2>/dev/null | tail -1'));
            if ($line === '') {
                continue;
            }
            $cols = preg_split('/\s+/', $line);
            // Filesystem 1K-blocks Used Available Use% Mounted
            if (count($cols) >= 5) {
                $totalK = (int)$cols[count($cols) - 5];
                $usedK  = (int)$cols[count($cols) - 4];
                $availK = (int)$cols[count($cols) - 3];
                $disks[] = [
                    'label'      => $label,
                    'mount'      => $mount,
                    'totalBytes' => $totalK * 1024,
                    'usedBytes'  => $usedK * 1024,
                    'availBytes' => $availK * 1024,
                    'usePercent' => $totalK > 0 ? (int)round($usedK / $totalK * 100) : 0,
                ];
            }
        }
        return $disks;
    }

    private static function getTemp()
    {
        if (!is_file(self::THERMAL)) {
            return null;
        }
        $raw = (int)trim((string)@file_get_contents(self::THERMAL));
        if ($raw <= 0) {
            return null;
        }
        // millidegrees C
        return round($raw / 1000, 1);
    }

    private static function getMemory()
    {
        $info = (string)@file_get_contents('/proc/meminfo');
        $total = $avail = 0;
        if (preg_match('/MemTotal:\s+(\d+)/', $info, $m)) {
            $total = (int)$m[1] * 1024;
        }
        if (preg_match('/MemAvailable:\s+(\d+)/', $info, $m)) {
            $avail = (int)$m[1] * 1024;
        }
        return [
            'totalBytes' => $total,
            'availBytes' => $avail,
            'usedBytes'  => $total - $avail,
            'usePercent' => $total > 0 ? (int)round(($total - $avail) / $total * 100) : 0,
        ];
    }

    private static function getUptime()
    {
        $raw = (string)@file_get_contents('/proc/uptime');
        $sec = (int)floatval(strtok($raw, ' '));
        return $sec;
    }

    private static function getLoad()
    {
        $raw = (string)@file_get_contents('/proc/loadavg');
        $parts = preg_split('/\s+/', trim($raw));
        return [
            '1m'  => (float)($parts[0] ?? 0),
            '5m'  => (float)($parts[1] ?? 0),
            '15m' => (float)($parts[2] ?? 0),
        ];
    }

    private static function getProcesses()
    {
        $out = [];
        foreach (self::PROCESSES as $label => $spec) {
            $flag = $spec['full'] ? '-f ' : '';
            $pids = trim((string)shell_exec(
                'pgrep ' . $flag . escapeshellarg($spec['pattern']) . ' 2>/dev/null'
            ));
            $count = $pids === '' ? 0 : count(explode("\n", $pids));
            $out[] = [
                'name'    => $label,
                'running' => $count > 0,
                'count'   => $count,
            ];
        }
        return $out;
    }

    private static function getCaptureBytes()
    {
        if (!is_dir(self::CAPTURE_BASE)) {
            return 0;
        }
        $raw = trim((string)shell_exec(
            'du -sk ' . escapeshellarg(self::CAPTURE_BASE) . ' 2>/dev/null | cut -f1'
        ));
        return (int)$raw * 1024;
    }
}
