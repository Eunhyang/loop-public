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
};
