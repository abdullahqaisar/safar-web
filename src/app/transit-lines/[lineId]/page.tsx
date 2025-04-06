import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { metroLines, MAJOR_INTERCHANGES } from '@/core/data/metro-data';
import { getStationNameById } from '@/features/map/utils/station-helpers';
import PageHeader from '@/components/common/PageHeader';

// Generate metadata dynamically based on line data
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lineId: string }>;
}): Promise<Metadata> {
  const { lineId } = await params;
  const line = metroLines.find((line) => line.id === lineId);

  if (!line) {
    return {
      title: 'Line Not Found | Safar - Pakistan Transit Network',
      description: 'The requested transit line could not be found.',
    };
  }

  const startStation = getStationNameById(line.stations[0]);
  const endStation = getStationNameById(
    line.stations[line.stations.length - 1]
  );

  return {
    title: `${line.name} | Transit Lines | Safar Pakistan`,
    description: `Explore the ${line.name} route from ${startStation} to ${endStation}. View all stations, schedule, ticket prices, and connection information.`,
    keywords: `${line.name}, Pakistan transit, metro line, public transportation, ${startStation}, ${endStation}, transit schedule`,
  };
}

// Generate static params for all lines (built at build time)
export async function generateStaticParams() {
  return metroLines.map((line) => ({
    lineId: line.id,
  }));
}

export default async function LineDetailPage({
  params,
}: {
  params: Promise<{ lineId: string }>;
}) {
  // Find the line data
  const { lineId } = await params;
  const line = metroLines.find((line) => line.id === lineId);

  // Handle line not found
  if (!line) {
    notFound();
  }

  // Determine if this is a feeder route
  const isFeeder = line.id.startsWith('fr_');

  // Get station names
  const stationNames = line.stations.map((stationId) => ({
    id: stationId,
    name: getStationNameById(stationId),
  }));

  // Find interchanges on this line
  const interchanges = MAJOR_INTERCHANGES.filter((interchange) =>
    interchange.lines.includes(line.id)
  );

  // Find connecting lines
  const connectingLines = new Set<string>();
  interchanges.forEach((interchange) => {
    interchange.lines.forEach((lineId) => {
      if (lineId !== line.id) {
        connectingLines.add(lineId);
      }
    });
  });

  // Get connecting line names
  const connectingLineNames = Array.from(connectingLines).map((lineId) => {
    const lineData = metroLines.find((l) => l.id === lineId);
    return lineData ? lineData.name : lineId;
  });

  // Prepare JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BusRoute',
    name: line.name,
    provider: {
      '@type': 'Organization',
      name: 'Pakistan Transit Authority',
    },
    itinerary: {
      '@type': 'ItemList',
      itemListElement: stationNames.map((station, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'BusStop',
          name: station.name,
        },
      })),
    },
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
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
          </div>

          <PageHeader
            title={line.name}
            description={`Route from ${stationNames[0].name} to ${
              stationNames[stationNames.length - 1].name
            }`}
          />

          <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="max-w-5xl mx-auto">
              {/* Back Link */}
              <div className="mb-6">
                <Link
                  href="/transit-lines"
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                >
                  ← Back to All Transit Lines
                </Link>
              </div>

              {/* Line Header */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isFeeder ? 'bg-teal-100' : 'bg-opacity-20'
                    }`}
                    style={{
                      backgroundColor: isFeeder ? undefined : `${line.color}20`,
                    }}
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${
                        isFeeder ? 'border-2 border-teal-400' : ''
                      }`}
                      style={{
                        backgroundColor: isFeeder ? '#00D1D1' : line.color,
                      }}
                    />
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {line.name}
                    </h1>
                    <p className="text-gray-600 mt-1">
                      {stationNames[0].name} →{' '}
                      {stationNames[stationNames.length - 1].name}
                    </p>
                  </div>
                </div>

                {/* Line Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-gray-500 text-sm">Stations</p>
                    <p className="font-semibold">{line.stations.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Frequency</p>
                    <p className="font-semibold">{line.frequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">First Train</p>
                    <p className="font-semibold">
                      {line.schedule?.first || '6:00 AM'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Last Train</p>
                    <p className="font-semibold">
                      {line.schedule?.last || '10:00 PM'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Stations List */}
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    All Stations
                  </h2>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="relative">
                      {stationNames.map((station, index) => {
                        const isInterchange = interchanges.some(
                          (i) => i.stationId === station.id
                        );
                        const isFirst = index === 0;
                        const isLast = index === stationNames.length - 1;

                        return (
                          <div key={station.id} className="flex relative">
                            {/* Line visualizer */}
                            {!isLast && (
                              <div
                                className="absolute top-6 left-[15px] w-[2px] h-full"
                                style={{
                                  backgroundColor: isFeeder
                                    ? '#00D1D1'
                                    : line.color,
                                }}
                              />
                            )}

                            {/* Station marker */}
                            <div className="flex justify-center w-8 mt-1.5 z-10">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                  isInterchange ? 'bg-white' : ''
                                }`}
                                style={{
                                  borderColor: isFeeder
                                    ? '#00D1D1'
                                    : line.color,
                                  backgroundColor: isInterchange
                                    ? 'white'
                                    : isFeeder
                                    ? '#00D1D1'
                                    : line.color,
                                }}
                              >
                                {isInterchange && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: isFeeder
                                        ? '#00D1D1'
                                        : line.color,
                                    }}
                                  />
                                )}
                              </div>
                            </div>

                            {/* Station info */}
                            <div className="py-2 pl-3 flex-1">
                              <Link
                                href={`/stations/${station.id}`}
                                className="font-medium text-gray-800 hover:text-emerald-700"
                              >
                                {station.name}
                              </Link>

                              {/* Terminal badges */}
                              {(isFirst || isLast) && (
                                <span
                                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                                    isFirst
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {isFirst ? 'Start' : 'End'}
                                </span>
                              )}

                              {/* Interchange indicator */}
                              {isInterchange && (
                                <div className="mt-1 text-sm text-gray-500">
                                  Interchange Station
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Connections and Info Sidebar */}
                <div>
                  {/* Connections */}
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Connections
                  </h2>
                  <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    {connectingLineNames.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-gray-600 text-sm">
                          Connect with these lines:
                        </p>
                        <div className="space-y-2">
                          {connectingLineNames.map((lineName, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-gray-800"
                            >
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              {lineName}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No direct connections to other lines.
                      </p>
                    )}
                  </div>

                  {/* Fares */}
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Ticket Information
                  </h2>
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                        <span className="text-gray-600">Single Trip:</span>
                        <span className="font-semibold">
                          Rs. {line.ticketCost || 50}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 mt-4">
                        <p>
                          Tickets can be purchased at station ticket counters or
                          through our mobile app.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plan a Journey */}
                  <div className="mt-6">
                    <Link
                      href="/route"
                      className="block w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-center"
                    >
                      Plan a Journey on This Line
                    </Link>
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
