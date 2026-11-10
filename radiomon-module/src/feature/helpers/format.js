export const freqToChannel = (mhz) => {
    if (!mhz) return '—';
    if (mhz === 2484) return 14;
    if (mhz >= 2412 && mhz <= 2472) return Math.round((mhz - 2412) / 5) + 1;
    if (mhz >= 5000 && mhz < 6000) return Math.round((mhz - 5000) / 5);
    if (mhz >= 5955 && mhz < 7125) return Math.round((mhz - 5950) / 5) + 1;
    return '—';
};

export const band = (mhz) => {
    if (!mhz) return '—';
    if (mhz < 2500) return '2.4 GHz';
    if (mhz < 5950) return '5 GHz';
    return '6 GHz';
};

export const formatBytes = (bytes) => {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i += 1;
    }
    return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

export const formatUptime = (sec) => {
    if (!sec) return '—';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

export const formatBps = (bps) => {
    if (!bps || bps < 1) return '0 B/s';
    if (bps < 1024) return `${bps.toFixed(0)} B/s`;
    if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
    return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
};

export const lifecycleVariant = (state) => {
    switch (state) {
        case 'READY': return 'success';
        case 'INIT': return 'warning';
        case 'ERROR': return 'danger';
        default: return 'secondary';
    }
};
