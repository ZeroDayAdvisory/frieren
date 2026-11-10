<?php
/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\theme;

class ThemeController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'getTheme'    => true,
        'setTheme'    => true,
        'resetTheme'  => true,
        'uploadImage' => true,
    ];

    public function getTheme()
    {
        return self::setSuccess([
            'theme' => self::setupModuleHelper()::getTheme(),
        ]);
    }

    public function setTheme()
    {
        $raw = $this->request['theme'] ?? null;
        if (!is_array($raw)) {
            return self::setError('Invalid theme payload.');
        }

        $theme = self::setupModuleHelper()::setTheme($raw);
        return self::setSuccess(['theme' => $theme]);
    }

    public function resetTheme()
    {
        $theme = self::setupModuleHelper()::resetTheme();
        return self::setSuccess(['theme' => $theme]);
    }

    public function uploadImage()
    {
        $kind    = $this->request['kind'] ?? '';
        $dataUri = $this->request['dataUri'] ?? '';

        $result = self::setupModuleHelper()::uploadImage($kind, $dataUri);
        if (!$result['ok']) {
            return self::setError($result['message'] !== '' ? $result['message'] : 'Upload failed.');
        }

        return self::setSuccess(['url' => $result['url']]);
    }
}
