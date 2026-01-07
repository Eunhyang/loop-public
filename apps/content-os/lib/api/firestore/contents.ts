/**
 * Firestore Queries: contentos_contents
 * Handles content opportunities and video explorer data
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { FIRESTORE_ROOT } from '@/lib/firebase/config';
import { serializeQuerySnapshot } from '@/lib/firebase/serializer';

export interface ContentsFilters {
  status?: string;
  orderByField?: 'finalScore' | 'createdAt' | 'updatedAt';
  limitCount?: number;
}

/**
 * Get contents (one-time fetch for queryFn)
 */
export async function getContents(filters?: ContentsFilters) {
  const contentsRef = collection(db, `${FIRESTORE_ROOT}/contentos_contents`);

  const constraints: QueryConstraint[] = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  const orderField = filters?.orderByField || 'finalScore';
  constraints.push(orderBy(orderField, 'desc'));
  constraints.push(orderBy('createdAt', 'desc')); // Secondary sort

  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  const q = query(contentsRef, ...constraints);
  const snapshot = await getDocs(q);

  return serializeQuerySnapshot(snapshot);
}

/**
 * Subscribe to contents (real-time updates)
 * Returns unsubscribe function
 */
export function subscribeToContents(
  filters: ContentsFilters,
  onData: (data: any[]) => void,
  onError: (error: Error) => void
) {
  const contentsRef = collection(db, `${FIRESTORE_ROOT}/contentos_contents`);

  const constraints: QueryConstraint[] = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  const orderField = filters?.orderByField || 'finalScore';
  constraints.push(orderBy(orderField, 'desc'));
  constraints.push(orderBy('createdAt', 'desc'));

  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  const q = query(contentsRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const data = serializeQuerySnapshot(snapshot);
      onData(data);
    },
    onError
  );
}
