<?php
/*
 * Project: Frieren Framework
 * Module: Captures (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\captures;

class CapturesController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'getSessions'    => true,
        'getLiveClients' => true,
        'getPcapStats'   => true,
        'deleteSession'  => true,
    ];

    public function getSessions()
    {
        return self::setSuccess(self::setupModuleHelper()::getSessions());
    }

    public function getLiveClients()
    {
        return self::setSuccess(self::setupModuleHelper()::getLiveClients());
    }

    public function getPcapStats()
    {
        $file = trim($this->request['file'] ?? '');
        $result = self::setupModuleHelper()::getPcapStats($file);
        if ($result === null) {
            return self::setError('Invalid or missing capture file.');
        }

        return self::setSuccess($result);
    }

    public function deleteSession()
    {
        $dir = trim($this->request['dir'] ?? '');
        $result = self::setupModuleHelper()::deleteSession($dir);
        if (!$result['ok']) {
            return self::setError($result['message'] !== '' ? $result['message'] : 'Failed to delete session.');
        }

        return self::setSuccess(self::setupModuleHelper()::getSessions());
    }
}
