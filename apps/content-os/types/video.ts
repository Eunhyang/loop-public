export interface VideoChannel {
  name: string;
  subscribers: number;
}

// Exposure grade for video discovery probability
export type ExposureGrade = "Great" | "Good" | "Normal" | "Bad";

export interface Video {
  id: string;
  thumbnail: string;
  title: string;
  channel: VideoChannel;
  publishedAt: string; // ISO date string
  views: number;
  marketScore: number; // 0-10 (legacy, kept for compatibility)
  velocity: number; // views per hour
  youtubeUrl: string;
  // New fields for Video Explorer Live Search
  duration?: string; // e.g., "10:32"
  contributionScore?: number; // 0-10, calculated from views/subscribers ratio
  impactScore?: number; // 0-10, calculated from views and velocity
  exposureGrade?: ExposureGrade; // Great/Good/Normal/Bad
  isCollected?: boolean; // whether video is in collection
  isBlocked?: boolean; // whether video/channel is blocked
}

// Extended Video with calculated scores (used after processing)
export interface ProcessedVideo extends Video {
  contributionScore: number;
  impactScore: number;
  exposureGrade: ExposureGrade;
}

export type SortField =
  | "marketScore"
  | "velocity"
  | "views"
  | "publishedAt"
  | "title"
  | "contributionScore"
  | "impactScore"
  | "exposureGrade";
export type SortOrder = "asc" | "desc";

export interface SortState {
  field: SortField;
  order: SortOrder;
}

export type PeriodFilter = "all" | "7days" | "30days";

export interface FilterState {
  search: string;
  period: PeriodFilter;
  channel: string; // empty string means all
  minViews: number;
}
