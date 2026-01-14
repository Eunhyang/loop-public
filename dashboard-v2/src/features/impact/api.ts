import { httpClient } from '@/services/http';
import type { ExpectedImpact } from '@/types';

export type ExpectedMode = 'preview' | 'pending' | 'apply';

export interface ExpectedInferRequest {
  project_id: string;
  mode?: ExpectedMode;
  previous_output?: ExpectedImpact;
  user_feedback?: string;
  actor?: string;
  source_workflow?: string;
}

export interface ValidationError {
  field: string;
  error: string;
}

export interface ExpectedInferResponse {
  project_id: string;
  output?: ExpectedImpact;
  validation_errors: ValidationError[];
  calculated_fields?: Record<string, unknown>;
  success: boolean;
  run_id?: string;
  iteration?: number;
  diff?: Record<string, unknown>;
  diff_summary?: string;
}

export interface HypothesisInferRequest {
  project_id: string;
  mode?: 'preview' | 'pending';
  previous_output?: Record<string, unknown>;
  user_feedback?: string;
  actor?: string;
  source_workflow?: string;
}

export interface HypothesisInferResponse {
  ok: boolean;
  run_id: string;
  hypothesis_draft?: Record<string, unknown>;
  pending?: Record<string, unknown> | null;
  error?: string | null;
  iteration?: number | null;
}

export const impactApi = {
  inferExpectedImpact: (body: ExpectedInferRequest) =>
    httpClient.post<ExpectedInferResponse>('/api/mcp/impact/expected/infer', body).then(res => res.data),
  inferHypothesisDraft: (body: HypothesisInferRequest) =>
    httpClient.post<HypothesisInferResponse>('/api/ai/infer/hypothesis_draft', body).then(res => res.data),
};
