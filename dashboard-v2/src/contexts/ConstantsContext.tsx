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

const ConstantsContext = createContext<Constants | null>(null);

export const ConstantsProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useDashboardInit();

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
 * This is a fail-fast approach to catch usage errors early.
 *
 * @throws Error if used outside ConstantsProvider
 * @returns Constants object from API
 */
export const useConstants = () => {
  const ctx = useContext(ConstantsContext);
  if (!ctx) {
    throw new Error('useConstants must be used within ConstantsProvider');
  }
  return ctx;
};
