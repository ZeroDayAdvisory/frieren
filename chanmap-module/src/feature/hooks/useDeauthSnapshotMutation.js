/*
 * Project: Frieren Framework
 * Module: Channel Map (ZeroDay Advisory)
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
import { useMutation } from '@tanstack/react-query';
import { fetchPost } from '@src/services/fetchService.js';

const useDeauthSnapshotMutation = () => useMutation({
    mutationFn: () => fetchPost({ module: 'chanmap', action: 'getDeauthSnapshot' }),
});

export default useDeauthSnapshotMutation;
