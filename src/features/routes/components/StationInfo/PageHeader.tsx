import Link from 'next/link';
import { ArrowLeft, Search, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-3 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Link>
        </Button>
        <div className="flex items-center">
          <Map className="w-5 h-5 mr-2 text-emerald-500 hidden sm:block" />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Transit Network Map
          </h1>
        </div>
      </div>

      <div className="mt-3 sm:mt-0">
        <Button
          size="sm"
          variant="outline"
          className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600 transition-colors"
          asChild
        >
          <Link href="/journey" className="flex items-center">
            <Search className="w-3.5 h-3.5 mr-1.5" />
            Plan a Journey
          </Link>
        </Button>
      </div>
    </div>
  );
}
