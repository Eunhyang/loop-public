import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Task } from '@/types';

interface TaskDrawerState {
    isOpen: boolean;
    taskId: string | null;
    mode: 'create' | 'edit';
    prefill?: Partial<Task>;
}

// Active Modal State Pattern (LEGACY - to be deprecated)
type ActiveModalType = null | 'createProject' | 'createProgram';

// NEW: Entity Drawer System
export type EntityType = 'task' | 'project' | 'program' | 'track' | 'hypothesis' | 'condition';

export type ActiveEntityDrawer =
  | null
  | { type: EntityType; mode: 'create'; prefill?: Record<string, any> }
  | { type: EntityType; mode: 'edit'; id: string }
  | { type: EntityType; mode: 'view'; id: string };  // For Track, Condition (read-only)

interface UiContextType {
    // LEGACY (keeping for compatibility during migration)
    taskDrawer: TaskDrawerState;
    activeModal: ActiveModalType;

    // NEW: Entity Drawer System
    activeEntityDrawer: ActiveEntityDrawer;

    // LEGACY Actions (keeping for compatibility)
    openEditTask: (taskId: string) => void;
    openCreateTask: (prefill?: Partial<Task>) => void;
    closeTaskDrawer: () => void;
    openCreateProject: () => void;
    openCreateProgram: () => void;
    closeAllModals: () => void;

    // NEW Actions
    openEntityDrawer: (drawer: NonNullable<ActiveEntityDrawer>) => void;
    closeEntityDrawer: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
    const [searchParams, setSearchParams] = useSearchParams();

    const [taskDrawer, setTaskDrawer] = useState<TaskDrawerState>({
        isOpen: false,
        taskId: null,
        mode: 'edit',
    });

    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);

    // NEW: Entity Drawer State
    const [activeEntityDrawer, setActiveEntityDrawer] = useState<ActiveEntityDrawer>(null);

    // URL Sync: Watch for ?task=ID changes (deep link support)
    useEffect(() => {
        const taskIdParam = searchParams.get('task');
        if (taskIdParam) {
            setTaskDrawer({
                isOpen: true,
                taskId: taskIdParam,
                mode: 'edit',
            });
        } else if (!taskIdParam && taskDrawer.isOpen) {
            // If URL param removed but drawer still open, close it
            setTaskDrawer(prev => ({ ...prev, isOpen: false }));
        }
    }, [searchParams]); // Re-run when URL params change

    const openEditTask = useCallback((taskId: string) => {
        setTaskDrawer({
            isOpen: true,
            taskId,
            mode: 'edit',
        });
        // Sync URL
        setSearchParams(prev => {
            prev.set('task', taskId);
            return prev;
        });
    }, [setSearchParams]);

    const openCreateTask = useCallback((prefill?: Partial<Task>) => {
        setTaskDrawer({
            isOpen: true,
            taskId: null,
            mode: 'create',
            prefill
        });
    }, []);

    const closeTaskDrawer = useCallback(() => {
        setTaskDrawer(prev => ({ ...prev, isOpen: false, prefill: undefined }));
        // Remove URL param
        setSearchParams(prev => {
            prev.delete('task');
            return prev;
        });
    }, [setSearchParams]);

    // Modal Actions (LEGACY)
    const openCreateProject = useCallback(() => setActiveModal('createProject'), []);
    const openCreateProgram = useCallback(() => setActiveModal('createProgram'), []);
    const closeAllModals = useCallback(() => setActiveModal(null), []);

    // NEW: Entity Drawer Actions
    const openEntityDrawer = useCallback((drawer: NonNullable<ActiveEntityDrawer>) => {
        setActiveEntityDrawer(drawer);
        // Close any legacy drawers/modals
        setTaskDrawer(prev => ({ ...prev, isOpen: false }));
        setActiveModal(null);
        // Clear legacy URL params to prevent stale state on refresh
        setSearchParams(prev => {
            prev.delete('task');
            return prev;
        });
    }, [setSearchParams]);

    const closeEntityDrawer = useCallback(() => {
        setActiveEntityDrawer(null);
    }, []);

    return (
        <UiContext.Provider value={{
            // LEGACY
            taskDrawer,
            activeModal,
            openEditTask,
            openCreateTask,
            closeTaskDrawer,
            openCreateProject,
            openCreateProgram,
            closeAllModals,
            // NEW
            activeEntityDrawer,
            openEntityDrawer,
            closeEntityDrawer
        }}>
            {children}
        </UiContext.Provider>
    );
}

export function useUi() {
    const context = useContext(UiContext);
    if (context === undefined) {
        throw new Error('useUi must be used within a UiProvider');
    }
    return context;
}
