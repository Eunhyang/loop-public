/**
 * Firestore Data Serializer
 * Converts Firestore-specific types to JSON-serializable POJOs
 * Required for React Query caching and SSR compatibility
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Recursively serialize Firestore data
 * - Timestamp → ISO string
 * - undefined → removed
 * - null → preserved
 * - GeoPoint → { lat, lng }
 * - Nested objects/arrays → recursively serialized
 */
export function serializeFirestoreData<T = any>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Timestamp
  if (data instanceof Timestamp) {
    return data.toDate().toISOString() as any;
  }

  // Handle GeoPoint (if used)
  if (data.latitude !== undefined && data.longitude !== undefined) {
    return { lat: data.latitude, lng: data.longitude } as any;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData) as any;
  }

  // Handle Objects
  if (typeof data === 'object') {
    const serialized: any = {};

    for (const key in data) {
      if (data[key] !== undefined) {
        serialized[key] = serializeFirestoreData(data[key]);
      }
      // Skip undefined fields (removed from output)
    }

    return serialized;
  }

  // Primitives (string, number, boolean)
  return data;
}

/**
 * Serialize a Firestore document snapshot
 */
export function serializeDocument(doc: any) {
  if (!doc.exists()) {
    return null;
  }

  return serializeFirestoreData({
    id: doc.id,
    ...doc.data(),
  });
}

/**
 * Serialize a Firestore query snapshot
 */
export function serializeQuerySnapshot(snapshot: any) {
  return snapshot.docs.map((doc: any) => serializeDocument(doc));
}
