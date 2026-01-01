"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NegativeEvidence } from "../types/retro";
import { EvidenceTypeBadgeList } from "./evidence-type-badge";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface NegativeEvidenceCardProps {
  evidence: NegativeEvidence;
}

export function NegativeEvidenceCard({ evidence }: NegativeEvidenceCardProps) {
  const {
    id,
    projectName,
    expected,
    realized,
    inferredTags,
    lesson,
    createdAt,
  } = evidence;

  return (
    <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-orange-700 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            Negative Evidence #{id}
          </CardTitle>
          <span className="text-xs text-muted-foreground">{createdAt}</span>
        </div>
        <p className="text-sm text-muted-foreground">{projectName}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 기대 vs 결과 비교 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              기대 (Expected)
            </p>
            <div className="p-2 rounded-md bg-background border">
              <p className="text-sm">CTR: {expected.ctr}</p>
              <p className="text-sm">Retention: {expected.retention}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">
              결과 (Realized)
            </p>
            <div className="p-2 rounded-md bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-400">
                CTR: {realized.ctr}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                Retention: {realized.retention}
              </p>
            </div>
          </div>
        </div>

        {/* 자동 추론 태그 */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase">
            자동 추론
          </p>
          <EvidenceTypeBadgeList types={inferredTags} />
        </div>

        {/* 학습 포인트 */}
        <div className="flex items-start gap-2 p-3 rounded-md bg-background border">
          <ArrowRight className="h-4 w-4 mt-0.5 text-orange-500 shrink-0" />
          <div>
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mb-1">
              &quot;이건 하지 말자&quot; 학습
            </p>
            <p className="text-sm">{lesson}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
