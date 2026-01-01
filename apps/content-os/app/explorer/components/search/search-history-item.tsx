"use client";

import { Button } from "@/components/ui/button";
import { SearchSession } from "@/types/search";
import { Search, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchHistoryItemProps {
  session: SearchSession;
  onSelect: (query: string) => void;
  onRemove: (sessionId: string) => void;
  className?: string;
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = Date.parse(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Individual search history item
 */
export function SearchHistoryItem({
  session,
  onSelect,
  onRemove,
  className,
}: SearchHistoryItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md transition-colors cursor-pointer",
        className
      )}
      onClick={() => onSelect(session.query)}
    >
      <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.query}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(session.timestamp)}
          </span>
          <span>|</span>
          <span>{session.resultCount} results</span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(session.id);
        }}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Remove from history</span>
      </Button>
    </div>
  );
}

/**
 * Compact search history item (for inline suggestions)
 */
export function SearchHistoryItemCompact({
  session,
  onSelect,
  className,
}: Omit<SearchHistoryItemProps, "onRemove">) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1.5 text-left hover:bg-accent rounded transition-colors",
        className
      )}
      onClick={() => onSelect(session.query)}
    >
      <Clock className="h-3 w-3 text-muted-foreground" />
      <span className="text-sm truncate">{session.query}</span>
      <span className="text-xs text-muted-foreground ml-auto">
        {session.resultCount}
      </span>
    </button>
  );
}
