/*
 * Project: Frieren Framework
 * Module: System Health (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { Badge } from 'react-bootstrap';
import PanelCard from '@src/components/PanelCard';
import { PINK, TRANSPARENT_CARD_STYLE } from '@module/colors';

const ProcessesCard = ({ data, isFetching, refetch }) => {
    const procs = data?.processes ?? [];

    return (
        <PanelCard title={'Daemons'} icon={'cpu'} refetch={refetch} isFetching={isFetching} style={TRANSPARENT_CARD_STYLE}>
            <div className={'d-flex flex-column gap-2'}>
                {procs.map((p) => (
                    <div key={p.name} className={'d-flex justify-content-between align-items-center'}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.name}</span>
                        {p.running
                            ? <Badge bg={'success'}>● up{p.count > 1 ? ` ×${p.count}` : ''}</Badge>
                            : <Badge bg={'dark'} style={{ color: 'rgba(255,255,255,0.5)' }}>down</Badge>}
                    </div>
                ))}
            </div>
            <div
                className={'d-flex justify-content-between align-items-center mt-3 pt-2'}
                style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
                <span style={{ fontSize: '0.85rem' }}>Honeypot MITM</span>
                {data?.mitmActive
                    ? <Badge style={{ background: PINK }}>ACTIVE</Badge>
                    : <Badge bg={'secondary'}>off</Badge>}
            </div>
        </PanelCard>
    );
};

export default ProcessesCard;
