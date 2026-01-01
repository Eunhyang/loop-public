"use client";

import { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/layout";
import { VideoTable } from "./components/video-table";
import { VideoFilters } from "./components/video-filters";
import { BulkActions } from "./components/bulk-actions";
import { ExplorerTabs, ExplorerTabContent, ExplorerTab } from "./components/explorer-tabs";
import { CollectionList, BlockedList } from "./components/collection/collection-list";
import { dummyVideos, channelList } from "./data/dummy-videos";
import { ProcessedVideo, SortState, SortField, FilterState } from "@/types/video";
import { processVideos, exposureGradeToNumber } from "./lib/score-calculator";
import { useCollection } from "./hooks/use-collection";
import { useSearchHistory } from "./hooks/use-search-history";

function filterVideos(
  videos: ProcessedVideo[],
  filters: FilterState,
  isBlocked: (video: ProcessedVideo) => boolean,
  showBlocked: boolean
): ProcessedVideo[] {
  return videos.filter((video) => {
    // Hide blocked videos unless showBlocked is true
    if (!showBlocked && isBlocked(video)) {
      return false;
    }

    // Search filter
    if (filters.search) {
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

  // Process videos with calculated scores
  const processedVideos = useMemo(() => processVideos(dummyVideos), []);

  // Memoized filtered and sorted videos
  const displayVideos = useMemo(() => {
    const filtered = filterVideos(processedVideos, filters, isBlocked, showBlocked);
    return sortVideos(filtered, sortState);
  }, [processedVideos, filters, isBlocked, showBlocked, sortState]);

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
    () => processedVideos.filter((v) => selectedIds.has(v.id)),
    [processedVideos, selectedIds]
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

            <div className="mb-2 text-sm text-muted-foreground">
              {displayVideos.length} video{displayVideos.length !== 1 ? "s" : ""}{" "}
              found
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
