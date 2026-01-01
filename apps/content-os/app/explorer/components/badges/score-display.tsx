"use client";

import { cn } from "@/lib/utils";
import { getScoreColorClass } from "../../lib/score-calculator";

interface ScoreDisplayProps {
  score: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}

/**
 * Component for displaying contribution or impact scores
 * Color-coded based on score value (8+: green, 6-7.9: yellow, <6: muted)
 */
export function ScoreDisplay({
  score,
  label,
  showLabel = false,
  className,
}: ScoreDisplayProps) {
  const colorClass = getScoreColorClass(score);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className={cn("font-medium tabular-nums", colorClass)}>
        {score.toFixed(1)}
      </span>
      {showLabel && label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

/**
 * Compact score indicator with optional tooltip
 */
export function ScoreIndicator({
  score,
  label,
  className,
}: ScoreDisplayProps) {
  const colorClass = getScoreColorClass(score);

  // Visual indicator size based on score
  const sizeClass =
    score >= 8
      ? "text-sm font-semibold"
      : score >= 6
        ? "text-sm font-medium"
        : "text-sm font-normal";

  return (
    <span
      className={cn(colorClass, sizeClass, "tabular-nums", className)}
      title={label ? `${label}: ${score.toFixed(1)}` : score.toFixed(1)}
    >
      {score.toFixed(1)}
    </span>
  );
}

/**
 * Score bar visualization (progress bar style)
 */
export function ScoreBar({
  score,
  label,
  className,
}: ScoreDisplayProps) {
  const percentage = (score / 10) * 100;
  const colorClass =
    score >= 8
      ? "bg-green-500"
      : score >= 6
        ? "bg-yellow-500"
        : "bg-gray-400";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-xs text-muted-foreground w-20">{label}</span>
      )}
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-8">
        {score.toFixed(1)}
      </span>
    </div>
  );
}
