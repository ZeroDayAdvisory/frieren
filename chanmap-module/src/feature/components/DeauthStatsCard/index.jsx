/*
 * Project: Frieren Framework
 * Module: Channel Map (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import useDeauthSnapshotMutation from '@module/feature/hooks/useDeauthSnapshotMutation';
import { PINK, BLUE } from '@module/colors';

const FrameBar = ({ label, count, max, color }) => (
    <div className={'mb-2'}>
        <div className={'d-flex justify-content-between align-items-center mb-1'} style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
            <strong style={{ color }}>{count}</strong>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 3, height: 6 }}>
            <div style={{
                width: max > 0 ? `${Math.min(100, (count / max) * 100)}%` : '0%',
                height: '100%',
                background: color,
                borderRadius: 3,
                transition: 'width 0.4s ease',
            }} />
        </div>
    </div>
);

const IfaceStats = ({ iface, stats }) => {
    const total = stats.deauth + stats.disassoc + stats.probe;
    const max   = Math.max(stats.deauth, stats.disassoc, stats.probe, 1);

    return (
        <div className={'mb-3'}>
            <div className={'small mb-2'} style={{ color: PINK, fontWeight: 600 }}>
                {iface}
                <span className={'text-muted fw-normal ms-2'} style={{ fontSize: '0.7rem' }}>
                    {total} frames / 3 s
                </span>
            </div>
            <FrameBar label={'Deauth'} count={stats.deauth} max={max} color={PINK} />
            <FrameBar label={'Disassoc'} count={stats.disassoc} max={max} color={'#f97316'} />
            <FrameBar label={'Probe Req'} count={stats.probe} max={max} color={BLUE} />
        </div>
    );
};

const DeauthStatsCard = () => {
    const [result, setResult] = useState(null);
    const mutation = useDeauthSnapshotMutation();

    const handleScan = async () => {
        const data = await mutation.mutateAsync();
        setResult(data);
    };

    const ifaces = result?.interfaces ? Object.entries(result.interfaces) : [];
    const hasData = ifaces.length > 0;
    const scanTime = result?.scannedAt
        ? new Date(result.scannedAt).toLocaleTimeString()
        : null;

    return (
        <PanelCard title={'Frame Activity'} icon={'radio'}>
            <p className={'small text-muted mb-3'}>
                3-second passive capture on monitor interfaces. Counts deauth, disassociation,
                and probe request management frames — useful for detecting active attacks or surveying nearby device activity.
            </p>

            <Button
                variant={'outline-secondary'}
                size={'sm'}
                onClick={handleScan}
                disabled={mutation.isPending}
                style={{
                    borderColor: PINK,
                    color: mutation.isPending ? 'rgba(255,255,255,0.5)' : PINK,
                    marginBottom: 16,
                    fontSize: '0.8rem',
                }}
            >
                {mutation.isPending ? (
                    <>
                        <Spinner animation={'border'} size={'sm'} className={'me-2'} />
                        Scanning (3 s)…
                    </>
                ) : (
                    '⚡ Scan Now'
                )}
            </Button>

            {mutation.isError && (
                <div className={'small text-danger mb-2'}>Scan failed — check that wlan0/wlan1 are in monitor mode.</div>
            )}

            {hasData && (
                <>
                    {scanTime && (
                        <div className={'small text-muted mb-3'} style={{ fontSize: '0.7rem' }}>
                            Last scanned at {scanTime}
                        </div>
                    )}
                    {ifaces.map(([iface, stats]) => (
                        <IfaceStats key={iface} iface={iface} stats={stats} />
                    ))}
                </>
            )}

            {result && !hasData && (
                <div className={'small text-muted'}>
                    No monitor interfaces responded. Aura may be using them exclusively.
                </div>
            )}
        </PanelCard>
    );
};

export default DeauthStatsCard;
