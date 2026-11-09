import { useState } from 'react';
import { Badge, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PanelCard from '@src/components/PanelCard';
import Button from '@src/components/Button';
import useLivecapStatusQuery from '@module/feature/hooks/useLivecapStatusQuery';
import { useStartLivecapMutation, useStopLivecapMutation, useClearPacketsMutation } from '@module/feature/hooks/useLivecapControlMutation';
import { PINK, BLUE } from '@module/colors';

const FILTER_LABELS = {
    all:    'All frames',
    deauth: 'Deauth only',
    probe:  'Probe Req/Resp',
    eapol:  'EAPOL (handshakes)',
    beacon: 'Beacons',
    data:   'Data frames',
    mgmt:   'Management',
};

const CaptureControlCard = () => {
    const { data: status } = useLivecapStatusQuery();
    const startMutation = useStartLivecapMutation();
    const stopMutation  = useStopLivecapMutation();
    const clearMutation = useClearPacketsMutation();
    const [iface,  setIface]  = useState('wlan0');
    const [filter, setFilter] = useState('all');

    const running = status?.running ?? false;
    const ifaces  = status?.ifaces  ?? ['wlan0', 'wlan1'];
    const filters = status?.filters ?? Object.keys(FILTER_LABELS);

    const handleStart = async () => {
        await startMutation.mutateAsync({ iface, filter });
        toast.success(`Live capture started on ${iface} (${FILTER_LABELS[filter] ?? filter})`);
    };

    const handleStop = async () => {
        await stopMutation.mutateAsync();
        toast.info('Capture stopped');
    };

    const handleClear = async () => {
        await clearMutation.mutateAsync();
        toast.info('Packet buffer cleared');
    };

    return (
        <PanelCard title={'Capture Control'} icon={'zap'}>
            <div className={'d-flex align-items-center gap-3 flex-wrap'}>
                <Badge bg={running ? 'success' : 'secondary'} style={{ fontSize: '0.8rem' }}>
                    {running
                        ? `● Live on ${status.iface} · ${FILTER_LABELS[status.filter] ?? status.filter}`
                        : '○ Stopped'}
                </Badge>
                {running && status?.pid && (
                    <span className={'small text-muted'}>PID {status.pid}</span>
                )}
            </div>

            {!running && (
                <div className={'d-flex gap-2 mt-3 flex-wrap align-items-center'}>
                    <Form.Select
                        size={'sm'}
                        value={iface}
                        onChange={(e) => setIface(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        {ifaces.map((i) => <option key={i} value={i}>{i}</option>)}
                    </Form.Select>
                    <Form.Select
                        size={'sm'}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        {filters.map((f) => (
                            <option key={f} value={f}>{FILTER_LABELS[f] ?? f}</option>
                        ))}
                    </Form.Select>
                    <Button
                        variant={'success'}
                        size={'sm'}
                        icon={'play'}
                        label={'Start'}
                        onClick={handleStart}
                        isLoading={startMutation.isPending}
                    />
                </div>
            )}

            {running && (
                <div className={'d-flex gap-2 mt-3'}>
                    <Button
                        variant={'danger'}
                        size={'sm'}
                        icon={'square'}
                        label={'Stop'}
                        onClick={handleStop}
                        isLoading={stopMutation.isPending}
                    />
                    <Button
                        variant={'outline-secondary'}
                        size={'sm'}
                        icon={'trash-2'}
                        label={'Clear buffer'}
                        onClick={handleClear}
                        isLoading={clearMutation.isPending}
                    />
                </div>
            )}

            <p className={'small text-muted mt-2 mb-0'}>
                Packets stream into a 2 000-frame ring buffer. The feed auto-polls every 2 s when capturing.
            </p>
        </PanelCard>
    );
};

export default CaptureControlCard;
