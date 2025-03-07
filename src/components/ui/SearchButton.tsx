interface SearchButtonProps {
  onClick: () => void;
  disabled: boolean | null | undefined;
  isLoading?: boolean;
  missingLocations?: boolean; // New prop to indicate missing locations
  type: 'submit' | 'reset' | 'button' | undefined;
}

export function SearchButton({
  onClick,
  disabled,
  isLoading = false,
  missingLocations = false,
  type,
}: SearchButtonProps) {
  return (
    <button
      className={`w-full mt-6 ${
        disabled || isLoading
          ? 'bg-gray-400 cursor-not-allowed opacity-70'
          : 'bg-[#00a745] hover:bg-[#0a8f42] active:bg-[#097a39]'
      } text-white p-4 rounded-lg transition duration-200 text-base`}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      type={type}
    >
      {isLoading ? (
        <>
          <i className="fas fa-spinner fa-spin mr-2"></i> Finding Stations
          Nearby...
        </>
      ) : missingLocations ? (
        <>
          <i className="fas fa-map-marker-alt mr-2"></i> Select Both Locations
        </>
      ) : (
        <>
          <i className="fas fa-search mr-2"></i> Find Routes
        </>
      )}
    </button>
  );
}
