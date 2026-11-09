/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useQueryClient } from '@tanstack/react-query';
import useAuthenticatedMutation from '@src/hooks/useAuthenticatedMutation.js';
import { fetchPost } from '@src/services/fetchService.js';
import { MACFILTER_GET_LIST } from '@module/feature/helpers/queryKeys.js';

/**
 * Adds a MAC address to the allow-list.
 *
 * @return {Object} The mutation object.
 */
const useAddMacMutation = () => {
    const queryClient = useQueryClient();

    return useAuthenticatedMutation({
        mutationFn: (mac) => fetchPost({
            module: 'macfilter',
            action: 'addMac',
            mac,
        }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [MACFILTER_GET_LIST] }),
    });
};

export default useAddMacMutation;
