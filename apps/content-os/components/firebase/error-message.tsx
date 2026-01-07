/**
 * Error Message Component
 * Handles Firestore-specific errors with appropriate messages
 */

'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const getErrorMessage = (error: Error): { title: string; message: string } => {
    const errorStr = error.message.toLowerCase();

    if (errorStr.includes('permission') || errorStr.includes('denied')) {
      return {
        title: 'Permission Denied',
        message: 'You do not have permission to access this data. Please check your authentication.',
      };
    }

    if (errorStr.includes('index') || errorStr.includes('requires an index')) {
      return {
        title: 'Database Index Missing',
        message:
          'A required database index is being created. This usually takes a few minutes. Please try again shortly.',
      };
    }

    if (errorStr.includes('network') || errorStr.includes('fetch')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the database. Please check your internet connection.',
      };
    }

    if (errorStr.includes('not found') || errorStr.includes('404')) {
      return {
        title: 'Data Not Found',
        message: 'The requested data could not be found.',
      };
    }

    // Generic error
    return {
      title: 'Error Loading Data',
      message: error.message || 'An unexpected error occurred while loading data.',
    };
  };

  const { title, message } = getErrorMessage(error);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
