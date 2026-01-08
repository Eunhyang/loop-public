import { Link, useLocation } from 'react-router-dom';
import { useDashboardInit } from '@/queries/useDashboardInit';
import { SidebarSection } from './SidebarSection';

export const Sidebar = () => {
  const { data } = useDashboardInit();
  const location = useLocation();

  // Helper to determine if a link is active
  const isActive = (path: string) => location.pathname.startsWith(path);
  const linkClass = (path: string) => `block px-4 py-1.5 rounded-md transition-colors text-sm font-medium ${isActive(path)
    ? 'bg-zinc-200 text-zinc-900'
    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'}`;

  return (
    <aside className="w-64 u-sidebar flex flex-col h-screen font-sans bg-surface">
      {/* Header Spacer */}
      <div className="pt-4 px-4 pb-2">
        {/* Optional: User/Org Switcher could go here */}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6">
        {/* Main Navigation */}
        <nav className="space-y-0.5">
          <Link to="/kanban" className={linkClass('/kanban')}>
            Kanban
          </Link>
          <Link to="/pending" className={linkClass('/pending')}>
            Pending Review
          </Link>
          <Link to="/calendar" className={linkClass('/calendar')}>
            Calendar
          </Link>
          <Link to="/graph" className={linkClass('/graph')}>
            Graph
          </Link>
          <Link to="/program" className={linkClass('/program')}>
            Program
          </Link>
        </nav>

        {/* Legacy Filtering Sections */}
        <div className="space-y-1">
          <SidebarSection
            title="Tracks"
            type="track"
            items={data?.tracks?.map(t => ({ id: t.entity_id, name: t.entity_name })) || []}
          />
          <SidebarSection
            title="Hypotheses"
            type="hypothesis"
            items={data?.hypotheses?.map(h => ({ id: h.entity_id, name: h.entity_name })) || []}
          />
          <SidebarSection
            title="Conditions"
            type="condition"
            items={data?.conditions?.map(c => ({ id: c.entity_id, name: c.entity_name })) || []}
            defaultExpanded={false}
          />
        </div>
      </div>

      <div className="p-4 border-t border-zinc-200 text-xs text-zinc-400">
        LOOP Vault System
      </div>
    </aside>
  );
};
