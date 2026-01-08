import { useEffect, useRef } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

/**
 * Help modal displaying all keyboard shortcuts
 * Accessible via ? key, closes on Escape or click outside
 */
export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Detect platform for displaying correct modifier key
  const isMac = typeof navigator !== 'undefined' &&
                navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  const categories: ShortcutCategory[] = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: '1', description: 'Kanban View' },
        { keys: '2', description: 'Calendar View' },
        { keys: '3', description: 'Graph View' },
      ],
    },
    {
      title: 'Filters',
      shortcuts: [
        { keys: 'F', description: 'Toggle Filter Panel' },
        { keys: 'Shift + R', description: 'Reset All Filters' },
        { keys: 'Shift + E', description: 'Filter by First Member' },
        { keys: 'Shift + M', description: 'Filter by Second Member' },
        { keys: 'Shift + A', description: 'Show All Members' },
      ],
    },
    {
      title: 'Utilities',
      shortcuts: [
        { keys: 'Shift + C', description: 'Reload Cache' },
        { keys: 'Escape', description: 'Close Modal/Drawer/Panel' },
        { keys: '?', description: 'Show This Help' },
        { keys: `Shift + ${modKey} + F`, description: 'Toggle Fullscreen' },
      ],
    },
  ];

  // Focus trap - when modal opens, focus on it
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Close on click outside
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
      aria-labelledby="help-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-surface rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 id="help-modal-title" className="text-xl font-semibold text-text-main">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-main transition-colors p-1 rounded hover:bg-hover"
            aria-label="Close help modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.keys}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-hover transition-colors"
                  >
                    <span className="text-text-main">{shortcut.description}</span>
                    <kbd className="px-3 py-1.5 text-sm font-mono bg-surface-elevated border border-border rounded shadow-sm text-text-main">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4">
          <p className="text-sm text-text-secondary text-center">
            Press <kbd className="px-2 py-1 text-xs font-mono bg-surface-elevated border border-border rounded">Escape</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
