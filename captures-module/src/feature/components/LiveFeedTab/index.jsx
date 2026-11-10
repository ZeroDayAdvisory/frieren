/*
 * Project: Frieren Framework
 * Module: Captures (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Col, Row } from 'react-bootstrap';
import CaptureControlCard from '@module/feature/components/CaptureControlCard';
import PacketFeedCard from '@module/feature/components/PacketFeedCard';

const LiveFeedTab = () => (
    <Row className={'g-4'}>
        <Col xs={12}>
            <CaptureControlCard />
        </Col>
        <Col xs={12}>
            <PacketFeedCard />
        </Col>
    </Row>
);

export default LiveFeedTab;
