export interface Project {
  entity_id: string;
  entity_name: string;
  owner: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  parent_id: string;
  program_id: string;
  created: string;
  updated: string;
  deadline: string | null;
  priority_flag?: string;
  tags: string[];
  // Optional relationship fields for sidebar filtering
  conditions_3y?: string[];
  validates?: string[];
  primary_hypothesis_id?: string | null;
}
