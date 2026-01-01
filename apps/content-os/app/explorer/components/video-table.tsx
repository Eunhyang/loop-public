"use client";

import { ProcessedVideo, SortState, SortField } from "@/types/video";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { VideoTableRow } from "./video-table-row";

interface VideoTableProps {
  videos: ProcessedVideo[];
  selectedIds: Set<string>;
  onSelectChange: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  sortState: SortState;
  onSortChange: (field: SortField) => void;
  // Collection/Block state
  isCollected: (videoId: string) => boolean;
  isBlocked: (video: ProcessedVideo) => boolean;
  // Collection/Block actions
  onCollect: (video: ProcessedVideo) => void;
  onUncollect: (videoId: string) => void;
  onBlock: (video: ProcessedVideo) => void;
  onUnblock: (videoId: string) => void;
  onBlockChannel: (channelName: string) => void;
}

function SortableHeader({
  field,
  label,
  currentSort,
  onSort,
  align = "left",
}: {
  field: SortField;
  label: string;
  currentSort: SortState;
  onSort: (field: SortField) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort.field === field;

  return (
    <button
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${
        align === "right" ? "ml-auto" : ""
      }`}
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        currentSort.order === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  );
}

export function VideoTable({
  videos,
  selectedIds,
  onSelectChange,
  onSelectAll,
  sortState,
  onSortChange,
  isCollected,
  isBlocked,
  onCollect,
  onUncollect,
  onBlock,
  onUnblock,
  onBlockChannel,
}: VideoTableProps) {
  const allSelected = videos.length > 0 && selectedIds.size === videos.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < videos.length;

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">No videos found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {/* 1. Checkbox */}
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(checked) => onSelectAll(checked as boolean)}
                aria-label="Select all"
              />
            </TableHead>

            {/* 2. Thumbnail + Duration */}
            <TableHead className="w-24">Thumb</TableHead>

            {/* 3. Title (YouTube link) */}
            <TableHead className="min-w-[200px]">
              <SortableHeader
                field="title"
                label="Title"
                currentSort={sortState}
                onSort={onSortChange}
              />
            </TableHead>

            {/* 4. Views */}
            <TableHead className="text-right">
              <SortableHeader
                field="views"
                label="Views"
                currentSort={sortState}
                onSort={onSortChange}
                align="right"
              />
            </TableHead>

            {/* 5. Channel (name + subscribers) */}
            <TableHead>Channel</TableHead>

            {/* 6. Contribution Score */}
            <TableHead className="text-right">
              <SortableHeader
                field="contributionScore"
                label="Contrib"
                currentSort={sortState}
                onSort={onSortChange}
                align="right"
              />
            </TableHead>

            {/* 7. Impact Score */}
            <TableHead className="text-right">
              <SortableHeader
                field="impactScore"
                label="Impact"
                currentSort={sortState}
                onSort={onSortChange}
                align="right"
              />
            </TableHead>

            {/* 8. Exposure Grade */}
            <TableHead>
              <SortableHeader
                field="exposureGrade"
                label="Exposure"
                currentSort={sortState}
                onSort={onSortChange}
              />
            </TableHead>

            {/* 9. Published Date */}
            <TableHead>
              <SortableHeader
                field="publishedAt"
                label="Date"
                currentSort={sortState}
                onSort={onSortChange}
              />
            </TableHead>

            {/* 10. Actions */}
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <VideoTableRow
              key={video.id}
              video={video}
              isSelected={selectedIds.has(video.id)}
              isCollected={isCollected(video.id)}
              isBlocked={isBlocked(video)}
              onSelectChange={(checked) => onSelectChange(video.id, checked)}
              onCollect={() => onCollect(video)}
              onUncollect={() => onUncollect(video.id)}
              onBlock={() => onBlock(video)}
              onUnblock={() => onUnblock(video.id)}
              onBlockChannel={() => onBlockChannel(video.channel.name)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
