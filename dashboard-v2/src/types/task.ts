export interface Task {
  entity_id: string;
  entity_name: string;
  project_id: string;
  assignee: string;
  status: 'todo' | 'doing' | 'hold' | 'done' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'dev' | 'bug' | 'strategy' | 'research' | 'ops' | 'meeting' | null;
  start_date: string;
  due: string;
  tags: string[];
  estimated_hours: number | null;
  actual_hours: number | null;
  created: string;
  updated: string;
}
