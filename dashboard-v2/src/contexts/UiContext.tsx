import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Task } from '@/types';

interface TaskDrawerState {
    isOpen: boolean;
    taskId: string | null;
    mode: 'create' | 'edit';
    prefill?: Partial<Task>;
}

interface UiContextType {
    taskDrawer: TaskDrawerState;
    openEditTask: (taskId: string) => void;
    openCreateTask: (prefill?: Partial<Task>) => void;
    closeTaskDrawer: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
    const [searchParams, setSearchParams] = useSearchParams();

    const [taskDrawer, setTaskDrawer] = useState<TaskDrawerState>({
        isOpen: false,
        taskId: null,
        mode: 'edit',
    });

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
        // Create mode does not sync URL usually, or maybe ?action=create? 
        // For now, keeping URL clean for create mode or respecting user plan
        // Plan said: "On closeTaskDrawer, remove the task parameter".
    }, []);

    const closeTaskDrawer = useCallback(() => {
        setTaskDrawer(prev => ({ ...prev, isOpen: false, prefill: undefined }));
        // Remove URL param
        setSearchParams(prev => {
            prev.delete('task');
            return prev;
        });
    }, [setSearchParams]);

    return (
        <UiContext.Provider value={{ taskDrawer, openEditTask, openCreateTask, closeTaskDrawer }}>
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
