import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

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
    isDrawerExpanded: boolean;
    canGoBack: boolean;  // Navigation stack depth > 1

    // Command Palette
    isCommandPaletteOpen: boolean;

    // LEGACY Actions (keeping for compatibility)
    openCreateProject: () => void;
    openCreateProgram: () => void;
    closeAllModals: () => void;

    // Entity Drawer Actions
    openEntityDrawer: (drawer: NonNullable<ActiveEntityDrawer>) => void;
    pushDrawer: (drawer: NonNullable<ActiveEntityDrawer>) => void;
    popDrawer: () => void;
    closeEntityDrawer: () => void;
    toggleDrawerExpand: () => void;

    // Command Palette Actions
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
    const [drawerStack, setDrawerStack] = useState<ActiveEntityDrawer[]>([]);
    const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Derived state - activeEntityDrawer is the top of the stack
    const activeEntityDrawer = useMemo(() => drawerStack.at(-1) ?? null, [drawerStack]);
    const canGoBack = useMemo(() => drawerStack.length > 1, [drawerStack]);

    // Modal Actions (LEGACY)
    const openCreateProject = useCallback(() => setActiveModal('createProject'), []);
    const openCreateProgram = useCallback(() => setActiveModal('createProgram'), []);
    const closeAllModals = useCallback(() => setActiveModal(null), []);

    // Entity Drawer Actions
    const openEntityDrawer = useCallback((drawer: NonNullable<ActiveEntityDrawer>) => {
        // Start a fresh stack with this drawer (backward compatibility)
        setDrawerStack([drawer]);
        // Reset expansion state (avoid stale expand state on new drawer)
        setIsDrawerExpanded(false);
        // Close any legacy modals and command palette
        setActiveModal(null);
        setIsCommandPaletteOpen(false);
    }, []);

    const pushDrawer = useCallback((drawer: NonNullable<ActiveEntityDrawer>) => {
        // Add drawer to navigation stack
        setDrawerStack(prev => [...prev, drawer]);
        // Close any legacy modals and command palette
        setActiveModal(null);
        setIsCommandPaletteOpen(false);
    }, []);

    const popDrawer = useCallback(() => {
        // Go back to previous drawer (no-op if only one drawer)
        setDrawerStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
    }, []);

    const closeEntityDrawer = useCallback(() => {
        // Clear entire navigation stack
        setDrawerStack([]);
        setIsDrawerExpanded(false);  // Reset expand state when closing
    }, []);

    const toggleDrawerExpand = useCallback(() => {
        // Only toggle if drawer is open
        if (activeEntityDrawer) {
            setIsDrawerExpanded(prev => !prev);
        }
    }, [activeEntityDrawer]);

    // Command Palette Actions
    const openCommandPalette = useCallback(() => {
        setIsCommandPaletteOpen(true);
        // Close other overlays
        setActiveModal(null);
    }, []);

    const closeCommandPalette = useCallback(() => {
        setIsCommandPaletteOpen(false);
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
            isDrawerExpanded,
            canGoBack,
            openEntityDrawer,
            pushDrawer,
            popDrawer,
            closeEntityDrawer,
            toggleDrawerExpand,
            // Command Palette
            isCommandPaletteOpen,
            openCommandPalette,
            closeCommandPalette
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
