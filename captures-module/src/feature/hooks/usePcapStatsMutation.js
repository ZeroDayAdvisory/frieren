import { useMutation } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';

const usePcapStatsMutation = () => useMutation({
    mutationFn: (file) => fetchPost({ module: 'captures', action: 'getPcapStats', file }),
});

export default usePcapStatsMutation;
