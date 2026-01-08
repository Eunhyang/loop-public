import { httpClient } from '@/services/http';
import type { GetPendingReviewsResponse, ApproveRequestBody, RejectRequestBody } from './types';

export const pendingApi = {
    getPendingReviews: () =>
        httpClient.get<GetPendingReviewsResponse>('/api/pending'),

    approve: (id: string, modifiedFields?: Record<string, unknown>) => {
        const body: ApproveRequestBody = modifiedFields ? { modified_fields: modifiedFields } : {};
        return httpClient.post(`/api/pending/${encodeURIComponent(id)}/approve`, body);
    },

    reject: (id: string, reason: string) => {
        const body: RejectRequestBody = { reason };
        return httpClient.post(`/api/pending/${encodeURIComponent(id)}/reject`, body);
    },

    delete: (id: string) =>
        httpClient.delete(`/api/pending/${encodeURIComponent(id)}`),

    deleteBatch: (params: { source_workflow?: string; run_id?: string; status?: string }) => {
        const body: Record<string, string> = {};
        if (params.source_workflow) body.source_workflow = params.source_workflow;
        if (params.run_id) body.run_id = params.run_id;
        if (params.status) body.status = params.status;

        return httpClient.request<{ deleted_count: number; deleted_ids: string[] }>({
            method: 'DELETE',
            url: '/api/pending/batch',
            data: body,
        });
    },
};
