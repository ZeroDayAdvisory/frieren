import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { SYSHEALTH_GET_HEALTH } from '@module/feature/helpers/queryKeys.js';

const useHealthQuery = () => (
    useAuthenticatedQuery({
        queryKey: [SYSHEALTH_GET_HEALTH],
        queryFn: () => fetchPost({ module: 'syshealth', action: 'getHealth' }),
        refetchInterval: 10000,
    })
);

export default useHealthQuery;
