'use client';

/**
 * Snapshot Import Component
 * Task: tsk-content-os-15 - YouTube Studio Snapshot System
 *
 * UI for pasting and importing YouTube Studio snapshot data
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseYouTubeStudioSnapshot } from '@/lib/youtube/snapshot-parser';
import { SnapshotParseResult } from '@/types/youtube-snapshot';

interface SnapshotImportProps {
  onParseSuccess: (result: SnapshotParseResult) => void;
  onCancel?: () => void;
}

export function SnapshotImport({ onParseSuccess, onCancel }: SnapshotImportProps) {
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    setIsParsing(true);

    try {
      // Parse snapshot with today's date
      const result = parseYouTubeStudioSnapshot(pastedText);

      if (!result.success) {
        setError(result.errors?.join(', ') || 'Failed to parse snapshot');
        setIsParsing(false);
        return;
      }

      // Success - pass to parent
      onParseSuccess(result);
      setPastedText(''); // Clear textarea
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleClear = () => {
    setPastedText('');
    setError(null);
  };

  const hasText = pastedText.trim().length > 0;
  const textSizeKB = Math.round(pastedText.length / 1024);
  const isTooBig = pastedText.length > 1024 * 1024; // 1MB

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="snapshot-paste" className="text-sm font-medium">
          Paste YouTube Studio Data
        </label>
        <p className="text-sm text-muted-foreground">
          Copy data from YouTube Studio &quot;Last 7 days&quot; table and paste below.
          Expected format: Title, Views, Impressions, CTR (%)
        </p>
        <Textarea
          id="snapshot-paste"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Title	Views	Impressions	CTR (%)
Video Title 1	1,234	10,000	12.3%
Video Title 2	567	5,000	11.4%"
          className="min-h-[200px] font-mono text-sm"
          disabled={isParsing}
          aria-label="Paste YouTube Studio snapshot data"
        />
        {hasText && (
          <p className="text-xs text-muted-foreground">
            {textSizeKB} KB {isTooBig && <span className="text-destructive">(exceeds 1MB limit)</span>}
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleParse}
          disabled={!hasText || isParsing || isTooBig}
          className="flex-1"
        >
          {isParsing ? 'Parsing...' : 'Parse Snapshot'}
        </Button>
        {hasText && (
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isParsing}
          >
            Clear
          </Button>
        )}
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="ghost"
            disabled={isParsing}
          >
            Cancel
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Copy directly from YouTube Studio table (tab-separated)</li>
          <li>Header row is optional and will be auto-detected</li>
          <li>Impressions and CTR columns are optional</li>
          <li>Numbers can include commas (e.g., 1,234)</li>
        </ul>
      </div>
    </div>
  );
}
