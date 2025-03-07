import { MetroLine, MetroLineColor } from '@/types/metro';
import { Station } from '@/types/station';

const stationData: Record<string, Station> = {
  secretariat: {
    id: 'secretariat',
    name: 'Secretariat',
    coordinates: { lat: 33.736213104501985, lng: 73.09159035101419 },
  },
  paradeGround: {
    id: 'paradeGround',
    name: 'Parade Ground',
    coordinates: { lat: 33.72500523070584, lng: 73.08471819822587 },
  },
  shaheedEMillat: {
    id: 'shaheedEMillat',
    name: 'Shaheed-E-Millat',
    coordinates: { lat: 33.72174068068394, lng: 73.07877749292581 },
  },
  seventhAvenue: {
    id: 'seventhAvenue',
    name: '7th Avenue',
    coordinates: { lat: 33.718077437572234, lng: 73.07177960456261 },
  },
  stockExchange: {
    id: 'stockExchange',
    name: 'Stock Exchange',
    coordinates: { lat: 33.71176846947479, lng: 73.06033196357797 },
  },
  pims: {
    id: 'pims',
    name: 'PIMS',
    coordinates: { lat: 33.705834978100135, lng: 73.04839610641643 },
  },
  kachehry: {
    id: 'kachehry',
    name: 'Kachehry',
    coordinates: { lat: 33.702506917209504, lng: 73.04205536965178 },
  },
  ibnESina: {
    id: 'ibnESina',
    name: 'Ibn-e-Sina',
    coordinates: { lat: 33.696377646408166, lng: 73.03860710034219 },
  },
  chaman: {
    id: 'chaman',
    name: 'Chaman',
    coordinates: { lat: 33.69018093106195, lng: 73.04354130034186 },
  },
  kashmirHighway: {
    id: 'kashmirHighway',
    name: 'Kashmir Highway',
    coordinates: { lat: 33.6861871107659, lng: 73.048283867797 },
  },
  faizAhmadFaiz: {
    id: 'faizAhmadFaiz',
    name: 'Faiz Ahmad Faiz',
    coordinates: { lat: 33.676229226018755, lng: 73.05499703947167 },
  },
  khayabanEJohar: {
    id: 'khayabanEJohar',
    name: 'Khayaban-e-Johar',
    coordinates: { lat: 33.669400089439776, lng: 73.059124979335 },
  },
  potohar: {
    id: 'potohar',
    name: 'Potohar',
    coordinates: { lat: 33.66052867450109, lng: 73.06457403868524 },
  },
  ijPrincipal: {
    id: 'ijPrincipal',
    name: 'IJ Principal',
    coordinates: { lat: 33.651, lng: 73.074 },
  },
  faizabad: {
    id: 'faizabad',
    name: 'Faizabad',
    coordinates: { lat: 33.66128301347426, lng: 73.08280889714392 },
  },
  shamsabad: {
    id: 'shamsabad',
    name: 'Shamsabad',
    coordinates: { lat: 33.65013878009155, lng: 73.07990132597995 },
  },
  sixthRoad: {
    id: 'sixthRoad',
    name: '6th Road',
    coordinates: { lat: 33.6433588097611, lng: 73.0777363548161 },
  },
  rehmanabad: {
    id: 'rehmanabad',
    name: 'Rehmanabad',
    coordinates: { lat: 33.636256275776354, lng: 73.07492419714325 },
  },
  chandaniChowk: {
    id: 'chandaniChowk',
    name: 'Chandani Chowk',
    coordinates: { lat: 33.630129735354465, lng: 73.0719579326242 },
  },
  warisKhan: {
    id: 'warisKhan',
    name: 'Waris Khan',
    coordinates: { lat: 33.62056260504173, lng: 73.06609199714276 },
  },
  committeeChowk: {
    id: 'committeeChowk',
    name: 'Committee Chowk',
    coordinates: { lat: 33.613116268587156, lng: 73.06521072597887 },
  },
  liaquatBagh: {
    id: 'liaquatBagh',
    name: 'Liaquat Bagh',
    coordinates: { lat: 33.60622912247219, lng: 73.06569902597865 },
  },
  marrirChowk: {
    id: 'marrirChowk',
    name: 'Marrir Chowk',
    coordinates: { lat: 33.5995017433237, lng: 73.06257952994271 },
  },
  saddar: {
    id: 'saddar',
    name: 'Saddar',
    coordinates: { lat: 33.593644284775294, lng: 73.05605302755386 },
  },
  g10: {
    id: 'g10',
    name: 'G-10',
    coordinates: { lat: 33.66702433588719, lng: 73.0154890342314 },
  },
  nha: {
    id: 'nha',
    name: 'NHA/G-9',
    coordinates: { lat: 33.684, lng: 73.0335 },
  },
  policeFoundation: {
    id: 'policeFoundation',
    name: 'Police Foundation',
    coordinates: { lat: 33.6612, lng: 73.0027 },
  },
  nust: {
    id: 'nust',
    name: 'NUST',
    coordinates: { lat: 33.6498, lng: 72.9873 },
  },
  g13: {
    id: 'g13',
    name: 'G-13',
    coordinates: { lat: 33.6327, lng: 72.9642 },
  },
  golraMorr: {
    id: 'golraMorr',
    name: 'Golra Morr',
    coordinates: { lat: 33.651, lng: 73.065 },
  },
  n5: {
    id: 'n5',
    name: 'N-5',
    coordinates: { lat: 33.627, lng: 72.9565 },
  },
  airport: {
    id: 'airport',
    name: 'Airport',
    coordinates: { lat: 33.55595323251649, lng: 72.83735356830452 },
  },
  g7g8: {
    id: 'g7g8',
    name: 'G7/G8',
    coordinates: { lat: 33.69765640152494, lng: 73.06192245759635 },
  },
  cda: {
    id: 'cda',
    name: 'CDA',
    coordinates: { lat: 33.70026269568505, lng: 73.07816222598147 },
  },
  aabpara: {
    id: 'aabpara',
    name: 'Aabpara',
    coordinates: { lat: 33.70587017153255, lng: 73.088788480754 },
  },
  foreignOffice: {
    id: 'foreignOffice',
    name: 'Foreign Office',
    coordinates: { lat: 33.71253396928778, lng: 73.10147021235335 },
  },
  lakeviewPark: {
    id: 'lakeviewPark',
    name: 'Lakeview Park',
    coordinates: { lat: 33.7230059572911, lng: 73.13539361588158 },
  },
  malpur: {
    id: 'malpur',
    name: 'Malpur',
    coordinates: { lat: 33.729778587260185, lng: 73.14452185146958 },
  },
  shahdara: {
    id: 'shahdara',
    name: 'Shahdara',
    coordinates: { lat: 33.73476959678367, lng: 73.15926194293299 },
  },
  bharakau: {
    id: 'bharakau',
    name: 'Bharakau',
    coordinates: { lat: 33.73545330312739, lng: 73.16534652238195 },
  },
  h8Shakarparia: {
    id: 'h8Shakarparia',
    name: 'H-8 / Shakarparia',
    coordinates: { lat: 33.683907271374636, lng: 73.055678 },
  },
  i8ParadeGround: {
    id: 'i8ParadeGround',
    name: 'I-8/Parade Ground',
    coordinates: { lat: 33.67327094873524, lng: 73.08056387534658 },
  },
  sohan: {
    id: 'sohan',
    name: 'Sohan',
    coordinates: { lat: 33.65010625365016, lng: 73.09838026200707 },
  },
  iqbalTown: {
    id: 'iqbalTown',
    name: 'Iqbal Town',
    coordinates: { lat: 33.645789656066505, lng: 73.10088498639699 },
  },
  kuriRoad: {
    id: 'kuriRoad',
    name: 'Kuri Road',
    coordinates: { lat: 33.64217419506025, lng: 73.10352144794746 },
  },
  ziaMasjid: {
    id: 'ziaMasjid',
    name: 'Zia Masjid',
    coordinates: { lat: 33.63666729372628, lng: 73.10764972498504 },
  },
  khannaPul: {
    id: 'khannaPul',
    name: 'Khanna Pul',
    coordinates: { lat: 33.62585038147842, lng: 73.11554358446452 },
  },
  fazaia: {
    id: 'fazaia',
    name: 'Fazaia',
    coordinates: { lat: 33.62094759803972, lng: 73.11937715608676 },
  },
  gangal: {
    id: 'gangal',
    name: 'Gangal',
    coordinates: { lat: 33.61244250465781, lng: 73.12606611655178 },
  },
  koralChowk: {
    id: 'koralChowk',
    name: 'Koral Chowk',
    coordinates: { lat: 33.603225129723704, lng: 73.13299865331676 },
  },
};

export const metroLines: MetroLine[] = [
  {
    id: 'red',
    name: 'Red Line (Secretariat to Saddar)',
    stations: [
      stationData.secretariat,
      stationData.paradeGround,
      stationData.shaheedEMillat,
      stationData.seventhAvenue,
      stationData.stockExchange,
      stationData.pims,
      stationData.kachehry,
      stationData.ibnESina,
      stationData.chaman,
      stationData.kashmirHighway,
      stationData.faizAhmadFaiz,
      stationData.khayabanEJohar,
      stationData.potohar,
      stationData.ijPrincipal,
      stationData.faizabad,
      stationData.shamsabad,
      stationData.sixthRoad,
      stationData.rehmanabad,
      stationData.chandaniChowk,
      stationData.warisKhan,
      stationData.committeeChowk,
      stationData.liaquatBagh,
      stationData.marrirChowk,
      stationData.saddar,
    ],
  },
  {
    id: 'orange',
    name: 'Orange Line (FAF to Airport)',
    stations: [
      stationData.faizAhmadFaiz,
      stationData.g10,
      stationData.nha,
      stationData.policeFoundation,
      stationData.nust,
      stationData.g13,
      stationData.golraMorr,
      stationData.n5,
      stationData.airport,
    ],
  },
  {
    id: 'green',
    name: 'Green Line (PIMS to Bharakau)',
    stations: [
      stationData.pims,
      stationData.g7g8,
      stationData.cda,
      stationData.aabpara,
      stationData.foreignOffice,
      stationData.lakeviewPark,
      stationData.malpur,
      stationData.shahdara,
      stationData.bharakau,
    ],
  },
  {
    id: 'blue',
    name: 'Blue Line (PIMS to Koral Chowk)',
    stations: [
      stationData.pims,
      stationData.g7g8,
      stationData.h8Shakarparia,
      stationData.i8ParadeGround,
      stationData.faizabad,
      stationData.sohan,
      stationData.iqbalTown,
      stationData.kuriRoad,
      stationData.ziaMasjid,
      stationData.khannaPul,
      stationData.fazaia,
      stationData.gangal,
      stationData.koralChowk,
    ],
  },
];

// Well-known interchange stations
export const interchanges: Record<string, MetroLineColor[]> = {
  PIMS: ['red', 'green', 'blue'],
  'G7/G8': ['green', 'blue'],
  'Parade Ground': ['red', 'blue'],
  'Kashmir Highway': ['red', 'orange'],
  'Faiz Ahmad Faiz': ['orange', 'red'],
  Faizabad: ['red', 'blue'],
};
