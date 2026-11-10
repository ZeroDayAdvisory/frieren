import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import { CAPTURES_GET_SESSIONS } from '@module/feature/helpers/queryKeys.js';

const useDeleteSessionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dir) => fetchPost({ module: 'captures', action: 'deleteSession', dir }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [CAPTURES_GET_SESSIONS] }),
    });
};

export default useDeleteSessionMutation;
