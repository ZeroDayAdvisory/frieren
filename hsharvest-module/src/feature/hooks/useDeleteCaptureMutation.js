import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import { HSHARVEST_LIST_CAPTURES } from '@module/feature/helpers/queryKeys.js';

const useDeleteCaptureMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file) => fetchPost({ module: 'hsharvest', action: 'deleteCapture', file }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [HSHARVEST_LIST_CAPTURES] }),
    });
};

export default useDeleteCaptureMutation;
