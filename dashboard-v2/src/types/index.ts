import type { Task } from './task';
import type { Project } from './project';

export * from './task';
export * from './project';

export interface Member {
  id: string;
  name: string;
  role: string;
}

export interface Track {
  entity_id: string;
  entity_name: string;
  status: string;
}

export interface Condition {
  entity_id: string;
  entity_name: string;
  status: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DashboardInitResponse {
  constants: Record<string, any>;
  members: Member[];
  tracks: Track[];
  conditions: Condition[];
  projects: Project[];
  tasks: Task[];
  pending_badge_count: number;
  user: User;
}

export interface APIError {
  message: string;
  status: number;
  detail?: string;
}
