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

    const handleToggle = async () => {
        const next = !active;
        await setMitm.mutateAsync(next);
        toast.success(next
            ? 'MITM intercept enabled — next allow-listed connection will be intercepted'
            : 'MITM intercept disabled — allow-listed devices will get passive capture only'
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
                    <div className={'fw-semibold'} style={{ color: active ? PINK : undefined }}>
                        {active ? 'MITM Active' : 'Passive Capture Only'}
                    </div>
                    <div className={'small text-muted mt-1'}>
                        {active
                            ? 'Allow-listed devices will be ARP-spoofed, HTTPS-proxied, and redirected to the cert install page.'
                            : 'Allow-listed devices get normal internet. tcpdump still captures all their traffic.'}
                    </div>
                </div>
                <Form.Check
                    type={'switch'}
                    id={'mitm-toggle'}
                    checked={active}
                    onChange={handleToggle}
                    disabled={setMitm.isPending || isLoading}
                    style={{ transform: 'scale(1.4)', transformOrigin: 'right center', flexShrink: 0 }}
                />
            </div>
        </PanelCard>
    );
};

export default MitmToggleCard;
