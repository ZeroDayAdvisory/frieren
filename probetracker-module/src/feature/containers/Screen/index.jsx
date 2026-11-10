import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import ProbeTableCard from '@module/feature/components/ProbeTableCard';
import DeviceDetailCard from '@module/feature/components/DeviceDetailCard';

const ProbeTrackerPage = () => {
    const [selectedMac, setSelectedMac] = useState(null);

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>Probe Tracker</h1>
            <p className={'mb-4 text-center text-muted'}>
                Live feed of devices broadcasting probe requests — the SSIDs they&apos;re hunting, vendor-enriched,
                correlated against the allow-list.
            </p>

            <Row className={'g-4'}>
                <Col md={7}>
                    <ProbeTableCard onSelect={setSelectedMac} selectedMac={selectedMac} />
                </Col>
                <Col md={5}>
                    <DeviceDetailCard mac={selectedMac} />
                </Col>
            </Row>
        </div>
    );
};

export default ProbeTrackerPage;
