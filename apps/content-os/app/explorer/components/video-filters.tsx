"use client";

import { FilterState, PeriodFilter } from "@/types/video";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, EyeOff } from "lucide-react";
import { SearchPanel } from "./search";
import { SearchSession } from "@/types/search";

interface VideoFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  channels: string[];
  // Show blocked toggle
  showBlocked: boolean;
  onShowBlockedChange: (show: boolean) => void;
  // Search history integration
  searchSessions?: SearchSession[];
  onAddSearchSession?: (query: string, resultCount: number) => void;
  onRemoveSearchSession?: (sessionId: string) => void;
  onClearSearchHistory?: () => void;
  resultCount?: number;
  // Use search panel instead of simple input
  useSearchPanel?: boolean;
}

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
];

const minViewsOptions = [
  { value: 0, label: "Any Views" },
  { value: 10000, label: "10K+" },
  { value: 50000, label: "50K+" },
  { value: 100000, label: "100K+" },
  { value: 500000, label: "500K+" },
];

export function VideoFilters({
  filters,
  onFiltersChange,
  channels,
  showBlocked,
  onShowBlockedChange,
  searchSessions = [],
  onAddSearchSession,
  onRemoveSearchSession,
  onClearSearchHistory,
  resultCount = 0,
  useSearchPanel = false,
}: VideoFiltersProps) {
  const hasActiveFilters =
    filters.search ||
    filters.period !== "all" ||
    filters.channel ||
    filters.minViews > 0;

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      period: "all",
      channel: "",
      minViews: 0,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search */}
      {useSearchPanel && onAddSearchSession && onRemoveSearchSession && onClearSearchHistory ? (
        <SearchPanel
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          sessions={searchSessions}
          onAddSession={onAddSearchSession}
          onRemoveSession={onRemoveSearchSession}
          onClearHistory={onClearSearchHistory}
          resultCount={resultCount}
          className="flex-1 min-w-[200px]"
        />
      ) : (
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-9"
          />
        </div>
      )}

      {/* Period Filter */}
      <Select
        value={filters.period}
        onValueChange={(value: PeriodFilter) =>
          onFiltersChange({ ...filters, period: value })
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          {periodOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Channel Filter */}
      <Select
        value={filters.channel || "all"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            channel: value === "all" ? "" : value,
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Channels</SelectItem>
          {channels.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {channel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Min Views Filter */}
      <Select
        value={filters.minViews.toString()}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, minViews: parseInt(value) })
        }
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Views" />
        </SelectTrigger>
        <SelectContent>
          {minViewsOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show Blocked Toggle */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="show-blocked"
          checked={showBlocked}
          onCheckedChange={(checked) => onShowBlockedChange(checked as boolean)}
        />
        <label
          htmlFor="show-blocked"
          className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
        >
          <EyeOff className="h-3 w-3" />
          Show Hidden
        </label>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
