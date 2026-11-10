<?php
/*
 * Project: Frieren Framework
 * Module: Channel Map (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\chanmap;

class ChanmapController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'getChannelData'    => true,
        'getDeauthSnapshot' => true,
    ];

    public function getChannelData()
    {
        return self::setSuccess(self::setupModuleHelper()::getChannelData());
    }

    public function getDeauthSnapshot()
    {
        return self::setSuccess(self::setupModuleHelper()::getDeauthSnapshot());
    }
}
