import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { HSHARVEST_ANALYZE_CAPTURE } from '@module/feature/helpers/queryKeys.js';

const useAnalyzeCaptureQuery = (file) => (
    useAuthenticatedQuery({
        queryKey: [HSHARVEST_ANALYZE_CAPTURE, file],
        queryFn: () => fetchPost({ module: 'hsharvest', action: 'analyzeCapture', file }),
        enabled: !!file,
    })
);

export default useAnalyzeCaptureQuery;
