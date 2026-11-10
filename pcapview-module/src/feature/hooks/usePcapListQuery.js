import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { PCAPVIEW_GET_PCAP_LIST } from '@module/feature/helpers/queryKeys.js';

const usePcapListQuery = () => (
    useAuthenticatedQuery({
        queryKey: [PCAPVIEW_GET_PCAP_LIST],
        queryFn: () => fetchPost({ module: 'pcapview', action: 'getPcapList' }),
        refetchInterval: 20000,
    })
);

export default usePcapListQuery;
