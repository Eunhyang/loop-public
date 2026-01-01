"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DeltaResult } from "@/types/performance";
import { calculateDelta } from "../data/dummy-performance";
import { cn } from "@/lib/utils";

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

// Compact version for table cells
export function DeltaIndicatorCompact({
  value24h,
  value7d,
  className,
}: {
  value24h: number;
  value7d: number;
  className?: string;
}) {
  const delta = calculateDelta(value24h, value7d);

  const trendColors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    stable: "text-muted-foreground",
  };

  return (
    <span className={cn("text-xs", trendColors[delta.trend], className)}>
      {delta.percentage > 0 ? "+" : ""}
      {delta.percentage.toFixed(0)}%
    </span>
  );
}
