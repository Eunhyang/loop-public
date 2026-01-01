/**
 * Retro Dashboard Dummy Data
 * Task: tsk-content-os-05 - Content OS - 회고 대시보드 UI
 */

import {
  ABReport,
  LearningCard,
  NegativeEvidence,
} from "../types/retro";

// A/B 리포트 더미 데이터
export const dummyABReports: ABReport[] = [
  {
    id: "ab-001",
    projectName: "2025-01 콘텐츠 실험",
    period: "2025-01-01 ~ 2025-01-31",
    metrics: [
      {
        name: "CTR",
        expected: "+20%",
        realized: "+15%",
        achievementRate: 75,
      },
      {
        name: "Retention",
        expected: "+10%",
        realized: "+12%",
        achievementRate: 120,
      },
      {
        name: "구독전환",
        expected: "+5%",
        realized: "+3%",
        achievementRate: 60,
      },
    ],
    overallAchievement: 85,
  },
  {
    id: "ab-002",
    projectName: "Shorts 포맷 테스트",
    period: "2024-12-15 ~ 2024-12-31",
    metrics: [
      {
        name: "조회수",
        expected: "50K",
        realized: "72K",
        achievementRate: 144,
      },
      {
        name: "좋아요율",
        expected: "8%",
        realized: "9.2%",
        achievementRate: 115,
      },
      {
        name: "공유수",
        expected: "500",
        realized: "380",
        achievementRate: 76,
      },
    ],
    overallAchievement: 112,
  },
  {
    id: "ab-003",
    projectName: "건강 루프 타겟팅",
    period: "2024-12-01 ~ 2024-12-14",
    metrics: [
      {
        name: "타겟 도달률",
        expected: "40%",
        realized: "52%",
        achievementRate: 130,
      },
      {
        name: "재시청률",
        expected: "25%",
        realized: "28%",
        achievementRate: 112,
      },
      {
        name: "댓글 참여",
        expected: "+30%",
        realized: "+45%",
        achievementRate: 150,
      },
    ],
    overallAchievement: 131,
  },
];

// 학습 카드 더미 데이터
export const dummyLearningCards: LearningCard[] = [
  {
    id: "lc-001",
    type: "hook_pattern",
    title: "잘 된 훅 패턴 Top 5",
    items: [
      { rank: 1, name: '"숫자 + 오해"', value: "CTR +35%", isPositive: true },
      { rank: 2, name: '"~하면 큰일"', value: "CTR +28%", isPositive: true },
      { rank: 3, name: '"전문가가 말하는"', value: "CTR +22%", isPositive: true },
      { rank: 4, name: '"아무도 모르는"', value: "CTR +18%", isPositive: true },
      { rank: 5, name: '"이것만 알면"', value: "CTR +15%", isPositive: true },
    ],
  },
  {
    id: "lc-002",
    type: "format_performance",
    title: "포맷별 성과",
    items: [
      { name: "Shorts", value: "CTR 8.2%", delta: "Retention 45%" },
      { name: "Longform", value: "CTR 4.1%", delta: "Retention 62%" },
      { name: "Live", value: "CTR 2.8%", delta: "Retention 78%" },
    ],
  },
  {
    id: "lc-003",
    type: "loop_response",
    title: "타겟 루프별 반응",
    items: [
      { name: "emotional", value: "댓글 +42%", isPositive: true },
      { name: "eating", value: "저장 +38%", isPositive: true },
      { name: "habit", value: "공유 +25%", isPositive: true },
      { name: "sleep", value: "구독 +18%", isPositive: true },
    ],
  },
];

// Negative Evidence 더미 데이터
export const dummyNegativeEvidences: NegativeEvidence[] = [
  {
    id: "NE-023",
    projectId: "prj-content-01",
    projectName: "새벽 루틴 콘텐츠",
    expected: {
      ctr: "+20%",
      retention: "+10%",
    },
    realized: {
      ctr: "-8%",
      retention: "-5%",
    },
    inferredTags: ["topic_mismatch", "saturation"],
    lesson: "새벽 루틴 주제는 이미 포화 상태. 차별화 포인트 없이 진입하면 역효과.",
    createdAt: "2024-12-20",
  },
  {
    id: "NE-024",
    projectId: "prj-content-02",
    projectName: "다이어트 챌린지",
    expected: {
      ctr: "+15%",
      retention: "+8%",
    },
    realized: {
      ctr: "-3%",
      retention: "-12%",
    },
    inferredTags: ["timing", "format_fit"],
    lesson: "연말 시즌에 다이어트 콘텐츠는 역효과. 1월 신년 시즌에 재시도 필요.",
    createdAt: "2024-12-25",
  },
];

// 통계 데이터 계산 헬퍼
export function getRetroStats() {
  const totalReports = dummyABReports.length;
  const avgAchievement = Math.round(
    dummyABReports.reduce((sum, r) => sum + r.overallAchievement, 0) / totalReports
  );
  const negativeCount = dummyNegativeEvidences.length;
  const successfulReports = dummyABReports.filter(
    (r) => r.overallAchievement >= 100
  ).length;

  return {
    totalReports,
    avgAchievement,
    negativeCount,
    successfulReports,
    successRate: Math.round((successfulReports / totalReports) * 100),
  };
}
