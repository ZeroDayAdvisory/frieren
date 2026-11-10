import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { PROBETRACKER_GET_PROBES } from '@module/feature/helpers/queryKeys.js';

const useProbesQuery = () => (
    useAuthenticatedQuery({
        queryKey: [PROBETRACKER_GET_PROBES],
        queryFn: () => fetchPost({ module: 'probetracker', action: 'getProbes' }),
        refetchInterval: 5000,
    })
);

export default useProbesQuery;
