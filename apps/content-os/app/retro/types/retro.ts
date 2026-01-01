/**
 * Retro Dashboard Types
 * Task: tsk-content-os-05 - Content OS - 회고 대시보드 UI
 */

// Evidence Type 분류
export type EvidenceType =
  | "hook_strength"    // 훅이 좋았음 (녹색)
  | "timing"           // 타이밍이 좋았음 (파란색)
  | "format_fit"       // 포맷이 맞았음 (보라색)
  | "topic_mismatch"   // 주제 미스매치 (주황색)
  | "saturation";      // 시장 포화 (빨간색)

// Evidence Type 라벨 및 색상 매핑
export const EVIDENCE_TYPE_CONFIG: Record<
  EvidenceType,
  { label: string; color: string; bgColor: string }
> = {
  hook_strength: {
    label: "훅 강점",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
  },
  timing: {
    label: "타이밍",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  format_fit: {
    label: "포맷 적합",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  topic_mismatch: {
    label: "주제 미스매치",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
  },
  saturation: {
    label: "시장 포화",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

// A/B 리포트 - 기대 vs 결과 비교
export interface ABReportMetric {
  name: string;
  expected: string;
  realized: string;
  achievementRate: number; // 100 = 100% 달성
}

export interface ABReport {
  id: string;
  projectName: string;
  period: string;
  metrics: ABReportMetric[];
  overallAchievement: number;
}

// 학습 카드 타입
export type LearningCardType =
  | "hook_pattern"        // 훅 패턴 Top N
  | "format_performance"  // 포맷별 성과
  | "loop_response";      // 타겟 루프별 반응

export interface LearningCardItem {
  rank?: number;
  name: string;
  value: string;
  delta?: string;
  isPositive?: boolean;
}

export interface LearningCard {
  id: string;
  type: LearningCardType;
  title: string;
  items: LearningCardItem[];
}

// Negative Evidence - 실패 케이스
export interface NegativeEvidence {
  id: string;
  projectId: string;
  projectName: string;
  expected: {
    ctr: string;
    retention: string;
  };
  realized: {
    ctr: string;
    retention: string;
  };
  inferredTags: EvidenceType[];
  lesson: string;
  createdAt: string;
}

// 학습 카드 타입 라벨
export const LEARNING_CARD_TYPE_LABELS: Record<LearningCardType, string> = {
  hook_pattern: "훅 패턴",
  format_performance: "포맷별 성과",
  loop_response: "루프별 반응",
};
