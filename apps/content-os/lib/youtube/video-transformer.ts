/**
 * Transform YouTube API responses to internal Video type
 */

import { Video } from "@/types/video";
import {
  YouTubeSearchItem,
  YouTubeVideoItem,
  YouTubeChannelItem,
} from "@/types/youtube-api";

/**
 * Parse ISO 8601 duration to human-readable format
 * Example: "PT1H23M45S" -> "1:23:45", "PT10M32S" -> "10:32"
 */
export function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  if (!match) {
    return "0:00";
  }

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Calculate velocity (views per hour) based on view count and publish date
 */
export function calculateVelocity(views: number, publishedAt: string): number {
  const publishDate = new Date(publishedAt);
  const now = new Date();
  const hoursElapsed = Math.max(
    1,
    (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60)
  );

  return Math.round(views / hoursElapsed);
}

/**
 * Calculate market score based on views and velocity
 * Legacy field kept for compatibility
 */
export function calculateMarketScore(views: number, velocity: number): number {
  // Logarithmic scale for views (weight: 0.6)
  const viewScore = Math.min(10, Math.log10(views + 1) * 1.5);
  // Velocity score normalized (weight: 0.4)
  const velocityScore = Math.min(10, Math.log10(velocity + 1) * 2);

  const score = viewScore * 0.6 + velocityScore * 0.4;
  return Math.round(score * 10) / 10;
}

/**
 * Get the best available thumbnail URL
 */
function getBestThumbnail(
  thumbnails: YouTubeSearchItem["snippet"]["thumbnails"]
): string {
  return (
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ""
  );
}

/**
 * Interface for combined data from multiple API calls
 */
export interface CombinedVideoData {
  searchItem: YouTubeSearchItem;
  videoDetails?: YouTubeVideoItem;
  channelDetails?: YouTubeChannelItem;
}

/**
 * Transform combined YouTube API data to internal Video type
 */
export function transformToVideo(data: CombinedVideoData): Video {
  const { searchItem, videoDetails, channelDetails } = data;
  const videoId = searchItem.id.videoId || "";

  // Extract view count
  const viewCount = parseInt(
    videoDetails?.statistics?.viewCount || "0",
    10
  );

  // Extract subscriber count
  const subscriberCount = parseInt(
    channelDetails?.statistics?.subscriberCount || "0",
    10
  );

  // Parse duration
  const duration = videoDetails?.contentDetails?.duration
    ? parseDuration(videoDetails.contentDetails.duration)
    : undefined;

  // Calculate velocity
  const velocity = calculateVelocity(viewCount, searchItem.snippet.publishedAt);

  // Calculate market score
  const marketScore = calculateMarketScore(viewCount, velocity);

  return {
    id: videoId,
    youtubeId: videoId,
    thumbnail: getBestThumbnail(searchItem.snippet.thumbnails),
    title: searchItem.snippet.title,
    channel: {
      name: searchItem.snippet.channelTitle,
      subscribers: subscriberCount,
    },
    channelId: searchItem.snippet.channelId,
    publishedAt: searchItem.snippet.publishedAt,
    views: viewCount,
    marketScore,
    velocity,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    duration,
    likeCount: videoDetails?.statistics?.likeCount
      ? parseInt(videoDetails.statistics.likeCount, 10)
      : undefined,
    commentCount: videoDetails?.statistics?.commentCount
      ? parseInt(videoDetails.statistics.commentCount, 10)
      : undefined,
    categoryId: videoDetails?.snippet?.categoryId,
    description: searchItem.snippet.description?.slice(0, 200),
  };
}

/**
 * Transform array of combined data to Video array
 */
export function transformToVideos(dataList: CombinedVideoData[]): Video[] {
  return dataList.map(transformToVideo);
}
