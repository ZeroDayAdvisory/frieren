/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { toast } from 'react-toastify';
import { Form } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import useMitmStateQuery from '@module/feature/hooks/useMitmStateQuery';
import useSetMitmStateMutation from '@module/feature/hooks/useSetMitmStateMutation';
import { PINK } from '@module/colors';

/**
 * Toggle card for the honeypot MITM intercept mode.
 *
 * ON  — allow-listed devices that join the honeypot get full Bettercap MITM:
 *       ARP spoof + HTTPS proxy + cert push redirect to 10.13.37.1:9999.
 * OFF — allow-listed devices still trigger a passive tcpdump capture but
 *       Bettercap does not start; they get normal internet on the honeypot.
 *
 * @return {ReactElement}
 */
const MitmToggleCard = () => {
    const { data, isLoading, refetch, isRefetching } = useMitmStateQuery();
    const setMitm = useSetMitmStateMutation();

    const active = data?.active ?? false;

    const OFF_GREY = '#9ca3af';

    const handleToggle = async () => {
        const next = !active;
        await setMitm.mutateAsync(next);
        toast.success(next
            ? 'Honeypot intercept turned ON — allow-listed devices will be MITM intercepted'
            : 'Honeypot intercept turned OFF — passive capture only, no MITM'
        );
    };

    return (
        <PanelCard
            title={'Honeypot Intercept Mode'}
            icon={'shield'}
            refetch={refetch}
            isFetching={isLoading || isRefetching}
        >
            <div className={'d-flex align-items-center justify-content-between gap-3'}>
                <div>
                    <div className={'fw-bold'} style={{ fontSize: '1.1rem' }}>
                        Intercept is{' '}
                        <span style={{ color: active ? PINK : OFF_GREY }}>
                            {active ? 'ON' : 'OFF'}
                        </span>
                    </div>
                    <div className={'small text-muted mt-1'}>
                        {active
                            ? 'ON — allow-listed devices are MITM intercepted (ARP spoof + HTTPS proxy + cert-install redirect).'
                            : 'OFF — no MITM. Devices get normal internet; passive pcap / DNS / SNI capture still runs.'}
                    </div>
                </div>
                <div className={'d-flex flex-column align-items-center'} style={{ flexShrink: 0 }}>
                    <Form.Check
                        type={'switch'}
                        id={'mitm-toggle'}
                        checked={active}
                        onChange={handleToggle}
                        disabled={setMitm.isPending || isLoading}
                        style={{ transform: 'scale(1.5)', transformOrigin: 'center', marginLeft: '0.5rem' }}
                    />
                    <div
                        className={'fw-bold mt-2'}
                        style={{ fontSize: '0.8rem', letterSpacing: '0.05em', color: active ? PINK : OFF_GREY }}
                    >
                        {active ? 'ON' : 'OFF'}
                    </div>
                </div>
            </div>
        </PanelCard>
    );
};

export default MitmToggleCard;
