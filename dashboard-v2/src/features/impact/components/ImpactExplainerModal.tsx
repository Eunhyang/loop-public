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
            임팩트 점수 산출 안내
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
              계산 방식
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
              모든 점수는 등급 간 일관된 비교를 위해 10점 만점으로 보정됩니다.
            </p>
          </div>

          {/* Points Table */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              크기(Magnitude)별 가중치
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50">
                    <th className="px-3 py-2 text-left font-medium text-zinc-700 border border-zinc-200">
                      등급 / 크기
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-zinc-700 border border-zinc-200">
                      높음
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-zinc-700 border border-zinc-200">
                      중간
                    </th>
                    <th className="px-3 py-2 text-center font-medium text-zinc-700 border border-zinc-200">
                      낮음
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-medium text-zinc-900 border border-zinc-200">
                      핵심 전략 (Strategic)
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
                      실행 가속 (Enabling)
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
                      상시 운영 (Operational)
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
                  점수 산출 내역
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">등급:</span>
                    <span className="font-medium text-zinc-900 capitalize">
                      {currentScore.tier}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">크기:</span>
                    <span className="font-medium text-zinc-900 capitalize">
                      {currentScore.magnitude}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">기본 점수:</span>
                    <span className="font-medium text-zinc-900">
                      {currentScore.basePoints}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600">신뢰도:</span>
                    <span className="font-medium text-zinc-900">
                      {(currentScore.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <hr className="border-blue-200" />
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">가중 점수 (Raw):</span>
                      <span className="font-medium text-zinc-900">
                        {currentScore.basePoints} × {currentScore.confidence.toFixed(2)} = {rawScore.toFixed(2)} / {tierMax.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-zinc-700">보정 점수 (Normalized):</span>
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
              등급 상세 설명
            </h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="font-medium text-zinc-900">핵심 전략 (Strategic)</dt>
                <dd className="text-zinc-600 ml-4">
                  비즈니스 성과와 장기 목표에 직접적인 영향을 미치는 핵심 과제
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-900">실행 가속 (Enabling)</dt>
                <dd className="text-zinc-600 ml-4">
                  전략적 목표 달성을 돕고 조직의 역량과 실행 속도를 높이는 토대 과제
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-900">상시 운영 (Operational)</dt>
                <dd className="text-zinc-600 ml-4">
                  일상적인 효율 개선 및 안정적인 프로젝트 유지관리를 위한 상시 과제
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-3">
          <p className="text-xs text-zinc-500 text-center">
            Esc 키를 누르거나 창 밖을 클릭하면 닫힙니다.
          </p>
        </div>
      </div>
    </div>
  );
}
