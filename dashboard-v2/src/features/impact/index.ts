/**
 * Impact module - Expected Impact UI components and utilities
 *
 * Components:
 * - ExpectedImpactEditor: Tier/Magnitude/Confidence editor
 * - TrackContributionEditor: Track selection with weight inputs
 * - HypothesisSelector: Validates and Primary Hypothesis selectors
 * - ImpactScoreDisplay: Score display with help button
 * - ImpactExplainerModal: Score calculation explanation modal
 *
 * Utilities:
 * - calculateExpectedScore: Calculate impact score from tier/magnitude/confidence
 * - validateTrackWeights: Validate total weight <=100%
 * - formatScore: Format score for display
 */

// Components
export { ExpectedImpactEditor } from './components/ExpectedImpactEditor';
export { TrackContributionEditor } from './components/TrackContributionEditor';
export { HypothesisSelector } from './components/HypothesisSelector';
export { ImpactScoreDisplay } from './components/ImpactScoreDisplay';
export { ImpactExplainerModal } from './components/ImpactExplainerModal';

// Utilities
export {
  calculateExpectedScore,
  validateTrackWeights,
  formatScore,
  weightToPercent,
  percentToWeight,
  MAGNITUDE_POINTS,
  MAX_POINTS_BY_TIER,
  TIER_OPTIONS,
  MAGNITUDE_OPTIONS,
} from './utils/calculator';

// Types
export type {
  ExpectedImpact,
  TrackContribution,
  ImpactTier,
  ImpactMagnitude,
  ImpactScoreResult,
  TrackContributionDisplay,
  TrackWeightValidation,
} from './types';
