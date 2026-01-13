/**
 * RealizedImpactEditor - Form for editing B Score (Realized Impact)
 *
 * SSOT compliant with:
 * - impact_model_config.yml (score calculation fields)
 * - schema_constants.yaml (decision fields)
 */

import { useState, useMemo } from 'react';
import type { RealizedImpact } from '@/types';
import { ChipSelect } from '@/components/common/ChipSelect';
import {
  calculateRealizedScore,
  EVIDENCE_STRENGTH_OPTIONS,
  VERDICT_OPTIONS,
  OUTCOME_OPTIONS,
  LEARNING_VALUE_OPTIONS,
} from '../utils/calculator';

export interface RealizedImpactEditorProps {
  value: RealizedImpact | undefined;
  onChange: (impact: RealizedImpact) => void;
  readonly?: boolean;
  reasoning?: string;  // Review mode suggestion reasoning
}

/**
 * Convert 0.0-1.0 value to 0-100 percentage for slider (Issue #3 from Codex)
 * Clamps incoming value to 0.0-1.0 range before conversion (Codex Issue #4)
 */
function toPercent(value: number | null): number {
  const clamped = Math.max(0.0, Math.min(1.0, value ?? 0));
  return clamped * 100;
}

/**
 * Convert 0-100 percentage to 0.0-1.0 for storage (Issue #3 from Codex)
 */
function fromPercent(percent: number): number {
  return percent / 100;
}

export function RealizedImpactEditor({
  value,
  onChange,
  readonly = false,
  reasoning,
}: RealizedImpactEditorProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Ensure impact object has all fields even if input value is partial
  const impact: RealizedImpact = useMemo(() => ({
    verdict: value?.verdict ?? null,
    outcome: value?.outcome ?? null,
    evidence_links: value?.evidence_links ?? [],
    decided: value?.decided ?? null,
    window_id: value?.window_id ?? null,
    time_range: value?.time_range ?? null,
    metrics_snapshot: value?.metrics_snapshot ?? {},
    normalized_delta: value?.normalized_delta ?? null,
    evidence_strength: value?.evidence_strength ?? null,
    attribution_share: value?.attribution_share ?? null,
    learning_value: value?.learning_value ?? null,
  }), [value]);

  // Calculate B Score with live update (Issue #7 from Codex - handle nulls)
  const scoreResult = useMemo(() => {
    return calculateRealizedScore(
      impact.normalized_delta,
      impact.evidence_strength,
      impact.attribution_share
    );
  }, [impact.normalized_delta, impact.evidence_strength, impact.attribution_share]);

  const handleChange = <K extends keyof RealizedImpact>(
    field: K,
    newValue: RealizedImpact[K]
  ) => {
    onChange({ ...impact, [field]: newValue });
  };

  // JSON editor handler with validation (Issue #8 from Codex + Codex Issue #3)
  const handleJsonChange = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      // Validate: must be object, not array, not null
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setJsonError('Must be an object');
        return;
      }
      // Validate: all values must be numbers (SSOT: Record<string, number>)
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val !== 'number') {
          setJsonError(`Value for "${key}" must be a number`);
          return;
        }
      }
      handleChange('metrics_snapshot', parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };

  if (readonly) {
    return (
      <div className="space-y-4 text-sm">
        <div>
          <div className="font-semibold">B Score</div>
          <div>{scoreResult.score.toFixed(2)} / {scoreResult.maxScore.toFixed(1)}</div>
        </div>
        <div>
          <div className="font-semibold">Delta</div>
          <div>{impact.normalized_delta != null ? `${toPercent(impact.normalized_delta)}%` : 'N/A'}</div>
        </div>
        <div>
          <div className="font-semibold">Strength</div>
          <div>{impact.evidence_strength ?? 'N/A'}</div>
        </div>
        <div>
          <div className="font-semibold">Attribution</div>
          <div>{impact.attribution_share != null ? `${toPercent(impact.attribution_share)}%` : 'N/A'}</div>
        </div>
        <div>
          <div className="font-semibold">Verdict</div>
          <div>{impact.verdict ?? 'N/A'}</div>
        </div>
        <div>
          <div className="font-semibold">Outcome</div>
          <div>{impact.outcome ?? 'N/A'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reasoning && (
        <div className="text-sm bg-amber-50 border border-amber-200 rounded p-3">
          <div className="font-semibold text-amber-900">Suggestion:</div>
          <div className="text-amber-800">{reasoning}</div>
        </div>
      )}

      {/* B Score Display */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <div className="text-sm font-semibold text-blue-900">Live B Score</div>
        <div className="text-2xl font-bold text-blue-900">
          {scoreResult.score.toFixed(2)} / {scoreResult.maxScore.toFixed(1)}
        </div>
        <div className="text-xs text-blue-700 mt-1">
          Formula: {scoreResult.normalizedDelta.toFixed(2)} × {scoreResult.evidenceStrength} ({EVIDENCE_STRENGTH_OPTIONS.find(o => o.value === scoreResult.evidenceStrength)?.description}) × {scoreResult.attributionShare.toFixed(2)}
        </div>
      </div>

      {/* Score Calculation Section */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Score Calculation</h4>

        {/* Normalized Delta Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Normalized Delta (Target Achievement): {toPercent(impact.normalized_delta).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={toPercent(impact.normalized_delta)}
            onChange={(e) => handleChange('normalized_delta', fromPercent(Number(e.target.value)))}
            className="w-full"
          />
        </div>

        {/* Evidence Strength */}
        <div>
          <ChipSelect
            label="Evidence Strength"
            options={EVIDENCE_STRENGTH_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            value={impact.evidence_strength ?? 'weak'}
            onChange={(v) => handleChange('evidence_strength', v as 'strong' | 'medium' | 'weak')}
          />
        </div>

        {/* Attribution Share Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attribution Share (Project Contribution): {toPercent(impact.attribution_share ?? 1.0).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={toPercent(impact.attribution_share ?? 1.0)}
            onChange={(e) => handleChange('attribution_share', fromPercent(Number(e.target.value)))}
            className="w-full"
          />
        </div>

        {/* Learning Value */}
        <div>
          <ChipSelect
            label="Learning Value"
            options={LEARNING_VALUE_OPTIONS}
            value={impact.learning_value ?? 'medium'}
            onChange={(v) => handleChange('learning_value', v as 'high' | 'medium' | 'low')}
          />
        </div>
      </div>

      {/* Decision Section */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-semibold text-gray-900">Decision</h4>

        {/* Verdict */}
        <div>
          <ChipSelect
            label="Verdict"
            options={VERDICT_OPTIONS.map(o => ({ value: o.value ?? '', label: o.label }))}
            value={impact.verdict ?? 'pending'}
            onChange={(v) => handleChange('verdict', v as RealizedImpact['verdict'])}
          />
        </div>

        {/* Outcome */}
        <div>
          <ChipSelect
            label="Outcome"
            options={OUTCOME_OPTIONS.map(o => ({ value: o.value ?? '', label: o.label }))}
            value={impact.outcome ?? 'inconclusive'}
            onChange={(v) => handleChange('outcome', v as RealizedImpact['outcome'])}
          />
        </div>

        {/* Decided Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Decided Date (YYYY-MM-DD)
          </label>
          <input
            type="date"
            value={impact.decided ?? ''}
            onChange={(e) => handleChange('decided', e.target.value || null)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Evidence Links */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evidence Links (one per line)
          </label>
          <textarea
            value={(impact.evidence_links ?? []).join('\n')}
            onChange={(e) => handleChange('evidence_links', e.target.value.split('\n').filter(l => l.trim()))}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Window Section (Optional/Advanced) */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-semibold text-gray-900">Evaluation Window (Optional)</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Window ID (YYYY-MM | YYYY-QN | YYYY-HN)
          </label>
          <input
            type="text"
            value={impact.window_id ?? ''}
            onChange={(e) => handleChange('window_id', e.target.value || null)}
            placeholder="2026-01 or 2026-Q1"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Range (YYYY-MM-DD..YYYY-MM-DD)
          </label>
          <input
            type="text"
            value={impact.time_range ?? ''}
            onChange={(e) => handleChange('time_range', e.target.value || null)}
            placeholder="2026-01-01..2026-01-31"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Metrics Snapshot (JSON)
          </label>
          <textarea
            value={JSON.stringify(impact.metrics_snapshot, null, 2)}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={4}
            className={`block w-full rounded-md shadow-sm font-mono text-xs ${jsonError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
          />
          {jsonError && <div className="text-sm text-red-600 mt-1">{jsonError}</div>}
        </div>
      </div>
    </div>
  );
}
