/**
 * ImpactCollapsible - Notion-style collapsible wrapper for impact sections
 *
 * Used for both Expected Impact (A) and Realized Impact (B) sections.
 * Supports review mode with amber border highlight for suggested fields.
 */

import type { ReactNode } from 'react';

export interface ImpactCollapsibleProps {
  /** Section title (e.g., "A. Expected Impact" or "B. Realized Impact") */
  title: string;
  /** Current score value (null if not calculated) */
  score: number | null;
  /** Maximum possible score for this section */
  maxScore: number;
  /** Summary line shown when collapsed (e.g., "Enabling · Mid · 50%") */
  summary: string;
  /** Whether section is currently expanded */
  isExpanded: boolean;
  /** Callback when user toggles collapse state */
  onToggle: () => void;
  /** Force expand (used in review mode for suggested fields) */
  forceExpanded?: boolean;
  /** Apply amber border highlight (review mode suggestion) */
  isSuggested?: boolean;
  /** Content to show when expanded (editor component) */
  children: ReactNode;
}

/**
 * Notion-style collapsible section for impact display
 *
 * Collapsed state: ▶ Title, Score, Summary
 * Expanded state: ▼ Title, Divider, Children
 *
 * Accessibility: Uses <button> with proper ARIA attributes (Issue #5 from Codex)
 */
export function ImpactCollapsible({
  title,
  score,
  maxScore,
  summary,
  isExpanded,
  onToggle,
  forceExpanded = false,
  isSuggested = false,
  children,
}: ImpactCollapsibleProps) {
  const expanded = forceExpanded || isExpanded;
  const icon = expanded ? '▼' : '▶';

  // Format score for display
  const scoreDisplay = score != null ? `${score.toFixed(2)} / ${maxScore.toFixed(1)}` : 'N/A';

  return (
    <div
      className={`rounded-md border ${
        isSuggested
          ? 'border-l-4 border-l-amber-500 bg-amber-50/30'  // Amber highlight for review mode
          : 'border-gray-200'
      } p-4`}
    >
      {/* Header (clickable toggle) */}
      <button
        type="button"
        onClick={() => !forceExpanded && onToggle()}
        disabled={forceExpanded}
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        className={`w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded ${
          forceExpanded ? 'cursor-default' : 'cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
          {isSuggested && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Suggested</span>}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span>Score: {scoreDisplay}</span>
        </div>
        {!expanded && (
          <div className="text-xs text-gray-500 mt-1">
            {summary}
          </div>
        )}
      </button>

      {/* Content (shown when expanded) */}
      {expanded && (
        <>
          <div className="border-t border-gray-200 my-3" />
          <div className="mt-2">{children}</div>
        </>
      )}
    </div>
  );
}
