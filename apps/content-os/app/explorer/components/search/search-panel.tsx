"use client";

import { useState, useCallback, useMemo } from "react";
import { LiveSearchInput } from "./live-search-input";
import { SearchHistoryList } from "./search-history-list";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { History } from "lucide-react";
import { useDebounce } from "../../hooks/use-debounce";
import { getSearchSuggestions } from "../../hooks/use-search-history";
import { SearchSession } from "@/types/search";
import { cn } from "@/lib/utils";

interface SearchPanelProps {
  // Current search value
  value: string;
  onChange: (value: string) => void;
  // Search history
  sessions: SearchSession[];
  onAddSession: (query: string, resultCount: number) => void;
  onRemoveSession: (sessionId: string) => void;
  onClearHistory: () => void;
  // Result count for recording
  resultCount: number;
  // Optional
  isSearching?: boolean;
  className?: string;
}

/**
 * Complete search panel with live search, suggestions, and history
 */
export function SearchPanel({
  value,
  onChange,
  sessions,
  onAddSession,
  onRemoveSession,
  onClearHistory,
  resultCount,
  isSearching = false,
  className,
}: SearchPanelProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Debounced value for suggestions
  const debouncedValue = useDebounce(value, 150);

  // Get suggestions based on history
  const suggestions = useMemo(
    () => getSearchSuggestions(sessions, debouncedValue, 5),
    [sessions, debouncedValue]
  );

  // Handle search action (when user presses Enter or selects suggestion)
  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        // Record to history after a small delay to get accurate result count
        setTimeout(() => {
          onAddSession(query, resultCount);
        }, 100);
      }
    },
    [onAddSession, resultCount]
  );

  // Handle selecting from history
  const handleHistorySelect = useCallback(
    (query: string) => {
      onChange(query);
      setIsHistoryOpen(false);
    },
    [onChange]
  );

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Live search input */}
      <LiveSearchInput
        value={value}
        onChange={onChange}
        onSearch={handleSearch}
        suggestions={suggestions}
        isSearching={isSearching}
        placeholder="Search videos..."
        className="flex-1 min-w-[200px] max-w-[400px]"
      />

      {/* History button with sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "relative",
              sessions.length > 0 && "text-primary"
            )}
          >
            <History className="h-4 w-4" />
            {sessions.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                {sessions.length > 9 ? "9+" : sessions.length}
              </span>
            )}
            <span className="sr-only">Search history</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Search History</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SearchHistoryList
              sessions={sessions}
              onSelect={handleHistorySelect}
              onRemove={onRemoveSession}
              onClearAll={onClearHistory}
              maxItems={20}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
