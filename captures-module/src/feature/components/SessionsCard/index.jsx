/*
 * Project: Frieren Framework
 * Module: Captures (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState } from 'react';
import { Badge, Button, Collapse, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';
import { formatBytes } from '@module/feature/helpers/format';
import usePcapStatsMutation from '@module/feature/hooks/usePcapStatsMutation';
import useDeleteSessionMutation from '@module/feature/hooks/useDeleteSessionMutation';

// Size with a pink number and a blue unit (e.g. 225 MB).
const SizeText = ({ bytes }) => {
    const [num, unit] = formatBytes(bytes).split(' ');
    return (
        <span>
            <span style={{ color: PINK }}>{num}</span>
            {' '}
            <span style={{ color: BLUE }}>{unit}</span>
        </span>
    );
};

const PcapStats = ({ file }) => {
    const [stats, setStats] = useState(null);
    const mutation = usePcapStatsMutation();

    const load = async () => {
        try {
            const res = await mutation.mutateAsync(file);
            setStats(res);
        } catch {
            toast.error('Could not read pcap stats.');
        }
    };

    if (stats) {
        return (
            <span className={'text-muted'} style={{ fontSize: '0.72rem' }}>
                {stats.packets} pkts
                {stats.firstTs && stats.lastTs ? ` · ${stats.firstTs} → ${stats.lastTs}` : ''}
            </span>
        );
    }

    return (
        <Button
            variant={'link'}
            size={'sm'}
            className={'p-0'}
            onClick={load}
            disabled={mutation.isPending}
            style={{ color: BLUE, fontSize: '0.72rem', textDecoration: 'none' }}
        >
            {mutation.isPending ? <Spinner animation={'border'} size={'sm'} /> : 'count packets'}
        </Button>
    );
};

const SessionRow = ({ session, onDelete, deleting }) => {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 0' }}>
            <div
                className={'d-flex justify-content-between align-items-center'}
                style={{ cursor: 'pointer' }}
                onClick={() => setOpen(!open)}
            >
                <div style={{ minWidth: 0 }}>
                    <div style={{ color: PINK, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {session.mac || session.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: BLUE }}>
                        {session.vendor} · {session.startedAt ?? 'unknown time'}
                    </div>
                </div>
                <div className={'d-flex align-items-center gap-2 flex-shrink-0'}>
                    <Badge bg={'dark'}><SizeText bytes={session.totalBytes} /></Badge>
                    <Badge style={{ background: PINK }}>{session.files.length} files</Badge>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>{open ? '▾' : '▸'}</span>
                </div>
            </div>

            <Collapse in={open}>
                <div>
                    <div style={{ padding: '8px 0 4px 8px' }}>
                        {session.files.map((f) => (
                            <div
                                key={f.path}
                                className={'d-flex justify-content-between align-items-center'}
                                style={{ padding: '3px 0', fontSize: '0.8rem' }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <span style={{ color: f.isPcap ? PINK : 'rgba(255,255,255,0.75)' }}>
                                        {f.name}
                                    </span>
                                    <span className={'ms-2'} style={{ fontSize: '0.72rem' }}>
                                        <SizeText bytes={f.bytes} />
                                    </span>
                                    {f.isPcap && <span className={'ms-2'}><PcapStats file={f.path} /></span>}
                                </div>
                            </div>
                        ))}
                        <div className={'mt-2'}>
                            <Button
                                variant={'outline-danger'}
                                size={'sm'}
                                onClick={() => onDelete(session)}
                                disabled={deleting}
                                style={{ fontSize: '0.72rem' }}
                            >
                                {deleting ? 'Deleting…' : 'Delete session'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Collapse>
        </div>
    );
};

const SessionsCard = ({ data, isFetching, refetch }) => {
    const sessions = data?.sessions ?? [];
    const deleteMutation = useDeleteSessionMutation();
    const [pendingDir, setPendingDir] = useState(null);

    const totalBytes = sessions.reduce((s, x) => s + x.totalBytes, 0);

    const handleDelete = async (session) => {
        if (!window.confirm(`Delete capture session for ${session.mac || session.name}? This removes the pcap files permanently.`)) {
            return;
        }
        setPendingDir(session.dir);
        try {
            await deleteMutation.mutateAsync(session.dir);
            toast.success('Session deleted.');
        } catch {
            toast.error('Delete failed.');
        } finally {
            setPendingDir(null);
        }
    };

    return (
        <PanelCard
            title={'Capture Sessions'}
            icon={'folder'}
            refetch={refetch}
            isFetching={isFetching}
        >
            <div className={'small text-muted mb-3'}>
                {sessions.length} sessions · {formatBytes(totalBytes)} on USB
                {data?.base ? ` · ${data.base}` : ''}
            </div>

            {sessions.length === 0 ? (
                <p className={'text-muted small mb-0'}>No capture sessions recorded yet.</p>
            ) : (
                sessions.map((s) => (
                    <SessionRow
                        key={s.dir}
                        session={s}
                        onDelete={handleDelete}
                        deleting={pendingDir === s.dir}
                    />
                ))
            )}
        </PanelCard>
    );
};

export default SessionsCard;
