import { useState } from 'react';
import { Badge, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';

// Signal → heat colour: -90 dBm (cold blue) to -40 dBm (hot pink)
const signalToColor = (signal) => {
    if (signal === 0) return 'rgba(255,255,255,0.08)';
    const pct = Math.max(0, Math.min(1, (signal + 90) / 50)); // -90..-40 → 0..1
    // Interpolate BLUE → PINK
    const r = Math.round(0x7d + pct * (0xff - 0x7d));
    const g = Math.round(0xd3 + pct * (0x2d - 0xd3));
    const b = Math.round(0xfc + pct * (0x78 - 0xfc));
    return `rgb(${r},${g},${b})`;
};

// AP count → bar height % (1–10+ APs)
const countToHeight = (count, maxCount) => {
    if (count === 0 || maxCount === 0) return 4;
    return Math.round(10 + (count / maxCount) * 90);
};

const ChannelBar = ({ ch, onSelect, selected }) => {
    const color  = signalToColor(ch.avgSignal);
    const height = countToHeight(ch.apCount, 20);
    const busy   = ch.airtime !== null ? ch.airtime : null;

    return (
        <OverlayTrigger
            placement={'top'}
            overlay={
                <Tooltip>
                    <strong>Ch {ch.channel}</strong> ({ch.freq} MHz)<br />
                    APs: {ch.apCount}<br />
                    {ch.apCount > 0 && <>Avg: {ch.avgSignal} dBm (min {ch.minSignal} / max {ch.maxSignal})<br /></>}
                    {busy !== null && <>Airtime: {busy}%</>}
                    {busy === null && <span className={'text-muted'}>No airtime data</span>}
                </Tooltip>
            }
        >
            <div
                onClick={() => onSelect(ch.channel === selected ? null : ch.channel)}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: ch.apCount > 0 ? 'pointer' : 'default',
                    minWidth: 28,
                    flex: 1,
                    maxWidth: 40,
                }}
            >
                {/* Airtime overlay line */}
                <div style={{ width: '100%', height: 4, marginBottom: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                    {busy !== null && (
                        <div style={{
                            width: `${busy}%`,
                            height: '100%',
                            background: BLUE,
                            borderRadius: 2,
                            opacity: 0.7,
                        }} />
                    )}
                </div>

                {/* Main bar */}
                <div style={{
                    width: '80%',
                    height: 80,
                    display: 'flex',
                    alignItems: 'flex-end',
                }}>
                    <div style={{
                        width: '100%',
                        height: `${height}%`,
                        background: color,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                        outline: ch.channel === selected ? `2px solid ${PINK}` : 'none',
                    }} />
                </div>

                {/* Channel label */}
                <div style={{
                    fontSize: '0.65rem',
                    color: ch.apCount > 0 ? PINK : 'rgba(255,255,255,0.3)',
                    marginTop: 2,
                    fontWeight: ch.apCount > 0 ? 600 : 400,
                }}>
                    {ch.channel}
                </div>

                {/* AP count badge */}
                {ch.apCount > 0 && (
                    <div style={{ fontSize: '0.6rem', color: BLUE }}>{ch.apCount}</div>
                )}
            </div>
        </OverlayTrigger>
    );
};

const BandChart = ({ label, channels, onSelect, selected }) => (
    <div className={'mb-4'}>
        <div className={'d-flex justify-content-between align-items-center mb-2'}>
            <h6 className={'mb-0'} style={{ color: PINK }}>{label}</h6>
            <span className={'small text-muted'}>
                {channels.filter(c => c.apCount > 0).length} channels occupied ·{' '}
                {channels.reduce((s, c) => s + c.apCount, 0)} APs
            </span>
        </div>
        <div style={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-end',
            padding: '8px 0',
            overflowX: 'auto',
        }}>
            {channels.map((ch) => (
                <ChannelBar key={ch.channel} ch={ch} onSelect={onSelect} selected={selected} />
            ))}
        </div>
        <div className={'d-flex justify-content-between small text-muted mt-1'} style={{ fontSize: '0.65rem' }}>
            <span>■ bar height = AP count</span>
            <span style={{ color: BLUE }}>■ top line = airtime busy%</span>
            <span>■ bar colour = avg signal (blue → pink)</span>
        </div>
    </div>
);

const ChannelHeatmapCard = ({ onSelectChannel, selectedChannel }) => {
    const [band, setBand] = useState('2.4GHz');

    return { band, setBand };
};

export { BandChart };

const ChannelHeatmapCardFull = ({ bands, scanId, isFetching, refetch, onSelectChannel, selectedChannel }) => {
    const [activeBand, setActiveBand] = useState('2.4GHz');
    const channels = bands?.[activeBand] ?? [];

    return (
        <PanelCard
            title={'Channel Utilization'}
            icon={'activity'}
            refetch={refetch}
            isFetching={isFetching}
        >
            {scanId && <div className={'small text-muted mb-3'}>Scan ID #{scanId} · refreshes every 30 s</div>}

            <div className={'d-flex gap-2 mb-3'}>
                {['2.4GHz', '5GHz'].map((b) => (
                    <button
                        key={b}
                        onClick={() => setActiveBand(b)}
                        style={{
                            background: activeBand === b ? PINK : 'rgba(255,255,255,0.08)',
                            color: activeBand === b ? '#fff' : 'rgba(255,255,255,0.6)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 14px',
                            cursor: 'pointer',
                            fontWeight: activeBand === b ? 700 : 400,
                            fontSize: '0.85rem',
                        }}
                    >
                        {b}
                    </button>
                ))}
            </div>

            <BandChart
                label={activeBand}
                channels={channels}
                onSelect={onSelectChannel}
                selected={selectedChannel}
            />
        </PanelCard>
    );
};

export default ChannelHeatmapCardFull;
