"use client";

import { Badge } from "@/components/ui/badge";
import { ExposureGrade } from "@/types/video";
import { getExposureGradeColors } from "../../lib/score-calculator";
import { cn } from "@/lib/utils";

interface ExposureGradeBadgeProps {
  grade: ExposureGrade;
  className?: string;
}

/**
 * Badge component for displaying exposure grade
 * Shows the likelihood of YouTube recommending this video
 */
export function ExposureGradeBadge({
  grade,
  className,
}: ExposureGradeBadgeProps) {
  const colors = getExposureGradeColors(grade);

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-0",
        colors.bg,
        colors.text,
        className
      )}
    >
      {grade}
    </Badge>
  );
}

/**
 * Compact exposure grade indicator (just a dot with color)
 */
export function ExposureGradeDot({
  grade,
  className,
}: ExposureGradeBadgeProps) {
  const colorMap: Record<ExposureGrade, string> = {
    Great: "bg-green-500",
    Good: "bg-blue-500",
    Normal: "bg-gray-400",
    Bad: "bg-red-500",
  };

  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        colorMap[grade],
        className
      )}
      title={`Exposure: ${grade}`}
    />
  );
}
