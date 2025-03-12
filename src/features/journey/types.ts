export interface SegmentDetails {
  icon: string;
  iconBgColor: string;
  title: string;
  description: string;
  badges?: Array<{ text: string; color: string }>;
  transferStation?: string;
  lineColorClass?: string;
}
