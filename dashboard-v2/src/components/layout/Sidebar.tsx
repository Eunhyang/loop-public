import { useDashboardInit } from '@/queries/useDashboardInit';
import { SidebarSection } from './SidebarSection';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { data } = useDashboardInit();

  return (
    <aside
      className={`
            border-r border-zinc-200 bg-surface flex flex-col h-screen font-sans
            transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap
            ${isOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0'}
        `}
    >
      {/* Header Spacer & Close Button */}
      <div className="h-14 flex items-center justify-between px-4 shrink-0 group">
        <span className="text-sm font-semibold text-zinc-500">Menu</span>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors opacity-0 group-hover:opacity-100"
          title="Close Sidebar"
        >
          «
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-6">
        {/* Filtering Sections Only */}
        <div className="space-y-1">
          <div className="px-3 pb-1">
            <div className="h-px bg-zinc-200"></div> {/* Separator */}
          </div>
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
