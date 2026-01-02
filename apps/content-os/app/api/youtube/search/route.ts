/**
 * YouTube Search API Route Handler
 * GET /api/youtube/search
 *
 * Query Parameters:
 * - q: Search query (required, min 2 chars)
 * - maxResults: Number of results (optional, 1-50, default 25)
 * - pageToken: Pagination token (optional)
 * - order: Sort order (optional, default "relevance")
 */

import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/youtube/youtube-service";
import { YouTubeServiceError } from "@/lib/youtube/errors";
import { YouTubeAPIResponse, YouTubeSearchOrder } from "@/types/youtube";

// Valid order values
const VALID_ORDERS: YouTubeSearchOrder[] = [
  "relevance",
  "date",
  "viewCount",
  "rating",
  "title",
];

export async function GET(request: NextRequest): Promise<NextResponse<YouTubeAPIResponse>> {
  const timestamp = new Date().toISOString();

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const maxResultsStr = searchParams.get("maxResults");
    const pageToken = searchParams.get("pageToken");
    const orderStr = searchParams.get("order");

    // Validate required query parameter
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_QUERY" as const,
            message: "Search query must be at least 2 characters",
          },
          meta: { timestamp },
        },
        { status: 400 }
      );
    }

    // Validate maxResults
    let maxResults = 25;
    if (maxResultsStr) {
      const parsed = parseInt(maxResultsStr, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 50) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_QUERY" as const,
              message: "maxResults must be a number between 1 and 50",
            },
            meta: { timestamp },
          },
          { status: 400 }
        );
      }
      maxResults = parsed;
    }

    // Validate order
    let order: YouTubeSearchOrder = "relevance";
    if (orderStr) {
      if (!VALID_ORDERS.includes(orderStr as YouTubeSearchOrder)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_QUERY" as const,
              message: `order must be one of: ${VALID_ORDERS.join(", ")}`,
            },
            meta: { timestamp },
          },
          { status: 400 }
        );
      }
      order = orderStr as YouTubeSearchOrder;
    }

    // Perform search
    const result = await search({
      query: query.trim(),
      maxResults,
      pageToken: pageToken || undefined,
      order,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        quotaUsed: result.quotaUsed,
        timestamp,
      },
    });
  } catch (error) {
    console.error("YouTube API error:", error);

    // Handle known errors
    if (error instanceof YouTubeServiceError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
          meta: { timestamp },
        },
        { status: statusCode }
      );
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR" as const,
          message: "An unexpected error occurred",
          details: error instanceof Error ? error.message : String(error),
        },
        meta: { timestamp },
      },
      { status: 500 }
    );
  }
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(
  code: string
): number {
  switch (code) {
    case "INVALID_QUERY":
      return 400;
    case "INVALID_API_KEY":
    case "FORBIDDEN":
      return 403;
    case "VIDEO_NOT_FOUND":
    case "CHANNEL_NOT_FOUND":
      return 404;
    case "RATE_LIMITED":
      return 429;
    case "QUOTA_EXCEEDED":
      return 429;
    case "NETWORK_ERROR":
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}
