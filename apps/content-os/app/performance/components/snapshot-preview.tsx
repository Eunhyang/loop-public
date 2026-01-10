'use client';

/**
 * Snapshot Preview Component
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * Preview parsed snapshot data before saving
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SnapshotParseResult } from '@/types/youtube-snapshot';
import { saveSnapshot } from '@/lib/youtube/snapshot-storage';
import { validateSnapshot } from '@/lib/youtube/snapshot-parser';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SnapshotPreviewProps {
  parseResult: SnapshotParseResult;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export function SnapshotPreview({
  parseResult,
  onSaveSuccess,
  onCancel,
}: SnapshotPreviewProps) {
  const [date, setDate] = useState(
    parseResult.snapshot?.snapshotDate || new Date().toISOString().split('T')[0]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  if (!parseResult.snapshot) {
    return null;
  }

  const { snapshot, warnings } = parseResult;
  const hasImpressions = snapshot.data.some((row) => row.impressions !== null);
  const hasCTR = snapshot.data.some((row) => row.ctr !== null);

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);

    try {
      // Update snapshot date
      const updatedSnapshot = { ...snapshot, snapshotDate: date };

      // Validate before saving
      const validationErrors = validateSnapshot(updatedSnapshot);
      if (validationErrors.length > 0) {
        setError(`Validation failed: ${validationErrors.join(', ')}`);
        setIsSaving(false);
        return;
      }

      // Save to IndexedDB
      const result = await saveSnapshot(updatedSnapshot, overwrite);

      if (!result.success) {
        setError(result.error || 'Failed to save snapshot');

        // If error is about duplicate, allow overwrite
        if (result.error?.includes('already exists')) {
          setOverwrite(true);
        }

        setIsSaving(false);
        return;
      }

      // Success
      onSaveSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsSaving(false);
    }
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    return num.toLocaleString();
  };

  const formatPercentage = (num: number | null) => {
    if (num === null) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Preview Snapshot</h3>
        <p className="text-sm text-muted-foreground">
          Review parsed data and confirm snapshot date before saving
        </p>
      </div>

      {/* Column detection status */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span>Views detected</span>
        </div>
        <div className="flex items-center gap-2">
          {hasImpressions ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
          <span>Impressions {hasImpressions ? 'detected' : 'not detected'}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasCTR ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
          <span>CTR {hasCTR ? 'detected' : 'not detected'}</span>
        </div>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <Alert>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Date picker */}
      <div className="space-y-2">
        <label htmlFor="snapshot-date" className="text-sm font-medium">
          Snapshot Date
        </label>
        <Input
          id="snapshot-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          disabled={isSaving}
          aria-label="Snapshot date"
        />
        <p className="text-xs text-muted-foreground">
          {snapshot.data.length} videos parsed
        </p>
      </div>

      {/* Data preview table */}
      <div className="border rounded-md max-h-[300px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Views</TableHead>
              {hasImpressions && <TableHead className="text-right">Impressions</TableHead>}
              {hasCTR && <TableHead className="text-right">CTR</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.data.slice(0, 10).map((row, i) => (
              <TableRow key={i}>
                <TableCell className="max-w-[300px] truncate" title={row.title}>
                  {row.title}
                </TableCell>
                <TableCell className="text-right">{formatNumber(row.views)}</TableCell>
                {hasImpressions && (
                  <TableCell className="text-right">{formatNumber(row.impressions)}</TableCell>
                )}
                {hasCTR && (
                  <TableCell className="text-right">{formatPercentage(row.ctr)}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {snapshot.data.length > 10 && (
          <p className="text-xs text-muted-foreground p-2 text-center border-t">
            ... and {snapshot.data.length - 10} more videos
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? 'Saving...' : overwrite ? 'Overwrite Existing' : 'Save Snapshot'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
