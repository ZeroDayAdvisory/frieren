/*
 * Project: Frieren Framework
 * Module: Radio Monitor (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Badge, Card } from 'react-bootstrap';
import { PINK, BLUE, TRANSPARENT_CARD_STYLE } from '@module/colors';
import { freqToChannel, band, lifecycleVariant } from '@module/feature/helpers/format';

const Dot = ({ on, label }) => (
    <span className={'d-flex align-items-center gap-1'}>
        <span
            style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                display: 'inline-block',
                background: on ? '#4ade80' : 'rgba(255,255,255,0.25)',
            }}
        />
        <span className={'text-muted'} style={{ fontSize: '0.72rem' }}>{label}</span>
    </span>
);

const AdapterCard = ({ adapter }) => {
    const hasError = adapter.last_action_error && adapter.last_action_error !== 'NONE';

    return (
        <Card className={'h-100'} style={TRANSPARENT_CARD_STYLE}>
            <Card.Body>
                <div className={'d-flex justify-content-between align-items-start mb-2'}>
                    <div>
                        <div style={{ color: PINK, fontSize: '1.3rem', fontWeight: 600, fontFamily: 'monospace' }}>
                            {adapter.name}
                        </div>
                        <div className={'text-muted'} style={{ fontSize: '0.75rem' }}>
                            adapter #{adapter.adapter_id}
                        </div>
                    </div>
                    <Badge bg={lifecycleVariant(adapter.lifecycle_state)}>
                        {adapter.lifecycle_state}
                    </Badge>
                </div>

                <div className={'d-flex align-items-baseline gap-2 mb-1'}>
                    <span style={{ color: BLUE, fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 }}>
                        {adapter.frames_captured.toLocaleString()}
                    </span>
                    <span className={'text-muted'} style={{ fontSize: '0.8rem' }}>frames</span>
                </div>
                <div className={'mb-3'}>
                    <span style={{ color: adapter.fps > 0 ? '#4ade80' : 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                        {adapter.fps.toFixed(1)} fps
                    </span>
                </div>

                <div className={'d-flex justify-content-between mb-3'} style={{ fontSize: '0.82rem' }}>
                    <span className={'text-muted'}>
                        ch {freqToChannel(adapter.frequency_mhz)} · {band(adapter.frequency_mhz)}
                    </span>
                    <span style={{ color: PINK }}>owner: {adapter.owner}</span>
                </div>

                <div className={'d-flex flex-wrap gap-3 mb-2'}>
                    <Dot on={adapter.recon_active} label={'recon'} />
                    <Dot on={adapter.tx_active} label={'tx'} />
                    <Dot on={adapter.handshake_active} label={'handshake'} />
                    <Dot on={adapter.channel_valid} label={'ch valid'} />
                    <Dot on={adapter.hopping_enabled} label={'hopping'} />
                </div>

                {hasError && (
                    <div className={'small'} style={{ color: '#f87171' }}>
                        error: {adapter.last_action_error}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default AdapterCard;
