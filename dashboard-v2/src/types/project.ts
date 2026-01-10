export interface ExpectedImpact {
  tier: 'strategic' | 'tactical' | 'operational';
  impact_magnitude: 'high' | 'medium' | 'low';
  confidence: number; // 0.0 ~ 1.0
  rationale?: string;
}

export interface TrackContribution {
  to: string;  // track ID (e.g., "trk-6")
  weight: number; // 0.0 ~ 1.0
  rationale?: string;
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
  track_contributes?: TrackContribution[];
}
