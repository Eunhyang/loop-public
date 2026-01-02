/**
 * YouTube OAuth Callback Route
 * GET /api/auth/youtube/callback
 *
 * Handles OAuth 2.0 callback from Google
 * Exchanges authorization code for tokens
 */

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  storeTokens,
} from "@/lib/youtube/oauth-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl = new URL("/performance", baseUrl);
  const errorUrl = new URL("/performance", baseUrl);

  // Handle OAuth errors
  if (error) {
    errorUrl.searchParams.set("error", "oauth_denied");
    errorUrl.searchParams.set(
      "message",
      searchParams.get("error_description") || "User denied access"
    );
    return NextResponse.redirect(errorUrl);
  }

  // Validate required parameters
  if (!code || !state) {
    errorUrl.searchParams.set("error", "invalid_callback");
    errorUrl.searchParams.set("message", "Missing code or state parameter");
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, state);

    // Store tokens in secure cookie
    await storeTokens(tokens);

    // Redirect to performance page with success
    successUrl.searchParams.set("auth", "success");
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("OAuth callback error:", err);

    errorUrl.searchParams.set("error", "token_exchange_failed");
    errorUrl.searchParams.set(
      "message",
      err instanceof Error ? err.message : "Failed to exchange token"
    );
    return NextResponse.redirect(errorUrl);
  }
}
