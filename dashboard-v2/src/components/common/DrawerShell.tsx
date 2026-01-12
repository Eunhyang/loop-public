import { useEffect, useRef, useId, type ReactNode } from 'react';
import { FavoriteStarButton, type EntityType } from '@/features/favorites';
import { EntityIdGroup } from '@/components/common/entity/EntityIdGroup';

export interface DrawerShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showExpandButton?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
  onForward?: () => void;
  showForwardButton?: boolean;
  footer?: ReactNode;
  entityId?: string;
  entityType?: EntityType;
}

/**
 * DrawerShell - Common drawer shell component
 *
 * Responsibilities:
 * - Fixed backdrop with click-outside to close
 * - Slide-in animation from right
 * - Header (title, subtitle, close button)
 * - Scrollable body container
 * - ESC key handler
 * - Focus trap for accessibility
 * - ARIA attributes for screen readers (with unique IDs per instance)
 */
export function DrawerShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'w-[600px]',
  isExpanded = false,
  onToggleExpand,
  showExpandButton = false,
  onBack,
  showBackButton = false,
  onForward,
  showForwardButton = false,
  footer,
  entityId,
  entityType
}: DrawerShellProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Generate unique IDs for ARIA labels (prevents collisions when multiple drawers coexist)
  const titleId = useId();
  const subtitleId = useId();

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus drawer on open
      drawerRef.current?.focus();
    } else {
      // Restore focus on close
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Focus trap (filters to actually focusable elements)
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const allFocusable = drawerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!allFocusable) return;

      // Filter to actually focusable elements (not disabled, not hidden)
      const focusableElements = Array.from(allFocusable).filter((el) => {
        const htmlEl = el as HTMLElement;
        return (
          !htmlEl.hasAttribute('disabled') &&
          htmlEl.offsetParent !== null && // Check if visible
          htmlEl.tabIndex >= 0
        );
      });

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift+Tab: if on first element, go to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, go to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleTab);
    return () => window.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
        className={`fixed top-0 right-0 h-full ${isExpanded ? 'w-full' : width} bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Header buttons - left side */}
            <div className="flex items-center gap-1">
              {/* Back Button */}
              {showBackButton && onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Go back"
                  title="Back"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Forward Button */}
              {showForwardButton && onForward && (
                <button
                  onClick={onForward}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Go forward"
                  title="Forward"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 id={titleId} className="text-xl font-semibold text-gray-900 truncate">
                {title}
              </h2>
              {entityId && entityType ? (
                <EntityIdGroup id={entityId} type={entityType as any} className="mt-1" />
              ) : subtitle && (
                <p id={subtitleId} className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            {entityId && entityType && (
              <FavoriteStarButton entityId={entityId} entityType={entityType} size="md" />
            )}
            {showExpandButton && onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={isExpanded ? "Collapse drawer" : "Expand drawer"}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                ⛶
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body - Scrollable (no padding, children manage their own) */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {children}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
