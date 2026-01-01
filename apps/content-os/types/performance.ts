/**
 * Performance Dashboard Types
 * Task: tsk-content-os-06 - ContentOS Performance Dashboard Phase 1
 */

// Core metrics structure for 24h and 7d comparison
export interface ContentMetrics {
  impressions_24h: number;
  impressions_7d: number;
  ctr_24h: number; // percentage (0-100)
  ctr_7d: number;
  views_24h: number;
  views_7d: number;
  avg_view_duration_24h: number; // seconds
  avg_view_duration_7d: number;
}

// Diagnosis status for content performance
export type DiagnosisStatus =
  | "early_success" // Good initial response
  | "stable" // Consistent performance
  | "exposure_ok_click_weak" // Impressions OK but CTR low
  | "click_ok_watch_weak" // CTR OK but watch time low
  | "expansion_failed"; // Failed to expand after 24h

// Problem type for diagnosis
export type ProblemType =
  | "thumbnail_title" // CTR_24h < 5%
  | "early_hook" // avg_duration < 30% of video length
  | "topic_timing" // impressions_7d < impressions_24h * 3
  | "none";

// Main content performance entity
export interface ContentPerformance {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  duration: number; // video length in seconds
  publishedAt: string; // ISO date string
  uploadTime: string; // ISO datetime string
  metrics: ContentMetrics;
  status: DiagnosisStatus;
  problemType: ProblemType;
}

// Weekly summary for aggregated view
export interface WeeklySummary {
  weekStart: string; // ISO date string
  weekEnd: string; // ISO date string
  weekNumber: number; // week of year
  uploadCount: number;
  totalImpressions: number;
  totalViews: number;
  avgCtr24h: number;
  avgCtr4WeekAvg: number; // 4-week rolling average
  earlySuccessRate: number; // percentage of early_success
  expansionSuccessRate: number; // percentage that expanded well
  mostCommonProblem: ProblemType;
  problemBreakdown: Record<ProblemType, number>;
}

// Filter state for performance list
export interface PerformanceFilters {
  status: DiagnosisStatus | "all";
  period: "7d" | "14d" | "30d" | "all";
  search: string;
}

// Sortable fields for performance table
export type PerformanceSortField =
  | "publishedAt"
  | "ctr_24h"
  | "ctr_7d"
  | "impressions_24h"
  | "views_24h";

// Sort state
export interface PerformanceSortState {
  field: PerformanceSortField;
  order: "asc" | "desc";
}

// Status badge configuration
export interface StatusBadgeConfig {
  label: string;
  color: "green" | "blue" | "yellow" | "orange" | "red";
  description: string;
}

// Delta calculation result
export interface DeltaResult {
  value: number; // absolute change
  percentage: number; // percentage change
  trend: "up" | "down" | "stable";
}
