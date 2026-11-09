import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { PROBETRACKER_GET_STATUS } from '@module/feature/helpers/queryKeys.js';

const useCaptureStatusQuery = () => (
    useAuthenticatedQuery({
        queryKey: [PROBETRACKER_GET_STATUS],
        queryFn: () => fetchPost({ module: 'probetracker', action: 'getCaptureStatus' }),
        refetchInterval: 3000,
    })
);

export default useCaptureStatusQuery;
