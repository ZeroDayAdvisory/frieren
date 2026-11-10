/*
 * Project: Frieren Framework
 * Module: Radio Monitor (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Badge, Card } from 'react-bootstrap';
import { PINK, BLUE, TRANSPARENT_CARD_STYLE } from '@module/colors';
import { formatBps } from '@module/feature/helpers/format';

const ApRadioCard = ({ radio }) => (
    <Card className={'h-100'} style={TRANSPARENT_CARD_STYLE}>
        <Card.Body>
            <div className={'d-flex justify-content-between align-items-start mb-2'}>
                <div>
                    <div style={{ color: PINK, fontSize: '1.3rem', fontWeight: 600 }}>
                        {radio.ssid ?? radio.label}
                    </div>
                    <div className={'text-muted'} style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {radio.iface}
                    </div>
                </div>
                <Badge bg={radio.up ? 'success' : 'secondary'}>
                    {radio.up ? 'UP' : 'DOWN'}
                </Badge>
            </div>

            <div className={'d-flex align-items-baseline gap-2 mb-1'}>
                <span style={{ color: BLUE, fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1 }}>
                    {radio.clients}
                </span>
                <span className={'text-muted'} style={{ fontSize: '0.8rem' }}>
                    client{radio.clients === 1 ? '' : 's'}
                </span>
            </div>

            <div className={'d-flex gap-3 mb-3'} style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>
                <span style={{ color: '#4ade80' }}>&darr; {formatBps(radio.rxBps)}</span>
                <span style={{ color: '#facc15' }}>&uarr; {formatBps(radio.txBps)}</span>
            </div>

            <div className={'d-flex justify-content-between'} style={{ fontSize: '0.82rem' }}>
                <span className={'text-muted'}>
                    ch {radio.channel ?? '—'}
                </span>
                <span style={{ color: radio.encryption === 'none' ? '#f87171' : PINK }}>
                    {radio.encryption === 'none' ? 'open / no password' : radio.encryption}
                </span>
            </div>
        </Card.Body>
    </Card>
);

export default ApRadioCard;
