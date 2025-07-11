import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Box, Portal } from '@chakra-ui/react';
import { SimpleToast } from './SimpleToast';
import type { ToastVariant } from './SimpleToast';

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextType {
  showToast: (variant: ToastVariant, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((variant: ToastVariant, title: string, description?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, variant, title, description }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Portal>
        <Box
          position="fixed"
          top={4}
          right={4}
          zIndex={9999}
          display="flex"
          flexDirection="column"
          gap={2}
        >
          {toasts.map(toast => (
            <SimpleToast
              key={toast.id}
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </Box>
      </Portal>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return {
    success: (title: string, description?: string) => 
      context.showToast('success', title, description),
    error: (title: string, description?: string) => 
      context.showToast('error', title, description),
    warning: (title: string, description?: string) => 
      context.showToast('warning', title, description),
    info: (title: string, description?: string) => 
      context.showToast('info', title, description),
  };
};

export default ToastProvider;
