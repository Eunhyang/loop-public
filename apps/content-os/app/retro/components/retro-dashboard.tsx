"use client";

import { useMemo } from "react";
import { ABReportCard } from "./ab-report-card";
import { LearningCard } from "./learning-card";
import { NegativeEvidenceCard } from "./negative-evidence-card";
import {
  dummyABReports,
  dummyLearningCards,
  dummyNegativeEvidences,
  getRetroStats,
} from "../data/dummy-retro-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Target,
} from "lucide-react";

export function RetroDashboard() {
  // 통계 계산
  const stats = useMemo(() => getRetroStats(), []);

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span>
            리포트{" "}
            <strong className="text-foreground">{stats.totalReports}</strong>개
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span>
            평균 달성률{" "}
            <strong className="text-foreground">{stats.avgAchievement}%</strong>
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          <span>
            성공률{" "}
            <strong className="text-foreground">{stats.successRate}%</strong>
          </span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span>
            Negative Evidence{" "}
            <strong className="text-foreground">{stats.negativeCount}</strong>개
          </span>
        </div>
      </div>

      {/* A/B Reports Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">A/B 리포트</h2>
          <Badge variant="secondary" className="text-xs">
            기대 vs 결과
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dummyABReports.map((report) => (
            <ABReportCard key={report.id} report={report} />
          ))}
        </div>
      </section>

      <Separator />

      {/* Learning Cards Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">학습 카드</h2>
          <Badge variant="secondary" className="text-xs">
            패턴 & 인사이트
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dummyLearningCards.map((card) => (
            <LearningCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <Separator />

      {/* Negative Evidence Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Negative Evidence</h2>
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            실패에서 배우기
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {dummyNegativeEvidences.map((evidence) => (
            <NegativeEvidenceCard key={evidence.id} evidence={evidence} />
          ))}
        </div>
      </section>
    </div>
  );
}
