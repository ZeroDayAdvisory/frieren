<?php
/*
 * Project: Frieren Framework
 * Module: Live Capture (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\livecap;

/**
 * Runs a background tshark process on a monitor interface, writing each
 * decoded packet as a JSON line into a ring-buffer SQLite database (capped
 * at MAX_ROWS rows). The UI polls getPackets() with the last-seen row ID
 * and receives only new frames since that call, giving a smooth live feed
 * without re-transmitting old data.
 *
 * Frame-type filters map to tshark display-filter syntax so the user can
 * scope the feed to only the frame types they care about.
 */
class ModuleOpenWrtHelper
{
    private const DATA_DIR  = '/tmp/frieren-livecap';
    private const DB_PATH   = '/tmp/frieren-livecap/packets.db';
    private const PID_FILE  = '/tmp/frieren-livecap/capture.pid';
    private const META_FILE = '/tmp/frieren-livecap/capture.meta';
    private const OUI_DB    = '/usr/share/frieren/modules/kismet/conf/kismet_manuf.txt.gz';
    private const MAX_ROWS  = 2000;

    private const FILTER_MAP = [
        'all'    => '',
        'deauth' => 'wlan.fc.type_subtype == 12',
        'probe'  => 'wlan.fc.type_subtype == 4 || wlan.fc.type_subtype == 5',
        'eapol'  => 'eapol',
        'beacon' => 'wlan.fc.type_subtype == 8',
        'data'   => 'wlan.fc.type == 2',
        'mgmt'   => 'wlan.fc.type == 0',
    ];

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * @return array{ok: bool, pid: ?int, message: string}
     */
    public static function startCapture($iface, $filter = 'all')
    {
        self::ensureDataDir();
        self::initDb();

        if (!preg_match('/^[a-z0-9_]{1,16}$/', $iface)) {
            return ['ok' => false, 'pid' => null, 'message' => 'Invalid interface.'];
        }
        if (!array_key_exists($filter, self::FILTER_MAP)) {
            $filter = 'all';
        }
        if (self::isRunning()) {
            return ['ok' => false, 'pid' => null, 'message' => 'Capture already running.'];
        }

        $dbPath    = self::DB_PATH;
        $maxRows   = self::MAX_ROWS;
        $pidFile   = self::PID_FILE;
        $metaFile  = self::META_FILE;
        $dfFilter  = self::FILTER_MAP[$filter];
        $dfArg     = $dfFilter !== '' ? " -Y " . escapeshellarg($dfFilter) : '';

        // tshark outputs one JSON object per line (-T ek, record per line)
        // awk extracts the fields we need and inserts into SQLite
        $tsharkCmd = sprintf(
            'tshark -i %s -T ek%s'
            . ' 2>/dev/null'
            . ' | python3 -c \''
            . 'import sys,json,subprocess,time'
            . '\nfor line in sys.stdin:'
            . '\n  try:'
            . '\n    p=json.loads(line)'
            . '\n    l=p.get("layers",{})'
            . '\n    ts=l.get("frame",{}).get("frame_time_epoch",["0"])[0]'
            . '\n    ftype=l.get("wlan",{}).get("wlan_wlan_fc_type_subtype",["?"])[0]'
            . '\n    src=l.get("wlan",{}).get("wlan_wlan_sa",[""])[0] or l.get("eth",{}).get("eth_eth_src",[""])[0]'
            . '\n    dst=l.get("wlan",{}).get("wlan_wlan_da",[""])[0]'
            . '\n    bssid=l.get("wlan",{}).get("wlan_wlan_bssid",[""])[0]'
            . '\n    ssid=l.get("wlan_mgt",{}).get("wlan_mgt_wlan_mgt_ssid",[""])[0] if "wlan_mgt" in l else ""'
            . '\n    proto=list(p.get("layers",{}).keys())[-1] if p.get("layers") else "?"'
            . '\n    subprocess.run(["sqlite3","%s",'
            . '"INSERT INTO packets(ts,ftype,src,dst,bssid,ssid,proto) VALUES("+ts+",\\""+ftype+"\\",\\""+src+"\\",\\""+dst+"\\",\\""+bssid+"\\",\\""+ssid.replace(chr(34),"")+"\\",\\""+proto+"\\")"'
            . '\n    +" ; DELETE FROM packets WHERE id NOT IN (SELECT id FROM packets ORDER BY id DESC LIMIT %d)"'
            . '\n    ],capture_output=True)'
            . '\n  except:pass\' &'
            . '\n echo $! > %s',
            escapeshellarg($iface),
            $dfArg,
            $dbPath,
            $maxRows,
            $pidFile
        );

        // Write meta (iface + filter) for status display
        file_put_contents($metaFile, json_encode(['iface' => $iface, 'filter' => $filter, 'started' => time()]));

        shell_exec("nohup bash -c " . escapeshellarg($tsharkCmd) . " >/dev/null 2>&1");
        sleep(1);

        $pid = file_exists($pidFile) ? (int)trim(file_get_contents($pidFile)) : null;

        return ['ok' => true, 'pid' => $pid, 'message' => ''];
    }

    public static function stopCapture()
    {
        if (file_exists(self::PID_FILE)) {
            $pid = (int)trim(file_get_contents(self::PID_FILE));
            if ($pid > 0) {
                shell_exec('kill -- -' . $pid . ' 2>/dev/null; kill ' . $pid . ' 2>/dev/null');
            }
            unlink(self::PID_FILE);
        }
        shell_exec('pkill -f "tshark -i.*-T ek" 2>/dev/null');
        if (file_exists(self::META_FILE)) {
            unlink(self::META_FILE);
        }
    }

    /**
     * @return array{running: bool, pid: ?int, iface: ?string, filter: ?string, started: ?int, ifaces: array<string>, filters: array<string>}
     */
    public static function getStatus()
    {
        $running = self::isRunning();
        $meta    = file_exists(self::META_FILE) ? json_decode(file_get_contents(self::META_FILE), true) : [];
        $pid     = $running && file_exists(self::PID_FILE) ? (int)trim(file_get_contents(self::PID_FILE)) : null;

        return [
            'running' => $running,
            'pid'     => $pid,
            'iface'   => $meta['iface']    ?? null,
            'filter'  => $meta['filter']   ?? null,
            'started' => $meta['started']  ?? null,
            'ifaces'  => ['wlan0', 'wlan1'],
            'filters' => array_keys(self::FILTER_MAP),
        ];
    }

    /**
     * Returns packets with id > $since, up to $limit, with vendor enrichment.
     *
     * @return array<array{id: int, ts: float, ftype: string, ftypeLabel: string, src: string, srcVendor: string, dst: string, bssid: string, bssidVendor: string, ssid: string, proto: string}>
     */
    public static function getPackets($since, $limit)
    {
        if (!file_exists(self::DB_PATH)) {
            return [];
        }

        $db   = new \SQLite3(self::DB_PATH, SQLITE3_OPEN_READONLY);
        $stmt = $db->prepare(
            'SELECT * FROM packets WHERE id > :since ORDER BY id DESC LIMIT :lim'
        );
        $stmt->bindValue(':since', $since, SQLITE3_INTEGER);
        $stmt->bindValue(':lim',   $limit, SQLITE3_INTEGER);
        $res  = $stmt->execute();

        $packets = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $packets[] = [
                'id'          => (int)$row['id'],
                'ts'          => (float)$row['ts'],
                'tsHuman'     => date('H:i:s', (int)$row['ts']),
                'ftype'       => $row['ftype'],
                'ftypeLabel'  => self::ftypeLabel($row['ftype']),
                'src'         => strtoupper($row['src']),
                'srcVendor'   => $row['src'] ? self::resolveVendor($row['src']) : '',
                'dst'         => strtoupper($row['dst']),
                'bssid'       => strtoupper($row['bssid']),
                'bssidVendor' => $row['bssid'] ? self::resolveVendor($row['bssid']) : '',
                'ssid'        => $row['ssid'],
                'proto'       => $row['proto'],
            ];
        }

        return $packets;
    }

    public static function clearPackets()
    {
        if (file_exists(self::DB_PATH)) {
            $db = new \SQLite3(self::DB_PATH);
            $db->exec('DELETE FROM packets');
        }
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private static function isRunning()
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
            'CREATE TABLE IF NOT EXISTS packets (
                id    INTEGER PRIMARY KEY AUTOINCREMENT,
                ts    REAL    NOT NULL,
                ftype TEXT    NOT NULL DEFAULT "",
                src   TEXT    NOT NULL DEFAULT "",
                dst   TEXT    NOT NULL DEFAULT "",
                bssid TEXT    NOT NULL DEFAULT "",
                ssid  TEXT    NOT NULL DEFAULT "",
                proto TEXT    NOT NULL DEFAULT ""
            );
            CREATE INDEX IF NOT EXISTS idx_ts ON packets(ts);'
        );
    }

    private static function ftypeLabel($ftype)
    {
        $map = [
            '0'  => 'Assoc Req',   '1'  => 'Assoc Resp',
            '2'  => 'Reassoc Req', '3'  => 'Reassoc Resp',
            '4'  => 'Probe Req',   '5'  => 'Probe Resp',
            '8'  => 'Beacon',      '10' => 'Disassoc',
            '11' => 'Auth',        '12' => 'Deauth',
            '24' => 'Data',        '32' => 'EAPOL',
        ];

        return $map[$ftype] ?? "Type $ftype";
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

        return $db[$oui] ?? '';
    }
}
