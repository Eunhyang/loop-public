/**
 * Visibility Toggles Component
 *
 * Provides 4 toggles for controlling visibility of:
 * - Inactive members
 * - Non-core members (default: off = core only)
 * - Inactive projects
 * - Inactive tasks
 */

import { useCombinedFilters } from '@/hooks/useCombinedFilters';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle = ({ label, checked, onChange }: ToggleProps) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="hidden"
      />
      <div
        className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${checked ? 'bg-primary' : 'bg-zinc-200'
          }`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'
            }`}
        />
      </div>
      <span className="text-sm text-zinc-600 group-hover:text-zinc-900 transition-colors">
        {label}
      </span>
    </label>
  );
};

export const VisibilityToggles = () => {
  console.log('[VisibilityToggles] RENDER');
  const filters = useCombinedFilters();
  console.log('[VisibilityToggles] showInactiveMembers:', filters.showInactiveMembers);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        Visibility
      </h3>

      <Toggle
        label="Show Inactive Members"
        checked={filters.showInactiveMembers}
        onChange={(checked) => {
          console.log('[VisibilityToggles] Toggle clicked, setting showInactiveMembers to:', checked);
          filters.setFilter('showInactiveMembers', checked);
        }}
      />

      <Toggle
        label="Show Non-Core Members"
        checked={filters.showNonCoreMembers}
        onChange={(checked) => filters.setFilter('showNonCoreMembers', checked)}
      />

      <Toggle
        label="Show Inactive Projects"
        checked={filters.showInactiveProjects}
        onChange={(checked) => filters.setFilter('showInactiveProjects', checked)}
      />

      <Toggle
        label="Show Inactive Tasks"
        checked={filters.showInactiveTasks}
        onChange={(checked) => filters.setFilter('showInactiveTasks', checked)}
      />
    </div>
  );
};
