// Opportunity Dashboard Types

export interface Opportunity {
  id: string;
  keyword: string;
  finalScore: number;
  marketScore: number;
  fitScore: number;
  saturationScore: number;
  whyNow: string;
  recommendedBundle: {
    shorts: number;
    longform: number;
  };
  purposeType: PurposeType;
  targetLoop: TargetLoop;
  format: Format;
  createdAt: string; // ISO date string for period filtering
  isFavorite: boolean;
  isExcluded: boolean;
}

// Literal types for filter values
export type PurposeType =
  | "worldview"
  | "problem"
  | "reframe"
  | "protocol"
  | "case"
  | "product"
  | "authority";

export type TargetLoop =
  | "emotional"
  | "eating"
  | "habit"
  | "reward"
  | "autonomic";

export type Format =
  | "shorts"
  | "longform"
  | "community";

export type Period = "7d" | "14d" | "30d";

// Filter state types with "all" option
export type PurposeTypeFilter = PurposeType | "all";
export type TargetLoopFilter = TargetLoop | "all";
export type FormatFilter = Format | "all";
export type PeriodFilter = Period | "all";

// Filter state interface
export interface OpportunityFilters {
  purposeType: PurposeTypeFilter;
  targetLoop: TargetLoopFilter;
  format: FormatFilter;
  period: PeriodFilter;
}

// Display labels for filter options
export const PURPOSE_TYPE_LABELS: Record<PurposeType, string> = {
  worldview: "세계관",
  problem: "문제 인식",
  reframe: "관점 전환",
  protocol: "프로토콜",
  case: "케이스",
  product: "제품",
  authority: "권위",
};

export const TARGET_LOOP_LABELS: Record<TargetLoop, string> = {
  emotional: "감정 루프",
  eating: "식이 루프",
  habit: "습관 루프",
  reward: "보상 루프",
  autonomic: "자율 루프",
};

export const FORMAT_LABELS: Record<Format, string> = {
  shorts: "Shorts",
  longform: "Longform",
  community: "Community",
};

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "최근 7일",
  "14d": "최근 14일",
  "30d": "최근 30일",
};
