import { toast } from 'sonner';

export interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  description?: string;
  id?: string;
  position?:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
}

export const showError = (
  message: string,
  options: ToastOptions = { duration: 5000 }
) => {
  return toast.error(message, options);
};

export const showSuccess = (
  message: string,
  options: ToastOptions = { duration: 4000 }
) => {
  return toast.success(message, options);
};

export const showInfo = (
  message: string,
  options: ToastOptions = { duration: 4000 }
) => {
  return toast.info(message, options);
};

export const showWarning = (
  message: string,
  options: ToastOptions = { duration: 5000 }
) => {
  return toast.warning(message, options);
};

export const dismissToast = (id: string) => {
  toast.dismiss(id);
};

export const showErrorWithAction = (
  message: string,
  actionLabel: string,
  onAction: () => void,
  options: Omit<ToastOptions, 'action'> = {}
) => {
  return showError(message, {
    ...options,
    action: {
      label: actionLabel,
      onClick: onAction,
    },
  });
};
