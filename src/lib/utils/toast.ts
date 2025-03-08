import { toast } from 'sonner';

export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    className: 'error-toast',
  });
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    className: 'success-toast',
  });
};

export const showInfo = (message: string) => {
  toast.info(message, {
    duration: 4000,
    className: 'info-toast',
  });
};
