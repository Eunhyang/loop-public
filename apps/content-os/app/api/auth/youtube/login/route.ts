/**
 * YouTube OAuth Login Route
 * GET /api/auth/youtube/login
 *
 * Initiates OAuth 2.0 flow with PKCE
 * Redirects user to Google's consent screen
 */

import { NextResponse } from "next/server";
import { generateAuthUrl } from "@/lib/youtube/oauth-service";

export async function GET() {
  try {
    const authUrl = await generateAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("OAuth login error:", error);

    // Redirect to performance page with error
    const errorUrl = new URL("/performance", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    errorUrl.searchParams.set("error", "oauth_init_failed");
    errorUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Failed to initialize OAuth"
    );

    return NextResponse.redirect(errorUrl);
  }
}
