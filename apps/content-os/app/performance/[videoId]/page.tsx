"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye, MousePointer, Clock, TrendingUp, Loader2 } from "lucide-react";
import { MetricCompareCard, MetricChart, DiagnosisLabel } from "./components";
import { usePerformanceDetail } from "../hooks";
import { formatDuration } from "../data/dummy-performance";

interface PageProps {
  params: Promise<{ videoId: string }>;
}

export default function PerformanceDetailPage({ params }: PageProps) {
  const { videoId } = use(params);
  const { data: performance, isLoading } = usePerformanceDetail(videoId);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">콘텐츠를 찾을 수 없습니다</h2>
          <Link href="/performance">
            <Button variant="outline">목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { metrics } = performance;

  return (
    <>
      <Header
        title="콘텐츠 상세 분석"
        description={performance.title}
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

        {/* Content Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-6">
              <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={performance.thumbnail}
                  alt={performance.title}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                  {performance.title}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>
                    업로드:{" "}
                    {new Date(performance.publishedAt).toLocaleDateString("ko-KR")}
                  </span>
                  <span>재생 시간: {formatDuration(performance.duration)}</span>
                  <span>Video ID: {performance.videoId}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <MetricCompareCard
            title="노출수"
            value24h={metrics.impressions_24h}
            value7d={metrics.impressions_7d}
            format="number"
            icon={<Eye className="h-4 w-4" />}
          />
          <MetricCompareCard
            title="CTR"
            value24h={metrics.ctr_24h}
            value7d={metrics.ctr_7d}
            format="percentage"
            icon={<MousePointer className="h-4 w-4" />}
          />
          <MetricCompareCard
            title="조회수"
            value24h={metrics.views_24h}
            value7d={metrics.views_7d}
            format="number"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCompareCard
            title="평균 시청 시간"
            value24h={metrics.avg_view_duration_24h}
            value7d={metrics.avg_view_duration_7d}
            format="duration"
            icon={<Clock className="h-4 w-4" />}
          />
        </div>

        {/* Charts */}
        <MetricChart metrics={metrics} className="mb-6" />

        {/* Diagnosis */}
        <DiagnosisLabel
          status={performance.status}
          problemType={performance.problemType}
        />
      </div>
    </>
  );
}
