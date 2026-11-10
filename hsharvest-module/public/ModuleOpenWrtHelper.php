<?php
/*
 * Project: Frieren Framework
 * Module: Handshake Harvester (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\hsharvest;

/**
 * Scans Aura's handshakes directory for pcap files, uses tshark to detect
 * WPA 4-way handshakes (EAPOL) and PMKID frames, and surfaces ready-to-run
 * hashcat commands for each capture that has crackable material.
 */
class ModuleOpenWrtHelper
{
    private const CAPTURES_DIR = '/mnt/usb/frieren/aura/handshakes';
    private const HASHES_DIR   = '/tmp/frieren-hsharvest';
    private const OUI_DB       = '/usr/share/frieren/modules/kismet/conf/kismet_manuf.txt.gz';

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Returns every .cap/.pcap/.pcapng file in the captures directory with
     * its size, mtime, and a quick EAPOL/PMKID presence flag (fast path: just
     * check for EAPOL frames without full analysis).
     *
     * @return array<array{file: string, size: int, mtime: int, mtimeHuman: string, hasHandshake: bool}>
     */
    public static function listCaptures()
    {
        $dir = self::CAPTURES_DIR;
        if (!is_dir($dir)) {
            return [];
        }

        $files = glob($dir . '/*.{cap,pcap,pcapng}', GLOB_BRACE);
        if (!$files) {
            return [];
        }

        $captures = [];
        foreach ($files as $path) {
            $base = basename($path);
            $stat = stat($path);
            $captures[] = [
                'file'       => $base,
                'size'       => $stat['size'],
                'mtime'      => $stat['mtime'],
                'mtimeHuman' => date('Y-m-d H:i', $stat['mtime']),
                'hasHandshake' => self::quickCheckEapol($path),
            ];
        }

        usort($captures, fn($a, $b) => $b['mtime'] - $a['mtime']);

        return $captures;
    }

    /**
     * Full analysis of a single capture file: extracts unique SSID+BSSID
     * pairs that have EAPOL traffic, detects PMKID frames, and builds the
     * appropriate hashcat command for each crackable target.
     *
     * @param string $filename Basename only — no path traversal allowed.
     * @return array{file: string, targets: array}|null
     */
    public static function analyzeCapture($filename)
    {
        $path = self::safeCapturePath($filename);
        if ($path === null) {
            return null;
        }

        $targets = self::extractTargets($path);

        return [
            'file'    => $filename,
            'targets' => $targets,
        ];
    }

    /**
     * Deletes a capture file from the captures directory.
     *
     * @param string $filename Basename only.
     * @return bool
     */
    public static function deleteCapture($filename)
    {
        $path = self::safeCapturePath($filename);
        if ($path === null) {
            return false;
        }

        return unlink($path);
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Validates a filename and returns its full path, or null if it looks
     * like a path traversal attempt or the file doesn't exist.
     */
    private static function safeCapturePath($filename)
    {
        if (strpos($filename, '/') !== false || strpos($filename, '..') !== false) {
            return null;
        }
        if (!preg_match('/\.(cap|pcap|pcapng)$/i', $filename)) {
            return null;
        }
        $path = self::CAPTURES_DIR . '/' . $filename;

        return file_exists($path) ? $path : null;
    }

    /**
     * Fast check: does this file contain any EAPOL frames at all?
     * Used for the list view badge — cheap, no per-target analysis.
     */
    private static function quickCheckEapol($path)
    {
        $count = (int)trim((string)shell_exec(
            'tshark -r ' . escapeshellarg($path) . ' -Y eapol -c 1 2>/dev/null | wc -l'
        ));

        return $count > 0;
    }

    /**
     * Extracts unique crackable targets from a capture.
     *
     * For each BSSID that has EAPOL traffic we:
     *   1. Identify the SSID from beacon/probe-response frames.
     *   2. Classify whether it's a PMKID-only capture or a full 4-way.
     *   3. Extract the hash using hcxpcapngtool (if available) or cap2hccapx.
     *   4. Build the hashcat command string.
     *
     * @return array<array{ssid: string, bssid: string, vendor: string, type: string, hashcat: string, hashFile: string}>
     */
    private static function extractTargets($path)
    {
        // Collect BSSID+SSID pairs that appear in EAPOL frames
        $eapolBssids = self::getEapolBssids($path);
        if (empty($eapolBssids)) {
            return [];
        }

        self::ensureHashesDir();
        $targets = [];

        foreach ($eapolBssids as $bssid => $ssid) {
            $type     = self::classifyHandshake($path, $bssid);
            $hashFile = self::extractHash($path, $bssid, $type);
            $hashcat  = self::buildHashcatCommand($hashFile, $ssid, $type);

            $targets[] = [
                'ssid'     => $ssid !== '' ? $ssid : '(hidden)',
                'bssid'    => $bssid,
                'vendor'   => self::resolveVendor($bssid),
                'type'     => $type,     // '4-way', 'pmkid', 'partial'
                'hashcat'  => $hashcat,
                'hashFile' => $hashFile,
            ];
        }

        return $targets;
    }

    /**
     * Returns a map of BSSID => SSID for every BSSID that has EAPOL frames
     * in the capture. SSID is resolved from management frames in the same file.
     *
     * @return array<string, string>
     */
    private static function getEapolBssids($path)
    {
        // Pull BSSID from every EAPOL frame (wlan.bssid field)
        $raw = shell_exec(
            'tshark -r ' . escapeshellarg($path) .
            ' -Y eapol -T fields -e wlan.bssid 2>/dev/null'
        );
        if (!$raw) {
            return [];
        }

        $bssids = [];
        foreach (explode("\n", trim($raw)) as $line) {
            $b = strtoupper(trim($line));
            if (preg_match('/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/', $b)) {
                $bssids[$b] = '';
            }
        }

        // Resolve SSID from beacon / probe-response frames
        foreach (array_keys($bssids) as $bssid) {
            $ssid = trim((string)shell_exec(
                'tshark -r ' . escapeshellarg($path) .
                ' -Y ' . escapeshellarg('wlan.bssid == ' . $bssid . ' && (wlan.fc.type_subtype == 8 || wlan.fc.type_subtype == 5)') .
                ' -T fields -e wlan_mgt.ssid -c 1 2>/dev/null'
            ));
            $bssids[$bssid] = $ssid;
        }

        return $bssids;
    }

    /**
     * Determines whether we have a full 4-way handshake, PMKID only, or just
     * a partial capture for a given BSSID.
     *
     * A complete 4-way needs messages 1+2 (or 2+3). We check for EAPOL key
     * message number field — frames with KeyInfo bit 3 set are msg 1 or 3;
     * frames without are msg 2 or 4.
     */
    private static function classifyHandshake($path, $bssid)
    {
        $frames = (int)trim((string)shell_exec(
            'tshark -r ' . escapeshellarg($path) .
            ' -Y ' . escapeshellarg('eapol && wlan.bssid == ' . $bssid) .
            ' -T fields -e eapol.keydes.type 2>/dev/null | wc -l'
        ));

        // Check for PMKID: EAPOL message 1 with PMKID extension (RSN PMKID IE)
        $hasPmkid = (int)trim((string)shell_exec(
            'tshark -r ' . escapeshellarg($path) .
            ' -Y ' . escapeshellarg('eapol && wlan.bssid == ' . $bssid . ' && eapol.keydes.key_len == 0') .
            ' 2>/dev/null | wc -l'
        ));

        if ($frames >= 2) {
            return '4-way';
        }
        if ($hasPmkid > 0) {
            return 'pmkid';
        }

        return 'partial';
    }

    /**
     * Extracts a hash from the capture into a temporary file and returns the
     * path. Uses hcxpcapngtool (best, handles both PMKID and EAPOL) falling
     * back to cap2hccapx for 4-way only.
     *
     * @return string Hash file path (may not exist if extraction failed).
     */
    private static function extractHash($path, $bssid, $type)
    {
        $safeBssid = str_replace(':', '', strtolower($bssid));
        $hashFile  = self::HASHES_DIR . '/' . $safeBssid . '.hash';

        if ($type === 'pmkid' || $type === '4-way') {
            // hcxpcapngtool is preferred — outputs unified hashcat 22000 format
            $hcxAvail = trim((string)shell_exec('which hcxpcapngtool 2>/dev/null'));
            if ($hcxAvail !== '') {
                shell_exec(
                    'hcxpcapngtool -o ' . escapeshellarg($hashFile) .
                    ' --filterlist_ap=' . escapeshellarg(strtolower($bssid)) .
                    ' ' . escapeshellarg($path) . ' 2>/dev/null'
                );

                return $hashFile;
            }

            // Fallback: cap2hccapx for 4-way only
            if ($type === '4-way') {
                $hccapxFile = self::HASHES_DIR . '/' . $safeBssid . '.hccapx';
                shell_exec(
                    'cap2hccapx ' . escapeshellarg($path) .
                    ' ' . escapeshellarg($hccapxFile) .
                    ' ' . escapeshellarg($bssid) . ' 2>/dev/null'
                );

                return $hccapxFile;
            }
        }

        return $hashFile;
    }

    /**
     * Builds the hashcat invocation string to show in the UI.
     * -m 22000 is WPA-PBKDF2-PMKID+EAPOL (unified format from hcxpcapngtool).
     * -m 2500 is the legacy WPA/WPA2 format from cap2hccapx (.hccapx).
     */
    private static function buildHashcatCommand($hashFile, $ssid, $type)
    {
        if ($hashFile === '' || $type === 'partial') {
            return '';
        }

        $ext  = pathinfo($hashFile, PATHINFO_EXTENSION);
        $mode = ($ext === 'hccapx') ? 2500 : 22000;
        $ssidNote = $ssid !== '' && $ssid !== '(hidden)' ? ' # ' . $ssid : '';

        return sprintf(
            'hashcat -m %d -a 0 %s /path/to/wordlist.txt --force%s',
            $mode,
            basename($hashFile),
            $ssidNote
        );
    }

    private static function ensureHashesDir()
    {
        if (!is_dir(self::HASHES_DIR)) {
            mkdir(self::HASHES_DIR, 0700, true);
        }
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
