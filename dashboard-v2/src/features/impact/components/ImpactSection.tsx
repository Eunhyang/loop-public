/**
 * ImpactSection - Unified component for A (Expected) + B (Realized) Impact
 *
 * Displays two independent collapsible sections with support for review mode.
 * Preserves existing ExpectedImpactEditor behavior (Issue #9 from Codex).
 */

import { useState } from 'react';
import type { ExpectedImpact, RealizedImpact } from '@/types';
import { ImpactCollapsible } from './ImpactCollapsible';
import { ExpectedImpactEditor } from './ExpectedImpactEditor';
import { RealizedImpactEditor } from './RealizedImpactEditor';
import { calculateExpectedScore, calculateRealizedScore } from '../utils/calculator';

export interface ImpactSectionProps {
  expectedImpact: ExpectedImpact | undefined;
  realizedImpact: RealizedImpact | undefined;
  onExpectedChange: (impact: ExpectedImpact) => void;
  onRealizedChange: (impact: RealizedImpact) => void;
  mode: 'create' | 'edit' | 'view' | 'review';
  readonly?: boolean;
  /** Review mode support (Issue #6 from Codex) */
  reviewMode?: {
    isSuggested: (field: 'expected_impact' | 'realized_impact') => boolean;
    getReasoning: (field: 'expected_impact' | 'realized_impact') => string | undefined;
  };
}

/**
 * Format summary line for collapsed state
 */
function formatExpectedSummary(impact: ExpectedImpact | undefined): string {
  if (!impact) return 'Not set';
  const tier = impact.tier || 'enabling';
  const mag = impact.impact_magnitude || 'mid';
  const conf = impact.confidence != null ? Math.round(impact.confidence * 100) : 50;
  return `${tier.charAt(0).toUpperCase() + tier.slice(1)} · ${mag.charAt(0).toUpperCase() + mag.slice(1)} · ${conf}%`;
}

function formatRealizedSummary(impact: RealizedImpact | undefined): string {
  if (!impact) return 'Not set';
  const strength = impact.evidence_strength || 'weak';
  const delta = impact.normalized_delta != null ? Math.round(impact.normalized_delta * 100) : 0;
  const attribution = impact.attribution_share != null ? Math.round(impact.attribution_share * 100) : 100;
  return `${strength.charAt(0).toUpperCase() + strength.slice(1)} · ${delta}% · ${attribution}%`;
}

/**
 * ImpactSection - Displays A and B sections with independent collapse states
 *
 * Review mode behavior (Issue #6):
 * - If mode === 'review' AND reviewMode.isSuggested(field), force that section expanded
 * - Apply amber border highlight via ImpactCollapsible's isSuggested prop
 * - Display reasoning below editor if available
 */
export function ImpactSection({
  expectedImpact,
  realizedImpact,
  onExpectedChange,
  onRealizedChange,
  mode,
  readonly = false,
  reviewMode,
}: ImpactSectionProps) {
  // Independent collapse state for each section
  const [isExpandedA, setIsExpandedA] = useState(false);
  const [isExpandedB, setIsExpandedB] = useState(false);

  // Calculate scores for display
  const expectedScore = calculateExpectedScore(
    expectedImpact?.tier,
    expectedImpact?.impact_magnitude,
    expectedImpact?.confidence
  );

  const realizedScore = calculateRealizedScore(
    realizedImpact?.normalized_delta ?? null,
    realizedImpact?.evidence_strength ?? null,
    realizedImpact?.attribution_share ?? null
  );

  // Review mode helpers
  const isExpectedSuggested = mode === 'review' && (reviewMode?.isSuggested('expected_impact') ?? false);
  const isRealizedSuggested = mode === 'review' && (reviewMode?.isSuggested('realized_impact') ?? false);
  const expectedReasoning = reviewMode?.getReasoning('expected_impact');
  const realizedReasoning = reviewMode?.getReasoning('realized_impact');

  return (
    <div className="space-y-4">
      {/* A. Expected Impact */}
      <ImpactCollapsible
        title="A. Expected Impact"
        score={expectedScore.score}
        maxScore={expectedScore.maxScore}
        summary={formatExpectedSummary(expectedImpact)}
        isExpanded={isExpandedA}
        onToggle={() => setIsExpandedA(!isExpandedA)}
        forceExpanded={isExpectedSuggested}
        isSuggested={isExpectedSuggested}
      >
        {expectedReasoning && (
          <div className="mb-4 text-sm bg-amber-50 border border-amber-200 rounded p-3">
            <div className="font-semibold text-amber-900">Suggestion:</div>
            <div className="text-amber-800">{expectedReasoning}</div>
          </div>
        )}
        <ExpectedImpactEditor
          value={expectedImpact}
          onChange={onExpectedChange}
          readonly={readonly || mode === 'view'}
        />
      </ImpactCollapsible>

      {/* B. Realized Impact */}
      <ImpactCollapsible
        title="B. Realized Impact"
        score={realizedScore.score}
        maxScore={realizedScore.maxScore}
        summary={formatRealizedSummary(realizedImpact)}
        isExpanded={isExpandedB}
        onToggle={() => setIsExpandedB(!isExpandedB)}
        forceExpanded={isRealizedSuggested}
        isSuggested={isRealizedSuggested}
      >
        <RealizedImpactEditor
          value={realizedImpact}
          onChange={onRealizedChange}
          readonly={readonly || mode === 'view'}
          reasoning={realizedReasoning}
        />
      </ImpactCollapsible>
    </div>
  );
}
