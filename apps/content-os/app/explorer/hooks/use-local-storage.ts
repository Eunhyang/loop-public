"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "content-os:";

/**
 * Hook for syncing state with localStorage
 *
 * @param key - Storage key (will be prefixed with "content-os:")
 * @param initialValue - Initial value if nothing in storage
 * @returns [value, setValue, removeValue] tuple
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const prefixedKey = `${STORAGE_PREFIX}${key}`;

  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(prefixedKey);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${prefixedKey}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function for previous state pattern
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(prefixedKey, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${prefixedKey}":`, error);
      }
    },
    [prefixedKey, storedValue]
  );

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(prefixedKey);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${prefixedKey}":`, error);
    }
  }, [prefixedKey, initialValue]);

  // Sync with other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === prefixedKey && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch (error) {
          console.warn(`Error parsing storage event for "${prefixedKey}":`, error);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [prefixedKey]);

  return [storedValue, setValue, removeValue];
}

/**
 * Get all content-os storage keys
 */
export function getStorageKeys(): string[] {
  if (typeof window === "undefined") return [];

  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key.replace(STORAGE_PREFIX, ""));
    }
  }
  return keys;
}

/**
 * Clear all content-os storage
 */
export function clearAllStorage(): void {
  if (typeof window === "undefined") return;

  const keys = getStorageKeys();
  keys.forEach((key) => {
    window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  });
}
