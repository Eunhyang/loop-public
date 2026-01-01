"use client";

import { Button } from "@/components/ui/button";
import { PackagePlus, Bookmark, BookmarkX, X } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  onCreateBundle: () => void;
  onSaveReferences: () => void;
  // New collection actions
  onCollectSelected: () => void;
  onUncollectSelected: () => void;
  // Optional: show collect/uncollect based on selection state
  hasCollectedInSelection?: boolean;
  hasUncollectedInSelection?: boolean;
}

export function BulkActions({
  selectedCount,
  onClearSelection,
  onCreateBundle,
  onSaveReferences,
  onCollectSelected,
  onUncollectSelected,
  hasCollectedInSelection = false,
  hasUncollectedInSelection = true,
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="sticky bottom-4 mx-auto w-fit">
      <div className="flex items-center gap-3 bg-background border rounded-lg shadow-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {selectedCount} video{selectedCount > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Collection Actions */}
        <div className="flex items-center gap-2">
          {hasUncollectedInSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCollectSelected}
              className="gap-2"
            >
              <Bookmark className="h-4 w-4" />
              Collect
            </Button>
          )}

          {hasCollectedInSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onUncollectSelected}
              className="gap-2 text-muted-foreground"
            >
              <BookmarkX className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Original Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onCreateBundle}
            className="gap-2"
          >
            <PackagePlus className="h-4 w-4" />
            Create Bundle Task
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSaveReferences}
            className="gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Save as Reference
          </Button>
        </div>
      </div>
    </div>
  );
}
