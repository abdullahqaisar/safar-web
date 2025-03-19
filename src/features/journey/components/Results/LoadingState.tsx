'use client';

import React from 'react';
import { Card } from '@/components/common/Card';
import { Progress } from '@/components/ui/progress';

interface LoadingStateProps {
  fromText?: string;
  toText?: string;
  loadingProgress?: number;
}

export function LoadingState({
  fromText = 'selected location',
  toText = 'destination',
  loadingProgress = 0,
}: LoadingStateProps) {
  return (
    <Card className="bg-white/95 shadow-md border border-gray-100 p-6 rounded-xl">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 rounded-full border-4 border-[color:var(--color-accent)]/20 border-t-[color:var(--color-accent)] animate-spin mb-6"></div>
        <p className="text-lg font-medium mb-2">
          Finding the best routes for you
        </p>
        <p className="text-gray-500 mb-6 text-sm">
          Analyzing transit options from {fromText} to {toText}
        </p>

        <div className="w-full max-w-md">
          <Progress value={loadingProgress} />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Checking routes</span>
            <span>{Math.round(loadingProgress)}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
