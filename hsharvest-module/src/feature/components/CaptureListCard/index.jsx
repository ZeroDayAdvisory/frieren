import { useState } from 'react';
import { toast } from 'react-toastify';
import { Badge, ListGroup } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import Button from '@src/components/Button';
import ConfirmationModal from '@src/components/ConfirmationModal';
import useCaptureListQuery from '@module/feature/hooks/useCaptureListQuery';
import useDeleteCaptureMutation from '@module/feature/hooks/useDeleteCaptureMutation';
import { PINK } from '@module/colors';

const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
};

const CaptureListCard = ({ onSelect, selectedFile }) => {
    const { data, isLoading, refetch, isRefetching } = useCaptureListQuery();
    const deleteMutation = useDeleteCaptureMutation();
    const [pendingDelete, setPendingDelete] = useState(null);

    const captures = data?.captures ?? [];

    const handleConfirmDelete = async () => {
        await deleteMutation.mutateAsync(pendingDelete);
        toast.success(`Deleted ${pendingDelete}`);
        if (selectedFile === pendingDelete) onSelect(null);
        setPendingDelete(null);
    };

    return (
        <PanelCard
            title={'Capture Files'}
            icon={'archive'}
            refetch={refetch}
            isFetching={isLoading || isRefetching}
        >
            {captures.length === 0 && !isLoading && (
                <p className={'text-muted mb-0'}>No capture files found in <code>/mnt/usb/frieren/aura/captures/</code>.</p>
            )}

            {captures.length > 0 && (
                <ListGroup variant={'flush'}>
                    {captures.map(({ file, size, mtimeHuman, hasHandshake }) => (
                        <ListGroup.Item
                            key={file}
                            className={'d-flex justify-content-between align-items-center'}
                            style={{ cursor: 'pointer', background: selectedFile === file ? 'rgba(255,45,120,0.07)' : '' }}
                            onClick={() => onSelect(file)}
                        >
                            <div>
                                <code style={{ color: PINK }}>{file}</code>
                                <div className={'small text-muted'}>{mtimeHuman} · {formatBytes(size)}</div>
                            </div>
                            <div className={'d-flex align-items-center gap-2'}>
                                {hasHandshake
                                    ? <Badge bg={'success'}>handshake</Badge>
                                    : <Badge bg={'secondary'}>no eapol</Badge>
                                }
                                <Button
                                    variant={'outline-danger'}
                                    size={'sm'}
                                    icon={'trash-2'}
                                    onClick={(e) => { e.stopPropagation(); setPendingDelete(file); }}
                                />
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}

            <ConfirmationModal
                show={pendingDelete !== null}
                onHide={() => setPendingDelete(null)}
                onConfirm={handleConfirmDelete}
                isConfirmLoading={deleteMutation.isPending}
                title={'Delete Capture'}
                description={`Permanently delete ${pendingDelete}? This cannot be undone.`}
            />
        </PanelCard>
    );
};

export default CaptureListCard;
