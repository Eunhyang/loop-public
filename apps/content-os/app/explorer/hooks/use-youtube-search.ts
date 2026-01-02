"use client";

import { useQuery } from "@tanstack/react-query";
import { Video, ProcessedVideo } from "@/types/video";
import {
  YouTubeAPIResponse,
  YouTubeSearchOrder,
  YouTubeSearchResult,
} from "@/types/youtube";
import { processVideos } from "../lib/score-calculator";

/**
 * Search options for useYouTubeSearch hook
 */
export interface YouTubeSearchOptions {
  /** Search query (min 2 characters) */
  query: string;
  /** Maximum results to fetch (1-50, default 25) */
  maxResults?: number;
  /** Sort order */
  order?: YouTubeSearchOrder;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Fetch YouTube search results from our API route
 */
async function fetchYouTubeSearch(
  query: string,
  maxResults: number,
  order: YouTubeSearchOrder
): Promise<YouTubeSearchResult> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    order,
  });

  const response = await fetch(`/api/youtube/search?${params.toString()}`);
  const data: YouTubeAPIResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error.message);
  }

  return data.data;
}

/**
 * Hook for searching YouTube videos with automatic score calculation
 *
 * @example
 * const { videos, isLoading, error, totalResults } = useYouTubeSearch({
 *   query: "다이어트",
 *   maxResults: 25,
 * });
 */
export function useYouTubeSearch(options: YouTubeSearchOptions) {
  const {
    query,
    maxResults = 25,
    order = "relevance",
    enabled = true,
  } = options;

  // Only search if query is at least 2 characters
  const shouldSearch = enabled && query.trim().length >= 2;

  const queryResult = useQuery<YouTubeSearchResult, Error>({
    queryKey: ["youtube-search", query, maxResults, order],
    queryFn: () => fetchYouTubeSearch(query.trim(), maxResults, order),
    enabled: shouldSearch,
    // Keep previous data while fetching new results
    placeholderData: (previousData) => previousData,
    // Stale time of 5 minutes
    staleTime: 5 * 60 * 1000,
  });

  // Process videos with score calculation
  const processedVideos: ProcessedVideo[] = queryResult.data?.videos
    ? processVideos(queryResult.data.videos)
    : [];

  // Extract unique channel list for filters
  const channelList: string[] = processedVideos.length > 0
    ? [...new Set(processedVideos.map((v) => v.channel.name))]
    : [];

  return {
    /** Processed videos with calculated scores */
    videos: processedVideos,
    /** Raw videos from API */
    rawVideos: queryResult.data?.videos || [],
    /** Total results from YouTube (estimated) */
    totalResults: queryResult.data?.totalResults || 0,
    /** Next page token for pagination */
    nextPageToken: queryResult.data?.nextPageToken,
    /** API quota used in this request */
    quotaUsed: queryResult.data?.quotaUsed || 0,
    /** List of unique channel names */
    channelList,
    /** Loading state */
    isLoading: queryResult.isLoading,
    /** Fetching state (includes background refetches) */
    isFetching: queryResult.isFetching,
    /** Error object if request failed */
    error: queryResult.error,
    /** Whether data is available */
    hasData: !!queryResult.data && processedVideos.length > 0,
    /** Refetch function */
    refetch: queryResult.refetch,
  };
}

/**
 * Hook result type export for external use
 */
export type UseYouTubeSearchResult = ReturnType<typeof useYouTubeSearch>;
