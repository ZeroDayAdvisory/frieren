import { useState } from 'react';
import { Badge, ListGroup, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PanelCard from '@src/components/PanelCard';
import Button from '@src/components/Button';
import useAnalyzeCaptureQuery from '@module/feature/hooks/useAnalyzeCaptureQuery';
import { PINK, BLUE } from '@module/colors';

const TYPE_META = {
    '4-way':   { label: '4-Way Handshake', variant: 'success',   icon: '🔑' },
    'pmkid':   { label: 'PMKID',           variant: 'warning',   icon: '⚡' },
    'partial': { label: 'Partial',          variant: 'secondary', icon: '⚠️' },
};

const HandshakeDetailCard = ({ file }) => {
    const { data, isLoading, refetch, isRefetching } = useAnalyzeCaptureQuery(file);
    const [copiedIdx, setCopiedIdx] = useState(null);

    const targets = data?.targets ?? [];

    const handleCopy = (cmd, idx) => {
        navigator.clipboard.writeText(cmd).then(() => {
            setCopiedIdx(idx);
            toast.success('Hashcat command copied!');
            setTimeout(() => setCopiedIdx(null), 2000);
        });
    };

    return (
        <PanelCard
            title={file ? `Analysis: ${file}` : 'Handshake Analysis'}
            icon={'key'}
            refetch={file ? refetch : undefined}
            isFetching={isLoading || isRefetching}
        >
            {!file && (
                <p className={'text-muted mb-0'}>Select a capture file to analyze it for crackable handshakes.</p>
            )}

            {file && !isLoading && targets.length === 0 && (
                <Alert variant={'secondary'} className={'mb-0'}>
                    No crackable handshakes found in this capture. The file may contain partial frames only.
                </Alert>
            )}

            {targets.length > 0 && (
                <ListGroup variant={'flush'}>
                    {targets.map((target, idx) => {
                        const meta = TYPE_META[target.type] ?? TYPE_META['partial'];

                        return (
                            <ListGroup.Item key={`${target.bssid}-${idx}`}>
                                <div className={'d-flex justify-content-between align-items-start mb-1'}>
                                    <div>
                                        <span style={{ color: PINK, fontWeight: 600, fontSize: '1rem' }}>
                                            {meta.icon} {target.ssid}
                                        </span>
                                        <div className={'small'} style={{ color: BLUE }}>{target.bssid} · {target.vendor}</div>
                                    </div>
                                    <Badge bg={meta.variant}>{meta.label}</Badge>
                                </div>

                                {target.hashcat && (
                                    <div className={'mt-2'}>
                                        <div className={'d-flex align-items-center gap-2'}>
                                            <code
                                                className={'flex-grow-1 p-2 rounded'}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    fontSize: '0.78rem',
                                                    wordBreak: 'break-all',
                                                    display: 'block',
                                                }}
                                            >
                                                {target.hashcat}
                                            </code>
                                            <Button
                                                variant={copiedIdx === idx ? 'success' : 'outline-secondary'}
                                                size={'sm'}
                                                icon={copiedIdx === idx ? 'check' : 'copy'}
                                                onClick={() => handleCopy(target.hashcat, idx)}
                                            />
                                        </div>
                                        <div className={'small text-muted mt-1'}>
                                            Hash file: <code>{target.hashFile}</code>
                                        </div>
                                    </div>
                                )}

                                {!target.hashcat && target.type === 'partial' && (
                                    <Alert variant={'secondary'} className={'mt-2 mb-0 py-1 small'}>
                                        Partial capture — not enough frames to crack. Continue capturing to complete the handshake.
                                    </Alert>
                                )}
                            </ListGroup.Item>
                        );
                    })}
                </ListGroup>
            )}
        </PanelCard>
    );
};

export default HandshakeDetailCard;
