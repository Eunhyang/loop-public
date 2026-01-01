"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bookmark, BookmarkCheck, Ban } from "lucide-react";

interface CollectedBadgeProps {
  isCollected: boolean;
  className?: string;
}

/**
 * Badge indicating if a video is in the collection
 */
export function CollectedBadge({ isCollected, className }: CollectedBadgeProps) {
  if (!isCollected) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 bg-primary/10 text-primary border-primary/20",
        className
      )}
    >
      <BookmarkCheck className="h-3 w-3" />
      Collected
    </Badge>
  );
}

/**
 * Icon indicator for collection status
 */
export function CollectedIcon({
  isCollected,
  className,
}: CollectedBadgeProps) {
  if (!isCollected) return null;

  return (
    <BookmarkCheck
      className={cn("h-4 w-4 text-primary", className)}
      aria-label="In collection"
    />
  );
}

interface BlockedBadgeProps {
  isBlocked: boolean;
  type?: "video" | "channel";
  className?: string;
}

/**
 * Badge indicating if a video or channel is blocked
 */
export function BlockedBadge({
  isBlocked,
  type = "video",
  className,
}: BlockedBadgeProps) {
  if (!isBlocked) return null;

  return (
    <Badge
      variant="destructive"
      className={cn("gap-1", className)}
    >
      <Ban className="h-3 w-3" />
      {type === "channel" ? "Channel Blocked" : "Blocked"}
    </Badge>
  );
}

/**
 * Icon indicator for blocked status
 */
export function BlockedIcon({ isBlocked, className }: BlockedBadgeProps) {
  if (!isBlocked) return null;

  return (
    <Ban
      className={cn("h-4 w-4 text-destructive", className)}
      aria-label="Blocked"
    />
  );
}

/**
 * Combined status indicators for a video row
 */
export function VideoStatusIndicators({
  isCollected,
  isBlocked,
  className,
}: {
  isCollected: boolean;
  isBlocked: boolean;
  className?: string;
}) {
  if (!isCollected && !isBlocked) return null;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <CollectedIcon isCollected={isCollected} />
      <BlockedIcon isBlocked={isBlocked} />
    </div>
  );
}
