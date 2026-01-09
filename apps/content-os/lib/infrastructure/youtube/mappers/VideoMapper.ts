// Infrastructure Mapper - DTO ↔ Domain conversion
// Follows Content OS Clean Architecture Constitution

import { VideoSummary, VideoId, PageToken, PaginatedResult } from '@/lib/domain/youtube/types';
import {
  YouTubeSearchResponseDTO,
  YouTubeSearchItemDTO,
  YouTubeVideoItemDTO,
} from '../dtos/YouTubeSearchResponseDTO';

/**
 * Maps YouTube search item to domain VideoSummary
 * Note: duration is set to 0 (search.list doesn't include it)
 */
export function mapSearchItemToVideoSummary(item: YouTubeSearchItemDTO): VideoSummary {
  return {
    videoId: item.id.videoId as VideoId,
    title: item.snippet.title,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      '',
    publishedAt: item.snippet.publishedAt,
    duration: 0, // Will be filled by fetchVideoDetails
  };
}

/**
 * Maps YouTube search response to paginated result
 */
export function mapSearchResponseToPaginatedResult(
  dto: YouTubeSearchResponseDTO
): PaginatedResult<VideoSummary> {
  return {
    items: dto.items.map(mapSearchItemToVideoSummary),
    nextPageToken: (dto.nextPageToken as PageToken) ?? null,
    totalResults: dto.pageInfo.totalResults,
  };
}

/**
 * Parses ISO 8601 duration string to seconds
 * Examples: "PT4M13S" → 253, "PT1H2M3S" → 3723
 */
export function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  const seconds = parseInt(match[3] ?? '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Maps YouTube video detail item to duration
 */
export function mapVideoDetailToDuration(item: YouTubeVideoItemDTO): {
  videoId: VideoId;
  duration: number;
} {
  return {
    videoId: item.id as VideoId,
    duration: parseISO8601Duration(item.contentDetails.duration),
  };
}
