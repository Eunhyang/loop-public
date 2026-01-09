import { httpClient } from '@/services/http';
import type { EntityHistoryResponse } from './types';

export const activityApi = {
  /**
   * Get entity edit history from audit log
   *
   * Uses existing /api/audit/entity/{entity_id} endpoint
   */
  getEntityHistory: (entityId: string) =>
    httpClient.get<EntityHistoryResponse>(`/api/audit/entity/${entityId}`),
};
