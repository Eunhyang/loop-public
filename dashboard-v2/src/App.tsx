import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './routes';
import { ConstantsProvider } from './contexts/ConstantsContext';
import { useDashboardInit } from './queries/useDashboardInit';
import { authStorage } from './features/auth/storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * ConstantsProviderWithLoading
 *
 * Wrapper to handle loading state while dashboard-init is fetching.
 * Shows spinner until constants are loaded, then mounts ConstantsProvider.
 * Only fetches when authenticated - login page doesn't need constants.
 */
function ConstantsProviderWithLoading({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authStorage.isAuthenticated();
  const { data, isLoading } = useDashboardInit();

  // Skip constants loading for unauthenticated users (login page)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (isLoading || !data?.constants) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return <ConstantsProvider>{children}</ConstantsProvider>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConstantsProviderWithLoading>
        <Suspense fallback={<div>Loading...</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </ConstantsProviderWithLoading>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
