import { Metadata } from 'next';
import Link from 'next/link';
import { metroLines } from '@/core/data/metro-data';
import PageHeader from '@/components/common/PageHeader';

export const metadata: Metadata = {
  title: 'Transit Lines | Safar - Islamabad Transit Network',
  description:
    "Explore all metro and feeder routes in Islamabad's modern transit network. Find information about Red Line, Green Line, Orange Line, Blue Line and more.",
  keywords:
    'Islamabad transit lines, metro lines, bus routes, public transportation, Islamabad metro, Lahore metro, orange line, red line, green line, blue line',
  alternates: {
    canonical: 'https://www.safar.fyi/transit-lines',
  },
  openGraph: {
    title: 'Transit Lines | Safar - Islamabad Transit Network',
    description:
      "Explore all metro and feeder routes in Islamabad's modern transit network",
    url: 'https://www.safar.fyi/transit-lines',
    siteName: 'Safar',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Transit Lines | Safar - Islamabad Transit Network',
    description:
      "Explore all metro and feeder routes in Islamabad's modern transit network",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function TransitLinesPage() {
  // Separate main metro lines from feeder routes
  const mainLines = metroLines.filter((line) => !line.id.startsWith('fr_'));
  const feederRoutes = metroLines.filter((line) => line.id.startsWith('fr_'));

  return (
    <div className="min-h-screen flex flex-col pt-16 md:pt-20">
      <div className="relative flex-grow bg-gradient-to-b from-[color:var(--color-accent)]/5 to-[#FEF6EC] pb-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>
        </div>

        <PageHeader
          title="Transit Lines"
          description="Explore Islamabad's modern transit network routes and connections"
        />

        <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-8">
              <p className="text-gray-700">
                Islamabad&apos;s transit network consists of {metroLines.length}{' '}
                lines spanning major urban centers, including {mainLines.length}{' '}
                main metro lines and {feederRoutes.length} feeder routes that
                connect neighborhoods to major transit corridors.
              </p>
            </div>

            {/* Main Metro Lines Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                  <span className="w-5 h-5 bg-emerald-600 rounded-full" />
                </span>
                Metro Lines
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mainLines.map((line) => (
                  <Link href={`/transit-lines/${line.id}`} key={line.id}>
                    <div
                      className="bg-white rounded-lg shadow-md p-5 border-l-4 hover:shadow-lg transition-shadow"
                      style={{ borderLeftColor: line.color || '#4A5568' }}
                    >
                      <h3 className="font-semibold text-xl mb-2">
                        {line.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {line.stations.length} stations • {line.frequency}
                      </p>
                      <div className="flex text-sm">
                        <div className="flex-1">
                          <p className="text-gray-500">From</p>
                          <p className="font-medium">{line.stations[0]}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-500">To</p>
                          <p className="font-medium">
                            {line.stations[line.stations.length - 1]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Feeder Routes Section */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mr-3">
                  <span className="w-5 h-5 bg-teal-500 rounded-full" />
                </span>
                Feeder Routes
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {feederRoutes.map((line) => (
                  <Link href={`/transit-lines/${line.id}`} key={line.id}>
                    <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-teal-400 hover:shadow-lg transition-shadow">
                      <h3 className="font-semibold text-xl mb-2">
                        {line.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {line.stations.length} stations • {line.frequency}
                      </p>
                      <div className="flex text-sm">
                        <div className="flex-1">
                          <p className="text-gray-500">From</p>
                          <p className="font-medium">{line.stations[0]}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-500">To</p>
                          <p className="font-medium">
                            {line.stations[line.stations.length - 1]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
