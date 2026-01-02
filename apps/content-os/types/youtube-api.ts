/**
 * YouTube Data API v3 Response Types
 * Based on: https://developers.google.com/youtube/v3/docs
 */

// ============================================================================
// Common Types
// ============================================================================

export interface YouTubePageInfo {
  totalResults: number;
  resultsPerPage: number;
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

// ============================================================================
// Search API Types
// ============================================================================

export interface YouTubeSearchListResponse {
  kind: "youtube#searchListResponse";
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  regionCode?: string;
  pageInfo: YouTubePageInfo;
  items: YouTubeSearchItem[];
}

export interface YouTubeSearchItem {
  kind: "youtube#searchResult";
  etag: string;
  id: {
    kind: string; // "youtube#video", "youtube#channel", "youtube#playlist"
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: YouTubeSearchSnippet;
}

export interface YouTubeSearchSnippet {
  publishedAt: string; // ISO 8601 date-time
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  liveBroadcastContent: "none" | "upcoming" | "live";
  publishTime?: string; // ISO 8601 date-time
}

// ============================================================================
// Videos API Types
// ============================================================================

export interface YouTubeVideoListResponse {
  kind: "youtube#videoListResponse";
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: YouTubePageInfo;
  items: YouTubeVideoItem[];
}

export interface YouTubeVideoItem {
  kind: "youtube#video";
  etag: string;
  id: string;
  snippet?: YouTubeVideoSnippet;
  contentDetails?: YouTubeVideoContentDetails;
  statistics?: YouTubeVideoStatistics;
}

export interface YouTubeVideoSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: YouTubeThumbnails;
  channelTitle: string;
  tags?: string[];
  categoryId?: string;
  liveBroadcastContent: "none" | "upcoming" | "live";
  defaultLanguage?: string;
  localized?: {
    title: string;
    description: string;
  };
  defaultAudioLanguage?: string;
}

export interface YouTubeVideoContentDetails {
  duration: string; // ISO 8601 duration (e.g., "PT1H23M45S")
  dimension: string;
  definition: "hd" | "sd";
  caption: "true" | "false";
  licensedContent: boolean;
  contentRating?: Record<string, unknown>;
  projection: "rectangular" | "360";
  regionRestriction?: {
    allowed?: string[];
    blocked?: string[];
  };
}

export interface YouTubeVideoStatistics {
  viewCount?: string;
  likeCount?: string;
  dislikeCount?: string;
  favoriteCount?: string;
  commentCount?: string;
}

// ============================================================================
// Channels API Types
// ============================================================================

export interface YouTubeChannelListResponse {
  kind: "youtube#channelListResponse";
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: YouTubePageInfo;
  items: YouTubeChannelItem[];
}

export interface YouTubeChannelItem {
  kind: "youtube#channel";
  etag: string;
  id: string;
  snippet?: YouTubeChannelSnippet;
  statistics?: YouTubeChannelStatistics;
}

export interface YouTubeChannelSnippet {
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: YouTubeThumbnails;
  defaultLanguage?: string;
  localized?: {
    title: string;
    description: string;
  };
  country?: string;
}

export interface YouTubeChannelStatistics {
  viewCount?: string;
  subscriberCount?: string;
  hiddenSubscriberCount: boolean;
  videoCount?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface YouTubeAPIError {
  error: {
    code: number;
    message: string;
    errors: Array<{
      message: string;
      domain: string;
      reason: string;
      location?: string;
      locationType?: string;
    }>;
    status?: string;
  };
}
