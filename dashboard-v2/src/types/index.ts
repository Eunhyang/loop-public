import type { Task } from './task';
import type { Project } from './project';
import type { Constants } from './constants';

export * from './task';
export * from './project';
export * from './constants';

export interface Member {
  id: string;
  name: string;
  role: string;
  active?: boolean; // undefined or true = active, false = inactive
}

export interface Track {
  entity_id: string;
  entity_name: string;
  status: string;
}

export interface Program {
  entity_id: string;
  entity_name: string;
  program_type: string;
  owner: string;
  status: string;
  description?: string;
}

export interface Hypothesis {
  entity_id: string;
  entity_name: string;
  status: string; // Assuming status exists, similar to Track/Condition
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
  constants: Constants;
  members: Member[];
  tracks: Track[];
  programs: Program[];
  hypotheses: Hypothesis[];
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
