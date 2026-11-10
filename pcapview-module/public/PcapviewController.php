<?php
/*
 * Project: Frieren Framework
 * Module: PCAP Analysis (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */

namespace frieren\modules\pcapview;

class PcapviewController extends \frieren\core\Controller
{
    public $endpointRoutes = [
        'getPcapList' => true,
        'runFilter'   => true,
    ];

    public function getPcapList()
    {
        return self::setSuccess(self::setupModuleHelper()::getPcapList());
    }

    public function runFilter()
    {
        $file   = trim($this->request['file'] ?? '');
        $filter = (string)($this->request['filter'] ?? '');
        $mode   = trim($this->request['mode'] ?? 'summary');
        $limit  = (int)($this->request['limit'] ?? 500);

        $result = self::setupModuleHelper()::runFilter($file, $filter, $mode, $limit);
        if ($result === null) {
            return self::setError('Invalid capture file or filter.');
        }

        return self::setSuccess($result);
    }
}
