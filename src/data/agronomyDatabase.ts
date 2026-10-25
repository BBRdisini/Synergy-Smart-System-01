import {
  ActivityLogItem,
  AgronomyGuideModule,
  CommodityType,
  CropProfile,
  CultivationTaskEntity,
  DiagnosisResult,
  ExpenseRecord,
  FarmEntity,
  FarmPlot,
  GrowingSeasonEntity,
  HarvestRecord,
  HeatmapSector,
  OfficialDiseaseId,
  PestDiseaseCatalogItem,
  PesticideProduct,
  ScheduledTask,
  SeasonActivityLog,
  SeasonExpenseRecord,
  SeasonHarvestRecord,
  UserProfile,
  WeatherSnapshot,
} from '../types/agronomy';
import {
  generate14StageRiceLifecycle,
  generateCultivationPlanAndTasks,
} from '../utils/agronomyCalculations';

import {
  DEFAULT_LARIKREJO_COORDS,
  evaluateAgronomyWeatherAdvisory,
  formatDynamicForecastDateId,
} from '../services/liveWeatherService';

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr-budi-santoso',
  name: 'Budi Santoso',
  role: 'Petani Padi & Palawija',
  village: 'Desa Larikrejo, Kec. Undaan, Kab. Kudus',
  emailOrPhone: '0812-2845-9910',
  isLoggedIn: true,
  privacyConsentAccepted: true,
  avatarDataUrl: '',
  phoneWhatsapp: '0812-2845-9910',
  email: 'budi.santoso.tani@gmail.com',
  villageName: 'Desa Larikrejo',
  districtName: 'Kec. Undaan',
  regencyName: 'Kab. Kudus',
  provinceName: 'Jawa Tengah',
  latitude: DEFAULT_LARIKREJO_COORDS.latitude,
  longitude: DEFAULT_LARIKREJO_COORDS.longitude,
  poktanName: 'Poktan Sido Makmur Larikrejo',
  kartuTaniNumber: '3319-0320-0701-8842',
  mainCommodity: 'Padi',
  irrigationSystem: 'Teknis',
  plantingSeasonMT: 'MT2 Gadu / Peralihan (Mar–Jun)',
  updatedAt: new Date().toISOString(),
};

/**
 * Basis Data Referensi Pestisida & Bahan Aktif Terverifikasi sesuai Papan Presentasi UI TaniCerdas AI
 * dan Komisi Pestisida Kementan RI.
 */
export const VERIFIED_PESTICIDE_PRODUCTS: PesticideProduct[] = [
  {
    id: 'prod-score-250ec',
    productName: 'Score 250 EC',
    alternativeBrands: ['Score 250 EC', 'Srikandi 250 EC', 'Novelgro 250 EC', 'Explore 250 EC', 'Difenzole 250 EC'],
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 0102011990943',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Difenokonazol',
    concentration: '250 g/l',
    modeOfActionGroup: 'FRAC Grup 3 (Triazol Sistemik + ZPT)',
    formulation: 'EC (Emulsifiable Concentrate)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Jagung', 'Cabai', 'Bawang Merah', 'Tomat'],
    targetOrganisms: [
      'Blas Daun & Leher Malai (Pyricularia oryzae)',
      'Hawar Pelepah (Rhizoctonia solani)',
      'Bercak Coklat (Bipolaris oryzae) & Cercospora (Cercospora janseana)',
    ],
    dosagePerLiter: '0,75 – 1 ml per liter air',
    dosagePer16LTank: '12 – 16 ml per tangki 16L (≈ 1 tutup botol)',
    dosagePerHaEstimate: '± 350 – 500 ml/ha (sesuai volume semprot)',
    sprayVolumePerHa: '400 – 500 L/ha (Semprot volume tinggi)',
    applicationMethod: 'Semprot volume tinggi (400–500 L/ha) pada daun, pelepah, dan malai saat gejala awal muncul',
    applicationInterval: '7 – 14 hari (maksimal 2 kali aplikasi per musim)',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Berbahaya jika tertelan atau terhirup kabut semprotan.',
      'Jauhkan dari jangkauan anak-anak, hewan ternak, dan sumber air minum.',
      'Ikuti petunjuk pada label kemasan resmi dan patuhi interval pra-panen 14 hari.',
    ],
    resistanceWarning: 'Fungisida golongan Triazol (FRAC Grup 3). Rotasikan dengan fungisida kontak (Mankozeb/Propineb) atau Isoprotiolan untuk mencegah resistensi jamur.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Kemasan Score 250 EC',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-amistartop-325sc',
    productName: 'Amistartop 325 SC',
    alternativeBrands: ['Amistartop 325 SC', 'Tandem 325 SC', 'Azoksin 325 SC', 'Miravis Duo', 'Seltima 100 CS'],
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 01020120052228',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Azoksistrobin 200 g/l + Difenokonazol 125 g/l',
    concentration: '325 g/l',
    modeOfActionGroup: 'FRAC Grup 11 (Strobilurin) + Grup 3 (Triazol)',
    formulation: 'SC (Suspension Concentrate)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Jagung', 'Cabai', 'Bawang Merah', 'Tomat'],
    targetOrganisms: [
      'Hawar Pelepah Padi (Rhizoctonia solani)',
      'Bercak Coklat Padi (Bipolaris oryzae / Helminthosporium oryzae)',
      'Blas Leher Malai (Pyricularia oryzae) & Gabah Kotor',
    ],
    dosagePerLiter: '0,5 – 1 ml per liter air',
    dosagePer16LTank: '10 – 15 ml per tangki 16L',
    dosagePerHaEstimate: '± 250 – 400 ml/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprot volume tinggi diarahkan ke pelepah, daun bendera, dan malai pada fase anakan maksimum dan bunting',
    applicationInterval: '10 – 14 hari (maksimal 2 kali per musim)',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Berbahaya bagi organisme perairan; jangan mencuci alat semprot di saluran irigasi.',
      'Patuhi masa tunggu panen 14 hari.',
    ],
    resistanceWarning: 'Kombinasi FRAC Grup 11 + Grup 3. Batasi maksimal 2 kali aplikasi per musim tanam.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Amistartop 325 SC',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-fujiwan-400ec',
    productName: 'Fujiwan 400 EC / Filia 525 SE',
    alternativeBrands: ['Fujiwan 400 EC', 'Filia 525 SE', 'Beam 75 WP', 'Blasgone 75 WP', 'Folicur 25 WP'],
    manufacturer: 'PT Bina Guna Kimia / PT Syngenta Indonesia',
    registrationNumber: 'RI. 0102011986778',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Isoprotiolan 400 g/l (atau Trisiklazol 400 g/l + Propikonazol 125 g/l)',
    concentration: '400 g/l – 525 g/l',
    modeOfActionGroup: 'FRAC Grup 6 (Phosphorothiolate) & Grup 16.1 (Melanin Biosynthesis Inhibitor)',
    formulation: 'EC (Emulsifiable Concentrate)',
    allowedCommodities: ['Padi', 'Jagung', 'Bawang Merah'],
    targetOrganisms: [
      'Blas Daun & Blas Leher Malai / Neck Blast (Pyricularia oryzae)',
      'Busuk Akar & Pemulihan Serabut Akar Baru Padi (Efek ZPT Akar Isoprotiolan)',
      'Busuk Pangkal Batang & Hawar Pelepah',
    ],
    dosagePerLiter: '1,25 – 1,5 ml per liter air',
    dosagePer16LTank: '20 – 25 ml per tangki 16L',
    dosagePerHaEstimate: '± 500 – 750 ml/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan pada tajuk daun/malai untuk Blas, atau kocor/semprot ke pangkal perakaran untuk merangsang akar putih baru pada kasus busuk akar',
    applicationInterval: '7 – 10 hari (saat gejala awal & fase keluar malai 5%)',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Gunakan dosis tepat sesuai label resmi; jangan mencampur dengan pestisida bersifat basa kuat.',
    ],
    resistanceWarning: 'FRAC Grup 6 & 16.1 spesifik penghambat penetrasi jamur Blas dan pemacu regenerasi perakaran.',
    labelSource: 'Direktori Pestisida Kementan RI & Pedoman Pengendalian Blas BB Padi',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-nativo-75wg',
    productName: 'Nativo 75 WG / Anvil 50 SC',
    alternativeBrands: ['Nativo 75 WG', 'Anvil 50 SC', 'Folicur 25 WP', 'Contaf 50 EC', 'Envoy 80 WP'],
    manufacturer: 'PT Bayer Indonesia / PT Syngenta Indonesia',
    registrationNumber: 'RI. 01020120072781',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Trifloksistrobin 25% + Tebukonazol 50% (atau Heksakonazol 50 g/l)',
    concentration: '75% WG / 50 g/l SC',
    modeOfActionGroup: 'FRAC Grup 11 + Grup 3 (Sistemik & Mesostemik)',
    formulation: 'WG (Water Dispersible Granule)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Cabai', 'Jagung', 'Bawang Merah', 'Kedelai'],
    targetOrganisms: [
      'Hawar Pelepah & Busuk Batang (Rhizoctonia solani & Sclerotium oryzae)',
      'Penyakit Gabah Kotor / Bercak Bulir & Gosong Palsu (Ustilaginoidea virens)',
      'Bercak Daun Cercospora, Karat Daun & Busuk Akar Cendawan',
    ],
    dosagePerLiter: '0,5 – 0,75 g per liter air (Anvil: 1,5 ml/L)',
    dosagePer16LTank: '10 – 12,5 gram (1 sachet) per tangki 16L',
    dosagePerHaEstimate: '± 200 – 250 g/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan merata pada pelepah batang bawah atau malai saat fase bunting dan keluar malai awal',
    applicationInterval: '10 – 14 hari',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Simpan di tempat kering dan sejuk; hindari penyemprotan saat bunga padi sedang mekar penuh (09:00–11:00).',
    ],
    resistanceWarning: 'Kombinasi FRAC Grup 11 + 3. Efektif menghentikan perkembangan sklerotia jamur pada pelepah dan bulir.',
    labelSource: 'Direktori Pestisida Kementan RI & Label Resmi Nativo 75 WG / Anvil 50 SC',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-antracol-70wp',
    productName: 'Antracol 70 WP / Dithane M-45',
    alternativeBrands: ['Antracol 70 WP', 'Dithane M-45 80 WP', 'Victory Mix 8/64 WP', 'Bion M 1/48 WP', 'Ridomil Gold MZ'],
    manufacturer: 'PT Bayer Indonesia / Corteva Agriscience',
    registrationNumber: 'RI. 010201197476',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Propineb 70% + Zinc (atau Mankozeb 80% / Metalaksil + Mankozeb)',
    concentration: '70% – 80% WP',
    modeOfActionGroup: 'FRAC Grup M03 (Fungisida Kontak Protektif Multi-Situs + Mikro Zn)',
    formulation: 'WP (Wettable Powder)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Cabai', 'Bawang Merah', 'Tomat', 'Jagung'],
    targetOrganisms: [
      'Bercak Daun, Bercak Coklat & Blas (Pyricularia & Bipolaris)',
      'Antraknosa / Patek Cabai (Colletotrichum spp.) & Bulai Jagung',
      'Busuk Akar & Rebah Kecambah (Pythium, Phytophthora, Fusarium)',
    ],
    dosagePerLiter: '2 – 2,5 g/l air',
    dosagePer16LTank: '30 – 40 gram (2–3 sendok makan penuh) per tangki 16L',
    dosagePerHaEstimate: '± 1,0 – 1,5 kg/ha',
    sprayVolumePerHa: '400 – 500 L/ha (Semprot volume tinggi)',
    applicationMethod: 'Semprot volume tinggi merata pada permukaan daun atau dikocorkan di pangkal akar/tanah yang lembap',
    applicationInterval: '7 – 10 hari',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Jangan melakukan penyemprotan melawan arah angin atau saat angin kencang (>15 km/jam).',
      'Cuci tangan dan pakaian kerja dengan sabun setelah aplikasi.',
    ],
    resistanceWarning: 'Fungisida kontak multi-situs (FRAC Grup M03). Sangat baik digunakan sebagai pasangan rotasi fungisida sistemik dan sumber suplemen Seng (Zn).',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Antracol 70 WP / Dithane M-45',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-plenum-50wg',
    productName: 'Plenum 50 WG',
    alternativeBrands: ['Plenum 50 WG', 'Chess 50 WG', 'Besvidor 25 WP', 'Tokugawa 50 WG', 'Pymetop 50 WG'],
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 01010120042075',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Pimetrozin (Pymetrozine)',
    concentration: '50%',
    modeOfActionGroup: 'IRAC Grup 9B (Penghambat Makan Selektif & Penghambat Bertelur Wereng)',
    formulation: 'WG (Water Dispersible Granule)',
    allowedCommodities: ['Padi', 'Cabai', 'Kacang Hijau'],
    targetOrganisms: [
      'Wereng Batang Coklat (Nilaparvata lugens)',
      'Wereng Hijau (Nephotettix virescens - Vektor Virus Tungro)',
      'Wereng Punggung Putih (Sogatella furcifera) & Kutu Kebul (Bemisia tabaci)',
    ],
    dosagePerLiter: '0,6 – 0,8 g per liter air',
    dosagePer16LTank: '10 – 12,5 gram (1 sachet) per tangki 16L',
    dosagePerHaEstimate: '± 250 – 300 g/ha',
    sprayVolumePerHa: '400 – 500 L/ha (Arahkan ke pangkal batang padi)',
    applicationMethod: 'Singkap kanopi dan semprotkan langsung ke pangkal batang padi tempat koloni wereng berkumpul saat air sawah dikeringkan macak-macak',
    applicationInterval: '7 – 10 hari bila populasi melewati ambang ekonomi (>10 ekor/rumpun)',
    preHarvestIntervalDays: 21,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Hanya gunakan apabila populasi wereng telah melewati Ambang Pengendalian.',
      'Hindari penggunaan insektisida piretroid sintetik secara berlebihan pada padi karena memicu resurgensi wereng.',
    ],
    resistanceWarning: 'IRAC Grup 9B (Penghambat makan serangga). Rotasikan dengan Buprofezin (IRAC 16) atau Dinotefuran (IRAC 4A) bila diperlukan aplikasi kedua.',
    labelSource: 'Pedoman PHT Wereng Batang Coklat BB Padi & Label Resmi Plenum 50 WG',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-applaud-10wp',
    productName: 'Applaud 10 WP / Oshin 20 SG / Mipcinta 50 WP',
    alternativeBrands: ['Applaud 10 WP', 'Oshin 20 SG', 'Mipcinta 50 WP', 'Bassa 500 EC', 'Dharmabas 500 EC', 'Pexalon 106 SC'],
    manufacturer: 'PT Petrokimia Kayaku / PT Mitsui / Corteva',
    registrationNumber: 'RI. 0101011984725',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Buprofezin 10% / Dinotefuran 20% / Fenobukarb (BPMC) 50% / Triflumezopyrim',
    concentration: '10% WP / 20% SG / 50% WP',
    modeOfActionGroup: 'IRAC Grup 16 (Penghambat Ganti Kulit Nimfa) + Grup 4A / 1A / 4E',
    formulation: 'WP (Wettable Powder)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Kedelai', 'Cabai', 'Jagung'],
    targetOrganisms: [
      'Nimfa & Imago Wereng Batang Coklat (Nilaparvata lugens)',
      'Wereng Hijau Vektor Tungro (Nephotettix virescens)',
      'Walang Sangit (Leptocorisa oratorius) & Kepik Hijau (Nezara viridula)',
    ],
    dosagePerLiter: '1,5 – 2 g per liter air (Oshin: 0,5 g/L)',
    dosagePer16LTank: '25 – 30 gram (Applaud/Mipcinta) atau 8 – 10 gram (Oshin) per tangki 16L',
    dosagePerHaEstimate: '± 500 – 800 g/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan ke pangkal batang untuk menghentikan pergantian kulit (molting) nimfa wereng muda dan mensterilkan telur wereng',
    applicationInterval: '7 – 10 hari sebagai pasangan rotasi Pimetrozin',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Sangat efektif menekan populasi nimfa (anak wereng) sehingga mencegah ledakan generasi berikutnya (hopperburn).',
    ],
    resistanceWarning: 'IRAC Grup 16 (Buprofezin) & Grup 4E (Pexalon) adalah pasangan rotasi terbaik untuk Pimetrozin (IRAC 9B).',
    labelSource: 'Direktori Pestisida Kementan RI & Pedoman Rotasi Insektisida Wereng BB Padi',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-virtako-300sc',
    productName: 'Virtako 300 SC',
    alternativeBrands: ['Virtako 300 SC', 'Voliam Targo 063 SC', 'Incipio 200 SC', 'Enduro 250 ZC'],
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 01010120083226',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Klorantraniliprol 100 g/l + Tiametoksam 200 g/l',
    concentration: '300 g/l',
    modeOfActionGroup: 'IRAC Grup 28 (Diamida Sistemik) + Grup 4A (Neonikotinoid)',
    formulation: 'SC (Suspension Concentrate)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Jagung', 'Cabai', 'Bawang Merah'],
    targetOrganisms: [
      'Penggerek Batang Padi / Sundep & Beluk (Scirpophaga incertulas)',
      'Hama Pelipat Daun / Hama Putih Palsu (Cnaphalocrocis medinalis)',
      'Hama Ganjur (Orseolia oryzae) & Penggerek Polong Kacang Hijau',
    ],
    dosagePerLiter: '0,3 – 0,4 ml per liter air',
    dosagePer16LTank: '5 – 7,5 ml (setengah tutup botol) per tangki 16L',
    dosagePerHaEstimate: '± 100 – 150 ml/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Aplikasi semprot volume tinggi 4–7 hari setelah terlihat penerbangan ngengat penggerek batang atau saat muncul gejala awal Sundep',
    applicationInterval: '10 – 14 hari jika diperlukan',
    preHarvestIntervalDays: 21,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Berbahaya bagi lebah madu dan serangga penyerbuk saat tanaman berbunga aktif.',
      'Patuhi interval pra-panen 21 hari sebelum panen.',
    ],
    resistanceWarning: 'Kombinasi IRAC Grup 28 + 4A. Batasi aplikasi sesuai ambang pengamatan kelompok telur.',
    labelSource: 'Direktori Pestisida Kementan RI & Rekomendasi BB Padi Sukamandi',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-prevathon-50sc',
    productName: 'Prevathon 50 SC / Belt Expert 480 SC',
    alternativeBrands: ['Prevathon 50 SC', 'Belt Expert 480 SC', 'Takumi 20 WG', 'Ferterra 0.4 GR', 'Dupont Altacor'],
    manufacturer: 'PT FMC Agricultural / PT Bayer Indonesia / PT Nihon Nohyaku',
    registrationNumber: 'RI. 01010120072999',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Klorantraniliprol 50 g/l (atau Flubendiamida 240 g/l + Tiakloprid 240 g/l)',
    concentration: '50 g/l SC / 480 g/l SC',
    modeOfActionGroup: 'IRAC Grup 28 (Modulator Reseptor Ryanodine Otot Ulat)',
    formulation: 'SC (Suspension Concentrate)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Jagung', 'Cabai', 'Kedelai', 'Bawang Merah'],
    targetOrganisms: [
      'Ulat Penggerek Batang Padi (Sundep & Beluk - Scirpophaga incertulas)',
      'Ulat Pelipat Daun / Hama Putih Palsu (Cnaphalocrocis medinalis)',
      'Ulat Grayak (Spodoptera litura / S. frugiperda) & Penggerek Polong (Maruca testulalis)',
    ],
    dosagePerLiter: '1 – 1,5 ml per liter air',
    dosagePer16LTank: '15 – 24 ml per tangki 16L',
    dosagePerHaEstimate: '± 400 – 600 ml/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan merata pada tajuk daun dan batang saat larva instar awal baru menetas dari kelompok telur',
    applicationInterval: '10 – 14 hari',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Aman terhadap musuh alami (laba-laba Lycosa & kepik Cyrtorhinus) sehingga tidak memicu resurgensi wereng.',
    ],
    resistanceWarning: 'IRAC Grup 28. Rotasikan dengan Emamektin Benzoat / Abamektin (IRAC Grup 6) atau Spinetoram (IRAC Grup 5).',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Prevathon 50 SC / Belt Expert',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-proclaim-5sg',
    productName: 'Proclaim 5 SG / Siklon 5.7 WG / Agrimec 18 EC',
    alternativeBrands: ['Proclaim 5 SG', 'Siklon 5.7 WG', 'Agrimec 18 EC', 'Demolish 18 EC', 'Endure 120 SC', 'Curacron 500 EC'],
    manufacturer: 'PT Syngenta Indonesia / PT Nufarm / Corteva',
    registrationNumber: 'RI. 01010120011641',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Emamektin Benzoat 5% – 5,7% (atau Abamektin 18 g/l / Spinetoram 120 g/l)',
    concentration: '5% SG / 18 g/l EC',
    modeOfActionGroup: 'IRAC Grup 6 (Avermectin Translaminar) & Grup 5 (Spinosyn)',
    formulation: 'SG / GR / SL (Granul & Larutan Air)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Cabai', 'Jagung', 'Bawang Merah', 'Tomat'],
    targetOrganisms: [
      'Hama Putih Palsu / Ulat Pelipat Daun (Cnaphalocrocis medinalis)',
      'Ulat Grayak (Spodoptera exigua / S. litura) & Penggerek Polong/Buah',
      'Thrips (Thrips parvispinus) & Tungau pada Padi Palawija / Hortikultura',
    ],
    dosagePerLiter: '0,5 g/l (Proclaim/Siklon) atau 0,5 – 1 ml/l (Agrimec/Demolish)',
    dosagePer16LTank: '8 – 10 gram (Proclaim/Siklon) atau 10 – 15 ml (Abamektin) per tangki 16L',
    dosagePerHaEstimate: '± 200 – 250 g/ha (atau 300 – 400 ml/ha)',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan pada sore hari (15:30–17:30 WIB) karena bahan aktif translaminar menembus ke dalam lipatan daun tempat ulat bersembunyi',
    applicationInterval: '7 – 10 hari bila kerusakan daun melewati ambang ekonomi',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Hindari aplikasi pada siang terik karena bahan aktif avermectin sensitif terhadap sinar UV matahari langsung.',
    ],
    resistanceWarning: 'IRAC Grup 6. Sangat efektif sebagai rotasi untuk IRAC Grup 28 (Klorantraniliprol) pada ulat pelipat daun dan penggerek.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Proclaim 5 SG / Agrimec 18 EC',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-regent-50sc',
    productName: 'Regent 50 SC / Furadan 3 GR / Ferterra 0.4 GR',
    alternativeBrands: ['Regent 50 SC', 'Regent 0.3 GR', 'Furadan 3 GR', 'Curaterr 3 GR', 'Petrofur 3 GR', 'Ferterra 0.4 GR', 'Marshal 200 EC'],
    manufacturer: 'PT BASF Indonesia / PT FMC / PT Petrokimia Kayaku',
    registrationNumber: 'RI. 01010119951192',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Fipronil 50 g/l / Karbofuran 3% Granul / Karbosulfan 200 g/l',
    concentration: '50 g/l SC & 3% GR',
    modeOfActionGroup: 'IRAC Grup 2B (Phenylpyrazole) & Grup 1A (Karbamat Sistemik Akar/Tanah)',
    formulation: 'SC (Suspension Concentrate)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Jagung', 'Cabai', 'Kedelai'],
    targetOrganisms: [
      'Hama Perakaran & Tanah: Orong-orong / Anjing Tanah (Gryllotalpa orientalis), Uret (Holotrichia), Kepinding Tanah',
      'Nematoda Puru Akar (Meloidogyne graminicola) & Lalat Bibit Persemaian',
      'Penggerek Batang Fase Vegetatif Awal (Sundep) & Hama Ganjur',
    ],
    dosagePerLiter: '1 – 1,5 ml/l air (Regent 50 SC) atau tabur 15 – 20 kg/ha (Granul 3 GR)',
    dosagePer16LTank: '16 – 24 ml Regent 50 SC per tangki 16L (dikocor/semprot ke pangkal akar) atau tabur Furadan/Ferterra bersama pupuk',
    dosagePerHaEstimate: '± 500 ml/ha (cair) atau 15 – 20 kg/ha (granul tabur akar)',
    sprayVolumePerHa: '400 – 500 L/ha (atau tabur merata di zona perakaran macak-macak)',
    applicationMethod: 'Untuk hama akar (orong-orong/uret/nematoda): taburkan granul (Furadan 3 GR / Regent 0.3 GR / Ferterra) pada tanah macak-macak atau kocorkan larutan Regent 50 SC / Marshal 200 EC di pangkal perakaran',
    applicationInterval: 'Aplikasi pada persemaian atau fase vegetatif awal (0–30 HST) saat ditemukan kerusakan akar',
    preHarvestIntervalDays: 28,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
      'Sepatu Boot',
    ],
    safetyWarnings: [
      'DILARANG menggunakan الفipronil (Regent) atau Karbofuran pada saat tanaman padi sudah keluar malai/bunga atau mendekati panen.',
      'Gunakan sarung tangan nitril saat menabur insektisida granul di sekitar perakaran.',
    ],
    resistanceWarning: 'IRAC Grup 2B & 1A khusus untuk perlindungan zona perakaran, bibit, dan fase vegetatif awal.',
    labelSource: 'Direktori Pestisida Kementan RI & Pedoman Pengendalian Hama Tanah/Perakaran',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-curacron-500ec',
    productName: 'Curacron 500 EC / Bassa 500 EC / Dangke 40 WP',
    alternativeBrands: ['Curacron 500 EC', 'Bassa 500 EC', 'Dharmabas 500 EC', 'Dangke 40 WP', 'Lannate 25 WP', 'sidamethrin 50 EC'],
    manufacturer: 'PT Syngenta Indonesia / PT Dharma Guna Wibawa / Corteva',
    registrationNumber: 'RI. 0101011979381',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Profenofos 500 g/l / Fenobukarb (BPMC) 500 g/l / Metomil 40%',
    concentration: '500 g/l EC / 40% WP',
    modeOfActionGroup: 'IRAC Grup 1B (Organofosfat) & Grup 1A (Karbamat Kontak & Lambung Cepat)',
    formulation: 'EC (Emulsifiable Concentrate)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Cabai', 'Jagung', 'Kedelai', 'Bawang Merah'],
    targetOrganisms: [
      'Walang Sangit (Leptocorisa oratorius) Penghisap Bulir Gabah Masak Susu',
      'Kepik Hijau (Nezara viridula) & Kepik Coklat Penghisap Polong (Riptortus linearis)',
      'Ulat Grayak & Hama Penggerek Buah/Polong',
    ],
    dosagePerLiter: '1,5 – 2 ml per liter air (Dangke: 1 – 1,5 g/L)',
    dosagePer16LTank: '24 – 30 ml (Curacron/Bassa) atau 15 – 25 gram (Dangke) per tangki 16L',
    dosagePerHaEstimate: '± 600 – 800 ml/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan pada pagi hari (06:00–08:00) atau sore hari (16:00–17:30) saat walang sangit & kepik aktif di permukaan malai/polong',
    applicationInterval: '7 – 10 hari pada fase masak susu apabila populasi >5 ekor/m²',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
      'Sepatu Boot',
    ],
    safetyWarnings: [
      'Jangan menyemprot pada pukul 08:30–11:00 pagi saat bunga padi sedang mekar melakukan penyerbukan.',
    ],
    resistanceWarning: 'IRAC Grup 1A/1B bekerja cepat secara kontak dan uap terhadap serangga penghisap malai/gabah.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Pedoman PHT Walang Sangit BB Padi',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-nordox-56wp',
    productName: 'Nordox 56 WP / Kocide Opti 30 WG',
    alternativeBrands: ['Nordox 56 WP', 'Kocide Opti 30 WG', 'Copcide 77 WP', 'Kuproxat 345 SC', 'Champion 77 WP'],
    manufacturer: 'PT Santani Agro Perkasa / Nordox AS / Certis',
    registrationNumber: 'RI. 01020120021753',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Bakterisida & Fungisida',
    activeIngredient: 'Tembaga Oksida 56% (Cuprous Oxide) / Tembaga Hidroksida 77%',
    concentration: '56% WP (setara Cu 50%)',
    modeOfActionGroup: 'FRAC Grup M01 (Bakterisida & Fungisida Kontak Multi-Situs Ion Tembaga Cu²⁺)',
    formulation: 'WP (Wettable Powder)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Jagung', 'Cabai', 'Kakao'],
    targetOrganisms: [
      'Hawar Daun Bakteri / Kresek (Xanthomonas oryzae pv. oryzae)',
      'Bakteri Garis Daun / Bacterial Leaf Streak (Xanthomonas oryzae pv. oryzicola)',
      'Busuk Pangkal Batang / Akar Bakteri (Erwinia) & Bulai Jagung',
    ],
    dosagePerLiter: '2 – 2,5 g per liter air',
    dosagePer16LTank: '30 – 40 gram (2–3 sendok makan) per tangki 16L',
    dosagePerHaEstimate: '± 0,8 – 1,2 kg/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan merata pada tajuk daun saat muncul gejala awal garis basah kekuningan/pucat di tepi atau helai daun',
    applicationInterval: '7 – 10 hari bila cuaca lembap/berangin',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Jangan mencampur bakterisida tembaga dengan pupuk daun asam kuat atau insektisida organofosfat dalam satu tangki.',
      'Hentikan pemupukan Urea sementara saat gejala Kresek aktif.',
    ],
    resistanceWarning: 'FRAC Grup M01 (Kontak Multi-Situs). Risiko resistensi rendah dan efektif menekan eksudat bakteri pada permukaan daun.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Nordox 56 WP / Kocide',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-agrept-20wp',
    productName: 'Agrept 20 WP / Bactocyn 150 AL / Starner 20 WP',
    alternativeBrands: ['Agrept 20 WP', 'Bactocyn 150 AL', 'Plantomycin', 'Starner 20 WP (Asam Oksolinat)', 'Kasumin 5/75 WP (Kasugamisin)'],
    manufacturer: 'PT Mastalin Mandiri / Meiji Seika / Sumitomo Chemical',
    registrationNumber: 'RI. 0102011991982',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Bakterisida',
    activeIngredient: 'Streptomisin Sulfat 20% / Oksitetrasiklin 150 g/l / Asam Oksolinat 20%',
    concentration: '20% WP / 150 g/l AL',
    modeOfActionGroup: 'FRAC Grup 25 & Grup 31 (Bakterisida Sistemik Penghambat Sintesis Protein/DNA Bakteri)',
    formulation: 'WP (Wettable Powder)',
    allowedCommodities: ['Padi', 'Cabai', 'Tomat', 'Kentang', 'Kacang Hijau'],
    targetOrganisms: [
      'Hawar Daun Bakteri / Kresek Sistemik (Xanthomonas oryzae pv. oryzae)',
      'Busuk Lunak & Busuk Pangkal Batang Bakteri (Erwinia chrysanthemi)',
      'Layu Bakteri Perakaran (Ralstonia solanacearum) & Bacterial Panicle Blight (Burkholderia glumae)',
    ],
    dosagePerLiter: '1,5 – 2 g/l (Agrept/Starner) atau 1 – 2 ml/l (Bactocyn)',
    dosagePer16LTank: '24 – 32 gram (Agrept/Starner) atau 20 – 30 ml (Bactocyn) per tangki 16L',
    dosagePerHaEstimate: '± 600 – 800 g/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprotkan pada tajuk daun atau kocorkan di pangkal batang/akar; rotasikan secara bergilir dengan bakterisida Tembaga (Nordox/Kocide)',
    applicationInterval: '7 – 10 hari (maksimal 2 kali aplikasi per musim)',
    preHarvestIntervalDays: 14,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Kacamata Pelindung',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Gunakan secara bijak bergantian dengan bakterisida kontak tembaga atau agensia hayati Paenibacillus polymyxa.',
    ],
    resistanceWarning: 'FRAC Grup 25/31 (Bakterisida Sistemik). Wajib dirotasi dengan FRAC M01 (Tembaga Oksida/Hidroksida) untuk mencegah bakteri kebal.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Pedoman Pengendalian HDB/Bakteri',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-trichoderma-pgpr',
    productName: 'Anfus Trichoderma + PGPR + Powersoil Asam Humat',
    alternativeBrands: [
      'Anfus Trichoderma & Gliocladium',
      'Tricho-G / Gliocompost',
      'PGPR Akar Bambu (Pseudomonas fluorescens & Bacillus subtilis)',
      'Powersoil Humic Acid 60%',
      'Biotogrow / EM4 Pertanian',
      'Beauveria bassiana & Paenibacillus polymyxa BBPOPT',
    ],
    manufacturer: 'Balai Proteksi Tanaman / Produsen Biopestisida Terdaftar Kementan RI',
    registrationNumber: 'RI. 01020120165412',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Agensia Hayati & Pembenah Akar',
    activeIngredient: 'Trichoderma harzianum + Gliocladium sp. + Bakteri Perakaran PGPR + Asam Humat & Fulvat',
    concentration: '10⁸ CFU/g + Humic Acid 60%',
    modeOfActionGroup: 'Bio-Fungisida, Bio-Nematisida & Pemacu Pertumbuhan Serabut Akar Baru (Rhizosfer)',
    formulation: 'WP (Wettable Powder)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Cabai', 'Jagung', 'Bawang Merah', 'Kedelai', 'Tomat'],
    targetOrganisms: [
      'Busuk Akar & Pangkal Batang (Pythium, Fusarium, Rhizoctonia, Sclerotium)',
      'Keracunan Besi (Fe²⁺) & Sulfida (H₂S) pada Akar Hitam Sawah Masam',
      'Nematoda Puru Akar (Meloidogyne) & Pemulihan Perakaran Stagnan/Kerdil',
    ],
    dosagePerLiter: '5 – 10 g/l Trichoderma/PGPR + 2 g/l Asam Humat',
    dosagePer16LTank: '100 – 150 ml PGPR + 50 gram Trichoderma + 2 sendok makan Asam Humat per tangki 16L',
    dosagePerHaEstimate: '± 4 – 5 kg Trichoderma + 2 kg Asam Humat / Ha (campur pupuk dasar/kompos atau kocor)',
    sprayVolumePerHa: '400 – 500 L/ha (Kocor pangkal akar atau tabur bersama kompos)',
    applicationMethod: 'Kocorkan/semprotkan langsung ke zona perakaran dan tanah macak-macak pada sore hari setelah air asam dikuras dari petakan sawah',
    applicationInterval: '7 – 14 hari (aman digunakan rutin sepanjang musim tanpa residu kimia)',
    preHarvestIntervalDays: 0,
    requiredApd: [
      'Masker Respirator',
      'Sarung Tangan Nitril',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Jangan mencampur agensia hayati hidup (Trichoderma / PGPR / Beauveria) dengan fungisida atau bakterisida kimia dalam satu tangki; beri jeda minimal 3–5 hari.',
    ],
    resistanceWarning: 'Bebas risiko resistensi (0 hari masa tunggu panen). Memperbaiki struktur tanah, mengikat racun Fe²⁺/Al³⁺, dan memicu tumbuhnya akar putih baru.',
    labelSource: 'Pedoman Agensia Hayati Direktorat Perlindungan Tanaman Pangan & Balittanah Kementan RI',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
  {
    id: 'prod-nutrisi-kalium-zn',
    productName: 'Paket Pemulihan Hara & Akar (MKP Pak Tani + KCl Mahkota + ZnSO₄ + Dolomit)',
    alternativeBrands: [
      'MKP Pak Tani (Mono Kalium Phosphate 52% P₂O₅ + 34% K₂O)',
      'KCl Mahkota / MOP Meroke (60% K₂O)',
      'NPK Phonska Plus (15-15-15 + 9% S + 2000 ppm Zn)',
      'Zinc Sulfate (ZnSO₄ 21%) Petro / Microfol Zn',
      'Besmor Silika Cair (SiO₂) + Kapur Pertanian Dolomit Super',
    ],
    manufacturer: 'PT Pupuk Indonesia / PT Saprotan Utama / PT Meroke Tetap Jaya',
    registrationNumber: 'RI. 01030120186104',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Nutrisi & Pemulihan Fisiologis',
    activeIngredient: 'Fosfat & Kalium Mudah Larut (MKP/KCl) + Seng Sulfat (ZnSO₄) + Silika (SiO₂) + CaMg(CO₃)₂',
    concentration: '52% P₂O₅ + 34–60% K₂O + 21% Zn',
    modeOfActionGroup: 'Nutrisi Esensial Pembentukan Akar Baru, Penguat Dinding Sel & Penetral pH Tanah Masam',
    formulation: 'SG / GR / SL (Granul & Larutan Air)',
    allowedCommodities: ['Padi', 'Kacang Hijau', 'Jagung', 'Cabai', 'Bawang Merah', 'Kedelai', 'Tomat'],
    targetOrganisms: [
      'Defisiensi Kalium (Kahat K) & Keracunan Besi (Fe Toxicity / Bronzing & Akar Hitam)',
      'Defisiensi Nitrogen (Kahat N) & Defisiensi Seng (Kahat Zn / Tanaman Kerdil Akar Pendek)',
      'Penguatan Epidermis Daun/Batang pasca Serangan Kresek, Blas & Bercak Coklat',
    ],
    dosagePerLiter: '3 – 5 g/l air (MKP + ZnSO₄ semprot daun) atau 50 – 100 kg/ha (KCl/NPK tabur akar)',
    dosagePer16LTank: '50 – 80 gram (3–5 sendok makan) MKP Pak Tani + 20 gram ZnSO₄ per tangki 16L',
    dosagePerHaEstimate: '± 50 – 75 kg KCl/ha + 15 – 25 kg ZnSO₄/ha + 300 – 500 kg Dolomit/ha (bila pH < 5,5)',
    sprayVolumePerHa: '400 – 500 L/ha (Semprot tajuk atau tabur pada tanah macak-macak)',
    applicationMethod: 'Untuk pemulihan akar & bronzing: kuras genangan air asam, taburkan Dolomit + KCl + ZnSO₄ di sekitar perakaran, dan semprotkan MKP + Silika pada tajuk daun',
    applicationInterval: '7 – 14 hari sesuai pembacaan Bagan Warna Daun (BWD) dan pH tanah',
    preHarvestIntervalDays: 0,
    requiredApd: [
      'Sarung Tangan Nitril',
      'Masker Respirator',
      'Pakaian Lengan Panjang',
    ],
    safetyWarnings: [
      'Pada kasus infeksi jamur Blas atau bakteri Kresek aktif, tunda pemberian Urea (N tinggi) dan utamakan Kalium (KCl/MKP) + Silika terlebih dahulu.',
    ],
    resistanceWarning: 'Nutrisi fisiologis tanaman; menyeimbangkan rasio N:K dan mengoksidasi racun besi (Fe²⁺) di zona perakaran.',
    labelSource: 'Balai Penelitian Tanah (Balittanah) & Panduan Pemupukan Spesifik Lokasi BB Padi Kementan RI',
    verificationDate: '2026-03-15',
    dataVersion: 'v3.0-KEMENTAN-MULTI',
  },
];

/**
 * Katalog Penyakit, Hama & Defisiensi Hara sesuai Layar 11 Papan Presentasi UI TaniCerdas AI.
 */
export const PEST_DISEASE_CATALOG: PestDiseaseCatalogItem[] = [
  {
    id: 'cat-blas',
    name: 'Blas',
    scientificName: 'Pyricularia oryzae',
    category: 'Penyakit',
    commodity: 'Padi',
    visualKey: 'blas',
    shortSummary: 'Penyakit jamur yang menyerang daun, buku batang, dan leher malai padi. Gejala khas berupa bercak belah ketupat (lonjong meruncing) berwarna coklat dengan bagian tengah keabu-abuan.',
    symptoms: [
      'Bercak berbentuk belah ketupat (diamond-shaped) pada helai daun.',
      'Tepi bercak berwarna coklat tua/kemerahan dengan pusat keabu-abuan atau keputihan.',
      'Pada fase generatif menyebabkan busuk leher malai (neck blast) sehingga bulir hampa.',
    ],
    triggerConditions: 'Kelembapan udara tinggi (>85%), embun pagi tebal, jarak tanam terlalu rapat, dan pemupukan Nitrogen (Urea) berlebih.',
    ipmControl: [
      'Gunakan varietas tahan blas seperti Inpari 32 HDB atau Inpari 42.',
      'Atur jarak tanam dengan sistem Jajar Legowo 2:1 agar sirkulasi udara baik.',
      'Hindari pemberian pupuk Urea berlebihan; bagi aplikasi pupuk N menjadi 2–3 tahap berdasarkan BWD.',
      'Sanitasi jerami terinfeksi dan jaga ketinggian air saat fase keluar malai.',
    ],
    verifiedProductIds: ['prod-score-250ec', 'prod-antracol-70wp'],
    sourceReference: 'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Identifikasi Penyakit Padi',
  },
  {
    id: 'cat-tungro',
    name: 'Tungro',
    scientificName: 'Rice tungro bacilliform & spherical virus',
    category: 'Penyakit',
    commodity: 'Padi',
    visualKey: 'tungro',
    shortSummary: 'Penyakit kompleks dua virus yang ditularkan oleh vektor Wereng Hijau (Nephotettix virescens). Menyebabkan tanaman kerdil dan daun berubah kuning-oranye.',
    symptoms: [
      'Perubahan warna daun muda menjadi kuning hingga jingga (oranye) dimulai dari ujung daun.',
      'Pertumbuhan tanaman terhambat (kerdil) dan jumlah anakan berkurang drastis.',
      'Sebaran gejala di sawah tampak mengelompok (spot-spot kuning).',
    ],
    triggerConditions: 'Tanam tidak serempak, adanya sumber inokulum pada singgang/ratun padi, serta populasi wereng hijau tinggi.',
    ipmControl: [
      'Terapkan pola tanam serempak minimal dalam satu hamparan tersier irigasi.',
      'Eradikasi (cabut dan benamkan) rumpun tanaman yang menunjukkan gejala awal tungro.',
      'Bajak singgang/ratun sisa panen segera setelah panen selesai.',
      'Kendalikan serangga vektor Wereng Hijau apabila melampaui ambang ekonomi.',
    ],
    verifiedProductIds: ['prod-plenum-50wg'],
    sourceReference: 'Direktorat Perlindungan Tanaman Pangan Kementan RI — Pengendalian Tungro Padi',
  },
  {
    id: 'cat-wereng-coklat',
    name: 'Wereng Batang Coklat',
    scientificName: 'Nilaparvata lugens',
    category: 'Hama',
    commodity: 'Padi',
    visualKey: 'wereng',
    shortSummary: 'Hama utama padi yang menghisap cairan pelepah di pangkal batang. Serangan berat menyebabkan tanaman mengering seperti terbakar (hopperburn) dan menularkan virus kerdil rumput/kerdil hampa.',
    symptoms: [
      'Populasi nimfa dan imago wereng berwarna coklat berkumpul di pangkal batang dekat permukaan air.',
      'Daun menguning dari bawah kemudian mengering cepat berwarna coklat seperti terbakar (hopperburn).',
      'Terdapat embun jelaga hitam pada pangkal batang akibat ekskresi cairan manis wereng.',
    ],
    triggerConditions: 'Kerenyahan tanaman akibat Urea berlebih, kanopi rapat dan lembap, serta matinya musuh alami akibat penyemprotan insektisida spektrum luas.',
    ipmControl: [
      'Lakukan pengairan berselang (keringkan petakan sawah 3–4 hari) untuk menurunkan kelembapan mikro di pangkal batang.',
      'Lestarikan musuh alami seperti laba-laba (Lycosa pseudoannulata), kepik mirid (Cyrtorhinus), dan kumbang Paederus.',
      'Gunakan agens hayati jamur Beauveria bassiana pada sore hari.',
      'Gunakan insektisida selektif penghambat makan hanya bila populasi >10 ekor/rumpun pada fase vegetatif.',
    ],
    verifiedProductIds: ['prod-plenum-50wg'],
    sourceReference: 'BB Padi Sukamandi — Prosedur Operasional Standar Pengendalian WBC',
  },
  {
    id: 'cat-penggerek-batang',
    name: 'Penggerek Batang',
    scientificName: 'Scirpophaga incertulas',
    category: 'Hama',
    commodity: 'Padi',
    visualKey: 'penggerek',
    shortSummary: 'Larva ulat menggerek bagian dalam batang padi. Menyebabkan pucuk daun tengah mati mengering pada fase vegetatif (Sundep) dan malai hampa putih pada fase generatif (Beluk).',
    symptoms: [
      'Fase vegetatif (Sundep): Pucuk daun termuda menguning, menggulung,แห้ง mati dan mudah dicabut.',
      'Fase generatif (Beluk): Malai yang keluar berwarna putih hampa dan berdiri tegak.',
      'Ditemukan kelompok telur ngengat tertutup bulu halus coklat kekuningan pada daun serta lubang gerek pada batang.',
    ],
    triggerConditions: 'Penaburan benih terlalu awal sebelum puncak penerbangan ngengat dan pemotongan jerami panen yang terlalu tinggi.',
    ipmControl: [
      'Kumpulkan kelompok telur di persemaian dan pasang lampu perangkap (light trap) untuk memantau puncak penerbangan ngengat.',
      'Potong jerami serendah mungkin dekat permukaan tanah saat panen dan genangi lahan agar pupa dalam tunggul mati.',
      'Waktu tanam diatur agar tidak bertepatan dengan puncak populasi ngengat.',
    ],
    verifiedProductIds: ['prod-virtako-300sc'],
    sourceReference: 'Balai Besar Peramalan Organisme Pengganggu Tumbuhan (BBPOPT) Jatisari',
  },
  {
    id: 'cat-hawar-daun',
    name: 'Hawar Daun Bakteri (Kresek)',
    scientificName: 'Xanthomonas oryzae pv. oryzae',
    category: 'Penyakit',
    commodity: 'Padi',
    visualKey: 'hawar',
    shortSummary: 'Penyakit bakteri yang menyebabkan tepi daun mengering bergelombang berwarna kuning keabu-abuan. Serangan pada tanaman muda disebut Kresek.',
    symptoms: [
      'Garis basah kekuningan dimulai dari tepi ujung daun lalu meluas bergelombang ke arah pangkal.',
      'Pada pagi hari tampak butiran eksudat bakteri berwarna kuning keruh di tepi luka daun.',
      'Daun mengering keabu-abuan dan menggulung (gejala Kresek pada tanaman <30 HST).',
    ],
    triggerConditions: 'Angin kencang disertai hujan yang menimbulkan gesekan pelukaan daun, pemotongan ujung bibit saat pindah tanam, dan pupuk Nitrogen tinggi.',
    ipmControl: [
      'Tanam varietas tahan HDB seperti Inpari 32 HDB.',
      'Jangan memotong ujung daun bibit padi saat pindah tanam dari persemaian.',
      'Kurangi takaran pupuk Urea dan tambahkan pupuk Kalium (KCl / NPK) untuk memperkuat dinding sel daun.',
      'Atur pengairan berselang (jangan digenangi terus-menerus).',
    ],
    verifiedProductIds: ['prod-nordox-56wp'],
    sourceReference: 'BB Padi — Pengendalian Penyakit Hawar Daun Bakteri Secara Terpadu',
  },
  {
    id: 'cat-kahat-n',
    name: 'Defisiensi Nitrogen (Kahat N)',
    scientificName: 'Gangguan Fisiologis Hara Makro N',
    category: 'Defisiensi Hara',
    commodity: 'Padi',
    visualKey: 'kahat_n',
    shortSummary: 'Kekurangan unsur hara Nitrogen menyebabkan daun tua menguning merata dari ujung daun, tanaman kerdil, dan jumlah anakan sedikit.',
    symptoms: [
      'Daun bawah (daun tua) menguning seragam mulai dari ujung merambat ke tulang daun.',
      'Warna kanopi tanaman tampak hijau pucat kekuningan (skor Bagan Warna Daun / BWD < 3).',
      'Tidak ditemukan bercak belah ketupat ataupun koloni wereng di pangkal batang.',
    ],
    triggerConditions: 'Dosis pupuk Urea/NPK kurang, pencucian hara akibat air mengalir deras saat pemupukan, atau tanah miskin bahan organik.',
    ipmControl: [
      'Ukur tingkat kehijauan daun dengan Bagan Warna Daun (BWD) setiap 7–10 hari sejak 14 HST.',
      'Bila skor BWD di bawah 4, berikan pupuk Urea susulan 50–75 kg/Ha pada kondisi air macak-macak (pintu air ditutup 2–3 hari).',
      'Pastikan gulma sudah disiangi sebelum penaburan pupuk susulan.',
    ],
    verifiedProductIds: [],
    sourceReference: 'Panduan Pemupukan Spesifik Lokasi & Bagan Warna Daun (BWD) Kementan RI',
  },
];

export interface OfficialDiseaseRecord {
  id: OfficialDiseaseId;
  primaryPlantPart: DiagnosisResult['plantPart'];
  detectedName: string;
  scientificName: string;
  causeCategory: DiagnosisResult['causeCategory'];
  defaultConfidencePct: number;
  urgencyLevel: DiagnosisResult['urgencyLevel'];
  organSpecificAnatomyCheck: string;
  defaultVisibleSymptoms: string[];
  defaultVisualObservations: string;
  defaultDifferentialReasoning: string;
  diseaseInfoSummary: string;
  alternativeDiagnoses: {
    name: string;
    distinguishingCheck: string;
  }[];
  missingInformation: string[];
  followUpFieldChecks: string[];
  nonChemicalIpmActions: string[];
  biologicalAndSupportingRecommendations: NonNullable<DiagnosisResult['biologicalAndSupportingRecommendations']>;
  verifiedProductIds: string[];
  sourceReferences: string[];
}

/**
 * Daftar Resmi Penyakit, Hama, Gangguan Perakaran & Defisiensi Hara untuk Sinkronisasi Otomatis (Zero Mismatch)
 * antara hasil Gemini Vision (`matchedDiseaseId` + `detectedPlantPart`) dan Rekomendasi Multi-Bahan Aktif & Merk Dagang Kementan RI.
 */
export const OFFICIAL_DISEASE_REGISTRY: Record<OfficialDiseaseId, OfficialDiseaseRecord> = {
  blas_daun: {
    id: 'blas_daun',
    primaryPlantPart: 'Daun',
    detectedName: 'Penyakit Blas Daun (Pyricularia oryzae)',
    scientificName: 'Pyricularia oryzae (sin. Magnaporthe oryzae)',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 89,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Helai Daun: Bercak nekrotik berbentuk belah ketupat (meruncing di kedua ujung) dengan tepi coklat tua dan pusat abu-abu keputihan pada lamina daun.',
    defaultVisibleSymptoms: [
      'Bercak berbentuk belah ketupat (diamond/eye-shaped) meruncing di kedua ujung pada helai daun',
      'Tepi bercak berwarna coklat tua hingga coklat kemerahan nekrotik yang tegas',
      'Bagian pusat bercak berwarna abu-abu keputihan akibat sporulasi cendawan Pyricularia',
    ],
    defaultVisualObservations:
      'Tampak lesi nekrotik spesifik berbentuk belah ketupat (meruncing di kedua ujung) dengan tepi coklat tua gelap dan pusat berwarna abu-abu keputihan pada helai daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Blas Daun (Pyricularia oryzae) karena bentuk bercak belah ketupat meruncing dengan pusat abu-abu keputihan pada helai daun, berbeda dari Bercak Coklat (Bipolaris oryzae) yang berbentuk oval/bulat biji wijen merata tanpa pusat abu-abu, dan berbeda dari HDB/Kresek yang berupa jalur kuning jerami memanjang dari tepi daun.',
    diseaseInfoSummary:
      'Penyakit Blas disebabkan oleh jamur Pyricularia oryzae yang menginfeksi helai daun, buku batang, hingga leher malai (neck blast). Sangat dipicu oleh kelembapan udara tinggi (>85%), embun pagi tebal, jarak tanam rapat, dan pemupukan Nitrogen (Urea) berlebih.',
    alternativeDiagnoses: [
      {
        name: 'Penyakit Bercak Coklat (Bipolaris oryzae)',
        distinguishingCheck:
          'Bercak Coklat berbentuk bulat/oval kecil seperti biji wijen berwarna coklat tua merata tanpa pusat abu-abu berbentuk belah ketupat.',
      },
      {
        name: 'Bercak Coklat Sempit (Cercospora janseana)',
        distinguishingCheck:
          'Bercak Cercospora berbentuk garis-garis pendek sangat sempit sejajar tulang daun tanpa pusat abu-abu.',
      },
    ],
    missingInformation: [
      'Riwayat takaran pupuk Urea (Nitrogen) terakhir pada petakan ini',
      'Apakah gejala juga mulai terlihat pada buku batang atau leher malai',
    ],
    followUpFieldChecks: [
      'Amati 20 rumpun secara diagonal untuk menghitung persentase keparahan bercak belah ketupat pada daun',
      'Periksa buku batang dan leher malai apabila tanaman mendekati fase bunting/keluar malai',
      'Hentikan sementara penambahan pupuk Urea tunggal hingga infeksi jamur terkendali',
    ],
    nonChemicalIpmActions: [
      'Kurangi atau tunda pemupukan Urea (Nitrogen) berlebih dan imbangi dengan pupuk Kalium (KCl/MKP) + Silika untuk mempertebal dinding sel epidermis daun',
      'Pertahankan genangan air tipis 3–5 cm (kondisi tanah kering mempercepat pelepasan spora jamur Blas)',
      'Bersihkan gulma rerumputan di pematang yang menjadi inang alternatif jamur Pyricularia oryzae',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Bakteri Antagonis & Jamur Mikoparasit',
        activeSubstancesAndBrands: 'Paenibacillus polymyxa, Pseudomonas fluorescens (PGPR), Trichoderma harzianum (Anfus / Biotogrow)',
        dosageAndApplication: '100 ml PGPR + 50 g Trichoderma per tangki 16L, disemprotkan sore hari untuk menekan kecambah spora jamur.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Penguat Epidermis Silika & Kalium (Stop Urea Sementara)',
        activeSubstancesAndBrands: 'MKP Pak Tani (52% P₂O₅ + 34% K₂O), KCl Mahkota (60% K₂O), Besmor Silika Cair (SiO₂)',
        dosageAndApplication: 'Semprot 4–5 sendok makan MKP + 30 ml Silika Cair per tangki 16L untuk mengeraskan lapisan silika daun.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Manajemen Genangan Air Sawah',
        activeSubstancesAndBrands: 'Genangan Air Stabil 3–5 cm',
        dosageAndApplication: 'Jangan biarkan tanah sawah retak kering saat serangan Blas aktif karena stres kekeringan memicu pelepasan spora 3x lipat.',
      },
    ],
    verifiedProductIds: [
      'prod-fujiwan-400ec',
      'prod-score-250ec',
      'prod-amistartop-325sc',
      'prod-antracol-70wp',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Penyakit Blas',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Fujiwan 400 EC, Filia 525 SE, Score 250 EC, Amistartop 325 SC, Antracol 70 WP)',
    ],
  },
  kresek_hdb: {
    id: 'kresek_hdb',
    primaryPlantPart: 'Daun',
    detectedName: 'Penyakit Hawar Daun Bakteri (HDB / Kresek)',
    scientificName: 'Xanthomonas oryzae pv. oryzae (Xoo)',
    causeCategory: 'Penyakit Bakteri',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Tepi & Helai Daun: Jalur hawar nekrotik memanjang bergelombang warna kuning jerami hingga keputihan dimulai dari hidatoda tepi/ujung daun.',
    defaultVisibleSymptoms: [
      'Lesi hawar memanjang bergelombang berwarna kuning jerami hingga pucat keputihan dimulai dari ujung atau tepi daun menuju pangkal',
      'Batas antara jaringan hijau sehat dan jalur nekrosis kering tampak bergelombang kekuningan',
      'Ujung daun mengering dan menggulung tanpa adanya bercak belah ketupat jamur',
    ],
    defaultVisualObservations:
      'Teramati lesi memanjang bergelombang berwarna kuning jerami hingga pucat mengering yang berawal dari tepi dan ujung helai daun merambat menuju pangkal daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Hawar Daun Bakteri / Kresek (Xanthomonas oryzae) karena lesi memanjang bergelombang dari tepi/ujung daun berwarna kuning jerami pucat; BUKAN Blas Daun (tidak ada bercak belah ketupat berpusat abu-abu) dan BUKAN Hama Putih Palsu (seluruh ketebalan tepi daun mengering, bukan kerokan epidermis transparan).',
    diseaseInfoSummary:
      'Hawar Daun Bakteri (HDB / Kresek) disebabkan oleh bakteri Xanthomonas oryzae pv. oryzae yang masuk melalui pori air (hidatoda) di tepi daun atau luka gesekan daun saat hujan angin. Karena disebabkan oleh bakteri, penyakit ini WAJIB dikendalikan dengan bakterisida (Tembaga Oksida/Hidroksida atau Streptomisin/Asam Oksolinat) dan penguatan Kalium.',
    alternativeDiagnoses: [
      {
        name: 'Serangan Hama Putih Palsu / Pelipat Daun (Cnaphalocrocis medinalis)',
        distinguishingCheck:
          'Pada Hama Putih Palsu, daun terlipat memanjang dan garis putihnya merupakan selaput epidermis transparan bekas kerokan ulat.',
      },
      {
        name: 'Defisiensi Kalium (Kahat K)',
        distinguishingCheck:
          'Kahat K mengeringkan ujung daun TUA secara simetris kecoklatan tanpa menghasilkan cairan eksudat bakteri (ooze) saat diuji di air jernih.',
      },
    ],
    missingInformation: [
      'Apakah terlihat butiran eksudat bakteri kuning keruh pada tepi daun saat pagi hari (06:00–07:00)',
      'Riwayat hujan disertai angin kencang atau pemupukan Urea tinggi dalam 7 hari terakhir',
    ],
    followUpFieldChecks: [
      'Lakukan Uji Ooze Bakteri: potong 2–3 cm daun pada batas sehat-sakit, celupkan ke air jernih di gelas kaca selama 5 menit; jika keluar cairan keruh kekuningan seperti asap, positif bakteri HDB/Kresek',
      'Periksa apakah gejala menyebar mengikuti aliran air irigasi dari petakan hulu',
    ],
    nonChemicalIpmActions: [
      'Hentikan sementara pemupukan Urea (Nitrogen) dan aplikasikan pupuk Kalium (KCl / MKP) untuk memperkuat ketahanan jaringan epidermis daun',
      'Terapkan pengairan berselang (intermittent irrigation / macak-macak) dan jangan mengalirkan air dari petakan sakit ke petakan sehat',
      'Rotasikan bakterisida kontak Tembaga (Nordox 56 WP / Kocide Opti / Copcide) dengan bakterisida sistemik (Agrept 20 WP / Bactocyn / Starner 20 WP)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Bakteri Antagonis Penekan Xanthomonas',
        activeSubstancesAndBrands: 'Corynebacterium sp. / Paenibacillus polymyxa & Pseudomonas fluorescens (PGPR)',
        dosageAndApplication: '100–150 ml suspensi Corynebacterium / Paenibacillus per tangki 16L, disemprotkan sore hari setiap 7 hari.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Terapi Kalium Tinggi & Penghentian Urea',
        activeSubstancesAndBrands: 'MKP Pak Tani, KCl Mahkota (60% K₂O), Kalium Silika Cair',
        dosageAndApplication: 'Tabur KCl 50 kg/Ha di kondisi macak-macak dan semprot MKP 50 g/tangki 16L untuk menutup luka hidatoda daun.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Pengeringan Berselang (Macak-Macak)',
        activeSubstancesAndBrands: 'Sistem Irigasi AWD (Alternate Wetting & Drying)',
        dosageAndApplication: 'Keringkan genangan air sawah selama 3–4 hari agar kelembapan tajuk turun dan bakteri tidak menular lewat air.',
      },
    ],
    verifiedProductIds: [
      'prod-nordox-56wp',
      'prod-agrept-20wp',
      'prod-nutrisi-kalium-zn',
      'prod-trichoderma-pgpr',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian HDB / Kresek',
      'Direktori Pestisida Resmi Kementan RI (Nordox 56 WP, Kocide Opti, Agrept 20 WP, Bactocyn 150 AL, Starner 20 WP)',
    ],
  },
  bercak_coklat: {
    id: 'bercak_coklat',
    primaryPlantPart: 'Daun',
    detectedName: 'Penyakit Bercak Coklat Padi (Brown Spot)',
    scientificName: 'Bipolaris oryzae (sin. Helminthosporium oryzae)',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 91,
    urgencyLevel: 'Sedang',
    organSpecificAnatomyCheck:
      'Anatomi Helai Daun: Sebaran bintik nekrotik berbentuk oval membulat menyerupai biji wijen berwarna coklat tua dengan halo kuning tipis.',
    defaultVisibleSymptoms: [
      'Bintik-bintik oval atau bulat kecil berwarna coklat tua merata menyerupai biji wijen tersebar pada helai daun',
      'Terdapat lingkaran halo kekuningan tipis di sekeliling bercak coklat tua',
      'Bercak tidak meruncing belah ketupat dan tidak memiliki pusat abu-abu keputihan seperti Blas',
    ],
    defaultVisualObservations:
      'Tampak sebaran bintik-bintik berbentuk oval hingga bulat kecil berwarna coklat tua merata seperti biji wijen dengan halo kekuningan tipis pada helai daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Bercak Coklat (Bipolaris oryzae) karena bentuk bercak oval/bulat kecil menyerupai biji wijen berwarna coklat tua merata, berbeda dari Blas Daun (Pyricularia oryzae) yang berbentuk belah ketupat meruncing dengan pusat abu-abu keputihan.',
    diseaseInfoSummary:
      'Penyakit Bercak Coklat disebabkan oleh cendawan Bipolaris oryzae. Serangan ini sangat erat kaitannya dengan kondisi tanah sawah yang kurang subur, kahat Kalium (K), kahat Silika (Si), atau perakaran yang kurang sehat.',
    alternativeDiagnoses: [
      {
        name: 'Penyakit Blas Daun (Pyricularia oryzae)',
        distinguishingCheck:
          'Bercak Blas berbentuk belah ketupat meruncing di kedua ujung dengan pusat abu-abu keputihan.',
      },
      {
        name: 'Bercak Coklat Sempit (Cercospora janseana)',
        distinguishingCheck:
          'Bercak Cercospora berbentuk garis-garis pendek sangat sempit (lebar 1 mm) sejajar tulang daun.',
      },
    ],
    missingInformation: [
      'Riwayat pemupukan Kalium (KCl/NPK) dan penambahan bahan organik/kompos jerami pada lahan',
      'Apakah bercak juga mulai menyerang kulit gabah (glume blotch)',
    ],
    followUpFieldChecks: [
      'Periksa bentuk bercak dari dekat: bintik oval membulat seperti biji wijen menandakan Bipolaris oryzae',
      'Evaluasi kecukupan pupuk NPK dan KCl serta kondisi drainase petakan sawah',
    ],
    nonChemicalIpmActions: [
      'Perbaiki nutrisi tanaman dengan penambahan pupuk Kalium (KCl) dan kompos jerami matang sumber Silika',
      'Gunakan benih sehat bersertifikat dan sanitasi tunggul jerami sakit pasca panen',
      'Aplikasikan fungisida sistemik & kontak secara bergilir (Amistartop 325 SC, Score 250 EC, Nativo 75 WG, atau Antracol 70 WP)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Aplikasi Trichoderma & Kompos Jerami Matang',
        activeSubstancesAndBrands: 'Anfus Trichoderma harzianum + PGPR Pseudomonas fluorescens',
        dosageAndApplication: '50 g Trichoderma + 100 ml PGPR per tangki 16L untuk menekan inokulum spora di daun bawah dan tanah.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Koreksi Kahat Kalium, Seng & Silika',
        activeSubstancesAndBrands: 'KCl Mahkota (60% K₂O), NPK Phonska Plus (+Zn), MKP Pak Tani, Besmor Silika',
        dosageAndApplication: 'Tambahkan KCl 50–75 kg/Ha karena penyakit Bercak Coklat adalah indikator utama tanah kekurangan Kalium.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Perbaikan Aerasi & Drainase Tanah',
        activeSubstancesAndBrands: 'Pengairan Berselang (AWD)',
        dosageAndApplication: 'Hindari genangan air stagnan yang menghambat penyerapan Kalium oleh akar.',
      },
    ],
    verifiedProductIds: [
      'prod-amistartop-325sc',
      'prod-score-250ec',
      'prod-nativo-75wg',
      'prod-antracol-70wp',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Identifikasi Penyakit Bercak Coklat (Bipolaris oryzae)',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Amistartop 325 SC, Score 250 EC, Nativo 75 WG, Antracol 70 WP)',
    ],
  },
  hawar_pelepah: {
    id: 'hawar_pelepah',
    primaryPlantPart: 'Batang',
    detectedName: 'Penyakit Hawar Pelepah & Busuk Batang Padi (Sheath Blight)',
    scientificName: 'Rhizoctonia solani & Sclerotium oryzae',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 90,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Pelepah & Batang Bawah: Bercak besar oval berlapis menyerupai belang kulit ular berwarna abu-abu kehijauan dengan tepi coklat tua pada pelepah batang dekat permukaan air.',
    defaultVisibleSymptoms: [
      'Bercak besar berbentuk oval tidak beraturan berwarna abu-abu kehijauan di bagian tengah dengan tepi coklat tua tegas menyerupai belang kulit ular pada pelepah batang',
      'Lesi berkembang pada pelepah batang bagian bawah dekat permukaan air dan merambat ke atas',
      'Ditemukan butiran sklerotia jamur berwarna coklat kehitaman menempel pada permukaan pelepah batang yang lembap',
    ],
    defaultVisualObservations:
      'Pada bagian pelepah dan batang bawah terlihat bercak besar oval tidak beraturan berwarna abu-abu kehijauan pucat dengan tepi coklat tua berlapis menyerupai motif belang kulit ular.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Hawar Pelepah & Busuk Batang (Rhizoctonia solani) pada Batang/Pelepah karena ukuran bercak besar berlapis seperti belang kulit ular di pangkal pelepah, berbeda dari Blas Daun yang berukuran kecil belah ketupat di helai daun atas.',
    diseaseInfoSummary:
      'Hawar Pelepah disebabkan oleh cendawan tular-tanah Rhizoctonia solani yang menginfeksi pelepah batang dari batas permukaan air, terutama pada pertanaman rapat dengan kelembapan tajuk bawah tinggi dan dosis Nitrogen berlebih.',
    alternativeDiagnoses: [
      {
        name: 'Busuk Batang Padi (Sclerotium oryzae)',
        distinguishingCheck:
          'Belah pangkal batang untuk melihat adanya butiran sklerotia hitam kecil seperti bubuk lada di dalam rongga batang.',
      },
      {
        name: 'Serangan Wereng Batang Coklat (Nilaparvata lugens)',
        distinguishingCheck:
          'Pada serangan WBC ditemukan koloni nimfa/imago wereng hidup yang melompat di pangkal batang disertai embun jelaga.',
      },
    ],
    missingInformation: [
      'Sistem jarak tanam dan kerapatan kanopi rumpun padi saat ini',
      'Ketinggian genangan air di bawah tajuk tanaman',
    ],
    followUpFieldChecks: [
      'Singkap tajuk padi di 10 titik diagonal untuk memeriksa tinggi rambatan bercak belang kulit ular pada pelepah batang',
      'Periksa keberadaan butiran sklerotia coklat pada permukaan luar pelepah sakit',
    ],
    nonChemicalIpmActions: [
      'Keringkan air sawah secara berkala (pengairan berselang / AWD) untuk menurunkan kelembapan mikro di pangkal rumpun',
      'Bersihkan gulma air dan sisa jerami sakit yang menjadi tempat bertahan sklerotia jamur Rhizoctonia',
      'Arahkan nosel semprot ke pangkal pelepah batang menggunakan fungisida sistemik (Amistartop 325 SC, Nativo 75 WG / Anvil 50 SC, atau Score 250 EC)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Antagonis Cendawan Tular-Tanah (Trichoderma & Gliocladium)',
        activeSubstancesAndBrands: 'Anfus Trichoderma harzianum, Tricho-G, Gliocompost, Bakteri Streptomyces',
        dosageAndApplication: 'Taburkan 4–5 kg Trichoderma/Ha bersama pupuk atau semprotkan 60 g/tangki 16L langsung ke pangkal pelepah.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Penguatan Batang dengan Kalium & Silika',
        activeSubstancesAndBrands: 'KCl Mahkota, MKP Pak Tani, Besmor Silika Cair',
        dosageAndApplication: 'Aplikasikan KCl 50 kg/Ha dan kurangi takaran Urea agar pelepah batang keras dan tidak mudah ditembus hifa jamur.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Drainase Pangkal Batang & Sanitasi Pelepah',
        activeSubstancesAndBrands: 'Pengeringan Sawah 3–5 Hari',
        dosageAndApplication: 'Buka saluran pembuangan air agar sinar matahari dan angin masuk ke sela rumpun batang bawah.',
      },
    ],
    verifiedProductIds: [
      'prod-amistartop-325sc',
      'prod-nativo-75wg',
      'prod-score-250ec',
      'prod-trichoderma-pgpr',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Hawar Pelepah',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Amistartop 325 SC, Nativo 75 WG, Anvil 50 SC, Score 250 EC)',
    ],
  },
  bercak_coklat_sempit: {
    id: 'bercak_coklat_sempit',
    primaryPlantPart: 'Daun',
    detectedName: 'Penyakit Bercak Coklat Sempit (Narrow Brown Leaf Spot / Cercospora)',
    scientificName: 'Cercospora janseana (Padi) / Cercospora canescens (Kacang Hijau)',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 89,
    urgencyLevel: 'Sedang',
    organSpecificAnatomyCheck:
      'Anatomi Helai Daun: Lesi garis-garis pendek sangat sempit berwarna coklat kemerahan yang tersusun sejajar urat daun.',
    defaultVisibleSymptoms: [
      'Bercak berbentuk garis-garis pendek sangat sempit (lebar 1–1,5 mm) berwarna coklat kemerahan sejajar tulang daun',
      'Jumlah garis nekrotik sempit cukup banyak pada daun tua hingga daun bendera menjelang fase generatif',
      'Tidak memiliki pusat abu-abu berbentuk belah ketupat',
    ],
    defaultVisualObservations:
      'Tampak lesi berupa garis-garis linear pendek dan sempit berwarna coklat tua kemerahan yang tersusun sejajar mengikuti urat/tulang daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Bercak Coklat Sempit (Cercospora) karena lesi berbentuk garis pendek sempit sejajar tulang daun, bukan bercak belah ketupat (Blas) maupun bintik bulat biji wijen (Bipolaris).',
    diseaseInfoSummary:
      'Bercak Coklat Sempit disebabkan oleh jamur Cercospora yang umumnya berkembang pada fase anakan maksimum hingga pematangan bulir/polong, terutama pada tanah yang kekurangan Kalium.',
    alternativeDiagnoses: [
      {
        name: 'Penyakit Blas Daun (Pyricularia oryzae)',
        distinguishingCheck:
          'Blas membentuk bercak belah ketupat yang jauh lebih lebar dengan pusat abu-abu keputihan.',
      },
    ],
    missingInformation: [
      'Umur tanaman (HST) dan kecukupan pupuk Kalium (KCl/MKP) pada musim ini',
    ],
    followUpFieldChecks: [
      'Periksa apakah garis coklat sempit juga menyebar ke pelepah daun dan tangkai malai',
      'Evaluasi ketahanan daun bendera pada 20 rumpun sampel diagonal',
    ],
    nonChemicalIpmActions: [
      'Tambahkan pupuk Kalium (KCl / MKP) sesuai rekomendasi untuk memperlambat penuaan jaringan daun bendera',
      'Benamkan sisa jerami terinfeksi setelah panen dan bersihkan gulma pematang',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Semprot Agensia Hayati Trichoderma & PGPR',
        activeSubstancesAndBrands: 'Trichoderma harzianum + Pseudomonas fluorescens',
        dosageAndApplication: '100 ml PGPR per tangki 16L disemprotkan pada sore hari.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Suplemen Kalium & Fosfat Fase Generatif',
        activeSubstancesAndBrands: 'MKP Pak Tani, KCl Mahkota, Gandasil B',
        dosageAndApplication: 'Semprot MKP 4 sendok makan per tangki 16L agar daun bendera tetap hijau sehat hingga pengisian bulir selesai.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Sanitasi Sisa Tanaman Sakit',
        activeSubstancesAndBrands: 'Dekomposisi Jerami dengan Dekomposer EM4 / Trichoderma',
        dosageAndApplication: 'Benamkan tunggul terinfeksi setelah panen agar spora tidak terbawa ke musim berikutnya.',
      },
    ],
    verifiedProductIds: [
      'prod-score-250ec',
      'prod-amistartop-325sc',
      'prod-nativo-75wg',
      'prod-antracol-70wp',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) Kementan RI',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Score 250 EC, Amistartop 325 SC, Nativo 75 WG, Antracol 70 WP)',
    ],
  },
  tungro: {
    id: 'tungro',
    primaryPlantPart: 'Daun',
    detectedName: 'Gejala Penyakit Virus Tungro (Vektor Wereng Hijau)',
    scientificName: 'Rice Tungro Bacilliform Virus (RTBV) & RTSV',
    causeCategory: 'Penyakit Virus',
    defaultConfidencePct: 90,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Daun Muda & Tajuk Rumpun: Perubahan warna kuning-oranye cerah dari ujung daun muda disertai pertumbuhan rumpun kerdil dan anakan berkurang.',
    defaultVisibleSymptoms: [
      'Daun muda berubah warna menjadi kuning cerah hingga kuning-oranye (jingga) dimulai dari ujung daun',
      'Tanaman tampak kerdil dengan jumlah anakan berkurang dan tinggi kanopi tidak merata',
      'Helai daun bersih dari bercak belah ketupat jamur namun agak melintir',
    ],
    defaultVisualObservations:
      'Teramati perubahan warna (diskolorasi) kuning-oranye cerah yang khas pada helai daun muda dimulai dari ujung daun disertai gejala penghambatan tumbuh (kerdil) tanpa bercak nekrotik jamur.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Virus Tungro karena warna kuning-oranye cerah muncul pada daun muda disertai gejala kerdil tanpa bercak jamur; berbeda dari Kahat Nitrogen yang menguning pucat seragam pada daun tua (bawah).',
    diseaseInfoSummary:
      'Tungro disebabkan oleh kompleks virus RTBV dan RTSV yang ditularkan oleh serangga vektor Wereng Hijau (Nephotettix virescens). PENTING: Obat jamur (fungisida) TIDAK menyembuhkan virus; pengendalian wajib difokuskan pada eradikasi rumpun sakit, pemberian nutrisi imun (Zn + Silika), dan pengendalian vektor Wereng Hijau dengan beberapa pilihan bahan aktif insektisida.',
    alternativeDiagnoses: [
      {
        name: 'Defisiensi Nitrogen (Kahat N)',
        distinguishingCheck:
          'Pada Kahat N, warna kuning pucat dimulai dari daun TUA (bawah) secara merata di seluruh petakan dan tidak ditemukan Wereng Hijau.',
      },
      {
        name: 'Keracunan Besi (Fe Toxicity)',
        distinguishingCheck:
          'Terdapat bintik-bintik coklat kemerahan halus (bronzing) pada daun tua di tanah sawah masam tergenang.',
      },
    ],
    missingInformation: [
      'Apakah ditemukan populasi serangga Wereng Hijau (Nephotettix virescens) saat tajuk tanaman ditepuk pagi hari',
      'Apakah jadwal tanam di hamparan sekitar dilakukan serempak',
    ],
    followUpFieldChecks: [
      'Lakukan pengamatan jaring ayun atau tepuk rumpun pada pagi hari untuk memeriksa keberadaan vektor Wereng Hijau',
      'Lakukan uji Yodium (Iodine Test) bersama petugas POPT/PPL untuk mengonfirmasi akumulasi pati pada daun',
    ],
    nonChemicalIpmActions: [
      'Eradikasi selektif (roguing): cabut dan benamkan rumpun tanaman yang bergejala Tungro awal agar tidak menjadi sumber penularan virus ke rumpun sehat',
      'Terapkan pola tanam serempak dan gunakan varietas tahan Tungro (seperti Inpari 36/37 Lanrang)',
      'Kendalikan serangga vektor Wereng Hijau secara rotasi menggunakan Pimetrozin (Plenum/Chess), Buprofezin/Dinotefuran (Applaud/Oshin/Mipcinta), atau Tiametoksam (Virtako/Actara)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Jamur Entomopatogen Pemangsa Wereng Hijau',
        activeSubstancesAndBrands: 'Beauveria bassiana & Metarhizium anisopliae + PGPR Pemacu Imunitas Sistemik',
        dosageAndApplication: 'Semprotkan 100 g Beauveria bassiana per tangki 16L pada sore hari ke tajuk dan pangkal rumpun.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Booster Pemulihan Klorofil & Imunitas (Seng + Kalium + Asam Amino)',
        activeSubstancesAndBrands: 'Zinc Sulfate (ZnSO₄ 21%), MKP Pak Tani, Asam Humat & Pupuk Mikro Lengkap',
        dosageAndApplication: 'Aplikasikan ZnSO₄ 20 g + MKP 50 g per tangki 16L untuk membantu ketahanan tanaman sehat di sekitarnya.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Sanitasi Rumpun Sakit (Roguing) & Perangkap Lampu',
        activeSubstancesAndBrands: 'Pencabutan Rumpun Terinfeksi & Light Trap',
        dosageAndApplication: 'Cabut dan benamkan rumpun yang sudah kerdil oranye ke dalam lumpur agar tidak dihisap wereng hijau dan ditularkan ke rumpun lain.',
      },
    ],
    verifiedProductIds: [
      'prod-plenum-50wg',
      'prod-applaud-10wp',
      'prod-virtako-300sc',
      'prod-nutrisi-kalium-zn',
    ],
    sourceReferences: [
      'Loka Penelitian Penyakit Tungro & BB Padi Kementan RI — SOP Pengendalian Terpadu Tungro',
      'Direktori Pestisida Resmi Kementan RI (Plenum 50 WG, Chess 50 WG, Applaud 10 WP, Oshin 20 SG, Mipcinta 50 WP, Virtako 300 SC)',
    ],
  },
  hama_putih_palsu: {
    id: 'hama_putih_palsu',
    primaryPlantPart: 'Daun',
    detectedName: 'Serangan Hama Putih Palsu / Ulat Pelipat & Pemakan Daun',
    scientificName: 'Cnaphalocrocis medinalis / Spodoptera spp.',
    causeCategory: 'Serangan Hama',
    defaultConfidencePct: 91,
    urgencyLevel: 'Sedang',
    organSpecificAnatomyCheck:
      'Anatomi Helai Daun: Helai daun terlipat/menggulung memanjang direkatkan benang sutra dengan jendela garis putih transparan bekas kerokan klorofil ulat.',
    defaultVisibleSymptoms: [
      'Terdapat alur garis-garis putih transparan memanjang sejajar tulang daun akibat jaringan klorofil dikerok ulat',
      'Helai daun tampak terlipat atau menggulung memanjang direkatkan oleh benang sutra larva',
      'Tersisa lapisan epidermis putih tipis yang tembus cahaya pada area bekas gigitan larva',
    ],
    defaultVisualObservations:
      'Pada helai daun terlihat jelas alur garis putih transparan memanjang sejajar tulang daun akibat jaringan hijau mesofil dikerok ulat, disertai lipatan pada tepi helai daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Hama Putih Palsu (Cnaphalocrocis medinalis) karena lesi berupa jendela putih transparan bekas kerokan klorofil sejajar tulang daun dan lipatan daun; BUKAN HDB/Kresek (yang mengeringkan seluruh jaringan tepi daun menjadi kuning jerami) dan BUKAN Blas Daun.',
    diseaseInfoSummary:
      'Larva ngengat Cnaphalocrocis medinalis melipat helai daun padi dan mengerok jaringan hijau klorofil dari dalam lipatan sehingga daun tampak bergaris-garis putih transparan. Pengendalian menggunakan beberapa pilihan bahan aktif insektisida sistemik/translaminar penembus lipatan daun (Klorantraniliprol, Flubendiamida, Emamektin Benzoat, Abamektin, atau Spinetoram).',
    alternativeDiagnoses: [
      {
        name: 'Hawar Daun Bakteri / Kresek (Xanthomonas oryzae)',
        distinguishingCheck:
          'Pada Kresek, lesi dimulai dari tepi ujung daun bergelombang warna kuning jerami tanpa lipatan daun atau kotoran ulat.',
      },
      {
        name: 'Hama Putih / Caseworm (Nymphula depunctalis)',
        distinguishingCheck:
          'Ujung daun terpotong lurus seperti digunting dan potongan tabung daun mengapung di air.',
      },
    ],
    missingInformation: [
      'Persentase daun bendera atau daun teratas yang mengalami kerusakan (>15% adalah ambang kendali)',
      'Keberadaan ulat hijau kekuningan aktif di dalam lipatan daun',
    ],
    followUpFieldChecks: [
      'Buka lipatan daun padi secara perlahan untuk memastikan keberadaan larva ulat hijau kekuningan atau kotoran ulat di dalamnya',
      'Hitung persentase daun rusak pada 20 rumpun sampel diagonal',
    ],
    nonChemicalIpmActions: [
      'Hindari pemupukan Urea (Nitrogen) berlebihan yang membuat daun terlalu rimbun dan disukai ngengat betina untuk bertelur',
      'Lestarikan parasitoid telur (Trichogramma spp.) dan laba-laba predator di sawah',
      'Gunakan pilihan insektisida sistemik/translaminar terdaftar (Prevathon 50 SC, Belt Expert 480 SC, Virtako 300 SC, atau Proclaim 5 SG / Siklon 5.7 WG) bila kerusakan melewati ambang ekonomi',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Bio-Insektisida Ulat (Bacillus thuringiensis & Beauveria)',
        activeSubstancesAndBrands: 'Bacillus thuringiensis (Turex WP / Dipel) + Beauveria bassiana + Ekstrak Mimba (Azadirachtin)',
        dosageAndApplication: 'Semprotkan 25 g Bacillus thuringiensis per tangki 16L pada sore hari; racun perut biologi ini mematikan ulat di dalam lipatan daun.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Penguatan Silika & Kalium agar Daun Tidak Lunak',
        activeSubstancesAndBrands: 'MKP Pak Tani, KCl Mahkota, Besmor Silika Cair',
        dosageAndApplication: 'Semprot Silika Cair 30 ml + MKP 40 g per tangki 16L agar epidermis daun keras dan ulat sulit mengerok klorofil.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Pengeringan Sawah Sementara & Penyapuan Embun',
        activeSubstancesAndBrands: 'Drainase Sawah 3 Hari',
        dosageAndApplication: 'Keringkan air sawah selama 3 hari untuk menurunkan kelembapan mikro tempat ulat berkembang.',
      },
    ],
    verifiedProductIds: [
      'prod-prevathon-50sc',
      'prod-virtako-300sc',
      'prod-proclaim-5sg',
      'prod-nutrisi-kalium-zn',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Hama Putih Palsu',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Prevathon 50 SC, Belt Expert 480 SC, Virtako 300 SC, Proclaim 5 SG, Siklon 5.7 WG, Agrimec 18 EC)',
    ],
  },
  wereng_batang_coklat: {
    id: 'wereng_batang_coklat',
    primaryPlantPart: 'Batang',
    detectedName: 'Serangan Wereng Batang Coklat (WBC / Hopperburn)',
    scientificName: 'Nilaparvata lugens Stål',
    causeCategory: 'Serangan Hama',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Pangkal Batang & Hamparan Rumpun: Pangkal pelepah batang berwarna coklat kehitaman disertai koloni nimfa/imago wereng dan pengeringan rumpun coklat kemerahan seperti terbakar (hopperburn).',
    defaultVisibleSymptoms: [
      'Hamparan atau rumpun padi menguning lalu mengering coklat kemerahan seperti terbakar (gejala hopperburn)',
      'Pangkal batang berwarna coklat kehitaman disertai koloni nimfa/imago wereng di atas permukaan air',
      'Terdapat lapisan jelaga hitam tipis pada pangkal pelepah akibat sekresi embun madu wereng',
    ],
    defaultVisualObservations:
      'Teramati gejala mengering coklat kemerahan seperti terbakar (hopperburn) pada rumpun/hamparan padi disertai kerusakan nekrotik coklat kehitaman pada pangkal batang.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Wereng Batang Coklat (Nilaparvata lugens / Hopperburn) karena pola pengeringan rumpun berwarna coklat terbakar dari pangkal batang ke tajuk atas, berbeda dari Blas Daun yang bercaknya berbentuk belah ketupat berpusat abu-abu dan berbeda dari Hawar Pelepah yang membentuk belang kulit ular.',
    diseaseInfoSummary:
      'Wereng Batang Coklat (WBC) menghisap cairan floem di pangkal batang padi sehingga tanaman mengering cepat (hopperburn) dan menularkan virus Kerdil Rumput/Kerdil Hampa. Dikendalikan dengan pengeringan sawah (AWD) dan rotasi multi-bahan aktif insektisida spesifik wereng (Pimetrozin, Buprofezin, Dinotefuran, Triflumezopyrim, BPMC, atau Tiametoksam).',
    alternativeDiagnoses: [
      {
        name: 'Penyakit Hawar Pelepah (Rhizoctonia solani)',
        distinguishingCheck:
          'Pada Hawar Pelepah terdapat bercak oval besar menyerupai belang kulit ular tanpa populasi serangga wereng yang melompat.',
      },
      {
        name: 'Busuk Batang (Sclerotium oryzae)',
        distinguishingCheck:
          'Ditemukan butiran sklerotia hitam kecil di dalam rongga batang tanpa koloni wereng.',
      },
    ],
    missingInformation: [
      'Rata-rata jumlah ekor wereng per rumpun dari 20 rumpun pengamatan diagonal',
      'Populasi musuh alami (laba-laba Lycosa & kepik Cyrtorhinus) di pangkal rumpun',
    ],
    followUpFieldChecks: [
      'Singkap rumpun padi dan tepuk perlahan pangkal batang di 20 titik diagonal untuk menghitung rata-rata ekor wereng per rumpun (ambang ekonomi: >10 ekor/rumpun fase vegetatif)',
      'Periksa ketinggian genangan air dan kelembapan di bawah kanopi',
    ],
    nonChemicalIpmActions: [
      'Keringkan petakan sawah selama 3–4 hari (pengairan berselang / AWD) untuk menurunkan kelembapan pangkal batang dan menghambat penetasan telur wereng',
      'Hindari penyemprotan insektisida piretroid spektrum luas (seperti sipermetrin/deltametrin pada padi) karena membunuh laba-laba predator dan memicu ledakan wereng (resurgensi)',
      'Gunakan pilihan bahan aktif spesifik wereng secara bergilir: Pimetrozin (Plenum 50 WG / Chess 50 WG), Buprofezin/Dinotefuran/BPMC (Applaud 10 WP / Oshin 20 SG / Mipcinta 50 WP / Bassa 500 EC), atau Tiametoksam+Klorantraniliprol (Virtako 300 SC)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Jamur Entomopatogen Pemangsa Wereng (Beauveria & Metarhizium)',
        activeSubstancesAndBrands: 'Beauveria bassiana, Metarhizium anisopliae, Hirsutella citriformis + Minyak Mimba',
        dosageAndApplication: '100 gram bubuk spora Beauveria/Metarhizium per tangki 16L, disemprotkan sore hari langsung ke pangkal batang.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Stop Pupuk Urea & Perkuat Batang dengan Silika + Kalium',
        activeSubstancesAndBrands: 'KCl Mahkota, MKP Pak Tani, Besmor Silika Cair (SiO₂)',
        dosageAndApplication: 'Semprot Silika Cair 30 ml + MKP 50 g per tangki 16L agar pelepah batang keras dan стилеt wereng gagal menusuk floem.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Keringkan Genangan Air Sawah & Buka Lorong Angin',
        activeSubstancesAndBrands: 'Drainase Tuntas 3–5 Hari & Penyiangan Lorong Legowo',
        dosageAndApplication: 'Kuras air sawah hingga tanah macak-macak/retak rambut agar sinar matahari masuk ke pangkal batang.',
      },
    ],
    verifiedProductIds: [
      'prod-plenum-50wg',
      'prod-applaud-10wp',
      'prod-virtako-300sc',
      'prod-curacron-500ec',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Prosedur Operasional Standar Pengendalian WBC',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Plenum 50 WG, Chess 50 WG, Applaud 10 WP, Oshin 20 SG, Mipcinta 50 WP, Bassa 500 EC, Virtako 300 SC)',
    ],
  },
  sundep_beluk: {
    id: 'sundep_beluk',
    primaryPlantPart: 'Batang',
    detectedName: 'Serangan Penggerek Batang Padi (Sundep / Beluk)',
    scientificName: 'Scirpophaga incertulas / Scirpophaga innotata',
    causeCategory: 'Serangan Hama',
    defaultConfidencePct: 91,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Batang & Titik Tumbuh: Terdapat lubang gerekan larva pada ruas batang yang memutus jaringan pengangkut sehingga pucuk tengah mengering mati (Sundep) atau malai keluar putih hampa (Beluk).',
    defaultVisibleSymptoms: [
      'Pucuk daun muda di tengah anakan menggulung, mengering kecoklatan, dan mati (gejala Sundep) atau malai keluar putih hampa tegak (gejala Beluk)',
      'Tunas tengah atau malai yang kering mudah tercabut saat ditarik perlahan',
      'Terdapat lubang gerekan kecil dan bekas kotoran larva ulat pada ruas batang padi',
    ],
    defaultVisualObservations:
      'Teramati pucuk daun tengah mengering mati (Sundep) atau malai putih hampa berdiri tegak (Beluk) akibat jaringan pengangkut di dalam batang terputus oleh gerekan larva.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Penggerek Batang Padi (Sundep/Beluk) karena kematian spesifik pada pucuk tengah atau malai putih hampa menyeluruh dengan lubang gerekan batang, berbeda dari Blas Leher Malai di mana buku leher malai menghitam dan malai tidak mudah dicabut.',
    diseaseInfoSummary:
      'Larva ulat penggerek batang memotong titik tumbuh di bagian dalam batang padi. Serangan pada fase vegetatif menyebabkan Sundep (pucuk mati), sedangkan serangan pada fase generatif menyebabkan Beluk (malai putih hampa). Dikendalikan dengan pilihan insektisida sistemik penembus batang (Klorantraniliprol, Tiametoksam, Flubendiamida, Fipronil, Karbofuran, atau Emamektin Benzoat).',
    alternativeDiagnoses: [
      {
        name: 'Blas Leher Malai (Pyricularia oryzae)',
        distinguishingCheck:
          'Pada Blas Leher, buku leher malai berwarna coklat kehitaman membusuk dan tangkai malai TIDAK mudah tercabut.',
      },
      {
        name: 'Serangan Hama Ganjur (Orseolia oryzae)',
        distinguishingCheck:
          'Pucuk padi berubah bentuk menyerupai daun bawang (pentil) bulat memanjang berwarna hijau pucat.',
      },
    ],
    missingInformation: [
      'Keberadaan kelompok telur ngengat tertutup bulu halus coklat pada permukaan daun',
      'Persentase anakan atau malai terserang di petakan sawah',
    ],
    followUpFieldChecks: [
      'Tarik pucuk daun tengah atau malai yang mengering; jika mudah terlepas dan pangkalnya tampak bekas gigitan ulat, positif penggerek batang',
      'Belah 5 batang sampel untuk memeriksa keberadaan larva ulat hidup di dalam rongga batang',
    ],
    nonChemicalIpmActions: [
      'Kumpulkan dan musnahkan kelompok telur penggerek batang pada permukaan daun sejak di persemaian',
      'Atur genangan air sesaat untuk mendorong kepompong naik lalu keringkan, serta potong tunggul jerami rendah saat panen',
      'Gunakan pilihan bahan aktif sistemik & translaminar terdaftar: Klorantraniliprol+Tiametoksam (Virtako 300 SC), Klorantraniliprol/Flubendiamida (Prevathon 50 SC / Belt Expert 480 SC / Ferterra 0.4 GR), Fipronil/Karbofuran fase awal (Regent 50 SC / Furadan 3 GR), atau Emamektin Benzoat (Proclaim 5 SG)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Pelepasan Parasitoid Telur & Beauveria bassiana',
        activeSubstancesAndBrands: 'Parasitoid Trichogramma japonicum, Telenomus rowani + Jamur Beauveria bassiana & Bacillus thuringiensis',
        dosageAndApplication: 'Semprotkan Beauveria bassiana + Bt 50 g/tangki 16L pada sore hari saat ngengat mulai bertelur (4 hari setelah penerbangan ngengat).',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Pemulihan Anakan Baru (Kompensasi Vegetatif)',
        activeSubstancesAndBrands: 'NPK Phonska Plus + Silika Cair + Asam Humat',
        dosageAndApplication: 'Pada serangan Sundep fase vegetatif (<35 HST), tanaman padi masih sanggup membentuk anakan baru bila diberi NPK berimbang & air macak-macak.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Perangkap Lampu (Light Trap) & Penggenangan Kepompong',
        activeSubstancesAndBrands: 'Lampu Perangkap Malam Hari',
        dosageAndApplication: 'Pasang lampu perangkap di atas baskom air sabun pada malam hari untuk menangkap ngengat dewasa sebelum bertelur.',
      },
    ],
    verifiedProductIds: [
      'prod-virtako-300sc',
      'prod-prevathon-50sc',
      'prod-regent-50sc',
      'prod-proclaim-5sg',
    ],
    sourceReferences: [
      'Balai Besar Peramalan Organisme Pengganggu Tumbuhan (BBPOPT) Jatisari & BB Padi',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Virtako 300 SC, Prevathon 50 SC, Belt Expert 480 SC, Ferterra 0.4 GR, Regent 50 SC, Furadan 3 GR, Proclaim 5 SG)',
    ],
  },
  busuk_akar_keracunan_besi: {
    id: 'busuk_akar_keracunan_besi',
    primaryPlantPart: 'Akar',
    detectedName: 'Busuk Akar & Toksisitas Besi / Sulfida Tanah (Fe²⁺ / H₂S & Cendawan Akar)',
    scientificName: 'Pythium spp. / Fusarium moniliforme / Gaeumannomyces & Keracunan Reduksi Fe²⁺ / H₂S',
    causeCategory: 'Gangguan Perakaran & Toksisitas Tanah',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Sistem Perakaran (Akar): Serabut akar tampak menghitam pekat atau coklat busuk berlumpur, jumlah akar rambut putih segar sangat sedikit/putus, berbau belerang (H₂S), dan terdapat selaput karat besi kemerahan di sekitar zona perakaran.',
    defaultVisibleSymptoms: [
      'Serabut akar berwarna hitam pekat atau coklat tua membusuk, lunak, dan mudah putus saat rumpun dicabut dari tanah',
      'Tercium bau busuk menyengat seperti telur busuk (gas Hidrogen Sulfida / H₂S) atau tampak lapisan karat kemerahan (toksisitas Besi Fe²⁺) pada akar',
      'Pertumbuhan akar rambut putih baru terhenti total sehingga penyerapan pupuk NPK macet dan rumpun menjadi kerdil/stagnan',
    ],
    defaultVisualObservations:
      'Objek pada foto adalah bagian AKAR tanaman yang dicabut dari tanah: terlihat jelas sistem perakaran serabut mengalami pembusukan berwarna coklat tua hingga hitam pekat berlumpur, minim akar putih sehat, disertai indikasi reduksi anaerob (H₂S / Fe²⁺) dan infeksi cendawan akar.',
    defaultDifferentialReasoning:
      'Didiagnosis secara presisi sebagai Busuk Akar & Toksisitas Besi/Sulfida (pada bagian Akar) karena foto menampilkan anatomi perakaran yang menghitam dan membusuk; BUKAN penyakit daun (seperti Blas atau Kresek) dan berbeda dari serangan Orong-orong yang memotong pangkal akar secara mekanis tanpa menghitamkan seluruh serabut akar.',
    diseaseInfoSummary:
      'Busuk Akar pada padi dan palawija disebabkan oleh kombinasi kondisi tanah sawah masam anaerob (tergenang terus-menerus sehingga terbentuk gas beracun H₂S dan kelebihan ferro Fe²⁺ yang meracuni akar) serta infeksi cendawan tular-tanah (Pythium, Fusarium, Rhizoctonia). Penanganan WAJIB difokuskan pada pengeringan tanah (aerasi oksigen akar), pengocoran agensia hayati Trichoderma + PGPR + Asam Humat, pemupukan Kalium/Seng/Dolomit, serta fungisida pemacu akar baru (Isoprotiolan / Propineb-Zn).',
    alternativeDiagnoses: [
      {
        name: 'Serangan Hama Akar: Orong-Orong / Uret / Nematoda Puru Akar',
        distinguishingCheck:
          'Pada serangan Orong-orong/Uret, akar tampak putus tergigit di dekat leher akar; sedangkan pada Nematoda (Meloidogyne) terdapat bintil-bintil bengkak seperti kail pada ujung akar.',
      },
      {
        name: 'Defisiensi Seng (Kahat Zn) pada Tanah Sawah Tergenang',
        distinguishingCheck:
          'Akar pendek kecoklatan dan pangkal daun muda memutih (khaira disease) pada 2–4 minggu setelah tanam.',
      },
    ],
    missingInformation: [
      'Apakah petakan sawah tergenang terus-menerus tanpa pernah dikeringkan (drainase buruk)?',
      'Berapa nilai pH tanah sawah saat ini dan apakah jerami sisa panen sebelumnya dibenamkan dalam kondisi mentah?',
    ],
    followUpFieldChecks: [
      'Cabut 5 rumpun sampel di area yang pertumbuhannya stagnan, cuci akar dengan air bersih, lalu amati persentase akar hitam busuk vs akar putih sehat',
      'Cium bau lumpur perakaran (bau belerang/telur busuk menandakan keracunan H₂S akibat dekomposisi bahan organik mentah dalam genangan)',
      'Ukur pH tanah di sekitar perakaran menggunakan pH meter tanah (waspada jika pH < 5,2)',
    ],
    nonChemicalIpmActions: [
      'LANGKAH DARURAT UTAMA: Kuras dan keringkan genangan air sawah selama 4–5 hari hingga tanah retak rambut agar gas beracun H₂S menguap dan oksigen (O₂) masuk mengoksidasi racun Fe²⁺ di zona akar',
      'Kocorkan agensia hayati Trichoderma harzianum + bakteri perakaran PGPR (Pseudomonas fluorescens) + Asam Humat (Powersoil/Biotogrow) langsung ke pangkal akar untuk memicu tumbuhnya akar putih baru',
      'Taburkan Kapur Pertanian (Dolomit 300–500 kg/Ha), Pupuk Kalium (KCl 50 kg/Ha), dan Zinc Sulfate (ZnSO₄ 15–20 kg/Ha); HENTIKAN pemberian pupuk Urea sampai akar putih baru tumbuh!',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Kocor Bio-Fungisida Akar (Trichoderma + Gliocladium + PGPR + Asam Humat)',
        activeSubstancesAndBrands: 'Anfus Trichoderma, Tricho-G, PGPR Akar Bambu (Pseudomonas fluorescens & Bacillus subtilis), Powersoil Humic Acid 60%',
        dosageAndApplication: 'Kocorkan 150 ml PGPR + 50 g Trichoderma + 30 g Asam Humat per tangki 16L ke pangkal perakaran setelah air asam dibuang.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Penetral pH Tanah, Pengikat Racun Besi & Perangsang Akar Baru',
        activeSubstancesAndBrands: 'Dolomit Super (CaMg(CO₃)₂), Zinc Sulfate (ZnSO₄ 21%) Petro, MKP Pak Tani, KCl Mahkota',
        dosageAndApplication: 'Tabur Dolomit + ZnSO₄ 20 kg/Ha + KCl 50 kg/Ha pada tanah macak-macak untuk menetralkan kemasaman akar dan memacu serabut akar putih.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Drainase Oksigenasi Perakaran (Wajib Keringkan Air Asam)',
        activeSubstancesAndBrands: 'Pengeringan Sawah Berselang (AWD) 4–5 Hari',
        dosageAndApplication: 'Buka pintu pembuangan air sawah segera agar lumpur hitam terpapar udara dan oksigen masuk ke perakaran.',
      },
    ],
    verifiedProductIds: [
      'prod-trichoderma-pgpr',
      'prod-nutrisi-kalium-zn',
      'prod-fujiwan-400ec',
      'prod-antracol-70wp',
    ],
    sourceReferences: [
      'Balai Penelitian Tanah (Balittanah) & BB Padi Kementan RI — Pengelolaan Keracunan Besi (Fe), Sulfida (H₂S) & Busuk Akar Padi',
      'Direktori Pestisida & Pupuk Terdaftar Kementan RI (Anfus Trichoderma, PGPR, Powersoil Humic Acid, Fujiwan 400 EC [ZPT Akar Isoprotiolan], Antracol 70 WP [+Zn], MKP Pak Tani)',
    ],
  },
  hama_akar_orong_nematoda: {
    id: 'hama_akar_orong_nematoda',
    primaryPlantPart: 'Akar',
    detectedName: 'Kerusakan Akar akibat Hama Tanah (Orong-Orong / Uret / Nematoda Puru Akar)',
    scientificName: 'Gryllotalpa orientalis (Orong-orong) / Holotrichia spp. (Uret) / Meloidogyne graminicola (Nematoda Akar)',
    causeCategory: 'Hama Perakaran & Tanah',
    defaultConfidencePct: 91,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Sistem Perakaran (Akar): Akar dan pangkal leher akar tampak putus terpotong bekas gigitan serangga tanah (orong-orong/uret) atau terdapat bintil-bintil bengkak melengkung seperti kail pancing pada ujung akar (puru nematoda Meloidogyne).',
    defaultVisibleSymptoms: [
      'Serabut akar dan leher akar bawah tanah tampak putus tergigit atau rusak mekanis sehingga tanaman mudah dicabut dan layu mendadak',
      'Pada serangan Nematoda Puru Akar (Meloidogyne graminicola), ujung-ujung akar membengkak membentuk bintil puru melengkung seperti kail pancing (hook-like galls)',
      'Ditemukan lorong-lorong tanah dangkal di sekitar perakaran bekas aktivitas Orong-orong (anjing tanah) atau larva Uret putih melengkung huruf C',
    ],
    defaultVisualObservations:
      'Objek pada foto adalah bagian AKAR tanaman: tampak kerusakan fisik pada serabut dan leher akar berupa akar terpotong/putus akibat gigitan hama tanah (Orong-orong / Uret) atau pembengkakan bintil puru pada ujung akar akibat infeksi Nematoda Akar.',
    defaultDifferentialReasoning:
      'Didiagnosis secara presisi sebagai Kerusakan Akar akibat Hama Tanah / Nematoda (pada bagian Akar) karena foto menampilkan anatomi perakaran yang terpotong/berbintil puru; BUKAN penyakit daun dan berbeda dari Busuk Akar anaerob H₂S yang menghitamkan seluruh akar secara merata.',
    diseaseInfoSummary:
      'Hama perakaran seperti Orong-orong (Gryllotalpa orientalis), Uret (Holotrichia spp.), dan Nematoda Puru Akar (Meloidogyne graminicola) menyerang langsung sistem perakaran di dalam tanah terutama pada sawah tadah hujan, lahan macak-macak, persemaian kering, atau pertanaman palawija. Dikendalikan dengan pengaturan genangan air dan aplikasi multi-pilihan insektisida/nematisida zona akar (Fipronil, Karbofuran granul, Karbosulfan, Klorantraniliprol, serta agensia hayati Metarhizium & Paecilomyces).',
    alternativeDiagnoses: [
      {
        name: 'Busuk Akar & Keracunan Besi / Sulfida (Fe²⁺ / H₂S)',
        distinguishingCheck:
          'Pada busuk akar H₂S, seluruh akar berwarna hitam pekat berbau belerang pada lahan yang tergenang terus-menerus.',
      },
      {
        name: 'Serangan Penggerek Batang (Sundep - Scirpophaga incertulas)',
        distinguishingCheck:
          'Pada Sundep, hanya pucuk daun tengah yang mati dan terdapat lubang gerek di batang, sedangkan perakaran bawah tetap utuh.',
      },
    ],
    missingInformation: [
      'Apakah lahan dalam kondisi lembap tidak tergenang (kondisi favorit orong-orong dan nematoda)?',
      'Apakah saat tanah di sekitar rumpun digali ditemukan serangga orong-orong, uret putih, atau bintil akar?',
    ],
    followUpFieldChecks: [
      'Gali tanah sedalam 5–10 cm di sekitar pangkal akar rumpun yang layu untuk memeriksa keberadaan Orong-orong, Uret, atau Kepinding Tanah',
      'Cuci perakaran dengan air jernih dan amati ujung akar: jika terdapat bintil bengkak seperti simpul/kail, positif Nematoda Puru Akar (Meloidogyne)',
    ],
    nonChemicalIpmActions: [
      'Untuk mengendalikan Orong-orong dan Nematoda Akar pada padi sawah: genangi petakan sawah setinggi 5–7 cm selama 3–4 hari agar orong-orong keluar dari liang tanah dan nematoda terhambat',
      'Gunakan pupuk organik matang yang telah difermentasi dengan jamur entomopatogen Metarhizium anisopliae (pemangsa uret/orong-orong) dan Trichoderma / Paecilomyces lilacinus (pemangsa telur nematoda)',
      'Aplikasikan insektisida/nematisida zona perakaran terdaftar: tabur granul Karbofuran / Fipronil / Klorantraniliprol (Furadan 3 GR, Curaterr 3 GR, Petrofur 3 GR, Regent 0.3 GR, Ferterra 0.4 GR) atau kocor larutan Regent 50 SC / Marshal 200 EC / Virtako 300 SC di pangkal akar',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Jamur Pemangsa Hama Tanah & Bio-Nematisida Akar',
        activeSubstancesAndBrands: 'Metarhizium anisopliae (khusus Uret & Orong-orong) + Paecilomyces lilacinus / Trichoderma + PGPR',
        dosageAndApplication: 'Taburkan 5 kg kompos ber-Metarhizium/Ha atau kocorkan 100 g Metarhizium + PGPR per tangki 16L ke pangkal akar.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Stimulasi Regenerasi Akar Baru pasca Gigitan Hama',
        activeSubstancesAndBrands: 'Asam Humat (Powersoil) + MKP Pak Tani + Fujiwan 400 EC (Isoprotiolan ZPT Akar)',
        dosageAndApplication: 'Kocorkan MKP 50 g + Asam Humat 30 g + Fujiwan 20 ml per tangki 16L di sekitar perakaran untuk mempercepat tumbuhnya serabut akar pengganti.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Penggenangan Sesaat & Umpan Dedak Sore Hari',
        activeSubstancesAndBrands: 'Genangan Air 5 cm (3 Hari) untuk Mengusir Orong-Orong',
        dosageAndApplication: 'Genangi petakan sawah selama 3 hari agar orong-orong naik ke pematang dan mudah ditangkap/dikendalikan.',
      },
    ],
    verifiedProductIds: [
      'prod-regent-50sc',
      'prod-virtako-300sc',
      'prod-trichoderma-pgpr',
      'prod-fujiwan-400ec',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) & BBPOPT — Pedoman Pengendalian Hama Tanah (Orong-orong, Uret & Nematoda Akar)',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Regent 50 SC, Regent 0.3 GR, Furadan 3 GR, Curaterr 3 GR, Petrofur 3 GR, Ferterra 0.4 GR, Virtako 300 SC)',
    ],
  },
  akar_sehat_optimal: {
    id: 'akar_sehat_optimal',
    primaryPlantPart: 'Akar',
    detectedName: 'Sistem Perakaran Sehat & Aktif (Serabut Akar Putih-Kecoklatan Optimal)',
    scientificName: 'Oryza sativa / Tanaman Budidaya — Fisiologi Perakaran Sehat',
    causeCategory: 'Tanaman Sehat',
    defaultConfidencePct: 94,
    urgencyLevel: 'Rendah',
    organSpecificAnatomyCheck:
      'Anatomi Sistem Perakaran (Akar): Serabut akar tumbuh lebat, panjang, berwarna putih segar hingga coklat muda keemasan (lapisan oksidasi sehat), bebas dari pembusukan hitam H₂S dan bebas dari bintil nematoda.',
    defaultVisibleSymptoms: [
      'Serabut akar tampak lebat, panjang, kuat, dan didominasi ujung-ujung akar rambut baru berwarna putih bersih hingga coklat muda sehat',
      'Tidak ditemukan akar menghitam pekat berbau belerang (H₂S) dan tidak ada bintil puru nematoda maupun gigitan hama tanah',
      'Daya cengkeram akar terhadap tanah kuat dan mendukung pembentukan anakan produktif secara optimal',
    ],
    defaultVisualObservations:
      'Objek pada foto adalah bagian AKAR tanaman: terlihat struktur perakaran serabut yang sehat, lebat, berwarna putih kekuningan hingga coklat muda segar tanpa gejala busuk akar hitam maupun luka hama tanah.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Sistem Perakaran Sehat karena anatomi akar yang terlihat pada foto menunjukkan ujung akar putih aktif dan serabut rapat tanpa nekrosis hitam H₂S maupun puru nematoda.',
    diseaseInfoSummary:
      'Sistem perakaran berada dalam kondisi aerasi dan kesehatan fisiologis yang sangat baik. Ujung akar berwarna putih menandakan sel meristem akar aktif menyerap air serta unsur hara N, P, K, dan mikro dari tanah.',
    alternativeDiagnoses: [
      {
        name: 'Pemeliharaan Rutin Perakaran dengan Pengairan Berselang (AWD)',
        distinguishingCheck:
          'Pertahankan siklus basah-kering (AWD) agar pasokan oksigen ke zona perakaran tetap terjaga hingga fase pengisian bulir.',
      },
    ],
    missingInformation: [
      'Umur tanaman (HST) dan jadwal pemupukan susulan berikutnya',
    ],
    followUpFieldChecks: [
      'Pertahankan pola pengairan berselang (3–5 cm lalu biarkan surut macak-macak) agar akar tetap mendapat oksigen',
      'Lanjutkan pemberian pupuk berimbang sesuai kalender budidaya',
    ],
    nonChemicalIpmActions: [
      'Pertahankan sistem pengairan berselang (Alternate Wetting & Drying / AWD) untuk menjaga kesehatan perakaran',
      'Tidak diperlukan aplikasi fungisida atau insektisida tanah; dapat diberikan PGPR / Asam Humat secara berkala untuk mempertahankan mikrobioma rhizosfer',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Pemeliharaan Mikrobioma Perakaran (PGPR & Trichoderma)',
        activeSubstancesAndBrands: 'PGPR Akar Bambu + Trichoderma harzianum + Powersoil Asam Humat',
        dosageAndApplication: 'Aplikasi pemeliharaan 100 ml PGPR per tangki 16L setiap 15 hari untuk mempertahankan vigor akar.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Pemupukan Berimbang Sesuai Fase HST',
        activeSubstancesAndBrands: 'NPK Phonska Plus, MKP Pak Tani, KCl Mahkota',
        dosageAndApplication: 'Aplikasikan pupuk sesuai jadwal kalender tanam pada kondisi air macak-macak.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Pengairan Berselang (AWD)',
        activeSubstancesAndBrands: 'Siklus Basah-Kering Pipa AWD',
        dosageAndApplication: 'Jaga aerasi tanah agar akar putih terus berkembang hingga fase generatif.',
      },
    ],
    verifiedProductIds: [
      'prod-trichoderma-pgpr',
      'prod-nutrisi-kalium-zn',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) Kementan RI — Pedoman Pengelolaan Tanaman Terpadu (PTT) & Kesehatan Perakaran',
    ],
  },
  blas_leher_malai: {
    id: 'blas_leher_malai',
    primaryPlantPart: 'Malai / Bunga',
    detectedName: 'Penyakit Blas Leher Malai / Busuk Leher Malai (Neck Blast)',
    scientificName: 'Pyricularia oryzae (Infeksi Buku Leher Malai / Panicle Neck Node)',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Malai & Leher Malai: Buku leher malai (pangkal tangkai malai tepat di bawah bulir) tampak membusuk berwarna coklat kehitaman hingga keabu-abuan, melengkung patah (busuk leher), dan bulir gabah menjadi hampa.',
    defaultVisibleSymptoms: [
      'Buku leher malai (neck node) berwarna coklat kehitaman hingga abu-abu membusuk dan mengerut',
      'Tangkai malai terkulai atau patah pada bagian leher yang membusuk sehingga aliran fotosintat ke bulir terputus',
      'Bulir-bulir gabah pada malai menjadi hampa atau setengah bernas berwarna keabu-abuan kusam',
    ],
    defaultVisualObservations:
      'Objek pada foto adalah bagian MALAI / TANGKAI MALAI: terlihat lesi nekrotik coklat kehitaman membusuk tepat pada buku leher malai (neck blast) yang menyebabkan malai patah/terkulai dan bulir gabah hampa.',
    defaultDifferentialReasoning:
      'Didiagnosis secara presisi sebagai Blas Leher Malai (Neck Blast - Pyricularia oryzae) pada bagian Malai karena terdapat cincin busuk coklat kehitaman spesifik pada buku leher malai dan tangkai malai TIDAK mudah dicabut; berbeda dari Beluk (Penggerek Batang) di mana tangkai malai putih bersih di leher namun putus di dalam batang dan sangat mudah dicabut.',
    diseaseInfoSummary:
      'Blas Leher Malai (Neck Blast) adalah fase paling merugikan dari penyakit jamur Pyricularia oryzae karena menginfeksi buku leher malai saat fase keluar malai (heading) hingga pengisian gabah, yang dapat menurunkan hasil panen hingga 50–80%. Dikendalikan dengan penyemprotan protektif & kuratif menggunakan beberapa pilihan bahan aktif fungisida sistemik (Isoprotiolan, Trisiklazol+Propikonazol, Azoksistrobin+Difenokonazol, Trifloksistrobin+Tebukonazol).',
    alternativeDiagnoses: [
      {
        name: 'Gejala Beluk — Penggerek Batang Padi (Scirpophaga incertulas)',
        distinguishingCheck:
          'Pada Beluk, malai putih hampa berdiri tegak, buku leher malai TIDAK menghitam, dan bila malai ditarik akan langsung tercabut mudah karena putus di dalam ruas batang.',
      },
      {
        name: 'Hawar Malai Bakteri (Burkholderia glumae)',
        distinguishingCheck:
          'Bulir gabah membusuk kecoklatan tetapi tangkai/batang di bawah malai tetap hijau segar dan berdiri tegak.',
      },
    ],
    missingInformation: [
      'Persentase malai yang telah keluar di petakan sawah (fase 5% keluar malai vs keluar penuh)',
      'Kondisi cuaca (hujan malam/embun tebal) dalam 5 hari terakhir',
    ],
    followUpFieldChecks: [
      'Periksa buku leher malai pada 20 rumpun diagonal: amati adanya cincin coklat kehitaman pada pangkal malai',
      'Coba tarik perlahan tangkai malai yang mengering (jika keras/tidak tercabut tetapi leher menghitam = Blas Leher; jika mudah tercabut = Beluk Penggerek)',
    ],
    nonChemicalIpmActions: [
      'Pertahankan genangan air sawah setinggi 3–5 cm selama fase keluar malai hingga pengisian bulir (jangan biarkan sawah kering)',
      'Jangan mengaplikasikan pupuk Urea pada fase generatif; semprotkan Kalium (MKP) + Silika untuk memperkuat tangkai leher malai',
      'Lakukan penyemprotan fungisida sistemik spesifik Blas Leher pada saat malai keluar 5–10% dan diulang saat bunga selesai menyerbuk menggunakan Fujiwan 400 EC / Filia 525 SE / Beam 75 WP, Amistartop 325 SC, Nativo 75 WG, atau Score 250 EC (hindari jam mekar bunga 08:30–11:00 WIB)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Bakteri Antagonis Pelindung Malai',
        activeSubstancesAndBrands: 'Paenibacillus polymyxa & Pseudomonas fluorescens (PGPR)',
        dosageAndApplication: '100 ml per tangki 16L disemprotkan pada sore hari sejak fase bunting akhir.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Pengisian Bulir Bernas & Penguat Leher Malai (MKP + Silika)',
        activeSubstancesAndBrands: 'MKP Pak Tani (52% P₂O₅ + 34% K₂O) + Besmor Silika Cair',
        dosageAndApplication: '50 gram MKP + 30 ml Silika Cair per tangki 16L untuk memperkokoh jaringan sklerenkim leher malai.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Jaga Genangan Air Fase Keluar Malai',
        activeSubstancesAndBrands: 'Genangan Air 3–5 cm Selama Pembungaan',
        dosageAndApplication: 'Pastikan petakan tidak kekurangan air saat malai keluar.',
      },
    ],
    verifiedProductIds: [
      'prod-fujiwan-400ec',
      'prod-amistartop-325sc',
      'prod-nativo-75wg',
      'prod-score-250ec',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Blas Leher Malai (Neck Blast)',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Fujiwan 400 EC, Filia 525 SE, Beam 75 WP, Amistartop 325 SC, Nativo 75 WG, Score 250 EC)',
    ],
  },
  walang_sangit_gabah: {
    id: 'walang_sangit_gabah',
    primaryPlantPart: 'Buah / Gabah',
    detectedName: 'Serangan Hama Walang Sangit & Kepik Penghisap Bulir Gabah / Polong',
    scientificName: 'Leptocorisa oratorius (Walang Sangit) & Nezara viridula / Riptortus linearis (Kepik Biji)',
    causeCategory: 'Serangan Hama',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Malai, Bulir Gabah & Polong: Tampak serangga Walang Sangit bertubuh ramping coklat-hijau atau Kepik di permukaan malai/polong, disertai bintik tusukan coklat kehitaman pada kulit gabah masak susu yang membuat gabah hampa/berkapur.',
    defaultVisibleSymptoms: [
      'Terlihat serangga Walang Sangit (Leptocorisa oratorius) atau Kepik hinggap dan menghisap cairan bulir gabah pada fase masak susu (atau polong muda)',
      'Terdapat bintik bekas tusukan berwarna coklat kehitaman pada kulit gabah disertai bercak tepung cairan gabah yang mengering',
      'Bulir gabah menjadi hampa, setengah isi, berkapur, dan beras mudah pecah serta berbau khas walang sangit',
    ],
    defaultVisualObservations:
      'Objek pada foto adalah bagian MALAI / BULIR GABAH / POLONG: terlihat serangan hama penghisap bulir (Walang Sangit / Kepik) dan bintik-bintik tusukan coklat kehitaman pada kulit gabah fase masak susu.',
    defaultDifferentialReasoning:
      'Didiagnosis secara presisi sebagai Serangan Walang Sangit / Kepik Penghisap Bulir pada bagian Gabah/Malai karena kerusakan terfokus pada tusukan bulir gabah fase masak susu dan keberadaan serangga penghisap, berbeda dari Beluk yang memutihkan seluruh malai sejak keluar dari pelepah.',
    diseaseInfoSummary:
      'Walang Sangit (Leptocorisa oratorius) dan Kepik Biji menyerang tanaman pada fase kritis keluar malai hingga masak susu (65–80 HST). Nimfa dan imago menusuk bulir gabah yang masih berupa cairan susu sehingga bulir menjadi hampa dan menurunkan rendemen serta mutu beras. Dikendalikan dengan perangkap bau dan penyemprotan pagi/sore hari menggunakan beberapa pilihan bahan aktif insektisida kontak & sistemik (BPMC/Fenobukarb, Profenofos, Metomil, Buprofezin/Dinotefuran, atau Lamda Sihalotrin).',
    alternativeDiagnoses: [
      {
        name: 'Penyakit Gabah Kotor / Bercak Bulir (Grain Discoloration)',
        distinguishingCheck:
          'Disebabkan oleh infeksi kompleks jamur (Bipolaris/Curvularia/Sarocladium) tanpa keberadaan populasi walang sangit (>5 ekor/m²).',
      },
      {
        name: 'Blas Leher Malai (Pyricularia oryzae)',
        distinguishingCheck:
          'Pada Blas Leher, seluruh malai hampa karena pangkal leher malai menghitam patah, bukan bintik tusukan per bulir.',
      },
    ],
    missingInformation: [
      'Kepadatan populasi walang sangit per meter persegi (ambang pengendalian: >5 ekor/m² pada fase masak susu)',
      'Apakah penanaman padi di petakan ini lebih awal atau lebih lambat dibanding sawah sekitar',
    ],
    followUpFieldChecks: [
      'Amati malai pada pukul 06:00–07:30 pagi atau 16:00–17:30 sore untuk menghitung populasi walang sangit per m²',
      'Periksa pematang sawah dari rumput-rumputan berbunga (Echinochloa / Panicum) yang menjadi inang transit walang sangit',
    ],
    nonChemicalIpmActions: [
      'Bersihkan gulma rerumputan yang berbunga di sekitar pematang sawah dan pasang perangkap umpan bau (keong mas tumbuk / ketam busuk / bangkai ikan) di pinggir petakan untuk mengumpulkan dan memusnahkan walang sangit',
      'Lakukan penyemprotan pada PAGI HARI (06:00–08:00) atau SORE HARI (16:00–17:30) saat walang sangit aktif di atas malai; JANGAN menyemprot pukul 08:30–11:00 saat bunga padi mekar menyerbuk',
      'Gunakan pilihan bahan aktif insektisida terdaftar secara tepat sasaran: Profenofos / BPMC / Metomil (Curacron 500 EC, Bassa 500 EC, Dharmabas 500 EC, Dangke 40 WP), Dinotefuran / MIPC (Oshin 20 SG, Mipcinta 50 WP, Applaud 10 WP), atau Pimetrozin (Plenum 50 WG)',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Jamur Beauveria bassiana & Pestisida Nabati Serai Wangi/Mimba',
        activeSubstancesAndBrands: 'Beauveria bassiana BBPOPT + Ekstrak Daun Sirsak, Serai Wangi & Biji Mimba',
        dosageAndApplication: 'Semprotkan 100 g Beauveria bassiana + 50 ml ekstrak serai wangi per tangki 16L pada sore hari sebagai penolak (repellent) dan penginfeksi walang sangit.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Percepatan Pengisian & Pengerasan Kulit Gabah (Kalium + Silika)',
        activeSubstancesAndBrands: 'MKP Pak Tani + Besmor Silika Cair',
        dosageAndApplication: 'Semprotkan MKP 50 g + Silika 30 ml per tangki 16L agar fase masak susu cepat padat dan kulit sekam gabah keras sehingga sulit ditusuk walang sangit.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Perangkap Atraktan Keong Mas / Ikan Busuk (Swadaya PHT)',
        activeSubstancesAndBrands: 'Umpan Bau Fermentasi di Pematang',
        dosageAndApplication: 'Pasang 10–15 titik umpan keong mas tumbuk di keliling petakan; walang sangit akan berkumpul pada umpan dan mudah dikendalikan secara lokal.',
      },
    ],
    verifiedProductIds: [
      'prod-curacron-500ec',
      'prod-applaud-10wp',
      'prod-plenum-50wg',
      'prod-nutrisi-kalium-zn',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Hama Walang Sangit (Leptocorisa oratorius)',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Curacron 500 EC, Bassa 500 EC, Dharmabas 500 EC, Dangke 40 WP, Mipcinta 50 WP, Oshin 20 SG)',
    ],
  },
  kotor_bulir_gabah: {
    id: 'kotor_bulir_gabah',
    primaryPlantPart: 'Buah / Gabah',
    detectedName: 'Penyakit Bercak Bulir / Gabah Kotor & Gosong Palsu (Grain Discoloration & False Smut)',
    scientificName: 'Sarocladium oryzae / Bipolaris oryzae / Ustilaginoidea virens',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 90,
    urgencyLevel: 'Sedang',
    organSpecificAnatomyCheck:
      'Anatomi Bulir Gabah / Malai: Kulit sekam bulir gabah tampak bernoda coklat kehitaman/keunguan kusam (gabah kotor) atau terdapat bola spora beludru kuning-oranye hingga hijau kehitaman pada bulir (gosong palsu / false smut).',
    defaultVisibleSymptoms: [
      'Kulit bulir gabah berubah warna menjadi coklat tua, kehitaman, atau bercak keabu-abuan kusam (grain discoloration)',
      'Pada gejala Gosong Palsu (Ustilaginoidea virens), beberapa bulir gabah berubah menjadi bola beludru berwarna kuning-oranye yang kemudian menghitam',
      'Pengisian bulir tidak sempurna dan menurunkan kualitas benih serta rendemen beras kepala',
    ],
    defaultVisualObservations:
      'Objek pada foto adalah bagian BULIR GABAH / MALAI: tampak perubahan warna nekrotik coklat kehitaman pada kulit sekam gabah (gabah kotor) atau pembentukan massa spora bulat pada bulir.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Penyakit Gabah Kotor / Gosong Palsu pada bagian Buah/Gabah karena gejala terfokus pada infeksi cendawan di kulit sekam/bulir gabah, bukan bercak pada helai daun bawah.',
    diseaseInfoSummary:
      'Penyakit Gabah Kotor dan Gosong Palsu menyerbu bulir padi pada saat keluar malai hingga pengisian gabah ketika kelembapan udara tinggi dan curah hujan sering terjadi. Dikendalikan dengan perlindungan fungisida sistemik kombinasi Strobilurin + Triazol pada fase bunting akhir dan awal keluar malai.',
    alternativeDiagnoses: [
      {
        name: 'Tusukan Hama Walang Sangit (Leptocorisa oratorius)',
        distinguishingCheck:
          'Tusukan walang sangit meninggalkan titik bekas stilett tunggal disertai bau khas walang sangit di sawah.',
      },
    ],
    missingInformation: [
      'Persentase malai yang terinfeksi dan umur tanaman (HST) saat ini',
    ],
    followUpFieldChecks: [
      'Amati bulir gabah pada 20 malai sampel; jika ditemukan bola spora gosong palsu, petik perlahan menggunakan kantong plastik agar spora tidak berhamburan',
    ],
    nonChemicalIpmActions: [
      'Gunakan benih sehat bermutu dan hindari pemupukan Urea berlebih menjelang fase bunting',
      'Semprotkan fungisida pelindung malai/bulir pada fase bunting akhir (sebelum malai pecah) dan saat 5% keluar malai menggunakan Amistartop 325 SC, Nativo 75 WG / Anvil 50 SC, atau Score 250 EC',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Aplikasi Agensia Hayati Fase Bunting',
        activeSubstancesAndBrands: 'Trichoderma harzianum + Pseudomonas fluorescens (PGPR)',
        dosageAndApplication: '100 ml PGPR per tangki 16L disemprotkan sore hari sebelum malai keluar.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Nutrisi Pengisian Bulir Bernas (MKP + Kalium)',
        activeSubstancesAndBrands: 'MKP Pak Tani (52% P₂O₅ + 34% K₂O) + KCl Mahkota',
        dosageAndApplication: 'Semprot 50 g MKP per tangki 16L agar bulir bernas penuh dan kulit gabah kuning bersih mengkilap.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Pengeringan Lahan Menjelang Panen',
        activeSubstancesAndBrands: 'Drainase Sawah 10–14 Hari Sebelum Panen',
        dosageAndApplication: 'Keringkan petakan sawah menjelang matang kuning untuk menurunkan kelembapan di sekitar malai.',
      },
    ],
    verifiedProductIds: [
      'prod-amistartop-325sc',
      'prod-nativo-75wg',
      'prod-score-250ec',
      'prod-nutrisi-kalium-zn',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pengendalian Penyakit Gabah Kotor & Gosong Palsu',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Amistartop 325 SC, Nativo 75 WG, Anvil 50 SC, Score 250 EC)',
    ],
  },
  kahat_n: {
    id: 'kahat_n',
    primaryPlantPart: 'Daun',
    detectedName: 'Defisiensi Unsur Hara Nitrogen (Kahat N)',
    scientificName: 'Gangguan Fisiologis — Kekurangan Makronutrien Nitrogen (N)',
    causeCategory: 'Defisiensi Nutrisi',
    defaultConfidencePct: 90,
    urgencyLevel: 'Sedang',
    organSpecificAnatomyCheck:
      'Anatomi Daun Tua (Bawah) & Kanopi: Helai daun bawah menguning pucat seragam berbentuk huruf V dari ujung daun tanpa bercak nekrotik patogen.',
    defaultVisibleSymptoms: [
      'Helai daun menguning pucat hingga hijau kekuningan secara seragam (terutama dimulai dari daun tua/bawah)',
      'Tidak ditemukan bercak nekrotik coklat, tidak ada pusat abu-abu belah ketupat, dan tidak ada luka hawar bakteri',
      'Pertumbuhan anakan tampak kurus dengan warna tajuk hijau pucat (skor BWD < 3)',
    ],
    defaultVisualObservations:
      'Helai daun tampak menguning pucat hingga hijau muda kekuningan secara merata dari ujung daun tua tanpa disertai bercak nekrotik jamur maupun lesi bakterial.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Defisiensi Nitrogen (Kahat N) karena penguningan bersifat pucat seragam tanpa bercak nekrotik/lesi patogen, berbeda dari Virus Tungro yang berwarna kuning-oranye mencolok pada daun muda.',
    diseaseInfoSummary:
      'Kekurangan unsur Nitrogen menghambat pembentukan klorofil sehingga tanaman merelokasi N dari daun tua ke daun muda. Kondisi ini BUKAN penyakit infeksi jamur/hama sehingga ditangani dengan pemupukan Urea + NPK Phonska Plus terukur berdasarkan Bagan Warna Daun (BWD) serta pembenah perakaran (Asam Humat + PGPR) agar akar mampu menyerap hara secara optimal.',
    alternativeDiagnoses: [
      {
        name: 'Gejala Penyakit Virus Tungro',
        distinguishingCheck:
          'Pada Tungro, perubahan warna kuning-oranye terjadi pada daun MUDA disertai kerdil mengelompok dan keberadaan Wereng Hijau.',
      },
      {
        name: 'Defisiensi Sulfur (Kahat S)',
        distinguishingCheck:
          'Pada Kahat S, daun MUDA menguning pucat terlebih dahulu karena Sulfur bersifat tidak mobil di dalam tanaman.',
      },
    ],
    missingInformation: [
      'Skor pembacaan Bagan Warna Daun (BWD) saat ini pada 10 rumpun diagonal',
      'Tanggal dan dosis pemupukan Urea/NPK terakhir',
    ],
    followUpFieldChecks: [
      'Ukur tingkat kehijauan daun teratas yang telah membuka penuh menggunakan Bagan Warna Daun (BWD) di 10 titik diagonal',
      'Periksa kondisi perakaran dan pintu air petakan agar pupuk yang akan ditabur tidak hanyut terbawa aliran air',
    ],
    nonChemicalIpmActions: [
      'Bila skor BWD < 4, berikan pupuk Urea susulan 50–100 kg/Ha + NPK Phonska Plus (100–150 kg/Ha) atau ZA (untuk tanah kurang Sulfur) pada kondisi air macak-macak (2–3 cm)',
      'Tambahkan Asam Humat (Powersoil) + PGPR agar serabut akar aktif menyerap Nitrogen dan tidak tercuci',
      'Siangi gulma terlebih dahulu sebelum penaburan pupuk agar unsur hara diserap 100% oleh perakaran tanaman utama',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Pilihan Pupuk Makro-Mikro Pemulih Klorofil (Urea + NPK + ZA + Daun)',
        activeSubstancesAndBrands: 'Urea Pupuk Indonesia (46% N), NPK Phonska Plus (15-15-15 + 9% S + Zn), Pupuk ZA (21% N + 24% S), Gandasil D / Mamigro (25-5-20)',
        dosageAndApplication: 'Tabur Urea 75 kg/Ha + NPK Phonska Plus 100 kg/Ha saat air macak-macak, dan semprot pupuk daun Gandasil D 30 g/tangki 16L untuk pemulihan cepat.',
      },
      {
        category: 'Agensia Hayati & Organik',
        title: 'Bakteri Penambat Nitrogen & Asam Humat Perakaran',
        activeSubstancesAndBrands: 'Azotobacter + PGPR Pseudomonas fluorescens + Powersoil Humic Acid',
        dosageAndApplication: 'Campurkan 2 kg Asam Humat/Ha bersama pupuk tabur atau semprotkan 100 ml PGPR per tangki 16L.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Penutupan Pintu Air Sawah Saat Pemupukan',
        activeSubstancesAndBrands: 'Kondisi Air Macak-Macak (Tutup Aliran Keluar 3 Hari)',
        dosageAndApplication: 'Tutup pintu keluar air selama 3 hari pasca pemupukan agar granul Urea/NPK larut meresap ke zona akar.',
      },
    ],
    verifiedProductIds: [
      'prod-nutrisi-kalium-zn',
      'prod-trichoderma-pgpr',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Panduan Pemupukan Spesifik Lokasi & Bagan Warna Daun (BWD)',
      'Direktori Pupuk & Pembenah Tanah Terdaftar Kementan RI (NPK Phonska Plus, Urea, ZA, MKP Pak Tani, Powersoil Humic Acid)',
    ],
  },
  kahat_k_fe: {
    id: 'kahat_k_fe',
    primaryPlantPart: 'Daun',
    detectedName: 'Defisiensi Kalium (Kahat K) / Keracunan Besi (Fe Bronzing)',
    scientificName: 'Gangguan Fisiologis Hara Kalium (K) / Toksisitas Besi (Fe²⁺ Bronzing)',
    causeCategory: 'Defisiensi Nutrisi',
    defaultConfidencePct: 88,
    urgencyLevel: 'Sedang',
    organSpecificAnatomyCheck:
      'Anatomi Tepi Daun Tua & Perakaran: Tepi dan ujung daun tua menguning kecoklatan disertai bintik-bintik coklat kemerahan halus (bronzing) akibat akumulasi ferro (Fe²⁺) dan kurangnya Kalium.',
    defaultVisibleSymptoms: [
      'Tepi dan ujung daun tua menguning kecoklatan seperti terbakar disertai bintik-bintik coklat kemerahan halus (bronzing)',
      'Gejala dimulai dari ujung daun bawah merambat sepanjang tepi helai daun secara simetris',
      'Sering disertai perakaran yang terlapisi karat besi kemerahan pada tanah sawah masam tergenang',
    ],
    defaultVisualObservations:
      'Tampak perubahan warna kuning-kecoklatan dan bintik kemerahan halus (bronzing) di sepanjang tepi dan ujung helai daun tua tanpa lesi belah ketupat.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Defisiensi Kalium / Keracunan Besi (Fe) karena nekrosis kemerahan/bronzing mengikuti tepi daun tua secara simetris, bukan bercak belah ketupat Blas maupun hawar bakteri ber-eksudat.',
    diseaseInfoSummary:
      'Kekurangan Kalium (K) atau keracunan Besi (Fe) sering terjadi pada tanah sawah masam (pH < 5,5) yang tergenang terus-menerus tanpa drainase berselang. Penanganan dilakukan dengan pengeringan sawah berkala (AWD), pengapuran Dolomit, penambahan pupuk KCl / MKP / ZnSO₄, serta pemberian Asam Humat pengikat Fe berlebih.',
    alternativeDiagnoses: [
      {
        name: 'Hawar Daun Bakteri / Kresek (Xanthomonas oryzae)',
        distinguishingCheck:
          'Kresek menghasilkan cairan keruh bakteri (ooze) saat potongan daun dicelupkan ke air jernih dan batas lesinya bergelombang kuning jerami.',
      },
      {
        name: 'Busuk Akar & Keracunan Besi pada Perakaran',
        distinguishingCheck:
          'Cabut rumpun dan foto bagian AKAR untuk melihat apakah serabut akar menghitam pekat berbau H₂S.',
      },
    ],
    missingInformation: [
      'Nilai pH tanah sawah dan riwayat pengeringan lahan (drainase)',
      'Dosis pupuk KCl atau NPK yang telah diberikan',
    ],
    followUpFieldChecks: [
      'Ukur pH tanah sawah menggunakan pH meter atau Perangkat Uji Tanah Sawah (PUTS)',
      'Cabut 1 rumpun sampel untuk memeriksa apakah perakaran tampak hitam atau terlapisi karat besi kemerahan',
    ],
    nonChemicalIpmActions: [
      'Lakukan pengeringan petakan sawah secara berkala (pengairan berselang / AWD) selama 4–5 hari untuk mengoksidasi kelebihan ferro (Fe²⁺) di zona perakaran',
      'Aplikasikan pupuk Kalium (KCl Mahkota 50–75 kg/Ha), MKP Pak Tani (semprot daun), Zinc Sulfate (ZnSO₄ 15–20 kg/Ha), dan Kapur Pertanian (Dolomit 300–500 kg/Ha) bila pH tanah < 5,5',
      'Kocorkan Asam Humat (Powersoil) + PGPR untuk mengkhelat racun besi dan memulihkan fungsi serabut akar',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Paket Koreksi Kalium, Seng & Penetral Kemasaman Tanah',
        activeSubstancesAndBrands: 'KCl Mahkota (60% K₂O), MKP Pak Tani, Zinc Sulfate (ZnSO₄ 21%) Petro, Kapur Dolomit Super',
        dosageAndApplication: 'Taburkan KCl 50–75 kg/Ha + Dolomit 300 kg/Ha setelah air asam dikuras, dan semprot MKP 50 g + ZnSO₄ 20 g per tangki 16L.',
      },
      {
        category: 'Agensia Hayati & Organik',
        title: 'Pengkhelat Logam Berat Besi (Asam Humat + PGPR)',
        activeSubstancesAndBrands: 'Powersoil Humic Acid 60% + PGPR Pseudomonas fluorescens + Trichoderma',
        dosageAndApplication: '2 kg Asam Humat/Ha ditabur atau dikocor 30 g/tangki 16L untuk mengikat ion Fe²⁺ berlebih di zona akar.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Pengeringan Sawah (Oksidasi Tanah Masam)',
        activeSubstancesAndBrands: 'Sistem Irigasi Berselang (AWD)',
        dosageAndApplication: 'Kuras genangan air merah/berkarat dan biarkan permukaan tanah sawah mengering 4 hari.',
      },
    ],
    verifiedProductIds: [
      'prod-nutrisi-kalium-zn',
      'prod-trichoderma-pgpr',
    ],
    sourceReferences: [
      'Balai Penelitian Tanah & BB Padi Kementan RI — Pengelolaan Hara Kalium dan Tanah Sawah Masam',
      'Direktori Pupuk & Pembenah Tanah Resmi Kementan RI (KCl Mahkota, MKP Pak Tani, ZnSO₄ Petro, Dolomit Super, Powersoil)',
    ],
  },
  antraknosa_cabai: {
    id: 'antraknosa_cabai',
    primaryPlantPart: 'Buah / Gabah',
    detectedName: 'Penyakit Antraknosa / Patek Buah & Bercak Daun',
    scientificName: 'Colletotrichum gloeosporioides / Colletotrichum capsici',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Buah / Polong & Daun: Lesi cekung melingkar konsentris berwarna coklat kehitaman dengan pusat spora jingga/hitam pada kulit buah.',
    defaultVisibleSymptoms: [
      'Lesi cekung melingkar konsentris berwarna coklat tua hingga kehitaman pada buah atau daun',
      'Pada pusat bercak cekung tampak massa spora berwarna jingga kemerahan atau titik-titik hitam (aservulus)',
      'Jaringan buah di sekitar lesi membusuk dan mengering keriput',
    ],
    defaultVisualObservations:
      'Teramati lesi nekrotik cekung berlapis konsentris berwarna coklat kehitaman dengan pusat spora kemerahan/hitam khas infeksi jamur Colletotrichum.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Antraknosa / Patek (Colletotrichum spp.) karena adanya bercak cekung konsentris kehitaman yang spesifik, berbeda dari serangan Lalat Buah yang hanya meninggalkan titik tusukan ovipositor kecil.',
    diseaseInfoSummary:
      'Antraknosa (Patek) adalah penyakit jamur utama yang menyebar cepat melalui percikan air hujan dan kelembapan udara tinggi (>80%). Dikendalikan dengan sanitasi buah sakit dan rotasi fungisida kontak (Propineb/Mankozeb/Tembaga) serta sistemik (Azoksistrobin+Difenokonazol, Trifloksistrobin+Tebukonazol).',
    alternativeDiagnoses: [
      {
        name: 'Busuk Buah Phytophthora (Phytophthora capsici)',
        distinguishingCheck:
          'Terdapat lapisan miselium putih halus seperti kapas pada permukaan lesi basah saat pagi hari.',
      },
    ],
    missingInformation: [
      'Persentase populasi buah yang terinfeksi di bedengan',
      'Kondisi drainase parit antar bedengan pasca hujan',
    ],
    followUpFieldChecks: [
      'Petik dan musnahkan (bakar/kubur dalam di luar kebun) seluruh buah yang menunjukkan gejala patek agar spora tidak menyebar',
      'Periksa kerapatan tajuk dan pangkas tunas air bawah untuk menurunkan kelembapan mikro',
    ],
    nonChemicalIpmActions: [
      'Sanitasi ketat dengan memetik dan memusnahkan bagian tanaman/buah sakit di luar areal pertanaman',
      'Perbaiki drainase bedengan dan tambahkan pupuk Kalsium (Ca) serta Kalium (MKP) untuk memperkokoh dinding sel buah',
      'Gunakan pilihan fungisida kontak dan sistemik terverifikasi secara bergilir: Amistartop 325 SC, Nativo 75 WG, Score 250 EC, Antracol 70 WP / Dithane M-45, atau Nordox 56 WP',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Aplikasi Trichoderma & Minyak Atsiri Cengkeh/Serai',
        activeSubstancesAndBrands: 'Anfus Trichoderma harzianum + Bacillus subtilis + Eugenol Cengkeh',
        dosageAndApplication: '60 g Trichoderma per tangki 16L disemprotkan sore hari.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Penguat Dinding Sel Buah (Kalsium + Kalium Fosfat)',
        activeSubstancesAndBrands: 'MKP Pak Tani + Kalsium Nitrat (Calcinit / Manohara) + Boron',
        dosageAndApplication: 'Semprot Kalsium + MKP 40 g/tangki 16L agar kulit buah tebal dan tahan penetrasi jamur patek.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Sanitasi Buah Sakit & Drainase Parit Bedengan',
        activeSubstancesAndBrands: 'Pemetikan Buah Terinfeksi ke Dalam Kantong Tertutup',
        dosageAndApplication: 'Jangan membuang buah patek di parit bedengan karena air siraman akan memercikkan spora kembali ke atas.',
      },
    ],
    verifiedProductIds: [
      'prod-amistartop-325sc',
      'prod-nativo-75wg',
      'prod-score-250ec',
      'prod-antracol-70wp',
    ],
    sourceReferences: [
      'Balai Penelitian Tanaman Sayuran (Balitsa) Kementan RI — Pedoman Pengendalian Patek Cabai',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Amistartop 325 SC, Nativo 75 WG, Score 250 EC, Antracol 70 WP)',
    ],
  },
  hawar_daun_jagung: {
    id: 'hawar_daun_jagung',
    primaryPlantPart: 'Daun',
    detectedName: 'Penyakit Hawar Daun & Bulai Jagung',
    scientificName: 'Bipolaris maydis / Peronosclerospora maydis',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 90,
    urgencyLevel: 'Tinggi',
    organSpecificAnatomyCheck:
      'Anatomi Helai Daun Jagung: Lesi memanjang berbentuk elips/kumparan kecoklatan dan jalur klorotik kuning-putih sejajar tulang daun.',
    defaultVisibleSymptoms: [
      'Lesi nekrotik memanjang berbentuk elips/kumparan kecoklatan atau jalur klorotik kuning-putih sejajar tulang daun jagung',
      'Jaringan daun di sekitar lesi mengering sehingga luas permukaan fotosintesis menurun',
      'Pada gejala bulai tampak garis klorotik memanjang dari pangkal ke ujung daun muda',
    ],
    defaultVisualObservations:
      'Pada helai daun jagung tampak lesi memanjang elips kecoklatan dan jalur klorotik sejajar tulang daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Hawar Daun / Bulai Jagung karena morfologi lesi memanjang elips sejajar urat daun paralel jagung, berbeda dari Karat Daun (Puccinia) yang membentuk bintil pustul menonjol.',
    diseaseInfoSummary:
      'Hawar daun dan bulai jagung berkembang pesat pada kondisi suhu hangat dengan kelembapan malam/embun pagi yang tinggi. Dikendalikan dengan rotasi beberapa pilihan bahan aktif fungisida (Azoksistrobin+Difenokonazol, Trifloksistrobin+Tebukonazol, Propineb/Mankozeb/Metalaksil, dan Tembaga Oksida).',
    alternativeDiagnoses: [
      {
        name: 'Karat Daun Jagung (Puccinia polysora)',
        distinguishingCheck:
          'Raba permukaan daun untuk mengecek adanya bintil pustul kecil berwarna coklat karat yang menonjol.',
      },
    ],
    missingInformation: [
      'Umur tanaman jagung (HST) saat gejala muncul',
      'Riwayat perlakuan benih (seed treatment) sebelum tanam',
    ],
    followUpFieldChecks: [
      'Amati permukaan bawah daun pada pukul 05:30–06:30 pagi untuk melihat ada/tidaknya lapisan konidia putih',
      'Cabut segera tanaman muda yang terinfeksi sistemik agar tidak menular ke tanaman sehat di sekitarnya',
    ],
    nonChemicalIpmActions: [
      'Eradikasi (pencabutan dan pemusnahan) tanaman jagung yang terinfeksi bulai sistemik sejak dini',
      'Atur jarak tanam dan sanitasi gulma inang agar sirkulasi udara di sela barisan jagung lancar',
      'Semprotkan fungisida terdaftar secara rotasi: Amistartop 325 SC, Nativo 75 WG, Antracol 70 WP / Ridomil Gold MZ, atau Nordox 56 WP',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Aplikasi Trichoderma & PGPR Perakaran Jagung',
        activeSubstancesAndBrands: 'Trichoderma harzianum + Bacillus subtilis + Pseudomonas fluorescens',
        dosageAndApplication: '100 ml PGPR + 50 g Trichoderma per tangki 16L.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Penguatan Daun dengan Kalium & Fosfat (MKP)',
        activeSubstancesAndBrands: 'MKP Pak Tani + KCl Mahkota',
        dosageAndApplication: 'Semprot MKP 50 g/tangki 16L untuk menekan perluasan lesi hawar daun.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Sanitasi Tanaman Bulai & Drainase Barisan',
        activeSubstancesAndBrands: 'Roguing Tanaman Terinfeksi Dini',
        dosageAndApplication: 'Cabut dan kubur tanaman bergejala bulai pada umur <25 HST.',
      },
    ],
    verifiedProductIds: [
      'prod-amistartop-325sc',
      'prod-nativo-75wg',
      'prod-antracol-70wp',
      'prod-nordox-56wp',
    ],
    sourceReferences: [
      'Balai Penelitian Tanaman Serealia (Balitsereal) Kementan RI',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Amistartop 325 SC, Nativo 75 WG, Antracol 70 WP, Ridomil Gold MZ, Nordox 56 WP)',
    ],
  },
  tanaman_sehat: {
    id: 'tanaman_sehat',
    primaryPlantPart: 'Daun',
    detectedName: 'Tanaman Sehat — Vigor & Klorofil Optimal',
    scientificName: 'Oryza sativa / Tanaman Budidaya (Kondisi Fisiologis Normal)',
    causeCategory: 'Tanaman Sehat',
    defaultConfidencePct: 95,
    urgencyLevel: 'Rendah',
    organSpecificAnatomyCheck:
      'Anatomi Tanaman: Jaringan epidermis utuh, warna hijau klorofil optimal (setara BWD 4), bebas bercak nekrotik patogen dan bebas kerusakan hama.',
    defaultVisibleSymptoms: [
      'Helai daun berwarna hijau segar merata dengan indeks klorofil optimal (setara skor BWD 4)',
      'Permukaan tanaman bersih dari bercak nekrotik jamur, hawar tepi bakteri, maupun kerokan ulat',
      'Pertumbuhan tajuk tampak tegak dan sehat tanpa gejala kerdil atau hopperburn',
    ],
    defaultVisualObservations:
      'Tanaman tampak hijau segar merata dengan jaringan epidermis utuh tanpa bercak nekrotik, tanpa hawar tepi daun, dan tanpa kerusakan hama.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Tanaman Sehat karena tidak ditemukan lesi belah ketupat (Blas), jalur hawar kuning jerami (Kresek), bintik coklat (Bipolaris), maupun alur kerokan putih (Hama Putih Palsu).',
    diseaseInfoSummary:
      'Tanaman berada dalam kondisi pertumbuhan fisiologis yang sehat dengan kecukupan unsur hara dan bebas dari infeksi patogen signifikan. Tidak diperlukan aplikasi pestisida kimia; pertahankan dengan agensia hayati (PGPR/Trichoderma) dan pemupukan berimbang.',
    alternativeDiagnoses: [
      {
        name: 'Pemantauan Rutin Mingguan BWD',
        distinguishingCheck:
          'Tetap lakukan pengukuran Bagan Warna Daun (BWD) setiap 7–10 hari pada fase vegetatif untuk menjaga kecukupan Nitrogen.',
      },
    ],
    missingInformation: [
      'Skor pembacaan Bagan Warna Daun (BWD) lapangan terbaru',
    ],
    followUpFieldChecks: [
      'Lanjutkan pengamatan agroekosistem rutin setiap 7 hari sekali secara diagonal',
      'Pertahankan pengairan berselang (macak-macak 3–5 cm) sesuai fase pertumbuhan',
    ],
    nonChemicalIpmActions: [
      'Lanjutkan jadwal pemupukan berimbang dan pengairan berselang sesuai kalender budidaya',
      'Jangan melakukan penyemprotan pestisida kimia tanpa indikasi serangan; lestarikan musuh alami (laba-laba & kepik predator) di sawah',
    ],
    biologicalAndSupportingRecommendations: [
      {
        category: 'Agensia Hayati & Organik',
        title: 'Pemeliharaan Imunitas Hayati (PGPR & Trichoderma)',
        activeSubstancesAndBrands: 'PGPR Pseudomonas fluorescens + Anfus Trichoderma + Powersoil Humic Acid',
        dosageAndApplication: 'Semprot/kocor 100 ml PGPR per tangki 16L setiap 2 minggu untuk menjaga ketahanan alami tanaman.',
      },
      {
        category: 'Pemupukan & Pembenah Tanah/Akar',
        title: 'Nutrisi Berimbang Sesuai Fase Pertumbuhan',
        activeSubstancesAndBrands: 'NPK Phonska Plus, MKP Pak Tani, KCl Mahkota',
        dosageAndApplication: 'Gunakan Bagan Warna Daun (BWD) sebagai panduan dosis pupuk susulan.',
      },
      {
        category: 'Perlakuan Fisik & Air',
        title: 'Pengairan Berselang (AWD)',
        activeSubstancesAndBrands: 'Manajemen Air 3–5 cm',
        dosageAndApplication: 'Pertahankan sirkulasi udara dan oksigen perakaran.',
      },
    ],
    verifiedProductIds: [
      'prod-trichoderma-pgpr',
      'prod-nutrisi-kalium-zn',
    ],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) Kementan RI — Pedoman Pengelolaan Tanaman Terpadu (PTT)',
    ],
  },
};

/**
 * Menormalkan string ID penyakit dari respons model atau kata kunci menjadi OfficialDiseaseId yang sah,
 * dengan penegakan ketat kesesuaian bagian tanaman (Akar -> diagnosis Akar, Malai/Gabah -> diagnosis Malai/Gabah, dst).
 */
export function normalizeOfficialDiseaseId(
  rawId?: string | null,
  commodity?: CommodityType,
  plantPart?: DiagnosisResult['plantPart'],
  visualObservationsText?: string
): OfficialDiseaseId {
  const s = `${rawId || ''} ${visualObservationsText || ''}`.toLowerCase().trim();
  const cleanId = (rawId || '').toLowerCase().trim();

  // 1. Jika bagian tanaman yang terdeteksi / dipilih adalah AKAR, pastikan 100% dianalisis sebagai gangguan/kondisi AKAR!
  const isRootContext =
    plantPart === 'Akar' ||
    cleanId.includes('akar') ||
    cleanId.includes('root') ||
    cleanId.includes('orong') ||
    cleanId.includes('uret') ||
    cleanId.includes('nematoda') ||
    s.includes('serabut akar') ||
    s.includes('akar hitam') ||
    s.includes('busuk akar') ||
    s.includes('puru akar') ||
    s.includes('orong-orong');

  if (isRootContext) {
    if (
      s.includes('orong') ||
      s.includes('uret') ||
      s.includes('nematoda') ||
      s.includes('puru') ||
      s.includes('bengkak') ||
      s.includes('putus') ||
      s.includes('gigit') ||
      cleanId === 'hama_akar_orong_nematoda'
    ) {
      return 'hama_akar_orong_nematoda';
    }
    if (
      (s.includes('sehat') || s.includes('putih segar') || s.includes('optimal') || cleanId === 'akar_sehat_optimal') &&
      !s.includes('busuk') &&
      !s.includes('hitam')
    ) {
      return 'akar_sehat_optimal';
    }
    return 'busuk_akar_keracunan_besi';
  }

  // 2. Cek kecocokan langsung di OFFICIAL_DISEASE_REGISTRY
  if (cleanId in OFFICIAL_DISEASE_REGISTRY) {
    const matched = cleanId as OfficialDiseaseId;
    // Jika pengguna/foto secara spesifik adalah Malai/Bunga dan terdeteksi blas_daun, arahkan ke blas_leher_malai
    if (matched === 'blas_daun' && plantPart === 'Malai / Bunga') {
      return 'blas_leher_malai';
    }
    return matched;
  }

  // 3. Jika bagian tanaman adalah Malai / Bunga atau Buah / Gabah
  if (
    s.includes('walang sangit') ||
    s.includes('walang_sangit') ||
    s.includes('leptocorisa') ||
    s.includes('kepik')
  ) {
    return 'walang_sangit_gabah';
  }
  if (
    s.includes('leher malai') ||
    s.includes('blas_leher') ||
    s.includes('neck blast') ||
    s.includes('busuk leher') ||
    (plantPart === 'Malai / Bunga' && s.includes('blas'))
  ) {
    return 'blas_leher_malai';
  }
  if (
    s.includes('gabah kotor') ||
    s.includes('kotor_bulir') ||
    s.includes('gosong palsu') ||
    s.includes('bercak bulir') ||
    s.includes('false smut')
  ) {
    return 'kotor_bulir_gabah';
  }

  if (
    s.includes('wereng') ||
    s.includes('wbc') ||
    s.includes('nilaparvata') ||
    s.includes('hopperburn') ||
    s.includes('terbakar') ||
    s.includes('mengering coklat')
  ) {
    return 'wereng_batang_coklat';
  }
  if (
    s.includes('kresek') ||
    s.includes('hdb') ||
    s.includes('xanthomonas') ||
    s.includes('bakteri') ||
    s.includes('hawar_daun_bakteri')
  ) {
    return 'kresek_hdb';
  }
  if (
    s.includes('putih_palsu') ||
    s.includes('putih palsu') ||
    s.includes('pelipat') ||
    s.includes('cnaphalocrocis')
  ) {
    return 'hama_putih_palsu';
  }
  if (s.includes('sempit') || s.includes('cercospora')) {
    return 'bercak_coklat_sempit';
  }
  if (
    s.includes('bercak_coklat') ||
    s.includes('bercak coklat') ||
    s.includes('bipolaris') ||
    s.includes('helminthosporium') ||
    s.includes('brown spot') ||
    s.includes('brown_spot')
  ) {
    return 'bercak_coklat';
  }
  if (s.includes('pelepah') || s.includes('rhizoctonia') || s.includes('sheath')) {
    return 'hawar_pelepah';
  }
  if (s.includes('tungro') || s.includes('virus') || s.includes('oranye')) {
    return 'tungro';
  }
  if (
    s.includes('sundep') ||
    s.includes('beluk') ||
    s.includes('penggerek') ||
    s.includes('scirpophaga') ||
    s.includes('stem_borer')
  ) {
    return 'sundep_beluk';
  }
  if (
    s.includes('kahat_k') ||
    s.includes('kalium') ||
    s.includes('besi') ||
    s.includes('bronzing') ||
    s.includes('fe')
  ) {
    return 'kahat_k_fe';
  }
  if (s.includes('kahat') || s.includes('nitrogen') || s.includes('defisiensi')) {
    return 'kahat_n';
  }
  if (s.includes('sehat') || s.includes('healthy') || s.includes('normal')) {
    return 'tanaman_sehat';
  }
  if (
    s.includes('antraknosa') ||
    s.includes('patek') ||
    s.includes('colletotrichum') ||
    commodity === 'Cabai'
  ) {
    return 'antraknosa_cabai';
  }
  if (s.includes('jagung') || s.includes('bulai') || commodity === 'Jagung') {
    return 'hawar_daun_jagung';
  }
  if (s.includes('blas') || s.includes('pyricularia') || s.includes('magnaporthe')) {
    return plantPart === 'Malai / Bunga' ? 'blas_leher_malai' : 'blas_daun';
  }

  // Default berdasarkan bagian tanaman agar selalu presisi sesuai organ yang diamati:
  if (plantPart === 'Batang') return 'wereng_batang_coklat';
  if (plantPart === 'Malai / Bunga') return 'blas_leher_malai';
  if (plantPart === 'Buah / Gabah') return 'walang_sangit_gabah';
  return 'kresek_hdb';
}

/**
 * Membangun objek DiagnosisResult lengkap secara deterministik & Zero-Mismatch
 * langsung dari `matchedDiseaseId` resmi beserta hasil observasi visual Gemini Vision.
 * Menjamin presisi bagian tanaman: jika foto adalah Akar -> dianalisis sebagai Akar, Batang -> Batang, Malai -> Malai, dst.
 */
export function buildDiagnosisFromMatchedDiseaseId(params: {
  matchedDiseaseId: OfficialDiseaseId | string;
  commodity?: CommodityType;
  plantPart?: DiagnosisResult['plantPart'];
  detectedPlantPartFromPhoto?: DiagnosisResult['plantPart'];
  organSpecificAnatomyCheck?: string;
  visualObservations?: string;
  confidenceScore?: number;
  differentialReasoning?: string;
  visibleSymptoms?: string[];
  plotId?: string;
  plotName?: string;
  aiModelUsed?: string;
  geminiAnalysisAnswer?: string;
}): DiagnosisResult {
  const effectiveInputPart = params.detectedPlantPartFromPhoto || params.plantPart;
  const normalizedId = normalizeOfficialDiseaseId(
    params.matchedDiseaseId,
    params.commodity,
    effectiveInputPart,
    params.visualObservations
  );
  const record = OFFICIAL_DISEASE_REGISTRY[normalizedId] || OFFICIAL_DISEASE_REGISTRY.kresek_hdb;
  const commodity: CommodityType = params.commodity || 'Padi';

  // Pastikan bagian tanaman (plantPart) benar-benar presisi sesuai organ yang terdeteksi pada foto / penyakitnya!
  let resolvedPlantPart: DiagnosisResult['plantPart'] =
    params.detectedPlantPartFromPhoto || params.plantPart || record.primaryPlantPart;
  if (
    normalizedId === 'busuk_akar_keracunan_besi' ||
    normalizedId === 'hama_akar_orong_nematoda' ||
    normalizedId === 'akar_sehat_optimal'
  ) {
    resolvedPlantPart = 'Akar';
  } else if (normalizedId === 'blas_leher_malai') {
    resolvedPlantPart = 'Malai / Bunga';
  } else if (normalizedId === 'walang_sangit_gabah' || normalizedId === 'kotor_bulir_gabah') {
    resolvedPlantPart =
      params.detectedPlantPartFromPhoto === 'Malai / Bunga' ? 'Malai / Bunga' : 'Buah / Gabah';
  } else if (
    (normalizedId === 'wereng_batang_coklat' ||
      normalizedId === 'hawar_pelepah' ||
      normalizedId === 'sundep_beluk') &&
    (!params.detectedPlantPartFromPhoto || params.detectedPlantPartFromPhoto === 'Daun') &&
    params.plantPart === 'Batang'
  ) {
    resolvedPlantPart = 'Batang';
  }

  const plotName = params.plotName || 'Lahan Pengamatan';

  const rawScore = Number(params.confidenceScore);
  const normalizedScore =
    Number.isFinite(rawScore) && rawScore > 0
      ? rawScore <= 1
        ? Math.round(rawScore * 100)
        : Math.round(rawScore)
      : record.defaultConfidencePct;
  const confidencePct = Math.min(99, Math.max(55, normalizedScore));

  const visualObservations =
    params.visualObservations && params.visualObservations.trim().length > 8
      ? params.visualObservations.trim()
      : record.defaultVisualObservations;

  const differentialReasoning =
    params.differentialReasoning && params.differentialReasoning.trim().length > 8
      ? params.differentialReasoning.trim()
      : record.defaultDifferentialReasoning;

  const organSpecificAnatomyCheck =
    params.organSpecificAnatomyCheck && params.organSpecificAnatomyCheck.trim().length > 5
      ? params.organSpecificAnatomyCheck.trim()
      : record.organSpecificAnatomyCheck;

  const visibleSymptoms =
    Array.isArray(params.visibleSymptoms) && params.visibleSymptoms.length > 0
      ? params.visibleSymptoms.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, 4)
      : record.defaultVisibleSymptoms;

  const matchedProducts = record.verifiedProductIds
    .map((pid) => VERIFIED_PESTICIDE_PRODUCTS.find((p) => p.id === pid))
    .filter((p): p is PesticideProduct => Boolean(p));

  const productSummaryLines = matchedProducts
    .slice(0, 3)
    .map(
      (p, idx) =>
        `• **Opsi #${idx + 1} (${p.category}) — ${p.activeIngredient}**: Merk dagang **${
          p.alternativeBrands && p.alternativeBrands.length > 0
            ? p.alternativeBrands.slice(0, 4).join(', ')
            : p.productName
        }** (Dosis: ${p.dosagePer16LTank || p.dosagePerLiter}).`
    )
    .join('\n');

  const defaultGeminiAnalysisAnswer =
    `Halo **Bosku / Sobat Tani**! Berdasarkan **Analisis Kamera Gemini AI 3.8 Flash** pada bagian **${resolvedPlantPart}** tanaman **${commodity}** di **${plotName}**, berikut kesimpulan tegas & solusinya:\n\n` +
    `**1. Hasil Deteksi Presisi Organ (${resolvedPlantPart}) — Keyakinan ${confidencePct}%:**\n` +
    `• Terdeteksi **${record.detectedName}** (*${record.scientificName}* — Kategori: ${record.causeCategory}).\n` +
    `• **Bukti Visual Organ**: ${visualObservations}\n` +
    `• **Alasan Ilmiah Gemini 3.8 Flash**: ${differentialReasoning}\n\n` +
    `**2. Pilihan Rekomendasi Bahan Aktif & Multi-Merk Dagang Terbaik:**\n` +
    `${productSummaryLines}\n\n` +
    `**3. Langkah Penanganan Cepat Hari Ini:**\n` +
    `• ${record.nonChemicalIpmActions[0] || 'Lakukan sanitasi lahan dan pengaturan air sesuai fase tanaman.'}\n` +
    `• ${record.nonChemicalIpmActions[1] || 'Gunakan dosis tepat dan lakukan rotasi bahan aktif agar patogen/hama tidak kebal.'}`;

  const geminiAnalysisAnswer =
    params.geminiAnalysisAnswer && params.geminiAnalysisAnswer.trim().length > 15
      ? params.geminiAnalysisAnswer.trim()
      : defaultGeminiAnalysisAnswer;

  return {
    id: `diag-${normalizedId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    plotId: params.plotId,
    commodity,
    plantPart: resolvedPlantPart,
    detectedPlantPartFromPhoto: resolvedPlantPart,
    organSpecificAnatomyCheck,
    matchedDiseaseId: normalizedId,
    visualObservations,
    differentialReasoning,
    imageQualityStatus: 'Tajam & Jelas',
    detectedName: record.detectedName,
    scientificName: record.scientificName,
    causeCategory: record.causeCategory,
    confidencePct,
    urgencyLevel: record.urgencyLevel,
    visibleSymptoms,
    visualEvidenceSummary: `Verifikasi Anatomi Organ (${resolvedPlantPart} ${commodity} — ${plotName}): ${organSpecificAnatomyCheck} Observasi Visual: ${visualObservations}`,
    diseaseInfoSummary: record.diseaseInfoSummary,
    alternativeDiagnoses: [
      {
        name: 'Analisis Pembeda Utama (Differential Diagnosis)',
        distinguishingCheck: differentialReasoning,
      },
      ...record.alternativeDiagnoses,
    ].slice(0, 3),
    missingInformation: record.missingInformation,
    followUpFieldChecks: record.followUpFieldChecks,
    nonChemicalIpmActions: record.nonChemicalIpmActions,
    biologicalAndSupportingRecommendations: record.biologicalAndSupportingRecommendations,
    // ZERO MISMATCH & MULTI-PRODUCT: Selalu menarik 3-4 produk terverifikasi (berbagai bahan aktif & merk dagang) dari OFFICIAL_DISEASE_REGISTRY
    verifiedProductIds: [...record.verifiedProductIds],
    validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi',
    sourceReferences: record.sourceReferences,
    aiModelUsed: params.aiModelUsed || 'Gemini AI 3.8 Flash (Multimodal Vision • Deteksi Organ Presisi)',
    geminiAnalysisAnswer,
  };
}

/**
 * Sampel Diagnosis Kamera AI untuk Pengujian Instan & Perbandingan Lapangan (Mencakup Daun, Batang, Akar, dan Malai/Gabah).
 */
export const SAMPLE_DIAGNOSIS_PRESETS: Record<string, DiagnosisResult> = {
  blas: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'blas_daun',
    commodity: 'Padi',
    plantPart: 'Daun',
    confidenceScore: 92,
    plotId: 'lahan-1',
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  }),
  kresek: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'kresek_hdb',
    commodity: 'Padi',
    plantPart: 'Daun',
    confidenceScore: 91,
    plotId: 'lahan-1',
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  }),
  bercak_coklat: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'bercak_coklat',
    commodity: 'Padi',
    plantPart: 'Daun',
    confidenceScore: 89,
    plotId: 'lahan-1',
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  }),
  tungro: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'tungro',
    commodity: 'Padi',
    plantPart: 'Daun',
    confidenceScore: 88,
    plotId: 'lahan-1',
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  }),
  wereng: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'wereng_batang_coklat',
    commodity: 'Padi',
    plantPart: 'Batang',
    confidenceScore: 91,
    plotId: 'lahan-2',
    plotName: 'Lahan 2 (Blok Selatan)',
  }),
  akar: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'busuk_akar_keracunan_besi',
    commodity: 'Padi',
    plantPart: 'Akar',
    confidenceScore: 93,
    plotId: 'lahan-1',
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  }),
  hama_akar: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'hama_akar_orong_nematoda',
    commodity: 'Padi',
    plantPart: 'Akar',
    confidenceScore: 91,
    plotId: 'lahan-1',
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  }),
  malai_gabah: buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: 'walang_sangit_gabah',
    commodity: 'Padi',
    plantPart: 'Buah / Gabah',
    confidenceScore: 92,
    plotId: 'lahan-1',
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  }),
};


/**
 * Panduan & Basis Pengetahuan Multi-Komoditas sesuai Layar 10 & Seksi 13.
 */
export const AGRONOMY_GUIDE_MODULES: AgronomyGuideModule[] = [
  {
    id: 'guide-budidaya-padi',
    commodity: 'Padi',
    title: 'Budidaya Padi',
    subtitle: 'Langkah lengkap dari olah lahan hingga panen',
    category: 'Budidaya Lengkap',
    readingTimeMinutes: 6,
    updatedAt: '2026-03-10',
    applicableRegion: 'Sawah Irigasi & Tadah Hujan Indonesia',
    sourceReference: 'Balai Besar Penelitian Tanaman Padi (BB Padi) — PTT Padi Sawah',
    reliabilityLevel: 'Standar Resmi Balitbangtan / BRMP Kementan',
    keyPoints: [
      'Gunakan benih bersertifikat varietas unggul baru (Ciherang, Inpari 32 HDB, Inpari 42) sebanyak 20–25 kg/Ha.',
      'Terapkan sistem tanam Jajar Legowo 2:1 (25 × 12,5 × 50 cm) untuk meningkatkan populasi tanaman pinggir hingga 33%.',
      'Lakukan pemupukan berimbang tepat waktu (7–10 HST, 20–25 HST, dan 35–42 HST) disertai pembacaan Bagan Warna Daun (BWD).',
      'Terapkan pengairan berselang (Alternate Wetting and Drying / AWD) untuk menghemat air 30% dan memperkuat perakaran.',
    ],
    steps: [
      {
        stepTitle: '1. Pengolahan Tanah & Bahan Organik (-21 s/d -1 HST)',
        detail: 'Bajak tanah sedalam 15–20 cm, benamkan kompos jerami matang 2 ton/Ha, lalu garu hingga lumpur rata agar genangan air seragam.',
      },
      {
        stepTitle: '2. Seleksi Benih & Persemaian (-18 s/d 0 HST)',
        detail: 'Seleksi benih bernas dengan larutan air garam (indikator telur mengapung), cuci bersih, rendam 24 jam, peram 48 jam, dan semai pada bedengan 400 m² per hektare lahan.',
      },
      {
        stepTitle: '3. Pindah Tanam Bibit Muda (0 HST)',
        detail: 'Pindahkan bibit umur 15–18 HSS sebanyak 2–3 batang per rumpun dengan kedalaman dangkal (2–3 cm) pada kondisi lahan macak-macak.',
      },
      {
        stepTitle: '4. Pemupukan Berimbang & Pengairan Berselang (7–65 HST)',
        detail: 'Berikan pupuk dasar/awal pada 7–10 HST, pupuk susulan kedua pada 21 HST berdasarkan BWD, dan pupuk susulan ketiga saat menjelang primordia bunga (35–40 HST).',
      },
      {
        stepTitle: '5. Panen Tepat Waktu & Pascapanen (90–105 HST)',
        detail: 'Panen saat 90–95% gabah pada malai telah menguning keras, rontokkan maksimal 24 jam setelah potong, dan jemur hingga kadar air GKG ≤ 14%.',
      },
    ],
  },
  {
    id: 'guide-pht-padi',
    commodity: 'Padi',
    title: 'Pengendalian Hama & Penyakit',
    subtitle: 'Solusi untuk berbagai gangguan tanaman',
    category: 'Pengendalian Hama & Penyakit',
    readingTimeMinutes: 5,
    updatedAt: '2026-03-12',
    applicableRegion: 'Nasional (Sentra Padi Indonesia)',
    sourceReference: 'Direktorat Perlindungan Tanaman Pangan Kementan RI',
    reliabilityLevel: 'Standar Resmi Balitbangtan / BRMP Kementan',
    keyPoints: [
      'Prinsip 1: Budidaya tanaman sehat melalui varietas tahan dan pupuk berimbang.',
      'Prinsip 2: Pelestarian dan pemanfaatan musuh alami (predator & parasitoid).',
      'Prinsip 3: Pengamatan agroekosistem mingguan secara rutin oleh petani.',
      'Prinsip 4: Petani sebagai ahli PHT; pestisida kimia hanya digunakan sebagai alternatif terakhir sesuai Ambang Pengendalian dan label resmi.',
    ],
    steps: [
      {
        stepTitle: '1. Pengamatan Diagonal 20 Rumpun',
        detail: 'Setiap minggu amati 20 rumpun secara diagonal untuk menghitung kepadatan populasi wereng, kelompok telur penggerek, bercak blas, dan populasi laba-laba.',
      },
      {
        stepTitle: '2. Tindakan Budidaya & Hayati',
        detail: 'Atur ketinggian air, sanitasi rumpun sakit, dan manfaatkan agens hayati (Beauveria bassiana, Paenibacillus polymyxa / Corynebacterium) pada gejala awal.',
      },
      {
        stepTitle: '3. Penggunaan Pestisida Terverifikasi Sesuai Label',
        detail: 'Pastikan Tepat Sasaran, Tepat Jenis Bahan Aktif, Tepat Dosis, Tepat Cara, Tepat Waktu, serta wajib memakai APD lengkap dan mematuhi interval pra-panen.',
      },
    ],
  },
  {
    id: 'guide-pemupukan',
    commodity: 'Padi',
    title: 'Pemupukan',
    subtitle: 'Rekomendasi berdasarkan fase tanaman',
    category: 'Pemupukan Berimbang',
    readingTimeMinutes: 4,
    updatedAt: '2026-03-08',
    applicableRegion: 'Sawah Irigasi & Tadah Hujan',
    sourceReference: 'Katam Terpadu & Perangkat Uji Tanah Sawah (PUTS) Kementan',
    reliabilityLevel: 'Standar Resmi Balitbangtan / BRMP Kementan',
    keyPoints: [
      'Hindari pemberian seluruh pupuk Urea sekaligus di awal tanam karena 60% akan menguap atau tercuci air.',
      'Fase Vegetatif Awal (7–10 HST) membutuhkan N, P, dan K untuk pembentukan akar dan anakan awal.',
      'Fase Anakan Aktif (20–25 HST) membutuhkan tambahan Nitrogen terukur sesuai pembacaan Bagan Warna Daun (BWD).',
      'Fase Primordia / Pembentukan Malai (35–42 HST) membutuhkan Kalium (K) dan Nitrogen untuk pengisian bernas.',
    ],
    steps: [
      {
        stepTitle: 'Tahap I (7–10 HST)',
        detail: 'Aplikasikan ± 75 kg Urea/Ha + 150 kg NPK Phonska/Ha pada kondisi air macak-macak.',
      },
      {
        stepTitle: 'Tahap II (20–25 HST)',
        detail: 'Cek Bagan Warna Daun (BWD). Bila skala < 4, aplikasikan ± 75–100 kg Urea/Ha setelah penyiangan gulma.',
      },
      {
        stepTitle: 'Tahap III (35–42 HST)',
        detail: 'Aplikasikan ± 150 kg NPK Phonska/Ha (atau tambahan KCl 50 kg/Ha pada tanah kahat K) untuk memaksimalkan bernas gabah.',
      },
    ],
  },
  {
    id: 'guide-pengairan',
    commodity: 'Padi',
    title: 'Pengairan',
    subtitle: 'Tips efisien untuk hasil maksimal',
    category: 'Pengairan Berselang',
    readingTimeMinutes: 4,
    updatedAt: '2026-03-05',
    applicableRegion: 'Sawah Irigasi Teknis & Pompa',
    sourceReference: 'IRRI & BB Padi — Teknologi Pengairan Berselang (AWD)',
    reliabilityLevel: 'Standar Resmi Balitbangtan / BRMP Kementan',
    keyPoints: [
      'Padi bukan tanaman akuatik murni; penggenangan terus-menerus menghambat oksigen akar dan memicu keracunan besi (Fe) serta hama wereng.',
      'Gunakan pipa berlubang (pipa AWD) sedalam 15 cm di bawah permukaan tanah untuk memantau muka air.',
      'Saat fase keluar bunga hingga pengisian susu (55–75 HST), pertahankan genangan tipis 3–5 cm agar bunga tidak hampa.',
    ],
    steps: [
      {
        stepTitle: 'Fase Tanam – 10 HST',
        detail: 'Kondisi tanah macak-macak (lembap tanpa genangan dalam) agar bibit cepat berakar dan keong mas tidak menyerang.',
      },
      {
        stepTitle: 'Fase Vegetatif Aktif (10–45 HST)',
        detail: 'Airi setinggi 3–5 cm, lalu biarkan air surut alami hingga permukaan tanah retak rambut sebelum diairi kembali.',
      },
      {
        stepTitle: '10–14 Hari Sebelum Panen',
        detail: 'Keringkan petakan sawah secara tuntas agar pematangan bulir serempak dan tanah keras saat mesin panen masuk.',
      },
    ],
  },
  {
    id: 'guide-varietas-unggul',
    commodity: 'Padi',
    title: 'Varietas Unggul',
    subtitle: 'Daftar varietas dan karakteristiknya',
    category: 'Varietas Unggul',
    readingTimeMinutes: 5,
    updatedAt: '2026-03-01',
    applicableRegion: 'Seluruh Wilayah Indonesia',
    sourceReference: 'Deskripsi Varietas Unggul Padi — BB Padi Kementan RI',
    reliabilityLevel: 'Standar Resmi Balitbangtan / BRMP Kementan',
    keyPoints: [
      'Ciherang: Umur ±116–125 HSS (90–95 HST), tekstur nasi pulen, potensi hasil 7–8,5 ton/Ha, tahan WBC biotipe 2 & 3.',
      'Inpari 32 HDB: Umur ±120 HSS, tahan Hawar Daun Bakteri (Kresek) dan agak tahan Blas, potensi hasil 8,4 ton/Ha, rendemen beras kepala tinggi.',
      'Inpari 42 Agritan GSR: Green Super Rice hemat air & pupuk, umur ±112 HSS, potensi hasil 9–10 ton/Ha, tahan rebah.',
      'Bisi 18 (Jagung Hibrida): Umur panen ±100 HST, tongkol seragam, potensi hasil 9–12 ton pipilan kering/Ha.',
    ],
    steps: [
      {
        stepTitle: 'Pemilihan Berdasarkan Musim & Endemisitas',
        detail: 'Pada musim hujan dengan risiko Kresek dan Blas tinggi, utamakan Inpari 32 HDB atau Inpari 42 dibanding varietas rentan.',
      },
      {
        stepTitle: 'Pergiliran Varietas Antarmusim',
        detail: 'Lakukan rotasi varietas setiap 2 musim tanam untuk memutus adaptasi biotipe hama wereng dan ras jamur blas.',
      },
    ],
  },
  {
    id: 'guide-jagung-cabai',
    commodity: 'Jagung',
    title: 'Tips Pertanian Modern & Multi-Komoditas',
    subtitle: 'Teknologi budidaya Jagung, Cabai, Kedelai & Bawang Merah',
    category: 'Budidaya Lengkap',
    readingTimeMinutes: 5,
    updatedAt: '2026-03-14',
    applicableRegion: 'Lahan Sawah Rotasi & Lahan Kering',
    sourceReference: 'Balitbangtan / BRMP Tanaman Serealia & Hortikultura',
    reliabilityLevel: 'Standar Resmi Balitbangtan / BRMP Kementan',
    keyPoints: [
      'Jagung Hibrida (Bisi 18 / NK): Jarak tanam 70 × 20 cm (1 tanaman/lubang), drainase bedengan wajib lancar karena jagung peka genangan.',
      'Cabai Merah: Gunakan mulsa plastik hitam perak (MPHP), kapur Dolomit pada pH < 6,0, dan pasang perangkap likat kuning untuk kutu kebul.',
      'Kedelai & Bawang Merah: Rotasi padi – palawija/hortikultura memutus siklus hama padi sekaligus memperbaiki struktur fisik dan biologi tanah.',
    ],
    steps: [
      {
        stepTitle: 'Rotasi Tanaman Padi – Jagung – Cabai',
        detail: 'Setelah 2 musim padi, tanam jagung atau kedelai pada Musim Kemarau (MK II) untuk memutus siklus penggerek batang dan menghemat air irigasi.',
      },
      {
        stepTitle: 'Pemantauan Kelembapan & pH Tanah Spesifik Komoditas',
        detail: 'Cabai dan bawang merah memerlukan drainase parit keliling yang dalam serta pH tanah optimal 6,0–6,8 agar tidak terserang layu Fusarium.',
      },
    ],
  },
];

/**
 * Membangun data awal (Seed Data) yang selaras 100% dengan Papan Presentasi UI TaniCerdas AI,
 * diberi penanda jujur `isDemoData: true` ("DATA DEMO") sesuai instruksi Master Prompt.
 */
export function buildInitialSeedState() {
  const lahan1Plan = generateCultivationPlanAndTasks({
    plotId: 'lahan-1',
    plotName: 'Lahan 1',
    commodity: 'Padi',
    varietyName: 'Varietas Ciherang',
    plantingDate: '2025-04-12',
    areaHa: 1.2,
    currentHst: 20,
  });

  const lahan2Plan = generateCultivationPlanAndTasks({
    plotId: 'lahan-2',
    plotName: 'Lahan 2',
    commodity: 'Padi',
    varietyName: 'Varietas Inpari 32',
    plantingDate: '2025-04-28',
    areaHa: 0.8,
    currentHst: 4,
  });

  const lahan3Plan = generateCultivationPlanAndTasks({
    plotId: 'lahan-3',
    plotName: 'Lahan 3',
    commodity: 'Jagung',
    varietyName: 'Bisi 18',
    plantingDate: '2025-04-10',
    areaHa: 0.5,
    currentHst: 22,
  });

  const lahan4Plan = generateCultivationPlanAndTasks({
    plotId: 'lahan-4',
    plotName: 'Lahan 4',
    commodity: 'Cabai',
    varietyName: 'Lokal',
    plantingDate: '2025-03-05',
    areaHa: 0.3,
    currentHst: 58,
  });

  const plots: FarmPlot[] = [
    {
      id: 'lahan-1',
      name: 'Lahan 1',
      locationVillage: 'Desa Larikrejo',
      locationDistrict: 'Undaan',
      locationRegency: 'Kudus, Jawa Tengah',
      coordinates: { lat: -6.899, lon: 110.802 },
      areaHa: 1.2,
      ownershipStatus: 'Milik Sendiri',
      soilType: 'Aluvial',
      irrigationSource: 'Irigasi Teknis',
      commodity: 'Padi',
      variety: 'Ciherang',
      plantingSystem: 'Jajar Legowo 2:1',
      seedingDate: '2025-03-26',
      plantingDate: '2025-04-12',
      targetYieldTonPerHa: 6.8,
      seasonStatus: 'Aktif',
      currentHst: 20,
      currentPhaseName: 'Vegetatif (20 HST)',
      estimatedHarvestDate: '2025-07-11',
      harvestUncertaintyDays: 5,
      notes: 'Blok sawah utama dekat saluran sekunder Undaan. Pemupukan Urea susulan dijadwalkan pada 20 HST.',
      isDemoData: true,
      phases: lahan1Plan.phases,
      soilObservation: {
        id: 'soil-1',
        plotId: 'lahan-1',
        recordedAt: 'Hari ini, 06:30 WIB',
        ph: 6.5,
        moisturePct: 62,
        soilTempC: 23,
        waterCondition: 'Lembap / Macak-macak',
        sourceType: 'Alat Ukur Tanah / pH Meter',
        notes: 'pH tanah 6.5 (Normal), Kelembapan 62% (Cukup), Suhu Tanah 23°C (Normal).',
      },
    },
    {
      id: 'lahan-2',
      name: 'Lahan 2',
      locationVillage: 'Desa Larikrejo',
      locationDistrict: 'Undaan',
      locationRegency: 'Kudus, Jawa Tengah',
      coordinates: { lat: -6.901, lon: 110.805 },
      areaHa: 0.8,
      ownershipStatus: 'Milik Sendiri',
      soilType: 'Aluvial',
      irrigationSource: 'Irigasi Teknis',
      commodity: 'Padi',
      variety: 'Inpari 32',
      plantingSystem: 'Jajar Legowo 2:1',
      seedingDate: '2025-04-12',
      plantingDate: '2025-04-28',
      targetYieldTonPerHa: 7.2,
      seasonStatus: 'Aktif',
      currentHst: 4,
      currentPhaseName: 'Tanam',
      estimatedHarvestDate: '2025-07-27',
      harvestUncertaintyDays: 5,
      notes: 'Varietas tahan HDB/Kresek. Sedang fase pemulihan bibit pasca pindah tanam.',
      isDemoData: true,
      phases: lahan2Plan.phases,
      soilObservation: {
        id: 'soil-2',
        plotId: 'lahan-2',
        recordedAt: 'Kemarin, 16:00 WIB',
        ph: 6.4,
        moisturePct: 70,
        soilTempC: 24,
        waterCondition: 'Lembap / Macak-macak',
        sourceType: 'Input Manual Petani',
        notes: 'Kondisi air macak-macak untuk merangsang perakaran bibit muda.',
      },
    },
    {
      id: 'lahan-3',
      name: 'Lahan 3',
      locationVillage: 'Desa Larikrejo',
      locationDistrict: 'Undaan',
      locationRegency: 'Kudus, Jawa Tengah',
      areaHa: 0.5,
      ownershipStatus: 'Sewa',
      soilType: 'Latosol',
      irrigationSource: 'Pompa Sumur Bor',
      commodity: 'Jagung',
      variety: 'Bisi 18',
      plantingSystem: 'Bedengan / Mulsa',
      plantingDate: '2025-04-10',
      targetYieldTonPerHa: 8.5,
      seasonStatus: 'Aktif',
      currentHst: 22,
      currentPhaseName: 'Vegetatif',
      estimatedHarvestDate: '2025-07-19',
      harvestUncertaintyDays: 4,
      notes: 'Jagung hibrida Bisi 18 pada lahan tegalan.',
      isDemoData: true,
      phases: lahan3Plan.phases,
      soilObservation: {
        id: 'soil-3',
        plotId: 'lahan-3',
        recordedAt: '2 hari lalu',
        ph: 6.3,
        moisturePct: 55,
        soilTempC: 25,
        waterCondition: 'Lembap / Macak-macak',
        sourceType: 'Input Manual Petani',
        notes: 'Drainase parit antar bedengan lancar.',
      },
    },
    {
      id: 'lahan-4',
      name: 'Lahan 4',
      locationVillage: 'Desa Larikrejo',
      locationDistrict: 'Undaan',
      locationRegency: 'Kudus, Jawa Tengah',
      areaHa: 0.3,
      ownershipStatus: 'Milik Sendiri',
      soilType: 'Andosol',
      irrigationSource: 'Pompa Sumur Bor',
      commodity: 'Cabai',
      variety: 'Lokal',
      plantingSystem: 'Bedengan / Mulsa',
      plantingDate: '2025-03-05',
      targetYieldTonPerHa: 10.0,
      seasonStatus: 'Aktif',
      currentHst: 58,
      currentPhaseName: 'Pembungaan',
      estimatedHarvestDate: '2025-06-15',
      harvestUncertaintyDays: 6,
      notes: 'Cabai merah lokal menggunakan mulsa plastik hitam perak.',
      isDemoData: true,
      phases: lahan4Plan.phases,
      soilObservation: {
        id: 'soil-4',
        plotId: 'lahan-4',
        recordedAt: '3 hari lalu',
        ph: 6.6,
        moisturePct: 60,
        soilTempC: 24,
        waterCondition: 'Lembap / Macak-macak',
        sourceType: 'Alat Ukur Tanah / pH Meter',
        notes: 'Bunga cabai mulai membentuk buah muda.',
      },
    },
  ];

  const tasks: ScheduledTask[] = [
    ...lahan1Plan.tasks,
    {
      id: 'lahan-2-task-1',
      plotId: 'lahan-2',
      plotName: 'Lahan 2',
      commodity: 'Padi',
      title: 'Penyulaman Bibit Padi (5–7 HST)',
      category: 'Penanaman',
      dateLabel: '3 Mei 2025',
      isoDate: '2025-05-03',
      timeSlot: '07:00 – 09:00',
      completed: false,
      dosageOrNote: 'Sulam rumpun kosong dengan bibit cadangan umur sama',
      phaseNumber: 3,
    },
    {
      id: 'lahan-3-task-1',
      plotId: 'lahan-3',
      plotName: 'Lahan 3',
      commodity: 'Jagung',
      title: 'Pembumbunan & Pemupukan Susulan Jagung',
      category: 'Pemupukan',
      dateLabel: '5 Mei 2025',
      isoDate: '2025-05-05',
      timeSlot: '06:30 – 09:00',
      completed: false,
      dosageOrNote: 'NPK 150 kg/Ha + Urea 100 kg/Ha dibenamkan di samping batang',
      phaseNumber: 4,
    },
  ];

  // Sesuai Layar 12 Papan Presentasi UI: Catatan Lahan (Riwayat)
  const activityLogs: ActivityLogItem[] = [
    {
      id: 'log-1',
      plotId: 'lahan-1',
      plotName: 'Lahan 1 (Padi)',
      commodity: 'Padi',
      dateLabel: '12 Apr 2025',
      isoDate: '2025-04-12',
      title: 'Tanam',
      category: 'Tanam',
      detail: 'Pindah tanam Padi Varietas Ciherang sistem Jajar Legowo 2:1 seluas 1,2 Ha.',
    },
    {
      id: 'log-2',
      plotId: 'lahan-1',
      plotName: 'Lahan 1 (Padi)',
      commodity: 'Padi',
      dateLabel: '20 Apr 2025',
      isoDate: '2025-04-20',
      title: 'Pemupukan (Urea)',
      category: 'Pemupukan',
      detail: 'Dosis: 150 kg/ha (Total 180 kg untuk 1,2 Ha) disertai NPK dasar.',
    },
    {
      id: 'log-3',
      plotId: 'lahan-1',
      plotName: 'Lahan 1 (Padi)',
      commodity: 'Padi',
      dateLabel: '28 Apr 2025',
      isoDate: '2025-04-28',
      title: 'Penyemprotan',
      category: 'Penyemprotan',
      detail: 'Difenokonazol 1 ml/l (Score 250 EC) pada area gejala awal bercak daun blas.',
    },
    {
      id: 'log-4',
      plotId: 'lahan-1',
      plotName: 'Lahan 1 (Padi)',
      commodity: 'Padi',
      dateLabel: '10 Mei 2025',
      isoDate: '2025-05-10',
      title: 'Pengamatan Hama & Penyakit',
      category: 'Pengamatan',
      detail: 'Tidak ada serangan baru. Bercak blas lama telah mengering dan daun baru sehat.',
    },
    {
      id: 'log-5',
      plotId: 'lahan-1',
      plotName: 'Lahan 1 (Padi)',
      commodity: 'Padi',
      dateLabel: '25 Jun 2025',
      isoDate: '2025-06-25',
      title: 'Estimasi Panen',
      category: 'Panen',
      detail: '± 15 hari lagi menuju jendela panen optimal (90 HST).',
    },
  ];

  const expenses: ExpenseRecord[] = [
    {
      id: 'exp-1',
      plotId: 'lahan-1',
      plotName: 'Lahan 1',
      date: '2025-04-02',
      category: 'Sewa Alat & Olah Lahan',
      itemName: 'Sewa Traktor Bajak & Garu Lumpur (1,2 Ha)',
      quantity: 1.2,
      unit: 'Ha',
      unitPriceRp: 1800000,
      totalRp: 2160000,
      isActual: true,
    },
    {
      id: 'exp-2',
      plotId: 'lahan-1',
      plotName: 'Lahan 1',
      date: '2025-04-05',
      category: 'Benih',
      itemName: 'Benih Padi Ciherang Bersertifikat Label Ungu',
      quantity: 30,
      unit: 'kg',
      unitPriceRp: 14000,
      totalRp: 420000,
      isActual: true,
    },
    {
      id: 'exp-3',
      plotId: 'lahan-1',
      plotName: 'Lahan 1',
      date: '2025-04-12',
      category: 'Tenaga Kerja',
      itemName: 'Upah Tanam Jajar Legowo 2:1',
      quantity: 1.2,
      unit: 'Ha',
      unitPriceRp: 1600000,
      totalRp: 1920000,
      isActual: true,
    },
    {
      id: 'exp-4',
      plotId: 'lahan-1',
      plotName: 'Lahan 1',
      date: '2025-04-20',
      category: 'Pupuk',
      itemName: 'Pupuk Urea (180 kg) & NPK Phonska (200 kg)',
      quantity: 380,
      unit: 'kg',
      unitPriceRp: 2550,
      totalRp: 969000,
      isActual: true,
    },
    {
      id: 'exp-5',
      plotId: 'lahan-1',
      plotName: 'Lahan 1',
      date: '2025-04-28',
      category: 'Pestisida',
      itemName: 'Fungisida Score 250 EC (250 ml × 2 botol)',
      quantity: 2,
      unit: 'botol',
      unitPriceRp: 165000,
      totalRp: 330000,
      isActual: true,
    },
  ];

  const harvests: HarvestRecord[] = [
    {
      id: 'harv-prev-1',
      plotId: 'lahan-1',
      plotName: 'Lahan 1 (Musim Tanam I - Sebelumnya)',
      commodity: 'Padi',
      variety: 'Ciherang',
      harvestDate: '2025-02-18',
      grossYieldKg: 8160,
      moistureContentPct: 18.5,
      estimatedLossPct: 2.5,
      netYieldKg: 7956,
      sellingPricePerKgRp: 6600,
      totalRevenueRp: 52509600,
      notes: 'Panen Musim Tanam I dengan combine harvester. Produktivitas setara 6,8 ton GKP/Ha.',
    },
  ];

  const seedDynamicDays = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(Date.now() + idx * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const fmt = formatDynamicForecastDateId(iso, idx);
    return {
      dayName: fmt.dayName,
      formattedDate: fmt.formattedDate,
      dateStr: fmt.dateStr,
      weatherCode: idx === 2 ? 61 : 2,
      condition: (idx === 2 ? 'Hujan Ringan' : 'Cerah Berawan') as WeatherSnapshot['forecast'][0]['condition'],
      tempMaxC: 32,
      tempMinC: 25,
      rainChancePct: idx === 2 ? 65 : 30,
      rainfallMm: idx === 2 ? 6 : 1,
      windSpeedMaxKmh: 12,
    };
  });

  const seedAdvisory = evaluateAgronomyWeatherAdvisory({
    tempC: 29,
    humidityPct: 82,
    rainfallMm: 0.5,
    rainProbabilityPct: 30,
    windSpeedKmh: 11,
    weatherCode: 2,
  });

  const defaultWeather: WeatherSnapshot = {
    locationName: DEFAULT_LARIKREJO_COORDS.locationName,
    latitude: DEFAULT_LARIKREJO_COORDS.latitude,
    longitude: DEFAULT_LARIKREJO_COORDS.longitude,
    locationSource: 'Koordinat Presisi Desa Larikrejo, Kudus',
    bmkgAdm4Code: DEFAULT_LARIKREJO_COORDS.bmkgAdm4Code,
    tempC: 29,
    apparentTempC: 32,
    weatherCode: 2,
    isDay: true,
    conditionText: 'Cerah Berawan',
    humidityPct: 82,
    rainfallMm: 0.5,
    rainMm: 0.5,
    rainProbabilityPct: 30,
    windSpeedKmh: 11,
    windDirectionDeg: 115,
    windDirectionCardinal: 'Tenggara',
    updatedAt:
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB',
    sourceName: 'Open-Meteo Live & BMKG (Menyinkronkan API Real-Time...)',
    providerMode: 'bmkg-hybrid',
    isLiveApi: false,
    sprayingAdvisory: seedAdvisory,
    forecast: seedDynamicDays,
  };

  // Profil Tanaman di Dasbor (Nama Tanaman, Jenis, Tanggal Tanam, Persyaratan Nutrisi, Kebutuhan Air, Toleransi Suhu, Catatan Khusus)
  const cropProfiles: CropProfile[] = [
    {
      id: 'prof-padi-ciherang',
      ownerId: DEFAULT_USER_PROFILE.id,
      plotId: 'lahan-1',
      namaTanaman: 'Padi Sawah Blok Utama (Lahan 1)',
      jenis: 'Padi Inbrida — Varietas Ciherang',
      tanggalTanam: '2025-04-12',
      persyaratanNutrisi: 'Urea 200 kg/Ha (3 tahap BWD) + NPK Phonska 300 kg/Ha + Kompos Jerami 2 ton/Ha',
      kebutuhanAir: 'Pengairan berselang (AWD) macak-macak 3–5 cm; kelembapan tanah optimal 65–85%',
      toleransiSuhu: '22°C – 32°C (Optimal pembentukan anakan & pengisian bulir)',
      tempMinC: 22,
      tempMaxC: 32,
      moistureMinPct: 65,
      moistureMaxPct: 85,
      catatanKhusus: 'Peka terhadap Blas daun bila kelembapan udara >85% disertai embun pagi dan kelebihan pupuk Nitrogen.',
      updatedAt: '2025-05-02T07:00:00Z',
    },
    {
      id: 'prof-padi-inpari32',
      ownerId: DEFAULT_USER_PROFILE.id,
      plotId: 'lahan-2',
      namaTanaman: 'Padi Sawah Blok Timur (Lahan 2)',
      jenis: 'Padi Inbrida — Varietas Inpari 32 HDB',
      tanggalTanam: '2025-04-28',
      persyaratanNutrisi: 'Urea 175 kg/Ha + NPK Phonska 300 kg/Ha + Silika cair saat vegetatif',
      kebutuhanAir: 'Macak-macak 2–3 cm pada fase adaptasi awal (0–10 HST); kelembapan optimal 65–85%',
      toleransiSuhu: '23°C – 33°C (Tahan Kresek/HDB, perlu pemantauan penggerek batang)',
      tempMinC: 23,
      tempMaxC: 33,
      moistureMinPct: 65,
      moistureMaxPct: 85,
      catatanKhusus: 'Tahan Hawar Daun Bakteri (Kresek). Pantau keong mas pada 1–10 HST dan pasang saringan saluran masuk.',
      updatedAt: '2025-05-02T07:15:00Z',
    },
    {
      id: 'prof-jagung-bisi18',
      ownerId: DEFAULT_USER_PROFILE.id,
      plotId: 'lahan-3',
      namaTanaman: 'Jagung Hibrida Tegalan (Lahan 3)',
      jenis: 'Jagung Hibrida — Varietas Bisi 18',
      tanggalTanam: '2025-04-10',
      persyaratanNutrisi: 'NPK 350 kg/Ha + Urea 250 kg/Ha (dibenamkan di samping batang pada 15 & 35 HST)',
      kebutuhanAir: 'Lembap 50–70% tanpa genangan; parit drainase antar bedengan wajib lancar',
      toleransiSuhu: '21°C – 34°C (Sangat butuh penyinaran matahari penuh)',
      tempMinC: 21,
      tempMaxC: 34,
      moistureMinPct: 50,
      moistureMaxPct: 75,
      catatanKhusus: 'Hindari genangan air >24 jam karena akar jagung rentan busuk dan daun bawah menguning.',
      updatedAt: '2025-05-02T07:30:00Z',
    },
  ];

  // Peta Panas (Heatmap 4x4 = 16 Sektor Petakan Sawah) untuk Visualisasi Area yang Membutuhkan Perhatian
  const heatmapSectors: HeatmapSector[] = [
    { id: 'sec-A1', row: 0, col: 0, sectorCode: 'A1', sectionName: 'Blok Utara-Barat', plotName: 'Lahan 1', moisturePct: 72, ph: 6.5, riskScore: 18, riskCategory: 'Optimal', primaryIssue: 'Kondisi hara & air seimbang', recommendedAction: 'Pertahankan pengairan macak-macak rutin' },
    { id: 'sec-A2', row: 0, col: 1, sectorCode: 'A2', sectionName: 'Blok Utara-Tengah', plotName: 'Lahan 1', moisturePct: 70, ph: 6.4, riskScore: 24, riskCategory: 'Optimal', primaryIssue: 'Normal, embun pagi sedang', recommendedAction: 'Lanjutkan pengamatan mingguan' },
    { id: 'sec-A3', row: 0, col: 2, sectorCode: 'A3', sectionName: 'Blok Utara-Timur 1', plotName: 'Lahan 1', moisturePct: 86, ph: 5.8, riskScore: 78, riskCategory: 'Perhatian Tinggi', primaryIssue: 'Kelembapan mikro tinggi & gejala awal bercak Blas', recommendedAction: 'Kurangi genangan air, tunda Urea tunggal, cek 20 rumpun diagonal' },
    { id: 'sec-A4', row: 0, col: 3, sectorCode: 'A4', sectionName: 'Blok Utara-Timur 2', plotName: 'Lahan 1', moisturePct: 88, ph: 5.7, riskScore: 82, riskCategory: 'Perhatian Tinggi', primaryIssue: 'Kanopi terlalu rapat & embun pagi tebal (Risiko Blas)', recommendedAction: 'Buka saluran pembuangan air dan sanitasi gulma pematang' },
    { id: 'sec-B1', row: 1, col: 0, sectorCode: 'B1', sectionName: 'Blok Tengah-Barat', plotName: 'Lahan 1', moisturePct: 68, ph: 6.6, riskScore: 22, riskCategory: 'Optimal', primaryIssue: 'Anakan produktif tumbuh seragam', recommendedAction: 'Siapkan pengukuran BWD pada 21 HST' },
    { id: 'sec-B2', row: 1, col: 1, sectorCode: 'B2', sectionName: 'Blok Sentral 1', plotName: 'Lahan 1', moisturePct: 64, ph: 6.5, riskScore: 30, riskCategory: 'Optimal', primaryIssue: 'Skor BWD 3.8 (Sedikit butuh N)', recommendedAction: 'Jadwalkan Urea susulan 75 kg/Ha sesuai BWD' },
    { id: 'sec-B3', row: 1, col: 2, sectorCode: 'B3', sectionName: 'Blok Sentral 2', plotName: 'Lahan 1', moisturePct: 75, ph: 6.2, riskScore: 52, riskCategory: 'Waspada', primaryIssue: 'Ditemukan 4 ekor wereng coklat/rumpun di pangkal batang', recommendedAction: 'Keringkan petakan 3 hari (AWD) dan lestarikan laba-laba Lycosa' },
    { id: 'sec-B4', row: 1, col: 3, sectorCode: 'B4', sectionName: 'Blok Tengah-Timur', plotName: 'Lahan 1', moisturePct: 79, ph: 6.0, riskScore: 58, riskCategory: 'Waspada', primaryIssue: 'Populasi wereng 5 ekor/rumpun & kelembapan tinggi', recommendedAction: 'Aplikasikan agens hayati Beauveria bassiana sore hari' },
    { id: 'sec-C1', row: 2, col: 0, sectorCode: 'C1', sectionName: 'Blok Selatan-Barat', plotName: 'Lahan 2', moisturePct: 54, ph: 6.4, riskScore: 64, riskCategory: 'Waspada', primaryIssue: 'Tanah mulai retak, kekurangan pasokan air dari saluran tersier', recommendedAction: 'Buka pintu air tersier selama 4 jam hingga kondisi macak-macak' },
    { id: 'sec-C2', row: 2, col: 1, sectorCode: 'C2', sectionName: 'Blok Selatan-Tengah 1', plotName: 'Lahan 2', moisturePct: 67, ph: 6.5, riskScore: 25, riskCategory: 'Optimal', primaryIssue: 'Bibit Inpari 32 pulih baik (4 HST)', recommendedAction: 'Cek rumpun kosong untuk penyulaman 7 HST' },
    { id: 'sec-C3', row: 2, col: 2, sectorCode: 'C3', sectionName: 'Blok Selatan-Tengah 2', plotName: 'Lahan 2', moisturePct: 69, ph: 6.5, riskScore: 20, riskCategory: 'Optimal', primaryIssue: 'Pertumbuhan bibit normal', recommendedAction: 'Pertahankan muka air tipis 2 cm' },
    { id: 'sec-C4', row: 2, col: 3, sectorCode: 'C4', sectionName: 'Blok Selatan-Timur', plotName: 'Lahan 2', moisturePct: 74, ph: 6.3, riskScore: 48, riskCategory: 'Waspada', primaryIssue: 'Terlihat kelompok telur keong mas di pinggir pematang', recommendedAction: 'Pungut kelompok telur merah muda & pasang saringan kawat di inlet air' },
    { id: 'sec-D1', row: 3, col: 0, sectorCode: 'D1', sectionName: 'Tegalan Barat 1', plotName: 'Lahan 3', moisturePct: 48, ph: 6.3, riskScore: 74, riskCategory: 'Perhatian Tinggi', primaryIssue: 'Defisit kelembapan tanah (<50%) pada zona perakaran', recommendedAction: 'Segera lakukan pengairan pompa sumur bor pada alur bedengan' },
    { id: 'sec-D2', row: 3, col: 1, sectorCode: 'D2', sectionName: 'Tegalan Barat 2', plotName: 'Lahan 3', moisturePct: 58, ph: 6.4, riskScore: 28, riskCategory: 'Optimal', primaryIssue: 'Kelembapan bedengan cukup', recommendedAction: 'Lanjutkan pembumbunan batang' },
    { id: 'sec-D3', row: 3, col: 2, sectorCode: 'D3', sectionName: 'Bedengan Cabai 1', plotName: 'Lahan 4', moisturePct: 62, ph: 6.6, riskScore: 22, riskCategory: 'Optimal', primaryIssue: 'Pembungaan cabai aktif & mulsa rapi', recommendedAction: 'Berikan pupuk KNO3/Kalium fase pembungaan' },
    { id: 'sec-D4', row: 3, col: 3, sectorCode: 'D4', sectionName: 'Bedengan Cabai 2', plotName: 'Lahan 4', moisturePct: 61, ph: 6.5, riskScore: 34, riskCategory: 'Optimal', primaryIssue: 'Normal, terpantau sedikit kutu kebul di perangkap kuning', recommendedAction: 'Perbarui lem perangkap kuning di sudut timur' },
  ];

  // Data Deret Waktu Suhu (°C) & Kelembapan (%) 14 Hari Terakhir untuk Bagan Garis (Line Chart)
  const telemetrySeries = [
    { dateLabel: '19 Apr', isoDate: '2025-04-19', tempC: 27.5, humidityPct: 74, soilMoisturePct: 68, rainfallMm: 2 },
    { dateLabel: '20 Apr', isoDate: '2025-04-20', tempC: 28.2, humidityPct: 72, soilMoisturePct: 66, rainfallMm: 0 },
    { dateLabel: '21 Apr', isoDate: '2025-04-21', tempC: 29.0, humidityPct: 70, soilMoisturePct: 64, rainfallMm: 0 },
    { dateLabel: '22 Apr', isoDate: '2025-04-22', tempC: 30.1, humidityPct: 68, soilMoisturePct: 61, rainfallMm: 0 },
    { dateLabel: '23 Apr', isoDate: '2025-04-23', tempC: 31.4, humidityPct: 65, soilMoisturePct: 58, rainfallMm: 0 },
    { dateLabel: '24 Apr', isoDate: '2025-04-24', tempC: 29.5, humidityPct: 78, soilMoisturePct: 71, rainfallMm: 12 },
    { dateLabel: '25 Apr', isoDate: '2025-04-25', tempC: 27.8, humidityPct: 84, soilMoisturePct: 75, rainfallMm: 18 },
    { dateLabel: '26 Apr', isoDate: '2025-04-26', tempC: 27.2, humidityPct: 87, soilMoisturePct: 78, rainfallMm: 14 },
    { dateLabel: '27 Apr', isoDate: '2025-04-27', tempC: 28.0, humidityPct: 85, soilMoisturePct: 74, rainfallMm: 6 },
    { dateLabel: '28 Apr', isoDate: '2025-04-28', tempC: 28.6, humidityPct: 82, soilMoisturePct: 70, rainfallMm: 3 },
    { dateLabel: '29 Apr', isoDate: '2025-04-29', tempC: 29.3, humidityPct: 79, soilMoisturePct: 67, rainfallMm: 1 },
    { dateLabel: '30 Apr', isoDate: '2025-04-30', tempC: 30.0, humidityPct: 76, soilMoisturePct: 65, rainfallMm: 0 },
    { dateLabel: '01 Mei', isoDate: '2025-05-01', tempC: 28.9, humidityPct: 83, soilMoisturePct: 64, rainfallMm: 5 },
    { dateLabel: '02 Mei', isoDate: '2025-05-02', tempC: 28.0, humidityPct: 86, soilMoisturePct: 62, rainfallMm: 2 },
  ];

  // Data Perbandingan Hasil Panen di Berbagai Bagian Lahan untuk Bagan Batang (Bar Chart)
  const sectionYieldComparison = [
    {
      id: 'sec-yield-1',
      sectionLabel: 'Lahan 1 — Blok Barat (Ciherang)',
      variety: 'Ciherang (Jajar Legowo 2:1)',
      areaHa: 0.6,
      actualTonPerHa: 7.1,
      targetTonPerHa: 6.8,
      totalKg: 4260,
      seasonLabel: 'MT I 2025',
    },
    {
      id: 'sec-yield-2',
      sectionLabel: 'Lahan 1 — Blok Timur (Ciherang)',
      variety: 'Ciherang (Jajar Legowo 2:1)',
      areaHa: 0.6,
      actualTonPerHa: 6.5,
      targetTonPerHa: 6.8,
      totalKg: 3900,
      seasonLabel: 'MT I 2025',
    },
    {
      id: 'sec-yield-3',
      sectionLabel: 'Lahan 2 — Blok Irigasi (Inpari 32)',
      variety: 'Inpari 32 HDB',
      areaHa: 0.8,
      actualTonPerHa: 7.6,
      targetTonPerHa: 7.2,
      totalKg: 6080,
      seasonLabel: 'MT I 2025',
    },
    {
      id: 'sec-yield-4',
      sectionLabel: 'Lahan 3 — Petak Rotasi (Inpari 42)',
      variety: 'Inpari 42 Agritan GSR',
      areaHa: 0.5,
      actualTonPerHa: 7.9,
      targetTonPerHa: 7.5,
      totalKg: 3950,
      seasonLabel: 'MT III 2024',
    },
  ];

  // ============================================================================
  // TAHAP 1 — ENTITAS DATABASE PERSISTEN BUDIDAYA PADI DARI LAHAN SAMPAI PANEN
  // ============================================================================
  const farms: FarmEntity[] = [
    {
      id: 'lahan-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      name: 'Lahan 1 — Blok Sawah Utama',
      location: 'Desa Larikrejo, Kec. Undaan, Kab. Kudus',
      areaValue: 1.2,
      areaUnit: 'ha',
      areaHaNormalized: 1.2,
      soilType: 'Aluvial Sawah',
      waterSource: 'Irigasi Teknis',
      notes: 'Dekat saluran sekunder Undaan. Tanah subur pH 6,5.',
      isArchived: false,
      createdAt: '2025-01-10T08:00:00Z',
      updatedAt: '2025-05-01T08:00:00Z',
    },
    {
      id: 'lahan-2',
      ownerId: DEFAULT_USER_PROFILE.id,
      name: 'Lahan 2 — Blok Timur Irigasi',
      location: 'Desa Larikrejo, Kec. Undaan, Kab. Kudus',
      areaValue: 8000,
      areaUnit: 'm2',
      areaHaNormalized: 0.8,
      soilType: 'Aluvial Lempung Berliat',
      waterSource: 'Irigasi Teknis',
      notes: 'Cocok untuk varietas tahan HDB/Kresek pada musim penghujan.',
      isArchived: false,
      createdAt: '2025-01-15T08:00:00Z',
      updatedAt: '2025-04-28T08:00:00Z',
    },
  ];

  const season1Lifecycle = generate14StageRiceLifecycle({
    seasonId: 'season-padi-1',
    farmId: 'lahan-1',
    ownerId: DEFAULT_USER_PROFILE.id,
    variety: 'Ciherang',
    plantedAreaHa: 1.2,
    seedingDate: '2025-03-26',
    plantingDate: '2025-04-12',
    cultivationSystem: 'Pindah Tanam (Jajar Legowo 2:1)',
    currentHst: 20,
  });

  const season2Lifecycle = generate14StageRiceLifecycle({
    seasonId: 'season-padi-2',
    farmId: 'lahan-2',
    ownerId: DEFAULT_USER_PROFILE.id,
    variety: 'Inpari 32 HDB',
    plantedAreaHa: 0.8,
    seedingDate: '2025-04-12',
    plantingDate: '2025-04-28',
    cultivationSystem: 'Pindah Tanam (Jajar Legowo 2:1)',
    currentHst: 4,
  });

  const growingSeasons: GrowingSeasonEntity[] = [
    {
      id: 'season-padi-1',
      farmId: 'lahan-1',
      farmName: 'Lahan 1 — Blok Sawah Utama',
      ownerId: DEFAULT_USER_PROFILE.id,
      commodity: 'Padi',
      variety: 'Ciherang',
      plantedAreaHa: 1.2,
      startDate: '2025-03-22',
      seedingDate: '2025-03-26',
      plantingDate: '2025-04-12',
      cultivationSystem: 'Pindah Tanam (Jajar Legowo 2:1)',
      currentStageOrder: season1Lifecycle.currentStageOrder,
      currentStageName: season1Lifecycle.currentStageName,
      currentHst: 20,
      targetYieldKg: 8160,
      status: 'Aktif',
      estimatedHarvestDate: season1Lifecycle.estimatedHarvestDate,
      harvestWindowEnd: season1Lifecycle.harvestWindowEnd,
      initialSoilCondition: 'Lumpur aluvial rata, pH 6,5, air irigasi teknis lancar',
      previousCropHistory: 'Padi Musim Tanam I (Panen Februari 2025 — 6,8 Ton/Ha)',
      notes: 'Musim Tanam II Padi Ciherang dengan sistem Jajar Legowo 2:1.',
      stages: season1Lifecycle.stages,
      createdAt: '2025-03-22T07:00:00Z',
      updatedAt: '2025-05-02T07:00:00Z',
    },
    {
      id: 'season-padi-2',
      farmId: 'lahan-2',
      farmName: 'Lahan 2 — Blok Timur Irigasi',
      ownerId: DEFAULT_USER_PROFILE.id,
      commodity: 'Padi',
      variety: 'Inpari 32 HDB',
      plantedAreaHa: 0.8,
      startDate: '2025-04-07',
      seedingDate: '2025-04-12',
      plantingDate: '2025-04-28',
      cultivationSystem: 'Pindah Tanam (Jajar Legowo 2:1)',
      currentStageOrder: season2Lifecycle.currentStageOrder,
      currentStageName: season2Lifecycle.currentStageName,
      currentHst: 4,
      targetYieldKg: 5760,
      status: 'Aktif',
      estimatedHarvestDate: season2Lifecycle.estimatedHarvestDate,
      harvestWindowEnd: season2Lifecycle.harvestWindowEnd,
      initialSoilCondition: 'Tanah aluvial macak-macak, pH 6,4, jerami sisa musim lalu sudah dikomposkan',
      previousCropHistory: 'Padi Inpari 32 (Panen Maret 2025)',
      notes: 'Fokus pencegahan Kresek dan pemantauan keong mas fase adaptasi awal.',
      stages: season2Lifecycle.stages,
      createdAt: '2025-04-07T07:00:00Z',
      updatedAt: '2025-05-02T07:00:00Z',
    },
  ];

  const cultivationTasks: CultivationTaskEntity[] = [
    ...season1Lifecycle.tasks,
    ...season2Lifecycle.tasks,
  ];

  const seasonActivityLogs: SeasonActivityLog[] = [
    {
      id: 'act-log-1',
      farmId: 'lahan-1',
      seasonId: 'season-padi-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      activityType: 'Olah Lahan',
      executionDate: '2025-04-02',
      inputUsed: 'Traktor Rotari & Kompos Jerami Matang',
      quantity: 1.2,
      unit: 'Ha',
      unitPriceRp: 1800000,
      actualCostRp: 2160000,
      notes: 'Pembajakan pertama dan pelumpuran merata sedalam 20 cm.',
      createdAt: '2025-04-02T16:00:00Z',
    },
    {
      id: 'act-log-2',
      farmId: 'lahan-1',
      seasonId: 'season-padi-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      activityType: 'Semai',
      executionDate: '2025-03-26',
      inputUsed: 'Benih Padi Ciherang Label Ungu Bersertifikat',
      quantity: 30,
      unit: 'kg',
      unitPriceRp: 14000,
      actualCostRp: 420000,
      notes: 'Seleksi benih bernas dengan air garam dan pemeraman 48 jam.',
      createdAt: '2025-03-26T10:00:00Z',
    },
    {
      id: 'act-log-3',
      farmId: 'lahan-1',
      seasonId: 'season-padi-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      activityType: 'Tanam',
      executionDate: '2025-04-12',
      inputUsed: 'Regu Tanam Jajar Legowo 2:1',
      quantity: 1.2,
      unit: 'Ha',
      unitPriceRp: 1600000,
      actualCostRp: 1920000,
      notes: 'Pindah tanam bibit umur 17 HSS sebanyak 2–3 batang/rumpun.',
      createdAt: '2025-04-12T15:30:00Z',
    },
    {
      id: 'act-log-4',
      farmId: 'lahan-1',
      seasonId: 'season-padi-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      activityType: 'Pemupukan',
      executionDate: '2025-04-20',
      inputUsed: 'Pupuk Urea (90 kg) + NPK Phonska (180 kg)',
      quantity: 270,
      unit: 'kg',
      unitPriceRp: 2600,
      actualCostRp: 702000,
      notes: 'Pemupukan dasar tahap I pada 8 HST kondisi air macak-macak.',
      createdAt: '2025-04-20T09:30:00Z',
    },
  ];

  const seasonExpenseRecords: SeasonExpenseRecord[] = [
    {
      id: 'sexp-1',
      seasonId: 'season-padi-1',
      farmId: 'lahan-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      category: 'Sewa Alat',
      description: 'Sewa Traktor Bajak & Garu Lumpur (1,2 Ha)',
      quantity: 1.2,
      unit: 'Ha',
      unitPriceRp: 1800000,
      totalRp: 2160000,
      date: '2025-04-02',
      notes: 'Tercatat otomatis dari aktivitas Olah Lahan',
      linkedActivityId: 'act-log-1',
      createdAt: '2025-04-02T16:00:00Z',
    },
    {
      id: 'sexp-2',
      seasonId: 'season-padi-1',
      farmId: 'lahan-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      category: 'Benih',
      description: 'Benih Padi Ciherang Bersertifikat Label Ungu',
      quantity: 30,
      unit: 'kg',
      unitPriceRp: 14000,
      totalRp: 420000,
      date: '2025-03-26',
      notes: 'Tercatat dari aktivitas Semai',
      linkedActivityId: 'act-log-2',
      createdAt: '2025-03-26T10:00:00Z',
    },
    {
      id: 'sexp-3',
      seasonId: 'season-padi-1',
      farmId: 'lahan-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      category: 'Tenaga Kerja',
      description: 'Upah Tanam Jajar Legowo 2:1',
      quantity: 1.2,
      unit: 'Ha',
      unitPriceRp: 1600000,
      totalRp: 1920000,
      date: '2025-04-12',
      notes: 'Tercatat dari aktivitas Tanam',
      linkedActivityId: 'act-log-3',
      createdAt: '2025-04-12T15:30:00Z',
    },
    {
      id: 'sexp-4',
      seasonId: 'season-padi-1',
      farmId: 'lahan-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      category: 'Pupuk',
      description: 'Pupuk Urea (90 kg) + NPK Phonska (180 kg)',
      quantity: 270,
      unit: 'kg',
      unitPriceRp: 2600,
      totalRp: 702000,
      date: '2025-04-20',
      notes: 'Pemupukan dasar 8 HST',
      linkedActivityId: 'act-log-4',
      createdAt: '2025-04-20T09:30:00Z',
    },
    {
      id: 'sexp-5',
      seasonId: 'season-padi-1',
      farmId: 'lahan-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      category: 'Irigasi',
      description: 'Iuran P3A Dharma Tirta Musim Tanam II',
      quantity: 1,
      unit: 'Musim',
      unitPriceRp: 350000,
      totalRp: 350000,
      date: '2025-04-15',
      notes: 'Biaya operasional air irigasi teknis',
      createdAt: '2025-04-15T11:00:00Z',
    },
  ];

  const seasonHarvestRecords: SeasonHarvestRecord[] = [
    {
      id: 'sharv-1',
      seasonId: 'season-padi-1',
      farmId: 'lahan-1',
      ownerId: DEFAULT_USER_PROFILE.id,
      harvestDate: '2025-02-18',
      harvestedAreaHa: 1.2,
      actualYieldKg: 8160,
      moisturePct: 18.5,
      sellingPricePerKgRp: 6600,
      grossRevenueRp: 53856000,
      harvestCostRp: 4200000,
      notes: 'Rekor referensi panen Musim Tanam I sebelumnya (Combine Harvester).',
      createdAt: '2025-02-18T17:00:00Z',
    },
  ];

  return {
    plots,
    tasks,
    activityLogs,
    expenses,
    harvests,
    defaultWeather,
    cropProfiles,
    heatmapSectors,
    telemetrySeries,
    sectionYieldComparison,
    farms,
    growingSeasons,
    cultivationTasks,
    seasonActivityLogs,
    seasonExpenseRecords,
    seasonHarvestRecords,
  };
}
