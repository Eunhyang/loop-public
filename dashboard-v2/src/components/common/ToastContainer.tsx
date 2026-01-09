import type { Toast } from '@/contexts/ToastContext';

interface ToastContainerProps {
  toasts: Toast[];
}

/**
 * Toast Container
 * Renders toast notifications in bottom-right corner
 */
export function ToastContainer({ toasts }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg shadow-lg text-white transition-all ${
            t.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
