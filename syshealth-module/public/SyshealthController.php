<?php
/*
 * Project: Frieren Framework
 * Module: System Health (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\syshealth;

class SyshealthController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'getHealth' => true,
    ];

    public function getHealth()
    {
        return self::setSuccess(self::setupModuleHelper()::getHealth());
    }
}
