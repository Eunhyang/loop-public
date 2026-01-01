"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiagnosisStatus, ProblemType } from "@/types/performance";
import {
  STATUS_BADGE_CONFIG,
  PROBLEM_TYPE_LABELS,
} from "../../data/dummy-performance";
import { StatusBadge } from "../../components/status-badge";
import { cn } from "@/lib/utils";

interface DiagnosisLabelProps {
  status: DiagnosisStatus;
  problemType: ProblemType;
  className?: string;
}

const problemRecommendations: Record<ProblemType, string[]> = {
  thumbnail_title: [
    "썸네일 이미지를 더 시선을 끄는 디자인으로 변경해보세요",
    "제목에 숫자나 구체적인 결과를 포함시켜보세요",
    "경쟁 영상의 썸네일/제목 패턴을 분석해보세요",
  ],
  early_hook: [
    "영상 시작 10초 내에 핵심 가치를 전달하세요",
    "인트로가 너무 길지 않은지 확인하세요",
    "시청자의 호기심을 자극하는 질문으로 시작해보세요",
  ],
  topic_timing: [
    "트렌드 주기를 확인하고 타이밍을 맞춰보세요",
    "관련 키워드의 검색량 변화를 모니터링하세요",
    "시리즈 콘텐츠로 지속적인 관심을 유도해보세요",
  ],
  none: [],
};

export function DiagnosisLabel({
  status,
  problemType,
  className,
}: DiagnosisLabelProps) {
  const config = STATUS_BADGE_CONFIG[status];
  const hasProblem = problemType !== "none";
  const recommendations = problemRecommendations[problemType];

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {hasProblem ? (
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          ) : status === "early_success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Info className="h-5 w-5 text-blue-500" />
          )}
          진단 결과
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-sm text-muted-foreground">
            {config.description}
          </span>
        </div>

        {/* Problem Type */}
        {hasProblem && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
            <h4 className="font-medium text-orange-800 dark:text-orange-400 mb-2">
              감지된 문제: {PROBLEM_TYPE_LABELS[problemType]}
            </h4>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300"
                >
                  <span className="text-orange-500">-</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {!hasProblem && status === "early_success" && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
            <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
              우수한 성과!
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              이 콘텐츠는 초기 반응이 좋고 확장도 잘 이루어지고 있습니다. 비슷한
              패턴의 콘텐츠를 더 제작해보세요.
            </p>
          </div>
        )}

        {/* Stable Message */}
        {!hasProblem && status === "stable" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
              안정적인 성과
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              이 콘텐츠는 안정적인 성과를 보이고 있습니다. 장기적인 트래픽
              소스로 활용될 수 있습니다.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
