// Application Use Case - Orchestrates pagination logic
// Follows Content OS Clean Architecture Constitution

import { IYouTubeVideoRepository } from '../ports/IYouTubeVideoRepository';
import { VideoList, VideoSummary, PageToken, MAX_LIMIT } from '@/lib/domain/youtube/types';
import {
  mergeVideoPages,
  shouldFetchNextPage,
  calculatePageSize,
  validateLimit,
} from '@/lib/domain/youtube/pagination';

export interface FetchAllRecentVideosInput {
  accessToken: string;
  limit: number;
}

export interface FetchAllRecentVideosOutput {
  videoList: VideoList;
}

export class FetchAllRecentVideosUseCase {
  constructor(private readonly repository: IYouTubeVideoRepository) {}

  async execute(input: FetchAllRecentVideosInput): Promise<FetchAllRecentVideosOutput> {
    const { accessToken, limit } = input;

    const validatedLimit = validateLimit(limit, MAX_LIMIT);

    if (validatedLimit === 0) {
      return { videoList: { videos: [], totalCount: 0 } };
    }

    let allVideos: VideoSummary[] = [];
    let pageToken: PageToken | null = null;
    let pagesFetched = 0;
    const MAX_PAGES = 10;

    do {
      const pageSize = calculatePageSize(allVideos.length, validatedLimit);

      const result = await this.repository.fetchVideosPage({
        accessToken,
        maxResults: pageSize,
        pageToken: pageToken ?? undefined,
      });

      if (result.items.length === 0) break;

      allVideos = mergeVideoPages(allVideos, result.items);
      pageToken = result.nextPageToken;
      pagesFetched++;

      if (pagesFetched >= MAX_PAGES) break;
      if (allVideos.length >= validatedLimit) break;
    } while (shouldFetchNextPage(allVideos.length, validatedLimit, pageToken !== null));

    const trimmedVideos = allVideos.slice(0, validatedLimit);

    const durationsMap = await this.repository.fetchVideoDetails({
      accessToken,
      videoIds: trimmedVideos.map(v => v.videoId),
    });

    const videosWithDurations = trimmedVideos.map(video => ({
      ...video,
      duration: durationsMap.get(video.videoId) ?? 0,
    }));

    return {
      videoList: {
        videos: videosWithDurations,
        totalCount: videosWithDurations.length,
      },
    };
  }
}

export function createFetchAllRecentVideosUseCase(
  repository: IYouTubeVideoRepository
): FetchAllRecentVideosUseCase {
  return new FetchAllRecentVideosUseCase(repository);
}
