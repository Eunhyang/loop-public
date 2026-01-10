"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ContentPerformance,
  PerformanceSortState,
  PerformanceSortField,
} from "@/types/performance";
import type { MergedPerformance } from "@/lib/domain/performance/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { StatusBadge } from "./status-badge";
import { DeltaIndicatorCompact } from "./delta-indicator";
import { formatNumber, formatPercentage, formatDuration } from "../data/dummy-performance";

// Support both ContentPerformance and MergedPerformance
type PerformanceItem = ContentPerformance | MergedPerformance;

interface PerformanceTableProps {
  data: PerformanceItem[];
  sortState: PerformanceSortState;
  onSortChange: (field: PerformanceSortField) => void;
}

// Type guard to check if item has displayMetrics
function isMergedPerformance(item: PerformanceItem): item is MergedPerformance {
  return 'displayMetrics' in item;
}

// Get metrics from item (prefer displayMetrics if available)
function getMetrics(item: PerformanceItem) {
  if (isMergedPerformance(item)) {
    return item.displayMetrics;
  }
  return item.metrics;
}

// Source indicator component
function SourceIndicator({ source }: { source: 'api' | 'snapshot' | 'none' }) {
  if (source !== 'snapshot') return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="ml-1 text-[10px] font-medium text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1 rounded">
            S
          </span>
        </TooltipTrigger>
        <TooltipContent>From YouTube Studio snapshot</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SortableHeader({
  field,
  label,
  currentSort,
  onSort,
  className,
}: {
  field: PerformanceSortField;
  label: string;
  currentSort: PerformanceSortState;
  onSort: (field: PerformanceSortField) => void;
  className?: string;
}) {
  const isActive = currentSort.field === field;

  return (
    <button
      className={`flex items-center gap-1 hover:text-foreground transition-colors ${className || ""}`}
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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function PerformanceTable({
  data,
  sortState,
  onSortChange,
}: PerformanceTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">콘텐츠가 없습니다</p>
        <p className="text-sm mt-1">필터를 조정해보세요</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">썸네일</TableHead>
            <TableHead className="min-w-[200px]">제목</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>
              <SortableHeader
                field="publishedAt"
                label="업로드"
                currentSort={sortState}
                onSort={onSortChange}
              />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader
                field="impressions_24h"
                label="노출 24h"
                currentSort={sortState}
                onSort={onSortChange}
                className="justify-end"
              />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader
                field="ctr_24h"
                label="CTR 24h"
                currentSort={sortState}
                onSort={onSortChange}
                className="justify-end"
              />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader
                field="ctr_7d"
                label="CTR 7d"
                currentSort={sortState}
                onSort={onSortChange}
                className="justify-end"
              />
            </TableHead>
            <TableHead className="text-right">Delta</TableHead>
            <TableHead className="text-right">
              <SortableHeader
                field="views_24h"
                label="조회 24h"
                currentSort={sortState}
                onSort={onSortChange}
                className="justify-end"
              />
            </TableHead>
            <TableHead className="text-right">평균 시청</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const metrics = getMetrics(item);
            const isMerged = isMergedPerformance(item);

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="relative w-16 h-10 rounded overflow-hidden bg-muted">
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/performance/${item.videoId}`}
                    className="flex items-center gap-1 text-foreground hover:text-primary transition-colors line-clamp-2"
                  >
                    {item.title}
                    <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(item.duration)}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(item.publishedAt)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  <span className="inline-flex items-center">
                    {formatNumber(metrics.impressions_24h)}
                    {isMerged && (
                      <SourceIndicator source={item.displayMetrics.impressionsSource} />
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center">
                    <span
                      className={`font-medium ${
                        metrics.ctr_24h >= 8
                          ? "text-green-600 dark:text-green-400"
                          : metrics.ctr_24h >= 5
                            ? "text-foreground"
                            : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatPercentage(metrics.ctr_24h)}
                    </span>
                    {isMerged && (
                      <SourceIndicator source={item.displayMetrics.ctrSource} />
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">
                    {formatPercentage(metrics.ctr_7d)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DeltaIndicatorCompact
                    value24h={metrics.ctr_24h}
                    value7d={metrics.ctr_7d}
                    metricLabel="CTR"
                    format="percentage"
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNumber(metrics.views_24h)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDuration(metrics.avg_view_duration_24h)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
