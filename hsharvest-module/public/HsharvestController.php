<?php
/*
 * Project: Frieren Framework
 * Module: Handshake Harvester (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\hsharvest;

class HsharvestController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'listCaptures'   => true,
        'analyzeCapture' => true,
        'deleteCapture'  => true,
    ];

    public function listCaptures()
    {
        return self::setSuccess([
            'captures' => self::setupModuleHelper()::listCaptures(),
        ]);
    }

    public function analyzeCapture()
    {
        $file = trim($this->request['file'] ?? '');
        if ($file === '') {
            return self::setError('No filename provided.');
        }
        $result = self::setupModuleHelper()::analyzeCapture($file);
        if ($result === null) {
            return self::setError('File not found or not a valid capture.');
        }

        return self::setSuccess($result);
    }

    public function deleteCapture()
    {
        $file = trim($this->request['file'] ?? '');
        if ($file === '') {
            return self::setError('No filename provided.');
        }
        $ok = self::setupModuleHelper()::deleteCapture($file);

        return $ok
            ? self::setSuccess(['captures' => self::setupModuleHelper()::listCaptures()])
            : self::setError('Could not delete file.');
    }
}
