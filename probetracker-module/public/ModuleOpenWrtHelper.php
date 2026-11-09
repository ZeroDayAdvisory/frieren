<?php
/*
 * Project: Frieren Framework
 * Module: Probe Tracker (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\probetracker;

/**
 * Runs a background tshark process on a monitor interface, capturing probe
 * requests into a persistent SQLite database. The UI polls getProbeDevices()
 * which reads from that DB, groups by source MAC, and enriches each device
 * with its OUI vendor name and allow-list status.
 *
 * Architecture: tshark → CSV pipe → probe_capture.sh → probe.db (SQLite)
 * The shell wrapper is used because tshark's -w to sqlite is not available
 * on OpenWrt builds; instead we use a line-based CSV parse script.
 */
class ModuleOpenWrtHelper
{
    private const DB_PATH    = '/tmp/frieren-probetracker/probe.db';
    private const PID_FILE   = '/tmp/frieren-probetracker/capture.pid';
    private const DATA_DIR   = '/tmp/frieren-probetracker';
    private const OUI_DB     = '/usr/share/frieren/modules/kismet/conf/kismet_manuf.txt.gz';
    private const ALLOW_DB   = '/mnt/usb/frieren/aura/allow.db';
    private const IFACES     = ['wlan0', 'wlan1'];

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Returns all devices that have sent probe requests, grouped by source MAC.
     * Each entry includes the SSIDs they were probing for, seen count, last seen
     * timestamp, vendor name, and whether the MAC is on the Aura allow-list.
     *
     * @return array<array{mac: string, vendor: string, onAllowList: bool, probes: array<string>, count: int, lastSeen: string}>
     */
    public static function getProbeDevices()
    {
        if (!file_exists(self::DB_PATH)) {
            return [];
        }

        $db = new \SQLite3(self::DB_PATH, SQLITE3_OPEN_READONLY);
        $res = $db->query(
            'SELECT mac, ssid, COUNT(*) as cnt, MAX(ts) as last_seen
             FROM probes
             GROUP BY mac, ssid
             ORDER BY last_seen DESC'
        );

        $byMac = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $mac = strtoupper($row['mac']);
            if (!isset($byMac[$mac])) {
                $byMac[$mac] = [
                    'mac'         => $mac,
                    'vendor'      => self::resolveVendor($mac),
                    'onAllowList' => self::isOnAllowList($mac),
                    'probes'      => [],
                    'count'       => 0,
                    'lastSeen'    => '',
                ];
            }
            if ($row['ssid'] !== '' && $row['ssid'] !== null) {
                $byMac[$mac]['probes'][] = $row['ssid'];
            }
            $byMac[$mac]['count']   += (int)$row['cnt'];
            if ($row['last_seen'] > $byMac[$mac]['lastSeen']) {
                $byMac[$mac]['lastSeen'] = date('Y-m-d H:i:s', (int)$row['last_seen']);
            }
        }

        // Sort: allow-listed first, then by count desc
        $devices = array_values($byMac);
        usort($devices, fn($a, $b) =>
            ($b['onAllowList'] <=> $a['onAllowList']) ?: ($b['count'] <=> $a['count'])
        );

        return $devices;
    }

    /**
     * Starts a background tshark probe-request capture on the given interface.
     * Probe requests are piped through awk into the SQLite database in real time.
     * The PID is written to PID_FILE so the process can be stopped cleanly.
     *
     * @param string $iface Monitor-mode interface (e.g. wlan0).
     * @return array{ok: bool, pid: ?int, message: string}
     */
    public static function startCapture($iface)
    {
        self::ensureDataDir();
        self::initDb();

        // Validate interface name to prevent injection
        if (!preg_match('/^[a-z0-9_]{1,16}$/', $iface)) {
            return ['ok' => false, 'pid' => null, 'message' => 'Invalid interface name.'];
        }
        if (self::isCaptureRunning()) {
            return ['ok' => false, 'pid' => null, 'message' => 'Capture already running.'];
        }

        $dbPath  = self::DB_PATH;
        $pidFile = self::PID_FILE;

        // tshark outputs CSV: epoch_time,src_mac,ssid
        // awk inserts each row into the SQLite DB via sqlite3 CLI
        $cmd = sprintf(
            'tshark -i %s -f "subtype probereq" -T fields -e frame.time_epoch -e wlan.sa -e wlan_mgt.ssid -E separator=, -l 2>/dev/null'
            . ' | awk -F, \'NF>=2{gsub(/"/,"",$3); system("sqlite3 %s \"INSERT OR IGNORE INTO probes(ts,mac,ssid) VALUES(" $1 ",\\\"" $2 "\\\",\\\"" $3 "\\\")\""  )}\''
            . ' &'
            . ' echo $! > %s',
            escapeshellarg($iface),
            $dbPath,
            $pidFile
        );

        shell_exec("nohup bash -c " . escapeshellarg($cmd) . " >/dev/null 2>&1");
        sleep(1);

        $pid = file_exists($pidFile) ? (int)trim(file_get_contents($pidFile)) : null;

        return ['ok' => true, 'pid' => $pid, 'message' => ''];
    }

    /**
     * @return array{running: bool, pid: ?int, iface: ?string}
     */
    public static function getCaptureStatus()
    {
        $running = self::isCaptureRunning();
        $pid     = $running && file_exists(self::PID_FILE) ? (int)trim(file_get_contents(self::PID_FILE)) : null;

        return ['running' => $running, 'pid' => $pid, 'ifaces' => self::IFACES];
    }

    public static function stopCapture()
    {
        if (file_exists(self::PID_FILE)) {
            $pid = (int)trim(file_get_contents(self::PID_FILE));
            if ($pid > 0) {
                // Kill the tshark+awk pipeline process group
                shell_exec('kill -- -' . $pid . ' 2>/dev/null; kill ' . $pid . ' 2>/dev/null');
            }
            unlink(self::PID_FILE);
        }
        // Also kill any stray tshark probe capture processes
        shell_exec('pkill -f "tshark.*subtype probereq" 2>/dev/null');
    }

    public static function clearProbes()
    {
        if (file_exists(self::DB_PATH)) {
            $db = new \SQLite3(self::DB_PATH);
            $db->exec('DELETE FROM probes');
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private static function isCaptureRunning()
    {
        if (!file_exists(self::PID_FILE)) {
            return false;
        }
        $pid = (int)trim(file_get_contents(self::PID_FILE));

        return $pid > 0 && file_exists('/proc/' . $pid);
    }

    private static function ensureDataDir()
    {
        if (!is_dir(self::DATA_DIR)) {
            mkdir(self::DATA_DIR, 0700, true);
        }
    }

    private static function initDb()
    {
        if (file_exists(self::DB_PATH)) {
            return;
        }
        $db = new \SQLite3(self::DB_PATH);
        $db->exec(
            'CREATE TABLE IF NOT EXISTS probes (
                id   INTEGER PRIMARY KEY AUTOINCREMENT,
                ts   INTEGER NOT NULL,
                mac  TEXT    NOT NULL,
                ssid TEXT    NOT NULL DEFAULT "",
                UNIQUE(ts, mac, ssid)
            );
            CREATE INDEX IF NOT EXISTS idx_mac ON probes(mac);'
        );
    }

    private static function isOnAllowList($mac)
    {
        if (!file_exists(self::ALLOW_DB)) {
            return false;
        }
        $db    = new \SQLite3(self::ALLOW_DB, SQLITE3_OPEN_READONLY);
        $stmt  = $db->prepare('SELECT 1 FROM allow_list WHERE mac = :mac LIMIT 1');
        $stmt->bindValue(':mac', strtolower($mac), SQLITE3_TEXT);
        $res   = $stmt->execute();

        return (bool)$res->fetchArray(SQLITE3_ASSOC);
    }

    private static function loadOuiDatabase()
    {
        static $db = null;
        if ($db !== null) {
            return $db;
        }
        $db  = [];
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
        $db  = self::loadOuiDatabase();
        $oui = strtoupper(substr($mac, 0, 8));

        return $db[$oui] ?? 'Unknown vendor';
    }
}
