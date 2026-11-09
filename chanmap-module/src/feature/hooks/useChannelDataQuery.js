import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { CHANMAP_GET_CHANNEL_DATA } from '@module/feature/helpers/queryKeys.js';

const useChannelDataQuery = () => (
    useAuthenticatedQuery({
        queryKey: [CHANMAP_GET_CHANNEL_DATA],
        queryFn: () => fetchPost({ module: 'chanmap', action: 'getChannelData' }),
        refetchInterval: 30000,
    })
);

export default useChannelDataQuery;
