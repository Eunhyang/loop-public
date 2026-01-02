/**
 * Authentication utilities for Content OS
 * Simple hardcoded auth with cookie-based session
 */

// Session cookie configuration
export const SESSION_COOKIE_NAME = "content-os-session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Validate credentials against environment variables
 */
export function validateCredentials(
  username: string,
  password: string
): boolean {
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;

  if (!validUsername || !validPassword) {
    console.error("AUTH_USERNAME or AUTH_PASSWORD not configured");
    return false;
  }

  return username === validUsername && password === validPassword;
}

/**
 * Generate a simple session token
 */
export function generateSessionToken(): string {
  return crypto.randomUUID();
}
