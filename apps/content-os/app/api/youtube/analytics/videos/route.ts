/**
 * YouTube Analytics Videos Route
 * GET /api/youtube/analytics/videos
 *
 * Returns recent videos with analytics data
 * Falls back to dummy data if not authenticated
 */

import { NextRequest, NextResponse } from "next/server";
import { getRecentVideosWithAnalytics, YouTubeAnalyticsError } from "@/lib/youtube/youtube-analytics-service";
import { dummyPerformanceData } from "@/app/performance/data/dummy-performance";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const maxResults = parseInt(searchParams.get("maxResults") || "20", 10);
  const useDummy = searchParams.get("dummy") === "true";

  // If explicitly requesting dummy data, return it
  if (useDummy) {
    return NextResponse.json({
      success: true,
      data: dummyPerformanceData,
      meta: {
        source: "dummy",
        fetchedAt: new Date().toISOString(),
      },
    });
  }

  try {
    const performances = await getRecentVideosWithAnalytics(maxResults);

    return NextResponse.json({
      success: true,
      data: performances,
      meta: {
        source: "youtube_analytics",
        fetchedAt: new Date().toISOString(),
        count: performances.length,
      },
    });
  } catch (error) {
    console.error("Analytics videos error:", error);

    // If unauthorized, return dummy data with warning
    if (error instanceof YouTubeAnalyticsError && error.code === "UNAUTHORIZED") {
      return NextResponse.json({
        success: true,
        data: dummyPerformanceData,
        meta: {
          source: "dummy",
          fetchedAt: new Date().toISOString(),
          warning: "Not authenticated. Showing demo data.",
        },
      });
    }

    // For other errors, return error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error instanceof YouTubeAnalyticsError ? error.code : "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch analytics",
          details: error instanceof YouTubeAnalyticsError ? error.details : undefined,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: error instanceof YouTubeAnalyticsError && error.code === "QUOTA_EXCEEDED" ? 429 : 500 }
    );
  }
}
