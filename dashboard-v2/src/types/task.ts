export interface Task {
    entity_id: string;
    entity_name: string;
    project_id: string;
    assignee: string;
    status: 'todo' | 'doing' | 'hold' | 'done' | 'blocked';
    priority: 'critical' | 'high' | 'medium' | 'low';
    type: 'dev' | 'bug' | 'strategy' | 'research' | 'ops' | 'meeting' | null;
    start_date: string | null;
    due: string | null;  // Updated to allow null
    tags: string[];
    estimated_hours: number | null;
    actual_hours: number | null;
    created: string;
    updated: string;
    notes?: string;
    _body?: string; // Legacy body content
}

export interface TaskUpdatePayload {
    entity_id: string; // ID는 필수
    entity_name?: string;
    project_id?: string;
    assignee?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    type?: Task['type'];
    due?: string | null; // Updated to allow null
    description?: string; // Notes/Description
}
