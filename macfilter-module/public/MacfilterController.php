<?php
/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\macfilter;

class MacfilterController extends \frieren\core\Controller
{
    private const MAC_REGEX = '/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/';

    public $endpointRoutes = [
        'getList' => true,
        'addMac' => true,
        'removeMac' => true,
        'getReconResults' => true,
        'getMitmState' => true,
        'setMitmState' => true,
    ];

    public function getList()
    {
        return self::setSuccess([
            'entries' => self::setupModuleHelper()::getAllowListEntries(),
        ]);
    }

    public function getReconResults()
    {
        return self::setSuccess(self::setupModuleHelper()::getReconResults());
    }

    public function addMac()
    {
        $mac = trim($this->request['mac'] ?? '');
        if (!preg_match(self::MAC_REGEX, $mac)) {
            return self::setError('Invalid MAC address.');
        }

        $result = self::setupModuleHelper()::addMac($mac);
        if (!$result['ok']) {
            return self::setError($result['message'] !== '' ? $result['message'] : 'Failed to add MAC.');
        }

        return self::setSuccess([
            'entries' => self::setupModuleHelper()::getAllowListEntries(),
        ]);
    }

    public function removeMac()
    {
        $mac = trim($this->request['mac'] ?? '');
        if (!preg_match(self::MAC_REGEX, $mac)) {
            return self::setError('Invalid MAC address.');
        }

        $result = self::setupModuleHelper()::removeMac($mac);
        if (!$result['ok']) {
            return self::setError($result['message'] !== '' ? $result['message'] : 'Failed to remove MAC.');
        }

        return self::setSuccess([
            'entries' => self::setupModuleHelper()::getAllowListEntries(),
        ]);
    }

    public function getMitmState()
    {
        return self::setSuccess([
            'active' => self::setupModuleHelper()::getMitmActive(),
        ]);
    }

    public function setMitmState()
    {
        $active = !empty($this->request['active']);
        self::setupModuleHelper()::setMitmActive($active);
        return self::setSuccess([
            'active' => self::setupModuleHelper()::getMitmActive(),
        ]);
    }
}
