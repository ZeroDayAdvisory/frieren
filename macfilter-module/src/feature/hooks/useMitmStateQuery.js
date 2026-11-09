/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { MACFILTER_GET_MITM_STATE } from '@module/feature/helpers/queryKeys.js';

const useMitmStateQuery = () => (
    useAuthenticatedQuery({
        queryKey: [MACFILTER_GET_MITM_STATE],
        queryFn: () => fetchPost({
            module: 'macfilter',
            action: 'getMitmState',
        }),
    })
);

export default useMitmStateQuery;
