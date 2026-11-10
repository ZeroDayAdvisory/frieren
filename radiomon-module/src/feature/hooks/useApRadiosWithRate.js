import { useEffect, useRef } from 'react';

/**
 * Same previous-value-via-effect pattern as useAdaptersWithFps, but for
 * AP radios: derives rx/tx bytes-per-second from the cumulative sysfs
 * counters.
 */
const useApRadiosWithRate = (apRadios) => {
    const prevRef = useRef(null);
    const now = Date.now();
    const prev = prevRef.current;

    const withRate = (apRadios ?? []).map((r) => {
        const last = prev?.[r.iface];
        let rxBps = 0;
        let txBps = 0;
        if (last && now > last.t) {
            const dSec = (now - last.t) / 1000;
            const dRx = r.rx_bytes - last.rx;
            const dTx = r.tx_bytes - last.tx;
            rxBps = dRx > 0 ? dRx / dSec : 0;
            txBps = dTx > 0 ? dTx / dSec : 0;
        }
        return { ...r, rxBps, txBps };
    });

    useEffect(() => {
        const next = {};
        (apRadios ?? []).forEach((r) => {
            next[r.iface] = { rx: r.rx_bytes, tx: r.tx_bytes, t: Date.now() };
        });
        prevRef.current = next;
    }, [apRadios]);

    return withRate;
};

export default useApRadiosWithRate;
