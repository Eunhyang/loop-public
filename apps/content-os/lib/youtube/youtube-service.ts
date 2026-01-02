/**
 * YouTube Data API v3 Service
 * Server-side only - uses API key from environment
 */

import {
  YouTubeSearchListResponse,
  YouTubeVideoListResponse,
  YouTubeChannelListResponse,
} from "@/types/youtube-api";
import { YouTubeSearchParams, YouTubeSearchResult } from "@/types/youtube";
import { Video } from "@/types/video";
import {
  YouTubeServiceError,
  createServiceError,
  isYouTubeAPIError,
} from "./errors";
import {
  CombinedVideoData,
  transformToVideos,
} from "./video-transformer";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * API quota costs (units)
 * - search.list: 100 units per request
 * - videos.list: 1 unit per request (up to 50 videos)
 * - channels.list: 1 unit per request (up to 50 channels)
 */
const QUOTA_COSTS = {
  search: 100,
  videos: 1,
  channels: 1,
} as const;

/**
 * Get API key from environment
 */
function getAPIKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new YouTubeServiceError(
      "INVALID_API_KEY",
      "YouTube API key is not configured",
      "Set YOUTUBE_API_KEY environment variable"
    );
  }
  return apiKey;
}

/**
 * Make authenticated request to YouTube API
 */
async function fetchYouTubeAPI<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const apiKey = getAPIKey();
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);

  // Add API key and filter out undefined params
  url.searchParams.set("key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Cache for 5 minutes to reduce API calls
      next: { revalidate: 300 },
    });

    const data = await response.json();

    if (!response.ok) {
      if (isYouTubeAPIError(data)) {
        throw createServiceError(data);
      }
      throw new YouTubeServiceError(
        "UNKNOWN_ERROR",
        `HTTP ${response.status}: ${response.statusText}`,
        JSON.stringify(data)
      );
    }

    return data as T;
  } catch (error) {
    throw createServiceError(error);
  }
}

/**
 * Search for videos using YouTube Search API
 */
async function searchVideos(
  params: YouTubeSearchParams
): Promise<{
  items: YouTubeSearchListResponse["items"];
  totalResults: number;
  nextPageToken?: string;
}> {
  const response = await fetchYouTubeAPI<YouTubeSearchListResponse>("search", {
    part: "snippet",
    type: "video",
    q: params.query,
    maxResults: params.maxResults || 25,
    pageToken: params.pageToken,
    order: params.order || "relevance",
    publishedAfter: params.publishedAfter,
    publishedBefore: params.publishedBefore,
    regionCode: params.regionCode || "KR",
    relevanceLanguage: params.relevanceLanguage || "ko",
  });

  return {
    items: response.items,
    totalResults: response.pageInfo.totalResults,
    nextPageToken: response.nextPageToken,
  };
}

/**
 * Get video details (statistics, content details)
 */
async function getVideoDetails(
  videoIds: string[]
): Promise<Map<string, YouTubeVideoListResponse["items"][0]>> {
  if (videoIds.length === 0) {
    return new Map();
  }

  const response = await fetchYouTubeAPI<YouTubeVideoListResponse>("videos", {
    part: "snippet,statistics,contentDetails",
    id: videoIds.join(","),
  });

  const videoMap = new Map<string, YouTubeVideoListResponse["items"][0]>();
  response.items.forEach((item) => {
    videoMap.set(item.id, item);
  });

  return videoMap;
}

/**
 * Get channel details (subscriber count)
 */
async function getChannelDetails(
  channelIds: string[]
): Promise<Map<string, YouTubeChannelListResponse["items"][0]>> {
  if (channelIds.length === 0) {
    return new Map();
  }

  // Remove duplicates
  const uniqueChannelIds = [...new Set(channelIds)];

  const response = await fetchYouTubeAPI<YouTubeChannelListResponse>(
    "channels",
    {
      part: "snippet,statistics",
      id: uniqueChannelIds.join(","),
    }
  );

  const channelMap = new Map<
    string,
    YouTubeChannelListResponse["items"][0]
  >();
  response.items.forEach((item) => {
    channelMap.set(item.id, item);
  });

  return channelMap;
}

/**
 * Main search function that combines search, video details, and channel details
 */
export async function search(
  params: YouTubeSearchParams
): Promise<YouTubeSearchResult> {
  // Validate query
  if (!params.query || params.query.trim().length < 2) {
    throw new YouTubeServiceError(
      "INVALID_QUERY",
      "Search query must be at least 2 characters",
      `Query received: "${params.query}"`
    );
  }

  // Validate maxResults
  const maxResults = Math.min(Math.max(params.maxResults || 25, 1), 50);

  // Step 1: Search for videos
  const searchResult = await searchVideos({
    ...params,
    maxResults,
  });

  if (searchResult.items.length === 0) {
    return {
      videos: [],
      totalResults: 0,
      nextPageToken: undefined,
      quotaUsed: QUOTA_COSTS.search,
    };
  }

  // Extract video IDs and channel IDs
  const videoIds = searchResult.items
    .map((item) => item.id.videoId)
    .filter((id): id is string => !!id);

  const channelIds = searchResult.items.map(
    (item) => item.snippet.channelId
  );

  // Step 2 & 3: Get video and channel details in parallel
  const [videoDetailsMap, channelDetailsMap] = await Promise.all([
    getVideoDetails(videoIds),
    getChannelDetails(channelIds),
  ]);

  // Step 4: Combine data
  const combinedData: CombinedVideoData[] = searchResult.items
    .filter((item) => item.id.videoId) // Only videos
    .map((item) => ({
      searchItem: item,
      videoDetails: videoDetailsMap.get(item.id.videoId!),
      channelDetails: channelDetailsMap.get(item.snippet.channelId),
    }));

  // Step 5: Transform to Video type
  const videos: Video[] = transformToVideos(combinedData);

  // Calculate quota used
  const quotaUsed =
    QUOTA_COSTS.search + QUOTA_COSTS.videos + QUOTA_COSTS.channels;

  return {
    videos,
    totalResults: searchResult.totalResults,
    nextPageToken: searchResult.nextPageToken,
    quotaUsed,
  };
}

/**
 * Export individual functions for testing
 */
export const YouTubeService = {
  search,
  searchVideos,
  getVideoDetails,
  getChannelDetails,
};
