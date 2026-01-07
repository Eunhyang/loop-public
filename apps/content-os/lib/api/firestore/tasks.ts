/**
 * Firestore Queries: vault_tasks
 * Handles task pipeline data
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { FIRESTORE_ROOT } from '@/lib/firebase/config';
import { serializeQuerySnapshot } from '@/lib/firebase/serializer';

export interface TasksFilters {
  projectId?: string;
  status?: string;
}

/**
 * Get tasks (one-time fetch for queryFn)
 */
export async function getTasks(filters?: TasksFilters) {
  const tasksRef = collection(db, `${FIRESTORE_ROOT}/vault_tasks`);

  const constraints: QueryConstraint[] = [];

  if (filters?.projectId) {
    constraints.push(where('projectId', '==', filters.projectId));
  }

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(tasksRef, ...constraints);
  const snapshot = await getDocs(q);

  return serializeQuerySnapshot(snapshot);
}

/**
 * Subscribe to tasks (real-time updates)
 */
export function subscribeToTasks(
  filters: TasksFilters,
  onData: (data: any[]) => void,
  onError: (error: Error) => void
) {
  const tasksRef = collection(db, `${FIRESTORE_ROOT}/vault_tasks`);

  const constraints: QueryConstraint[] = [];

  if (filters?.projectId) {
    constraints.push(where('projectId', '==', filters.projectId));
  }

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(tasksRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const data = serializeQuerySnapshot(snapshot);
      onData(data);
    },
    onError
  );
}
