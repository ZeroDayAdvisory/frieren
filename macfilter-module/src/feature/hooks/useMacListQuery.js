/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { MACFILTER_GET_LIST } from '@module/feature/helpers/queryKeys.js';

/**
 * Fetches the current MAC allow-list.
 *
 * @return {Object} The result of the query.
 */
const useMacListQuery = () => (
    useAuthenticatedQuery({
        queryKey: [MACFILTER_GET_LIST],
        queryFn: () => fetchPost({
            module: 'macfilter',
            action: 'getList',
        }),
    })
);

export default useMacListQuery;
