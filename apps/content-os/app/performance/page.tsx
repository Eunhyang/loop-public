"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import {
  PerformanceFiltersComponent,
  PerformanceTable,
} from "./components";
import { dummyPerformanceData } from "./data/dummy-performance";
import {
  ContentPerformance,
  PerformanceFilters,
  PerformanceSortState,
  PerformanceSortField,
} from "@/types/performance";

function filterPerformanceData(
  data: ContentPerformance[],
  filters: PerformanceFilters
): ContentPerformance[] {
  return data.filter((item) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!item.title.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    if (filters.status !== "all" && item.status !== filters.status) {
      return false;
    }

    // Period filter (based on publishedAt)
    if (filters.period !== "all") {
      const publishedDate = new Date(item.publishedAt);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const periodDays = parseInt(filters.period.replace("d", ""));
      if (daysDiff > periodDays) {
        return false;
      }
    }

    return true;
  });
}

function sortPerformanceData(
  data: ContentPerformance[],
  sort: PerformanceSortState
): ContentPerformance[] {
  return [...data].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case "publishedAt":
        comparison =
          new Date(a.publishedAt).getTime() -
          new Date(b.publishedAt).getTime();
        break;
      case "ctr_24h":
        comparison = a.metrics.ctr_24h - b.metrics.ctr_24h;
        break;
      case "ctr_7d":
        comparison = a.metrics.ctr_7d - b.metrics.ctr_7d;
        break;
      case "impressions_24h":
        comparison = a.metrics.impressions_24h - b.metrics.impressions_24h;
        break;
      case "views_24h":
        comparison = a.metrics.views_24h - b.metrics.views_24h;
        break;
    }

    return sort.order === "asc" ? comparison : -comparison;
  });
}

export default function PerformancePage() {
  const [filters, setFilters] = useState<PerformanceFilters>({
    search: "",
    status: "all",
    period: "all",
  });
  const [sortState, setSortState] = useState<PerformanceSortState>({
    field: "publishedAt",
    order: "desc",
  });

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    const filtered = filterPerformanceData(dummyPerformanceData, filters);
    return sortPerformanceData(filtered, sortState);
  }, [filters, sortState]);

  // Handler for sort change
  const handleSortChange = useCallback((field: PerformanceSortField) => {
    setSortState((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
  }, []);

  // Calculate summary stats
  const stats = useMemo(() => {
    const total = processedData.length;
    const earlySuccess = processedData.filter(
      (d) => d.status === "early_success"
    ).length;
    const problemCount = processedData.filter(
      (d) => d.problemType !== "none"
    ).length;

    return {
      total,
      earlySuccess,
      earlySuccessRate: total > 0 ? ((earlySuccess / total) * 100).toFixed(0) : 0,
      problemCount,
    };
  }, [processedData]);

  return (
    <>
      <Header
        title="Performance Dashboard"
        description="콘텐츠 성과 분석 - 24시간/7일 지표 비교"
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Summary Stats */}
        <div className="flex flex-wrap items-center gap-6 mb-6 text-sm">
          <div>
            콘텐츠 <strong className="text-foreground">{stats.total}</strong>개
          </div>
          <div>
            초기 성공률{" "}
            <strong className="text-green-600 dark:text-green-400">
              {stats.earlySuccessRate}%
            </strong>
          </div>
          <div>
            문제 발견{" "}
            <strong className="text-orange-600 dark:text-orange-400">
              {stats.problemCount}
            </strong>
            개
          </div>
          <div className="flex-1" />
          <Link href="/performance/weekly">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              주간 요약
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <PerformanceFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Results Count */}
        <div className="mb-2 text-sm text-muted-foreground">
          {processedData.length}개 콘텐츠
        </div>

        {/* Table */}
        <PerformanceTable
          data={processedData}
          sortState={sortState}
          onSortChange={handleSortChange}
        />
      </div>
    </>
  );
}
