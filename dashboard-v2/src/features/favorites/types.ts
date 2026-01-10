export type EntityType = 'task' | 'project' | 'program';

export interface FavoritesStorage {
  _schemaVersion: number;
  entityIds: {
    task: string[];
    project: string[];
    program: string[];
  };
}
