"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { SearchSession, SearchFiltersSnapshot } from "@/types/search";
import { FilterState } from "@/types/video";

const MAX_HISTORY_ITEMS = 20;
const STORAGE_KEY = "search-history";

interface UseSearchHistoryReturn {
  sessions: SearchSession[];
  addSession: (query: string, resultCount: number, filters?: FilterState) => void;
  removeSession: (sessionId: string) => void;
  clearHistory: () => void;
  getRecentQueries: (limit?: number) => string[];
  findSession: (query: string) => SearchSession | undefined;
}

/**
 * Hook for managing search history
 *
 * @returns Search history management functions
 */
export function useSearchHistory(): UseSearchHistoryReturn {
  const [sessions, setSessions] = useLocalStorage<SearchSession[]>(
    STORAGE_KEY,
    []
  );

  // Add a new search session
  const addSession = useCallback(
    (query: string, resultCount: number, filters?: FilterState) => {
      if (!query.trim()) return;

      const normalizedQuery = query.trim().toLowerCase();

      // Create filter snapshot if filters provided
      const filtersSnapshot: SearchFiltersSnapshot | undefined = filters
        ? {
            period: filters.period,
            channel: filters.channel,
            minViews: filters.minViews,
          }
        : undefined;

      const newSession: SearchSession = {
        id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query: normalizedQuery,
        timestamp: new Date().toISOString(),
        resultCount,
        filters: filtersSnapshot,
      };

      setSessions((prev) => {
        // Remove duplicate queries (keep only the newest)
        const filtered = prev.filter(
          (s) => s.query.toLowerCase() !== normalizedQuery
        );

        // Add new session at the beginning
        const updated = [newSession, ...filtered];

        // Limit to max items
        return updated.slice(0, MAX_HISTORY_ITEMS);
      });
    },
    [setSessions]
  );

  // Remove a specific session
  const removeSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    },
    [setSessions]
  );

  // Clear all history
  const clearHistory = useCallback(() => {
    setSessions([]);
  }, [setSessions]);

  // Get recent unique queries
  const getRecentQueries = useCallback(
    (limit: number = 5): string[] => {
      const uniqueQueries = new Set<string>();
      const result: string[] = [];

      for (const session of sessions) {
        if (!uniqueQueries.has(session.query) && result.length < limit) {
          uniqueQueries.add(session.query);
          result.push(session.query);
        }
      }

      return result;
    },
    [sessions]
  );

  // Find session by query
  const findSession = useCallback(
    (query: string): SearchSession | undefined => {
      const normalizedQuery = query.trim().toLowerCase();
      return sessions.find((s) => s.query.toLowerCase() === normalizedQuery);
    },
    [sessions]
  );

  return {
    sessions,
    addSession,
    removeSession,
    clearHistory,
    getRecentQueries,
    findSession,
  };
}

/**
 * Get search suggestions based on history and current query
 *
 * @param sessions - Search history sessions
 * @param currentQuery - Current search query
 * @param limit - Maximum suggestions to return
 * @returns Array of suggested queries
 */
export function getSearchSuggestions(
  sessions: SearchSession[],
  currentQuery: string,
  limit: number = 5
): string[] {
  if (!currentQuery.trim()) return [];

  const normalizedQuery = currentQuery.trim().toLowerCase();
  const suggestions: string[] = [];
  const seen = new Set<string>();

  for (const session of sessions) {
    if (suggestions.length >= limit) break;

    const sessionQuery = session.query.toLowerCase();
    if (
      sessionQuery.includes(normalizedQuery) &&
      sessionQuery !== normalizedQuery &&
      !seen.has(sessionQuery)
    ) {
      seen.add(sessionQuery);
      suggestions.push(session.query);
    }
  }

  return suggestions;
}
