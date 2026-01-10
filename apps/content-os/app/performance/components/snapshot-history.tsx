/**
 * Snapshot History Component
 * Task: tsk-content-os-15 - Snapshot Integration (Clean Architecture)
 *
 * Collapsible panel showing stored snapshots with match statistics.
 */

'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Database,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSnapshot } from '../hooks/use-snapshot';
import type { MatchStats } from '@/lib/domain/performance/types';

interface SnapshotHistoryProps {
  matchStats: MatchStats | null;
  snapshotDate: string | null;
  deltaAvailable: boolean;
}

/**
 * Snapshot History Panel
 */
export function SnapshotHistory({
  matchStats,
  snapshotDate,
  deltaAvailable,
}: SnapshotHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { snapshotDates, storageStats, isLoading } = useSnapshot();

  // Hide if no snapshot data and not loading
  if (!isLoading && !snapshotDate && (!snapshotDates || snapshotDates.length === 0)) {
    return null;
  }

  const matchRate = matchStats
    ? Math.round(
        ((matchStats.exactMatches + matchStats.fuzzyMatches) / matchStats.total) *
          100
      )
    : 0;

  const matchRateColor =
    matchRate >= 80
      ? 'text-green-600 dark:text-green-400'
      : matchRate >= 50
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400';

  return (
    <div className="border rounded-lg mb-4 bg-card">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-3 h-auto hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Snapshot Data</span>
          {snapshotDate && (
            <span className="text-sm text-muted-foreground">
              ({snapshotDate})
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {matchStats && (
            <div className="flex items-center gap-2 text-sm">
              <span className={matchRateColor}>{matchRate}% matched</span>
              {deltaAvailable ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </TooltipTrigger>
                    <TooltipContent>24h deltas available</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Need yesterday&apos;s snapshot for 24h deltas
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </Button>

      {isExpanded && (
        <div className="p-3 pt-0 border-t space-y-4">
          {/* Match Statistics */}
          {matchStats && (
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Total Videos</div>
                <div className="font-medium">{matchStats.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Exact Match</div>
                <div className="font-medium text-green-600 dark:text-green-400">
                  {matchStats.exactMatches}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Fuzzy Match</div>
                <div className="font-medium text-yellow-600 dark:text-yellow-400">
                  {matchStats.fuzzyMatches}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">No Match</div>
                <div className="font-medium text-red-600 dark:text-red-400">
                  {matchStats.noMatches}
                </div>
              </div>
            </div>
          )}

          {/* Delta Status */}
          <div className="text-sm flex items-center gap-2">
            {deltaAvailable ? (
              <>
                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">
                  24h deltas available (yesterday&apos;s snapshot found)
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                <span className="text-yellow-600 dark:text-yellow-400">
                  24h deltas unavailable (import yesterday&apos;s snapshot)
                </span>
              </>
            )}
          </div>

          {/* Info about snapshot data */}
          <div className="text-xs text-muted-foreground flex items-start gap-2 bg-muted/50 p-2 rounded">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>
              Snapshot data provides real CTR and impressions from YouTube Studio.
              API data takes priority; snapshots fill gaps where API returns 0.
            </span>
          </div>

          {/* Snapshot History List */}
          {snapshotDates && snapshotDates.length > 0 && (
            <div className="text-sm">
              <div className="text-muted-foreground text-xs mb-2">
                Recent Snapshots:
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshotDates.slice(0, 7).map((date) => (
                  <span
                    key={date}
                    className={`px-2 py-1 rounded text-xs ${
                      date === snapshotDate
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {date}
                  </span>
                ))}
                {snapshotDates.length > 7 && (
                  <span className="px-2 py-1 text-xs text-muted-foreground">
                    +{snapshotDates.length - 7} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Storage Stats */}
          {storageStats && (
            <div className="text-xs text-muted-foreground">
              {storageStats.totalSnapshots} snapshots stored (
              {Math.round(storageStats.storageUsageBytes / 1024)} KB)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
