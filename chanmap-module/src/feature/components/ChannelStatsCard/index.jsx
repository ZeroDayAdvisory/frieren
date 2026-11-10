/*
 * Project: Frieren Framework
 * Module: Channel Map (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Badge, ListGroup } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';

const isOpen = (enc) => !enc || enc === 'OPN' || enc.toLowerCase() === 'open' || enc === '';

const encBadgeStyle = (enc) => ({
    border: `1px solid ${isOpen(enc) ? '#facc15' : 'rgba(255,255,255,0.15)'}`,
    color: isOpen(enc) ? '#facc15' : 'rgba(255,255,255,0.55)',
    fontSize: '0.6rem',
    background: 'transparent',
});

const ChannelStatsCard = ({ bands, selectedChannel }) => {
    if (!bands || !selectedChannel) {
        return (
            <PanelCard title={'Channel Detail'} icon={'bar-chart-2'}>
                <p className={'text-muted small mb-0'}>
                    Click a channel bar to inspect the APs on it.
                </p>
            </PanelCard>
        );
    }

    let chData = null;
    for (const bandChannels of Object.values(bands)) {
        chData = bandChannels.find((c) => c.channel === selectedChannel);
        if (chData) break;
    }

    if (!chData || chData.apCount === 0) {
        return (
            <PanelCard title={`Channel ${selectedChannel}`} icon={'bar-chart-2'}>
                <p className={'text-muted small mb-0'}>No APs on this channel.</p>
            </PanelCard>
        );
    }

    const openAPs   = chData.aps.filter(ap => isOpen(ap.encryption));
    const secureAPs = chData.aps.filter(ap => !isOpen(ap.encryption));
    const airtimeColor = chData.airtime !== null
        ? (chData.airtime > 70 ? PINK : chData.airtime > 35 ? '#facc15' : BLUE)
        : 'rgba(255,255,255,0.4)';

    return (
        <PanelCard title={`Ch ${selectedChannel} · ${chData.freq} MHz`} icon={'bar-chart-2'}>
            {/* Stats row */}
            <div className={'d-flex gap-3 mb-3 flex-wrap'}>
                <div>
                    <div className={'small text-muted'} style={{ fontSize: '0.7rem' }}>APs</div>
                    <strong style={{ color: PINK, fontSize: '1.4rem', lineHeight: 1 }}>{chData.apCount}</strong>
                </div>
                <div>
                    <div className={'small text-muted'} style={{ fontSize: '0.7rem' }}>Avg Signal</div>
                    <strong style={{ color: BLUE }}>{chData.avgSignal} dBm</strong>
                </div>
                <div>
                    <div className={'small text-muted'} style={{ fontSize: '0.7rem' }}>Range</div>
                    <strong className={'small'}>{chData.minSignal}→{chData.maxSignal}</strong>
                </div>
                <div>
                    <div className={'small text-muted'} style={{ fontSize: '0.7rem' }}>Airtime</div>
                    <strong style={{ color: airtimeColor }}>
                        {chData.airtime !== null ? `${chData.airtime}%` : '—'}
                    </strong>
                </div>
            </div>

            {/* Encryption breakdown */}
            {chData.apCount > 0 && (
                <div className={'mb-3 d-flex gap-3'} style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                        🔒 {secureAPs.length} secured
                    </span>
                    {openAPs.length > 0 && (
                        <span style={{ color: '#facc15' }}>⚠ {openAPs.length} open</span>
                    )}
                </div>
            )}

            {/* AP list sorted by signal */}
            <ListGroup variant={'flush'}>
                {chData.aps
                    .sort((a, b) => b.signal - a.signal)
                    .map((ap) => (
                        <ListGroup.Item key={ap.bssid} className={'px-0 py-1'} style={{ background: 'transparent' }}>
                            <div className={'d-flex justify-content-between align-items-start gap-1'}>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ color: PINK, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {ap.ssid}
                                    </div>
                                    <div style={{ color: BLUE, fontSize: '0.7rem' }}>{ap.bssid}</div>
                                </div>
                                <div className={'d-flex gap-1 align-items-center flex-shrink-0'}>
                                    <Badge bg={'dark'} style={{ fontSize: '0.65rem' }}>{ap.signal} dBm</Badge>
                                    {ap.encryption && (
                                        <span style={encBadgeStyle(ap.encryption)}>
                                            {isOpen(ap.encryption) ? 'OPEN' : ap.encryption}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </ListGroup.Item>
                    ))}
            </ListGroup>
        </PanelCard>
    );
};

export default ChannelStatsCard;
