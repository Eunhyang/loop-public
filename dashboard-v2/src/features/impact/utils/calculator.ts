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
} from '../types';

/**
 * Magnitude points by tier and magnitude level
 * Source: impact_model_config.yml
 */
export const MAGNITUDE_POINTS: Record<ImpactTier, Record<ImpactMagnitude, number>> = {
  strategic: { high: 10, medium: 6, low: 3 },
  tactical: { high: 5, medium: 3, low: 1.5 },
  operational: { high: 2, medium: 1, low: 0.5 },
};

/**
 * Maximum possible points per tier (high magnitude)
 */
export const MAX_POINTS_BY_TIER: Record<ImpactTier, number> = {
  strategic: 10,
  tactical: 5,
  operational: 2,
};

/**
 * Tier options for UI display
 */
export const TIER_OPTIONS: Array<{ value: ImpactTier; label: string }> = [
  { value: 'strategic', label: 'Strategic' },
  { value: 'tactical', label: 'Tactical' },
  { value: 'operational', label: 'Operational' },
];

/**
 * Magnitude options for UI display
 */
export const MAGNITUDE_OPTIONS: Array<{ value: ImpactMagnitude; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
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
  // Default values for missing inputs
  const normalizedTier = (tier as ImpactTier) || 'tactical';
  const normalizedMagnitude = (magnitude as ImpactMagnitude) || 'medium';
  const normalizedConfidence = typeof confidence === 'number' ? confidence : 0.5;

  // Get base points from lookup table
  const tierPoints = MAGNITUDE_POINTS[normalizedTier];
  const basePoints = tierPoints?.[normalizedMagnitude] ?? 3; // default to tactical/medium

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
