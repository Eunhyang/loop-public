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
  tags: string[];
}
