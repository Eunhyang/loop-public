/**
 * Loading Spinner Component
 * Used while Firebase data is being fetched
 */

'use client';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}
