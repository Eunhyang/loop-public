/**
 * Impact module - Expected Impact (A) and Realized Impact (B) UI components and utilities
 *
 * Components:
 * - ImpactSection: Unified A+B section with collapsible UI (NEW)
 * - ImpactCollapsible: Notion-style collapsible wrapper (NEW)
 * - RealizedImpactEditor: B Score editor (NEW)
 * - ExpectedImpactEditor: Tier/Magnitude/Confidence editor
 * - TrackContributionEditor: Track selection with weight inputs
 * - HypothesisSelector: Validates and Primary Hypothesis selectors
 * - ImpactScoreDisplay: Score display with help button
 * - ImpactExplainerModal: Score calculation explanation modal
 *
 * Utilities:
 * - calculateExpectedScore: Calculate A score from tier/magnitude/confidence
 * - calculateRealizedScore: Calculate B score from delta/strength/attribution (NEW)
 * - validateTrackWeights: Validate total weight <=100%
 * - formatScore: Format score for display
 */

// Components
export { ImpactSection } from './components/ImpactSection';
export { ImpactCollapsible } from './components/ImpactCollapsible';
export { RealizedImpactEditor } from './components/RealizedImpactEditor';
export { ExpectedImpactEditor } from './components/ExpectedImpactEditor';
export { TrackContributionEditor } from './components/TrackContributionEditor';
export { HypothesisSelector } from './components/HypothesisSelector';
export { ImpactScoreDisplay } from './components/ImpactScoreDisplay';
export { ImpactExplainerModal } from './components/ImpactExplainerModal';

// Utilities
export {
  calculateExpectedScore,
  calculateRealizedScore,
  validateTrackWeights,
  formatScore,
  weightToPercent,
  percentToWeight,
  MAGNITUDE_POINTS,
  MAX_POINTS_BY_TIER,
  TIER_OPTIONS,
  MAGNITUDE_OPTIONS,
  STRENGTH_MULTIPLIERS,
  EVIDENCE_STRENGTH_OPTIONS,
  VERDICT_OPTIONS,
  OUTCOME_OPTIONS,
  LEARNING_VALUE_OPTIONS,
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
  EvidenceStrength,
  Verdict,
  Outcome,
  RealizedScoreResult,
} from './types';

// Re-export RealizedImpact from project types for convenience
export type { RealizedImpact } from '@/types';

// API hooks
export { useInferExpectedImpact, useInferHypothesisDraft } from './queries';
