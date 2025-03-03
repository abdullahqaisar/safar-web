interface SearchButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function SearchButton({ onClick, disabled }: SearchButtonProps) {
  return (
    <button
      className={`w-full mt-6 ${
        disabled ? 'bg-gray-400' : 'bg-[#0da84e] hover:bg-[#0a8f42]'
      } text-white p-4 rounded-lg transition duration-200 text-base`}
      onClick={onClick}
      disabled={disabled}
    >
      <i className="fas fa-search mr-2"></i> Find Routes
    </button>
  );
}
