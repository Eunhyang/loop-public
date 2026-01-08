import { useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { useFilterContext } from '@/features/filters/context/FilterContext';
import { useUi } from '@/contexts/UiContext';

interface UseKeyboardShortcutsProps {
  helpModalOpen: boolean;
  setHelpModalOpen: (open: boolean) => void;
}

/**
 * Global keyboard shortcuts for Dashboard v2
 *
 * Implements shortcuts from legacy dashboard with IME compatibility:
 * - Navigation: 1, 2, 3 (Kanban, Calendar, Graph)
 * - Filters: F (toggle panel), Shift+R (reset), Shift+E/M (member select), Shift+A (all members)
 * - Utilities: Shift+C (cache reload), Escape (close modals/drawers), ? (help), Shift+Cmd/Ctrl+F (fullscreen)
 *
 * Only activates on dashboard routes to prevent interference with login/settings pages.
 */
export function useKeyboardShortcuts({ helpModalOpen, setHelpModalOpen }: UseKeyboardShortcutsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useDashboardInit();
  const filterContext = useFilterContext();
  const { activeEntityDrawer, activeModal, closeEntityDrawer, closeAllModals } = useUi();
  const queryClient = useQueryClient();

  // Route guard: only activate on dashboard routes
  const isDashboardRoute = useMemo(() => {
    const dashboardRoutes = ['/kanban', '/calendar', '/graph', '/pending', '/projects'];
    return dashboardRoutes.some(route => location.pathname.startsWith(route));
  }, [location.pathname]);

  useEffect(() => {
    // Don't activate shortcuts on non-dashboard routes (login, settings, etc.)
    if (!isDashboardRoute) return;

    /**
     * Detects if user is typing in an input field
     * Includes comprehensive checks for IME, contentEditable, and various input types
     */
    const isTyping = (e: KeyboardEvent): boolean => {
      const target = e.target as HTMLElement;
      const tagName = target.tagName;
      const isEditable = target.isContentEditable || target.getAttribute('role') === 'textbox';
      const isFormElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);

      // IME composition check (Korean input, etc.)
      if (e.isComposing) return true;

      return isFormElement || isEditable;
    };

    /**
     * Detects platform for cross-platform modifier keys
     */
    const isMac = typeof navigator !== 'undefined' &&
                  navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    /**
     * Clear all URL-based filters
     */
    const clearUrlFilters = () => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('assignee');
      newParams.delete('project_id');
      newParams.delete('project_ids');
      newParams.delete('program');
      newParams.delete('date');
      newParams.delete('week');
      newParams.delete('month');
      newParams.delete('track');
      newParams.delete('hypothesis');
      newParams.delete('condition');
      setSearchParams(newParams);
    };

    /**
     * Set assignees filter in URL
     */
    const setAssignees = (values: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('assignee');
      values.forEach(v => newParams.append('assignee', v));
      setSearchParams(newParams);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent key repeat
      if (e.repeat) return;

      // Skip if typing in input fields
      if (isTyping(e)) return;

      // Navigation shortcuts (1, 2, 3)
      if (e.code === 'Digit1' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/kanban');
        return;
      }

      if (e.code === 'Digit2' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/calendar');
        return;
      }

      if (e.code === 'Digit3' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        navigate('/graph');
        return;
      }

      // Filter Panel toggle (F)
      if (e.code === 'KeyF' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        filterContext.togglePanel();
        return;
      }

      // Reset all filters (Shift+R)
      if (e.shiftKey && e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        filterContext.resetFilters(); // Reset FilterContext state
        clearUrlFilters(); // Reset URL params
        return;
      }

      // Member shortcuts (Shift+E, Shift+M, Shift+A)
      if (data?.members) {
        // First member (Shift+E)
        if (e.shiftKey && e.code === 'KeyE' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          if (data.members[0]) {
            setAssignees([data.members[0].id]);
          }
          return;
        }

        // Second member (Shift+M)
        if (e.shiftKey && e.code === 'KeyM' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          if (data.members[1]) {
            setAssignees([data.members[1].id]);
          }
          return;
        }

        // All members (Shift+A)
        if (e.shiftKey && e.code === 'KeyA' && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setAssignees([]); // Clear assignees filter
          return;
        }
      }

      // Cache reload (Shift+C)
      if (e.shiftKey && e.code === 'KeyC' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        // Invalidate all queries starting with 'dashboard'
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === 'string' && key.startsWith('dashboard');
          },
        });
        // Also invalidate other dashboard-related queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['pending'] });
        return;
      }

      // Escape key - Close modals/drawers/panels in priority order
      if (e.code === 'Escape') {
        e.preventDefault();

        // Priority 1: Help modal
        if (helpModalOpen) {
          setHelpModalOpen(false);
          return;
        }

        // Priority 2: Legacy modals
        if (activeModal) {
          closeAllModals();
          return;
        }

        // Priority 3: Entity drawer (task, project, etc.)
        if (activeEntityDrawer) {
          closeEntityDrawer();
          return;
        }

        // Priority 4: Filter panel
        if (filterContext.isPanelOpen) {
          filterContext.togglePanel();
          return;
        }
      }

      // Help modal (? or Shift+/)
      if (e.shiftKey && e.code === 'Slash') {
        e.preventDefault();
        setHelpModalOpen(true);
        return;
      }

      // Fullscreen toggle (Shift+Cmd+F on Mac, Shift+Ctrl+F on Windows/Linux)
      if (e.shiftKey && (isMac ? e.metaKey : e.ctrlKey) && e.code === 'KeyF') {
        e.preventDefault();

        // Guard for SSR and browsers without fullscreen API
        if (typeof document === 'undefined' || !document.fullscreenEnabled) {
          console.warn('Fullscreen API not supported');
          return;
        }

        try {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        } catch (err) {
          console.warn('Fullscreen operation failed:', err);
        }
        return;
      }
    };

    // Attach event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount or route change
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isDashboardRoute,
    helpModalOpen,
    setHelpModalOpen,
    activeEntityDrawer,
    activeModal,
    filterContext,
    data,
    navigate,
    searchParams,
    setSearchParams,
    closeEntityDrawer,
    closeAllModals,
    queryClient,
    location.pathname,
  ]);
}
