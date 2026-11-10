/*
 * Project: Frieren Framework
 * Module: Tools (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import ProbeTableCard from '@module/feature/components/ProbeTableCard';
import DeviceDetailCard from '@module/feature/components/DeviceDetailCard';

const ProbeTrackerTab = () => {
    const [selectedMac, setSelectedMac] = useState(null);

    return (
        <Row className={'g-4'}>
            <Col md={7}>
                <ProbeTableCard onSelect={setSelectedMac} selectedMac={selectedMac} />
            </Col>
            <Col md={5}>
                <DeviceDetailCard mac={selectedMac} />
            </Col>
        </Row>
    );
};

export default ProbeTrackerTab;
