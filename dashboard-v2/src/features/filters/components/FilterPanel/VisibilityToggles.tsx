/**
 * Visibility Toggles Component
 *
 * Provides 3 toggles for controlling visibility of:
 * - Inactive members
 * - Non-core members (default: off = core only)
 * - Inactive projects
 */

import { useCombinedFilters } from '@/hooks/useCombinedFilters';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Toggle = ({ label, checked, onChange }: ToggleProps) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-1">
      {/* Switch Container */}
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        {/* Track - Use distinct zinc-800 when ON, and light-grey with border when OFF */}
        <div
          className={`w-8 h-4.5 rounded-full transition-all duration-200 border ${checked
              ? 'bg-zinc-800 border-zinc-800'
              : 'bg-zinc-100 border-zinc-200 hover:border-zinc-300'
            }`}
        >
          {/* Knob */}
          <div
            className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'
              }`}
          />
        </div>
      </div>

      {/* Label */}
      <span className="text-[13px] font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors select-none">
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
    </div>
  );
};
