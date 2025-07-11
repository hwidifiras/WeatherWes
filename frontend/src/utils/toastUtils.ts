import { useToast } from '../chakra-components/toast/ToastProvider';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  type: ToastType;
  title: string;
  description?: string;
}

export const useCustomToast = () => {
  const toast = useToast();

  const showToast = ({ type, title, description }: ToastConfig) => {
    switch (type) {
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
  };

  return {
    showToast,
    showError: (title: string, description?: string) =>
      toast.error(title, description),
    showSuccess: (title: string, description?: string) =>
      toast.success(title, description),
    showWarning: (title: string, description?: string) =>
      toast.warning(title, description),
    showInfo: (title: string, description?: string) =>
      toast.info(title, description),
  };
};
