/**
 * Internal YouTube Types for Content OS
 * Used for search parameters and transformed results
 */

import { Video } from "./video";

// ============================================================================
// Search Parameters
// ============================================================================

export type YouTubeSearchOrder =
  | "relevance"
  | "date"
  | "viewCount"
  | "rating"
  | "title";

export interface YouTubeSearchParams {
  /** Search query (min 2 characters) */
  query: string;
  /** Maximum number of results (1-50, default 25) */
  maxResults?: number;
  /** Page token for pagination */
  pageToken?: string;
  /** Sort order */
  order?: YouTubeSearchOrder;
  /** Published after (ISO 8601 date-time) */
  publishedAfter?: string;
  /** Published before (ISO 8601 date-time) */
  publishedBefore?: string;
  /** Region code (e.g., "KR", "US") */
  regionCode?: string;
  /** Relevance language (e.g., "ko", "en") */
  relevanceLanguage?: string;
}

// ============================================================================
// Search Results
// ============================================================================

export interface YouTubeSearchResult {
  /** List of videos matching the search */
  videos: Video[];
  /** Total number of results (estimated by YouTube) */
  totalResults: number;
  /** Token for the next page of results */
  nextPageToken?: string;
  /** API quota units consumed by this request */
  quotaUsed: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface YouTubeAPISuccessResponse {
  success: true;
  data: YouTubeSearchResult;
  meta: {
    quotaUsed: number;
    timestamp: string;
  };
}

export interface YouTubeAPIErrorResponse {
  success: false;
  error: {
    code: YouTubeAPIErrorCode;
    message: string;
    details?: string;
  };
  meta: {
    timestamp: string;
  };
}

export type YouTubeAPIResponse =
  | YouTubeAPISuccessResponse
  | YouTubeAPIErrorResponse;

// ============================================================================
// Error Codes
// ============================================================================

export type YouTubeAPIErrorCode =
  | "INVALID_API_KEY"
  | "QUOTA_EXCEEDED"
  | "INVALID_QUERY"
  | "NETWORK_ERROR"
  | "RATE_LIMITED"
  | "VIDEO_NOT_FOUND"
  | "CHANNEL_NOT_FOUND"
  | "FORBIDDEN"
  | "INTERNAL_ERROR"
  | "UNKNOWN_ERROR";

// ============================================================================
// Quota Information
// ============================================================================

export interface QuotaInfo {
  /** Units used in current request */
  used: number;
  /** Estimated remaining quota (if available) */
  remaining?: number;
  /** Quota reset time (if available) */
  resetAt?: string;
}

// ============================================================================
// Extended Video with YouTube-specific fields
// ============================================================================

export interface YouTubeVideo extends Video {
  /** YouTube video ID */
  youtubeId: string;
  /** YouTube channel ID */
  channelId: string;
  /** Like count (may be hidden by uploader) */
  likeCount?: number;
  /** Comment count (may be disabled) */
  commentCount?: number;
  /** YouTube category ID */
  categoryId?: string;
  /** Video description (first 200 chars) */
  description?: string;
  /** Video tags */
  tags?: string[];
}
