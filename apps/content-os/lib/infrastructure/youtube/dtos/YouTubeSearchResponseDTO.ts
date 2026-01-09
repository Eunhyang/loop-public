// Infrastructure DTO - YouTube API response schema (external)
// Follows Content OS Clean Architecture Constitution

export interface YouTubeSearchItemDTO {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

export interface YouTubeSearchResponseDTO {
  nextPageToken?: string;
  pageInfo: {
    totalResults: number;
  };
  items: YouTubeSearchItemDTO[];
}

// DTO for videos.list API (contentDetails)
export interface YouTubeVideoItemDTO {
  id: string;
  contentDetails: {
    duration: string; // ISO 8601 format (e.g., "PT4M13S")
  };
}

export interface YouTubeVideosResponseDTO {
  items: YouTubeVideoItemDTO[];
}
