import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { metroLines, MAJOR_INTERCHANGES } from '@/core/data/metro-data';
import { getStationNameById } from '@/features/map/utils/station-helpers';
import PageHeader from '@/components/common/PageHeader';

type Props = {
  params: Promise<{ stationId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generate metadata dynamically for each station
export async function generateMetadata(
  { params }: Props,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Read route params
  const { stationId } = await params;
  const stationName = getStationNameById(stationId);

  if (!stationName) {
    return {
      title: 'Station Not Found | Safar - Islamabad Transit Network',
      description: 'The requested station could not be found.',
    };
  }

  // Find which lines serve this station
  const servingLines = metroLines.filter((line) =>
    line.stations.includes(stationId)
  );

  const lineNames = servingLines.map((line) => line.name).join(', ');

  return {
    title: `${stationName} Station | Safar Islamabad Transit`,
    description: `${stationName} station information. Served by ${lineNames}. Find schedule, connections, facilities and nearby attractions.`,
    keywords: `${stationName}, ${lineNames}, Islamabad transit, metro station, interchange, public transportation`,
  };
}

// Generate static params for all stations
export async function generateStaticParams() {
  // Collect all unique station IDs
  const stationIds = new Set<string>();
  metroLines.forEach((line) => {
    line.stations.forEach((stationId) => {
      stationIds.add(stationId);
    });
  });

  return Array.from(stationIds).map((stationId) => ({
    stationId,
  }));
}

// The Page Component
export default async function StationDetailPage({ params }: Props) {
  const { stationId } = await params;
  const stationName = getStationNameById(stationId);

  // Handle station not found
  if (!stationName) {
    notFound();
  }

  // Find lines that serve this station
  const servingLines = metroLines.filter((line) =>
    line.stations.includes(stationId)
  );

  // Check if this is an interchange station
  const interchangeInfo = MAJOR_INTERCHANGES.find(
    (i) => i.stationId === stationId
  );
  const isInterchange = Boolean(interchangeInfo);

  // For each line, find the previous and next stations
  const stationLineInfo = servingLines.map((line) => {
    const stationIndex = line.stations.indexOf(stationId);
    const prevStation =
      stationIndex > 0
        ? {
            id: line.stations[stationIndex - 1],
            name: getStationNameById(line.stations[stationIndex - 1]),
          }
        : null;

    const nextStation =
      stationIndex < line.stations.length - 1
        ? {
            id: line.stations[stationIndex + 1],
            name: getStationNameById(line.stations[stationIndex + 1]),
          }
        : null;

    return {
      line,
      prevStation,
      nextStation,
      isTerminus:
        stationIndex === 0 || stationIndex === line.stations.length - 1,
      isFirstStation: stationIndex === 0,
      isLastStation: stationIndex === line.stations.length - 1,
    };
  });

  // Prepare structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TrainStation',
    name: stationName,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'Islamabad', // Consider making this more specific if possible
    },
    publicTransport: servingLines.map((line) => ({
      '@type': 'BusRoute', // Or TrainRoute if more appropriate
      name: line.name,
    })),
  };

  return (
    <>
      {/* Add JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen flex flex-col pt-16 md:pt-20">
        <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
          {/* Background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
          </div>

          <PageHeader
            title={`${stationName} Station`}
            description={`Station information and connections for ${stationName}`}
          />

          <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="max-w-5xl mx-auto">
              {/* Back Link */}
              <div className="mb-6">
                <Link
                  href="/stations"
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  ← Back to All Stations
                </Link>
              </div>

              {/* Station Header */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Station Icon and Name */}
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      {/* Placeholder icon - consider replacing with a real icon */}
                      <div className="w-8 h-8 bg-emerald-600 rounded-full" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        {stationName}
                      </h1>
                      <div className="flex items-center flex-wrap gap-x-2 mt-1">
                        {isInterchange && (
                          <span className="bg-emerald-100 text-emerald-800 text-xs sm:text-sm px-2 py-0.5 rounded-full">
                            Interchange Station
                          </span>
                        )}
                        <span className="text-gray-500 text-xs sm:text-sm">
                          {servingLines.length}{' '}
                          {servingLines.length === 1 ? 'line' : 'lines'} serving
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan Journey Button */}
                  <div className="md:ml-auto mt-4 md:mt-0 flex-shrink-0">
                    <Link
                      href="/route" // Consider pre-filling the origin with this station
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm inline-block"
                    >
                      Plan Journey From Here
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Serving Lines Section */}
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Lines Serving This Station
                  </h2>
                  <div className="space-y-4">
                    {stationLineInfo.map(
                      ({
                        line,
                        prevStation,
                        nextStation,
                        isFirstStation,
                        isLastStation,
                      }) => (
                        <div
                          key={line.id}
                          className="bg-white rounded-xl shadow-md overflow-hidden"
                        >
                          {/* Line Header */}
                          <div
                            className="p-4 text-white font-medium"
                            style={{
                              backgroundColor: line.id.startsWith('fr_') // Example custom styling
                                ? '#4FD1C5' // Light teal color for feeder routes
                                : line.color || '#4A5568', // Use line color or fallback
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <Link
                                href={`/transit-lines/${line.id}`}
                                className="hover:underline text-lg" // Increased text size for header
                              >
                                {line.name}
                              </Link>
                              {(isFirstStation || isLastStation) && (
                                <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                                  {isFirstStation ? 'Start' : 'End'} Terminal
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Line Connections */}
                          <div className="p-4">
                            <div className="flex items-stretch text-sm">
                              {' '}
                              {/* Changed items-center to items-stretch */}
                              {/* Previous station */}
                              <div className="flex-1 text-right pr-2 flex flex-col justify-center">
                                {' '}
                                {/* Added flex wrappers */}
                                {prevStation ? (
                                  <Link
                                    href={`/stations/${prevStation.id}`}
                                    className="text-gray-700 hover:text-emerald-600 transition-colors block"
                                  >
                                    {prevStation.name}
                                    <span className="text-xs block text-gray-400">
                                      Previous
                                    </span>
                                  </Link>
                                ) : (
                                  <span className="text-gray-400">
                                    Terminus
                                  </span>
                                )}
                              </div>
                              {/* Direction Indicator */}
                              <div className="flex flex-col items-center w-8">
                                {' '}
                                {/* Added fixed width */}
                                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1"></div>
                                <div className="flex-grow border-l border-dashed border-gray-300 my-1"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></div>{' '}
                                {/* Current station emphasized */}
                                <div className="flex-grow border-l border-dashed border-gray-300 my-1"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-300 mb-1"></div>
                              </div>
                              {/* Next station */}
                              <div className="flex-1 pl-2 flex flex-col justify-center">
                                {' '}
                                {/* Added flex wrappers */}
                                {nextStation ? (
                                  <Link
                                    href={`/stations/${nextStation.id}`}
                                    className="text-gray-700 hover:text-emerald-600 transition-colors block"
                                  >
                                    {nextStation.name}
                                    <span className="text-xs block text-gray-400">
                                      Next
                                    </span>
                                  </Link>
                                ) : (
                                  <span className="text-gray-400">
                                    Terminus
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Schedule Information */}
                            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">First Transit:</p>{' '}
                                {/* Changed wording */}
                                <p className="font-medium text-gray-800">
                                  {line.schedule?.first || 'Approx. 6:00 AM'}{' '}
                                  {/* Added Approx */}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Last Transit:</p>{' '}
                                {/* Changed wording */}
                                <p className="font-medium text-gray-800">
                                  {line.schedule?.last || 'Approx. 10:00 PM'}{' '}
                                  {/* Added Approx */}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
