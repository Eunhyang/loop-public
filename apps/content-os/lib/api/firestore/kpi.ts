/**
 * Firestore Queries: kpi_rollups
 * Handles pre-aggregated KPI data for performance dashboard
 * Note: This is a pre-aggregated collection, no client-side aggregation needed
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { FIRESTORE_ROOT } from '@/lib/firebase/config';
import { serializeQuerySnapshot } from '@/lib/firebase/serializer';

export interface KpiFilters {
  limitCount?: number;
}

/**
 * Get KPI rollups (one-time fetch for queryFn)
 */
export async function getKpiRollups(filters?: KpiFilters) {
  const kpiRef = collection(db, `${FIRESTORE_ROOT}/kpi_rollups`);

  const constraints: QueryConstraint[] = [];

  constraints.push(orderBy('date', 'desc'));

  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  const q = query(kpiRef, ...constraints);
  const snapshot = await getDocs(q);

  return serializeQuerySnapshot(snapshot);
}

/**
 * Subscribe to KPI rollups (real-time updates)
 */
export function subscribeToKpiRollups(
  filters: KpiFilters,
  onData: (data: any[]) => void,
  onError: (error: Error) => void
) {
  const kpiRef = collection(db, `${FIRESTORE_ROOT}/kpi_rollups`);

  const constraints: QueryConstraint[] = [];

  constraints.push(orderBy('date', 'desc'));

  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  const q = query(kpiRef, ...constraints);

  return onSnapshot(
    q,
    (snapshot) => {
      const data = serializeQuerySnapshot(snapshot);
      onData(data);
    },
    onError
  );
}
