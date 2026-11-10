<?php
/*
 * Project: Frieren Framework
 * Module: Radio Monitor (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\radiomon;

class RadiomonController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'getStatus' => true,
    ];

    public function getStatus()
    {
        $status = self::setupModuleHelper()::getStatus();
        if ($status === null) {
            return self::setError('Could not reach the Aura daemon.');
        }
        return self::setSuccess($status);
    }
}
