export interface ExpectedImpact {
  tier: 'strategic' | 'enabling' | 'operational';
  impact_magnitude: 'high' | 'mid' | 'low';
  confidence: number; // 0.0 ~ 1.0
  contributes?: string[];
  rationale?: string;
}

export interface TrackContribution {
  to: string;  // track ID (e.g., "trk-6")
  weight: number; // 0.0 ~ 1.0
  rationale?: string;
}

/**
 * Realized Impact (B Score) - SSOT compliant
 * Sources:
 * - impact_model_config.yml:90-108 (score calculation fields)
 * - schema_constants.yaml:522-531 (decision fields)
 */
export interface RealizedImpact {
  // === Decision fields (schema_constants.yaml) ===
  verdict: 'pending' | 'go' | 'no-go' | 'pivot' | null;
  outcome: 'supported' | 'rejected' | 'inconclusive' | null;
  evidence_links: string[];
  decided: string | null;  // YYYY-MM-DD
  window_id: string | null;  // YYYY-MM | YYYY-QN | YYYY-HN
  time_range: string | null;  // YYYY-MM-DD..YYYY-MM-DD
  metrics_snapshot: Record<string, number>;

  // === Score calculation fields (impact_model_config.yml) ===
  normalized_delta: number | null;  // 0.0 ~ 1.0 (target achievement ratio)
  evidence_strength: 'strong' | 'medium' | 'weak' | null;  // multiplier key
  attribution_share: number | null;  // 0.0 ~ 1.0 (project contribution)
  learning_value: 'high' | 'medium' | 'low' | null;  // information gain
}

export interface Project {
  entity_id: string;
  entity_name: string;
  owner: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  parent_id: string;
  program_id: string | null;
  created: string;
  updated: string;
  deadline: string | null;
  priority_flag?: string;
  tags: string[];
  // Optional relationship fields for sidebar filtering
  conditions_3y?: string[];
  validates?: string[];
  primary_hypothesis_id?: string | null;
  // Impact fields
  expected_impact?: ExpectedImpact;
  realized_impact?: RealizedImpact;
  track_contributes?: TrackContribution[];
}
