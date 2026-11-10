/*
 * Project: Frieren Framework
 * Module: Radio Monitor (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Badge, Col, Row } from 'react-bootstrap';
import { PINK, BLUE, TRANSPARENT_CARD_STYLE } from '@module/colors';
import PanelCard from '@src/components/PanelCard';

const ScanStatusCard = ({ status, isFetching, refetch }) => {
    if (!status) return null;

    const campaign = status.campaign ?? {};
    const campaignActive = campaign.state && campaign.state !== 'idle';

    return (
        <PanelCard title={'Scan Status'} icon={'activity'} refetch={refetch} isFetching={isFetching} style={TRANSPARENT_CARD_STYLE}>
            <Row className={'g-3'}>
                <Col md={6}>
                    <div className={'small text-muted mb-1'}>Recon</div>
                    <div className={'d-flex align-items-center gap-2'}>
                        <Badge bg={status.running ? 'success' : 'secondary'}>
                            {status.running ? 'running' : 'stopped'}
                        </Badge>
                        {status.running && (
                            <span className={'small'} style={{ color: BLUE }}>
                                #{status.id} · {status.scan_type}
                                {status.continuous ? ' · continuous' : ` · ${status.duration}s`}
                            </span>
                        )}
                    </div>
                </Col>
                <Col md={6}>
                    <div className={'small text-muted mb-1'}>Handshake capture</div>
                    <div className={'d-flex align-items-center gap-2'}>
                        <Badge bg={status.handshake_running ? 'warning' : 'secondary'}>
                            {status.handshake_running ? 'active' : 'idle'}
                        </Badge>
                        {status.handshake_running && (
                            <span className={'small'} style={{ color: PINK, fontFamily: 'monospace' }}>
                                {status.handshake_bssid} · ch {status.handshake_channel}
                            </span>
                        )}
                    </div>
                </Col>
                {campaignActive && (
                    <Col md={12}>
                        <div className={'small text-muted mb-1'}>Campaign</div>
                        <span className={'small'} style={{ color: BLUE }}>
                            {campaign.state} · {campaign.completed}/{campaign.total} complete
                            {campaign.currentTarget ? ` · targeting ${campaign.currentTarget}` : ''}
                        </span>
                    </Col>
                )}
            </Row>
        </PanelCard>
    );
};

export default ScanStatusCard;
