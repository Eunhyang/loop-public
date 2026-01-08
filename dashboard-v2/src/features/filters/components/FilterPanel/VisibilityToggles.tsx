import { useFilterContext } from '../../context/FilterContext';

export const VisibilityToggles = () => {
    const { showInactive, showDoneProjects, setFilter } = useFilterContext();

    return (
        <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Visibility</h3>

            <label className="flex items-center gap-2 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setFilter('showInactive', e.target.checked)}
                    className="hidden"
                />
                <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${showInactive ? 'bg-primary' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${showInactive ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">Show Inactive Items</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={showDoneProjects}
                    onChange={(e) => setFilter('showDoneProjects', e.target.checked)}
                    className="hidden"
                />
                <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${showDoneProjects ? 'bg-primary' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${showDoneProjects ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">Show Done Projects</span>
            </label>
        </div>
    );
};
