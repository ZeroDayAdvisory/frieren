import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { CAPTURES_GET_SESSIONS } from '@module/feature/helpers/queryKeys.js';

const useSessionsQuery = () => (
    useAuthenticatedQuery({
        queryKey: [CAPTURES_GET_SESSIONS],
        queryFn: () => fetchPost({ module: 'captures', action: 'getSessions' }),
        refetchInterval: 15000,
    })
);

export default useSessionsQuery;
