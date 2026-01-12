
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UiProvider } from '@/contexts/UiContext';
import { FilterProvider } from '@/features/filters/context/FilterContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { useState } from 'react';

import { EntityDrawer } from './EntityDrawer';
import { authStorage } from '@/features/auth/storage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { HelpModal } from '@/components/common/HelpModal';
import { CommandPalette } from '@/components/common/CommandPalette';
import { ActivityPanel } from '@/features/activity';
import { ConstantsProvider, useConstants } from '@/contexts/ConstantsContext';
import { useDashboardInit } from '@/queries/useDashboardInit';

const AppLayoutContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Wait for constants to be ready
  const { isLoading, data } = useDashboardInit();
  const constants = useConstants();

  // Calculate Admin Role from stored role
  const isAdmin = authStorage.getRole() === 'admin';

  // Global keyboard shortcuts
  useKeyboardShortcuts({ helpModalOpen, setHelpModalOpen });

  if (isLoading || !data?.constants || !constants) {
    return (
      <div className="flex items-center justify-center h-screen bg-main">
        <div className="text-lg text-zinc-500 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          Initializing Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-main text-text-main">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          isAdmin={isAdmin}
        />
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 p-6">
          <Outlet />
        </main>
      </div>

      {/* Global Entity Drawer */}
      <EntityDrawer />

      {/* Global Command Palette */}
      <CommandPalette />

      {/* Global Activity Panel */}
      <ActivityPanel />

      {/* Global Help Modal */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  );
};

export const AppLayout = () => {
  return (
    <UiProvider>
      <ConstantsProvider>
        <FilterProvider>
          <ToastProvider>
            <AppLayoutContent />
          </ToastProvider>
        </FilterProvider>
      </ConstantsProvider>
    </UiProvider>
  );
};
