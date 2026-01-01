"use client";

import { ProcessedVideo } from "@/types/video";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  ExternalLink,
  MoreHorizontal,
  Bookmark,
  BookmarkX,
  Ban,
  Eye,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import { ExposureGradeBadge, ScoreIndicator, VideoStatusIndicators } from "./badges";
import { cn } from "@/lib/utils";

interface VideoTableRowProps {
  video: ProcessedVideo;
  isSelected: boolean;
  isCollected: boolean;
  isBlocked: boolean;
  onSelectChange: (checked: boolean) => void;
  onCollect: () => void;
  onUncollect: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  onBlockChannel: () => void;
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function VideoTableRow({
  video,
  isSelected,
  isCollected,
  isBlocked,
  onSelectChange,
  onCollect,
  onUncollect,
  onBlock,
  onUnblock,
  onBlockChannel,
}: VideoTableRowProps) {
  return (
    <TableRow
      className={cn(
        isSelected && "bg-muted/50",
        isBlocked && "opacity-50"
      )}
    >
      {/* Checkbox */}
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectChange}
          aria-label={`Select ${video.title}`}
        />
      </TableCell>

      {/* Thumbnail + Duration */}
      <TableCell>
        <div className="relative w-20 h-12 rounded overflow-hidden bg-muted">
          <Image
            src={video.thumbnail}
            alt={video.title}
            fill
            className="object-cover"
            sizes="80px"
          />
          {video.duration && (
            <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[10px] px-1 rounded">
              {video.duration}
            </span>
          )}
        </div>
      </TableCell>

      {/* Title (YouTube link) + Status */}
      <TableCell>
        <div className="flex items-start gap-2">
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-foreground hover:text-primary transition-colors line-clamp-2 flex-1"
          >
            {video.title}
            <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
          </a>
          <VideoStatusIndicators
            isCollected={isCollected}
            isBlocked={isBlocked}
          />
        </div>
      </TableCell>

      {/* Views */}
      <TableCell className="text-right font-medium">
        {formatNumber(video.views)}
      </TableCell>

      {/* Channel (name + subscribers) */}
      <TableCell>
        <div className="text-sm">
          <div className="font-medium">{video.channel.name}</div>
          <div className="text-muted-foreground text-xs">
            {formatNumber(video.channel.subscribers)} subs
          </div>
        </div>
      </TableCell>

      {/* Contribution Score */}
      <TableCell className="text-right">
        <ScoreIndicator score={video.contributionScore} label="Contribution" />
      </TableCell>

      {/* Impact Score */}
      <TableCell className="text-right">
        <ScoreIndicator score={video.impactScore} label="Impact" />
      </TableCell>

      {/* Exposure Grade */}
      <TableCell>
        <ExposureGradeBadge grade={video.exposureGrade} />
      </TableCell>

      {/* Published Date */}
      <TableCell className="text-muted-foreground">
        {formatDate(video.publishedAt)}
      </TableCell>

      {/* Actions Menu */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Collection actions */}
            {isCollected ? (
              <DropdownMenuItem onClick={onUncollect}>
                <BookmarkX className="h-4 w-4 mr-2" />
                Remove from Collection
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onCollect}>
                <Bookmark className="h-4 w-4 mr-2" />
                Add to Collection
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* Block actions */}
            {isBlocked ? (
              <DropdownMenuItem onClick={onUnblock}>
                <Eye className="h-4 w-4 mr-2" />
                Unblock Video
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={onBlock}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide this Video
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onBlockChannel}
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block Channel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
