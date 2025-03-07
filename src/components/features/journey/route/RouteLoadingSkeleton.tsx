export function RouteLoadingSkeleton() {
  return (
    <div className="bg-white rounded-b-2xl p-4 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* First route card skeleton */}
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-5 w-24 bg-gray-200 rounded"></div>
            <div className="h-5 w-5 bg-gray-200 rounded-full mx-2"></div>
            <div className="h-5 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
        </div>

        <div className="p-4">
          {/* Route segments */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex mb-8">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="ml-4 flex-grow space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}

          {/* Fare summary skeleton */}
          <div className="mt-6 bg-gray-50 p-3 rounded-lg flex items-center">
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Second route card skeleton (shorter) */}
      <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            <div className="h-5 w-24 bg-gray-200 rounded"></div>
            <div className="h-5 w-5 bg-gray-200 rounded-full mx-2"></div>
            <div className="h-5 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded"></div>
        </div>

        <div className="p-4">
          {/* Two route segments */}
          {[1, 2].map((i) => (
            <div key={i} className="flex mb-8">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0"></div>
              <div className="ml-4 flex-grow space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}

          {/* Fare summary skeleton */}
          <div className="mt-6 bg-gray-50 p-3 rounded-lg">
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
