import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import { LIVECAP_GET_STATUS, LIVECAP_GET_PACKETS } from '@module/feature/helpers/queryKeys.js';

export const useStartLivecapMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ iface, filter }) => fetchPost({ module: 'livecap', action: 'startCapture', iface, filter }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [LIVECAP_GET_STATUS] }),
    });
};

export const useStopLivecapMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => fetchPost({ module: 'livecap', action: 'stopCapture' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [LIVECAP_GET_STATUS] }),
    });
};

export const useClearPacketsMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => fetchPost({ module: 'livecap', action: 'clearPackets' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [LIVECAP_GET_PACKETS] }),
    });
};
