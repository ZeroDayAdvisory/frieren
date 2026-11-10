/*
 * Project: Frieren Framework
 * Module: Captures (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Badge, Table } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';
import { formatBytes, formatDuration } from '@module/feature/helpers/format';

const signalColor = (signal) => {
    if (signal === null) return 'rgba(255,255,255,0.4)';
    if (signal > -55) return '#4ade80';
    if (signal > -70) return '#facc15';
    return PINK;
};

const LiveClientsCard = ({ data, isFetching, refetch }) => {
    const clients = data?.clients ?? [];

    return (
        <PanelCard
            title={'Honeypot Clients (Live)'}
            icon={'users'}
            refetch={refetch}
            isFetching={isFetching}
        >
            <div className={'small text-muted mb-3'}>
                Devices currently associated to <span style={{ color: PINK }}>the honeypot AP</span>
                {data?.iface ? ` (${data.iface})` : ''} · refreshes every 5 s
            </div>

            {clients.length === 0 ? (
                <p className={'text-muted small mb-0'}>No devices connected right now.</p>
            ) : (
                <Table responsive borderless size={'sm'} className={'mb-0'} style={{ fontSize: '0.85rem' }}>
                    <thead>
                        <tr style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                            <th>Device</th>
                            <th>IP</th>
                            <th>Signal</th>
                            <th>Connected</th>
                            <th>RX / TX</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((c) => (
                            <tr key={c.mac}>
                                <td>
                                    <div style={{ color: BLUE, fontFamily: 'monospace' }}>{c.mac}</div>
                                    <div className={'text-muted'} style={{ fontSize: '0.72rem' }}>{c.vendor}</div>
                                </td>
                                <td style={{ color: BLUE, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {c.ip ?? '—'}
                                </td>
                                <td style={{ color: signalColor(c.signal) }}>
                                    {c.signal !== null ? `${c.signal} dBm` : '—'}
                                </td>
                                <td>{formatDuration(c.connectedSec)}</td>
                                <td style={{ fontSize: '0.75rem' }}>
                                    {formatBytes(c.rxBytes)} / {formatBytes(c.txBytes)}
                                </td>
                                <td>
                                    <div className={'d-flex gap-1 flex-wrap'}>
                                        {c.allowed
                                            ? <Badge style={{ background: PINK }}>allow-list</Badge>
                                            : <Badge bg={'secondary'}>unlisted</Badge>}
                                        {c.capturing
                                            ? <Badge bg={'success'}>● capturing</Badge>
                                            : <Badge bg={'dark'}>idle</Badge>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </PanelCard>
    );
};

export default LiveClientsCard;
