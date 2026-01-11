import { useState } from 'react';
import type { ImpactScoreResult } from '../types';
import { formatScore } from '../utils/calculator';
import { ImpactExplainerModal } from './ImpactExplainerModal';

interface ImpactScoreDisplayProps {
  /** Calculated score result */
  score: ImpactScoreResult;
  /** Additional class names for the container */
  className?: string;
}

/**
 * Display component for impact score with help button
 *
 * Features:
 * - Shows score in "X.XX / Y.Y" format
 * - "?" button opens explainer modal
 * - Tooltip on hover
 */
export function ImpactScoreDisplay({
  score,
  className = '',
}: ImpactScoreDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formattedScore = formatScore(score.score, score.maxScore);

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="font-mono text-sm text-zinc-900 bg-zinc-100 px-2 py-1 rounded">
          {formattedScore}
        </span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-5 h-5 flex items-center justify-center text-xs font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          title="How is this score calculated?"
          aria-label="Show score calculation explanation"
        >
          ?
        </button>
      </div>

      <ImpactExplainerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentScore={score}
      />
    </>
  );
}
