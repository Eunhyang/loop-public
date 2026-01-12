/**
 * ConstantsContext
 *
 * Provides Constants from API SSOT globally via React Context
 * Constants are loaded from /api/dashboard-init and include:
 * - task: status, types, colors, labels
 * - priority: values, colors, labels
 * - project: status, colors, labels
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { Constants } from '@/types/constants';
import { useDashboardInit } from '@/queries/useDashboardInit';

const ConstantsContext = createContext<Constants | null | undefined>(undefined);

export const ConstantsProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useDashboardInit();

  // Handle cases where data might be momentarily undefined during mount/refetch
  // providing null as a valid "inside provider but no data yet" state
  return (
    <ConstantsContext.Provider value={data?.constants ?? null}>
      {children}
    </ConstantsContext.Provider>
  );
};

/**
 * useConstants Hook
 *
 * Access constants from context. Throws error if used outside ConstantsProvider.
 *
 * @throws Error if used outside ConstantsProvider
 * @returns Constants object from API
 */
export const useConstants = () => {
  const ctx = useContext(ConstantsContext);

  // ctx === undefined means the Provider is missing from the tree
  if (ctx === undefined) {
    throw new Error('useConstants must be used within ConstantsProvider');
  }

  // If we are inside the provider but data isn't ready, return a safe proxy or null
  // Here we return null and let the component handle the loading state if needed.
  // But since App.tsx handles loading, this usually won't be reached as null.
  return ctx as Constants;
};
