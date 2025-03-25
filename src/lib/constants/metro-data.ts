import { MetroLine } from '@/types/metro';
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
  pims_children_hospital: {
    id: 'pims_children_hospital',
    name: 'PIMS Children Hospital',
    coordinates: { lat: 33.705411763048566, lng: 73.05550725496231 },
  },
  pims_gate: {
    id: 'pims_gate',
    name: 'PIMS Gate',
    coordinates: { lat: 33.70535821100434, lng: 73.05071146519091 },
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
  faizabadInterchange: {
    id: 'faizabadInterchange',
    name: 'Faizabad Interchange',
    coordinates: { lat: 33.66759746642817, lng: 73.08500395546888 },
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
    name: 'Jillani, Bharakau',
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
    coordinates: { lat: 33.659589883030115, lng: 73.09080522598016 },
  },
  iqbalTown: {
    id: 'iqbalTown',
    name: 'Iqbal Town',
    coordinates: { lat: 33.645789656066505, lng: 73.10088498639699 },
  },
  kuriRoad: {
    id: 'kuriRoad',
    name: 'Kuri Road',
    coordinates: { lat: 33.64271726797072, lng: 73.10380327946089 },
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

  gulberg: {
    id: 'gulberg',
    name: 'Gulberg',
    coordinates: { lat: 33.59847373401423, lng: 73.1380386979626 },
  },

  /* --------- FEEDER */

  // FR-1 Routes
  mciModelSchool: {
    id: 'mciModelSchool',
    name: 'MCI Model School',
    coordinates: { lat: 33.659159131533464, lng: 73.0613440382677 },
  },

  cdaComplaintCenter: {
    id: 'cdaComplaintCenter',
    name: 'CDA Complaint Center',
    coordinates: { lat: 33.65719367414252, lng: 73.05651945767264 },
  },

  ogtiStop: {
    id: 'ogtiStop',
    name: 'OGTI Stop',
    coordinates: { lat: 33.65537653473376, lng: 73.05289127116367 },
  },

  suiGasStop: {
    id: 'suiGasStop',
    name: 'SUI Gas Stop',
    coordinates: { lat: 33.65319183655144, lng: 73.04885163558183 },
  },

  ptclI10: {
    id: 'ptclI10',
    name: 'PTCL I-10',
    coordinates: { lat: 33.649109603226506, lng: 73.04118072883632 },
  },

  iescoI10Markaz: {
    id: 'iescoI10Markaz',
    name: 'IESCO I10 Markaz',
    coordinates: { lat: 33.64765353433309, lng: 73.03828745767262 },
  },

  korangRoad: {
    id: 'korangRoad',
    name: 'Korang Road',
    coordinates: { lat: 33.64439167082158, lng: 73.0320577288363 },
  },

  shamaPark: {
    id: 'shamaPark',
    name: 'Shama Park',
    coordinates: { lat: 33.6438315341348, lng: 73.03014427116368 },
  },

  metroCashAndCarry: {
    id: 'metroCashAndCarry',
    name: 'Metro Cash and Carry',
    coordinates: { lat: 33.6403817376959, lng: 73.023893 },
  },

  //////////////////
  faisalMasjid: {
    id: 'faisalMasjid',
    name: 'Faisal Masjid',
    coordinates: { lat: 33.72789739074284, lng: 73.03953950264346 },
  },
  bariImam: {
    id: 'bariImam',
    name: 'Bari Imam',
    coordinates: { lat: 33.743598, lng: 73.109557 },
  },
  qau: {
    id: 'qau',
    name: 'Quaid-e-Azam University',
    coordinates: { lat: 33.74495253938709, lng: 73.13977227116368 },
  },
  childrenHospital: {
    id: 'childrenHospital',
    name: 'Children Hospital',
    coordinates: { lat: 33.70542066611799, lng: 73.05551797589479 },
  },
  noriHospital: {
    id: 'noriHospital',
    name: 'NORI Hospital',
    coordinates: { lat: 33.6984546848535, lng: 73.05351399999998 },
  },
  g8Markaz: {
    id: 'g8Markaz',
    name: 'G-8 Markaz',
    coordinates: { lat: 33.695552031383485, lng: 73.04837362883632 },
  },
  g9_4_Park: {
    id: 'g9_4_Park',
    name: 'G-9/4 Park',
    coordinates: { lat: 33.6892736769966, lng: 73.03743818532656 },
  },
  karachiCompany: {
    id: 'karachiCompany',
    name: 'Karachi Company',
    coordinates: { lat: 33.68841721671436, lng: 73.03480906064185 },
  },
  g9Markaz: {
    id: 'g9Markaz',
    name: 'G-9 Markaz',
    coordinates: { lat: 33.68893052357229, lng: 73.03241653017926 },
  },
  g11Markaz: {
    id: 'g11Markaz',
    name: 'G-11 Markaz',
    coordinates: { lat: 33.66972464191491, lng: 72.9977157979607 },
  },
  pirWadhaiMorh: {
    id: 'pirWadhaiMorh',
    name: 'Pir Wadhai Morh',
    coordinates: { lat: 33.63535673587158, lng: 73.03267 },
  },
  tramriChowk: {
    id: 'tramriChowk',
    name: 'Tramri Chowk',
    coordinates: { lat: 33.64544253421837, lng: 73.16325299999998 },
  },
  taxila: {
    id: 'taxila',
    name: 'Taxila',
    coordinates: { lat: 33.737264694938766, lng: 72.799241 },
  },
  bharakauBazar: {
    id: 'bharakauBazar',
    name: 'Bharakau Bazar',
    coordinates: { lat: 33.73861277340662, lng: 73.18556799999999 },
  },
  satraMeel: {
    id: 'satraMeel',
    name: 'Satra Meel',
    coordinates: { lat: 33.763580782498074, lng: 73.21937945767263 },
  },
  tChowk: {
    id: 'tChowk',
    name: 'T Chowk',
    coordinates: { lat: 33.5105576906409, lng: 73.1798597288363 },
  },

  // FR-3A Additional Stations
  f8Katchery: {
    id: 'f8Katchery',
    name: 'F-8 Katchery',
    coordinates: { lat: 33.70888773751228, lng: 73.0394084 },
  },
  f8Markaz: {
    id: 'f8Markaz',
    name: 'F-8 Markaz',
    coordinates: { lat: 33.71249368850052, lng: 73.03656427116368 },
  },
  raviGateF9: {
    id: 'raviGateF9',
    name: 'Ravi Gate F-9 Park',
    coordinates: { lat: 33.70975068778784, lng: 73.02865172883631 },
  },
  shaheenChowk: {
    id: 'shaheenChowk',
    name: 'Shaheen Chowk',
    coordinates: { lat: 33.71362676431455, lng: 73.0275167288363 },
  },
  bahriaUniversity: {
    id: 'bahriaUniversity',
    name: 'Bahria University',
    coordinates: { lat: 33.71530476492637, lng: 73.0309827288286 },
  },
  navalComplex: {
    id: 'navalComplex',
    name: 'Naval Complex',
    coordinates: { lat: 33.71909769021656, lng: 73.03798800000001 },
  },

  // FR-4 Additional Stations
  rescue15: {
    id: 'rescue15',
    name: 'Rescue 15',
    coordinates: { lat: 33.69960768515297, lng: 73.0599117288363 },
  },
  bankColony: {
    id: 'bankColony',
    name: 'Bank Colony',
    coordinates: { lat: 33.70029468533143, lng: 73.0619552711637 },
  },
  salaiCentre: {
    id: 'salaiCentre',
    name: 'Salai Centre',
    coordinates: { lat: 33.70262971156207, lng: 73.06683499999998 },
  },
  sitaraMarket: {
    id: 'sitaraMarket',
    name: 'Sitara Market',
    coordinates: { lat: 33.707208687127434, lng: 73.06773299999999 },
  },
  pullyStop: {
    id: 'pullyStop',
    name: 'Pully Stop',
    coordinates: { lat: 33.70686668703858, lng: 73.070444 },
  },
  iqbalHall: {
    id: 'iqbalHall',
    name: 'Iqbal Hall',
    coordinates: { lat: 33.7091537626875, lng: 73.07463781349114 },
  },
  g61: {
    id: 'g61',
    name: 'G-6/1,2',
    coordinates: { lat: 33.71130661291458, lng: 73.0780072711637 },
  },
  melodyMarket: {
    id: 'melodyMarket',
    name: 'Melody Market',
    coordinates: { lat: 33.714479613409246, lng: 73.08405227116371 },
  },
  abparaMarket: {
    id: 'abparaMarket',
    name: 'Abpara Market',
    coordinates: { lat: 33.70828976237323, lng: 73.08950972883629 },
  },
  youthHostel: {
    id: 'youthHostel',
    name: 'Youth Hostel',
    coordinates: { lat: 33.70996053756802, lng: 73.09177127116371 },
  },
  metropolitanCorporation: {
    id: 'metropolitanCorporation',
    name: 'Metropolitan Corporation',
    coordinates: { lat: 33.71559768930707, lng: 73.0875952711637 },
  },
  icbCollege: {
    id: 'icbCollege',
    name: 'ICB College',
    coordinates: { lat: 33.71750576572566, lng: 73.08649745767258 },
  },
  nadraChowk: {
    id: 'nadraChowk',
    name: 'NADRA Chowk',
    coordinates: { lat: 33.722593691125105, lng: 73.08312572883628 },
  },
  lodgesPark: {
    id: 'lodgesPark',
    name: 'Lodges Park',
    coordinates: { lat: 33.719835690408345, lng: 73.0937732711637 },
  },
  sukhChaynPark: {
    id: 'sukhChaynPark',
    name: 'Sukh Chayn Park',
    coordinates: { lat: 33.71334661323259, lng: 73.100178 },
  },
  ministryOfForeignAffairs: {
    id: 'ministryOfForeignAffairs',
    name: 'Ministry of Foreign Affairs',
    coordinates: { lat: 33.718315614007295, lng: 73.10377772883629 },
  },
  radioPakistan: {
    id: 'radioPakistan',
    name: 'Radio Pakistan',
    coordinates: { lat: 33.72221469102664, lng: 73.10084300000001 },
  },
  nationalLibrary: {
    id: 'nationalLibrary',
    name: 'National Library',
    coordinates: { lat: 33.724532691629065, lng: 73.1025497288363 },
  },
  secretariatePoliceStation: {
    id: 'secretariatePoliceStation',
    name: 'Secretariate Police Station',
    coordinates: { lat: 33.72683376911966, lng: 73.106991 },
  },
  diplomaticEnclaveGate4: {
    id: 'diplomaticEnclaveGate4',
    name: 'Diplomatic Enclave Gate 4',
    coordinates: { lat: 33.729095461437694, lng: 73.111223 },
  },
  aiwanESadarColony: {
    id: 'aiwanESadarColony',
    name: 'Aiwan e Sadar Colony',
    coordinates: { lat: 33.73341169393705, lng: 73.108774 },
  },
  muslimColony: {
    id: 'muslimColony',
    name: 'Muslim Colony',
    coordinates: { lat: 33.7400716956686, lng: 73.10876872883628 },
  },

  // FR-4A Additional Stations
  muhallahNooriBagh: {
    id: 'muhallahNooriBagh',
    name: 'Muhallah Noori Bagh',
    coordinates: { lat: 33.744195539347736, lng: 73.11179 },
  },
  communityHealthCentre: {
    id: 'communityHealthCentre',
    name: 'Community Health Centre',
    coordinates: { lat: 33.74452985429432, lng: 73.117463 },
  },
  dTypeQuaidEAzamColony: {
    id: 'dTypeQuaidEAzamColony',
    name: 'D-Type Quaid-e-Azam Colony',
    coordinates: { lat: 33.7447126968754, lng: 73.12037572883628 },
  },
  cTypeQuaidEAzamColony: {
    id: 'cTypeQuaidEAzamColony',
    name: 'C-Type Quaid-e-Azam Colony',
    coordinates: { lat: 33.74482469690452, lng: 73.1247482711637 },
  },
  babulQuaid: {
    id: 'babulQuaid',
    name: 'Babul Quaid',
    coordinates: { lat: 33.744922596929975, lng: 73.13294307116371 },
  },
  // FR-7 Additional Stations
  dentalHospital: {
    id: 'dentalHospital',
    name: 'Dental Hospital',
    coordinates: { lat: 33.69989261113549, lng: 73.04891872883628 },
  },
  developmentPark: {
    id: 'developmentPark',
    name: 'Development Park',
    coordinates: { lat: 33.69516953679959, lng: 73.04724699999998 },
  },
  policeFlats: {
    id: 'policeFlats',
    name: 'Police Flats',
    coordinates: { lat: 33.68431160870777, lng: 73.02512572883629 },
  },
  collegeMorh: {
    id: 'collegeMorh',
    name: 'College Morh',
    coordinates: { lat: 33.68098160818905, lng: 73.018356 },
  },
  g10Markaz: {
    id: 'g10Markaz',
    name: 'G-10 Markaz',
    coordinates: { lat: 33.67659967917871, lng: 73.014712 },
  },
  phaFlats: {
    id: 'phaFlats',
    name: 'PHA Flats',
    coordinates: { lat: 33.67573367895389, lng: 73.01258745767258 },
  },
  tankiStop: {
    id: 'tankiStop',
    name: 'Tanki Stop',
    coordinates: { lat: 33.674554678647866, lng: 73.01020572883628 },
  },
  greenbeltG10G11: {
    id: 'greenbeltG10G11',
    name: 'Greenbelt G-10/G-11',
    coordinates: { lat: 33.678589679695285, lng: 73.00392127116369 },
  },
  instituteOfModernStudies: {
    id: 'instituteOfModernStudies',
    name: 'Institute of Modern Studies',
    coordinates: { lat: 33.673326678329126, lng: 73.00230999999998 },
  },
  mehrabad: {
    id: 'mehrabad',
    name: 'Mehrabad',
    coordinates: { lat: 33.665099605715646, lng: 73.00038800000002 },
  },

  // FR-8A & FR-8C Additional Stations
  zeroPakMonument: {
    id: 'zeroPakMonument',
    name: 'Zero Point (Pak Monument)',
    coordinates: { lat: 33.69660368437274, lng: 73.06241499999999 },
  },
  ttStop: {
    id: 'ttStop',
    name: 'T&T Stop',
    coordinates: { lat: 33.69482075747519, lng: 73.064146 },
  },
  kashmirChowk: {
    id: 'kashmirChowk',
    name: 'Kashmir Chowk',
    coordinates: { lat: 33.70832168741661, lng: 73.10522054232742 },
  },
  rawalChowk: {
    id: 'rawalChowk',
    name: 'Rawal Chowk',
    coordinates: { lat: 33.687926682119425, lng: 73.109701 },
  },
  rawalTown: {
    id: 'rawalTown',
    name: 'Rawal Town',
    coordinates: { lat: 33.68886375530948, lng: 73.11283354232741 },
  },
  schoolBoardStop: {
    id: 'schoolBoardStop',
    name: 'School Board Stop',
    coordinates: { lat: 33.68856960937113, lng: 73.11692127116369 },
  },
  rawalDamColony: {
    id: 'rawalDamColony',
    name: 'Rawal Dam Colony',
    coordinates: { lat: 33.68819468218903, lng: 73.1211485423274 },
  },
  narcColony: {
    id: 'narcColony',
    name: 'NARC Colony',
    coordinates: { lat: 33.68747775480561, lng: 73.13103472883628 },
  },
  nihAllergyCenter: {
    id: 'nihAllergyCenter',
    name: 'NIH Allergy Center',
    coordinates: { lat: 33.68544568147524, lng: 73.13483572883628 },
  },
  shahzadTown: {
    id: 'shahzadTown',
    name: 'Shahzad Town',
    coordinates: { lat: 33.674261678571824, lng: 73.14386800000001 },
  },
  parkViewKuriRoad: {
    id: 'parkViewKuriRoad',
    name: 'Park View (Kuri Road)',
    coordinates: { lat: 33.674261678571824, lng: 73.1438894576726 },
  },
  greenAvenue: {
    id: 'greenAvenue',
    name: 'Green Avenue',
    coordinates: { lat: 33.66797753538769, lng: 73.14960345767258 },
  },
  chattaBakhtawar: {
    id: 'chattaBakhtawar',
    name: 'Chatta Bakhtawar',
    coordinates: { lat: 33.6645276760455, lng: 73.15235827116369 },
  },
  hostelCity: {
    id: 'hostelCity',
    name: 'Hostel City',
    coordinates: { lat: 33.65708167411345, lng: 73.15387845767259 },
  },
  comsatsUniversity: {
    id: 'comsatsUniversity',
    name: 'COMSATS University',
    coordinates: { lat: 33.65249260375304, lng: 73.1581857288363 },
  },
  tammaStop: {
    id: 'tammaStop',
    name: 'Tamma Stop',
    coordinates: { lat: 33.64824167182018, lng: 73.16194627116371 },
  },

  dhokeKalaKhan: {
    id: 'dhokeKalaKhan',
    name: 'Dhoke Kala Khan',
    coordinates: { lat: 33.649770494504395, lng: 73.0977740685629 },
  },
  pindoraChungi: {
    id: 'pindoraChungi',
    name: 'Pindora Chungi',
    coordinates: { lat: 33.65197839632907, lng: 73.0642967288363 },
  },
  katarianChungi: {
    id: 'katarianChungi',
    name: 'Katarian Chungi',
    coordinates: { lat: 33.64864667192524, lng: 73.0579997288363 },
  },
  katarianPull: {
    id: 'katarianPull',
    name: 'Katarian Pull',
    coordinates: { lat: 33.646594602835094, lng: 73.05361127116369 },
  },
  cdaStop: {
    id: 'cdaStop',
    name: 'CDA Stop, I10',
    coordinates: { lat: 33.64158453401826, lng: 73.04329454232742 },
  },
  mandiMorh: {
    id: 'mandiMorh',
    name: 'Mandi Morh',
    coordinates: { lat: 33.635195601061355, lng: 73.0323217288363 },
  },
  faujiColony: {
    id: 'faujiColony',
    name: 'Fauji Colony',
    coordinates: { lat: 33.633162139868205, lng: 73.02844120558892 },
  },
  carriageFactory: {
    id: 'carriageFactory',
    name: 'Carriage Factory',
    coordinates: { lat: 33.63041560031775, lng: 73.023316 },
  },
  westridge: {
    id: 'westridge',
    name: 'Westridge',
    coordinates: { lat: 33.62711859980488, lng: 73.0171077288363 },
  },
  ctti: {
    id: 'ctti',
    name: 'CTTI',
    coordinates: { lat: 33.62488553315229, lng: 73.012709 },
  },
  socialSecurityHospital: {
    id: 'socialSecurityHospital',
    name: 'Social Security Hospital',
    coordinates: { lat: 33.62022759873308, lng: 73.0025415423274 },
  },
  britishHomes: {
    id: 'britishHomes',
    name: 'British Homes',
    coordinates: { lat: 33.615089597934094, lng: 72.9927667288363 },
  },
  kohinoorMill: {
    id: 'kohinoorMill',
    name: 'Kohinoor Mill',
    coordinates: { lat: 33.61896646715481, lng: 72.98077181349112 },
  },
  kohinoorMillColony: {
    id: 'kohinoorMillColony',
    name: 'Kohinoor Mill Colony',
    coordinates: { lat: 33.61681172914095, lng: 72.98660045767257 },
  },
  golraMorhChowk: {
    id: 'golraMorhChowk',
    name: 'Golra Morh Chowk',
    coordinates: { lat: 33.62475266572926, lng: 72.971451 },
  },

  // FR-14 & FR-14A Additional Stations
  colAmmanullahRoad: {
    id: 'colAmmanullahRoad',
    name: 'Col. Ammanullah Road',
    coordinates: { lat: 33.73695461691421, lng: 73.174402 },
  },
  athalChowk: {
    id: 'athalChowk',
    name: 'Athal Chowk',
    coordinates: { lat: 33.73898869538702, lng: 73.17817418650887 },
  },
  gardenAvenue: {
    id: 'gardenAvenue',
    name: 'Garden Avenue',
    coordinates: { lat: 33.6849847538994, lng: 73.10649445767258 },
  },
  margallaTown: {
    id: 'margallaTown',
    name: 'Margalla Town',
    coordinates: { lat: 33.68160753609528, lng: 73.10233281349112 },
  },
  itpCentre: {
    id: 'itpCentre',
    name: 'ITP Centre',
    coordinates: { lat: 33.67161646442365, lng: 73.09303 },
  },
  jhugi: {
    id: 'jhugi',
    name: 'Jhugi',
    coordinates: { lat: 33.74367969660677, lng: 73.18068845767259 },
  },
  bheraPul: {
    id: 'bheraPul',
    name: 'Bhera Pul',
    coordinates: { lat: 33.74499869694976, lng: 73.18909945767258 },
  },
  imtiazMart: {
    id: 'imtiazMart',
    name: 'Imtiaz Mart',
    coordinates: { lat: 33.747651260472786, lng: 73.19319034232741 },
  },
  akbarNiazi: {
    id: 'akbarNiazi',
    name: 'Akbar Niazi',
    coordinates: { lat: 33.756299231145704, lng: 73.20967740923902 },
  },
  phulgran: {
    id: 'phulgran',
    name: 'Phulgran',
    coordinates: { lat: 33.75758977901766, lng: 73.21277904972568 },
  },
  dhokBadam: {
    id: 'dhokBadam',
    name: 'Dhok Badam',
    coordinates: { lat: 33.75876165508307, lng: 73.21545836444854 },
  },
  punjabCollege: {
    id: 'punjabCollege',
    name: 'Punjab College',
    coordinates: { lat: 33.760486620586214, lng: 73.21722091534517 },
  },
  alwadiColony: {
    id: 'alwadiColony',
    name: 'Alwadi Colony',
    coordinates: { lat: 33.76207339097326, lng: 73.21869763558199 },
  },

  // FR-15 Additional Stations
  tuthStop: {
    id: 'tuthStop',
    name: 'Tuth Stop',
    coordinates: { lat: 33.58627559345525, lng: 73.14559445767259 },
  },
  pwdHousingSociety: {
    id: 'pwdHousingSociety',
    name: 'PWD Housing society',
    coordinates: { lat: 33.57597865309367, lng: 73.15319045767258 },
  },
  sohanGardenEBlock: {
    id: 'sohanGardenEBlock',
    name: 'Sohan garden E block',
    coordinates: { lat: 33.56944410638175, lng: 73.15807293254437 },
  },
  sohanGardenGBlock: {
    id: 'sohanGardenGBlock',
    name: 'Sohan garden G block',
    coordinates: { lat: 33.562990709626014, lng: 73.162914 },
  },
  sohanGardenHBlock: {
    id: 'sohanGardenHBlock',
    name: 'Sohan garden H block',
    coordinates: { lat: 33.558553589149334, lng: 73.16619654232741 },
  },
  riverGarden: {
    id: 'riverGarden',
    name: 'River Garden',
    coordinates: { lat: 33.55183858810684, lng: 73.17113945767258 },
  },
  kaakPul: {
    id: 'kaakPul',
    name: 'Kaak Pul',
    coordinates: { lat: 33.543877644786306, lng: 73.177274 },
  },
  dhaGate8: {
    id: 'dhaGate8',
    name: 'DHA Gate 8',
    coordinates: { lat: 33.53911570097803, lng: 73.18016981349113 },
  },
  dhaGate7: {
    id: 'dhaGate7',
    name: 'DHA Gate 7',
    coordinates: { lat: 33.533472698934816, lng: 73.18085672883629 },
  },
  suparco: {
    id: 'suparco',
    name: 'Suparco',
    coordinates: { lat: 33.51831969344972, lng: 73.17895244047337 },
  },
};

export const metroLines: MetroLine[] = [
  {
    id: 'red',
    name: 'Red Line',
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
    name: 'Orange Line',
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
    name: 'Green Line',
    stations: [
      stationData.pims_gate,
      stationData.pims_children_hospital,
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
    name: 'Blue Line',
    stations: [
      stationData.pims_gate,
      stationData.pims_children_hospital,
      stationData.g7g8,
      stationData.h8Shakarparia,
      stationData.i8ParadeGround,
      stationData.sohan,
      stationData.dhokeKalaKhan,
      stationData.iqbalTown,
      stationData.kuriRoad,
      stationData.ziaMasjid,
      stationData.khannaPul,
      stationData.fazaia,
      stationData.gangal,
      stationData.koralChowk,
      stationData.gulberg,
    ],
  },
  {
    id: 'fr_1',
    name: 'FR-1',
    stations: [
      stationData.sohan,
      stationData.faizabad,
      stationData.ijPrincipal,
      stationData.potohar,
      stationData.mciModelSchool,
      stationData.cdaComplaintCenter,
      stationData.ogtiStop,
      stationData.suiGasStop,
      stationData.ptclI10,
      stationData.iescoI10Markaz,
      stationData.korangRoad,
      stationData.shamaPark,
      stationData.metroCashAndCarry,
    ],
  },
  {
    id: 'fr_3a',
    name: 'FR-3A',
    stations: [
      stationData.pims_gate,
      stationData.pims,
      stationData.f8Katchery,
      stationData.f8Markaz,
      stationData.raviGateF9,
      stationData.shaheenChowk,
      stationData.bahriaUniversity,
      stationData.navalComplex,
      stationData.faisalMasjid,
    ],
  },
  {
    id: 'fr_4',
    name: 'FR-4',
    stations: [
      stationData.pims_gate,
      stationData.childrenHospital,
      stationData.rescue15,
      stationData.bankColony,
      stationData.salaiCentre,
      stationData.sitaraMarket,
      stationData.pullyStop,
      stationData.iqbalHall,
      stationData.g61,
      stationData.melodyMarket,
      stationData.abparaMarket,
      stationData.youthHostel,
      stationData.metropolitanCorporation,
      stationData.icbCollege,
      stationData.nadraChowk,
      stationData.lodgesPark,
      stationData.sukhChaynPark,
      stationData.ministryOfForeignAffairs,
      stationData.radioPakistan,
      stationData.nationalLibrary,
      stationData.secretariatePoliceStation,
      stationData.diplomaticEnclaveGate4,
      stationData.aiwanESadarColony,
      stationData.muslimColony,
      stationData.bariImam,
    ],
  },
  {
    id: 'fr_4a',
    name: 'FR-4A',
    stations: [
      stationData.bariImam,
      stationData.muhallahNooriBagh,
      stationData.communityHealthCentre,
      stationData.dTypeQuaidEAzamColony,
      stationData.cTypeQuaidEAzamColony,
      stationData.babulQuaid,
      stationData.qau,
    ],
  },
  {
    id: 'fr_7',
    name: 'FR-7',
    stations: [
      stationData.pims_gate,
      stationData.childrenHospital,
      stationData.noriHospital,
      stationData.dentalHospital,
      stationData.g8Markaz,
      stationData.developmentPark,
      stationData.chaman,
      stationData.g9_4_Park,
      stationData.karachiCompany,
      stationData.g9Markaz,
      stationData.policeFlats,
      stationData.collegeMorh,
      stationData.g10Markaz,
      stationData.phaFlats,
      stationData.tankiStop,
      stationData.greenbeltG10G11,
      stationData.instituteOfModernStudies,
      stationData.g11Markaz,
      stationData.mehrabad,
      stationData.nust,
    ],
  },
  {
    id: 'fr_8a',
    name: 'FR-8A',
    stations: [
      stationData.pims_gate,
      stationData.zeroPakMonument,
      stationData.cda,
      stationData.aabpara,
      stationData.foreignOffice,
      stationData.kashmirChowk,
      stationData.rawalChowk,
      stationData.rawalTown,
      stationData.schoolBoardStop,
      stationData.rawalDamColony,
      stationData.narcColony,
      stationData.nihAllergyCenter,
      stationData.shahzadTown,
      stationData.parkViewKuriRoad,
      stationData.greenAvenue,
      stationData.chattaBakhtawar,
      stationData.hostelCity,
      stationData.comsatsUniversity,
      stationData.tammaStop,
      stationData.tramriChowk,
    ],
  },
  {
    id: 'fr_8c',
    name: 'FR-8C',
    stations: [
      stationData.pims_gate,
      stationData.ttStop,
      stationData.h8Shakarparia,
      stationData.i8ParadeGround,
      stationData.faizabadInterchange,
      stationData.itpCentre,
      stationData.margallaTown,
      stationData.gardenAvenue,
      stationData.rawalChowk,
      stationData.rawalTown,
      stationData.schoolBoardStop,
      stationData.rawalDamColony,
      stationData.narcColony,
      stationData.nihAllergyCenter,
      stationData.shahzadTown,
      stationData.parkViewKuriRoad,
      stationData.greenAvenue,
      stationData.chattaBakhtawar,
      stationData.hostelCity,
      stationData.comsatsUniversity,
      stationData.tammaStop,
      stationData.tramriChowk,
    ],
  },
  {
    id: 'fr_9',
    name: 'FR-9',
    stations: [
      stationData.khannaPul,
      stationData.ziaMasjid,
      stationData.kuriRoad,
      stationData.iqbalTown,
      stationData.dhokeKalaKhan,
      stationData.sohan,
      stationData.faizabad,
      stationData.ijPrincipal,
      stationData.pindoraChungi,
      stationData.katarianChungi,
      stationData.katarianPull,
      stationData.cdaStop,
      stationData.pullyStop,
      stationData.mandiMorh,
      stationData.faujiColony,
      stationData.carriageFactory,
      stationData.westridge,
      stationData.ctti,
      stationData.socialSecurityHospital,
      stationData.britishHomes,
      stationData.pirWadhaiMorh,
      stationData.kohinoorMillColony,
      stationData.kohinoorMill,
      stationData.golraMorhChowk,
      stationData.golraMorr,
    ],
  },
  {
    id: 'fr_14',
    name: 'FR-14',
    stations: [
      stationData.bharakau,
      stationData.shahdara,
      stationData.malpur,
      stationData.lakeviewPark,
      stationData.kashmirChowk,
      stationData.rawalChowk,
      stationData.gardenAvenue,
      stationData.margallaTown,
      stationData.itpCentre,
      stationData.sohan,
      stationData.faizabad,
      stationData.ijPrincipal,
      stationData.pindoraChungi,
      stationData.katarianChungi,
      stationData.katarianPull,
      stationData.cda,
      stationData.pullyStop,
      stationData.mandiMorh,
    ],
  },
  {
    id: 'fr_14a',
    name: 'FR-14A',
    stations: [
      stationData.bharakau,
      stationData.colAmmanullahRoad,
      stationData.athalChowk,
      stationData.bharakauBazar,
      stationData.jhugi,
      stationData.bheraPul,
      stationData.imtiazMart,
      stationData.akbarNiazi,
      stationData.phulgran,
      stationData.dhokBadam,
      stationData.punjabCollege,
      stationData.alwadiColony,
      stationData.satraMeel,
    ],
  },
  {
    id: 'fr_15',
    name: 'FR-15',
    stations: [
      stationData.khannaPul,
      stationData.fazaia,
      stationData.gangal,
      stationData.koralChowk,
      stationData.gulberg,
      stationData.tuthStop,
      stationData.pwdHousingSociety,
      stationData.sohanGardenEBlock,
      stationData.sohanGardenGBlock,
      stationData.sohanGardenHBlock,
      stationData.riverGarden,
      stationData.kaakPul,
      stationData.dhaGate8,
      stationData.dhaGate7,
      stationData.suparco,
      stationData.tChowk,
    ],
  },
];

/**
 * Walking shortcuts between stations for transfers
 * This defines stations where users can reasonably walk between to transfer lines
 * instead of taking transit connections
 */
export const walkingShortcuts: Array<{
  from: string;
  to: string;
  priority: number; // Higher number means higher priority (0-10, 10 being highest)
}> = [
  {
    from: 'sohan',
    to: 'faizabad',
    priority: 7, // High priority
  },
  {
    from: 'faizabadInterchange',
    to: 'faizabad',
    priority: 10, // High priority
  },
  {
    from: 'pims',
    to: 'pims_gate',
    priority: 8,
  },
];

/**
 * Major interchange stations in the network
 * These are stations where multiple lines meet, enabling transfers
 */
export const interchangeStations: Array<{
  stationId: string;
  name: string;
  lines: string[]; // IDs of the lines that meet at this station
  priority: number; // Higher number means higher priority (0-10, 10 being highest)
}> = [
  {
    stationId: 'faizAhmadFaiz',
    name: 'Faiz Ahmad Faiz',
    lines: ['red', 'orange'],
    priority: 10, // Highest priority - major transfer point
  },
  {
    stationId: 'pims_gate',
    name: 'PIMS Gate',
    lines: ['green', 'blue'],
    priority: 9,
  },
  {
    stationId: 'faizabad',
    name: 'Faizabad',
    lines: ['red', 'fr_1', 'fr_9', 'fr_14'],
    priority: 8,
  },
  {
    stationId: 'sohan',
    name: 'Sohan',
    lines: ['blue', 'fr_1', 'fr_9', 'fr_14'],
    priority: 7,
  },
];
