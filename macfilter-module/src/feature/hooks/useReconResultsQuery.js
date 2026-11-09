/*
 * Project: Frieren Framework
 * Module: MAC Allow-List (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';

const MACFILTER_GET_RECON_RESULTS = 'macfilter.getReconResults';

/**
 * Fetches the latest recon scan results, enriched with OUI vendor names.
 *
 * @return {Object} The result of the query.
 */
const useReconResultsQuery = () => (
    useAuthenticatedQuery({
        queryKey: [MACFILTER_GET_RECON_RESULTS],
        queryFn: () => fetchPost({
            module: 'macfilter',
            action: 'getReconResults',
        }),
    })
);

export default useReconResultsQuery;
