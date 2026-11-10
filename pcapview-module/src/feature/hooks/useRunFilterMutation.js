import { useMutation } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';

const useRunFilterMutation = () => useMutation({
    mutationFn: ({ file, filter, mode, limit }) =>
        fetchPost({ module: 'pcapview', action: 'runFilter', file, filter, mode, limit }),
});

export default useRunFilterMutation;
