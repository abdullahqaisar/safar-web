import { Station } from './station';

export interface MetroLine {
  id: string;
  name: string;
  color?: MetroLineColor;
  stations: Station[];
}

export type MetroLineColor = 'red' | 'orange' | 'green' | 'blue';
