import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-3 text-primary hover:bg-primary/10 hover:text-primary-dark transition-colors"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Transit Network Map
        </h1>
      </div>

      <div className="mt-3 sm:mt-0">
        <Button
          size="sm"
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 transition-colors"
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
