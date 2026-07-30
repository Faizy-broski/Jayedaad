import { createContext, useCallback, useContext } from 'react';
import RNToast from 'react-native-toast-message';

type ToastType = 'success' | 'error';

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    RNToast.show({ type, text1: message });
  }, []);

  return <ToastContext.Provider value={{ showToast }}>{children}</ToastContext.Provider>;
}

export { RNToast as Toast };
