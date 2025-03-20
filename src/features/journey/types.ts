import { LucideIcon } from 'lucide-react';

export interface SegmentDetails {
  icon: LucideIcon;
  iconBgColor: string;
  title: string;
  description: string;
  badges?: Array<{ text: string; color: string }>;
  transferStation?: string;
  lineColorClass?: string;
}
