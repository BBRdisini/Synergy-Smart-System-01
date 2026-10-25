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

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr-budi-santoso',
  name: 'Budi Santoso',
  role: 'Petani Padi',
  village: 'Desa Larikrejo, Undaan, Kudus',
  emailOrPhone: 'budi@email.com',
  isLoggedIn: true,
  privacyConsentAccepted: true,
};

/**
 * Basis Data Referensi Pestisida & Bahan Aktif Terverifikasi sesuai Papan Presentasi UI TaniCerdas AI
 * dan Komisi Pestisida Kementan RI.
 */
export const VERIFIED_PESTICIDE_PRODUCTS: PesticideProduct[] = [
  {
    id: 'prod-score-250ec',
    productName: 'Score 250 EC',
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 0102011990943',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Difenokonazol',
    concentration: '250 g/l',
    formulation: 'EC (Emulsifiable Concentrate)',
    allowedCommodities: ['Padi', 'Jagung', 'Cabai', 'Bawang Merah', 'Tomat'],
    targetOrganisms: [
      'Blas (Pyricularia oryzae)',
      'Hawar Pelepah (Rhizoctonia solani)',
      'Bercak Coklat Sempit (Cercospora janseana)',
    ],
    dosagePerLiter: '1 ml per liter air (± 1 L/ha)',
    dosagePerHaEstimate: '± 0,5 – 1,0 L/ha (sesuai volume semprot)',
    sprayVolumePerHa: '400 – 600 L/ha (Semprot volume tinggi)',
    applicationMethod: 'Semprot volume tinggi (400–600 L/ha) pada daun dan malai saat gejala awal muncul',
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
    resistanceWarning: 'Fungisida golongan Triazol (FRAC Grup 3). Rotasikan dengan fungisida kontak (misal Mankozeb) untuk mencegah resistensi jamur.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Kemasan Score 250 EC',
    verificationDate: '2026-03-15',
    dataVersion: 'v2.4-KEMENTAN',
  },
  {
    id: 'prod-antracol-70wp',
    productName: 'Antracol 70 WP',
    manufacturer: 'PT Bayer Indonesia',
    registrationNumber: 'RI. 010201197476',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Propineb / Mankozeb Kompleks Seng',
    concentration: '70%',
    formulation: 'WP (Wettable Powder)',
    allowedCommodities: ['Padi', 'Cabai', 'Bawang Merah', 'Tomat', 'Jagung'],
    targetOrganisms: [
      'Bercak Daun & Blas (Pyricularia oryzae)',
      'Antraknosa / Patek Cabai (Colletotrichum spp.)',
      'Bercak Ungu Bawang (Alternaria porri)',
    ],
    dosagePerLiter: '2 g/l air (± 1 kg/ha)',
    dosagePerHaEstimate: '± 1,0 – 1,5 kg/ha',
    sprayVolumePerHa: '400 – 500 L/ha (Semprot volume tinggi)',
    applicationMethod: 'Semprot volume tinggi merata pada permukaan atas dan bawah daun',
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
      'Jangan membuang sisa larutan semprot ke saluran perikanan.',
    ],
    resistanceWarning: 'Fungisida kontak multi-situs (FRAC Grup M03). Sangat baik digunakan sebagai pasangan rotasi fungisida sistemik.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Antracol 70 WP',
    verificationDate: '2026-03-15',
    dataVersion: 'v2.4-KEMENTAN',
  },
  {
    id: 'prod-plenum-50wg',
    productName: 'Plenum 50 WG',
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 01010120042075',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Pimetrozin',
    concentration: '50%',
    formulation: 'WG (Water Dispersible Granule)',
    allowedCommodities: ['Padi'],
    targetOrganisms: [
      'Wereng Batang Coklat (Nilaparvata lugens)',
      'Wereng Hijau (Nephotettix virescens - Vektor Tungro)',
    ],
    dosagePerLiter: '0,6 g per liter air (± 300 g/ha)',
    dosagePerHaEstimate: '± 250 – 300 g/ha',
    sprayVolumePerHa: '400 – 500 L/ha (Arahkan ke pangkal batang padi)',
    applicationMethod: 'Semprotkan langsung ke pangkal batang padi tempat koloni wereng berkumpul',
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
    resistanceWarning: 'IRAC Grup 9B (Penghambat makan serangga). Jangan aplikasikan lebih dari 2 kali berturut-turut dalam 1 musim.',
    labelSource: 'Pedoman PHT Wereng Batang Coklat BB Padi & Label Resmi Plenum 50 WG',
    verificationDate: '2026-03-15',
    dataVersion: 'v2.4-KEMENTAN',
  },
  {
    id: 'prod-virtako-300sc',
    productName: 'Virtako 300 SC',
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 01010120083226',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Insektisida',
    activeIngredient: 'Klorantraniliprol 100 g/l + Tiametoksam 200 g/l',
    concentration: '300 g/l',
    formulation: 'SC (Suspension Concentrate)',
    allowedCommodities: ['Padi', 'Jagung', 'Cabai'],
    targetOrganisms: [
      'Penggerek Batang Padi / Sundep & Beluk (Scirpophaga incertulas)',
      'Hama Pelipat Daun / Hama Putih Palsu (Cnaphalocrocis medinalis)',
    ],
    dosagePerLiter: '0,3 ml per liter air (± 150 ml/ha)',
    dosagePerHaEstimate: '± 100 – 150 ml/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Aplikasi semprot volume tinggi 4–7 hari setelah terlihat penerbangan ngengat penggerek batang',
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
    dataVersion: 'v2.4-KEMENTAN',
  },
  {
    id: 'prod-nordox-56wp',
    productName: 'Nordox 56 WP',
    manufacturer: 'PT Santani Agro Perkasa / Nordox AS',
    registrationNumber: 'RI. 01020120021753',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Bakterisida & Fungisida',
    activeIngredient: 'Tembaga Oksida (Cuprous Oxide)',
    concentration: '56% (setara Cu 50%)',
    formulation: 'WP (Wettable Powder)',
    allowedCommodities: ['Padi', 'Jagung', 'Cabai', 'Kakao'],
    targetOrganisms: [
      'Hawar Daun Bakteri / Kresek (Xanthomonas oryzae pv. oryzae)',
      'Bakteri Garis Daun / Bacterial Leaf Streak (Xanthomonas oryzae pv. oryzicola)',
      'Bulai Jagung & Antraknosa Cabai',
    ],
    dosagePerLiter: '2 – 2,5 g per liter air (± 1 kg/ha)',
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
      'Jangan mencampur bakterisida tembaga dengan pupuk daun asam kuat dalam satu tangki.',
      'Hentikan pemupukan Urea sementara saat gejala Kresek aktif.',
    ],
    resistanceWarning: 'FRAC Grup M01 (Kontak Multi-Situs). Risiko resistensi rendah dan efektif menekan eksudat bakteri pada permukaan daun.',
    labelSource: 'Direktori Sistem Informasi Pestisida Kementan RI & Label Resmi Nordox 56 WP',
    verificationDate: '2026-03-15',
    dataVersion: 'v2.4-KEMENTAN',
  },
  {
    id: 'prod-amistartop-325sc',
    productName: 'Amistartop 325 SC',
    manufacturer: 'PT Syngenta Indonesia',
    registrationNumber: 'RI. 01020120052228',
    registrationStatus: 'Terdaftar Resmi Kementan RI',
    category: 'Fungisida',
    activeIngredient: 'Azoksistrobin 200 g/l + Difenokonazol 125 g/l',
    concentration: '325 g/l',
    formulation: 'SC (Suspension Concentrate)',
    allowedCommodities: ['Padi', 'Jagung', 'Cabai', 'Bawang Merah', 'Tomat'],
    targetOrganisms: [
      'Hawar Pelepah Padi (Rhizoctonia solani)',
      'Bercak Coklat Padi (Bipolaris oryzae / Helminthosporium oryzae)',
      'Bercak Coklat Sempit (Cercospora janseana) & Blas (Pyricularia oryzae)',
    ],
    dosagePerLiter: '0,5 – 1 ml per liter air (± 250 – 400 ml/ha)',
    dosagePerHaEstimate: '± 250 – 400 ml/ha',
    sprayVolumePerHa: '400 – 500 L/ha',
    applicationMethod: 'Semprot volume tinggi diarahkan ke pelepah dan helai daun pada fase anakan maksimum dan bunting',
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
    dataVersion: 'v2.4-KEMENTAN',
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

/**
 * Sampel Diagnosis Kamera AI untuk Pengujian Instan & Perbandingan Lapangan.
 */
export const SAMPLE_DIAGNOSIS_PRESETS: Record<string, DiagnosisResult> = {
  blas: {
    id: 'diag-sample-blas',
    timestamp: '2026-10-24T08:30:00+07:00',
    plotId: 'lahan-1',
    commodity: 'Padi',
    plantPart: 'Daun',
    samplePresetId: 'blas',
    imageQualityStatus: 'Tajam & Jelas',
    detectedName: 'Blas (Pyricularia oryzae)',
    scientificName: 'Pyricularia oryzae (sin. Magnaporthe oryzae)',
    causeCategory: 'Penyakit Jamur',
    confidencePct: 92,
    urgencyLevel: 'Tinggi',
    visibleSymptoms: [
      'Bercak lonjong meruncing di kedua ujung (bentuk belah ketupat) pada helai daun padi.',
      'Bagian tepi bercak berwarna coklat tua nekrotik dengan pusat keabu-abuan.',
      'Beberapa bercak mulai menyatu pada daun fase vegetatif (20 HST).',
    ],
    visualEvidenceSummary: 'Pola lesi belah ketupat dengan tepi coklat gelap dan pusat abu-abu keputihan merupakan ciri morfologi khas infeksi jamur Pyricularia oryzae pada daun padi.',
    diseaseInfoSummary: 'Blas adalah penyakit jamur yang menyerang daun, batang, dan malai padi. Gejala berupa bercak lonjong berwarna coklat dengan pinggiran keabu-abuan yang dapat menghambat fotosintesis dan berisiko lanjut menjadi busuk leher malai.',
    alternativeDiagnoses: [
      {
        name: 'Bercak Coklat (Bipolaris oryzae)',
        distinguishingCheck: 'Bercak coklat umumnya berbentuk oval membulat (bukan belah ketupat meruncing) dan sering berkaitan dengan tanah kahat Kalium/Silika.',
      },
      {
        name: 'Keracunan Besi (Fe Toxicity / Bronzing)',
        distinguishingCheck: 'Muncul bintik coklat kemerahan halus dari ujung daun tua pada lahan sawah bukaan baru ber-pH sangat asam (<5,0).',
      },
    ],
    missingInformation: [
      'Riwayat takaran pupuk Urea (Nitrogen) terakhir yang diberikan pada petakan ini.',
      'Tingkat kepadatan rumpun dan kondisi embun pagi dalam 3 hari terakhir.',
    ],
    followUpFieldChecks: [
      'Periksa 20 rumpun secara diagonal untuk menghitung persentase keparahan bercak daun.',
      'Cek apakah buku batang bawah juga menunjukkan bercak kehitaman.',
      'Tunda penambahan pupuk Urea (Nitrogen) tunggal hingga infeksi terkendali.',
    ],
    nonChemicalIpmActions: [
      'Hentikan sementara pemupukan Nitrogen (Urea) berlebih karena memicu jaringan daun menjadi lunak dan rentan jamur.',
      'Jaga genangan air sawah setinggi 3–5 cm (kondisi kering memicu pelepasan spora blas lebih cepat).',
      'Bersihkan gulma rerumputan di pematang yang dapat menjadi inang alternatif jamur Pyricularia.',
    ],
    verifiedProductIds: ['prod-score-250ec', 'prod-antracol-70wp'],
    validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi',
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Penyakit Blas',
      'Direktori Pestisida Terdaftar Kementan RI (Score 250 EC & Antracol 70 WP)',
    ],
    aiModelUsed: 'gemini-3.1-flash-lite + Agronomy Rule Validator v2.5',
  },
  kresek: {
    id: 'diag-sample-kresek',
    timestamp: '2026-10-24T08:32:00+07:00',
    plotId: 'lahan-1',
    commodity: 'Padi',
    plantPart: 'Daun',
    samplePresetId: 'kresek',
    imageQualityStatus: 'Tajam & Jelas',
    detectedName: 'Penyakit Hawar Daun Bakteri (HDB / Kresek)',
    scientificName: 'Xanthomonas oryzae pv. oryzae (Xoo)',
    causeCategory: 'Penyakit Bakteri',
    confidencePct: 91,
    urgencyLevel: 'Tinggi',
    visibleSymptoms: [
      'Lesi hawar memanjang (longitudinal streak) berwarna putih pucat kekuningan seperti jerami kering di sepanjang helai/tepi daun hijau.',
      'Batas antara jaringan daun sehat berwarna hijau dan jaringan sakit tampak bergelombang kekuningan.',
      'Ujung dan tepi helai daun mengering keputihan tanpa bercak belah ketupat.',
    ],
    visualEvidenceSummary: 'Terdeteksi jalur hawar memanjang berwarna kuning-putih pucat (straw-colored necrotic streak) sepanjang helai daun hijau yang merupakan ciri khas infeksi bakteri Xanthomonas oryzae pv. oryzae.',
    diseaseInfoSummary: 'Hawar Daun Bakteri (HDB / Kresek) disebabkan oleh bakteri Xanthomonas oryzae pv. oryzae yang menginfeksi pembuluh xilem daun melalui hidatoda atau luka gesekan angin, menyebabkan pengeringan memanjang berwarna kuning jerami hingga keputihan.',
    alternativeDiagnoses: [
      {
        name: 'Serangan Hama Putih Palsu / Pelipat Daun (Cnaphalocrocis medinalis)',
        distinguishingCheck: 'Pada Hama Putih Palsu, daun tampak terlipat/menggulung memanjang direkatkan benang sutra ulat dan jaringan hijau dikerok menyisakan selaput putih transparan.',
      },
      {
        name: 'Penyakit Blas Daun (Pyricularia oryzae)',
        distinguishingCheck: 'Blas membentuk bercak belah ketupat terpisah dengan tepi coklat tua dan pusat abu-abu, bukan jalur kering memanjang dari tepi/ujung daun.',
      },
    ],
    missingInformation: [
      'Apakah pada pagi hari (pukul 06:00–07:00) terlihat butiran eksudat bakteri kuning keruh di permukaan lesi daun?',
      'Apakah baru terjadi hujan angin atau aplikasi pupuk Urea dosis tinggi?',
    ],
    followUpFieldChecks: [
      'Lakukan Uji Eksudat Bakteri sederhana: potong melintang bagian daun di perbatasan sehat-sakit, celupkan ke air jernih dalam gelas transparan selama 5 menit; bila keluar untaian cairan keruh seperti asap, positif bakteri HDB (Xoo).',
      'Periksa apakah gejala menyebar mengikuti arah aliran air irigasi.',
    ],
    nonChemicalIpmActions: [
      'Terapkan pengairan berselang (intermittent irrigation / macak-macak) dan hindari penggenangan air dalam terus-menerus.',
      'Hentikan sementara pupuk Urea (Nitrogen) dan tambahkan pupuk Kalium (KCl /ZK) untuk mempertebal dinding sel epidermis daun.',
      'Gunakan bakterisida berbahan aktif Tembaga Oksida (Nordox 56 WP) sesuai dosis label resmi bila serangan meluas.',
    ],
    verifiedProductIds: ['prod-nordox-56wp'],
    validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi',
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Identifikasi & Pengendalian HDB / Kresek',
      'Direktori Pestisida Terdaftar Kementan RI (Nordox 56 WP - RI. 01020119921048)',
    ],
    aiModelUsed: 'gemini-3.1-flash-lite + Agronomy Rule Validator v2.5',
  },
  bercak_coklat: {
    id: 'diag-sample-bercak-coklat',
    timestamp: '2026-10-24T08:34:00+07:00',
    plotId: 'lahan-1',
    commodity: 'Padi',
    plantPart: 'Daun',
    samplePresetId: 'bercak_coklat',
    imageQualityStatus: 'Tajam & Jelas',
    detectedName: 'Penyakit Bercak Coklat Padi (Brown Spot)',
    scientificName: 'Bipolaris oryzae (sin. Helminthosporium oryzae)',
    causeCategory: 'Penyakit Jamur',
    confidencePct: 89,
    urgencyLevel: 'Sedang',
    visibleSymptoms: [
      'Bercak-bercak oval membulat berwarna coklat tua hingga coklat kemerahan tersebar merata di permukaan helai daun.',
      'Lingkar halo kekuningan mengelilingi bintik coklat tua menyerupai biji wijen.',
      'Tidak membentuk sudut meruncing belah ketupat seperti pada penyakit Blas.',
    ],
    visualEvidenceSummary: 'Distribusi bintik nekrotik berbentuk oval membulat berwarna coklat gelap tanpa pusat abu-abu belah ketupat menunjukkan gejala khas Bercak Coklat (Bipolaris oryzae).',
    diseaseInfoSummary: 'Penyakit Bercak Coklat disebabkan oleh jamur Bipolaris oryzae dan sangat erat kaitannya dengan kondisi tanah sawah yang kekurangan unsur Kalium (K), Silika (Si), atau drainase buruk.',
    alternativeDiagnoses: [
      {
        name: 'Penyakit Blas Daun (Pyricularia oryzae)',
        distinguishingCheck: 'Lesi Blas berbentuk belah ketupat meruncing di kedua ujung dengan bagian tengah berwarna abu-abu keputihan.',
      },
      {
        name: 'Bercak Coklat Sempit (Cercospora janseana)',
        distinguishingCheck: 'Bercak Cercospora berbentuk garis-garis pendek sangat sempit sejajar tulang daun.',
      },
    ],
    missingInformation: [
      'Apakah tanah sawah tergolong kahat Kalium atau jarang diberikan bahan organik/kompos jerami?',
    ],
    followUpFieldChecks: [
      'Amati apakah bercak coklat juga mulai muncul pada kulit gabah (glume blotch) bila tanaman sudah memasuki fase generatif.',
      'Periksa status pemupukan NPK dan Kalium terakhir.',
    ],
    nonChemicalIpmActions: [
      'Perbaiki kesuburan tanah dengan penambahan pupuk Kalium (KCl) dan kompos jerami matang yang kaya Silika.',
      'Gunakan fungisida sistemik terverifikasi (Score 250 EC atau Amistartop 325 SC) bila intensitas serangan >15% luas daun bendera.',
    ],
    verifiedProductIds: ['prod-score-250ec', 'prod-amistartop-325sc', 'prod-antracol-70wp'],
    validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi',
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Identifikasi Penyakit Bercak Coklat (Helminthosporium)',
      'Direktori Pestisida Terdaftar Kementan RI (Score 250 EC & Amistartop 325 SC)',
    ],
    aiModelUsed: 'gemini-3.1-flash-lite + Agronomy Rule Validator v2.5',
  },
  tungro: {
    id: 'diag-sample-tungro',
    timestamp: '2026-10-24T08:35:00+07:00',
    plotId: 'lahan-1',
    commodity: 'Padi',
    plantPart: 'Daun',
    samplePresetId: 'tungro',
    imageQualityStatus: 'Tajam & Jelas',
    detectedName: 'Suspek Gejala Tungro / Virus Kerdil',
    scientificName: 'Rice tungro virus (Vektor: Nephotettix virescens)',
    causeCategory: 'Penyakit Virus',
    confidencePct: 86,
    urgencyLevel: 'Tinggi',
    visibleSymptoms: [
      'Daun muda berubah warna menjadi kuning-oranye dimulai dari ujung daun.',
      'Tinggi rumpun tampak lebih pendek/kerdil dibanding tanaman sehat di sekitarnya.',
      'Daun agak melintir dengan jumlah anakan berkurang.',
    ],
    visualEvidenceSummary: 'Diskolorasi kuning-jingga khas pada helai daun muda disertai penghambatan tinggi rumpun mengarah pada infeksi virus Tungro.',
    diseaseInfoSummary: 'Tungro disebabkan oleh infeksi ganda virus RTBV dan RTSV yang ditularkan secara semi-persisten oleh hama Wereng Hijau (Nephotettix virescens). Tanaman yang sudah terinfeksi virus tidak dapat disembuhkan dengan fungisida.',
    alternativeDiagnoses: [
      {
        name: 'Defisiensi Nitrogen (Kahat N)',
        distinguishingCheck: 'Pada kahat N, penguningan dimulai dari daun TUA (bawah) secara merata di seluruh petakan, sedangkan Tungro menguning oranye pada daun MUDA dan mengelompok.',
      },
      {
        name: 'Kerusakan Akar / Stagnasi Air',
        distinguishingCheck: 'Cabut 1 rumpun untuk memeriksa apakah akar berwarna hitam berbau busuk H2S.',
      },
    ],
    missingInformation: [
      'Apakah ditemukan serangga Wereng Hijau saat tajuk tanaman ditepuk pada pagi hari?',
      'Apakah penanaman di blok sekitar dilakukan serempak atau berbeda umur >3 minggu?',
    ],
    followUpFieldChecks: [
      'Lakukan pengamatan jaring ayun atau tepuk rumpun untuk mendeteksi keberadaan Wereng Hijau.',
      'Lakukan uji Yodium (Iodine test) bersama petugas POPT/Penyuluh bila tersedia untuk memastikan akumulasi pati Tungro.',
    ],
    nonChemicalIpmActions: [
      'Cabut dan benamkan (sanitasi selektif) rumpun yang bergejala berat agar tidak menjadi sumber penularan ke rumpun sehat.',
      'Jangan menyemprotkan fungisida karena Tungro disebabkan oleh virus, bukan jamur.',
      'Kendalikan vektor Wereng Hijau apabila populasinya melampaui ambang pengendalian.',
    ],
    verifiedProductIds: ['prod-plenum-50wg'],
    validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi',
    sourceReferences: [
      'Loka Penelitian Penyakit Tungro (Lanranggeng) — SOP Pengendalian Terpadu Tungro',
    ],
    aiModelUsed: 'gemini-3.1-flash-lite + Agronomy Rule Validator v2.5',
  },
  wereng: {
    id: 'diag-sample-wereng',
    timestamp: '2026-10-24T08:40:00+07:00',
    plotId: 'lahan-2',
    commodity: 'Padi',
    plantPart: 'Batang',
    samplePresetId: 'wereng',
    imageQualityStatus: 'Tajam & Jelas',
    detectedName: 'Wereng Batang Coklat (Nilaparvata lugens)',
    scientificName: 'Nilaparvata lugens Stål',
    causeCategory: 'Serangan Hama',
    confidencePct: 91,
    urgencyLevel: 'Tinggi',
    visibleSymptoms: [
      'Koloni nimfa dan wereng dewasa berwarna coklat bergerombol di pangkal pelepah batang dekat permukaan air.',
      'Terdapat bekas tusukan kecoklatan dan embun jelaga hitam pada pangkal batang.',
      'Daun bawah mulai menguning dan layu.',
    ],
    visualEvidenceSummary: 'Terlihat populasi nimfa dan imago Nilaparvata lugens pada pangkal batang padi di atas permukaan air.',
    diseaseInfoSummary: 'Wereng Batang Coklat (WBC) menghisap cairan floem batang padi sehingga aliran hara dan air terputus, memicu gejala kering terbakar (hopperburn) serta berpotensi menularkan virus kerdil rumput dan kerdil hampa.',
    alternativeDiagnoses: [
      {
        name: 'Wereng Punggung Putih (Sogatella furcifera)',
        distinguishingCheck: 'Memiliki garis putih jelas pada bagian punggung toraks dan umumnya menyerang fase vegetatif awal.',
      },
    ],
    missingInformation: [
      'Rata-rata jumlah ekor wereng per rumpun dari 20 rumpun pengamatan.',
    ],
    followUpFieldChecks: [
      'Hitung rata-rata populasi wereng per rumpun dan jumlah musuh alami (laba-laba/kepik Cyrtorhinus).',
      'Ambang ekonomi fase vegetatif (<40 HST): >10 ekor/rumpun; fase generatif (>40 HST): >20 ekor/rumpun.',
    ],
    nonChemicalIpmActions: [
      'Keringkan air di petakan sawah selama 3–4 hari agar kelembapan pangkal batang turun dan menghambat penetasan telur wereng.',
      'Aplikasikan jamur entomopatogen Beauveria bassiana pada sore hari diarahkan ke pangkal batang.',
      'Hindari penyemprotan insektisida golongan piretroid sintetik karena membunuh laba-laba pemangsa dan memicu ledakan wereng (resurgensi).',
    ],
    verifiedProductIds: ['prod-plenum-50wg'],
    validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi',
    sourceReferences: [
      'BB Padi Sukamandi — Pedoman Pengendalian Hama Wereng Batang Coklat',
    ],
    aiModelUsed: 'gemini-2.5-flash + Agronomy Rule Validator v3.0',
  },
};

export interface OfficialDiseaseRecord {
  id: OfficialDiseaseId;
  detectedName: string;
  scientificName: string;
  causeCategory: DiagnosisResult['causeCategory'];
  defaultConfidencePct: number;
  urgencyLevel: DiagnosisResult['urgencyLevel'];
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
  verifiedProductIds: string[];
  sourceReferences: string[];
}

/**
 * Daftar Resmi Penyakit, Hama & Defisiensi Hara untuk Sinkronisasi Otomatis (Zero Mismatch)
 * antara hasil Gemini Vision (`matchedDiseaseId`) dan Rekomendasi PHT + Produk Pestisida Kementan RI.
 */
export const OFFICIAL_DISEASE_REGISTRY: Record<OfficialDiseaseId, OfficialDiseaseRecord> = {
  blas_daun: {
    id: 'blas_daun',
    detectedName: 'Penyakit Blas Daun (Pyricularia oryzae)',
    scientificName: 'Pyricularia oryzae (sin. Magnaporthe oryzae)',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 89,
    urgencyLevel: 'Tinggi',
    defaultVisibleSymptoms: [
      'Bercak berbentuk belah ketupat (diamond/eye-shaped) meruncing di kedua ujung pada helai daun',
      'Tepi bercak berwarna coklat tua hingga coklat kemerahan nekrotik yang tegas',
      'Bagian pusat bercak berwarna abu-abu keputihan akibat sporulasi cendawan',
    ],
    defaultVisualObservations:
      'Tampak lesi nekrotik spesifik berbentuk belah ketupat (meruncing di kedua ujung) dengan tepi coklat tua gelap dan pusat berwarna abu-abu keputihan pada helai daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Blas Daun (Pyricularia oryzae) karena bentuk bercak belah ketupat meruncing dengan pusat abu-abu keputihan, berbeda dari Bercak Coklat (Bipolaris oryzae) yang berbentuk oval/bulat biji wijen merata tanpa pusat abu-abu, dan berbeda dari HDB/Kresek yang berupa jalur kuning jerami memanjang dari tepi daun.',
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
      'Kurangi atau tunda pemupukan Urea (Nitrogen) berlebih dan imbangi dengan pupuk Kalium (KCl) untuk mempertebal dinding sel daun',
      'Pertahankan genangan air tipis 3–5 cm (kondisi tanah kering mempercepat pelepasan spora jamur Blas)',
      'Bersihkan gulma rerumputan di pematang yang menjadi inang alternatif jamur Pyricularia oryzae',
    ],
    verifiedProductIds: ['prod-score-250ec', 'prod-antracol-70wp'],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Penyakit Blas',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Score 250 EC & Antracol 70 WP)',
    ],
  },
  kresek_hdb: {
    id: 'kresek_hdb',
    detectedName: 'Penyakit Hawar Daun Bakteri (HDB / Kresek)',
    scientificName: 'Xanthomonas oryzae pv. oryzae (Xoo)',
    causeCategory: 'Penyakit Bakteri',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
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
      'Hawar Daun Bakteri (HDB / Kresek) disebabkan oleh bakteri Xanthomonas oryzae pv. oryzae yang masuk melalui pori air (hidatoda) di tepi daun atau luka gesekan daun saat hujan angin. Karena disebabkan oleh bakteri, penyakit ini WAJIB dikendalikan dengan bakterisida tembaga (bukan fungisida jamur).',
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
      'Hentikan sementara pemupukan Urea (Nitrogen) dan aplikasikan pupuk Kalium (KCl) untuk memperkuat ketahanan jaringan epidermis daun',
      'Terapkan pengairan berselang (intermittent irrigation / macak-macak) dan jangan mengalirkan air dari petakan sakit ke petakan sehat',
      'Gunakan bakterisida berbahan aktif Tembaga Oksida (Nordox 56 WP) sesuai dosis label; jangan gunakan fungisida biasa karena penyebabnya adalah bakteri',
    ],
    verifiedProductIds: ['prod-nordox-56wp'],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian HDB / Kresek',
      'Direktori Pestisida Resmi Kementan RI (Bakterisida Nordox 56 WP - Tembaga Oksida 56%)',
    ],
  },
  bercak_coklat: {
    id: 'bercak_coklat',
    detectedName: 'Penyakit Bercak Coklat Padi (Brown Spot)',
    scientificName: 'Bipolaris oryzae (sin. Helminthosporium oryzae)',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 91,
    urgencyLevel: 'Sedang',
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
      'Penyakit Bercak Coklat disebabkan oleh cendawan Bipolaris oryzae. Serangan ini sangat erat kaitannya dengan kondisi tanah sawah yang kurang subur, kahat Kalium (K), kahat Silika (Si), atau drainase tanah yang buruk.',
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
      'Aplikasikan fungisida sistemik terverifikasi (Amistartop 325 SC atau Score 250 EC) bila keparahan bercak >15%',
    ],
    verifiedProductIds: ['prod-amistartop-325sc', 'prod-score-250ec', 'prod-antracol-70wp'],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Identifikasi Penyakit Bercak Coklat (Bipolaris oryzae)',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Amistartop 325 SC & Score 250 EC)',
    ],
  },
  hawar_pelepah: {
    id: 'hawar_pelepah',
    detectedName: 'Penyakit Hawar Pelepah Padi (Sheath Blight)',
    scientificName: 'Rhizoctonia solani',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 90,
    urgencyLevel: 'Tinggi',
    defaultVisibleSymptoms: [
      'Bercak besar berbentuk oval tidak beraturan berwarna abu-abu kehijauan di bagian tengah dengan tepi coklat tua tegas menyerupai belang kulit ular',
      'Lesi berkembang pada pelepah batang bagian bawah dekat permukaan air dan merambat ke daun bawah',
      'Ditemukan butiran sklerotia jamur berwarna coklat kehitaman menempel pada permukaan pelepah yang lembap',
    ],
    defaultVisualObservations:
      'Terlihat bercak besar oval tidak beraturan berwarna abu-abu kehijauan pucat dengan tepi coklat tua berlapis menyerupai motif belang kulit ular pada pelepah/daun bawah.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Hawar Pelepah (Rhizoctonia solani) karena ukuran bercak besar berlapis seperti belang kulit ular pada pelepah/daun bawah, berbeda dari Blas Daun yang berukuran lebih kecil berbentuk belah ketupat pada helai daun atas.',
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
      'Singkap tajuk padi di 10 titik diagonal untuk memeriksa tinggi rambatan bercak belang kulit ular pada pelepah',
      'Periksa keberadaan butiran sklerotia coklat pada permukaan luar pelepah sakit',
    ],
    nonChemicalIpmActions: [
      'Keringkan air sawah secara berkala (pengairan berselang / AWD) untuk menurunkan kelembapan mikro di pangkal rumpun',
      'Bersihkan gulma air dan sisa jerami sakit yang menjadi tempat bertahan sklerotia jamur Rhizoctonia',
      'Imbangi pemupukan dengan unsur Kalium (KCl) dan hindari dosis Urea berlebih',
    ],
    verifiedProductIds: ['prod-amistartop-325sc', 'prod-score-250ec'],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Hawar Pelepah',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Amistartop 325 SC & Score 250 EC)',
    ],
  },
  bercak_coklat_sempit: {
    id: 'bercak_coklat_sempit',
    detectedName: 'Penyakit Bercak Coklat Sempit (Narrow Brown Leaf Spot)',
    scientificName: 'Cercospora janseana (sin. Sphaerulina oryzina)',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 89,
    urgencyLevel: 'Sedang',
    defaultVisibleSymptoms: [
      'Bercak berbentuk garis-garis pendek sangat sempit (lebar 1–1,5 mm) berwarna coklat kemerahan sejajar tulang daun',
      'Jumlah garis nekrotik sempit cukup banyak pada daun tua hingga daun bendera menjelang fase generatif',
      'Tidak memiliki pusat abu-abu berbentuk belah ketupat',
    ],
    defaultVisualObservations:
      'Tampak lesi berupa garis-garis linear pendek dan sempit berwarna coklat tua kemerahan yang tersusun sejajar mengikuti urat/tulang daun.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Bercak Coklat Sempit (Cercospora janseana) karena lesi berbentuk garis pendek sempit sejajar tulang daun, bukan bercak belah ketupat (Blas) maupun bintik bulat biji wijen (Bipolaris).',
    diseaseInfoSummary:
      'Bercak Coklat Sempit disebabkan oleh jamur Cercospora janseana yang umumnya berkembang pada fase anakan maksimum hingga pematangan bulir, terutama pada tanah yang kekurangan Kalium.',
    alternativeDiagnoses: [
      {
        name: 'Penyakit Blas Daun (Pyricularia oryzae)',
        distinguishingCheck:
          'Blas membentuk bercak belah ketupat yang jauh lebih lebar dengan pusat abu-abu keputihan.',
      },
    ],
    missingInformation: [
      'Umur tanaman padi (HST) dan kecukupan pupuk Kalium (KCl) pada musim ini',
    ],
    followUpFieldChecks: [
      'Periksa apakah garis coklat sempit juga menyebar ke pelepah daun dan tangkai malai',
      'Evaluasi ketahanan daun bendera pada 20 rumpun sampel diagonal',
    ],
    nonChemicalIpmActions: [
      'Tambahkan pupuk Kalium (KCl) sesuai rekomendasi untuk memperlambat penuaan jaringan daun bendera',
      'Benamkan sisa jerami terinfeksi setelah panen dan bersihkan gulma pematang',
    ],
    verifiedProductIds: ['prod-score-250ec', 'prod-amistartop-325sc'],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) Kementan RI',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI',
    ],
  },
  tungro: {
    id: 'tungro',
    detectedName: 'Gejala Penyakit Virus Tungro (Vektor Wereng Hijau)',
    scientificName: 'Rice Tungro Bacilliform Virus (RTBV) & RTSV',
    causeCategory: 'Penyakit Virus',
    defaultConfidencePct: 90,
    urgencyLevel: 'Tinggi',
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
      'Tungro disebabkan oleh kompleks virus RTBV dan RTSV yang ditularkan oleh serangga vektor Wereng Hijau (Nephotettix virescens). PENTING: Obat jamur (fungisida) atau bakterisida TIDAK efektif untuk virus; pengendalian wajib difokuskan pada eradikasi rumpun sakit dan pengendalian vektor Wereng Hijau.',
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
      'Jangan menyemprotkan fungisida; kendalikan serangga vektor Wereng Hijau menggunakan insektisida terverifikasi (Plenum 50 WG) bila populasi melewati ambang ekonomi',
    ],
    verifiedProductIds: ['prod-plenum-50wg'],
    sourceReferences: [
      'Loka Penelitian Penyakit Tungro & BB Padi Kementan RI — SOP Pengendalian Terpadu Tungro',
      'Direktori Pestisida Resmi Kementan RI (Pengendalian Vektor Wereng Hijau - Plenum 50 WG)',
    ],
  },
  hama_putih_palsu: {
    id: 'hama_putih_palsu',
    detectedName: 'Serangan Hama Putih Palsu / Pelipat Daun Padi',
    scientificName: 'Cnaphalocrocis medinalis',
    causeCategory: 'Serangan Hama',
    defaultConfidencePct: 91,
    urgencyLevel: 'Sedang',
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
      'Larva ngengat Cnaphalocrocis medinalis melipat helai daun padi dan mengerok jaringan hijau klorofil dari dalam lipatan sehingga daun tampak bergaris-garis putih transparan. Pengendalian menggunakan insektisida selektif pengerek/pelipat daun, BUKAN fungisida.',
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
      'Keringkan petakan sawah sementara selama 3–4 hari dan gunakan insektisida terverifikasi (Virtako 300 SC) hanya bila kerusakan melewati ambang ekonomi',
    ],
    verifiedProductIds: ['prod-virtako-300sc'],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Pedoman Pengendalian Hama Putih Palsu',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Virtako 300 SC)',
    ],
  },
  wereng_batang_coklat: {
    id: 'wereng_batang_coklat',
    detectedName: 'Serangan Wereng Batang Coklat (WBC / Hopperburn)',
    scientificName: 'Nilaparvata lugens Stål',
    causeCategory: 'Serangan Hama',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    defaultVisibleSymptoms: [
      'Hamparan atau rumpun padi menguning lalu mengering coklat kemerahan seperti terbakar (gejala hopperburn)',
      'Pangkal batang berwarna coklat kehitaman disertai koloni nimfa/imago wereng di atas permukaan air',
      'Terdapat lapisan jelaga hitam tipis pada pangkal pelepah akibat sekresi embun madu wereng',
    ],
    defaultVisualObservations:
      'Teramati gejala mengering coklat kemerahan seperti terbakar (hopperburn) pada rumpun/hamparan padi disertai kerusakan nekrotik coklat kehitaman pada pangkal batang.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Wereng Batang Coklat (Nilaparvata lugens / Hopperburn) karena pola pengeringan rumpun berwarna coklat terbakar dari pangkal ke tajuk atas, berbeda dari Blas Daun yang bercaknya berbentuk belah ketupat berpusat abu-abu dan berbeda dari Hawar Pelepah yang membentuk belang kulit ular.',
    diseaseInfoSummary:
      'Wereng Batang Coklat (WBC) menghisap cairan floem di pangkal batang padi sehingga tanaman mengering cepat (hopperburn) dan menularkan virus Kerdil Rumput/Kerdil Hampa. Dikendalikan dengan pengeringan berselang (AWD) dan insektisida selektif penghambat makan wereng (Plenum 50 WG).',
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
      'Hindari penyemprotan insektisida piretroid spektrum luas karena membunuh laba-laba predator dan memicu ledakan wereng (resurgensi)',
      'Aplikasikan agensia hayati Beauveria bassiana atau insektisida selektif pymetrozine (Plenum 50 WG) diarahkan langsung ke pangkal batang',
    ],
    verifiedProductIds: ['prod-plenum-50wg'],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Prosedur Operasional Standar Pengendalian WBC',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Plenum 50 WG)',
    ],
  },
  sundep_beluk: {
    id: 'sundep_beluk',
    detectedName: 'Serangan Penggerek Batang Padi (Sundep / Beluk)',
    scientificName: 'Scirpophaga incertulas / Scirpophaga innotata',
    causeCategory: 'Serangan Hama',
    defaultConfidencePct: 91,
    urgencyLevel: 'Tinggi',
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
      'Larva ulat penggerek batang memotong titik tumbuh di bagian dalam batang padi. Serangan pada fase vegetatif menyebabkan Sundep (pucuk mati), sedangkan serangan pada fase generatif menyebabkan Beluk (malai putih hampa).',
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
      'Gunakan insektisida sistemik terverifikasi (Virtako 300 SC) bila ditemukan kelompok telur/gejala awal melewati ambang kendali',
    ],
    verifiedProductIds: ['prod-virtako-300sc'],
    sourceReferences: [
      'Balai Besar Peramalan Organisme Pengganggu Tumbuhan (BBPOPT) Jatisari & BB Padi',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI (Virtako 300 SC)',
    ],
  },
  kahat_n: {
    id: 'kahat_n',
    detectedName: 'Defisiensi Unsur Hara Nitrogen (Kahat N)',
    scientificName: 'Gangguan Fisiologis — Kekurangan Makronutrien Nitrogen (N)',
    causeCategory: 'Defisiensi Nutrisi',
    defaultConfidencePct: 90,
    urgencyLevel: 'Sedang',
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
      'Kekurangan unsur Nitrogen menghambat pembentukan klorofil sehingga tanaman merelokasi N dari daun tua ke daun muda. Kondisi ini BUKAN penyakit infeksi sehingga TIDAK memerlukan penyemprotan pestisida/fungisida, melainkan pemupukan Urea/NPK berimbang berdasarkan Bagan Warna Daun (BWD).',
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
      'Periksa kondisi pintu air petakan agar pupuk yang akan ditabur tidak hanyut terbawa aliran air',
    ],
    nonChemicalIpmActions: [
      'Bila skor BWD < 4, berikan pupuk Urea susulan 50–100 kg/Ha atau NPK Phonska sesuai fase pertumbuhan pada kondisi air macak-macak (3–5 cm)',
      'Siangi gulma terlebih dahulu sebelum penaburan pupuk agar unsur hara diserap optimal oleh perakaran padi',
      'Tidak diperlukan penyemprotan fungisida atau insektisida kimia',
    ],
    verifiedProductIds: [],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) — Panduan Pemupukan Spesifik Lokasi & Bagan Warna Daun (BWD)',
    ],
  },
  kahat_k_fe: {
    id: 'kahat_k_fe',
    detectedName: 'Defisiensi Kalium (Kahat K) / Keracunan Besi (Fe)',
    scientificName: 'Gangguan Fisiologis Hara Kalium / Toksisitas Besi (Bronzing)',
    causeCategory: 'Defisiensi Nutrisi',
    defaultConfidencePct: 88,
    urgencyLevel: 'Sedang',
    defaultVisibleSymptoms: [
      'Tepi dan ujung daun tua menguning kecoklatan seperti terbakar disertai bintik-bintik coklat kemerahan halus (bronzing)',
      'Gejala dimulai dari ujung daun bawah merambat sepanjang tepi helai daun',
      'Tidak ditemukan pusat bercak abu-abu keputihan berbentuk belah ketupat',
    ],
    defaultVisualObservations:
      'Tampak perubahan warna kuning-kecoklatan dan bintik kemerahan halus (bronzing) di sepanjang tepi dan ujung helai daun tua tanpa lesi belah ketupat.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Defisiensi Kalium / Keracunan Besi (Fe) karena nekrosis kemerahan/bronzing mengikuti tepi daun tua secara simetris, bukan bercak belah ketupat Blas maupun hawar bakteri ber-eksudat.',
    diseaseInfoSummary:
      'Kekurangan Kalium (K) atau keracunan Besi (Fe) sering terjadi pada tanah sawah masam (pH < 5,5) yang tergenang terus-menerus tanpa drainase berselang. Penanganan dilakukan dengan perbaikan drainase dan penambahan pupuk KCl, bukan pestisida.',
    alternativeDiagnoses: [
      {
        name: 'Hawar Daun Bakteri / Kresek (Xanthomonas oryzae)',
        distinguishingCheck:
          'Kresek menghasilkan cairan keruh bakteri (ooze) saat potongan daun dicelupkan ke air jernih dan batas lesinya bergelombang kuning jerami.',
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
      'Lakukan pengeringan petakan sawah secara berkala (pengairan berselang / AWD) untuk mengoksidasi kelebihan ferro (Fe2+) di zona perakaran',
      'Aplikasikan pupuk Kalium (KCl 50–75 kg/Ha) dan kapur pertanian (Dolomit) bila pH tanah < 5,5',
      'Tidak diperlukan penyemprotan fungisida atau insektisida kimia',
    ],
    verifiedProductIds: [],
    sourceReferences: [
      'Balai Penelitian Tanah & BB Padi Kementan RI — Pengelolaan Hara Kalium dan Tanah Sawah Masam',
    ],
  },
  antraknosa_cabai: {
    id: 'antraknosa_cabai',
    detectedName: 'Penyakit Antraknosa / Patek Cabai',
    scientificName: 'Colletotrichum gloeosporioides / Colletotrichum capsici',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 92,
    urgencyLevel: 'Tinggi',
    defaultVisibleSymptoms: [
      'Lesi cekung melingkar konsentris berwarna coklat tua hingga kehitaman pada buah atau daun cabai',
      'Pada pusat bercak cekung tampak massa spora berwarna jingga kemerahan atau titik-titik hitam (aservulus)',
      'Jaringan buah di sekitar lesi membusuk dan mengering keriput',
    ],
    defaultVisualObservations:
      'Teramati lesi nekrotik cekung berlapis konsentris berwarna coklat kehitaman dengan pusat spora kemerahan/hitam khas infeksi jamur Colletotrichum.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Antraknosa / Patek Cabai (Colletotrichum spp.) karena adanya bercak cekung konsentris kehitaman yang spesifik, berbeda dari serangan Lalat Buah yang hanya meninggalkan titik tusukan ovipositor kecil.',
    diseaseInfoSummary:
      'Antraknosa (Patek) adalah penyakit jamur utama pada tanaman cabai yang menyebar cepat melalui percikan air hujan dan kelembapan udara tinggi (>80%).',
    alternativeDiagnoses: [
      {
        name: 'Busuk Buah Phytophthora (Phytophthora capsici)',
        distinguishingCheck:
          'Terdapat lapisan miselium putih halus seperti kapas pada permukaan lesi basah saat pagi hari.',
      },
    ],
    missingInformation: [
      'Persentase populasi buah cabai yang terinfeksi di bedengan',
      'Kondisi drainase parit antar bedengan pasca hujan',
    ],
    followUpFieldChecks: [
      'Petik dan musnahkan (bakar/kubur dalam di luar kebun) seluruh buah yang menunjukkan gejala patek agar spora tidak menyebar',
      'Periksa kerapatan tajuk dan pangkas tunas air bawah untuk menurunkan kelembapan mikro',
    ],
    nonChemicalIpmActions: [
      'Sanitasi ketat dengan memetik dan memusnahkan bagian tanaman/buah sakit di luar areal pertanaman',
      'Perbaiki drainase bedengan dan tambahkan pupuk Kalsium (Ca) serta Kalium (K) untuk memperkokoh dinding sel buah',
      'Gunakan fungisida kontak dan sistemik terverifikasi secara bergilir (Antracol 70 WP, Score 250 EC, atau Amistartop 325 SC)',
    ],
    verifiedProductIds: ['prod-antracol-70wp', 'prod-score-250ec', 'prod-amistartop-325sc'],
    sourceReferences: [
      'Balai Penelitian Tanaman Sayuran (Balitsa) Kementan RI — Pedoman Pengendalian Patek Cabai',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI',
    ],
  },
  hawar_daun_jagung: {
    id: 'hawar_daun_jagung',
    detectedName: 'Penyakit Hawar Daun / Bulai Jagung',
    scientificName: 'Bipolaris maydis / Peronosclerospora maydis',
    causeCategory: 'Penyakit Jamur',
    defaultConfidencePct: 90,
    urgencyLevel: 'Tinggi',
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
      'Hawar daun dan bulai jagung berkembang pesat pada kondisi suhu hangat dengan kelembapan malam/embun pagi yang tinggi.',
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
    ],
    verifiedProductIds: ['prod-amistartop-325sc', 'prod-antracol-70wp'],
    sourceReferences: [
      'Balai Penelitian Tanaman Serealia (Balitsereal) Kementan RI',
      'Direktori Sistem Informasi Pestisida Resmi Kementan RI',
    ],
  },
  tanaman_sehat: {
    id: 'tanaman_sehat',
    detectedName: 'Tanaman Sehat — Vigor & Klorofil Daun Optimal',
    scientificName: 'Oryza sativa (Kondisi Fisiologis Normal)',
    causeCategory: 'Defisiensi Nutrisi',
    defaultConfidencePct: 95,
    urgencyLevel: 'Rendah',
    defaultVisibleSymptoms: [
      'Helai daun berwarna hijau segar merata dengan indeks klorofil optimal (setara skor BWD 4)',
      'Permukaan daun bersih dari bercak nekrotik jamur, hawar tepi bakteri, maupun kerokan ulat',
      'Pertumbuhan tajuk tampak tegak dan sehat tanpa gejala kerdil atau hopperburn',
    ],
    defaultVisualObservations:
      'Helai daun tampak hijau segar merata dengan jaringan epidermis utuh tanpa bercak nekrotik, tanpa hawar tepi daun, dan tanpa kerusakan hama.',
    defaultDifferentialReasoning:
      'Didiagnosis sebagai Tanaman Sehat karena tidak ditemukan lesi belah ketupat (Blas), jalur hawar kuning jerami (Kresek), bintik coklat (Bipolaris), maupun alur kerokan putih (Hama Putih Palsu).',
    diseaseInfoSummary:
      'Tanaman berada dalam kondisi pertumbuhan fisiologis yang sehat dengan kecukupan unsur hara dan bebas dari infeksi patogen signifikan. Tidak diperlukan aplikasi pestisida kimia.',
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
    verifiedProductIds: [],
    sourceReferences: [
      'Balai Besar Penelitian Tanaman Padi (BB Padi) Kementan RI — Pedoman Pengelolaan Tanaman Terpadu (PTT)',
    ],
  },
};

/**
 * Membangun objek DiagnosisResult lengkap secara deterministik & Zero-Mismatch
 * langsung dari `matchedDiseaseId` resmi beserta hasil observasi visual Gemini Vision.
 */
export function buildDiagnosisFromMatchedDiseaseId(params: {
  matchedDiseaseId: OfficialDiseaseId | string;
  commodity?: CommodityType;
  plantPart?: DiagnosisResult['plantPart'];
  visualObservations?: string;
  confidenceScore?: number;
  differentialReasoning?: string;
  visibleSymptoms?: string[];
  plotId?: string;
  plotName?: string;
  aiModelUsed?: string;
}): DiagnosisResult {
  const normalizedId = normalizeOfficialDiseaseId(params.matchedDiseaseId, params.commodity);
  const record = OFFICIAL_DISEASE_REGISTRY[normalizedId] || OFFICIAL_DISEASE_REGISTRY.blas_daun;
  const commodity: CommodityType = params.commodity || 'Padi';
  const plantPart: DiagnosisResult['plantPart'] = params.plantPart || 'Daun';
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

  const visibleSymptoms =
    Array.isArray(params.visibleSymptoms) && params.visibleSymptoms.length > 0
      ? params.visibleSymptoms.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, 4)
      : record.defaultVisibleSymptoms;

  let detectedName = record.detectedName;
  if (normalizedId === 'blas_daun' && plantPart === 'Malai / Bunga') {
    detectedName = 'Penyakit Blas Leher Malai (Neck Blast)';
  }

  return {
    id: `diag-${normalizedId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    plotId: params.plotId,
    commodity,
    plantPart,
    matchedDiseaseId: normalizedId,
    visualObservations,
    differentialReasoning,
    imageQualityStatus: 'Tajam & Jelas',
    detectedName,
    scientificName: record.scientificName,
    causeCategory: record.causeCategory,
    confidencePct,
    urgencyLevel: record.urgencyLevel,
    visibleSymptoms,
    visualEvidenceSummary: `Observasi Morfologi Visual (${plantPart} ${commodity} — ${plotName}): ${visualObservations} Alasan Diferensial: ${differentialReasoning}`,
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
    // ZERO MISMATCH: Selalu ditarik langsung dari OFFICIAL_DISEASE_REGISTRY berdasarkan matchedDiseaseId!
    verifiedProductIds: [...record.verifiedProductIds],
    validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi',
    sourceReferences: record.sourceReferences,
    aiModelUsed: params.aiModelUsed || 'Multimodal Gemini Vision Fitopatologi',
  };
}

/**
 * Menormalkan string ID penyakit dari respons model atau kata kunci menjadi OfficialDiseaseId yang sah.
 */
export function normalizeOfficialDiseaseId(
  rawId?: string | null,
  commodity?: CommodityType
): OfficialDiseaseId {
  const s = (rawId || '').toLowerCase().trim();
  if (s in OFFICIAL_DISEASE_REGISTRY) {
    return s as OfficialDiseaseId;
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
    return 'blas_daun';
  }
  return 'kresek_hdb';
}


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

  const defaultWeather: WeatherSnapshot = {
    locationName: 'Larikrejo, Undaan, Kudus, Jawa Tengah',
    tempC: 28,
    conditionText: 'Cerah Berawan',
    humidityPct: 86,
    rainfallMm: 2,
    rainProbabilityPct: 30,
    windSpeedKmh: 12,
    updatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    sourceName: 'Open-Meteo Weather API (Koordinat Kudus -6.899, 110.802)',
    isLiveApi: false,
    sprayingAdvisory: {
      status: 'Kondusif',
      recommendation: 'Kecepatan angin 12 km/jam (<15 km/jam) dan curah hujan rendah (2 mm). Pagi hari (06:30–09:00) cukup kondusif untuk pemupukan atau penyemprotan tervalidasi.',
    },
    forecast: [
      { dayName: 'Sen', dateStr: 'Hari Ini', condition: 'Cerah', tempMaxC: 33, tempMinC: 26, rainChancePct: 20, rainfallMm: 1 },
      { dayName: 'Sel', dateStr: 'Besok', condition: 'Cerah Berawan', tempMaxC: 32, tempMinC: 25, rainChancePct: 30, rainfallMm: 2 },
      { dayName: 'Rab', dateStr: 'Lusa', condition: 'Hujan Ringan', tempMaxC: 31, tempMinC: 24, rainChancePct: 65, rainfallMm: 8 },
      { dayName: 'Kam', dateStr: '+3 Hari', condition: 'Hujan Ringan', tempMaxC: 32, tempMinC: 25, rainChancePct: 55, rainfallMm: 5 },
      { dayName: 'Jum', dateStr: '+4 Hari', condition: 'Cerah Berawan', tempMaxC: 33, tempMinC: 26, rainChancePct: 25, rainfallMm: 1 },
    ],
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
