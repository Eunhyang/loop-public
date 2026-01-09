// Domain types - Pure TypeScript, no external dependencies
// Follows Content OS Clean Architecture Constitution

// Branded types for type safety
export type VideoId = string & { readonly __brand: 'VideoId' };
export type PageToken = string & { readonly __brand: 'PageToken' };

// Constants
export const MAX_RESULTS_PER_PAGE = 50;
export const MAX_LIMIT = 200; // YouTube API quota management

// Domain entities
export interface VideoSummary {
  videoId: VideoId;
  title: string;
  thumbnailUrl: string;
  publishedAt: string; // ISO string (no external Date/Timestamp types)
  duration: number; // seconds
}

export interface VideoList {
  videos: VideoSummary[];
  totalCount: number;
}

export interface PaginatedResult<T> {
  items: T[];
  nextPageToken: PageToken | null;
  totalResults: number;
}
