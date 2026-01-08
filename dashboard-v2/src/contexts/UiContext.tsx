import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// Active Modal State Pattern (LEGACY - to be deprecated)
type ActiveModalType = null | 'createProject' | 'createProgram';

// Entity Drawer System
export type EntityType = 'task' | 'project' | 'program' | 'track' | 'hypothesis' | 'condition';

export type ActiveEntityDrawer =
  | null
  | { type: EntityType; mode: 'create'; prefill?: Record<string, any> }
  | { type: EntityType; mode: 'edit'; id: string }
  | { type: EntityType; mode: 'view'; id: string };  // For Track, Condition (read-only)

interface UiContextType {
    // LEGACY (keeping for compatibility during migration)
    activeModal: ActiveModalType;

    // Entity Drawer System
    activeEntityDrawer: ActiveEntityDrawer;

    // LEGACY Actions (keeping for compatibility)
    openCreateProject: () => void;
    openCreateProgram: () => void;
    closeAllModals: () => void;

    // Entity Drawer Actions
    openEntityDrawer: (drawer: NonNullable<ActiveEntityDrawer>) => void;
    closeEntityDrawer: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
    const [activeEntityDrawer, setActiveEntityDrawer] = useState<ActiveEntityDrawer>(null);

    // Modal Actions (LEGACY)
    const openCreateProject = useCallback(() => setActiveModal('createProject'), []);
    const openCreateProgram = useCallback(() => setActiveModal('createProgram'), []);
    const closeAllModals = useCallback(() => setActiveModal(null), []);

    // Entity Drawer Actions
    const openEntityDrawer = useCallback((drawer: NonNullable<ActiveEntityDrawer>) => {
        setActiveEntityDrawer(drawer);
        // Close any legacy modals
        setActiveModal(null);
    }, []);

    const closeEntityDrawer = useCallback(() => {
        setActiveEntityDrawer(null);
    }, []);

    return (
        <UiContext.Provider value={{
            // LEGACY
            activeModal,
            openCreateProject,
            openCreateProgram,
            closeAllModals,
            // Entity Drawer
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
