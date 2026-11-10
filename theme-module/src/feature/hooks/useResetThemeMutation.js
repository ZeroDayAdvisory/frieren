/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import { THEME_GET } from '@module/feature/helpers/queryKeys.js';

const useResetThemeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => fetchPost({ module: 'theme', action: 'resetTheme' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [THEME_GET] }),
    });
};

export default useResetThemeMutation;
