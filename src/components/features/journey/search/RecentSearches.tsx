export function RecentSearches() {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <div className="bg-gray-200 px-4 py-2 rounded-full text-sm flex items-center cursor-pointer hover:bg-gray-300 transition-colors">
        <i className="fas fa-history mr-2"></i> Blue Area
      </div>
      <div className="bg-gray-200 px-4 py-2 rounded-full text-sm flex items-center cursor-pointer hover:bg-gray-300 transition-colors">
        <i className="fas fa-history mr-2"></i> F-9 Park
      </div>
    </div>
  );
}
