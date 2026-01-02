/**
 * YouTube OAuth Logout Route
 * POST /api/auth/youtube/logout
 *
 * Clears stored OAuth tokens
 */

import { NextResponse } from "next/server";
import { clearTokens } from "@/lib/youtube/oauth-service";

export async function POST() {
  try {
    await clearTokens();

    return NextResponse.json({
      success: true,
      message: "Successfully logged out",
    });
  } catch (error) {
    console.error("OAuth logout error:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LOGOUT_FAILED",
          message: error instanceof Error ? error.message : "Failed to logout",
        },
      },
      { status: 500 }
    );
  }
}
