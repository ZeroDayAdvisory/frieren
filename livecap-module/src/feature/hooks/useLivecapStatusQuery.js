import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { LIVECAP_GET_STATUS } from '@module/feature/helpers/queryKeys.js';

const useLivecapStatusQuery = () => (
    useAuthenticatedQuery({
        queryKey: [LIVECAP_GET_STATUS],
        queryFn: () => fetchPost({ module: 'livecap', action: 'getStatus' }),
        refetchInterval: 3000,
    })
);

export default useLivecapStatusQuery;
