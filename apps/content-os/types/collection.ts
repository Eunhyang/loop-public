import { Video } from "./video";

// Collected video with collection metadata
export interface CollectedVideo {
  videoId: string;
  collectedAt: string; // ISO date string
  notes?: string;
  tags?: string[];
  // Snapshot of video data at collection time
  videoSnapshot: {
    title: string;
    channelName: string;
    views: number;
    thumbnail: string;
    youtubeUrl: string;
  };
}

// Blocked video
export interface BlockedVideo {
  videoId: string;
  blockedAt: string; // ISO date string
  reason?: string;
  title: string; // for display in blocked list
}

// Blocked channel (blocks all videos from this channel)
export interface BlockedChannel {
  channelName: string;
  blockedAt: string; // ISO date string
  reason?: string;
}

// Collection state
export interface CollectionState {
  collectedVideos: CollectedVideo[];
  blockedVideos: BlockedVideo[];
  blockedChannels: BlockedChannel[];
}

// Collection actions
export type CollectionAction =
  | { type: "COLLECT_VIDEO"; video: Video; notes?: string }
  | { type: "UNCOLLECT_VIDEO"; videoId: string }
  | { type: "BLOCK_VIDEO"; video: Video; reason?: string }
  | { type: "UNBLOCK_VIDEO"; videoId: string }
  | { type: "BLOCK_CHANNEL"; channelName: string; reason?: string }
  | { type: "UNBLOCK_CHANNEL"; channelName: string }
  | { type: "CLEAR_COLLECTION" }
  | { type: "CLEAR_BLOCKED" };

// Check if a video or its channel is blocked
export function isVideoBlocked(
  video: Video,
  blockedVideos: BlockedVideo[],
  blockedChannels: BlockedChannel[]
): boolean {
  const videoBlocked = blockedVideos.some((b) => b.videoId === video.id);
  const channelBlocked = blockedChannels.some(
    (b) => b.channelName === video.channel.name
  );
  return videoBlocked || channelBlocked;
}

// Check if a video is collected
export function isVideoCollected(
  videoId: string,
  collectedVideos: CollectedVideo[]
): boolean {
  return collectedVideos.some((c) => c.videoId === videoId);
}
