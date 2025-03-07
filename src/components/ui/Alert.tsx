interface AlertProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export function Alert({ message, type = 'warning' }: AlertProps) {
  const alertStyles = {
    info: {
      bg: 'bg-[#eef6ff]',
      border: 'border-[var(--color-info)]',
      icon: 'fas fa-info-circle text-[var(--color-info)]',
    },
    warning: {
      bg: 'bg-[#fffbeb]',
      border: 'border-[var(--color-warning)]',
      icon: 'fas fa-exclamation-triangle text-[var(--color-warning)]',
    },
    error: {
      bg: 'bg-[#fef2f2]',
      border: 'border-[var(--color-error)]',
      icon: 'fas fa-exclamation-circle text-[var(--color-error)]',
    },
    success: {
      bg: 'bg-[#f0fdf4]',
      border: 'border-[var(--color-success)]',
      icon: 'fas fa-check-circle text-[var(--color-success)]',
    },
  };

  const style = alertStyles[type];

  return (
    <div
      className={`mx-2 mt-6 p-4 ${style.bg} border-l-4 ${style.border} rounded-r-md shadow-sm flex items-center`}
    >
      <i className={`${style.icon} mr-3 text-lg`}></i>
      <span className="text-sm font-medium text-[var(--color-gray-700)]">
        {message}
      </span>
    </div>
  );
}
