<?php
/*
 * Project: Frieren Framework
 * Module: Probe Tracker (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\probetracker;

class ProbetrackerController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'getProbes'      => true,
        'startCapture'   => true,
        'stopCapture'    => true,
        'getCaptureStatus' => true,
        'clearProbes'    => true,
    ];

    public function getProbes()
    {
        return self::setSuccess([
            'devices' => self::setupModuleHelper()::getProbeDevices(),
        ]);
    }

    public function startCapture()
    {
        $iface = trim($this->request['iface'] ?? 'wlan0');
        $result = self::setupModuleHelper()::startCapture($iface);

        return $result['ok']
            ? self::setSuccess(['pid' => $result['pid']])
            : self::setError($result['message']);
    }

    public function stopCapture()
    {
        self::setupModuleHelper()::stopCapture();

        return self::setSuccess([]);
    }

    public function getCaptureStatus()
    {
        return self::setSuccess(self::setupModuleHelper()::getCaptureStatus());
    }

    public function clearProbes()
    {
        self::setupModuleHelper()::clearProbes();

        return self::setSuccess(['devices' => []]);
    }
}
