<?php
/*
 * Project: Frieren Framework
 * Module: Channel Map (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\chanmap;

/**
 * Combines Aura's recon.db AP/signal data with `iw survey dump` airtime
 * statistics to produce a per-channel utilization picture for 2.4 GHz and
 * 5 GHz. Each channel bucket contains: AP count, avg/min/max signal,
 * channel width distribution, and airtime busy% from the survey.
 */
class ModuleOpenWrtHelper
{
    private const RECON_DB = '/mnt/usb/frieren/aura/recon.db';

    // Monitor interfaces that carry airtime survey data
    private const SURVEY_IFACES  = ['wlan0', 'wlan1'];
    private const MONITOR_IFACES = ['wlan0', 'wlan1'];

    // 2.4 GHz channels 1–14, 5 GHz common channels
    private const CHANNELS_24  = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    private const CHANNELS_5   = [
        36, 40, 44, 48, 52, 56, 60, 64,
        100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144,
        149, 153, 157, 161, 165,
    ];

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Returns channel utilization data for both bands.
     *
     * @return array{
     *   scanId: ?int,
     *   bands: array{
     *     '2.4GHz': array<array{channel: int, apCount: int, avgSignal: int, minSignal: int, maxSignal: int, widths: array<string,int>, airtime: ?float, aps: array}>,
     *     '5GHz':   array<array{...}>
     *   }
     * }
     */
    public static function getChannelData()
    {
        $apsByChannel  = self::getApsFromRecon();
        $airtimeByFreq = self::getSurveyAirtime();

        $bands = [
            '2.4GHz' => self::buildBand(self::CHANNELS_24, $apsByChannel, $airtimeByFreq, '2.4'),
            '5GHz'   => self::buildBand(self::CHANNELS_5,  $apsByChannel, $airtimeByFreq, '5'),
        ];

        $scanId = null;
        if (file_exists(self::RECON_DB)) {
            $db     = new \SQLite3(self::RECON_DB, SQLITE3_OPEN_READONLY);
            $scanId = (int)$db->querySingle('SELECT MAX(scan_id) FROM aps');
        }

        return ['scanId' => $scanId, 'bands' => $bands];
    }

    /**
     * Runs a 3-second passive tcpdump sweep on each monitor interface and
     * returns management frame counts (deauth, disassoc, probe request) so
     * the frontend can overlay frame activity on the channel chart.
     *
     * @return array{interfaces: array<string, array{deauth: int, disassoc: int, probe: int}>, scannedAt: string}
     */
    public static function getDeauthSnapshot()
    {
        $results = [];

        foreach (self::MONITOR_IFACES as $iface) {
            // Check the interface exists before wasting 3 s
            $check = trim((string)shell_exec('ip link show ' . escapeshellarg($iface) . ' 2>/dev/null'));
            if ($check === '') {
                continue;
            }

            $raw = (string)shell_exec(
                'timeout 3 tcpdump -i ' . escapeshellarg($iface) .
                ' -v --immediate-mode -c 1000 "type mgt" 2>/dev/null'
            );

            if ($raw === '') {
                continue;
            }

            $results[$iface] = [
                'deauth'  => substr_count($raw, 'Deauthentication'),
                'disassoc' => substr_count($raw, 'Disassociation'),
                'probe'   => substr_count($raw, 'Probe Request'),
            ];
        }

        return ['interfaces' => $results, 'scannedAt' => date('c')];
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    /**
     * Reads all APs from the latest Aura recon scan and groups them by channel.
     *
     * @return array<int, array<array{ssid: string, bssid: string, signal: int, encryption: string, width: string}>>
     */
    private static function getApsFromRecon()
    {
        if (!file_exists(self::RECON_DB)) {
            return [];
        }

        $db     = new \SQLite3(self::RECON_DB, SQLITE3_OPEN_READONLY);
        $scanId = $db->querySingle('SELECT MAX(scan_id) FROM aps');
        if (!$scanId) {
            return [];
        }

        $stmt = $db->prepare(
            'SELECT ssid, bssid, channel, signal, encryption FROM aps WHERE scan_id = :sid'
        );
        $stmt->bindValue(':sid', $scanId, SQLITE3_INTEGER);
        $res = $stmt->execute();

        $byChannel = [];
        while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
            $ch = (int)$row['channel'];
            if (!isset($byChannel[$ch])) {
                $byChannel[$ch] = [];
            }
            $byChannel[$ch][] = [
                'ssid'       => $row['ssid'] !== '' ? $row['ssid'] : '(hidden)',
                'bssid'      => $row['bssid'],
                'signal'     => (int)$row['signal'],
                'encryption' => (string)$row['encryption'],
            ];
        }

        return $byChannel;
    }

    /**
     * Runs `iw dev <iface> survey dump` on each monitor interface and parses
     * the busy/active time fields to produce a channel-frequency → busy% map.
     *
     * survey dump output per frequency block:
     *   frequency:            2412 MHz
     *   noise:                -95 dBm
     *   channel active time:  12345 ms
     *   channel busy time:    4567 ms
     *
     * @return array<int, float>  freq (MHz) => busy percentage (0–100)
     */
    private static function getSurveyAirtime()
    {
        $airtime = [];

        foreach (self::SURVEY_IFACES as $iface) {
            $raw = shell_exec('iw dev ' . escapeshellarg($iface) . ' survey dump 2>/dev/null');
            if (!$raw) {
                continue;
            }

            $freq   = null;
            $active = null;
            $busy   = null;

            foreach (explode("\n", $raw) as $line) {
                $line = trim($line);
                if (preg_match('/^frequency:\s+(\d+)\s+MHz/', $line, $m)) {
                    // New block — save previous if complete
                    if ($freq !== null && $active > 0 && $busy !== null) {
                        $airtime[$freq] = round($busy / $active * 100, 1);
                    }
                    $freq   = (int)$m[1];
                    $active = null;
                    $busy   = null;
                } elseif (preg_match('/^channel active time:\s+(\d+)\s+ms/', $line, $m)) {
                    $active = (int)$m[1];
                } elseif (preg_match('/^channel busy time:\s+(\d+)\s+ms/', $line, $m)) {
                    $busy = (int)$m[1];
                }
            }
            // Save last block
            if ($freq !== null && $active > 0 && $busy !== null) {
                $airtime[$freq] = round($busy / $active * 100, 1);
            }
        }

        return $airtime;
    }

    /**
     * Converts a channel number to its centre frequency in MHz.
     * Used to correlate iw survey data (in MHz) with Aura channel numbers.
     */
    private static function chanToFreq($ch)
    {
        if ($ch >= 1 && $ch <= 13) {
            return 2407 + $ch * 5;
        }
        if ($ch === 14) {
            return 2484;
        }
        if ($ch >= 36) {
            return 5000 + $ch * 5;
        }

        return null;
    }

    /**
     * Builds a full channel list for one band, merging AP recon data with
     * airtime survey data. Channels with no APs and no survey data are still
     * included in the response (apCount = 0) so the frontend can render
     * an empty bar.
     */
    private static function buildBand($channels, $apsByChannel, $airtimeByFreq, $band)
    {
        $result = [];
        foreach ($channels as $ch) {
            $aps     = $apsByChannel[$ch] ?? [];
            $signals = array_column($aps, 'signal');
            $freq    = self::chanToFreq($ch);
            $airtime = ($freq !== null && isset($airtimeByFreq[$freq]))
                ? $airtimeByFreq[$freq]
                : null;

            $result[] = [
                'channel'    => $ch,
                'freq'       => $freq,
                'apCount'    => count($aps),
                'avgSignal'  => count($signals) > 0 ? (int)round(array_sum($signals) / count($signals)) : 0,
                'minSignal'  => count($signals) > 0 ? min($signals) : 0,
                'maxSignal'  => count($signals) > 0 ? max($signals) : 0,
                'airtime'    => $airtime,
                'aps'        => $aps,
            ];
        }

        return $result;
    }
}
