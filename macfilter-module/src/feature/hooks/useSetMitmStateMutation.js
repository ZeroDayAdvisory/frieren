/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import { MACFILTER_GET_MITM_STATE } from '@module/feature/helpers/queryKeys.js';

const useSetMitmStateMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (active) => fetchPost({
            module: 'macfilter',
            action: 'setMitmState',
            active: active ? 1 : 0,
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [MACFILTER_GET_MITM_STATE] }),
    });
};

export default useSetMitmStateMutation;
