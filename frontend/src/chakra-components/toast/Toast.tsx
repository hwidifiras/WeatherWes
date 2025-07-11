import { useToast } from './ToastProvider';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  variant: ToastVariant;
  title: string;
  description?: string;
}

export const useCustomToast = () => {
  const toast = useToast();

  return {
    toast: ({ variant, title, description }: ToastProps) => {
      switch (variant) {
        case 'success':
          return toast.success(title, description);
        case 'error':
          return toast.error(title, description);
        case 'warning':
          return toast.warning(title, description);
        case 'info':
          return toast.info(title, description);
        default:
          return toast.info(title, description);
      }
    },
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
  };
};

export default useCustomToast;
