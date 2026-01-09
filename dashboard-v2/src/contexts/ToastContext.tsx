import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { ToastContainer } from '@/components/common/ToastContainer';

/**
 * Toast notification type
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

/**
 * Toast context type
 */
interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider
 * Manages toast notifications with auto-dismiss after 3 seconds
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after 3 seconds with timeout tracking
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timeoutsRef.current.delete(id);
    }, 3000);

    timeoutsRef.current.set(id, timeoutId);
  }, []);

  // Cleanup on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      timeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutsRef.current.clear();
      setToasts([]);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast notifications
 * @throws Error if used outside ToastProvider
 */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
};
