import { FilterState } from "./video";

// Search session for tracking search history
export interface SearchSession {
  id: string;
  query: string;
  timestamp: string; // ISO date string
  resultCount: number;
  filters?: SearchFiltersSnapshot;
}

// Snapshot of filters at the time of search
export interface SearchFiltersSnapshot {
  period: string;
  channel: string;
  minViews: number;
}

// Search history management
export interface SearchHistory {
  sessions: SearchSession[];
  maxItems: number; // maximum number of sessions to keep
}

// Live search state
export interface LiveSearchState {
  query: string;
  isSearching: boolean;
  suggestions: string[];
}

// Search result metadata
export interface SearchResultMeta {
  totalCount: number;
  filteredCount: number;
  searchTime: number; // in milliseconds
}
