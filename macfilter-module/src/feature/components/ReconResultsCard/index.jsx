/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState } from 'react';
import { Table, Form, Collapse, Badge } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import useReconResultsQuery from '@module/feature/hooks/useReconResultsQuery';
import { PINK, BLUE } from '@module/colors';

const ReconResultsCard = () => {
    const { data, isLoading, refetch, isRefetching } = useReconResultsQuery();
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState({});

    const aps = data?.aps ?? [];
    const scanId = data?.scanId;

    const term = search.trim().toLowerCase();
    const matched = term
        ? aps.filter((ap) =>
            ap.ssid.toLowerCase().includes(term) ||
            ap.bssid.toLowerCase().includes(term) ||
            ap.vendor.toLowerCase().includes(term) ||
            ap.clients.some(
                (c) =>
                    c.mac.toLowerCase().includes(term) ||
                    c.vendor.toLowerCase().includes(term)
            )
        )
        : aps;

    // visible SSIDs first, hidden ones at the end
    const filtered = [
        ...matched.filter((ap) => ap.ssid !== '(hidden)'),
        ...matched.filter((ap) => ap.ssid === '(hidden)'),
    ];

    const toggle = (bssid) =>
        setExpanded((prev) => ({ ...prev, [bssid]: !prev[bssid] }));

    return (
        <PanelCard
            title={'Recon Results (Vendor Enriched)'}
            icon={'radio'}
            subtitle={scanId !== null && scanId !== undefined ? `Latest scan #${scanId} · ${aps.length} APs` : undefined}
            refetch={refetch}
            isFetching={isLoading || isRefetching}
        >
            {aps.length === 0 && !isLoading && (
                <p className={'text-muted mb-0'}>No recon scan data available yet.</p>
            )}

            {aps.length > 0 && (
                <>
                    <Form.Control
                        type={'text'}
                        placeholder={'Search SSID, BSSID, or vendor…'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={'mb-3'}
                        size={'sm'}
                    />

                    {filtered.length === 0 && (
                        <p className={'text-muted mb-0'}>No results match "{search}".</p>
                    )}

                    {filtered.length > 0 && (
                        <div className={'table-responsive'}>
                            <Table hover size={'sm'}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '1.5rem' }} />
                                        <th>SSID</th>
                                        <th>BSSID</th>
                                        <th>Vendor</th>
                                        <th>Ch</th>
                                        <th>Signal</th>
                                        <th>Enc</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((ap) => {
                                        const isOpen = !!expanded[ap.bssid];
                                        const hasDevices = ap.clients.length > 0;
                                        return (
                                            <>
                                                <tr
                                                    key={ap.bssid}
                                                    onClick={() => hasDevices && toggle(ap.bssid)}
                                                    style={{ cursor: hasDevices ? 'pointer' : 'default' }}
                                                >
                                                    <td className={'text-muted'}>
                                                        {hasDevices ? (isOpen ? '▾' : '▸') : ''}
                                                    </td>
                                                    <td>
                                                        <span style={{ color: PINK }}>{ap.ssid}</span>
                                                        {hasDevices && (
                                                            <Badge bg={'secondary'} className={'ms-2'} style={{ fontSize: '0.65em' }}>
                                                                {ap.clients.length}
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td><code style={{ color: BLUE }}>{ap.bssid}</code></td>
                                                    <td style={{ color: PINK }}>{ap.vendor}</td>
                                                    <td>{ap.channel}</td>
                                                    <td>{ap.signal} dBm</td>
                                                    <td>{ap.encryption}</td>
                                                </tr>

                                                {hasDevices && isOpen && (
                                                    <tr key={`${ap.bssid}-devices`}>
                                                        <td colSpan={7} className={'p-0'}>
                                                            <Collapse in={isOpen}>
                                                                <div>
                                                                    <Table size={'sm'} className={'mb-0'} style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                                        <thead>
                                                                            <tr>
                                                                                <th style={{ paddingLeft: '2.5rem' }}>Device MAC</th>
                                                                                <th>Vendor</th>
                                                                                <th>Last Seen</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {ap.clients.map((c) => (
                                                                                <tr key={c.mac}>
                                                                                    <td style={{ paddingLeft: '2.5rem' }}><code style={{ color: BLUE }}>{c.mac}</code></td>
                                                                                    <td style={{ color: PINK }}>{c.vendor}</td>
                                                                                    <td className={'text-muted'}>{c.lastSeen ?? '—'}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </Table>
                                                                </div>
                                                            </Collapse>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </>
            )}
        </PanelCard>
    );
};

export default ReconResultsCard;
