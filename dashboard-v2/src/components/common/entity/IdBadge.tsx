import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface IdBadgeProps {
  id: string;
  className?: string;
}

/**
 * Badge for displaying entity ID with copy-to-clipboard functionality
 */
export function IdBadge({ id, className = '' }: IdBadgeProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      showToast(`Copied ${id} to clipboard`, 'success');

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy ID:', error);
      showToast('Failed to copy ID', 'error');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-mono
        bg-gray-100 hover:bg-gray-200 text-gray-800
        transition-colors cursor-pointer
        ${className}
      `}
      title="Click to copy ID"
    >
      <span className="font-semibold">{id}</span>
      <span className="text-xs opacity-70">
        {copied ? '✓' : '📋'}
      </span>
    </button>
  );
}
