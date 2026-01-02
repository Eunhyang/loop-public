"use client";

import { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/layout";
import { VideoTable } from "./components/video-table";
import { VideoFilters } from "./components/video-filters";
import { BulkActions } from "./components/bulk-actions";
import { ExplorerTabs, ExplorerTabContent, ExplorerTab } from "./components/explorer-tabs";
import { CollectionList, BlockedList } from "./components/collection/collection-list";
import { dummyVideos, channelList as dummyChannelList } from "./data/dummy-videos";
import { ProcessedVideo, SortState, SortField, FilterState } from "@/types/video";
import { processVideos, exposureGradeToNumber } from "./lib/score-calculator";
import { useCollection } from "./hooks/use-collection";
import { useSearchHistory } from "./hooks/use-search-history";
import { useYouTubeSearch } from "./hooks/use-youtube-search";
import { useDebounce } from "./hooks/use-debounce";
import { Loader2, AlertCircle, Youtube } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function filterVideos(
  videos: ProcessedVideo[],
  filters: FilterState,
  isBlocked: (video: ProcessedVideo) => boolean,
  showBlocked: boolean,
  skipSearchFilter: boolean = false
): ProcessedVideo[] {
  return videos.filter((video) => {
    // Hide blocked videos unless showBlocked is true
    if (!showBlocked && isBlocked(video)) {
      return false;
    }

    // Search filter (skip if using YouTube API search)
    if (!skipSearchFilter && filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        video.title.toLowerCase().includes(searchLower) ||
        video.channel.name.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Period filter
    if (filters.period !== "all") {
      const videoDate = new Date(video.publishedAt);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (filters.period === "7days" && daysDiff > 7) return false;
      if (filters.period === "30days" && daysDiff > 30) return false;
    }

    // Channel filter
    if (filters.channel && video.channel.name !== filters.channel) {
      return false;
    }

    // Min views filter
    if (filters.minViews > 0 && video.views < filters.minViews) {
      return false;
    }

    return true;
  });
}

function sortVideos(videos: ProcessedVideo[], sort: SortState): ProcessedVideo[] {
  return [...videos].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case "title":
        comparison = a.title.localeCompare(b.title, "ko");
        break;
      case "publishedAt":
        comparison =
          new Date(a.publishedAt).getTime() -
          new Date(b.publishedAt).getTime();
        break;
      case "views":
        comparison = a.views - b.views;
        break;
      case "marketScore":
        comparison = a.marketScore - b.marketScore;
        break;
      case "velocity":
        comparison = a.velocity - b.velocity;
        break;
      case "contributionScore":
        comparison = a.contributionScore - b.contributionScore;
        break;
      case "impactScore":
        comparison = a.impactScore - b.impactScore;
        break;
      case "exposureGrade":
        comparison =
          exposureGradeToNumber(a.exposureGrade) -
          exposureGradeToNumber(b.exposureGrade);
        break;
    }

    return sort.order === "asc" ? comparison : -comparison;
  });
}

export default function ExplorerPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<ExplorerTab>("explore");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort state
  const [sortState, setSortState] = useState<SortState>({
    field: "impactScore",
    order: "desc",
  });

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    period: "all",
    channel: "",
    minViews: 0,
  });

  // Show blocked toggle
  const [showBlocked, setShowBlocked] = useState(false);

  // Debounce search query for API calls (300ms)
  const debouncedSearchQuery = useDebounce(filters.search, 300);

  // YouTube search hook
  const {
    videos: youtubeVideos,
    channelList: youtubeChannelList,
    isLoading: isSearching,
    isFetching,
    error: searchError,
    totalResults,
  } = useYouTubeSearch({
    query: debouncedSearchQuery,
    maxResults: 50,
    enabled: debouncedSearchQuery.trim().length >= 2,
  });

  // Collection hook (with localStorage persistence)
  const {
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
    collectionCount,
    blockedCount,
  } = useCollection();

  // Search history hook (with localStorage persistence)
  const {
    sessions: searchSessions,
    addSession: addSearchSession,
    removeSession: removeSearchSession,
    clearHistory: clearSearchHistory,
  } = useSearchHistory();

  // Determine if we're using YouTube search or fallback to dummy data
  const isUsingYouTubeSearch = debouncedSearchQuery.trim().length >= 2;

  // Process videos with calculated scores
  const processedDummyVideos = useMemo(() => processVideos(dummyVideos), []);

  // Choose data source based on search state
  const sourceVideos = isUsingYouTubeSearch ? youtubeVideos : processedDummyVideos;
  const channelList = isUsingYouTubeSearch ? youtubeChannelList : dummyChannelList;

  // Memoized filtered and sorted videos
  const displayVideos = useMemo(() => {
    // When using YouTube search, skip the search filter (already applied by API)
    const filtered = filterVideos(
      sourceVideos,
      filters,
      isBlocked,
      showBlocked,
      isUsingYouTubeSearch
    );
    return sortVideos(filtered, sortState);
  }, [sourceVideos, filters, isBlocked, showBlocked, sortState, isUsingYouTubeSearch]);

  // Handler for sort change
  const handleSortChange = useCallback((field: SortField) => {
    setSortState((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
  }, []);

  // Handler for filter change - clears selection
  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setSelectedIds(new Set()); // Clear selection on filter change
  }, []);

  // Selection handlers
  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(displayVideos.map((v) => v.id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [displayVideos]
  );

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get selected videos
  const selectedVideos = useMemo(
    () => sourceVideos.filter((v) => selectedIds.has(v.id)),
    [sourceVideos, selectedIds]
  );

  // Check selection state for bulk actions
  const hasCollectedInSelection = useMemo(
    () => selectedVideos.some((v) => isCollected(v.id)),
    [selectedVideos, isCollected]
  );

  const hasUncollectedInSelection = useMemo(
    () => selectedVideos.some((v) => !isCollected(v.id)),
    [selectedVideos, isCollected]
  );

  // Bulk collect/uncollect handlers
  const handleCollectSelected = useCallback(() => {
    const videosToCollect = selectedVideos.filter((v) => !isCollected(v.id));
    collectVideos(videosToCollect);
  }, [selectedVideos, isCollected, collectVideos]);

  const handleUncollectSelected = useCallback(() => {
    const idsToUncollect = selectedVideos
      .filter((v) => isCollected(v.id))
      .map((v) => v.id);
    uncollectVideos(idsToUncollect);
  }, [selectedVideos, isCollected, uncollectVideos]);

  // Action handlers (UI only for MVP)
  const handleCreateBundle = useCallback(() => {
    console.log("Create bundle task with:", selectedVideos);
    alert(
      `Bundle task will be created with ${selectedIds.size} videos.\n\n(This is a placeholder - actual functionality will be implemented in Phase 2)`
    );
  }, [selectedVideos, selectedIds.size]);

  const handleSaveReferences = useCallback(() => {
    console.log("Save as references:", selectedVideos);
    alert(
      `${selectedIds.size} videos will be saved as references.\n\n(This is a placeholder - actual functionality will be implemented in Phase 2)`
    );
  }, [selectedVideos, selectedIds.size]);

  // Result status message
  const getResultStatusMessage = () => {
    if (isSearching) {
      return "Searching YouTube...";
    }
    if (isUsingYouTubeSearch && totalResults > 0) {
      return `${displayVideos.length} of ${totalResults.toLocaleString()} YouTube results`;
    }
    if (isUsingYouTubeSearch && displayVideos.length === 0) {
      return "No videos found";
    }
    return `${displayVideos.length} video${displayVideos.length !== 1 ? "s" : ""} found`;
  };

  return (
    <>
      <Header
        title="Video Explorer"
        description="Discover and analyze competitor videos for content ideas"
      />
      <div className="flex-1 overflow-auto p-6">
        <ExplorerTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collectionCount={collectionCount}
          blockedCount={blockedCount}
        >
          {/* Explore Tab */}
          <ExplorerTabContent value="explore">
            <VideoFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              channels={channelList}
              showBlocked={showBlocked}
              onShowBlockedChange={setShowBlocked}
              searchSessions={searchSessions}
              onAddSearchSession={addSearchSession}
              onRemoveSearchSession={removeSearchSession}
              onClearSearchHistory={clearSearchHistory}
              resultCount={displayVideos.length}
              useSearchPanel
            />

            {/* Search Error Alert */}
            {searchError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Search Error</AlertTitle>
                <AlertDescription>
                  {searchError.message}
                  {searchError.message.includes("quota") && (
                    <span className="block mt-1 text-sm">
                      Daily API limit reached. Try again tomorrow or use shorter search terms.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Status bar */}
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              {(isSearching || isFetching) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isUsingYouTubeSearch && !isSearching && (
                <Youtube className="h-4 w-4 text-red-500" />
              )}
              <span>{getResultStatusMessage()}</span>
              {!isUsingYouTubeSearch && filters.search.trim().length > 0 && (
                <span className="text-xs text-muted-foreground/70">
                  (type at least 2 characters to search YouTube)
                </span>
              )}
            </div>

            <VideoTable
              videos={displayVideos}
              selectedIds={selectedIds}
              onSelectChange={handleSelectChange}
              onSelectAll={handleSelectAll}
              sortState={sortState}
              onSortChange={handleSortChange}
              isCollected={isCollected}
              isBlocked={isBlocked}
              onCollect={collectVideo}
              onUncollect={uncollectVideo}
              onBlock={blockVideo}
              onUnblock={unblockVideo}
              onBlockChannel={blockChannel}
            />

            <BulkActions
              selectedCount={selectedIds.size}
              onClearSelection={handleClearSelection}
              onCreateBundle={handleCreateBundle}
              onSaveReferences={handleSaveReferences}
              onCollectSelected={handleCollectSelected}
              onUncollectSelected={handleUncollectSelected}
              hasCollectedInSelection={hasCollectedInSelection}
              hasUncollectedInSelection={hasUncollectedInSelection}
            />
          </ExplorerTabContent>

          {/* Collection Tab */}
          <ExplorerTabContent value="collection">
            <CollectionList
              collectedVideos={collectedVideos}
              onUncollect={uncollectVideo}
            />
          </ExplorerTabContent>

          {/* Blocked Tab */}
          <ExplorerTabContent value="blocked">
            <BlockedList
              blockedVideos={blockedVideos}
              blockedChannels={blockedChannels}
              onUnblockVideo={unblockVideo}
              onUnblockChannel={unblockChannel}
            />
          </ExplorerTabContent>
        </ExplorerTabs>
      </div>
    </>
  );
}
