import { useEffect, useRef, useState } from 'react';
import { Badge, Form, Table } from 'react-bootstrap';
import { useQueryClient } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import PanelCard from '@src/components/PanelCard';
import useLivecapStatusQuery from '@module/feature/hooks/useLivecapStatusQuery';
import { LIVECAP_GET_PACKETS } from '@module/feature/helpers/queryKeys.js';
import { PINK, BLUE } from '@module/colors';

const FTYPE_COLORS = {
    'Deauth':     '#ff4444',
    'EAPOL':      PINK,
    'Probe Req':  BLUE,
    'Probe Resp': '#93c5fd',
    'Auth':       '#a78bfa',
    'Disassoc':   '#fb923c',
    'Beacon':     'rgba(255,255,255,0.3)',
    'Data':       'rgba(255,255,255,0.5)',
};

const ftypeColor = (label) => FTYPE_COLORS[label] ?? 'rgba(255,255,255,0.4)';

const PacketFeedCard = () => {
    const { data: status } = useLivecapStatusQuery();
    const [packets, setPackets] = useState([]);
    const [filter,  setFilter]  = useState('');
    const [paused,  setPaused]  = useState(false);
    const lastIdRef = useRef(0);
    const tableRef  = useRef(null);
    const running   = status?.running ?? false;

    useEffect(() => {
        if (!running || paused) return;

        const poll = async () => {
            try {
                const res = await fetchPost({
                    module: 'livecap',
                    action: 'getPackets',
                    since: lastIdRef.current,
                    limit: 100,
                });
                const newPkts = res?.packets ?? [];
                if (newPkts.length > 0) {
                    // Backend returns newest-first; reverse so feed is oldest-at-top
                    const ordered = [...newPkts].reverse();
                    lastIdRef.current = newPkts[0].id;
                    setPackets((prev) => {
                        const combined = [...prev, ...ordered];
                        return combined.slice(-2000); // keep at most 2000 in memory
                    });
                }
            } catch {
                // Swallow network errors during polling
            }
        };

        poll();
        const timer = setInterval(poll, 2000);

        return () => clearInterval(timer);
    }, [running, paused]);

    // Auto-scroll when not paused
    useEffect(() => {
        if (!paused && tableRef.current) {
            tableRef.current.scrollTop = tableRef.current.scrollHeight;
        }
    }, [packets, paused]);

    const displayed = filter
        ? packets.filter((p) => {
            const q = filter.toLowerCase();
            return (
                p.ftypeLabel.toLowerCase().includes(q) ||
                p.src.toLowerCase().includes(q) ||
                p.bssid.toLowerCase().includes(q) ||
                p.ssid.toLowerCase().includes(q) ||
                p.srcVendor.toLowerCase().includes(q) ||
                p.bssidVendor.toLowerCase().includes(q)
            );
        })
        : packets;

    return (
        <PanelCard
            title={`Packet Feed (${packets.length.toLocaleString()} frames)`}
            icon={'terminal'}
        >
            <div className={'d-flex gap-2 mb-2 align-items-center flex-wrap'}>
                <Form.Control
                    size={'sm'}
                    placeholder={'Filter by type, MAC, SSID, vendor…'}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ maxWidth: 280 }}
                />
                <button
                    onClick={() => setPaused((p) => !p)}
                    style={{
                        background: paused ? 'rgba(255,45,120,0.15)' : 'rgba(255,255,255,0.08)',
                        color: paused ? PINK : 'rgba(255,255,255,0.6)',
                        border: `1px solid ${paused ? PINK : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: 6,
                        padding: '3px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {paused ? '▶ Resume' : '⏸ Pause'}
                </button>
                <span className={'small text-muted ms-auto'}>{displayed.length} shown</span>
            </div>

            {!running && packets.length === 0 && (
                <p className={'text-muted mb-0'}>Start capture above to see packets stream in.</p>
            )}

            <div
                ref={tableRef}
                style={{
                    maxHeight: 480,
                    overflowY: 'auto',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                }}
            >
                {displayed.length > 0 && (
                    <Table size={'sm'} className={'mb-0'} style={{ tableLayout: 'fixed', width: '100%' }}>
                        <colgroup>
                            <col style={{ width: '7%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '25%' }} />
                        </colgroup>
                        <thead style={{ position: 'sticky', top: 0, background: '#1a1a2e', zIndex: 1 }}>
                            <tr>
                                <th>Time</th>
                                <th>Type</th>
                                <th>Source</th>
                                <th>BSSID</th>
                                <th>SSID / Proto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayed.map((p) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <td style={{ color: 'rgba(255,255,255,0.4)' }}>{p.tsHuman}</td>
                                    <td>
                                        <span style={{ color: ftypeColor(p.ftypeLabel), fontWeight: 600 }}>
                                            {p.ftypeLabel}
                                        </span>
                                    </td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <span style={{ color: PINK }}>{p.src}</span>
                                        {p.srcVendor && (
                                            <div style={{ color: BLUE, fontSize: '0.65rem' }}>{p.srcVendor}</div>
                                        )}
                                    </td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <span style={{ color: BLUE }}>{p.bssid}</span>
                                        {p.bssidVendor && (
                                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>{p.bssidVendor}</div>
                                        )}
                                    </td>
                                    <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {p.ssid
                                            ? <span style={{ color: PINK }}>{p.ssid}</span>
                                            : <span style={{ color: 'rgba(255,255,255,0.3)' }}>{p.proto}</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </div>
        </PanelCard>
    );
};

export default PacketFeedCard;
