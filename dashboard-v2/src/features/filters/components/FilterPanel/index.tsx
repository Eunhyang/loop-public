import { useEffect } from 'react';
import { useFilterContext } from '../../context/FilterContext';
import { VisibilityToggles } from './VisibilityToggles';
import { ProjectFilters } from './ProjectFilters';
import { TaskFilters } from './TaskFilters';

interface FilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FilterPanel = ({ isOpen, onClose }: FilterPanelProps) => {
    const { resetFilters } = useFilterContext();
    // Prevent scrolling when panel is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <aside
                className={`fixed top-0 right-0 h-full w-80 bg-[#1e1e1e] border-l border-white/10 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold text-white">Filters</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <section>
                        <VisibilityToggles />
                    </section>

                    <section>
                        <div className="h-px bg-white/5 mb-6" />
                        <h3 className="text-sm font-bold text-gray-300 mb-4">Project Filters</h3>
                        <ProjectFilters />
                    </section>

                    <section>
                        <div className="h-px bg-white/5 mb-6" />
                        <h3 className="text-sm font-bold text-gray-300 mb-4">Task Filters</h3>
                        <TaskFilters />
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-[#1e1e1e]">
                    <button
                        onClick={resetFilters}
                        className="w-full py-2 px-4 rounded-md bg-zinc-800 text-gray-300 hover:bg-zinc-700 hover:text-white transition-colors text-sm font-medium"
                    >
                        Reset All
                    </button>
                </div>
            </aside>
        </>
    );
};
