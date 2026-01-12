/**
 * Impact score calculation utilities
 *
 * SSOT: impact_model_config.yml (API side)
 * These values are hardcoded for frontend performance.
 * Update this file if impact_model_config.yml changes.
 *
 * Last synced: 2026-01-12
 */

import type {
  ImpactScoreResult,
  ImpactTier,
  ImpactMagnitude,
  TrackContribution,
  TrackWeightValidation,
  EvidenceStrength,
  RealizedScoreResult,
  Verdict,
  Outcome,
} from '../types';

/**
 * Magnitude points by tier and magnitude level
 * Source: impact_model_config.yml (SSOT)
 */
export const MAGNITUDE_POINTS: Record<ImpactTier, Record<ImpactMagnitude, number>> = {
  strategic: { high: 10, mid: 6, low: 3 },
  enabling: { high: 5, mid: 3, low: 1.5 },
  operational: { high: 2, mid: 1, low: 0.5 },
};

/**
 * Maximum possible points per tier (high magnitude)
 */
export const MAX_POINTS_BY_TIER: Record<ImpactTier, number> = {
  strategic: 10,
  enabling: 5,
  operational: 2,
};

/**
 * Tier options for UI display
 * SSOT: impact_model_config.yml tiers section
 */
export const TIER_OPTIONS: Array<{ value: ImpactTier; label: string }> = [
  { value: 'strategic', label: 'Strategic' },
  { value: 'enabling', label: 'Enabling' },
  { value: 'operational', label: 'Operational' },
];

/**
 * Magnitude options for UI display
 * SSOT: impact_model_config.yml magnitude_levels section
 * Note: Uses 'mid' not 'medium' to match API
 */
export const MAGNITUDE_OPTIONS: Array<{ value: ImpactMagnitude; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'mid', label: 'Mid' },
  { value: 'low', label: 'Low' },
];

/**
 * Calculate expected impact score
 *
 * Formula: score = magnitude_points[tier][magnitude] * confidence
 *
 * @param tier - Impact tier (strategic, tactical, operational)
 * @param magnitude - Impact magnitude (high, medium, low)
 * @param confidence - Confidence level (0.0 - 1.0)
 * @returns Calculated score result
 */
export function calculateExpectedScore(
  tier: string | undefined,
  magnitude: string | undefined,
  confidence: number | undefined
): ImpactScoreResult {
  // Default values for missing inputs (SSOT: impact_model_config.yml)
  const normalizedTier = (tier as ImpactTier) || 'enabling';
  const normalizedMagnitude = (magnitude as ImpactMagnitude) || 'mid';
  const normalizedConfidence = typeof confidence === 'number' ? confidence : 0.5;

  // Get base points from lookup table
  const tierPoints = MAGNITUDE_POINTS[normalizedTier];
  const basePoints = tierPoints?.[normalizedMagnitude] ?? 3; // default to enabling/mid

  // Calculate score
  const score = basePoints * normalizedConfidence;
  const maxScore = MAX_POINTS_BY_TIER[normalizedTier] ?? 5;

  return {
    score,
    maxScore,
    tier: normalizedTier,
    magnitude: normalizedMagnitude,
    confidence: normalizedConfidence,
    basePoints,
  };
}

/**
 * Format score for display
 *
 * @param score - Score value
 * @param maxScore - Maximum score value
 * @returns Formatted string like "3.50 / 10.0"
 */
export function formatScore(score: number, maxScore: number): string {
  return `${score.toFixed(2)} / ${maxScore.toFixed(1)}`;
}

/**
 * Validate track contribution weights
 *
 * Total weight must not exceed 100%
 *
 * @param contributions - Array of track contributions
 * @returns Validation result
 */
export function validateTrackWeights(
  contributions: TrackContribution[]
): TrackWeightValidation {
  const totalWeight = contributions.reduce((sum, c) => sum + (c.weight || 0), 0);
  const totalPercent = Math.round(totalWeight * 100);
  const isValid = totalWeight <= 1.0;

  return {
    isValid,
    totalWeight,
    totalPercent,
    errorMessage: isValid ? undefined : `Total weight ${totalPercent}% exceeds 100%`,
  };
}

/**
 * Convert weight decimal to percentage for display
 */
export function weightToPercent(weight: number): number {
  return Math.round(weight * 100);
}

/**
 * Convert percentage to weight decimal for storage
 */
export function percentToWeight(percent: number): number {
  return percent / 100;
}

/**
 * === B Score (Realized Impact) Calculation ===
 * SSOT: impact_model_config.yml:90-108
 * Last synced: 2026-01-12
 */

/**
 * Strength multipliers for evidence quality (SSOT: impact_model_config.yml:92-95)
 */
export const STRENGTH_MULTIPLIERS: Record<'strong' | 'medium' | 'weak', number> = {
  strong: 1.0,   // 정량적 데이터, 명확한 인과관계
  medium: 0.7,   // 정성적 증거, 합리적 추론
  weak: 0.4,     // 간접 증거, 약한 연관성
};

/**
 * Evidence strength options for UI
 */
export const EVIDENCE_STRENGTH_OPTIONS: Array<{
  value: 'strong' | 'medium' | 'weak';
  label: string;
  description: string;
}> = [
  { value: 'strong', label: 'Strong', description: '정량적 데이터, 명확한 인과관계' },
  { value: 'medium', label: 'Medium', description: '정성적 증거, 합리적 추론' },
  { value: 'weak', label: 'Weak', description: '간접 증거, 약한 연관성' },
];

/**
 * Verdict options for UI (SSOT: schema_constants.yaml:525)
 */
export const VERDICT_OPTIONS: Array<{ value: Verdict; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'go', label: 'Go' },
  { value: 'no-go', label: 'No-Go' },
  { value: 'pivot', label: 'Pivot' },
];

/**
 * Outcome options for UI (SSOT: schema_constants.yaml:526)
 */
export const OUTCOME_OPTIONS: Array<{ value: Outcome; label: string }> = [
  { value: 'supported', label: 'Supported' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'inconclusive', label: 'Inconclusive' },
];

/**
 * Learning value options for UI (SSOT: impact_model_config.yml:160-187)
 */
export const LEARNING_VALUE_OPTIONS: Array<{
  value: 'high' | 'medium' | 'low';
  label: string;
}> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

/**
 * Calculate realized impact (B) score
 *
 * Formula: score = normalized_delta × strength_mult × attribution_share
 * SSOT: impact_model_config.yml:90
 *
 * @param normalizedDelta - Target achievement ratio (0.0-1.0, null = 0)
 * @param evidenceStrength - Evidence quality (null = 'weak' default)
 * @param attributionShare - Project contribution (0.0-1.0, null = 1.0)
 * @returns Calculated score result with maxScore=1.0
 */
export function calculateRealizedScore(
  normalizedDelta: number | null,
  evidenceStrength: EvidenceStrength,
  attributionShare: number | null
): RealizedScoreResult {
  // Null handling: use defaults before clamping (Issue #2 from Codex)
  const delta = normalizedDelta ?? 0;
  const strength = evidenceStrength ?? 'weak';
  const attribution = attributionShare ?? 1.0;

  // Clamp to SSOT range: 0.0-1.0 (impact_model_config.yml:98-108)
  const clampedDelta = Math.max(0.0, Math.min(1.0, delta));
  const clampedAttribution = Math.max(0.0, Math.min(1.0, attribution));

  // Get multiplier (safe fallback for null)
  const strengthMult = STRENGTH_MULTIPLIERS[strength] ?? STRENGTH_MULTIPLIERS.weak;

  // Calculate B Score
  const score = clampedDelta * strengthMult * clampedAttribution;

  return {
    score,
    maxScore: 1.0,  // SSOT standard max for B Score
    normalizedDelta: clampedDelta,
    evidenceStrength: strength,
    attributionShare: clampedAttribution,
  };
}
