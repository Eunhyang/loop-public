/**
 * Dummy data for Performance Dashboard
 * Task: tsk-content-os-06 - ContentOS Performance Dashboard Phase 1
 */

import {
  ContentPerformance,
  WeeklySummary,
  DiagnosisStatus,
  ProblemType,
  StatusBadgeConfig,
  DeltaResult,
} from "@/types/performance";

// Diagnostic thresholds
const THRESHOLDS = {
  MIN_IMPRESSIONS: 1000, // Minimum impressions to diagnose
  CTR_LOW: 5, // CTR below 5% is considered low
  WATCH_RATIO_LOW: 0.3, // Watch time below 30% of duration
  EXPANSION_RATIO: 3, // 7d impressions should be 3x of 24h
  CTR_HIGH: 8, // CTR above 8% is good
  EXPANSION_GOOD: 5, // 7d impressions 5x of 24h is excellent
};

// Status badge configurations
export const STATUS_BADGE_CONFIG: Record<DiagnosisStatus, StatusBadgeConfig> = {
  early_success: {
    label: "초기 반응 우수",
    color: "green",
    description: "CTR 8%+, 시청률 30%+, 7일간 3배 이상 확장. 알고리즘이 적극 추천 중",
  },
  stable: {
    label: "안정적",
    color: "blue",
    description: "일정한 조회수 유지. 장기 트래픽 소스로 활용 가능",
  },
  exposure_ok_click_weak: {
    label: "노출 OK / 클릭 약함",
    color: "yellow",
    description: "CTR 5% 미만. 썸네일/제목이 클릭을 유도하지 못함",
  },
  click_ok_watch_weak: {
    label: "클릭 OK / 시청 약함",
    color: "orange",
    description: "평균 시청 30% 미만. 초반 10초 훅 점검 필요",
  },
  expansion_failed: {
    label: "성장 둔화",
    color: "red",
    description: "7일 조회수가 24시간의 3배 미만. 알고리즘 추천이 정체된 상태로, 주제/타이밍 점검 필요",
  },
};

// Problem type labels
export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  thumbnail_title: "썸네일/제목 문제",
  early_hook: "초반 훅 문제",
  topic_timing: "주제/타이밍 문제",
  none: "문제 없음",
};

// Diagnosis logic: determine status and problem type
export function getDiagnosis(
  metrics: ContentPerformance["metrics"],
  videoDuration: number
): { status: DiagnosisStatus; problemType: ProblemType } {
  const { impressions_24h, impressions_7d, ctr_24h, avg_view_duration_24h } =
    metrics;

  // Not enough data for diagnosis
  if (impressions_24h < THRESHOLDS.MIN_IMPRESSIONS) {
    return { status: "stable", problemType: "none" };
  }

  // Calculate watch ratio
  const watchRatio = videoDuration > 0 ? avg_view_duration_24h / videoDuration : 0;
  const expansionRatio =
    impressions_24h > 0 ? impressions_7d / impressions_24h : 0;

  // Priority-based diagnosis (order matters)

  // 1. Check for early success
  if (
    ctr_24h >= THRESHOLDS.CTR_HIGH &&
    watchRatio >= THRESHOLDS.WATCH_RATIO_LOW &&
    expansionRatio >= THRESHOLDS.EXPANSION_RATIO
  ) {
    return { status: "early_success", problemType: "none" };
  }

  // 2. Check for CTR problem (thumbnail/title)
  if (ctr_24h < THRESHOLDS.CTR_LOW) {
    return { status: "exposure_ok_click_weak", problemType: "thumbnail_title" };
  }

  // 3. Check for watch time problem (early hook)
  if (watchRatio < THRESHOLDS.WATCH_RATIO_LOW) {
    return { status: "click_ok_watch_weak", problemType: "early_hook" };
  }

  // 4. Check for expansion failure
  if (expansionRatio < THRESHOLDS.EXPANSION_RATIO) {
    return { status: "expansion_failed", problemType: "topic_timing" };
  }

  // 5. Default: stable
  return { status: "stable", problemType: "none" };
}

// Calculate delta between 24h and 7d metrics
export function calculateDelta(
  value24h: number,
  value7d: number
): DeltaResult {
  const value = value7d - value24h;

  // Handle zero baseline case: if 24h is 0 but 7d has value, treat as 100% increase
  let percentage: number;
  if (value24h === 0) {
    percentage = value7d > 0 ? 100 : 0;
  } else {
    percentage = ((value7d - value24h) / value24h) * 100;
  }

  const trend: DeltaResult["trend"] =
    percentage > 5 ? "up" : percentage < -5 ? "down" : "stable";

  return { value, percentage, trend };
}

// Format numbers for display
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString();
}

// Format percentage
export function formatPercentage(num: number): string {
  return num.toFixed(1) + "%";
}

// Format duration in seconds to mm:ss
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Dummy performance data
export const dummyPerformanceData: ContentPerformance[] = [
  {
    id: "perf-1",
    videoId: "vid-001",
    title: "야식 끊는 법 5가지 - 과학적으로 검증된 방법",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 480, // 8 minutes
    publishedAt: "2025-12-28",
    uploadTime: "2025-12-28T14:00:00Z",
    metrics: {
      impressions_24h: 45000,
      impressions_7d: 180000,
      ctr_24h: 8.2,
      ctr_7d: 7.8,
      views_24h: 3690,
      views_7d: 14040,
      avg_view_duration_24h: 210,
      avg_view_duration_7d: 195,
    },
    status: "early_success",
    problemType: "none",
  },
  {
    id: "perf-2",
    videoId: "vid-002",
    title: "식욕 조절 루틴 - 아침에 하면 하루종일 효과",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 600, // 10 minutes
    publishedAt: "2025-12-25",
    uploadTime: "2025-12-25T10:00:00Z",
    metrics: {
      impressions_24h: 32000,
      impressions_7d: 85000,
      ctr_24h: 4.2,
      ctr_7d: 4.5,
      views_24h: 1344,
      views_7d: 3825,
      avg_view_duration_24h: 180,
      avg_view_duration_7d: 165,
    },
    status: "exposure_ok_click_weak",
    problemType: "thumbnail_title",
  },
  {
    id: "perf-3",
    videoId: "vid-003",
    title: "30일 다이어트 챌린지 결과 공개",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 720, // 12 minutes
    publishedAt: "2025-12-20",
    uploadTime: "2025-12-20T18:00:00Z",
    metrics: {
      impressions_24h: 78000,
      impressions_7d: 456000,
      ctr_24h: 9.1,
      ctr_7d: 8.5,
      views_24h: 7098,
      views_7d: 38760,
      avg_view_duration_24h: 320,
      avg_view_duration_7d: 290,
    },
    status: "early_success",
    problemType: "none",
  },
  {
    id: "perf-4",
    videoId: "vid-004",
    title: "운동 없이 살빼는 법 (진짜 됩니다)",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 540, // 9 minutes
    publishedAt: "2025-12-22",
    uploadTime: "2025-12-22T12:00:00Z",
    metrics: {
      impressions_24h: 52000,
      impressions_7d: 125000,
      ctr_24h: 7.8,
      ctr_7d: 6.9,
      views_24h: 4056,
      views_7d: 8625,
      avg_view_duration_24h: 85,
      avg_view_duration_7d: 90,
    },
    status: "click_ok_watch_weak",
    problemType: "early_hook",
  },
  {
    id: "perf-5",
    videoId: "vid-005",
    title: "간헐적 단식 1년 후기 - 솔직 리뷰",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 900, // 15 minutes
    publishedAt: "2025-12-18",
    uploadTime: "2025-12-18T16:00:00Z",
    metrics: {
      impressions_24h: 28000,
      impressions_7d: 42000,
      ctr_24h: 6.5,
      ctr_7d: 5.8,
      views_24h: 1820,
      views_7d: 2436,
      avg_view_duration_24h: 280,
      avg_view_duration_7d: 260,
    },
    status: "expansion_failed",
    problemType: "topic_timing",
  },
  {
    id: "perf-6",
    videoId: "vid-006",
    title: "단백질 섭취량 계산법 - 다이어터 필수",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 420, // 7 minutes
    publishedAt: "2025-12-26",
    uploadTime: "2025-12-26T09:00:00Z",
    metrics: {
      impressions_24h: 18000,
      impressions_7d: 67000,
      ctr_24h: 6.8,
      ctr_7d: 6.5,
      views_24h: 1224,
      views_7d: 4355,
      avg_view_duration_24h: 190,
      avg_view_duration_7d: 175,
    },
    status: "stable",
    problemType: "none",
  },
  {
    id: "perf-7",
    videoId: "vid-007",
    title: "살찌는 습관 TOP 10 (이것만 안해도...)",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 660, // 11 minutes
    publishedAt: "2025-12-30",
    uploadTime: "2025-12-30T11:00:00Z",
    metrics: {
      impressions_24h: 62000,
      impressions_7d: 98000,
      ctr_24h: 8.9,
      ctr_7d: 8.1,
      views_24h: 5518,
      views_7d: 7938,
      avg_view_duration_24h: 240,
      avg_view_duration_7d: 220,
    },
    status: "early_success",
    problemType: "none",
  },
  {
    id: "perf-8",
    videoId: "vid-008",
    title: "물 마시기만 했는데 5kg 빠짐",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 480, // 8 minutes
    publishedAt: "2025-12-15",
    uploadTime: "2025-12-15T15:00:00Z",
    metrics: {
      impressions_24h: 120000,
      impressions_7d: 890000,
      ctr_24h: 10.2,
      ctr_7d: 9.5,
      views_24h: 12240,
      views_7d: 84550,
      avg_view_duration_24h: 195,
      avg_view_duration_7d: 180,
    },
    status: "early_success",
    problemType: "none",
  },
  {
    id: "perf-9",
    videoId: "vid-009",
    title: "다이어트 식단표 무료 공유",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 360, // 6 minutes
    publishedAt: "2025-12-23",
    uploadTime: "2025-12-23T13:00:00Z",
    metrics: {
      impressions_24h: 22000,
      impressions_7d: 156000,
      ctr_24h: 3.8,
      ctr_7d: 4.2,
      views_24h: 836,
      views_7d: 6552,
      avg_view_duration_24h: 120,
      avg_view_duration_7d: 110,
    },
    status: "exposure_ok_click_weak",
    problemType: "thumbnail_title",
  },
  {
    id: "perf-10",
    videoId: "vid-010",
    title: "저녁 안먹기 vs 아침 안먹기 뭐가 나을까",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 540, // 9 minutes
    publishedAt: "2025-12-27",
    uploadTime: "2025-12-27T17:00:00Z",
    metrics: {
      impressions_24h: 48000,
      impressions_7d: 345000,
      ctr_24h: 7.5,
      ctr_7d: 7.2,
      views_24h: 3600,
      views_7d: 24840,
      avg_view_duration_24h: 210,
      avg_view_duration_7d: 195,
    },
    status: "stable",
    problemType: "none",
  },
  {
    id: "perf-11",
    videoId: "vid-011",
    title: "홈트 루틴 30분 - 초보자용",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 1800, // 30 minutes
    publishedAt: "2025-12-29",
    uploadTime: "2025-12-29T08:00:00Z",
    metrics: {
      impressions_24h: 35000,
      impressions_7d: 78000,
      ctr_24h: 5.5,
      ctr_7d: 5.2,
      views_24h: 1925,
      views_7d: 4056,
      avg_view_duration_24h: 420,
      avg_view_duration_7d: 380,
    },
    status: "click_ok_watch_weak",
    problemType: "early_hook",
  },
  {
    id: "perf-12",
    videoId: "vid-012",
    title: "체지방 측정하는 정확한 방법",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: 480, // 8 minutes
    publishedAt: "2025-12-24",
    uploadTime: "2025-12-24T14:00:00Z",
    metrics: {
      impressions_24h: 25000,
      impressions_7d: 112000,
      ctr_24h: 6.2,
      ctr_7d: 5.8,
      views_24h: 1550,
      views_7d: 6496,
      avg_view_duration_24h: 175,
      avg_view_duration_7d: 160,
    },
    status: "stable",
    problemType: "none",
  },
];

// Calculate weekly summary from performance data
export function calculateWeeklySummary(
  data: ContentPerformance[],
  weekStart: Date
): WeeklySummary {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekData = data.filter((item) => {
    const published = new Date(item.publishedAt);
    return published >= weekStart && published <= weekEnd;
  });

  const totalImpressions = weekData.reduce(
    (sum, item) => sum + item.metrics.impressions_7d,
    0
  );
  const totalViews = weekData.reduce(
    (sum, item) => sum + item.metrics.views_7d,
    0
  );
  const avgCtr24h =
    weekData.length > 0
      ? weekData.reduce((sum, item) => sum + item.metrics.ctr_24h, 0) /
        weekData.length
      : 0;

  const earlySuccessCount = weekData.filter(
    (item) => item.status === "early_success"
  ).length;
  const expansionSuccessCount = weekData.filter((item) => {
    const ratio =
      item.metrics.impressions_24h > 0
        ? item.metrics.impressions_7d / item.metrics.impressions_24h
        : 0;
    return ratio >= THRESHOLDS.EXPANSION_RATIO;
  }).length;

  const problemBreakdown: Record<ProblemType, number> = {
    thumbnail_title: 0,
    early_hook: 0,
    topic_timing: 0,
    none: 0,
  };

  weekData.forEach((item) => {
    problemBreakdown[item.problemType]++;
  });

  // Find most common problem, excluding "none" and requiring count > 0
  const problemEntries = (
    Object.entries(problemBreakdown) as [ProblemType, number][]
  )
    .filter(([type, count]) => type !== "none" && count > 0)
    .sort((a, b) => b[1] - a[1]);

  const mostCommonProblem: ProblemType = problemEntries.length > 0
    ? problemEntries[0][0]
    : "none";

  // Calculate week number
  const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((weekStart.getTime() - startOfYear.getTime()) / 86400000 +
      startOfYear.getDay() +
      1) /
      7
  );

  return {
    weekStart: weekStart.toISOString().split("T")[0],
    weekEnd: weekEnd.toISOString().split("T")[0],
    weekNumber,
    uploadCount: weekData.length,
    totalImpressions,
    totalViews,
    avgCtr24h,
    avgCtr4WeekAvg: avgCtr24h * 0.95, // Simulated 4-week average
    earlySuccessRate:
      weekData.length > 0 ? (earlySuccessCount / weekData.length) * 100 : 0,
    expansionSuccessRate:
      weekData.length > 0 ? (expansionSuccessCount / weekData.length) * 100 : 0,
    mostCommonProblem,
    problemBreakdown,
  };
}

// Get recent weekly summaries
export function getWeeklySummaries(weeks: number = 4): WeeklySummary[] {
  const summaries: WeeklySummary[] = [];
  const today = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - 7 * i);
    summaries.push(calculateWeeklySummary(dummyPerformanceData, weekStart));
  }

  return summaries.reverse();
}

// Get performance data by videoId
export function getPerformanceById(
  videoId: string
): ContentPerformance | undefined {
  return dummyPerformanceData.find((item) => item.videoId === videoId);
}
