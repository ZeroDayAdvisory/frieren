import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { RADIOMON_GET_STATUS } from '@module/feature/helpers/queryKeys.js';

const POLL_MS = 1500;

const useRadioStatusQuery = () => (
    useAuthenticatedQuery({
        queryKey: [RADIOMON_GET_STATUS],
        queryFn: () => fetchPost({ module: 'radiomon', action: 'getStatus' }),
        refetchInterval: POLL_MS,
    })
);

export default useRadioStatusQuery;
