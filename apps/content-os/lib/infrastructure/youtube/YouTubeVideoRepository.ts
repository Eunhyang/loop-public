// Infrastructure Repository - YouTube API integration
// Follows Content OS Clean Architecture Constitution

import {
  IYouTubeVideoRepository,
  FetchVideosPageParams,
  FetchVideoDetailsParams,
} from '@/lib/application/youtube/ports/IYouTubeVideoRepository';
import { PaginatedResult, VideoSummary, VideoId } from '@/lib/domain/youtube/types';
import {
  YouTubeSearchResponseDTO,
  YouTubeVideosResponseDTO,
} from './dtos/YouTubeSearchResponseDTO';
import {
  mapSearchResponseToPaginatedResult,
  mapVideoDetailToDuration,
} from './mappers/VideoMapper';

const YOUTUBE_DATA_API = 'https://www.googleapis.com/youtube/v3';
const VIDEO_DETAILS_CHUNK_SIZE = 50; // YouTube API limit

export class YouTubeVideoRepository implements IYouTubeVideoRepository {
  async fetchVideosPage(params: FetchVideosPageParams): Promise<PaginatedResult<VideoSummary>> {
    const { accessToken, maxResults, pageToken } = params;

    const searchParams = new URLSearchParams({
      part: 'snippet',
      forMine: 'true',
      maxResults: String(maxResults),
      order: 'date',
      type: 'video',
    });

    if (pageToken) {
      searchParams.set('pageToken', pageToken);
    }

    const response = await fetch(`${YOUTUBE_DATA_API}/search?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new YouTubeAPIError(response.status, errorText, 'search.list');
    }

    const dto: YouTubeSearchResponseDTO = await response.json();
    return mapSearchResponseToPaginatedResult(dto);
  }

  async fetchVideoDetails(params: FetchVideoDetailsParams): Promise<Map<VideoId, number>> {
    const { accessToken, videoIds } = params;

    // Chunk video IDs to respect API limits (50 per request)
    const chunks = this.chunkArray(videoIds, VIDEO_DETAILS_CHUNK_SIZE);
    const durationsMap = new Map<VideoId, number>();

    // Fetch all chunks in parallel
    const chunkResults = await Promise.all(
      chunks.map(chunk => this.fetchVideoDetailsChunk(accessToken, chunk))
    );

    // Merge all results
    for (const chunkMap of chunkResults) {
      for (const [videoId, duration] of chunkMap.entries()) {
        durationsMap.set(videoId, duration);
      }
    }

    return durationsMap;
  }

  private async fetchVideoDetailsChunk(
    accessToken: string,
    videoIds: VideoId[]
  ): Promise<Map<VideoId, number>> {
    const searchParams = new URLSearchParams({
      part: 'contentDetails',
      id: videoIds.join(','),
    });

    const response = await fetch(`${YOUTUBE_DATA_API}/videos?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new YouTubeAPIError(response.status, errorText, 'videos.list');
    }

    const dto: YouTubeVideosResponseDTO = await response.json();
    const durationsMap = new Map<VideoId, number>();

    for (const item of dto.items) {
      const { videoId, duration } = mapVideoDetailToDuration(item);
      durationsMap.set(videoId, duration);
    }

    return durationsMap;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export class YouTubeAPIError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly endpoint: string
  ) {
    super(`YouTube API Error (${endpoint}): ${statusCode} - ${message}`);
    this.name = 'YouTubeAPIError';
  }
}

// Factory function
export function createYouTubeVideoRepository(): IYouTubeVideoRepository {
  return new YouTubeVideoRepository();
}
