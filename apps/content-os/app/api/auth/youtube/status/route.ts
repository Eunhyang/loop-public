/**
 * YouTube OAuth Status Route
 * GET /api/auth/youtube/status
 *
 * Returns current authentication state
 */

import { NextResponse } from "next/server";
import { getAuthState } from "@/lib/youtube/oauth-service";

export async function GET() {
  try {
    const authState = await getAuthState();

    return NextResponse.json({
      success: true,
      data: authState,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Auth status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "STATUS_CHECK_FAILED",
          message: error instanceof Error ? error.message : "Failed to check auth status",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
