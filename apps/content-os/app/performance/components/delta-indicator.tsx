"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DeltaResult } from "@/types/performance";
import { calculateDelta } from "../data/dummy-performance";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeltaIndicatorProps {
  value24h: number;
  value7d: number;
  format?: "number" | "percentage";
  showAbsolute?: boolean;
  className?: string;
}

export function DeltaIndicator({
  value24h,
  value7d,
  format = "number",
  showAbsolute = false,
  className,
}: DeltaIndicatorProps) {
  const delta: DeltaResult = calculateDelta(value24h, value7d);

  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    stable: "text-muted-foreground",
  };

  const TrendIcon =
    delta.trend === "up"
      ? TrendingUp
      : delta.trend === "down"
        ? TrendingDown
        : Minus;

  const formatValue = (val: number): string => {
    if (format === "percentage") {
      return val.toFixed(1) + "%";
    }
    if (Math.abs(val) >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    if (Math.abs(val) >= 1000) {
      return (val / 1000).toFixed(1) + "K";
    }
    return val.toLocaleString();
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <TrendIcon className={cn("h-4 w-4", trendColors[delta.trend])} />
      <span className={cn("text-sm font-medium", trendColors[delta.trend])}>
        {delta.percentage > 0 ? "+" : ""}
        {delta.percentage.toFixed(1)}%
      </span>
      {showAbsolute && (
        <span className="text-xs text-muted-foreground">
          ({delta.value > 0 ? "+" : ""}
          {formatValue(delta.value)})
        </span>
      )}
    </div>
  );
}

// Compact version for table cells with tooltip
interface DeltaIndicatorCompactProps {
  value24h: number;
  value7d: number;
  metricLabel?: string;
  format?: "number" | "percentage";
  className?: string;
}

export function DeltaIndicatorCompact({
  value24h,
  value7d,
  metricLabel = "Value",
  format = "percentage",
  className,
}: DeltaIndicatorCompactProps) {
  const delta = calculateDelta(value24h, value7d);

  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    stable: "text-muted-foreground",
  };

  // Format values for display
  const formatValue = (val: number): string => {
    if (format === "percentage") {
      return val.toFixed(1) + "%";
    }
    if (Math.abs(val) >= 1000000) {
      return (val / 1000000).toFixed(1) + "M";
    }
    if (Math.abs(val) >= 1000) {
      return (val / 1000).toFixed(1) + "K";
    }
    return val.toLocaleString();
  };

  // Generate trend interpretation message in Korean
  const getTrendMessage = (): string => {
    const absPercentage = Math.abs(delta.percentage).toFixed(0);
    if (delta.trend === "up") {
      return `24시간 성과가 7일 평균 대비 ${absPercentage}% 높음`;
    } else if (delta.trend === "down") {
      return `24시간 성과가 7일 평균 대비 ${absPercentage}% 낮음`;
    }
    return "24시간 성과와 7일 평균이 유사함";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "text-xs cursor-help",
            trendColors[delta.trend],
            className
          )}
        >
          {delta.percentage > 0 ? "+" : ""}
          {delta.percentage.toFixed(0)}%
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-2">
          <div className="font-medium">
            Delta: {delta.percentage > 0 ? "+" : ""}
            {delta.percentage.toFixed(1)}%
          </div>
          <div className="border-t border-border pt-2 space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{metricLabel} 24h:</span>
              <span className="font-medium">{formatValue(value24h)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">{metricLabel} 7d:</span>
              <span className="font-medium">{formatValue(value7d)}</span>
            </div>
          </div>
          <div className="border-t border-border pt-2 text-xs text-muted-foreground">
            {getTrendMessage()}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
