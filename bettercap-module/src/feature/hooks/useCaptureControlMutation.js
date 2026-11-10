import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import { PROBETRACKER_GET_STATUS, PROBETRACKER_GET_PROBES } from '@module/feature/helpers/queryKeys.js';

export const useStartCaptureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (iface) => fetchPost({ module: 'probetracker', action: 'startCapture', iface }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [PROBETRACKER_GET_STATUS] }),
    });
};

export const useStopCaptureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => fetchPost({ module: 'probetracker', action: 'stopCapture' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [PROBETRACKER_GET_STATUS] }),
    });
};

export const useClearProbesMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => fetchPost({ module: 'probetracker', action: 'clearProbes' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PROBETRACKER_GET_PROBES] });
        },
    });
};
