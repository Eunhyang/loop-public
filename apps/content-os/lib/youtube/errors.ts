/**
 * YouTube API Error Handling
 */

import { YouTubeAPIErrorCode } from "@/types/youtube";
import { YouTubeAPIError } from "@/types/youtube-api";

/**
 * Custom error class for YouTube API errors
 */
export class YouTubeServiceError extends Error {
  constructor(
    public readonly code: YouTubeAPIErrorCode,
    message: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = "YouTubeServiceError";
  }
}

/**
 * Map YouTube API error response to internal error code
 */
export function mapAPIErrorToCode(
  error: YouTubeAPIError
): YouTubeAPIErrorCode {
  const { code, errors } = error.error;
  const reason = errors?.[0]?.reason || "";

  // HTTP status code based mapping
  switch (code) {
    case 400:
      if (reason === "invalidParameter" || reason === "badRequest") {
        return "INVALID_QUERY";
      }
      return "INVALID_QUERY";

    case 401:
    case 403:
      if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
        return "QUOTA_EXCEEDED";
      }
      if (reason === "accessNotConfigured" || reason === "keyInvalid") {
        return "INVALID_API_KEY";
      }
      if (reason === "rateLimitExceeded") {
        return "RATE_LIMITED";
      }
      return "FORBIDDEN";

    case 404:
      if (reason.includes("video")) {
        return "VIDEO_NOT_FOUND";
      }
      if (reason.includes("channel")) {
        return "CHANNEL_NOT_FOUND";
      }
      return "VIDEO_NOT_FOUND";

    case 429:
      return "RATE_LIMITED";

    case 500:
    case 502:
    case 503:
    case 504:
      return "INTERNAL_ERROR";

    default:
      return "UNKNOWN_ERROR";
  }
}

/**
 * Get user-friendly error message for error code
 */
export function getErrorMessage(code: YouTubeAPIErrorCode): string {
  switch (code) {
    case "INVALID_API_KEY":
      return "YouTube API key is invalid or not configured. Please check your settings.";
    case "QUOTA_EXCEEDED":
      return "YouTube API daily quota exceeded. Please try again tomorrow.";
    case "INVALID_QUERY":
      return "Invalid search query. Please enter at least 2 characters.";
    case "NETWORK_ERROR":
      return "Network error occurred. Please check your connection.";
    case "RATE_LIMITED":
      return "Too many requests. Please wait a moment and try again.";
    case "VIDEO_NOT_FOUND":
      return "Video not found.";
    case "CHANNEL_NOT_FOUND":
      return "Channel not found.";
    case "FORBIDDEN":
      return "Access forbidden. Please check API permissions.";
    case "INTERNAL_ERROR":
      return "YouTube server error. Please try again later.";
    case "UNKNOWN_ERROR":
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

/**
 * Check if error is a YouTube API error response
 */
export function isYouTubeAPIError(error: unknown): error is YouTubeAPIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as YouTubeAPIError).error === "object" &&
    "code" in (error as YouTubeAPIError).error
  );
}

/**
 * Create a YouTubeServiceError from various error types
 */
export function createServiceError(error: unknown): YouTubeServiceError {
  // Already a service error
  if (error instanceof YouTubeServiceError) {
    return error;
  }

  // YouTube API error response
  if (isYouTubeAPIError(error)) {
    const code = mapAPIErrorToCode(error);
    return new YouTubeServiceError(
      code,
      getErrorMessage(code),
      error.error.message
    );
  }

  // Network/fetch error
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return new YouTubeServiceError(
      "NETWORK_ERROR",
      getErrorMessage("NETWORK_ERROR"),
      error.message
    );
  }

  // Generic error
  if (error instanceof Error) {
    return new YouTubeServiceError(
      "UNKNOWN_ERROR",
      getErrorMessage("UNKNOWN_ERROR"),
      error.message
    );
  }

  // Unknown error type
  return new YouTubeServiceError(
    "UNKNOWN_ERROR",
    getErrorMessage("UNKNOWN_ERROR"),
    String(error)
  );
}
