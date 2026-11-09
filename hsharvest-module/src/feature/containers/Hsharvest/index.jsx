import { useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import CaptureListCard from '@module/feature/components/CaptureListCard';
import HandshakeDetailCard from '@module/feature/components/HandshakeDetailCard';

const HsharvestPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>Handshake Harvester</h1>
            <p className={'mb-4 text-center text-muted'}>
                Scan capture files for WPA handshakes and PMKID hashes. Ready-to-run hashcat commands, one click away.
            </p>

            <Row className={'g-4'}>
                <Col md={5}>
                    <CaptureListCard onSelect={setSelectedFile} selectedFile={selectedFile} />
                </Col>
                <Col md={7}>
                    <HandshakeDetailCard file={selectedFile} />
                </Col>
            </Row>
        </div>
    );
};

export default HsharvestPage;
