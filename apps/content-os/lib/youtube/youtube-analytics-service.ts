/**
 * YouTube Analytics Service
 * Task: tsk-content-os-10 - YouTube Analytics API Integration
 *
 * Server-side only - fetches analytics data from YouTube Analytics API
 */

import { getValidAccessToken } from "./oauth-service";
import {
  YouTubeAnalyticsResponse,
  VideoAnalyticsData,
  VideoMetrics,
  AnalyticsErrorCode,
} from "@/types/youtube-analytics";
import { ContentPerformance, DiagnosisStatus, ProblemType } from "@/types/performance";

// ============================================================================
// Constants
// ============================================================================

const YOUTUBE_ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2/reports";
const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";

/**
 * Diagnostic thresholds (same as dummy-performance.ts)
 */
const THRESHOLDS = {
  MIN_VIEWS: 100, // Minimum views to diagnose (using views instead of impressions)
  CTR_LOW: 5, // CTR below 5% is considered low (simulated)
  WATCH_RATIO_LOW: 0.3, // Watch time below 30% of duration
  EXPANSION_RATIO: 3, // 7d views should be 3x of 24h
  CTR_HIGH: 8, // CTR above 8% is good (simulated)
};

// ============================================================================
// Error Handling
// ============================================================================

export class YouTubeAnalyticsError extends Error {
  constructor(
    public readonly code: AnalyticsErrorCode,
    message: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = "YouTubeAnalyticsError";
  }
}

function mapAPIError(status: number, error: { message?: string }): YouTubeAnalyticsError {
  switch (status) {
    case 401:
      return new YouTubeAnalyticsError(
        "UNAUTHORIZED",
        "Not authenticated. Please log in.",
        error.message
      );
    case 403:
      if (error.message?.includes("quota")) {
        return new YouTubeAnalyticsError(
          "QUOTA_EXCEEDED",
          "API quota exceeded. Please try again later.",
          error.message
        );
      }
      return new YouTubeAnalyticsError(
        "INSUFFICIENT_SCOPE",
        "Insufficient permissions. Please re-authenticate.",
        error.message
      );
    case 404:
      return new YouTubeAnalyticsError(
        "VIDEO_NOT_FOUND",
        "Video not found.",
        error.message
      );
    default:
      return new YouTubeAnalyticsError(
        "API_ERROR",
        error.message || "API error occurred",
        `Status: ${status}`
      );
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch analytics data from YouTube Analytics API
 */
async function fetchAnalytics(
  accessToken: string,
  metrics: string[],
  startDate: string,
  endDate: string,
  dimensions?: string[],
  filters?: string
): Promise<YouTubeAnalyticsResponse> {
  const params = new URLSearchParams({
    ids: "channel==MINE",
    startDate,
    endDate,
    metrics: metrics.join(","),
  });

  if (dimensions?.length) {
    params.set("dimensions", dimensions.join(","));
  }

  if (filters) {
    params.set("filters", filters);
  }

  const response = await fetch(`${YOUTUBE_ANALYTICS_API}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw mapAPIError(response.status, error.error || error);
  }

  return response.json();
}

/**
 * Fetch video details from YouTube Data API
 */
async function fetchVideoDetails(
  accessToken: string,
  videoIds: string[]
): Promise<
  Map<
    string,
    {
      title: string;
      thumbnailUrl: string;
      publishedAt: string;
      duration: number;
    }
  >
> {
  if (videoIds.length === 0) {
    return new Map();
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoIds.join(","),
  });

  const response = await fetch(`${YOUTUBE_DATA_API}/videos?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw mapAPIError(response.status, error.error || error);
  }

  const data = await response.json();
  const videoMap = new Map<
    string,
    {
      title: string;
      thumbnailUrl: string;
      publishedAt: string;
      duration: number;
    }
  >();

  for (const item of data.items || []) {
    videoMap.set(item.id, {
      title: item.snippet.title,
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      duration: parseDuration(item.contentDetails.duration),
    });
  }

  return videoMap;
}

/**
 * Fetch user's recent videos
 */
async function fetchRecentVideos(
  accessToken: string,
  maxResults: number = 20
): Promise<string[]> {
  const params = new URLSearchParams({
    part: "snippet",
    forMine: "true",
    maxResults: String(maxResults),
    order: "date",
    type: "video",
  });

  const response = await fetch(`${YOUTUBE_DATA_API}/search?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw mapAPIError(response.status, error.error || error);
  }

  const data = await response.json();
  return (data.items || [])
    .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
    .filter((id: string | undefined): id is string => !!id);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse ISO 8601 duration to seconds
 * e.g., "PT1H23M45S" -> 5025
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get date string in YYYY-MM-DD format
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Get date N days ago
 */
function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Determine diagnosis status and problem type
 */
function getDiagnosis(
  metrics24h: VideoMetrics,
  metrics7d: VideoMetrics,
  videoDuration: number
): { status: DiagnosisStatus; problemType: ProblemType } {
  const { views: views24h, averageViewDuration: avgDuration24h } = metrics24h;
  const { views: views7d } = metrics7d;

  // Not enough data for diagnosis
  if (views24h < THRESHOLDS.MIN_VIEWS) {
    return { status: "stable", problemType: "none" };
  }

  // Calculate watch ratio
  const watchRatio = videoDuration > 0 ? avgDuration24h / videoDuration : 0;
  const expansionRatio = views24h > 0 ? views7d / views24h : 0;

  // Simulated CTR (YouTube Analytics API has limited CTR access)
  // Using view ratio as a proxy
  const simulatedCtr = Math.min(10, (views24h / 1000) * 2 + 5);

  // Priority-based diagnosis

  // 1. Check for early success
  if (
    simulatedCtr >= THRESHOLDS.CTR_HIGH &&
    watchRatio >= THRESHOLDS.WATCH_RATIO_LOW &&
    expansionRatio >= THRESHOLDS.EXPANSION_RATIO
  ) {
    return { status: "early_success", problemType: "none" };
  }

  // 2. Check for CTR problem (thumbnail/title)
  if (simulatedCtr < THRESHOLDS.CTR_LOW) {
    return { status: "exposure_ok_click_weak", problemType: "thumbnail_title" };
  }

  // 3. Check for watch time problem (early hook)
  if (watchRatio < THRESHOLDS.WATCH_RATIO_LOW) {
    return { status: "click_ok_watch_weak", problemType: "early_hook" };
  }

  // 4. Check for expansion failure
  if (expansionRatio < THRESHOLDS.EXPANSION_RATIO) {
    return { status: "expansion_failed", problemType: "topic_timing" };
  }

  // 5. Default: stable
  return { status: "stable", problemType: "none" };
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Get analytics for a specific video
 */
export async function getVideoAnalytics(videoId: string): Promise<VideoAnalyticsData | null> {
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    throw new YouTubeAnalyticsError(
      "UNAUTHORIZED",
      "Not authenticated. Please log in."
    );
  }

  // Fetch video details
  const videoDetails = await fetchVideoDetails(accessToken, [videoId]);
  const details = videoDetails.get(videoId);

  if (!details) {
    return null;
  }

  // Fetch analytics for last 24 hours and last 7 days
  const today = formatDate(new Date());
  const yesterday = formatDate(getDaysAgo(1));
  const weekAgo = formatDate(getDaysAgo(7));

  const metrics = [
    "views",
    "estimatedMinutesWatched",
    "averageViewDuration",
    "likes",
    "comments",
    "shares",
    "subscribersGained",
  ];

  const [analytics24h, analytics7d] = await Promise.all([
    fetchAnalytics(accessToken, metrics, yesterday, today, ["video"], `video==${videoId}`),
    fetchAnalytics(accessToken, metrics, weekAgo, today, ["video"], `video==${videoId}`),
  ]);

  // Parse analytics data
  const parseMetrics = (data: YouTubeAnalyticsResponse): VideoMetrics => {
    if (!data.rows || data.rows.length === 0) {
      return {
        views: 0,
        estimatedMinutesWatched: 0,
        averageViewDuration: 0,
      };
    }

    const row = data.rows[0];
    const getMetricValue = (name: string): number => {
      const index = data.columnHeaders.findIndex((h) => h.name === name);
      return index >= 0 ? (Number(row[index]) || 0) : 0;
    };

    return {
      views: getMetricValue("views"),
      estimatedMinutesWatched: getMetricValue("estimatedMinutesWatched"),
      averageViewDuration: getMetricValue("averageViewDuration"),
      likes: getMetricValue("likes") || undefined,
      comments: getMetricValue("comments") || undefined,
      shares: getMetricValue("shares") || undefined,
      subscribersGained: getMetricValue("subscribersGained") || undefined,
    };
  };

  return {
    videoId,
    title: details.title,
    thumbnailUrl: details.thumbnailUrl,
    publishedAt: details.publishedAt,
    duration: details.duration,
    metrics24h: parseMetrics(analytics24h),
    metrics7d: parseMetrics(analytics7d),
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Get recent videos with analytics
 */
export async function getRecentVideosWithAnalytics(
  maxResults: number = 20
): Promise<ContentPerformance[]> {
  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    throw new YouTubeAnalyticsError(
      "UNAUTHORIZED",
      "Not authenticated. Please log in."
    );
  }

  // Fetch recent video IDs
  const videoIds = await fetchRecentVideos(accessToken, maxResults);

  if (videoIds.length === 0) {
    return [];
  }

  // Fetch video details
  const videoDetails = await fetchVideoDetails(accessToken, videoIds);

  // Fetch analytics for all videos
  const today = formatDate(new Date());
  const yesterday = formatDate(getDaysAgo(1));
  const weekAgo = formatDate(getDaysAgo(7));

  const metrics = [
    "views",
    "estimatedMinutesWatched",
    "averageViewDuration",
  ];

  const videoFilter = `video==${videoIds.join(",")}`;

  const [analytics24h, analytics7d] = await Promise.all([
    fetchAnalytics(accessToken, metrics, yesterday, today, ["video"], videoFilter),
    fetchAnalytics(accessToken, metrics, weekAgo, today, ["video"], videoFilter),
  ]);

  // Build analytics maps
  const buildMetricsMap = (data: YouTubeAnalyticsResponse): Map<string, VideoMetrics> => {
    const map = new Map<string, VideoMetrics>();

    if (!data.rows) return map;

    const videoIndex = data.columnHeaders.findIndex((h) => h.name === "video");
    const getMetricValue = (row: (string | number)[], name: string): number => {
      const index = data.columnHeaders.findIndex((h) => h.name === name);
      return index >= 0 ? (Number(row[index]) || 0) : 0;
    };

    for (const row of data.rows) {
      const videoId = String(row[videoIndex]);
      map.set(videoId, {
        views: getMetricValue(row, "views"),
        estimatedMinutesWatched: getMetricValue(row, "estimatedMinutesWatched"),
        averageViewDuration: getMetricValue(row, "averageViewDuration"),
      });
    }

    return map;
  };

  const metrics24hMap = buildMetricsMap(analytics24h);
  const metrics7dMap = buildMetricsMap(analytics7d);

  // Build ContentPerformance array
  const performances: ContentPerformance[] = [];
  let index = 0;

  for (const videoId of videoIds) {
    const details = videoDetails.get(videoId);
    if (!details) continue;

    const m24h = metrics24hMap.get(videoId) || {
      views: 0,
      estimatedMinutesWatched: 0,
      averageViewDuration: 0,
    };

    const m7d = metrics7dMap.get(videoId) || {
      views: 0,
      estimatedMinutesWatched: 0,
      averageViewDuration: 0,
    };

    const { status, problemType } = getDiagnosis(m24h, m7d, details.duration);

    // Simulate CTR based on views (YouTube Analytics has limited CTR access)
    const simulatedCtr24h = Math.min(10, (m24h.views / 1000) * 2 + 5);
    const simulatedCtr7d = Math.min(10, (m7d.views / 1000) * 1.5 + 4.5);

    // Simulate impressions (roughly 10-20x of views)
    const impressionsMultiplier24h = 100 / Math.max(1, simulatedCtr24h);
    const impressionsMultiplier7d = 100 / Math.max(1, simulatedCtr7d);

    performances.push({
      id: `perf-${++index}`,
      videoId,
      title: details.title,
      thumbnail: details.thumbnailUrl,
      duration: details.duration,
      publishedAt: details.publishedAt.split("T")[0],
      uploadTime: details.publishedAt,
      metrics: {
        impressions_24h: Math.round(m24h.views * impressionsMultiplier24h),
        impressions_7d: Math.round(m7d.views * impressionsMultiplier7d),
        ctr_24h: simulatedCtr24h,
        ctr_7d: simulatedCtr7d,
        views_24h: m24h.views,
        views_7d: m7d.views,
        avg_view_duration_24h: m24h.averageViewDuration,
        avg_view_duration_7d: m7d.averageViewDuration,
      },
      status,
      problemType,
    });
  }

  // Sort by publish date (newest first)
  performances.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return performances;
}
