import { useEffect, useRef } from 'react';

/**
 * Derives a frames/sec figure per adapter from the daemon's cumulative
 * frames_captured counter. Tracks the previous poll's snapshot via a ref
 * updated in an effect (runs once per committed render, after the value
 * used for this render's diff was already read) rather than inside a
 * React Query `select`, which TanStack may invoke speculatively more than
 * once per real data update and would corrupt a ref mutated there.
 */
const useAdaptersWithFps = (adapters) => {
    const prevRef = useRef(null);
    const now = Date.now();
    const prev = prevRef.current;

    const withFps = (adapters ?? []).map((a) => {
        const last = prev?.[a.name];
        let fps = 0;
        if (last && now > last.t) {
            const dFrames = a.frames_captured - last.frames;
            const dSec = (now - last.t) / 1000;
            fps = dFrames > 0 ? dFrames / dSec : 0;
        }
        return { ...a, fps };
    });

    useEffect(() => {
        const next = {};
        (adapters ?? []).forEach((a) => {
            next[a.name] = { frames: a.frames_captured, t: Date.now() };
        });
        prevRef.current = next;
    }, [adapters]);

    return withFps;
};

export default useAdaptersWithFps;
