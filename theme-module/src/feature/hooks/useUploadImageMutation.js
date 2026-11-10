/*
 * Project: Frieren Framework
 * Module: Theme Customizer (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useMutation } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';

const useUploadImageMutation = () => useMutation({
    mutationFn: ({ kind, dataUri }) => fetchPost({ module: 'theme', action: 'uploadImage', kind, dataUri }),
});

export default useUploadImageMutation;
