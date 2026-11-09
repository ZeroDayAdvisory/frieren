<?php
/*
 * Project: Frieren Framework
 * Module: Live Capture (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\livecap;

class LivecapController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'startCapture'   => true,
        'stopCapture'    => true,
        'getStatus'      => true,
        'getPackets'     => true,
        'clearPackets'   => true,
    ];

    public function startCapture()
    {
        $iface  = trim($this->request['iface']  ?? 'wlan0');
        $filter = trim($this->request['filter'] ?? 'all');
        $result = self::setupModuleHelper()::startCapture($iface, $filter);

        return $result['ok']
            ? self::setSuccess(['pid' => $result['pid']])
            : self::setError($result['message']);
    }

    public function stopCapture()
    {
        self::setupModuleHelper()::stopCapture();

        return self::setSuccess([]);
    }

    public function getStatus()
    {
        return self::setSuccess(self::setupModuleHelper()::getStatus());
    }

    public function getPackets()
    {
        $since  = (int)($this->request['since']  ?? 0);
        $limit  = min((int)($this->request['limit'] ?? 100), 500);

        return self::setSuccess([
            'packets' => self::setupModuleHelper()::getPackets($since, $limit),
        ]);
    }

    public function clearPackets()
    {
        self::setupModuleHelper()::clearPackets();

        return self::setSuccess([]);
    }
}
