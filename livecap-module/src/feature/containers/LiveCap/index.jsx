import { Col, Row } from 'react-bootstrap';
import CaptureControlCard from '@module/feature/components/CaptureControlCard';
import PacketFeedCard from '@module/feature/components/PacketFeedCard';

const LiveCapPage = () => (
    <div className={'my-5'}>
        <h1 className={'mb-3 text-center'}>Live Capture</h1>
        <p className={'mb-4 text-center text-muted'}>
            Real-time packet feed from monitor radios — deauths, probe requests, EAPOL handshakes,
            and more, with per-packet vendor enrichment.
        </p>

        <Row className={'g-4'}>
            <Col xs={12}>
                <CaptureControlCard />
            </Col>
            <Col xs={12}>
                <PacketFeedCard />
            </Col>
        </Row>
    </div>
);

export default LiveCapPage;
