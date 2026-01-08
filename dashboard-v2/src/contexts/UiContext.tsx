import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Task } from '@/types';

interface TaskDrawerState {
    isOpen: boolean;
    taskId: string | null;
    mode: 'create' | 'edit';
    prefill?: Partial<Task>;
}

// Active Modal State Pattern
type ActiveModalType = null | 'createProject' | 'createProgram';

interface UiContextType {
    taskDrawer: TaskDrawerState;
    activeModal: ActiveModalType;
    // Actions
    openEditTask: (taskId: string) => void;
    openCreateTask: (prefill?: Partial<Task>) => void;
    closeTaskDrawer: () => void;

    openCreateProject: () => void;
    openCreateProgram: () => void;
    closeAllModals: () => void;
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

    // URL Sync: On Mount, check ?task=ID
    useEffect(() => {
        const taskIdParam = searchParams.get('task');
        if (taskIdParam) {
            setTaskDrawer({
                isOpen: true,
                taskId: taskIdParam,
                mode: 'edit',
            });
        }
    }, []); // Run once on mount

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

    // Modal Actions
    const openCreateProject = useCallback(() => setActiveModal('createProject'), []);
    const openCreateProgram = useCallback(() => setActiveModal('createProgram'), []);
    const closeAllModals = useCallback(() => setActiveModal(null), []);

    return (
        <UiContext.Provider value={{
            taskDrawer,
            activeModal,
            openEditTask,
            openCreateTask,
            closeTaskDrawer,
            openCreateProject,
            openCreateProgram,
            closeAllModals
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
