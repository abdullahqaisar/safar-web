export type MetroLineColor = 'red' | 'orange' | 'green' | 'blue';

export interface MetroLine {
  name: string;
  color: MetroLineColor;
  stations: string[];
}

export interface MetroNetwork {
  [key: string]: MetroLine;
}

export const metroLines: MetroNetwork = {
  red: {
    name: 'Red Line (Secretariat to Saddar)',
    color: 'red',
    stations: [
      'Secretariat',
      'Parade Ground',
      'Shaheed-E-Millat',
      '7th Avenue',
      'Stock Exchange',
      'PIMS',
      'Karchery',
      'Ibn-e-Sina',
      'Chaman',
      'Kashmir Highway',
      'Faiz Ahmad Faiz',
      'Khayaban-e-Johar',
      'Potohar',
      'IJ Principal',
      'Faizabad',
      'Shamsabad',
      '6th Road',
      'Rehmanabad',
      'Chandani Chowk',
      'Waris Khan',
      'Committee Chowk',
      'Liaquat Bagh',
      'Marrir Chowk',
      'Saddar',
    ],
  },
  orange: {
    name: 'Orange Line (FAF to Airport)',
    color: 'orange',
    stations: [
      'Faiz Ahmad Faiz',
      'G-10',
      'G-9',
      'NIHA',
      'Police Foundation',
      'NUST',
      'G-13',
      'Golra Morr',
      'N-5',
      'Airport',
    ],
  },
  green: {
    name: 'Green Line (PIMS to Bharakau)',
    color: 'green',
    stations: [
      'PIMS',
      'G7/G8',
      'CDA',
      'Aabpara',
      'Foreign Office',
      'Lakeview Park',
      'Malpur',
      'Bharakau',
    ],
  },
  blue: {
    name: 'Blue Line (PIMS to Koral Chowk)',
    color: 'blue',
    stations: [
      'PIMS',
      'G7/G8',
      'H-8 / Shakarparia',
      'I-8/Parade Ground',
      'Faizabad',
      'Sohan',
      'Iqbal Town',
      'Kuri Road',
      'Zia Masjid',
      'Khanna Pul',
      'Fazaia',
      'Gandal',
      'Koral Chowk',
    ],
  },
};

// Well-known interchange stations
export const interchanges: Record<string, MetroLineColor[]> = {
  PIMS: ['red', 'green', 'blue'],
  'PIMS Hospital': ['green', 'blue', 'red'],
  'G7/G8': ['green', 'blue'],
  'Parade Ground': ['red', 'blue'],
  'Kashmir Highway': ['red', 'orange'],
  'Faiz Ahmad Faiz': ['orange', 'red'],
  Faizabad: ['red', 'blue'],
};

// Get unique stations from all lines
export const getAllStations = (): string[] => {
  const uniqueStations = new Set<string>();

  Object.values(metroLines).forEach((line) => {
    line.stations.forEach((station) => uniqueStations.add(station));
  });

  return Array.from(uniqueStations).sort();
};

export const stationCoordinates: Record<string, { lat: number; lng: number }> =
  {
    Station1: { lat: 33.6844, lng: 73.0479 },
    Station2: { lat: 33.6924, lng: 73.0479 },
    // Add coordinates for all your stations
  };

// stationCoordinates:
//   {
//     Station1: { lat: 33.6844, lng: 73.0479 },
//     Station2: { lat: 33.6924, lng: 73.0479 },
//     // Add coordinates for all  stations
