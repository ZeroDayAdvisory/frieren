import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { CAPTURES_GET_LIVE_CLIENTS } from '@module/feature/helpers/queryKeys.js';

const useLiveClientsQuery = () => (
    useAuthenticatedQuery({
        queryKey: [CAPTURES_GET_LIVE_CLIENTS],
        queryFn: () => fetchPost({ module: 'captures', action: 'getLiveClients' }),
        refetchInterval: 5000,
    })
);

export default useLiveClientsQuery;
