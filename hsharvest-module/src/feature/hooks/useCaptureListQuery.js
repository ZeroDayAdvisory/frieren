import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { HSHARVEST_LIST_CAPTURES } from '@module/feature/helpers/queryKeys.js';

const useCaptureListQuery = () => (
    useAuthenticatedQuery({
        queryKey: [HSHARVEST_LIST_CAPTURES],
        queryFn: () => fetchPost({ module: 'hsharvest', action: 'listCaptures' }),
    })
);

export default useCaptureListQuery;
