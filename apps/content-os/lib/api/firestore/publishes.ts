/**
 * Firestore Queries: contentos_publishes
 * Handles published content data for retro and performance dashboards
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { FIRESTORE_ROOT } from '@/lib/firebase/config';
import { serializeQuerySnapshot } from '@/lib/firebase/serializer';

export interface PublishesFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

/**
 * Get publishes (one-time fetch for queryFn)
 */
export async function getPublishes(filters?: PublishesFilters) {
  const publishesRef = collection(db, `${FIRESTORE_ROOT}/contentos_publishes`);

  const constraints: QueryConstraint[] = [];

  if (filters?.startDate) {
    constraints.push(where('publishedAt', '>=', Timestamp.fromDate(filters.startDate)));
  }

  if (filters?.endDate) {
    constraints.push(where('publishedAt', '<=', Timestamp.fromDate(filters.endDate)));
  }

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('publishedAt', 'desc'));

  const q = query(publishesRef, ...constraints);
  const snapshot = await getDocs(q);

  return serializeQuerySnapshot(snapshot);
}

/**
 * Subscribe to publishes (real-time updates)
 */
export function subscribeToPublishes(
  filters: PublishesFilters,
  onData: (data: any[]) => void,
  onError: (error: Error) => void
) {
  const publishesRef = collection(db, `${FIRESTORE_ROOT}/contentos_publishes`);

  const constraints: QueryConstraint[] = [];

  if (filters?.startDate) {
    constraints.push(where('publishedAt', '>=', Timestamp.fromDate(filters.startDate)));
  }

  if (filters?.endDate) {
    constraints.push(where('publishedAt', '<=', Timestamp.fromDate(filters.endDate)));
  }

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('publishedAt', 'desc'));

  const q = query(publishesRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const data = serializeQuerySnapshot(snapshot);
      onData(data);
    },
    onError
  );
}
