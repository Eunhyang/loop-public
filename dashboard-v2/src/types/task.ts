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
    // New fields for Relations/Links
    links?: Array<{ label: string; url: string }>;
    validates?: string[];
    conditions_3y?: string[];
    _path?: string;
    parent_id?: string;
    outgoing_relations?: string[];
}

export interface TaskUpdatePayload {
    entity_id: string; // ID는 필수
    entity_name?: string;
    project_id?: string;
    assignee?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    type?: Task['type'];
    start_date?: string | null; // New: Start Date
    due?: string | null; // Updated to allow null
    description?: string; // Notes/Description
    links?: Array<{ label: string; url: string }>; // New: Links
}
