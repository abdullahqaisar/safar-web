import { MetroLine } from '@/types/metro';

export function getBorderColorForLine(lineId: MetroLine['id']): string {
  const colors: Record<string, string> = {
    red: 'border-red-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    orange: 'border-orange-500',
  };
  return colors[lineId] || 'border-gray-500';
}

export function getBgColorForLine(lineId: MetroLine['id']): string {
  const colors: Record<string, string> = {
    red: 'bg-red-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
  };
  return colors[lineId] || 'bg-gray-50';
}
