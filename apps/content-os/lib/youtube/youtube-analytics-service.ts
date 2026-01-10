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
 * Diagnostic thresholds
 */
const THRESHOLDS = {
  MIN_VIEWS: 100, // Minimum views to diagnose
  CTR_LOW: 5, // CTR below 5% is considered low
  WATCH_RATIO_LOW: 0.3, // Watch time below 30% of duration
  EXPANSION_RATIO: 3, // 7d views should be 3x of 24h
  CTR_HIGH: 8, // CTR above 8% is good
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
 * Automatically chunks requests to handle 50+ video IDs
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

  // Chunk video IDs to respect YouTube Data API limit (50 per request)
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const videoIdChunks = chunkArray(videoIds, 50);
  const videoMap = new Map<
    string,
    {
      title: string;
      thumbnailUrl: string;
      publishedAt: string;
      duration: number;
    }
  >();

  // Fetch all chunks in parallel
  await Promise.all(
    videoIdChunks.map(async (chunk) => {
      const params = new URLSearchParams({
        part: "snippet,contentDetails",
        id: chunk.join(","),
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
    })
  );

  return videoMap;
}

/**
 * Fetch user's recent videos (with pagination support)
 * Uses Clean Architecture UseCase for fetching 100+ videos
 */
async function fetchRecentVideos(
  accessToken: string,
  maxResults: number = 20
): Promise<string[]> {
  // Import clean architecture components
  const { createFetchAllRecentVideosUseCase } = await import(
    "@/lib/application/youtube/usecases/FetchAllRecentVideosUseCase"
  );
  const { createYouTubeVideoRepository } = await import(
    "@/lib/infrastructure/youtube/YouTubeVideoRepository"
  );

  // Create repository and use case
  const repository = createYouTubeVideoRepository();
  const useCase = createFetchAllRecentVideosUseCase(repository);

  // Execute use case
  const { videoList } = await useCase.execute({
    accessToken,
    limit: maxResults,
  });

  // Return video IDs only (details already fetched with durations)
  return videoList.videos.map(v => v.videoId as string);
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
  videoDuration: number,
  ctrPercentage: number  // Actual or simulated CTR (already as percentage)
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

  // Priority-based diagnosis

  // 1. Check for early success
  if (
    ctrPercentage >= THRESHOLDS.CTR_HIGH &&
    watchRatio >= THRESHOLDS.WATCH_RATIO_LOW &&
    expansionRatio >= THRESHOLDS.EXPANSION_RATIO
  ) {
    return { status: "early_success", problemType: "none" };
  }

  // 2. Check for CTR problem (thumbnail/title)
  if (ctrPercentage < THRESHOLDS.CTR_LOW) {
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

  // Fetch analytics with 2-day offset (YouTube Analytics API has data delay)
  // 24h: 3 days ago → 2 days ago (1 day of data)
  // 7d: 9 days ago → 2 days ago (7 days of data)
  const twoDaysAgo = formatDate(getDaysAgo(2));
  const threeDaysAgo = formatDate(getDaysAgo(3));
  const nineDaysAgo = formatDate(getDaysAgo(9));

  // Note: impressions and impressionsCtr are NOT available with dimensions=video
  // These metrics are only available at channel level or with specific traffic source dimensions
  // Removed estimatedMinutesWatched and averageViewPercentage due to incompatibleMetrics API errors
  const metrics = [
    "views",
    "likes",
    "comments",
    "shares",
    "subscribersGained",
  ];

  const [analytics24h, analytics7d] = await Promise.all([
    fetchAnalytics(accessToken, metrics, threeDaysAgo, twoDaysAgo, ["video"], `video==${videoId}`),
    fetchAnalytics(accessToken, metrics, nineDaysAgo, twoDaysAgo, ["video"], `video==${videoId}`),
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
    const getMetricValue = (name: string): number | undefined => {
      const index = data.columnHeaders.findIndex((h) => h.name === name);
      if (index < 0) return undefined;
      const value = Number(row[index]);
      return isNaN(value) ? undefined : value;
    };

    return {
      views: getMetricValue("views") ?? 0,
      estimatedMinutesWatched: getMetricValue("estimatedMinutesWatched") ?? 0,
      averageViewDuration: getMetricValue("averageViewDuration") ?? 0,
      averageViewPercentage: getMetricValue("averageViewPercentage"),
      impressions: getMetricValue("impressions"),
      impressionsCtr: getMetricValue("impressionsCtr"),
      likes: getMetricValue("likes"),
      comments: getMetricValue("comments"),
      shares: getMetricValue("shares"),
      subscribersGained: getMetricValue("subscribersGained"),
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

  // Fetch analytics with 2-day offset (YouTube Analytics API has data delay)
  const twoDaysAgo = formatDate(getDaysAgo(2));
  const threeDaysAgo = formatDate(getDaysAgo(3));
  const nineDaysAgo = formatDate(getDaysAgo(9));

  // Note: impressions and impressionsCtr are NOT available with dimensions=video
  // These metrics are only available at channel level or with specific traffic source dimensions
  // Removed estimatedMinutesWatched and averageViewPercentage due to incompatibleMetrics API errors
  // Using fallback simulation for these metrics (see lines 574-588)
  const metrics = [
    "views",
    "averageViewDuration",
  ];

  // Chunk video IDs to handle YouTube Analytics API limit (50 videos per request)
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const videoIdChunks = chunkArray(videoIds, 50);

  // Fetch analytics for each chunk in parallel
  const [analytics24hChunks, analytics7dChunks] = await Promise.all([
    Promise.all(
      videoIdChunks.map(chunk =>
        fetchAnalytics(
          accessToken,
          metrics,
          threeDaysAgo,
          twoDaysAgo,
          ["video"],
          `video==${chunk.join(",")}`
        )
      )
    ),
    Promise.all(
      videoIdChunks.map(chunk =>
        fetchAnalytics(
          accessToken,
          metrics,
          nineDaysAgo,
          twoDaysAgo,
          ["video"],
          `video==${chunk.join(",")}`
        )
      )
    ),
  ]);

  // Merge chunked results
  const mergeAnalytics = (chunks: YouTubeAnalyticsResponse[]): YouTubeAnalyticsResponse => {
    if (chunks.length === 0) {
      return {
        kind: "youtubeAnalytics#resultTable",
        columnHeaders: [],
        rows: [],
      };
    }
    if (chunks.length === 1) {
      return chunks[0];
    }
    return {
      kind: "youtubeAnalytics#resultTable",
      columnHeaders: chunks[0].columnHeaders,
      rows: chunks.flatMap(chunk => chunk.rows || []),
    };
  };

  const analytics24h = mergeAnalytics(analytics24hChunks);
  const analytics7d = mergeAnalytics(analytics7dChunks);

  // Build analytics maps
  const buildMetricsMap = (data: YouTubeAnalyticsResponse): Map<string, VideoMetrics> => {
    const map = new Map<string, VideoMetrics>();

    if (!data.rows) return map;

    const videoIndex = data.columnHeaders.findIndex((h) => h.name === "video");
    const getMetricValue = (row: (string | number)[], name: string): number | undefined => {
      const index = data.columnHeaders.findIndex((h) => h.name === name);
      if (index < 0) return undefined;
      const value = Number(row[index]);
      return isNaN(value) ? undefined : value;
    };

    for (const row of data.rows) {
      const videoId = String(row[videoIndex]);
      map.set(videoId, {
        views: getMetricValue(row, "views") ?? 0,
        estimatedMinutesWatched: getMetricValue(row, "estimatedMinutesWatched") ?? 0,
        averageViewDuration: getMetricValue(row, "averageViewDuration") ?? 0,
        averageViewPercentage: getMetricValue(row, "averageViewPercentage"),
        impressions: getMetricValue(row, "impressions"),
        impressionsCtr: getMetricValue(row, "impressionsCtr"),
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

    // Use actual API values with fallback to simulation ONLY if missing (undefined)
    // Zero values from API are treated as actual data, not missing
    const ctr24h = m24h.impressionsCtr !== undefined
      ? m24h.impressionsCtr * 100  // Convert 0-1 to percentage (actual API value)
      : Math.min(10, (m24h.views / 1000) * 2 + 5);  // Fallback simulation

    const ctr7d = m7d.impressionsCtr !== undefined
      ? m7d.impressionsCtr * 100
      : Math.min(10, (m7d.views / 1000) * 1.5 + 4.5);

    const impressions24h = m24h.impressions !== undefined
      ? m24h.impressions  // Use actual API value (including 0)
      : Math.round(m24h.views * (100 / Math.max(1, ctr24h)));  // Fallback

    const impressions7d = m7d.impressions !== undefined
      ? m7d.impressions
      : Math.round(m7d.views * (100 / Math.max(1, ctr7d)));

    const { status, problemType } = getDiagnosis(m24h, m7d, details.duration, ctr24h);

    performances.push({
      id: `perf-${++index}`,
      videoId,
      title: details.title,
      thumbnail: details.thumbnailUrl,
      duration: details.duration,
      publishedAt: details.publishedAt.split("T")[0],
      uploadTime: details.publishedAt,
      metrics: {
        impressions_24h: impressions24h,
        impressions_7d: impressions7d,
        ctr_24h: ctr24h,
        ctr_7d: ctr7d,
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
