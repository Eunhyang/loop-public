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

// Activity Panel State
export type SelectedActivityEntity = {
  type: EntityType;
  id: string;
} | null;

interface UiContextType {
    // LEGACY (keeping for compatibility during migration)
    activeModal: ActiveModalType;

    // Entity Drawer System
    activeEntityDrawer: ActiveEntityDrawer;
    isDrawerExpanded: boolean;
    canGoBack: boolean;  // Navigation history depth > 0
    canGoForward: boolean;  // Can navigate forward in history

    // Command Palette
    isCommandPaletteOpen: boolean;

    // Activity Panel
    activityPanelOpen: boolean;
    selectedActivityEntity: SelectedActivityEntity;

    // LEGACY Actions (keeping for compatibility)
    openCreateProject: () => void;
    openCreateProgram: () => void;
    closeAllModals: () => void;

    // Entity Drawer Actions
    openEntityDrawer: (drawer: NonNullable<ActiveEntityDrawer>) => void;
    pushDrawer: (drawer: NonNullable<ActiveEntityDrawer>) => void;
    popDrawer: () => void;
    goForward: () => void;
    closeEntityDrawer: () => void;
    toggleDrawerExpand: () => void;

    // Command Palette Actions
    openCommandPalette: () => void;
    closeCommandPalette: () => void;

    // Activity Panel Actions
    openActivityPanel: () => void;
    closeActivityPanel: () => void;
    setActivityEntity: (entity: SelectedActivityEntity) => void;
    openEntityFromActivity: (drawer: NonNullable<ActiveEntityDrawer>) => void;
}

const UiContext = createContext<UiContextType | undefined>(undefined);

export function UiProvider({ children }: { children: ReactNode }) {
    const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
    const [drawerHistory, setDrawerHistory] = useState<ActiveEntityDrawer[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [activityPanelOpen, setActivityPanelOpen] = useState(false);
    const [selectedActivityEntity, setSelectedActivityEntity] = useState<SelectedActivityEntity>(null);
    // Track navigation from Activity Panel for back navigation support
    // WARNING: This only tracks single return path - nested drawers may reopen panel unexpectedly
    const [returnToActivity, setReturnToActivity] = useState(false);

    // Derived state - activeEntityDrawer is the current item in history
    const activeEntityDrawer = useMemo(() => historyIndex >= 0 ? drawerHistory[historyIndex] : null, [drawerHistory, historyIndex]);
    const canGoBack = useMemo(() => historyIndex > 0, [historyIndex]);
    const canGoForward = useMemo(() => historyIndex < drawerHistory.length - 1, [historyIndex, drawerHistory.length]);

    // Modal Actions (LEGACY)
    const openCreateProject = useCallback(() => setActiveModal('createProject'), []);
    const openCreateProgram = useCallback(() => setActiveModal('createProgram'), []);
    const closeAllModals = useCallback(() => setActiveModal(null), []);

    // Entity Drawer Actions
    const openEntityDrawer = useCallback((drawer: NonNullable<ActiveEntityDrawer>) => {
        // Start a fresh history with this drawer (backward compatibility)
        setDrawerHistory([drawer]);
        setHistoryIndex(0);
        // Reset expansion state (avoid stale expand state on new drawer)
        setIsDrawerExpanded(false);
        // Close any legacy modals and command palette
        setActiveModal(null);
        setIsCommandPaletteOpen(false);
    }, []);

    const pushDrawer = useCallback((drawer: NonNullable<ActiveEntityDrawer>) => {
        // Add drawer to navigation history, trim forward entries (browser-style)
        setDrawerHistory(prev => [...prev.slice(0, historyIndex + 1), drawer]);
        setHistoryIndex(currentIndex => currentIndex + 1);  // Use functional update to avoid stale closure
        // Close any legacy modals and command palette
        setActiveModal(null);
        setIsCommandPaletteOpen(false);
    }, [historyIndex]);

    const popDrawer = useCallback(() => {
        // Go back to previous drawer (index--)
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
        }
    }, [historyIndex]);

    const goForward = useCallback(() => {
        // Go forward in history (index++)
        if (historyIndex < drawerHistory.length - 1) {
            setHistoryIndex(prev => prev + 1);
        }
    }, [historyIndex, drawerHistory.length]);

    const closeEntityDrawer = useCallback(() => {
        // Clear entire navigation history
        setDrawerHistory([]);
        setHistoryIndex(-1);
        setIsDrawerExpanded(false);  // Reset expand state when closing
        // If we came from Activity Panel, return to it
        if (returnToActivity) {
            setActivityPanelOpen(true);
            setReturnToActivity(false);
        }
    }, [returnToActivity]);

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

    // Activity Panel Actions
    const openActivityPanel = useCallback(() => {
        setActivityPanelOpen(true);
    }, []);

    const closeActivityPanel = useCallback(() => {
        setActivityPanelOpen(false);
        setSelectedActivityEntity(null);
    }, []);

    const setActivityEntity = useCallback((entity: SelectedActivityEntity) => {
        setSelectedActivityEntity(entity);
        if (entity) {
            setActivityPanelOpen(true);
        }
    }, []);

    /**
     * Opens EntityDrawer from Activity Panel with navigation tracking
     * Enables "back to Activity Panel" behavior when drawer is closed
     */
    const openEntityFromActivity = useCallback((drawer: NonNullable<ActiveEntityDrawer>) => {
        setReturnToActivity(true);      // Remember we came from Activity Panel
        setActivityPanelOpen(false);    // Close Activity Panel
        setDrawerHistory([drawer]);     // Open EntityDrawer
        setHistoryIndex(0);
        setIsDrawerExpanded(false);
        setActiveModal(null);
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
            canGoForward,
            openEntityDrawer,
            pushDrawer,
            popDrawer,
            goForward,
            closeEntityDrawer,
            toggleDrawerExpand,
            // Command Palette
            isCommandPaletteOpen,
            openCommandPalette,
            closeCommandPalette,
            // Activity Panel
            activityPanelOpen,
            selectedActivityEntity,
            openActivityPanel,
            closeActivityPanel,
            setActivityEntity,
            openEntityFromActivity
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
