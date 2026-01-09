/**
 * Performance Data Hook
 * Task: tsk-content-os-10 - YouTube Analytics API Integration
 *
 * TanStack Query hook for fetching performance data
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { ContentPerformance } from "@/types/performance";

interface PerformanceResponse {
  success: boolean;
  data?: ContentPerformance[];
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    source: "youtube_analytics" | "dummy";
    fetchedAt: string;
    warning?: string;
    count?: number;
  };
}

interface UsePerformanceDataOptions {
  /** Maximum results to fetch */
  maxResults?: number;
  /** Whether to use dummy data */
  useDummy?: boolean;
  /** Enabled state */
  enabled?: boolean;
}

/**
 * Fetch performance data from API
 */
async function fetchPerformanceData(
  maxResults: number,
  useDummy: boolean
): Promise<{
  data: ContentPerformance[];
  source: "youtube_analytics" | "dummy";
  warning?: string;
}> {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
  });

  if (useDummy) {
    params.set("dummy", "true");
  }

  const response = await fetch(`/api/youtube/analytics/videos?${params.toString()}`);
  const result: PerformanceResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || "Failed to fetch performance data");
  }

  return {
    data: result.data || [],
    source: result.meta?.source || "dummy",
    warning: result.meta?.warning,
  };
}

/**
 * Hook to get performance data
 */
export function usePerformanceData(options: UsePerformanceDataOptions = {}) {
  const { maxResults = 20, useDummy = false, enabled = true } = options;

  return useQuery({
    queryKey: ["youtube", "analytics", "videos", { maxResults, useDummy }],
    queryFn: () => fetchPerformanceData(maxResults, useDummy),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled,
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook to get single performance detail by videoId
 * Uses same API as list, leverages TanStack Query cache
 */
export function usePerformanceDetail(videoId: string) {
  return useQuery({
    queryKey: ["youtube", "analytics", "videos", { maxResults: 30, useDummy: false }],
    queryFn: () => fetchPerformanceData(30, false),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!videoId,
    select: (result) => result.data.find((item) => item.videoId === videoId),
  });
}

/**
 * Get the data source label
 */
export function getSourceLabel(source: "youtube_analytics" | "dummy"): string {
  return source === "youtube_analytics" ? "YouTube Analytics" : "Demo Data";
}
