/**
 * YouTube Studio Snapshot Storage
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * IndexedDB operations for snapshot persistence
 */

import { YouTubeSnapshot, SnapshotStorageStats } from '@/types/youtube-snapshot';

/**
 * IndexedDB configuration
 */
const DB_NAME = 'ContentOSSnapshots';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';

/**
 * Initialize IndexedDB
 */
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'snapshotDate' });

        // Create index for ordering by timestamp
        store.createIndex('captureTimestamp', 'captureTimestamp', { unique: false });
      }
    };
  });
}

/**
 * Save snapshot to IndexedDB
 *
 * @param snapshot - Snapshot to save
 * @param overwrite - If true, overwrite existing snapshot for same date
 * @returns Success status
 */
export async function saveSnapshot(
  snapshot: YouTubeSnapshot,
  overwrite: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Check if snapshot exists for this date
      const getRequest = store.get(snapshot.snapshotDate);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;

        if (existing && !overwrite) {
          resolve({
            success: false,
            error: `Snapshot already exists for ${snapshot.snapshotDate}. Use overwrite option to replace.`,
          });
          return;
        }

        // Save or update snapshot
        const putRequest = store.put(snapshot);

        putRequest.onsuccess = () => {
          resolve({ success: true });
        };

        putRequest.onerror = () => {
          resolve({
            success: false,
            error: putRequest.error?.message || 'Failed to save snapshot',
          });
        };
      };

      getRequest.onerror = () => {
        resolve({
          success: false,
          error: getRequest.error?.message || 'Failed to check existing snapshot',
        });
      };

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get snapshot by date
 *
 * @param date - Snapshot date (YYYY-MM-DD)
 * @returns Snapshot or null if not found
 */
export async function getSnapshot(date: string): Promise<YouTubeSnapshot | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(date);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get snapshot:', error);
    return null;
  }
}

/**
 * Get latest snapshot
 *
 * @returns Latest snapshot or null if no snapshots exist
 */
export async function getLatestSnapshot(): Promise<YouTubeSnapshot | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('captureTimestamp');

      // Open cursor in descending order
      const request = index.openCursor(null, 'prev');

      request.onsuccess = () => {
        const cursor = request.result;
        resolve(cursor ? cursor.value : null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get latest snapshot:', error);
    return null;
  }
}

/**
 * List all snapshot dates
 *
 * @returns Array of dates in descending order (newest first)
 */
export async function listSnapshotDates(): Promise<string[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => {
        const dates = (request.result as string[]).sort().reverse();
        resolve(dates);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to list snapshot dates:', error);
    return [];
  }
}

/**
 * Delete snapshot by date
 *
 * @param date - Snapshot date (YYYY-MM-DD)
 * @returns Success status
 */
export async function deleteSnapshot(date: string): Promise<boolean> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(date);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to delete snapshot:', error);
    return false;
  }
}

/**
 * Get storage statistics
 *
 * @returns Storage stats
 */
export async function getStorageStats(): Promise<SnapshotStorageStats> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const snapshots = request.result as YouTubeSnapshot[];

        if (snapshots.length === 0) {
          resolve({
            totalSnapshots: 0,
            oldestDate: null,
            latestDate: null,
            storageUsageBytes: 0,
          });
          return;
        }

        // Calculate storage usage (rough estimate)
        const storageUsageBytes = JSON.stringify(snapshots).length;

        // Get date range
        const dates = snapshots.map((s) => s.snapshotDate).sort();

        resolve({
          totalSnapshots: snapshots.length,
          oldestDate: dates[0],
          latestDate: dates[dates.length - 1],
          storageUsageBytes,
        });
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return {
      totalSnapshots: 0,
      oldestDate: null,
      latestDate: null,
      storageUsageBytes: 0,
    };
  }
}

/**
 * Clear all snapshots (use with caution)
 */
export async function clearAllSnapshots(): Promise<boolean> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to clear snapshots:', error);
    return false;
  }
}
