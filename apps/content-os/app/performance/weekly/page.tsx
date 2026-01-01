"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Upload,
  Eye,
  TrendingUp,
  AlertTriangle,
  Target,
} from "lucide-react";
import { SummaryStatCard, ProblemTypeChart } from "./components";
import {
  getWeeklySummaries,
  formatNumber,
  PROBLEM_TYPE_LABELS,
} from "../data/dummy-performance";

export default function WeeklySummaryPage() {
  const summaries = useMemo(() => getWeeklySummaries(4), []);

  // Get the most recent week's summary
  const currentWeek = summaries[summaries.length - 1];
  const previousWeek = summaries.length > 1 ? summaries[summaries.length - 2] : null;

  // Calculate trends
  const uploadTrend = previousWeek
    ? ((currentWeek.uploadCount - previousWeek.uploadCount) /
        Math.max(previousWeek.uploadCount, 1)) *
      100
    : 0;
  const ctrTrend = previousWeek
    ? currentWeek.avgCtr24h - previousWeek.avgCtr24h
    : 0;
  const successTrend = previousWeek
    ? currentWeek.earlySuccessRate - previousWeek.earlySuccessRate
    : 0;

  return (
    <>
      <Header
        title="주간 성과 요약"
        description={`${currentWeek.weekStart} ~ ${currentWeek.weekEnd}`}
      />
      <div className="flex-1 overflow-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/performance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <SummaryStatCard
            title="업로드"
            value={currentWeek.uploadCount}
            subtitle="이번 주 콘텐츠"
            trend={
              previousWeek
                ? { value: uploadTrend, isPositive: uploadTrend >= 0 }
                : undefined
            }
            icon={<Upload className="h-4 w-4" />}
          />
          <SummaryStatCard
            title="총 노출수"
            value={formatNumber(currentWeek.totalImpressions)}
            subtitle="7일 누적"
            icon={<Eye className="h-4 w-4" />}
          />
          <SummaryStatCard
            title="평균 CTR (24h)"
            value={`${currentWeek.avgCtr24h.toFixed(1)}%`}
            subtitle={`4주 평균: ${currentWeek.avgCtr4WeekAvg.toFixed(1)}%`}
            trend={
              previousWeek
                ? { value: ctrTrend, isPositive: ctrTrend >= 0 }
                : undefined
            }
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <SummaryStatCard
            title="초기 성공률"
            value={`${currentWeek.earlySuccessRate.toFixed(0)}%`}
            subtitle="early_success 비율"
            trend={
              previousWeek
                ? { value: successTrend, isPositive: successTrend >= 0 }
                : undefined
            }
            icon={<Target className="h-4 w-4" />}
          />
        </div>

        {/* Additional Metrics */}
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-500" />
                확장 성공률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currentWeek.expansionSuccessRate.toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                7일 노출이 24h 대비 3배 이상 확장된 콘텐츠 비율
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                가장 흔한 문제
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {PROBLEM_TYPE_LABELS[currentWeek.mostCommonProblem]}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                이번 주 가장 많이 발견된 문제 유형
              </p>
            </CardContent>
          </Card>
        </div>

        <Separator className="my-6" />

        {/* Problem Type Breakdown */}
        <ProblemTypeChart
          breakdown={currentWeek.problemBreakdown}
          className="mb-6"
        />

        {/* Historical Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              최근 4주 비교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      주차
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      업로드
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      총 노출
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      평균 CTR
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      초기 성공률
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      확장 성공률
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map((summary, index) => (
                    <tr
                      key={summary.weekStart}
                      className={
                        index === summaries.length - 1
                          ? "bg-primary/5"
                          : "border-b"
                      }
                    >
                      <td className="py-3">
                        <div className="font-medium">
                          {index === summaries.length - 1
                            ? "이번 주"
                            : `${summaries.length - 1 - index}주 전`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {summary.weekStart}
                        </div>
                      </td>
                      <td className="text-right py-3">{summary.uploadCount}</td>
                      <td className="text-right py-3">
                        {formatNumber(summary.totalImpressions)}
                      </td>
                      <td className="text-right py-3">
                        {summary.avgCtr24h.toFixed(1)}%
                      </td>
                      <td className="text-right py-3">
                        <span
                          className={
                            summary.earlySuccessRate >= 40
                              ? "text-green-600 dark:text-green-400"
                              : summary.earlySuccessRate >= 20
                                ? "text-foreground"
                                : "text-red-600 dark:text-red-400"
                          }
                        >
                          {summary.earlySuccessRate.toFixed(0)}%
                        </span>
                      </td>
                      <td className="text-right py-3">
                        {summary.expansionSuccessRate.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
