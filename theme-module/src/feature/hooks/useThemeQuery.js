/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import useAuthenticatedQuery from '@src/hooks/useAuthenticatedQuery.js';
import { fetchPost } from '@src/services/fetchService.js';
import { THEME_GET } from '@module/feature/helpers/queryKeys.js';

const useThemeQuery = () => (
    useAuthenticatedQuery({
        queryKey: [THEME_GET],
        queryFn: () => fetchPost({ module: 'theme', action: 'getTheme' }),
    })
);

export default useThemeQuery;
