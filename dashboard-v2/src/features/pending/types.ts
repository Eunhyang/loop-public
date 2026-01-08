export interface PendingReview {
  id: string;
  entity_type: 'Task' | 'Project' | 'Track' | 'Condition' | 'Hypothesis';
  entity_id: string;
  entity_name: string;
  status: 'pending' | 'approved' | 'rejected';
  suggested_fields: Record<string, unknown>;
  reasoning?: Record<string, string>;
  source_workflow?: string;
  run_id?: string;
  created_at: string;
  audit_log_path?: string;
}

export type PendingStatus = 'pending' | 'approved' | 'rejected';

// API Request Types
export interface ApproveRequestBody {
  modified_fields?: Record<string, unknown>;
}

export interface RejectRequestBody {
  reason: string;
}

// API Response Types
export interface GetPendingReviewsResponse {
  reviews: PendingReview[];
}
