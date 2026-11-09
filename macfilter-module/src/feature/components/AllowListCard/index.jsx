/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState } from 'react';
import { toast } from 'react-toastify';
import { ListGroup } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import Button from '@src/components/Button';
import ConfirmationModal from '@src/components/ConfirmationModal';
import useMacListQuery from '@module/feature/hooks/useMacListQuery';
import useRemoveMacMutation from '@module/feature/hooks/useRemoveMacMutation';
import { PINK, BLUE } from '@module/colors';

/**
 * Lists every MAC on the shared allow-list (the same one Aura's daemon
 * checks for deauth/injection authorization), each removable individually.
 *
 * @return {ReactElement} The rendered card.
 */
const AllowListCard = () => {
    const { data, isLoading, refetch, isRefetching } = useMacListQuery();
    const removeMacMutation = useRemoveMacMutation();
    const [pendingRemoval, setPendingRemoval] = useState(null);

    const entries = data?.entries ?? [];

    const handleConfirmRemove = async () => {
        await removeMacMutation.mutateAsync(pendingRemoval);
        toast.success(`Removed ${pendingRemoval} from the allow-list`);
        setPendingRemoval(null);
    };

    return (
        <PanelCard
            title={'Current Allow-List'}
            icon={'list'}
            refetch={refetch}
            isFetching={isLoading || isRefetching}
        >
            {entries.length === 0 && !isLoading && (
                <p className={'text-muted mb-0'}>No MAC addresses on the allow-list yet.</p>
            )}

            {entries.length > 0 && (
                <ListGroup variant={'flush'}>
                    {entries.map(({ mac, vendor, hostname }) => (
                        <ListGroup.Item
                            key={mac}
                            className={'d-flex justify-content-between align-items-center'}
                        >
                            <div>
                                <code style={{ color: PINK }}>{mac}</code>
                                <div className={'small'} style={{ color: BLUE }}>
                                    {hostname ? `${hostname} - ${vendor}` : vendor}
                                </div>
                            </div>
                            <Button
                                variant={'outline-danger'}
                                size={'sm'}
                                icon={'trash-2'}
                                onClick={() => setPendingRemoval(mac)}
                                label={'Remove'}
                            />
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

            <ConfirmationModal
                show={pendingRemoval !== null}
                onHide={() => setPendingRemoval(null)}
                onConfirm={handleConfirmRemove}
                isConfirmLoading={removeMacMutation.isPending}
                title={'Remove MAC Address'}
                description={`Remove ${pendingRemoval} from the allow-list? It will no longer be authorized for deauth or MITM automation.`}
            />
        </PanelCard>
    );
};

export default AllowListCard;
