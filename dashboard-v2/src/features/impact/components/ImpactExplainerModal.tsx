import { useEffect, useRef } from 'react';
import type { ImpactScoreResult } from '../types';
import { MAGNITUDE_POINTS, MAX_POINTS_BY_TIER, formatScore } from '../utils/calculator';

interface ImpactExplainerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Current score for example display */
  currentScore?: ImpactScoreResult;
}

/**
 * Modal explaining how Expected Impact scores are calculated
 *
 * Features:
 * - Magnitude points table (tier x magnitude)
 * - Score formula explanation
 * - Example calculation using current values
 * - Accessible with ARIA roles and focus trap
 */
export function ImpactExplainerModal({
  isOpen,
  onClose,
  currentScore,
}: ImpactExplainerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap - focus close button when modal opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="explainer-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
          <h2
            id="explainer-modal-title"
            className="text-lg font-semibold text-zinc-900"
          >
            Expected Impact Score
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-900 transition-colors p-1 rounded hover:bg-zinc-100"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Formula */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Formula
            </h3>
            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 space-y-2">
              <div>
                <code className="text-sm text-zinc-900">
                  Raw Score = Base Points × Confidence
                </code>
              </div>
              <div>
                <code className="text-sm text-zinc-900">
                  Normalized = (Raw Score / Tier Max) × 10 / 10
                </code>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              All scores are normalized to /10 for consistent comparison across tiers
            </p>
          </div>

          {/* Points Table */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Magnitude Points
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50">
                    <th className="px-3 py-2 text-left font-medium text-zinc-700 border border-zinc-200">
                      Tier / Magnitude
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-zinc-700 border border-zinc-200">
                      High
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-zinc-700 border border-zinc-200">
                      Mid
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-zinc-700 border border-zinc-200">
                      Low
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-medium text-zinc-900 border border-zinc-200">
                      Strategic
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.strategic.high}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.strategic.mid}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.strategic.low}
                    </td>
                  </tr>
                  <tr className="bg-zinc-50/50">
                    <td className="px-3 py-2 font-medium text-zinc-900 border border-zinc-200">
                      Enabling
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.enabling.high}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.enabling.mid}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.enabling.low}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-zinc-900 border border-zinc-200">
                      Operational
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.operational.high}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.operational.mid}
                    </td>
                    <td className="px-3 py-2 text-center text-zinc-700 border border-zinc-200">
                      {MAGNITUDE_POINTS.operational.low}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Example Calculation */}
          {currentScore && (() => {
            const rawScore = currentScore.basePoints * currentScore.confidence;
            const tierMax = MAX_POINTS_BY_TIER[currentScore.tier];

            return (
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Current Calculation
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Tier:</span>
                    <span className="font-medium text-zinc-900 capitalize">
                      {currentScore.tier}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Magnitude:</span>
                    <span className="font-medium text-zinc-900 capitalize">
                      {currentScore.magnitude}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Base Points:</span>
                    <span className="font-medium text-zinc-900">
                      {currentScore.basePoints}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">Confidence:</span>
                    <span className="font-medium text-zinc-900">
                      {(currentScore.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <hr className="border-blue-200" />
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Raw Score:</span>
                      <span className="font-medium text-zinc-900">
                        {currentScore.basePoints} × {currentScore.confidence.toFixed(2)} = {rawScore.toFixed(2)} / {tierMax.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-zinc-700">Normalized:</span>
                      <span className="text-blue-700">
                        ({rawScore.toFixed(2)} / {tierMax.toFixed(1)}) × 10 ={' '}
                        {formatScore(currentScore.score, currentScore.maxScore)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tier Descriptions */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Tier Descriptions
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-zinc-900">Strategic</dt>
                <dd className="text-zinc-600 ml-4">
                  Directly affects business outcomes and long-term goals
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-900">Enabling</dt>
                <dd className="text-zinc-600 ml-4">
                  Enables strategic goals and accelerates capabilities
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-900">Operational</dt>
                <dd className="text-zinc-600 ml-4">
                  Day-to-day improvements and maintenance
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-3">
          <p className="text-xs text-zinc-500 text-center">
            Press{' '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 border border-zinc-200 rounded">
              Escape
            </kbd>{' '}
            or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
