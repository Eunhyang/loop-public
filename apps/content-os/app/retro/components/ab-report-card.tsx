"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ABReport } from "../types/retro";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ABReportCardProps {
  report: ABReport;
}

function getAchievementColor(rate: number): string {
  if (rate >= 100) return "text-green-600 dark:text-green-400";
  if (rate >= 80) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function getAchievementIcon(rate: number) {
  if (rate >= 100) return <TrendingUp className="h-4 w-4" />;
  if (rate >= 80) return <Minus className="h-4 w-4" />;
  return <TrendingDown className="h-4 w-4" />;
}

function getOverallBadgeVariant(rate: number): "default" | "secondary" | "destructive" {
  if (rate >= 100) return "default";
  if (rate >= 80) return "secondary";
  return "destructive";
}

export function ABReportCard({ report }: ABReportCardProps) {
  const { projectName, period, metrics, overallAchievement } = report;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {projectName}
          </CardTitle>
          <Badge variant={getOverallBadgeVariant(overallAchievement)}>
            {overallAchievement}% 달성
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{period}</p>
      </CardHeader>

      <CardContent className="flex-1">
        {/* A/B 비교 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-muted-foreground">
                  Metric
                </th>
                <th className="text-center py-2 font-medium text-muted-foreground">
                  A (기대)
                </th>
                <th className="text-center py-2 font-medium text-muted-foreground">
                  B (결과)
                </th>
                <th className="text-right py-2 font-medium text-muted-foreground">
                  달성률
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric, index) => (
                <tr
                  key={index}
                  className="border-b last:border-0"
                >
                  <td className="py-2 font-medium">{metric.name}</td>
                  <td className="text-center py-2 text-muted-foreground">
                    {metric.expected}
                  </td>
                  <td className="text-center py-2">{metric.realized}</td>
                  <td className="text-right py-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 font-medium",
                        getAchievementColor(metric.achievementRate)
                      )}
                    >
                      {getAchievementIcon(metric.achievementRate)}
                      {metric.achievementRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
