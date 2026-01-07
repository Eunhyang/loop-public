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

export interface TaskUpdatePayload {
  entity_id: string; // ID는 필수
  entity_name?: string;
  project_id?: string;
  assignee?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  type?: Task['type'];
  due?: string;
  description?: string; // Notes/Description
}
