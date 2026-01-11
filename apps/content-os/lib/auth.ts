/**
 * Authentication utilities for Content OS
 * Uses Dashboard OAuth system for unified authentication
 */

// Session cookie configuration (matches Dashboard OAuth JWT)
export const SESSION_COOKIE_NAME = "loop_api_token";
export const SESSION_MAX_AGE = 3600; // 1 hour (JWT expiration)
