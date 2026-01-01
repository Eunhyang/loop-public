"use client";

import { Button } from "@/components/ui/button";
import { SearchSession } from "@/types/search";
import { SearchHistoryItem } from "./search-history-item";
import { Trash2, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchHistoryListProps {
  sessions: SearchSession[];
  onSelect: (query: string) => void;
  onRemove: (sessionId: string) => void;
  onClearAll: () => void;
  maxItems?: number;
  className?: string;
}

/**
 * List of search history items
 */
export function SearchHistoryList({
  sessions,
  onSelect,
  onRemove,
  onClearAll,
  maxItems = 10,
  className,
}: SearchHistoryListProps) {
  const displaySessions = sessions.slice(0, maxItems);

  if (sessions.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No search history yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Your recent searches will appear here
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          Recent Searches
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={onClearAll}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Clear All
        </Button>
      </div>

      {/* List */}
      <div className="space-y-1">
        {displaySessions.map((session) => (
          <SearchHistoryItem
            key={session.id}
            session={session}
            onSelect={onSelect}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Show more indicator */}
      {sessions.length > maxItems && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          And {sessions.length - maxItems} more...
        </p>
      )}
    </div>
  );
}
