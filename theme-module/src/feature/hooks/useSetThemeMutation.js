/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';
import { THEME_GET } from '@module/feature/helpers/queryKeys.js';

const useSetThemeMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (theme) => fetchPost({ module: 'theme', action: 'setTheme', theme }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [THEME_GET] }),
    });
};

export default useSetThemeMutation;
