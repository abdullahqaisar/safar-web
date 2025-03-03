interface AlertProps {
  message: string;
}

export function Alert({ message }: AlertProps) {
  return (
    <div className="mx-2 mt-6 p-4 bg-yellow-50 border-l-4 border-red-400 flex items-center">
      <i className="fas fa-info-circle text-red-400 mr-3 text-lg"></i>
      <span className="text-sm">{message}</span>
    </div>
  );
}
