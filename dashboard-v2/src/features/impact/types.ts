/**
 * Impact module types
 *
 * Extends types from types/project.ts with calculation results.
 * SSOT: magnitude_points are defined in impact_model_config.yml (API)
 * Frontend uses hardcoded values for performance (changes are rare).
 */

import type { ExpectedImpact, TrackContribution } from '@/types/project';

// Re-export base types for convenience
export type { ExpectedImpact, TrackContribution };

/**
 * Tier values for impact classification (SSOT: impact_model_config.yml)
 * - strategic: Directly affects business outcomes (highest weight)
 * - enabling: Enables strategic goals (medium weight)
 * - operational: Day-to-day improvements (lowest weight)
 */
export type ImpactTier = 'strategic' | 'enabling' | 'operational';

/**
 * Magnitude levels for impact size (SSOT: impact_model_config.yml)
 * Note: API uses 'mid' not 'medium'
 */
export type ImpactMagnitude = 'high' | 'mid' | 'low';

/**
 * Result of calculating expected impact score
 */
export interface ImpactScoreResult {
  /** Calculated score (points * confidence) */
  score: number;
  /** Maximum possible score for this tier */
  maxScore: number;
  /** Current tier selection */
  tier: ImpactTier;
  /** Current magnitude selection */
  magnitude: ImpactMagnitude;
  /** Confidence level (0.0 - 1.0) */
  confidence: number;
  /** Base points before confidence multiplier */
  basePoints: number;
}

/**
 * Track contribution with resolved name for display
 */
export interface TrackContributionDisplay extends TrackContribution {
  /** Track display name (resolved from entity_id) */
  trackName: string;
}

/**
 * Validation result for track weights
 */
export interface TrackWeightValidation {
  /** Whether total weight is valid (<=100%) */
  isValid: boolean;
  /** Total weight as decimal (0.0 - 1.0+) */
  totalWeight: number;
  /** Total weight as percentage for display */
  totalPercent: number;
  /** Error message if invalid */
  errorMessage?: string;
}
