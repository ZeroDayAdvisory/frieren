<?php
/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\macfilter;

/**
 * Thin wrapper around frieren-aura-cli's MAC filter commands. This is the
 * SAME allow-list the Aura daemon uses to gate deauth/injection targets -
 * this module just gives it a dedicated panel UI instead of CLI-only access.
 */
class ModuleOpenWrtHelper
{
    private const CLI = 'frieren-aura-cli';
    private const OUI_DB = '/usr/share/frieren/modules/kismet/conf/kismet_manuf.txt.gz';
    private const DHCP_LEASE_FILES = ['/tmp/dhcp_evil.leases', '/tmp/dhcp.leases'];

    /**
     * Reads the current filter_list output and returns each MAC entry
     * enriched with its OUI vendor name and, when available, the actual
     * hostname the device presented over DHCP (the list also contains SSID
     * filter rules, which this module doesn't manage).
     *
     * @return array<array{mac: string, vendor: string, hostname: ?string}>
     */
    public static function getAllowListEntries()
    {
        $output = shell_exec(self::CLI . ' filter_list 2>/dev/null');
        $entries = [];
        foreach (explode("\n", trim((string)$output)) as $line) {
            $line = trim($line);
            if (strncmp($line, 'mac ', 4) !== 0) {
                continue;
            }
            $mac = strtoupper(trim(substr($line, 4)));
            $entries[] = [
                'mac' => $mac,
                'vendor' => self::resolveVendor($mac),
                'hostname' => self::resolveHostname($mac),
            ];
        }

        return $entries;
    }

    /**
     * Loads Kismet's bundled manuf database into memory once per request
     * (already shipped with this panel - no separate download), so looking
     * up many MACs at once (e.g. a full recon scan) doesn't re-decompress
     * the 40k-line file on every single row.
     *
     * @return array<string, string> OUI prefix => vendor name.
     */
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

    /**
     * Looks up the OUI vendor for a MAC.
     *
     * @param string $mac
     * @return string
     */
    public static function resolveVendor($mac)
    {
        $db = self::loadOuiDatabase();
        $oui = strtoupper(substr($mac, 0, 8));
        return $db[$oui] ?? 'Unknown vendor';
    }

    /**
     * Looks up the hostname a device presented over DHCP, if it ever leased
     * an address on this network (checks the honeypot network first, then
     * the management network).
     *
     * @param string $mac
     * @return string|null
     */
    private static function resolveHostname($mac)
    {
        foreach (self::DHCP_LEASE_FILES as $leaseFile) {
            if (!file_exists($leaseFile)) {
                continue;
            }
            foreach (file($leaseFile) as $line) {
                $fields = preg_split('/\s+/', trim($line));
                if (count($fields) < 4 || strcasecmp($fields[1], $mac) !== 0) {
                    continue;
                }
                $hostname = $fields[3];
                if ($hostname !== '*' && $hostname !== '') {
                    return $hostname;
                }
            }
        }

        return null;
    }

    /**
     * Reads the latest recon scan from Aura's recon.db and enriches each AP
     * with its OUI vendor name - the same data Aura's own Recon screen
     * shows, plus vendor, since Aura is closed-source and this panel can't
     * patch its page directly.
     *
     * @return array{scanId: ?int, aps: array<array{ssid: string, bssid: string, vendor: string, channel: int, signal: int, encryption: string}>}
     */
    public static function getReconResults()
    {
        $dbPath = '/mnt/usb/frieren/aura/recon.db';
        if (!file_exists($dbPath)) {
            return ['scanId' => null, 'aps' => []];
        }

        $db = new \SQLite3($dbPath, SQLITE3_OPEN_READONLY);
        $scanId = $db->querySingle('SELECT MAX(scan_id) FROM aps');
        if ($scanId === null) {
            return ['scanId' => null, 'aps' => []];
        }

        $stmt = $db->prepare(
            'SELECT ssid, bssid, channel, encryption, signal FROM aps WHERE scan_id = :scanId ORDER BY ssid'
        );
        $stmt->bindValue(':scanId', $scanId, SQLITE3_INTEGER);
        $res = $stmt->execute();

        $aps = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $aps[] = [
                'ssid' => $row['ssid'] !== '' && $row['ssid'] !== null ? $row['ssid'] : '(hidden)',
                'bssid' => $row['bssid'],
                'vendor' => self::resolveVendor($row['bssid']),
                'channel' => (int)$row['channel'],
                'signal' => (int)$row['signal'],
                'encryption' => (string)$row['encryption'],
                'clients' => self::getClientsForBssid($db, $row['bssid']),
            ];
        }

        return ['scanId' => (int)$scanId, 'aps' => $aps];
    }

    /**
     * Every distinct client device ever seen associated with a given BSSID
     * (not scoped to one scan - a client's last-seen timestamp is more
     * useful than only showing it if it happened to be caught in the exact
     * latest scan).
     *
     * @param \SQLite3 $db
     * @param string $bssid
     * @return array<array{mac: string, vendor: string, lastSeen: ?string}>
     */
    private static function getClientsForBssid($db, $bssid)
    {
        $stmt = $db->prepare(
            'SELECT mac, MAX(last_seen) AS last_seen FROM clients WHERE bssid = :bssid GROUP BY mac ORDER BY last_seen DESC'
        );
        $stmt->bindValue(':bssid', $bssid, SQLITE3_TEXT);
        $res = $stmt->execute();

        $clients = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $mac = strtoupper($row['mac']);
            $clients[] = [
                'mac' => $mac,
                'vendor' => self::resolveVendor($mac),
                'lastSeen' => $row['last_seen'] ? date('Y-m-d H:i', (int)$row['last_seen']) : null,
            ];
        }

        return $clients;
    }

    /**
     * @param string $mac Already-validated MAC address.
     * @return array{ok: bool, message: string}
     */
    public static function addMac($mac)
    {
        $output = trim((string)shell_exec(self::CLI . ' filter_add_mac ' . escapeshellarg($mac) . ' 2>&1'));
        return ['ok' => true, 'message' => $output];
    }

    /**
     * @param string $mac Already-validated MAC address.
     * @return array{ok: bool, message: string}
     */
    public static function removeMac($mac)
    {
        $output = trim((string)shell_exec(self::CLI . ' filter_del_mac ' . escapeshellarg($mac) . ' 2>&1'));
        return ['ok' => true, 'message' => $output];
    }
}
