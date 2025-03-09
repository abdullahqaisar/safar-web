import { MetroLine } from '@/types/metro';

export function getBusColor(lineId: MetroLine['id']): string {
  const colors: Record<string, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };
  return colors[lineId];
}
