import { useMemo, useCallback } from 'react';
import { EntityChip } from '@/components/common/entity';
import type { Track, TrackContribution } from '@/types';
import { trackColor } from '@/components/common/chipColors';
import { validateTrackWeights, weightToPercent, percentToWeight } from '../utils/calculator';

interface TrackContributionEditorProps {
  /** All available tracks */
  tracks: Track[];
  /** Current track contributions */
  value: TrackContribution[];
  /** Callback when contributions change */
  onChange: (contributions: TrackContribution[]) => void;
  /** Callback when a track chip is clicked (for right panel navigation) */
  onTrackClick?: (trackId: string) => void;
  /** Whether the editor is read-only */
  readonly?: boolean;
}

/**
 * Editor component for Track Contributions
 *
 * Features:
 * - Display all tracks as toggleable chips
 * - Weight input for selected tracks (0-100%, step 5)
 * - Total weight validation (<=100%)
 * - Click track to view in right panel
 * - Readonly mode support
 */
export function TrackContributionEditor({
  tracks,
  value,
  onChange,
  onTrackClick,
  readonly = false,
}: TrackContributionEditorProps) {
  // Create a map for quick lookup
  const contributionMap = useMemo(() => {
    const map = new Map<string, TrackContribution>();
    value.forEach(c => map.set(c.to, c));
    return map;
  }, [value]);

  // Validate total weight
  const validation = useMemo(() => validateTrackWeights(value), [value]);

  // Toggle track selection
  const handleToggleTrack = useCallback((trackId: string) => {
    if (readonly) return;

    const existing = contributionMap.get(trackId);
    if (existing) {
      // Remove track
      onChange(value.filter(c => c.to !== trackId));
    } else {
      // Add track with default weight
      onChange([...value, { to: trackId, weight: 0.2 }]);
    }
  }, [value, contributionMap, onChange, readonly]);

  // Update weight for a track
  const handleWeightChange = useCallback((trackId: string, percent: number) => {
    if (readonly) return;

    const weight = percentToWeight(percent);
    const updated = value.map(c =>
      c.to === trackId ? { ...c, weight } : c
    );
    onChange(updated);
  }, [value, onChange, readonly]);

  // Handle track chip click (for navigation)
  const handleTrackChipClick = useCallback((e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    onTrackClick?.(trackId);
  }, [onTrackClick]);

  // Get track name by ID
  const getTrackName = useCallback((trackId: string): string => {
    const track = tracks.find(t => t.entity_id === trackId);
    return track?.entity_name || trackId;
  }, [tracks]);

  // Readonly display
  if (readonly) {
    if (!value || value.length === 0) {
      return <span className="text-zinc-400 py-1">No track contributions</span>;
    }

    return (
      <div className="flex gap-2 flex-wrap py-1">
        {value.map((contrib) => (
          <button
            key={contrib.to}
            type="button"
            onClick={(e) => handleTrackChipClick(e, contrib.to)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
            title={contrib.rationale || `Weight: ${weightToPercent(contrib.weight)}%`}
          >
            <span>{getTrackName(contrib.to)}</span>
            <span className="font-medium">({weightToPercent(contrib.weight)}%)</span>
          </button>
        ))}
      </div>
    );
  }

  // Editable display
  return (
    <div className="space-y-3">
      {/* Track Selection Chips */}
      <div className="flex flex-wrap gap-2">
        {tracks.map((track) => {
          const isSelected = contributionMap.has(track.entity_id);
          return (
            <EntityChip
              key={track.entity_id}
              label={track.entity_name}
              value={track.entity_id}
              isSelected={isSelected}
              disabled={readonly}
              mode="link"
              color={trackColor}
              onClick={handleToggleTrack}
              onNavigate={() => onTrackClick?.(track.entity_id)}
            />
          );
        })}
      </div>

      {/* Weight Inputs for Selected Tracks */}
      {value.length > 0 && (
        <div className="space-y-2 pl-2 border-l-2 border-zinc-200">
          {value.map((contrib) => (
            <div key={contrib.to} className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => handleTrackChipClick(e, contrib.to)}
                className="text-sm text-amber-700 hover:text-amber-900 hover:underline transition-colors min-w-[100px] text-left"
                title="Click to view track details"
              >
                {getTrackName(contrib.to)}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weightToPercent(contrib.weight)}
                onChange={(e) => handleWeightChange(contrib.to, parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                aria-label={`Weight for ${getTrackName(contrib.to)}`}
              />
              <span className="text-sm font-mono text-zinc-600 w-12 text-right">
                {weightToPercent(contrib.weight)}%
              </span>
              <button
                type="button"
                onClick={() => handleToggleTrack(contrib.to)}
                className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                aria-label={`Remove ${getTrackName(contrib.to)}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Total Weight Display */}
          <div className={`flex items-center justify-between pt-2 border-t border-zinc-100 ${!validation.isValid ? 'text-red-600' : 'text-zinc-600'}`}>
            <span className="text-sm font-medium">Total Weight:</span>
            <span className={`text-sm font-mono ${!validation.isValid ? 'font-bold' : ''}`}>
              {validation.totalPercent}%
              {!validation.isValid && (
                <span className="ml-2 text-xs font-normal">
                  (exceeds 100%)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-zinc-400">
        Select tracks this project contributes to. Total weight should not exceed 100%.
      </p>
    </div>
  );
}
