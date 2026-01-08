import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { KanbanPanelFilters } from '@/features/tasks/selectors';

interface FilterContextType extends KanbanPanelFilters {
    isPanelOpen: boolean;
    setFilter: (key: keyof KanbanPanelFilters, value: any) => void;
    toggleFilterArray: (key: keyof KanbanPanelFilters, value: string) => void;
    togglePanel: () => void;
    resetFilters: () => void;
}

const DEFAULT_FILTERS: KanbanPanelFilters = {
    showInactive: true,
    showDoneProjects: false,
    taskStatus: [],
    taskPriority: [],
    taskTypes: [],
    projectStatus: [],
    projectPriority: [],
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
    const [filters, setFilters] = useState<KanbanPanelFilters>(DEFAULT_FILTERS);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const setFilter = useCallback((key: keyof KanbanPanelFilters, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const toggleFilterArray = useCallback((key: keyof KanbanPanelFilters, value: string) => {
        setFilters(prev => {
            const currentArray = prev[key] as string[];
            const isIncluded = currentArray.includes(value);
            const newArray = isIncluded
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [key]: newArray };
        });
    }, []);

    const togglePanel = useCallback(() => setIsPanelOpen(prev => !prev), []);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    // Only re-creates when filters or isPanelOpen actually change
    const value = useMemo<FilterContextType>(() => ({
        ...filters,
        isPanelOpen,
        setFilter,
        toggleFilterArray,
        togglePanel,
        resetFilters
    }), [filters, isPanelOpen, setFilter, toggleFilterArray, togglePanel, resetFilters]);

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};

export const useFilterContext = () => {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilterContext must be used within a FilterProvider');
    }
    return context;
};
