import { Badge, ListGroup } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import useProbesQuery from '@module/feature/hooks/useProbesQuery';
import useCaptureStatusQuery from '@module/feature/hooks/useCaptureStatusQuery';
import { useStartCaptureMutation, useStopCaptureMutation } from '@module/feature/hooks/useCaptureControlMutation';
import Button from '@src/components/Button';
import { toast } from 'react-toastify';
import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { PINK, BLUE } from '@module/colors';

const CaptureControlCard = () => {
    const { data: status } = useCaptureStatusQuery();
    const startMutation = useStartCaptureMutation();
    const stopMutation  = useStopCaptureMutation();
    const [iface, setIface]   = useState('wlan0');

    const ifaces   = status?.ifaces ?? ['wlan0', 'wlan1'];
    const running  = status?.running ?? false;

    const handleStart = async () => {
        await startMutation.mutateAsync(iface);
        toast.success(`Probe capture started on ${iface}`);
    };

    const handleStop = async () => {
        await stopMutation.mutateAsync();
        toast.info('Probe capture stopped');
    };

    return (
        <PanelCard title={'Capture Control'} icon={'wifi'}>
            <div className={'d-flex align-items-center gap-3 flex-wrap'}>
                <div className={'d-flex align-items-center gap-2'}>
                    <Badge bg={running ? 'success' : 'secondary'} style={{ fontSize: '0.8rem' }}>
                        {running ? `● Capturing on ${status?.iface ?? iface}` : '○ Stopped'}
                    </Badge>
                    {running && status?.pid && (
                        <span className={'small text-muted'}>PID {status.pid}</span>
                    )}
                </div>

                {!running && (
                    <>
                        <Form.Select
                            size={'sm'}
                            value={iface}
                            onChange={(e) => setIface(e.target.value)}
                            style={{ width: 'auto' }}
                        >
                            {ifaces.map((i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </Form.Select>
                        <Button
                            variant={'success'}
                            size={'sm'}
                            icon={'play'}
                            label={'Start Capture'}
                            onClick={handleStart}
                            isLoading={startMutation.isPending}
                        />
                    </>
                )}

                {running && (
                    <Button
                        variant={'danger'}
                        size={'sm'}
                        icon={'square'}
                        label={'Stop'}
                        onClick={handleStop}
                        isLoading={stopMutation.isPending}
                    />
                )}
            </div>
            <p className={'small text-muted mt-2 mb-0'}>
                Captures IEEE 802.11 probe request frames on the selected monitor interface.
                Devices appear in the table as they broadcast. Auto-refreshes every 5 s.
            </p>
        </PanelCard>
    );
};

const DeviceDetailCard = ({ mac }) => {
    const { data } = useProbesQuery();
    const device = (data?.devices ?? []).find((d) => d.mac === mac);

    if (!mac) return <CaptureControlCard />;

    if (!device) {
        return (
            <PanelCard title={'Device Detail'} icon={'monitor'}>
                <p className={'text-muted mb-0'}>Device not found.</p>
            </PanelCard>
        );
    }

    return (
        <>
            <PanelCard
                title={'Device Detail'}
                icon={'monitor'}
            >
                <div className={'mb-3'}>
                    <code style={{ color: PINK, fontSize: '1.1rem' }}>{device.mac}</code>
                    {device.onAllowList && (
                        <Badge bg={'success'} className={'ms-2'}>On Allow-List</Badge>
                    )}
                    <div style={{ color: BLUE }}>{device.vendor}</div>
                    <div className={'small text-muted mt-1'}>
                        {device.count} probe frames · last seen {device.lastSeen}
                    </div>
                </div>

                <h6 className={'mb-2'} style={{ color: PINK }}>Probed SSIDs ({device.probes.length})</h6>
                {device.probes.length === 0 && (
                    <p className={'text-muted small mb-0'}>Only broadcast probes (no specific SSIDs).</p>
                )}
                {device.probes.length > 0 && (
                    <ListGroup variant={'flush'}>
                        {device.probes.map((ssid) => (
                            <ListGroup.Item key={ssid} className={'py-1 px-0'}>
                                <code style={{ color: PINK }}>{ssid}</code>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                )}
            </PanelCard>
            <div className={'mt-3'}>
                <CaptureControlCard />
            </div>
        </>
    );
};

export default DeviceDetailCard;
