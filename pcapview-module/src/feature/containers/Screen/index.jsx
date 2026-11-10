/*
 * Project: Frieren Framework
 * Module: PCAP Analysis (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useState, useEffect } from 'react';
import { Button, Form, Spinner, Badge } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';
import { formatBytes } from '@module/feature/helpers/format';
import { FILTER_PRESETS, MODES } from '@module/feature/helpers/presets';
import usePcapListQuery from '@module/feature/hooks/usePcapListQuery';
import useRunFilterMutation from '@module/feature/hooks/useRunFilterMutation';

const PcapViewPage = () => {
    const { data, isLoading, isRefetching, refetch } = usePcapListQuery();
    const runMutation = useRunFilterMutation();

    const files = data?.files ?? [];
    const [file, setFile] = useState('');
    const [filter, setFilter] = useState('');
    const [mode, setMode] = useState('summary');
    const [limit, setLimit] = useState(500);
    const [result, setResult] = useState(null);

    // Default-select the newest pcap once the list loads
    useEffect(() => {
        if (!file && files.length > 0) {
            setFile(files[0].path);
        }
    }, [files, file]);

    const run = async () => {
        if (!file) return;
        try {
            const res = await runMutation.mutateAsync({ file, filter, mode, limit });
            setResult(res);
        } catch {
            setResult({ error: 'Request failed.', output: '', command: '' });
        }
    };

    return (
        <div className={'my-5'}>
            <h1 className={'mb-3 text-center'}>PCAP Analysis</h1>
            <p className={'mb-4 text-center text-muted'}>
                Run tcpdump BPF filters against the saved honeypot captures.
                <br />
                <span style={{ fontSize: '0.8rem' }}>
                    No tshark on this platform — filters use tcpdump BPF syntax, not Wireshark display filters.
                </span>
            </p>

            <PanelCard
                title={'Filter & Decode'}
                icon={'filter'}
                refetch={refetch}
                isFetching={isLoading || isRefetching}
            >
                <Form.Group className={'mb-3'}>
                    <Form.Label className={'small text-muted'}>Capture file</Form.Label>
                    <Form.Select
                        value={file}
                        onChange={(e) => setFile(e.target.value)}
                        size={'sm'}
                    >
                        {files.length === 0 && <option value={''}>No captures found</option>}
                        {files.map((f) => (
                            <option key={f.path} value={f.path}>
                                {f.session} / {f.name} ({formatBytes(f.bytes)})
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className={'mb-2'}>
                    <Form.Label className={'small text-muted'}>Presets</Form.Label>
                    <div className={'d-flex flex-wrap gap-1'}>
                        {FILTER_PRESETS.map((p) => (
                            <Button
                                key={p.label}
                                size={'sm'}
                                variant={'outline-secondary'}
                                onClick={() => setFilter(p.filter)}
                                style={{
                                    fontSize: '0.72rem',
                                    borderColor: filter === p.filter ? PINK : 'rgba(255,255,255,0.2)',
                                    color: filter === p.filter ? PINK : 'rgba(255,255,255,0.7)',
                                }}
                            >
                                {p.label}
                            </Button>
                        ))}
                    </div>
                </Form.Group>

                <Form.Group className={'mb-3'}>
                    <Form.Label className={'small text-muted'}>BPF filter (tcpdump syntax)</Form.Label>
                    <Form.Control
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder={'e.g. host 10.13.37.5 and tcp port 443'}
                        size={'sm'}
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Group>

                <div className={'d-flex gap-3 align-items-end mb-3 flex-wrap'}>
                    <Form.Group>
                        <Form.Label className={'small text-muted'}>Decode</Form.Label>
                        <Form.Select value={mode} onChange={(e) => setMode(e.target.value)} size={'sm'}>
                            {MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group>
                        <Form.Label className={'small text-muted'}>Max packets</Form.Label>
                        <Form.Control
                            type={'number'}
                            min={1}
                            max={5000}
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                            size={'sm'}
                            style={{ width: 110 }}
                        />
                    </Form.Group>
                    <Button
                        onClick={run}
                        disabled={!file || runMutation.isPending}
                        style={{ background: PINK, border: 'none' }}
                        size={'sm'}
                    >
                        {runMutation.isPending ? (
                            <><Spinner animation={'border'} size={'sm'} className={'me-2'} />Running…</>
                        ) : 'Run'}
                    </Button>
                </div>

                {result && (
                    <div>
                        {result.command && (
                            <div
                                className={'mb-2'}
                                style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: BLUE }}
                            >
                                $ {result.command}
                            </div>
                        )}
                        {result.error && (
                            <div className={'small text-danger mb-2'}>Filter error: {result.error}</div>
                        )}
                        <div className={'d-flex gap-2 mb-1'}>
                            <Badge bg={'dark'}>{result.lines ?? 0} lines</Badge>
                            {result.truncated && <Badge style={{ background: PINK }}>truncated</Badge>}
                        </div>
                        <pre style={{
                            background: 'rgba(0,0,0,0.35)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 6,
                            padding: 12,
                            maxHeight: 440,
                            overflow: 'auto',
                            fontSize: '0.72rem',
                            color: 'rgba(255,255,255,0.85)',
                            whiteSpace: 'pre',
                        }}>
                            {result.output || '(no packets matched)'}
                        </pre>
                    </div>
                )}
            </PanelCard>
        </div>
    );
};

export default PcapViewPage;
