import { httpClient } from '@/services/http';

export const pendingApi = {
    getPendingReviews: () =>
        httpClient.get('/api/pending'),
};
