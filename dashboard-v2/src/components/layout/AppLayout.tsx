
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UiProvider, useUi } from '@/contexts/UiContext';
import { TaskDrawer } from '@/features/tasks/components/TaskDrawer';
import { useState } from 'react';

import { CreationDrawer } from './CreationDrawer';
import { useDashboardInit } from '@/queries/useDashboardInit';

const AppLayoutContent = () => {
  const { taskDrawer, closeTaskDrawer } = useUi();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { data: dashboardData } = useDashboardInit();

  // Calculate Admin Role
  const currentUser = dashboardData?.user;
  const currentMember = dashboardData?.members.find(m => m.id === currentUser?.id);
  const isAdmin = currentMember?.role === 'admin';

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

      {/* Global Task Drawer */}
      <TaskDrawer
        taskId={taskDrawer.taskId}
        isOpen={taskDrawer.isOpen}
        onClose={closeTaskDrawer}
      />

      {/* Global Creation Drawer */}
      <CreationDrawer members={dashboardData?.members || []} tracks={dashboardData?.tracks || []} constants={dashboardData?.constants || {}} />
    </div>
  );
};

export const AppLayout = () => {
  return (
    <UiProvider>
      <AppLayoutContent />
    </UiProvider>
  );
};
