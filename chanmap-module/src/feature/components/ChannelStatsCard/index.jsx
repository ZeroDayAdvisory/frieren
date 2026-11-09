import { Badge, ListGroup } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';

const ChannelStatsCard = ({ bands, selectedChannel }) => {
    if (!bands || !selectedChannel) {
        return (
            <PanelCard title={'Channel Detail'} icon={'bar-chart-2'}>
                <p className={'text-muted mb-0'}>Click a channel bar to see the APs on it.</p>
            </PanelCard>
        );
    }

    // Find the channel across both bands
    let chData = null;
    for (const bandChannels of Object.values(bands)) {
        chData = bandChannels.find((c) => c.channel === selectedChannel);
        if (chData) break;
    }

    if (!chData || chData.apCount === 0) {
        return (
            <PanelCard title={`Channel ${selectedChannel}`} icon={'bar-chart-2'}>
                <p className={'text-muted mb-0'}>No APs detected on this channel.</p>
            </PanelCard>
        );
    }

    return (
        <PanelCard title={`Channel ${selectedChannel} — ${chData.freq} MHz`} icon={'bar-chart-2'}>
            <div className={'d-flex gap-3 mb-3 flex-wrap'}>
                <div>
                    <div className={'small text-muted'}>APs</div>
                    <strong style={{ color: PINK, fontSize: '1.3rem' }}>{chData.apCount}</strong>
                </div>
                <div>
                    <div className={'small text-muted'}>Avg Signal</div>
                    <strong style={{ color: BLUE }}>{chData.avgSignal} dBm</strong>
                </div>
                <div>
                    <div className={'small text-muted'}>Range</div>
                    <strong className={'small'}>{chData.minSignal} → {chData.maxSignal} dBm</strong>
                </div>
                {chData.airtime !== null && (
                    <div>
                        <div className={'small text-muted'}>Airtime Busy</div>
                        <strong style={{ color: chData.airtime > 50 ? PINK : BLUE }}>{chData.airtime}%</strong>
                    </div>
                )}
            </div>

            <ListGroup variant={'flush'}>
                {chData.aps.sort((a, b) => b.signal - a.signal).map((ap) => (
                    <ListGroup.Item key={ap.bssid} className={'px-0 py-1'}>
                        <div className={'d-flex justify-content-between align-items-center'}>
                            <div>
                                <span style={{ color: PINK }}>{ap.ssid}</span>
                                <div className={'small'} style={{ color: BLUE }}>{ap.bssid}</div>
                            </div>
                            <div className={'d-flex gap-2 align-items-center'}>
                                <Badge bg={'dark'}>{ap.signal} dBm</Badge>
                                {ap.encryption && (
                                    <Badge
                                        bg={'outline'}
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: 'rgba(255,255,255,0.6)',
                                            fontSize: '0.65rem',
                                        }}
                                    >
                                        {ap.encryption}
                                    </Badge>
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
