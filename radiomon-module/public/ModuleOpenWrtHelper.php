<?php
/*
 * Project: Frieren Framework
 * Module: Radio Monitor (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\radiomon;

/**
 * Thin pass-through over `frieren-aura-cli get_status` — the Aura daemon's
 * own live JSON snapshot of every configured adapter (frames_captured,
 * lifecycle_state, channel, owner, errors, ...) plus the current scan/
 * handshake/campaign state. Read-only, no caching: the frontend polls this
 * fast enough that a fresh shell_exec each call is simpler than a cache
 * layer and cheap (get_status itself is a quick local socket round-trip).
 */
class ModuleOpenWrtHelper
{
    private const CLI = 'frieren-aura-cli';

    /**
     * AP-mode radios to surface alongside the Aura monitor adapters.
     * Not managed by Aura (it only knows about its own recon/inject
     * adapters), so these are read straight from iwinfo/sysfs instead.
     */
    private const AP_INTERFACES = [
        'phy0-ap0' => 'Hawthorn New WiFi',
        'phy1-ap0' => 'Frieren LAN',
        'phy19-ap0' => 'Guest WiFi',
    ];

    /**
     * @return array|null The decoded status object (plus an `ap_radios` key
     *                     appended), or null if the daemon isn't reachable.
     */
    public static function getStatus()
    {
        $raw = (string)shell_exec(self::CLI . ' get_status 2>&1');
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return null;
        }

        $decoded['ap_radios'] = self::getApRadios();
        return $decoded;
    }

    private static function getApRadios(): array
    {
        $result = [];
        foreach (self::AP_INTERFACES as $iface => $label) {
            $result[] = self::readApRadio($iface, $label);
        }
        return $result;
    }

    private static function readApRadio(string $iface, string $label): array
    {
        $info = (string)shell_exec('iwinfo ' . escapeshellarg($iface) . ' info 2>&1');
        $assoc = (string)shell_exec('iwinfo ' . escapeshellarg($iface) . ' assoclist 2>&1');

        $up = is_dir('/sys/class/net/' . $iface);
        $ssid = null;
        $channel = null;
        $encryption = null;
        if (preg_match('/ESSID:\s*"([^"]*)"/', $info, $m)) {
            $ssid = $m[1];
        }
        if (preg_match('/Channel:\s*(\d+)/', $info, $m)) {
            $channel = (int)$m[1];
        }
        if (preg_match('/Encryption:\s*(.+)/', $info, $m)) {
            $encryption = trim($m[1]);
        }

        $clients = $up ? substr_count($assoc, 'dBm') : 0;

        $rxBytes = $up ? (int)trim((string)@file_get_contents('/sys/class/net/' . $iface . '/statistics/rx_bytes')) : 0;
        $txBytes = $up ? (int)trim((string)@file_get_contents('/sys/class/net/' . $iface . '/statistics/tx_bytes')) : 0;

        return [
            'iface' => $iface,
            'label' => $label,
            'up' => $up,
            'ssid' => $ssid,
            'channel' => $channel,
            'encryption' => $encryption,
            'clients' => $clients,
            'rx_bytes' => $rxBytes,
            'tx_bytes' => $txBytes,
        ];
    }
}
