"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./use-local-storage";
import { Video } from "@/types/video";
import {
  CollectedVideo,
  BlockedVideo,
  BlockedChannel,
  CollectionState,
} from "@/types/collection";

const COLLECTION_STORAGE_KEY = "video-collection";
const BLOCKED_VIDEOS_KEY = "blocked-videos";
const BLOCKED_CHANNELS_KEY = "blocked-channels";

interface UseCollectionReturn {
  // State
  collectedVideos: CollectedVideo[];
  blockedVideos: BlockedVideo[];
  blockedChannels: BlockedChannel[];

  // Collection actions
  collectVideo: (video: Video, notes?: string) => void;
  uncollectVideo: (videoId: string) => void;
  collectVideos: (videos: Video[]) => void;
  uncollectVideos: (videoIds: string[]) => void;
  isCollected: (videoId: string) => boolean;

  // Block actions
  blockVideo: (video: Video, reason?: string) => void;
  unblockVideo: (videoId: string) => void;
  blockChannel: (channelName: string, reason?: string) => void;
  unblockChannel: (channelName: string) => void;
  isBlocked: (video: Video) => boolean;
  isChannelBlocked: (channelName: string) => boolean;

  // Clear actions
  clearCollection: () => void;
  clearBlocked: () => void;

  // Stats
  collectionCount: number;
  blockedCount: number;
}

/**
 * Hook for managing video collection and blocked videos/channels
 *
 * @returns Collection management functions and state
 */
export function useCollection(): UseCollectionReturn {
  const [collectedVideos, setCollectedVideos] = useLocalStorage<CollectedVideo[]>(
    COLLECTION_STORAGE_KEY,
    []
  );
  const [blockedVideos, setBlockedVideos] = useLocalStorage<BlockedVideo[]>(
    BLOCKED_VIDEOS_KEY,
    []
  );
  const [blockedChannels, setBlockedChannels] = useLocalStorage<BlockedChannel[]>(
    BLOCKED_CHANNELS_KEY,
    []
  );

  // Collect a single video
  const collectVideo = useCallback(
    (video: Video, notes?: string) => {
      setCollectedVideos((prev) => {
        // Check if already collected
        if (prev.some((c) => c.videoId === video.id)) {
          return prev;
        }

        const newCollectedVideo: CollectedVideo = {
          videoId: video.id,
          collectedAt: new Date().toISOString(),
          notes,
          videoSnapshot: {
            title: video.title,
            channelName: video.channel.name,
            views: video.views,
            thumbnail: video.thumbnail,
            youtubeUrl: video.youtubeUrl,
          },
        };

        return [newCollectedVideo, ...prev];
      });
    },
    [setCollectedVideos]
  );

  // Uncollect a video
  const uncollectVideo = useCallback(
    (videoId: string) => {
      setCollectedVideos((prev) => prev.filter((c) => c.videoId !== videoId));
    },
    [setCollectedVideos]
  );

  // Collect multiple videos
  const collectVideos = useCallback(
    (videos: Video[]) => {
      setCollectedVideos((prev) => {
        const existingIds = new Set(prev.map((c) => c.videoId));
        const newVideos = videos.filter((v) => !existingIds.has(v.id));

        const newCollectedVideos: CollectedVideo[] = newVideos.map((video) => ({
          videoId: video.id,
          collectedAt: new Date().toISOString(),
          videoSnapshot: {
            title: video.title,
            channelName: video.channel.name,
            views: video.views,
            thumbnail: video.thumbnail,
            youtubeUrl: video.youtubeUrl,
          },
        }));

        return [...newCollectedVideos, ...prev];
      });
    },
    [setCollectedVideos]
  );

  // Uncollect multiple videos
  const uncollectVideos = useCallback(
    (videoIds: string[]) => {
      const idsToRemove = new Set(videoIds);
      setCollectedVideos((prev) =>
        prev.filter((c) => !idsToRemove.has(c.videoId))
      );
    },
    [setCollectedVideos]
  );

  // Check if video is collected
  const isCollected = useCallback(
    (videoId: string): boolean => {
      return collectedVideos.some((c) => c.videoId === videoId);
    },
    [collectedVideos]
  );

  // Block a video
  const blockVideo = useCallback(
    (video: Video, reason?: string) => {
      setBlockedVideos((prev) => {
        if (prev.some((b) => b.videoId === video.id)) {
          return prev;
        }

        const newBlockedVideo: BlockedVideo = {
          videoId: video.id,
          blockedAt: new Date().toISOString(),
          reason,
          title: video.title,
        };

        return [newBlockedVideo, ...prev];
      });
    },
    [setBlockedVideos]
  );

  // Unblock a video
  const unblockVideo = useCallback(
    (videoId: string) => {
      setBlockedVideos((prev) => prev.filter((b) => b.videoId !== videoId));
    },
    [setBlockedVideos]
  );

  // Block a channel
  const blockChannel = useCallback(
    (channelName: string, reason?: string) => {
      setBlockedChannels((prev) => {
        if (prev.some((b) => b.channelName === channelName)) {
          return prev;
        }

        const newBlockedChannel: BlockedChannel = {
          channelName,
          blockedAt: new Date().toISOString(),
          reason,
        };

        return [newBlockedChannel, ...prev];
      });
    },
    [setBlockedChannels]
  );

  // Unblock a channel
  const unblockChannel = useCallback(
    (channelName: string) => {
      setBlockedChannels((prev) =>
        prev.filter((b) => b.channelName !== channelName)
      );
    },
    [setBlockedChannels]
  );

  // Check if video or its channel is blocked
  const isBlocked = useCallback(
    (video: Video): boolean => {
      const videoBlocked = blockedVideos.some((b) => b.videoId === video.id);
      const channelBlocked = blockedChannels.some(
        (b) => b.channelName === video.channel.name
      );
      return videoBlocked || channelBlocked;
    },
    [blockedVideos, blockedChannels]
  );

  // Check if channel is blocked
  const isChannelBlocked = useCallback(
    (channelName: string): boolean => {
      return blockedChannels.some((b) => b.channelName === channelName);
    },
    [blockedChannels]
  );

  // Clear collection
  const clearCollection = useCallback(() => {
    setCollectedVideos([]);
  }, [setCollectedVideos]);

  // Clear blocked
  const clearBlocked = useCallback(() => {
    setBlockedVideos([]);
    setBlockedChannels([]);
  }, [setBlockedVideos, setBlockedChannels]);

  // Stats
  const collectionCount = collectedVideos.length;
  const blockedCount = blockedVideos.length + blockedChannels.length;

  return {
    collectedVideos,
    blockedVideos,
    blockedChannels,
    collectVideo,
    uncollectVideo,
    collectVideos,
    uncollectVideos,
    isCollected,
    blockVideo,
    unblockVideo,
    blockChannel,
    unblockChannel,
    isBlocked,
    isChannelBlocked,
    clearCollection,
    clearBlocked,
    collectionCount,
    blockedCount,
  };
}
