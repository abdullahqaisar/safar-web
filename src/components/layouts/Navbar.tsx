import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-[#0d442b] p-4 top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-2xl font-bold">
          <Link href="/" className="flex items-center">
            <span
              className="italic text-[#feffff] font-bold text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Safar
            </span>
          </Link>
        </div>
        <div className="space-x-4">
          <Link href="/route-request" className="text-white hover:underline">
            Request Route
          </Link>
        </div>
      </div>
    </nav>
  );
}
