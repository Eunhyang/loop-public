import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/Login';
import { KanbanPage } from '@/pages/Kanban';
import { ProjectPage } from '@/pages/Project';
import { PendingPage } from '@/pages/Pending';
import { ProgramPage } from '@/pages/Program';
import { ProtectedRoute } from './ProtectedRoute';

// Lazy load heavy pages
const CalendarPage = lazy(() => import('@/features/calendar').then(m => ({ default: m.CalendarPage })));
const GraphPage = lazy(() => import('@/pages/Graph').then(m => ({ default: m.GraphPage })));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/kanban" replace /> },
          { path: 'kanban', element: <KanbanPage /> },
          { path: 'projects/:id', element: <ProjectPage /> },
          { path: 'pending', element: <PendingPage /> },
          { path: 'calendar', element: <CalendarPage /> },
          { path: 'graph', element: <GraphPage /> },
          { path: 'program', element: <ProgramPage /> },
        ],
      },
    ],
  },
], {
  basename: import.meta.env.PROD ? '/v2' : undefined,
});
