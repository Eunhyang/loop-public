import { useMemo, useCallback } from 'react';
import type { ExpectedImpact, ImpactTier, ImpactMagnitude } from '../types';
import { ChipSelect, type ChipOption } from '@/components/common/ChipSelect';
import { ImpactScoreDisplay } from './ImpactScoreDisplay';
import {
  calculateExpectedScore,
  TIER_OPTIONS,
  MAGNITUDE_OPTIONS,
} from '../utils/calculator';

interface ExpectedImpactEditorProps {
  /** Current impact value */
  value: ExpectedImpact | undefined | null;
  /** Callback when impact value changes */
  onChange: (impact: ExpectedImpact) => void;
  /** Whether the editor is read-only */
  readonly?: boolean;
}

// Color definitions for tier chips (SSOT: impact_model_config.yml)
const tierColors: Record<ImpactTier, { bg: string; text: string; selected: string }> = {
  strategic: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#fef3c7] !text-[#92400e] !border-[#fcd34d]',
  },
  enabling: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#e0f2fe] !text-[#0369a1] !border-[#7dd3fc]',
  },
  operational: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#f1f5f9] !text-[#475569] !border-[#cbd5e1]',
  },
};

// Color definitions for magnitude chips (SSOT: impact_model_config.yml uses 'mid' not 'medium')
const magnitudeColors: Record<ImpactMagnitude, { bg: string; text: string; selected: string }> = {
  high: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#fee2e2] !text-[#991b1b] !border-[#fca5a5]',
  },
  mid: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#fef3c7] !text-[#92400e] !border-[#fcd34d]',
  },
  low: {
    bg: 'bg-white border-zinc-200',
    text: 'text-zinc-500',
    selected: '!bg-[#f0fdf4] !text-[#166534] !border-[#bbf7d0]',
  },
};

/**
 * Editor component for Expected Impact (Tier, Magnitude, Confidence, Rationale)
 *
 * Features:
 * - Tier selection: strategic, tactical, operational
 * - Magnitude selection: high, medium, low
 * - Confidence slider: 0-100%
 * - Rationale text area
 * - Real-time score calculation and display
 * - Readonly mode support
 */
export function ExpectedImpactEditor({
  value,
  onChange,
  readonly = false,
}: ExpectedImpactEditorProps) {
  // Default values if no impact is set (SSOT: impact_model_config.yml)
  const currentValue: ExpectedImpact = useMemo(() => ({
    tier: value?.tier || 'enabling',
    impact_magnitude: value?.impact_magnitude || 'mid',
    confidence: value?.confidence ?? 0.5,
    rationale: value?.rationale || '',
  }), [value]);

  // Calculate score based on current values
  const score = useMemo(
    () => calculateExpectedScore(
      currentValue.tier,
      currentValue.impact_magnitude,
      currentValue.confidence
    ),
    [currentValue.tier, currentValue.impact_magnitude, currentValue.confidence]
  );

  // Handlers
  const handleTierChange = useCallback((tier: string) => {
    onChange({
      ...currentValue,
      tier: tier as ExpectedImpact['tier'],
    });
  }, [currentValue, onChange]);

  const handleMagnitudeChange = useCallback((magnitude: string) => {
    onChange({
      ...currentValue,
      impact_magnitude: magnitude as ExpectedImpact['impact_magnitude'],
    });
  }, [currentValue, onChange]);

  const handleConfidenceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value, 10);
    onChange({
      ...currentValue,
      confidence: percent / 100,
    });
  }, [currentValue, onChange]);

  const handleRationaleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...currentValue,
      rationale: e.target.value,
    });
  }, [currentValue, onChange]);

  // Chip options with colors
  const tierChipOptions: ChipOption[] = useMemo(() =>
    TIER_OPTIONS.map(opt => ({
      value: opt.value,
      label: opt.label,
      color: tierColors[opt.value],
    })),
    []
  );

  const magnitudeChipOptions: ChipOption[] = useMemo(() =>
    MAGNITUDE_OPTIONS.map(opt => ({
      value: opt.value,
      label: opt.label,
      color: magnitudeColors[opt.value],
    })),
    []
  );

  // Readonly display
  if (readonly) {
    if (!value) {
      return <span className="text-zinc-400 py-1">No impact specified</span>;
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700">
            Tier: {value.tier || 'N/A'}
          </span>
          <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700">
            Magnitude: {value.impact_magnitude || 'N/A'}
          </span>
          <span className="inline-block px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs text-zinc-700">
            Confidence: {value.confidence != null ? (value.confidence * 100).toFixed(0) + '%' : 'N/A'}
          </span>
          <ImpactScoreDisplay score={score} />
        </div>
        {value.rationale && (
          <p className="text-xs text-zinc-600">{value.rationale}</p>
        )}
      </div>
    );
  }

  // Editable display
  return (
    <div className="space-y-4">
      {/* Score Display */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500">Score:</span>
        <ImpactScoreDisplay score={score} />
      </div>

      {/* Tier Selection */}
      <div className="space-y-1.5">
        <ChipSelect
          options={tierChipOptions}
          value={currentValue.tier}
          onChange={handleTierChange}
          label="Tier"
          aria-label="Impact tier"
        />
      </div>

      {/* Magnitude Selection */}
      <div className="space-y-1.5">
        <ChipSelect
          options={magnitudeChipOptions}
          value={currentValue.impact_magnitude}
          onChange={handleMagnitudeChange}
          label="Magnitude"
          aria-label="Impact magnitude"
        />
      </div>

      {/* Confidence Slider */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Confidence: {(currentValue.confidence * 100).toFixed(0)}%
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(currentValue.confidence * 100)}
            onChange={handleConfidenceChange}
            className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            aria-label="Confidence level"
          />
          <span className="text-sm font-mono text-zinc-600 w-12 text-right">
            {(currentValue.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Rationale */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Rationale
        </label>
        <textarea
          value={currentValue.rationale || ''}
          onChange={handleRationaleChange}
          placeholder="Enter the reasoning behind this impact assessment..."
          className="w-full min-h-[80px] px-3 py-2 text-sm border border-zinc-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-y"
          aria-label="Impact rationale"
        />
      </div>
    </div>
  );
}
