// Application Port - Repository interface
// Follows Content OS Clean Architecture Constitution

import { PaginatedResult, VideoSummary, PageToken, VideoId } from '@/lib/domain/youtube/types';

export interface FetchVideosPageParams {
  accessToken: string;
  maxResults: number;
  pageToken?: PageToken;
}

export interface FetchVideoDetailsParams {
  accessToken: string;
  videoIds: VideoId[];
}

export interface IYouTubeVideoRepository {
  fetchVideosPage(params: FetchVideosPageParams): Promise<PaginatedResult<VideoSummary>>;
  fetchVideoDetails(params: FetchVideoDetailsParams): Promise<Map<VideoId, number>>;
}
