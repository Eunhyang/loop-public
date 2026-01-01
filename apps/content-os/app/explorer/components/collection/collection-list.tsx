"use client";

import { CollectedVideo, BlockedVideo, BlockedChannel } from "@/types/collection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Trash2,
  Bookmark,
  Ban,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CollectionListProps {
  collectedVideos: CollectedVideo[];
  onUncollect: (videoId: string) => void;
  className?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * List of collected videos
 */
export function CollectionList({
  collectedVideos,
  onUncollect,
  className,
}: CollectionListProps) {
  if (collectedVideos.length === 0) {
    return (
      <div className={cn("text-center py-16", className)}>
        <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No videos collected</h3>
        <p className="text-sm text-muted-foreground">
          Collect videos from the Explorer tab to save them here
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {collectedVideos.length} video{collectedVideos.length !== 1 ? "s" : ""} collected
        </h3>
      </div>

      {collectedVideos.map((collected) => (
        <Card key={collected.videoId} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="relative w-24 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={collected.videoSnapshot.thumbnail}
                  alt={collected.videoSnapshot.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <a
                  href={collected.videoSnapshot.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                >
                  {collected.videoSnapshot.title}
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                </a>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {collected.videoSnapshot.channelName} | {formatNumber(collected.videoSnapshot.views)} views
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Collected: {formatDate(collected.collectedAt)}
                </p>
                {collected.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {collected.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onUncollect(collected.videoId)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove from collection</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface BlockedListProps {
  blockedVideos: BlockedVideo[];
  blockedChannels: BlockedChannel[];
  onUnblockVideo: (videoId: string) => void;
  onUnblockChannel: (channelName: string) => void;
  className?: string;
}

/**
 * List of blocked videos and channels
 */
export function BlockedList({
  blockedVideos,
  blockedChannels,
  onUnblockVideo,
  onUnblockChannel,
  className,
}: BlockedListProps) {
  const hasBlocked = blockedVideos.length > 0 || blockedChannels.length > 0;

  if (!hasBlocked) {
    return (
      <div className={cn("text-center py-16", className)}>
        <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No blocked items</h3>
        <p className="text-sm text-muted-foreground">
          Block videos or channels to hide them from your feed
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Blocked Channels */}
      {blockedChannels.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Blocked Channels ({blockedChannels.length})
          </h3>
          <div className="space-y-2">
            {blockedChannels.map((blocked) => (
              <div
                key={blocked.channelName}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
              >
                <div>
                  <p className="text-sm font-medium">{blocked.channelName}</p>
                  <p className="text-xs text-muted-foreground">
                    Blocked: {formatDate(blocked.blockedAt)}
                    {blocked.reason && ` - ${blocked.reason}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnblockChannel(blocked.channelName)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocked Videos */}
      {blockedVideos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Hidden Videos ({blockedVideos.length})
          </h3>
          <div className="space-y-2">
            {blockedVideos.map((blocked) => (
              <div
                key={blocked.videoId}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{blocked.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Hidden: {formatDate(blocked.blockedAt)}
                    {blocked.reason && ` - ${blocked.reason}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnblockVideo(blocked.videoId)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Show
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
