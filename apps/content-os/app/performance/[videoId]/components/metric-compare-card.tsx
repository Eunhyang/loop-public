"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeltaIndicator } from "../../components/delta-indicator";
import { cn } from "@/lib/utils";

interface MetricCompareCardProps {
  title: string;
  value24h: number;
  value7d: number;
  format?: "number" | "percentage" | "duration";
  icon?: React.ReactNode;
  className?: string;
}

function formatValue(
  value: number,
  format: MetricCompareCardProps["format"]
): string {
  switch (format) {
    case "percentage":
      return value.toFixed(1) + "%";
    case "duration":
      const mins = Math.floor(value / 60);
      const secs = Math.floor(value % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    case "number":
    default:
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + "M";
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(1) + "K";
      }
      return value.toLocaleString();
  }
}

export function MetricCompareCard({
  title,
  value24h,
  value7d,
  format = "number",
  icon,
  className,
}: MetricCompareCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">
              {formatValue(value7d, format)}
            </div>
            <p className="text-xs text-muted-foreground">7일 누적</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium text-muted-foreground">
              {formatValue(value24h, format)}
            </div>
            <p className="text-xs text-muted-foreground">24시간</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">24h → 7d 변화</span>
            <DeltaIndicator
              value24h={value24h}
              value7d={value7d}
              format={format === "percentage" ? "percentage" : "number"}
              showAbsolute
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
