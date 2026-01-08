import { useNavigate, NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUi } from '@/contexts/UiContext';
import { authStorage } from '@/features/auth/storage';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isAdmin?: boolean;
}

export const Header = ({ onToggleSidebar, isSidebarOpen, isAdmin = false }: HeaderProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openCreateTask, openCreateProject, openCreateProgram } = useUi();

  // Use isAdmin prop in Program button visibility
  const showProgramButton = isAdmin;

  const handleLogout = () => {
    authStorage.clearAll();
    navigate('/login');
  };

  const handleReload = () => {
    queryClient.invalidateQueries();
  };

  // Nav link style
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-1 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${isActive
      ? 'border-blue-600 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
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
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => openCreateTask()}
          className="px-2 py-1 border border-blue-500 text-gray-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors flex items-center gap-0.5"
        >
          <span>+</span>Task
        </button>

        <button
          onClick={openCreateProject}
          className="px-2 py-1 border border-green-500 hover:bg-green-50 rounded text-xs font-medium transition-colors flex items-center gap-0.5"
        >
          <span>+</span>Project
        </button>

        {showProgramButton && (
          <button
            onClick={openCreateProgram}
            className="px-2 py-1 border border-purple-500 text-gray-600 hover:bg-purple-50 rounded text-xs font-medium transition-colors flex items-center gap-0.5"
          >
            <span>+</span>Program
          </button>
        )}

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          onClick={handleReload}
          className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
          title="Reload Data"
        >
          <span className="text-lg leading-none">🔄</span>
        </button>

        <button
          onClick={() => navigate('/pending')}
          className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors relative"
          title="Pending Reviews"
        >
          <span className="text-lg leading-none">📋</span>
        </button>

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
