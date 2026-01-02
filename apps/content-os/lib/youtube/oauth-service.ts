/**
 * YouTube OAuth 2.0 Service with PKCE
 * Task: tsk-content-os-10 - YouTube Analytics API Integration
 *
 * Server-side only - handles OAuth flow and token management
 *
 * Implements:
 * - PKCE (Proof Key for Code Exchange) for enhanced security
 * - HTTP-only Secure cookies for token storage
 * - Automatic token refresh
 */

import { cookies } from "next/headers";
import {
  YouTubeOAuthTokens,
  PKCEData,
  StoredTokenData,
  AuthState,
  CookieConfig,
} from "@/types/youtube-analytics";

// ============================================================================
// Constants
// ============================================================================

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNEL_API = "https://www.googleapis.com/youtube/v3/channels";

/**
 * Required OAuth scopes for YouTube Analytics
 * - youtube.readonly: Read channel/video info
 * - yt-analytics.readonly: Read analytics data
 */
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
].join(" ");

/**
 * Cookie configuration for token storage
 */
const TOKEN_COOKIE_CONFIG: CookieConfig = {
  name: "yt_oauth_tokens",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Cookie configuration for PKCE state
 */
const PKCE_COOKIE_CONFIG: CookieConfig = {
  name: "yt_oauth_pkce",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 10, // 10 minutes (OAuth flow timeout)
};

// ============================================================================
// Environment Variables
// ============================================================================

function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not set");
  }
  return clientId;
}

function getGoogleClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET environment variable is not set");
  }
  return clientSecret;
}

function getRedirectUri(): string {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI environment variable is not set");
  }
  return redirectUri;
}

// ============================================================================
// PKCE Utilities
// ============================================================================

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((v) => chars[v % chars.length])
    .join("");
}

/**
 * Generate SHA-256 hash and encode as base64url
 */
async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Convert to base64url (URL-safe base64 without padding)
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate PKCE code verifier and challenge
 */
export async function generatePKCE(): Promise<PKCEData> {
  // Code verifier: 43-128 characters
  const code_verifier = generateRandomString(64);
  const code_challenge = await sha256Base64Url(code_verifier);

  return {
    code_verifier,
    code_challenge,
    code_challenge_method: "S256",
  };
}

// ============================================================================
// OAuth Flow Functions
// ============================================================================

/**
 * Generate OAuth authorization URL with PKCE
 * Returns the URL and stores PKCE data in a cookie
 */
export async function generateAuthUrl(): Promise<string> {
  const pkceData = await generatePKCE();
  const state = generateRandomString(32);

  // Store PKCE data and state in cookie
  const cookieStore = await cookies();
  cookieStore.set(PKCE_COOKIE_CONFIG.name, JSON.stringify({ ...pkceData, state }), {
    httpOnly: PKCE_COOKIE_CONFIG.httpOnly,
    secure: PKCE_COOKIE_CONFIG.secure,
    sameSite: PKCE_COOKIE_CONFIG.sameSite,
    path: PKCE_COOKIE_CONFIG.path,
    maxAge: PKCE_COOKIE_CONFIG.maxAge,
  });

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline", // Request refresh token
    prompt: "consent", // Always show consent screen for refresh token
    state,
    code_challenge: pkceData.code_challenge,
    code_challenge_method: pkceData.code_challenge_method,
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string
): Promise<YouTubeOAuthTokens> {
  // Get stored PKCE data
  const cookieStore = await cookies();
  const pkceCookie = cookieStore.get(PKCE_COOKIE_CONFIG.name);

  if (!pkceCookie?.value) {
    throw new Error("PKCE data not found. OAuth flow may have expired.");
  }

  const pkceData = JSON.parse(pkceCookie.value) as PKCEData & { state: string };

  // Verify state to prevent CSRF
  if (pkceData.state !== state) {
    throw new Error("Invalid state parameter. Possible CSRF attack.");
  }

  // Exchange code for tokens
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      code,
      code_verifier: pkceData.code_verifier,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  const tokens: YouTubeOAuthTokens = await response.json();

  // Calculate expiration timestamp
  tokens.expires_at = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  // Clear PKCE cookie
  cookieStore.delete(PKCE_COOKIE_CONFIG.name);

  return tokens;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<YouTubeOAuthTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: getGoogleClientId(),
      client_secret: getGoogleClientSecret(),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  const tokens: YouTubeOAuthTokens = await response.json();

  // Refresh token is not returned on refresh, keep the original
  tokens.refresh_token = refreshToken;
  tokens.expires_at = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  return tokens;
}

// ============================================================================
// Token Storage Functions
// ============================================================================

/**
 * Store tokens in HTTP-only secure cookie
 */
export async function storeTokens(tokens: YouTubeOAuthTokens): Promise<void> {
  if (!tokens.refresh_token) {
    throw new Error("Refresh token is required for storage");
  }

  const storedData: StoredTokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    scope: tokens.scope,
  };

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_CONFIG.name, JSON.stringify(storedData), {
    httpOnly: TOKEN_COOKIE_CONFIG.httpOnly,
    secure: TOKEN_COOKIE_CONFIG.secure,
    sameSite: TOKEN_COOKIE_CONFIG.sameSite,
    path: TOKEN_COOKIE_CONFIG.path,
    maxAge: TOKEN_COOKIE_CONFIG.maxAge,
  });
}

/**
 * Get stored tokens from cookie
 * Returns null if not authenticated
 */
export async function getStoredTokens(): Promise<StoredTokenData | null> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(TOKEN_COOKIE_CONFIG.name);

  if (!tokenCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(tokenCookie.value) as StoredTokenData;
  } catch {
    return null;
  }
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  const storedTokens = await getStoredTokens();

  if (!storedTokens) {
    return null;
  }

  // Check if token is expired (with 5 minute buffer)
  const isExpired = Date.now() >= storedTokens.expires_at - 5 * 60 * 1000;

  if (!isExpired) {
    return storedTokens.access_token;
  }

  // Token is expired, try to refresh
  try {
    const newTokens = await refreshAccessToken(storedTokens.refresh_token);
    await storeTokens(newTokens);
    return newTokens.access_token;
  } catch {
    // Refresh failed, clear tokens
    await clearTokens();
    return null;
  }
}

/**
 * Clear stored tokens (logout)
 */
export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_CONFIG.name);
  cookieStore.delete(PKCE_COOKIE_CONFIG.name);
}

// ============================================================================
// Auth Status Functions
// ============================================================================

/**
 * Get current authentication state
 */
export async function getAuthState(): Promise<AuthState> {
  const storedTokens = await getStoredTokens();

  if (!storedTokens) {
    return {
      status: "unauthenticated",
      isAuthenticated: false,
    };
  }

  // Check if token is expired
  const isExpired = Date.now() >= storedTokens.expires_at - 5 * 60 * 1000;

  if (isExpired) {
    // Try to refresh
    try {
      const newTokens = await refreshAccessToken(storedTokens.refresh_token);
      await storeTokens(newTokens);

      // Fetch channel info
      const channel = await fetchChannelInfo(newTokens.access_token);

      return {
        status: "authenticated",
        isAuthenticated: true,
        expiresAt: newTokens.expires_at,
        channel,
      };
    } catch {
      await clearTokens();
      return {
        status: "unauthenticated",
        isAuthenticated: false,
        error: "Token refresh failed",
      };
    }
  }

  // Token is valid, fetch channel info
  try {
    const channel = await fetchChannelInfo(storedTokens.access_token);

    return {
      status: "authenticated",
      isAuthenticated: true,
      expiresAt: new Date(storedTokens.expires_at).toISOString(),
      channel,
    };
  } catch {
    return {
      status: "authenticated",
      isAuthenticated: true,
      expiresAt: new Date(storedTokens.expires_at).toISOString(),
    };
  }
}

/**
 * Fetch authenticated user's channel info
 */
async function fetchChannelInfo(
  accessToken: string
): Promise<AuthState["channel"]> {
  const response = await fetch(
    `${YOUTUBE_CHANNEL_API}?part=snippet&mine=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch channel info");
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("No channel found");
  }

  const channel = data.items[0];

  return {
    id: channel.id,
    title: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.default?.url,
  };
}
