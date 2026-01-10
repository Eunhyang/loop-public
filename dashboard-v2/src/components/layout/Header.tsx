import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUi } from '@/contexts/UiContext';
import { authStorage } from '@/features/auth/storage';
import { httpClient } from '@/services/http';
import { useFilterContext } from '@/features/filters/context/FilterContext';
import { ActivityToggle } from '@/features/activity';
import { usePendingReviews } from '@/features/pending/queries';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isAdmin?: boolean;
}

type ReloadState = 'idle' | 'loading' | 'success' | 'error';

export const Header = ({ onToggleSidebar, isSidebarOpen, isAdmin = false }: HeaderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openEntityDrawer } = useUi();
  const { togglePanel, isPanelOpen } = useFilterContext();
  const [reloadState, setReloadState] = useState<ReloadState>('idle');
  const { data: pendingReviews = [] } = usePendingReviews();

  // Count pending status reviews only
  const pendingCount = pendingReviews.filter(r => r.status === 'pending').length;

  // Use isAdmin prop in Program button visibility
  const showProgramButton = isAdmin;

  const handleLogout = () => {
    authStorage.clearAll();
    navigate('/login');
  };

  const handleReload = async () => {
    if (reloadState === 'loading') return; // Prevent double-click

    try {
      setReloadState('loading');

      // 1. Reload server cache
      await httpClient.post('/api/cache/reload');

      // 2. Invalidate React Query cache
      await queryClient.invalidateQueries();

      // 3. Show success
      setReloadState('success');
      console.log('Cache reloaded successfully');

      // 4. Reset to idle after delay
      setTimeout(() => setReloadState('idle'), 1500);
    } catch (err) {
      console.error('Cache reload failed:', err);
      setReloadState('error');
      setTimeout(() => setReloadState('idle'), 2000);
    }
  };

  const getReloadIcon = () => {
    switch (reloadState) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '🔄';
    }
  };

  // Nav link style
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${isActive
      ? 'bg-blue-50 text-blue-600'
      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
    }`;

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-4 h-full">
        {/* Toggle Button (Visible when sidebar is closed) */}
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
            title="Open Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}

        <div className="flex flex-col justify-center">
          <h2 className="text-md font-bold text-gray-800 leading-tight">LOOP Dashboard </h2>
        </div>

        <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

        {/* Access Links (Legacy View Toggles -> Now NavLinks) */}
        <nav className="hidden md:flex items-center gap-6 h-full">
          <NavLink to="/kanban" className={navLinkClass}>Kanban</NavLink>
          <NavLink to="/calendar" className={navLinkClass}>Calendar</NavLink>
          <NavLink to="/graph" className={navLinkClass}>Graph</NavLink>
          <NavLink to="/pending" className={navLinkClass}>
            <span className="flex items-center gap-1.5">
              Review
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-semibold text-white bg-red-500 rounded-full">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </span>
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => openEntityDrawer({ type: 'task', mode: 'create' })}
          className="px-2 py-1 border border-blue-500 text-gray-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors flex items-center gap-0.5"
        >
          <span>+</span>Task
        </button>

        <button
          onClick={() => openEntityDrawer({ type: 'project', mode: 'create' })}
          className="px-2 py-1 border border-green-500 hover:bg-green-50 rounded text-xs font-medium transition-colors flex items-center gap-0.5"
        >
          <span>+</span>Project
        </button>

        {showProgramButton && (
          <button
            onClick={() => openEntityDrawer({ type: 'program', mode: 'create' })}
            className="px-2 py-1 border border-purple-500 text-gray-600 hover:bg-purple-50 rounded text-xs font-medium transition-colors flex items-center gap-0.5"
          >
            <span>+</span>Program
          </button>
        )}

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          onClick={handleReload}
          disabled={reloadState === 'loading'}
          className={`p-2 rounded transition-colors ${reloadState === 'loading'
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
          title="Reload Data"
        >
          <span className="text-lg leading-none">{getReloadIcon()}</span>
        </button>

        <button
          onClick={togglePanel}
          className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 border ${isPanelOpen
              ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-gray-200'
            }`}
          title="Toggle Filters"
        >
          <span className="text-lg leading-none">⚙</span>
          <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
        </button>

        <ActivityToggle />

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">User</span>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 hover:underline transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};
