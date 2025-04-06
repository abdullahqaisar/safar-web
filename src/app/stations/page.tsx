import { Metadata } from 'next';
import Link from 'next/link';
import { metroLines, MAJOR_INTERCHANGES } from '@/core/data/metro-data';
import { getStationNameById } from '@/features/map/utils/station-helpers';
import PageHeader from '@/components/common/PageHeader';

export const metadata: Metadata = {
  title: 'Metro Stations | Safar - Islamabad Transit Routes',
  description:
    'Browse all stations in Islamabad&apos;s transit Routes. Find information on station locations, connecting lines, facilities, and nearby attractions.',
  keywords:
    'Islamabad transit stations, metro stations, bus stations, Islamabad stations, Lahore stations, train stations, public transportation',
};

export default function StationsPage() {
  // Get all unique station IDs across all lines
  const allStationIds = new Set<string>();
  metroLines.forEach((line) => {
    line.stations.forEach((stationId) => {
      allStationIds.add(stationId);
    });
  });

  // Get all station info with lines that serve them
  const stationsWithLines = Array.from(allStationIds)
    .map((stationId) => {
      const name = getStationNameById(stationId);
      const servingLines = metroLines.filter((line) =>
        line.stations.includes(stationId)
      );
      const isInterchange = MAJOR_INTERCHANGES.some(
        (i) => i.stationId === stationId
      );

      return {
        id: stationId,
        name,
        servingLines,
        isInterchange,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Group stations by first letter for easier navigation
  const stationsByLetter: Record<string, typeof stationsWithLines> = {};
  stationsWithLines.forEach((station) => {
    const firstLetter = station.name.charAt(0).toUpperCase();
    if (!stationsByLetter[firstLetter]) {
      stationsByLetter[firstLetter] = [];
    }
    stationsByLetter[firstLetter].push(station);
  });

  // Get sorted letters for alphabet navigation
  const sortedLetters = Object.keys(stationsByLetter).sort();

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <PageHeader
          title="Transit Stations"
          description="Explore all stations in Islamabad's comprehensive transit Routes"
        />

        <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-8">
              <p className="text-gray-700">
                Browse all {stationsWithLines.length} stations in
                Islamabad&apos;s transit Routes, including{' '}
                {MAJOR_INTERCHANGES.length} major interchange stations where
                multiple lines connect.
              </p>
            </div>

            {/* Alphabet quick navigation */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-8 overflow-x-auto">
              <div className="flex space-x-2 min-w-max">
                {sortedLetters.map((letter) => (
                  <a
                    key={letter}
                    href={`#section-${letter}`}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-emerald-50 text-emerald-700 font-medium"
                  >
                    {letter}
                  </a>
                ))}
              </div>
            </div>

            {/* Station listings by letter */}
            <div className="space-y-10">
              {sortedLetters.map((letter) => (
                <section
                  key={letter}
                  id={`section-${letter}`}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 mr-3">
                      {letter}
                    </span>
                    <span>{stationsByLetter[letter].length} Stations</span>
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stationsByLetter[letter].map((station) => (
                      <Link href={`/stations/${station.id}`} key={station.id}>
                        <div className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border border-gray-100">
                          <h3 className="font-semibold text-lg mb-2 flex items-center">
                            {station.name}
                            {station.isInterchange && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                                Interchange
                              </span>
                            )}
                          </h3>

                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1.5">
                              Served by:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {station.servingLines.map((line) => (
                                <div
                                  key={line.id}
                                  className="px-2 py-0.5 text-xs rounded-full text-white"
                                  style={{
                                    backgroundColor: line.id.startsWith('fr_')
                                      ? '#00D1D1'
                                      : line.color || '#718096',
                                  }}
                                >
                                  {line.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
