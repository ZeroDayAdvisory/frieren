/*
 * Project: Frieren Framework
 * Module: Channel Map (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState, useMemo } from 'react';
import { OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';

// Non-overlapping triplet for 2.4 GHz
const BEST_24 = new Set([1, 6, 11]);

// Signal → heat color: -90 (cold blue) → -40 (hot pink)
const signalToColor = (signal) => {
    if (signal === 0) return 'rgba(255,255,255,0.08)';
    const pct = Math.max(0, Math.min(1, (signal + 90) / 50));
    const r = Math.round(0x7d + pct * (0xff - 0x7d));
    const g = Math.round(0xd3 + pct * (0x2d - 0xd3));
    const b = Math.round(0xfc + pct * (0x78 - 0xfc));
    return `rgb(${r},${g},${b})`;
};

// Congestion: 0–100 score based on AP count + airtime
const congestionScore = (ch) => {
    const apScore = Math.min(ch.apCount / 8, 1) * 60;
    const airScore = ch.airtime !== null ? Math.min(ch.airtime / 100, 1) * 40 : 0;
    return Math.round(apScore + airScore);
};

const congestionLabel = (score) => {
    if (score >= 65) return { text: 'High', color: PINK };
    if (score >= 30) return { text: 'Med', color: '#facc15' };
    return { text: 'Low', color: '#4ade80' };
};

const ChannelBar = ({ ch, onSelect, selected, maxCount, is24 }) => {
    const heightPct = maxCount > 0 ? Math.round(10 + (ch.apCount / maxCount) * 90) : 4;
    const color     = signalToColor(ch.avgSignal);
    const score     = congestionScore(ch);
    const cLabel    = congestionLabel(score);
    const isBest    = is24 && BEST_24.has(ch.channel);
    const isSelected = ch.channel === selected;
    const openCount = ch.aps.filter(ap => !ap.encryption || ap.encryption === 'OPN' || ap.encryption === 'Open').length;

    const tooltipContent = (
        <Tooltip>
            <div style={{ textAlign: 'left', fontSize: '0.8rem' }}>
                <strong style={{ color: PINK }}>Ch {ch.channel}</strong>
                {' '}({ch.freq} MHz)
                {isBest && <span style={{ color: '#4ade80' }}> ★ recommended</span>}
                <br />
                APs: {ch.apCount}
                {openCount > 0 && <span style={{ color: '#facc15' }}> ({openCount} open)</span>}
                <br />
                Signal: {ch.avgSignal} dBm (min {ch.minSignal} / max {ch.maxSignal})
                <br />
                Airtime: {ch.airtime !== null ? `${ch.airtime}%` : 'n/a'}
                <br />
                Congestion: <span style={{ color: cLabel.color }}>{cLabel.text} ({score})</span>
                {ch.aps.length > 0 && (
                    <>
                        <hr style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '4px 0' }} />
                        {ch.aps.slice(0, 4).map(ap => (
                            <div key={ap.bssid} style={{ color: BLUE, fontSize: '0.75rem' }}>
                                {ap.ssid}
                            </div>
                        ))}
                        {ch.aps.length > 4 && (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                                +{ch.aps.length - 4} more
                            </div>
                        )}
                    </>
                )}
            </div>
        </Tooltip>
    );

    return (
        <OverlayTrigger placement={'top'} overlay={tooltipContent}>
            <div
                onClick={() => onSelect(isSelected ? null : ch.channel)}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: ch.apCount > 0 ? 'pointer' : 'default',
                    minWidth: 24,
                    flex: 1,
                    maxWidth: is24 ? 44 : 36,
                    paddingTop: 2,
                    // Highlight best channels for 2.4 GHz
                    background: isBest ? 'rgba(74,222,128,0.04)' : 'transparent',
                    borderRadius: 4,
                    borderTop: isBest ? '2px solid rgba(74,222,128,0.4)' : '2px solid transparent',
                }}
            >
                {/* Airtime bar */}
                <div style={{ width: '100%', height: 3, marginBottom: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                    {ch.airtime !== null && (
                        <div style={{ width: `${ch.airtime}%`, height: '100%', background: BLUE, borderRadius: 2, opacity: 0.7 }} />
                    )}
                </div>

                {/* Main bar */}
                <div style={{ width: '82%', height: is24 ? 72 : 56, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: color,
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.25s ease',
                        outline: isSelected ? `2px solid ${PINK}` : 'none',
                        outlineOffset: 1,
                        position: 'relative',
                    }}>
                        {/* Open AP indicator */}
                        {openCount > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: -5,
                                right: -3,
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#facc15',
                            }} />
                        )}
                    </div>
                </div>

                {/* Channel number */}
                <div style={{
                    fontSize: '0.6rem',
                    color: ch.apCount > 0 ? (isBest ? '#4ade80' : PINK) : 'rgba(255,255,255,0.25)',
                    marginTop: 2,
                    fontWeight: ch.apCount > 0 ? 600 : 400,
                    lineHeight: 1,
                }}>
                    {ch.channel}
                </div>

                {/* AP count */}
                {ch.apCount > 0 && (
                    <div style={{ fontSize: '0.55rem', color: BLUE, lineHeight: 1 }}>{ch.apCount}</div>
                )}
            </div>
        </OverlayTrigger>
    );
};

const BandSection = ({ label, channels, is24, onSelect, selected }) => {
    const occupied = channels.filter(c => c.apCount > 0);
    const totalAPs = channels.reduce((s, c) => s + c.apCount, 0);
    const maxCount = Math.max(...channels.map(c => c.apCount), 1);
    const avgCongestion = occupied.length > 0
        ? Math.round(occupied.reduce((s, c) => s + congestionScore(c), 0) / occupied.length)
        : 0;
    const cl = congestionLabel(avgCongestion);

    // Best recommendation: least-congested best channel (1,6,11 for 2.4 / any for 5)
    const bestCh = useMemo(() => {
        const candidates = is24
            ? channels.filter(c => BEST_24.has(c.channel))
            : channels;
        return candidates.reduce((best, c) => {
            const s = congestionScore(c);
            return s < congestionScore(best) ? c : best;
        }, candidates[0] ?? null);
    }, [channels, is24]);

    return (
        <div className={'mb-4'}>
            {/* Band header */}
            <div className={'d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1'}>
                <div className={'d-flex align-items-center gap-2'}>
                    <h6 className={'mb-0'} style={{ color: PINK }}>{label}</h6>
                    <span className={'small text-muted'}>
                        {occupied.length}/{channels.length} occupied · {totalAPs} APs
                    </span>
                </div>
                <div className={'d-flex align-items-center gap-2'}>
                    {occupied.length > 0 && (
                        <span style={{ fontSize: '0.75rem', color: cl.color }}>
                            avg congestion: {cl.text}
                        </span>
                    )}
                    {bestCh && bestCh.apCount < 4 && (
                        <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                            ★ ch {bestCh.channel} recommended
                        </span>
                    )}
                </div>
            </div>

            {/* Legend for 2.4 GHz */}
            {is24 && (
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: 6, display: 'flex', gap: 12 }}>
                    <span style={{ color: 'rgba(74,222,128,0.6)' }}>★ 1/6/11 non-overlapping</span>
                    <span style={{ color: '#facc15' }}>● open network</span>
                    <span style={{ color: BLUE }}>━ airtime%</span>
                </div>
            )}

            {/* Bar chart */}
            <div style={{
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
                padding: '4px 0 2px',
                overflowX: 'auto',
            }}>
                {channels.map((ch) => (
                    <ChannelBar
                        key={ch.channel}
                        ch={ch}
                        is24={is24}
                        onSelect={onSelect}
                        selected={selected}
                        maxCount={maxCount}
                    />
                ))}
            </div>

            {/* Color scale legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                <span style={{ color: BLUE }}>weak (-90 dBm)</span>
                <span>bar color = avg signal strength</span>
                <span style={{ color: PINK }}>strong (-40 dBm)</span>
            </div>
        </div>
    );
};

const ChannelHeatmapCardFull = ({ bands, scanId, isFetching, refetch, onSelectChannel, selectedChannel }) => (
    <PanelCard
        title={'Channel Utilization'}
        icon={'activity'}
        refetch={refetch}
        isFetching={isFetching}
    >
        {scanId && (
            <div className={'small text-muted mb-3'}>
                Scan #{scanId} · refreshes every 30 s
            </div>
        )}

        <BandSection
            label={'2.4 GHz'}
            channels={bands?.['2.4GHz'] ?? []}
            is24={true}
            onSelect={onSelectChannel}
            selected={selectedChannel}
        />

        <BandSection
            label={'5 GHz'}
            channels={bands?.['5GHz'] ?? []}
            is24={false}
            onSelect={onSelectChannel}
            selected={selectedChannel}
        />
    </PanelCard>
);

export default ChannelHeatmapCardFull;
