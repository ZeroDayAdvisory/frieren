import { useState } from 'react';
import { Badge, Table, Form, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PanelCard from '@src/components/PanelCard';
import Button from '@src/components/Button';
import useProbesQuery from '@module/feature/hooks/useProbesQuery';
import { useClearProbesMutation } from '@module/feature/hooks/useCaptureControlMutation';
import { PINK, BLUE } from '@module/colors';

const ProbeTableCard = ({ onSelect, selectedMac }) => {
    const { data, isLoading, refetch, isRefetching } = useProbesQuery();
    const clearMutation = useClearProbesMutation();
    const [filter, setFilter] = useState('');

    const devices = (data?.devices ?? []).filter((d) => {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return d.mac.toLowerCase().includes(q)
            || d.vendor.toLowerCase().includes(q)
            || d.probes.some((p) => p.toLowerCase().includes(q));
    });

    const handleClear = async () => {
        await clearMutation.mutateAsync();
        toast.info('Probe log cleared');
    };

    return (
        <PanelCard
            title={`Probe Requests (${data?.devices?.length ?? 0} devices)`}
            icon={'radio'}
            refetch={refetch}
            isFetching={isLoading || isRefetching}
            headerAction={
                <Button
                    variant={'outline-secondary'}
                    size={'sm'}
                    icon={'trash-2'}
                    label={'Clear'}
                    onClick={handleClear}
                    isLoading={clearMutation.isPending}
                />
            }
        >
            <InputGroup className={'mb-3'} size={'sm'}>
                <Form.Control
                    placeholder={'Filter by MAC, vendor, or SSID…'}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                    <Button variant={'outline-secondary'} icon={'x'} onClick={() => setFilter('')} />
                )}
            </InputGroup>

            {devices.length === 0 && !isLoading && (
                <p className={'text-muted mb-0'}>
                    {filter ? 'No devices match that filter.' : 'No probe requests captured yet. Start capture below.'}
                </p>
            )}

            {devices.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                    <Table hover size={'sm'} className={'mb-0'}>
                        <thead>
                            <tr>
                                <th>Device</th>
                                <th>Probing For</th>
                                <th>Seen</th>
                                <th>Last</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((d) => (
                                <tr
                                    key={d.mac}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedMac === d.mac ? 'rgba(255,45,120,0.07)' : '',
                                    }}
                                    onClick={() => onSelect(d.mac === selectedMac ? null : d.mac)}
                                >
                                    <td>
                                        <code style={{ color: PINK }}>{d.mac}</code>
                                        {d.onAllowList && (
                                            <Badge bg={'success'} className={'ms-1'} style={{ fontSize: '0.65rem' }}>✓ allow-list</Badge>
                                        )}
                                        <div className={'small'} style={{ color: BLUE }}>{d.vendor}</div>
                                    </td>
                                    <td>
                                        <div className={'d-flex flex-wrap gap-1'}>
                                            {d.probes.slice(0, 4).map((ssid) => (
                                                <Badge key={ssid} bg={'dark'} style={{ fontSize: '0.7rem' }}>{ssid}</Badge>
                                            ))}
                                            {d.probes.length > 4 && (
                                                <Badge bg={'secondary'} style={{ fontSize: '0.7rem' }}>+{d.probes.length - 4}</Badge>
                                            )}
                                            {d.probes.length === 0 && <span className={'text-muted small'}>broadcast</span>}
                                        </div>
                                    </td>
                                    <td><Badge bg={'dark'}>{d.count}</Badge></td>
                                    <td><span className={'small text-muted'}>{d.lastSeen}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </PanelCard>
    );
};

export default ProbeTableCard;
