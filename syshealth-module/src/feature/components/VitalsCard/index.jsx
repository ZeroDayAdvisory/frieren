/*
 * Project: Frieren Framework
 * Module: System Health (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import PanelCard from '@src/components/PanelCard';
import { PINK, BLUE } from '@module/colors';
import { formatBytes, formatUptime } from '@module/feature/helpers/format';

const tempColor = (t) => {
    if (t === null) return 'rgba(255,255,255,0.4)';
    if (t >= 80) return PINK;
    if (t >= 65) return '#facc15';
    return '#4ade80';
};

const Stat = ({ label, value, color }) => (
    <div style={{ minWidth: 90 }}>
        <div className={'text-muted'} style={{ fontSize: '0.7rem' }}>{label}</div>
        <strong style={{ color: color ?? BLUE, fontSize: '1.1rem' }}>{value}</strong>
    </div>
);

const VitalsCard = ({ data, isFetching, refetch }) => {
    const mem = data?.memory;
    const load = data?.load;

    return (
        <PanelCard title={'Vitals'} icon={'activity'} refetch={refetch} isFetching={isFetching}>
            <div className={'d-flex gap-4 flex-wrap'}>
                <Stat
                    label={'SoC Temp'}
                    value={data?.temp !== null && data?.temp !== undefined ? `${data.temp}°C` : '—'}
                    color={tempColor(data?.temp ?? null)}
                />
                <Stat
                    label={'Memory'}
                    value={mem ? `${mem.usePercent}%` : '—'}
                    color={mem && mem.usePercent >= 85 ? PINK : BLUE}
                />
                <Stat label={'Uptime'} value={formatUptime(data?.uptime)} />
                <Stat
                    label={'Load (1/5/15m)'}
                    value={load ? `${load['1m']} / ${load['5m']} / ${load['15m']}` : '—'}
                />
            </div>
            {mem && (
                <div className={'small text-muted mt-3'}>
                    RAM: {formatBytes(mem.usedBytes)} used / {formatBytes(mem.totalBytes)} total
                    · {formatBytes(mem.availBytes)} available
                </div>
            )}
        </PanelCard>
    );
};

export default VitalsCard;
