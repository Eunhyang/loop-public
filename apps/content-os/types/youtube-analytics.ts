/**
 * YouTube Analytics API Types
 * Task: tsk-content-os-10 - YouTube Analytics API Integration
 *
 * Based on:
 * - YouTube Analytics API: https://developers.google.com/youtube/analytics/reference
 * - Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
 */

// ============================================================================
// OAuth Types
// ============================================================================

/**
 * OAuth 2.0 tokens received from Google
 */
export interface YouTubeOAuthTokens {
  /** Access token for API calls */
  access_token: string;
  /** Refresh token for obtaining new access tokens */
  refresh_token?: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** Token type (always "Bearer") */
  token_type: "Bearer";
  /** OAuth scopes granted */
  scope: string;
  /** Token expiration timestamp (ISO 8601) */
  expires_at?: string;
}

/**
 * PKCE (Proof Key for Code Exchange) data
 */
export interface PKCEData {
  /** Code verifier (43-128 character random string) */
  code_verifier: string;
  /** SHA-256 hash of code_verifier, base64url encoded */
  code_challenge: string;
  /** Always "S256" for SHA-256 */
  code_challenge_method: "S256";
}

/**
 * Authentication status
 */
export type AuthStatus = "authenticated" | "unauthenticated" | "loading" | "error";

/**
 * Authentication state returned to the client
 */
export interface AuthState {
  /** Current auth status */
  status: AuthStatus;
  /** Whether tokens are valid and not expired */
  isAuthenticated: boolean;
  /** Token expiration time (ISO 8601) */
  expiresAt?: string;
  /** User's YouTube channel info (if authenticated) */
  channel?: {
    id: string;
    title: string;
    thumbnailUrl?: string;
  };
  /** Error message if status is "error" */
  error?: string;
}

// ============================================================================
// YouTube Analytics API Types
// ============================================================================

/**
 * YouTube Analytics API query parameters
 */
export interface YouTubeAnalyticsQuery {
  /** Start date (YYYY-MM-DD) */
  startDate: string;
  /** End date (YYYY-MM-DD) */
  endDate: string;
  /** Metrics to retrieve */
  metrics: YouTubeAnalyticsMetric[];
  /** Dimensions to group by */
  dimensions?: YouTubeAnalyticsDimension[];
  /** Filter expression */
  filters?: string;
  /** Sort order */
  sort?: string;
  /** Maximum results */
  maxResults?: number;
}

/**
 * Available metrics from YouTube Analytics API
 */
export type YouTubeAnalyticsMetric =
  | "views"
  | "estimatedMinutesWatched"
  | "averageViewDuration"
  | "averageViewPercentage"
  | "subscribersGained"
  | "subscribersLost"
  | "likes"
  | "dislikes"
  | "shares"
  | "comments"
  | "annotationClickThroughRate"
  | "annotationCloseRate"
  | "cardClickRate"
  | "cardTeaserClickRate";

/**
 * Available dimensions for YouTube Analytics API
 */
export type YouTubeAnalyticsDimension =
  | "video"
  | "day"
  | "month"
  | "country"
  | "deviceType"
  | "operatingSystem"
  | "subscribedStatus"
  | "youtubeProduct"
  | "liveOrOnDemand"
  | "trafficSourceType"
  | "trafficSourceDetail";

/**
 * Raw response from YouTube Analytics API
 */
export interface YouTubeAnalyticsResponse {
  kind: "youtubeAnalytics#resultTable";
  columnHeaders: Array<{
    name: string;
    columnType: "DIMENSION" | "METRIC";
    dataType: "STRING" | "INTEGER" | "FLOAT";
  }>;
  rows?: Array<Array<string | number>>;
}

// ============================================================================
// Transformed Analytics Data Types
// ============================================================================

/**
 * Analytics data for a single video
 */
export interface VideoAnalyticsData {
  /** YouTube video ID */
  videoId: string;
  /** Video title */
  title: string;
  /** Video thumbnail URL */
  thumbnailUrl: string;
  /** Video publish date (ISO 8601) */
  publishedAt: string;
  /** Video duration in seconds */
  duration: number;
  /** Metrics for the last 24 hours */
  metrics24h: VideoMetrics;
  /** Metrics for the last 7 days */
  metrics7d: VideoMetrics;
  /** Fetch timestamp */
  fetchedAt: string;
}

/**
 * Video metrics for a time period
 */
export interface VideoMetrics {
  /** Total view count */
  views: number;
  /** Estimated watch time in minutes */
  estimatedMinutesWatched: number;
  /** Average view duration in seconds */
  averageViewDuration: number;
  /** Average percentage of video watched (0-100) */
  averageViewPercentage?: number;
  /** Likes received */
  likes?: number;
  /** Comments received */
  comments?: number;
  /** Shares */
  shares?: number;
  /** Subscribers gained from this video */
  subscribersGained?: number;
}

/**
 * Channel-level analytics summary
 */
export interface ChannelAnalyticsSummary {
  /** Channel ID */
  channelId: string;
  /** Time period */
  period: {
    startDate: string;
    endDate: string;
  };
  /** Total views */
  totalViews: number;
  /** Total watch time in minutes */
  totalWatchTimeMinutes: number;
  /** Average view duration across all videos */
  averageViewDuration: number;
  /** Total subscribers gained */
  subscribersGained: number;
  /** Total subscribers lost */
  subscribersLost: number;
  /** Net subscriber change */
  netSubscribers: number;
  /** Top performing videos */
  topVideos: VideoAnalyticsData[];
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Success response for analytics endpoints
 */
export interface AnalyticsSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    fetchedAt: string;
    period?: {
      startDate: string;
      endDate: string;
    };
  };
}

/**
 * Error response for analytics endpoints
 */
export interface AnalyticsErrorResponse {
  success: false;
  error: {
    code: AnalyticsErrorCode;
    message: string;
    details?: string;
  };
  meta: {
    timestamp: string;
  };
}

/**
 * Analytics API error codes
 */
export type AnalyticsErrorCode =
  | "UNAUTHORIZED"
  | "TOKEN_EXPIRED"
  | "INSUFFICIENT_SCOPE"
  | "QUOTA_EXCEEDED"
  | "INVALID_QUERY"
  | "VIDEO_NOT_FOUND"
  | "CHANNEL_NOT_FOUND"
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

/**
 * Combined response type
 */
export type AnalyticsResponse<T> =
  | AnalyticsSuccessResponse<T>
  | AnalyticsErrorResponse;

// ============================================================================
// Cookie/Token Storage Types
// ============================================================================

/**
 * Stored token data in HTTP-only cookie
 */
export interface StoredTokenData {
  /** Access token */
  access_token: string;
  /** Refresh token */
  refresh_token: string;
  /** Expiration timestamp (Unix milliseconds) */
  expires_at: number;
  /** OAuth scopes */
  scope: string;
}

/**
 * Cookie configuration
 */
export interface CookieConfig {
  /** Cookie name */
  name: string;
  /** HTTP-only flag */
  httpOnly: boolean;
  /** Secure flag (HTTPS only) */
  secure: boolean;
  /** SameSite attribute */
  sameSite: "lax" | "strict" | "none";
  /** Cookie path */
  path: string;
  /** Max age in seconds */
  maxAge: number;
}
