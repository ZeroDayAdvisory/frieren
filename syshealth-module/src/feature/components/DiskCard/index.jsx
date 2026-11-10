/*
 * Project: Frieren Framework
 * Module: System Health (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';
import { formatBytes } from '@module/feature/helpers/format';

const usageColor = (pct) => {
    if (pct >= 90) return PINK;
    if (pct >= 75) return '#facc15';
    return '#4ade80';
};

const UsageBar = ({ label, mount, used, total, avail, pct }) => (
    <div className={'mb-3'}>
        <div className={'d-flex justify-content-between align-items-baseline mb-1'}>
            <span style={{ color: BLUE, fontWeight: 600, textTransform: 'capitalize' }}>{label}</span>
            <span className={'text-muted'} style={{ fontSize: '0.72rem' }}>{mount}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
            <div style={{
                width: `${pct}%`,
                height: '100%',
                background: usageColor(pct),
                transition: 'width 0.4s ease',
            }} />
        </div>
        <div className={'d-flex justify-content-between mt-1'} style={{ fontSize: '0.75rem' }}>
            <span style={{ color: usageColor(pct) }}>{pct}% used</span>
            <span className={'text-muted'}>
                {formatBytes(used)} / {formatBytes(total)} · {formatBytes(avail)} free
            </span>
        </div>
    </div>
);

const DiskCard = ({ disks, captureBytes, isFetching, refetch }) => (
    <PanelCard title={'Storage'} icon={'hard-drive'} refetch={refetch} isFetching={isFetching}>
        {(disks ?? []).map((d) => (
            <UsageBar
                key={d.label}
                label={d.label}
                mount={d.mount}
                used={d.usedBytes}
                total={d.totalBytes}
                avail={d.availBytes}
                pct={d.usePercent}
            />
        ))}
        <div className={'small text-muted mt-2'}>
            Honeypot captures on USB: <span style={{ color: PINK }}>{formatBytes(captureBytes)}</span>
        </div>
    </PanelCard>
);

export default DiskCard;
