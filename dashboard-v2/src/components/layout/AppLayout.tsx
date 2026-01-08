
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UiProvider } from '@/contexts/UiContext';
import { FilterProvider } from '@/features/filters/context/FilterContext';
import { useState } from 'react';

import { EntityDrawer } from './EntityDrawer';
import { authStorage } from '@/features/auth/storage';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { HelpModal } from '@/components/common/HelpModal';

const AppLayoutContent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Calculate Admin Role from stored role
  const isAdmin = authStorage.getRole() === 'admin';

  // Global keyboard shortcuts
  useKeyboardShortcuts({ helpModalOpen, setHelpModalOpen });

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

      {/* Global Help Modal */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
    </div>
  );
};

export const AppLayout = () => {
  return (
    <UiProvider>
      <FilterProvider>
        <AppLayoutContent />
      </FilterProvider>
    </UiProvider>
  );
};
