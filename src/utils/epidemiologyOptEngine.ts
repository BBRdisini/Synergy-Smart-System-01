import {
  CommodityType,
  EpidemiologyOptAlert,
  FarmPlot,
  PlantingSeasonMT,
  WeatherSnapshot,
} from '../types/agronomy';

/**
 * Menentukan musim tanam lokal (MT1, MT2, MT3) secara otomatis berdasarkan bulan kalender
 * apabila petani belum memilih secara spesifik.
 */
export function detectDefaultPlantingSeasonMT(date: Date = new Date()): PlantingSeasonMT {
  const month = date.getMonth() + 1; // 1..12
  if (month >= 11 || month <= 2) {
    return 'MT1 Penghujan (Nov–Feb)';
  }
  if (month >= 3 && month <= 6) {
    return 'MT2 Gadu / Peralihan (Mar–Jun)';
  }
  return 'MT3 Kemarau / Palawija (Jul–Okt)';
}

/**
 * Menghitung Jendela Waktu Semprot Terbaik Hari Ini berdasarkan parameter cuaca live
 * (peluang hujan, curah hujan, kecepatan angin, kelembapan, dan prakiraan per jam).
 */
export function calculateBestSprayingWindow(weather: WeatherSnapshot): {
  statusLabel: string;
  recommendedHours: string;
  weatherReasoning: string;
} {
  const rainProb = Number(weather.rainProbabilityPct ?? 0);
  const rainMm = Number(weather.rainfallMm ?? 0);
  const windKmh = Number(weather.windSpeedKmh ?? 0);
  const tempC = Number(weather.tempC ?? 28);

  const isNotCondusive =
    rainProb > 60 ||
    rainMm > 2 ||
    windKmh > 15 ||
    (typeof weather.weatherCode === 'number' && weather.weatherCode >= 51);

  // Cari jam-jam pagi (06:00-10:00) yang paling aman dari hourlyForecast bila tersedia
  let morningSafeSlot = '06:30 – 09:00 WIB';
  const afternoonSafeSlot = '15:30 – 17:00 WIB';

  if (Array.isArray(weather.hourlyForecast) && weather.hourlyForecast.length > 0) {
    const morningLowRainHours = weather.hourlyForecast.filter((h) => {
      const hrNum = parseInt(h.hourLabel.slice(0, 2), 10);
      return (
        !Number.isNaN(hrNum) &&
        hrNum >= 6 &&
        hrNum <= 10 &&
        h.rainProbabilityPct <= 45 &&
        h.precipitationMm <= 0.5
      );
    });
    if (morningLowRainHours.length >= 2) {
      morningSafeSlot = `${morningLowRainHours[0].hourLabel} – ${
        morningLowRainHours[Math.min(2, morningLowRainHours.length - 1)].hourLabel
      } WIB`;
    }
  }

  if (isNotCondusive) {
    const reasons: string[] = [];
    if (rainProb > 60) reasons.push(`peluang hujan tinggi (${rainProb}%)`);
    if (rainMm > 2) reasons.push(`curah hujan aktif (${rainMm} mm)`);
    if (windKmh > 15) reasons.push(`angin kencang (${windKmh} km/jam > batas aman 15 km/jam)`);
    if (reasons.length === 0) reasons.push(`kondisi cuaca ${weather.conditionText.toLowerCase()}`);

    return {
      statusLabel: 'Kurang Kondusif Saat Ini — Tunda & Pilih Jendela Aman',
      recommendedHours: `Tunda hingga cuaca reda (Jendela ideal besok pagi ${morningSafeSlot} atau sore ${afternoonSafeSlot})`,
      weatherReasoning: `Saat ini terdeteksi ${reasons.join(', ')} di ${weather.locationName}. Penyemprotan saat hujan atau angin >15 km/jam menyebabkan larutan pestisida/hayati luntur tercuci air hujan dan kabut semprotan terbang (drift). Tambahkan perekat-perata non-ionik (10–15 ml/tangki 16L) saat menyemprot di jendela aman.`,
    };
  }

  return {
    statusLabel: 'Kondusif — Aman untuk Penyemprotan PHT',
    recommendedHours: `Pagi ${morningSafeSlot} (embun mulai turun) atau Sore ${afternoonSafeSlot}`,
    weatherReasoning: `Cuaca live di ${weather.locationName} (${tempC}°C, kelembapan ${weather.humidityPct}%, peluang hujan ${rainProb}%, angin ${windKmh} km/jam) berada di bawah ambang batas pencucian hujan dan drift angin. Stomata daun terbuka optimal pada pukul 06:30–09:00 WIB.`,
  };
}

/**
 * Mesin Epidemiologi Prediksi Risiko OPT (Hama & Penyakit) Real-Time
 * Berdasarkan:
 * 1. Cuaca Live (Kelembapan, Suhu, Curah Hujan, Kecepatan Angin)
 * 2. Kalender Musim Tanam Lokal (MT1 Penghujan, MT2 Gadu/Peralihan, MT3 Kemarau/Palawija)
 * 3. Umur Tanaman (HST) & Komoditas Aktif (Padi, Kacang Hijau, Cabai, Jagung, Bawang Merah)
 */
export function generateRealTimeEpidemiologyOptAlerts(params: {
  weather: WeatherSnapshot;
  plots?: FarmPlot[];
  plantingSeasonMT?: PlantingSeasonMT;
  mainCommodity?: CommodityType;
}): EpidemiologyOptAlert[] {
  const { weather, plots = [] } = params;
  const seasonMT = params.plantingSeasonMT || detectDefaultPlantingSeasonMT();
  const primaryPlot = plots[0];
  const hst = primaryPlot?.currentHst ?? 20;
  const phaseLabel = primaryPlot?.currentPhaseName || `Vegetatif (${hst} HST)`;
  const activeCommodities = new Set<string>(plots.map((p) => p.commodity));
  if (params.mainCommodity) {
    activeCommodities.add(params.mainCommodity);
  }
  // Selalu dukung Padi & Kacang Hijau / Palawija sesuai rotasi Kudus-Demak-Pati
  const hasKacangHijauOrPalawija =
    activeCommodities.has('Kacang Hijau') ||
    activeCommodities.has('Cabai') ||
    activeCommodities.has('Jagung') ||
    activeCommodities.has('Kedelai') ||
    seasonMT.includes('MT3') ||
    seasonMT.includes('MT2');

  const tempC = Number(weather.tempC ?? 28);
  const humidityPct = Number(weather.humidityPct ?? 82);
  const rainfallMm = Number(weather.rainfallMm ?? 1);
  const rainProbPct = Number(weather.rainProbabilityPct ?? 35);
  const windSpeedKmh = Number(weather.windSpeedKmh ?? 12);
  const conditionLower = (weather.conditionText || '').toLowerCase();
  const isCloudyOrRainy =
    conditionLower.includes('hujan') ||
    conditionLower.includes('berawan') ||
    conditionLower.includes('kabut') ||
    rainProbPct >= 50 ||
    rainfallMm > 0.5;

  const sprayWindow = calculateBestSprayingWindow(weather);

  // =========================================================================
  // ATURAN EPIDEMIOLOGI 1:
  // Kelembapan >80%, Suhu 24–28°C (atau sejuk lembap) & Berawan/Hujan
  // -> Risiko Tinggi Blas Daun / Blas Leher Malai (Pyricularia oryzae) & Hawar Pelepah (Rhizoctonia solani)
  // =========================================================================
  let blasScore = 54;
  if (humidityPct >= 80) blasScore += 22;
  else if (humidityPct >= 75) blasScore += 12;

  if (tempC >= 22 && tempC <= 29) blasScore += 14;
  if (isCloudyOrRainy) blasScore += 8;
  if (seasonMT.includes('MT1') || seasonMT.includes('MT2')) blasScore += 6;
  blasScore = Math.min(97, Math.max(45, blasScore));

  const blasRiskLevel: EpidemiologyOptAlert['riskLevel'] =
    blasScore >= 78 ? 'Tinggi / Siaga' : blasScore >= 62 ? 'Waspada' : 'Terkendali';

  const blasAlert: EpidemiologyOptAlert = {
    id: 'opt-epid-blas-pelepah',
    optName: 'Penyakit Blas Daun / Leher Malai & Hawar Pelepah',
    scientificName: 'Pyricularia oryzae & Rhizoctonia solani',
    targetCommodity: 'Padi',
    category: 'Penyakit Jamur',
    riskLevel: blasRiskLevel,
    riskScorePct: blasScore,
    plantingSeasonMT: seasonMT,
    cropAgeHstLabel: `${hst} HST (${phaseLabel})`,
    weatherTriggerHeadline: `Kelembapan ${humidityPct}% (${humidityPct >= 80 ? '>80% Lembap Basah' : 'Sedang'}) · Suhu ${tempC}°C · ${weather.conditionText}`,
    whyItThreatensNow: `Kondisi cuaca live di ${weather.locationName} menunjukkan kelembapan udara ${humidityPct}% dengan suhu ${tempC}°C dan cuaca ${weather.conditionText} pada periode ${seasonMT}. Spora jamur Pyricularia oryzae (Blas) dan sklerotia Rhizoctonia solani (Hawar Pelepah) berkecambah sangat cepat ketika helai daun basah oleh embun pagi >8 jam pada suhu 24–28°C dengan kelembapan >80%, terlebih pada tanaman umur ${hst} HST yang mendapat pupuk Urea (Nitrogen) tinggi.`,
    earlyFieldSymptoms: [
      'Muncul bercak kecil berbentuk belah ketupat (wajik/mata) meruncing di kedua ujung daun dengan bagian tengah berwarna abu-abu keputihan dan tepi coklat tua kemerahan (ciri khas Blas Daun).',
      'Pada pelepah batang bawah dekat permukaan air terlihat bercak besar oval berlapis abu-abu kehijauan dengan tepi coklat tua menyerupai motif belang kulit ular (ciri khas Hawar Pelepah).',
      'Jika tanaman sudah memasuki fase keluar malai (55–75 HST), pangkal leher malai berubah coklat kehitaman, membusuk, dan patah sehingga bulir gabah menjadi hampa (Blas Leher / Potong Leher).',
    ],
    culturalPreventionSteps: [
      'STOP / TUNDA pemupukan Urea (Nitrogen tinggi) sementara waktu! Kelebihan Nitrogen membuat dinding sel daun lunak dan memicu ledakan spora Blas hingga 3 kali lipat.',
      'Terapkan pengairan berselang (macak-macak / AWD): kuras genangan air sawah setinggi 0–2 cm selama 3–4 hari agar kelembapan mikro di pangkal rumpun turun.',
      'Tambahkan pupuk Kalium (KCl 50 kg/Ha atau semprot pupuk daun MKP / KNO3 Putih + Silika cair) untuk mempertebal lapisan epidermis daun.',
      'Bersihkan gulma rumput-rumputan di pematang sawah yang menjadi inang perantara spora jamur Blas.',
    ],
    biologicalOrganicControl: [
      {
        agentName: 'Jamur Antagonis Trichoderma harzianum & Gliocladium sp.',
        practicalDosage: '5 sendok makan (50–75 gram) atau 100 ml cair per tangki semprot 16 Liter',
        applicationMethod: 'Semprotkan ke pangkal rumpun dan pelepah bawah pada sore hari (pukul 15:30–17:00 WIB) untuk menekan sklerotia Hawar Pelepah & spora Blas.',
      },
      {
        agentName: 'Bakteri Agens Hayati Paenibacillus polymyxa / Pseudomonas fluorescens',
        practicalDosage: '5–6 tutup botol (± 80–100 ml) per tangki 16 Liter air bersih',
        applicationMethod: 'Aplikasikan setiap 7 hari sekali sejak umur 15 HST sebagai pelindung biologis permukaan daun.',
      },
    ],
    chemicalControlGuides: [
      {
        activeIngredient: 'Trisiklazol 75% (Spesialis Penghambat Melanin Spora Blas)',
        category: 'Fungisida',
        registeredBrands: 'Filia 525 SE (Trisiklazol + Propikonazol) / Bim 75 WP / Blastgone 75 WP',
        dosagePer16LTank: '1,5 – 2 sendok makan (15–20 gram atau 20–25 ml) per tangki 16 Liter',
        dosagePerArea: '± 300–400 gram/Ha (atau ± 210–280 gram per Bahu 0,7 Ha)',
        applicationNotes: 'Sangat efektif mencegah penetrasi jamur Blas ke jaringan daun dan melindungi leher malai pada fase bunting-keluar malai.',
      },
      {
        activeIngredient: 'Azoksistrobin 200 g/l + Difenokonazol 125 g/l (Sistemik Spektrum Luas)',
        category: 'Fungisida',
        registeredBrands: 'Amistartop 325 SC / Score 250 EC (Difenokonazol 250 g/l)',
        dosagePer16LTank: '1 – 1,5 sendok makan (15–20 ml / 1 tutup botol penuh) per tangki 16 Liter',
        dosagePerArea: '± 250–350 ml/Ha (atau ± 50 ml per Kotak 1.400 m²)',
        applicationNotes: 'Mengendalikan Blas Daun sekaligus Hawar Pelepah (Rhizoctonia) serta membuat daun bendera tetap hijau sehat.',
      },
      {
        activeIngredient: 'Propineb 70% / Mankozeb 80% (Fungisida Kontak Pelindung)',
        category: 'Fungisida',
        registeredBrands: 'Antracol 70 WP / Dithane M-45 80 WP',
        dosagePer16LTank: '2 – 3 sendok makan penuh (30–40 gram) per tangki 16 Liter',
        dosagePerArea: '± 1,0 – 1,2 kg/Ha (Rotasikan dengan fungisida sistemik agar tidak kebal)',
        applicationNotes: 'Gunakan sebagai pelindung kontak saat cuaca sering gerimis disertai unsur Zinc (Zn) untuk pemulihan daun.',
      },
    ],
    bestSprayingWindowToday: sprayWindow,
    recommendedAgendaTaskTitle: 'Penyemprotan PHT Kendali Blas & Hawar Pelepah + Aplikasi Kalium/Silika',
    recommendedAgendaDosageNote: `Takaran Tangki 16L: Amistartop 325 SC / Filia 525 SE (15–20 ml / 1,5 sdm) + MKP (3 sdm). Stop Urea sementara. Waktu ideal: ${sprayWindow.recommendedHours}.`,
  };

  // =========================================================================
  // ATURAN EPIDEMIOLOGI 2:
  // Hujan Disertai Angin Kencang (>15 km/jam) pada Fase Vegetatif / Generatif
  // -> Risiko Tinggi Hawar Daun Bakteri / Kresek (Xanthomonas oryzae pv. oryzae)
  // =========================================================================
  let kresekScore = 50;
  if (windSpeedKmh > 15) kresekScore += 26;
  else if (windSpeedKmh >= 11) kresekScore += 14;

  if (rainfallMm > 2 || rainProbPct >= 60) kresekScore += 20;
  else if (rainfallMm > 0 || rainProbPct >= 40) kresekScore += 10;

  if (humidityPct >= 80) kresekScore += 8;
  if (seasonMT.includes('MT1') || seasonMT.includes('MT2')) kresekScore += 6;
  kresekScore = Math.min(96, Math.max(42, kresekScore));

  const kresekRiskLevel: EpidemiologyOptAlert['riskLevel'] =
    kresekScore >= 76 ? 'Tinggi / Siaga' : kresekScore >= 60 ? 'Waspada' : 'Terkendali';

  const kresekAlert: EpidemiologyOptAlert = {
    id: 'opt-epid-kresek-hdb',
    optName: 'Hawar Daun Bakteri (HDB / Penyakit Kresek)',
    scientificName: 'Xanthomonas oryzae pv. oryzae',
    targetCommodity: 'Padi',
    category: 'Penyakit Bakteri',
    riskLevel: kresekRiskLevel,
    riskScorePct: kresekScore,
    plantingSeasonMT: seasonMT,
    cropAgeHstLabel: `${hst} HST (${phaseLabel})`,
    weatherTriggerHeadline: `Angin ${windSpeedKmh} km/jam · Peluang Hujan ${rainProbPct}% (${rainfallMm} mm) · Gesekan Helai Daun`,
    whyItThreatensNow: `Kecepatan angin saat ini ${windSpeedKmh} km/jam dengan peluang hujan ${rainProbPct}% (curah hujan ${rainfallMm} mm) pada tanaman umur ${hst} HST. Hujan yang disertai hembusan angin menyebabkan ujung dan tepi helai daun padi saling bergesekan sehingga menimbulkan luka mikro. Bakteri Xanthomonas oryzae masuk melalui luka gesekan dan pori air (hidatoda) di tepi daun, lalu menyebar cepat melalui cipratan hujan dan aliran air irigasi dari petak ke petak.`,
    earlyFieldSymptoms: [
      'Garis basah keabu-abuan pada tepi helai daun bagian ujung yang kemudian berubah menjadi kuning jerami hingga coklat mengering dengan batas bergelombang.',
      'Pada pagi hari sebelum matahari terik, tampak butiran cairan keruh kekuningan seperti embun susu (ooze bakteri) di sepanjang tepi daun yang sakit.',
      'Uji cepat di sawah: potong melintang daun bergejala sepanjang 5 cm lalu celupkan ujung potongannya ke dalam gelas air bening selama 2 menit — jika keluar benang cairan keruh ke bawah, positif Bakteri Kresek (bukan jamur!).',
    ],
    culturalPreventionSteps: [
      'JANGAN menyemprotkan fungisida jamur biasa karena Kresek disebabkan oleh BAKTERI! Hentikan total pemupukan Urea susulan saat gejala Kresek aktif.',
      'Keringkan air sawah (sistem macak-macak / intermitten) dan jangan mengalirkan air dari petakan yang terserang Kresek ke petakan sehat di bawahnya.',
      'Semprotkan pupuk daun tinggi Kalium & Kalsium (MKP 3–4 sendok makan/tangki 16L) untuk mempercepat penutupan luka gesekan daun.',
      'Hindari masuk ke petakan sawah untuk menyiang gulma saat daun masih basah oleh embun pagi atau habis hujan karena baju/tangan petani akan menularkan bakteri ke rumpun lain.',
    ],
    biologicalOrganicControl: [
      {
        agentName: 'Bakteri Antagonis Corynebacterium sp. / Paenibacillus polymyxa',
        practicalDosage: '5 – 6 tutup botol (80–100 ml) per tangki semprot 16 Liter',
        applicationMethod: 'Semprotkan merata pada tajuk daun sore hari (pukul 15:30–17:00 WIB) untuk menekan koloni bakteri Xanthomonas di permukaan daun.',
      },
      {
        agentName: 'PGPR (Plant Growth Promoting Rhizobacteria) + Ekstrak Daun Sirih / Kunyit',
        practicalDosage: '100 ml PGPR + 50 ml ekstrak rimpang kunyit per tangki 16 Liter',
        applicationMethod: 'Menginduksi ketahanan sistemik tanaman padi dan menghambat pembelahan sel bakteri.',
      },
    ],
    chemicalControlGuides: [
      {
        activeIngredient: 'Tembaga Oksiklorida 50% / Tembaga Hidroksida 77% (Bakterisida Kontak)',
        category: 'Bakterisida',
        registeredBrands: 'Nordox 56 WP (Tembaga Oksida) / Kocide 77 WP / Kuproxat 345 SC',
        dosagePer16LTank: '1,5 – 2 sendok makan (20–25 gram atau 25 ml) per tangki 16 Liter',
        dosagePerArea: '± 400–500 gram/Ha (atau ± 280–350 gram per Bahu 0,7 Ha)',
        applicationNotes: 'Melapisi luka gesekan daun dan membunuh bakteri Xanthomonas secara kontak. Jangan dicampur dengan pupuk daun berbahan N tinggi.',
      },
      {
        activeIngredient: 'Asam Oksolinat 20% / Streptomisin Sulfat / Kasugamisin (Bakterisida Sistemik)',
        category: 'Bakterisida',
        registeredBrands: 'Starner 20 WP / Agrept 20 WP / Kasumin 5/75 WP',
        dosagePer16LTank: '1,5 sendok makan (15–20 gram) per tangki 16 Liter',
        dosagePerArea: '± 300–400 gram/Ha (Semprot volume tinggi 400–500 L air/Ha)',
        applicationNotes: 'Bekerja sistemik menghentikan perkembangan hawar bakteri di dalam pembuluh daun.',
      },
      {
        activeIngredient: 'Mono Kalium Fosfat (MKP: P2O5 52% + K2O 34%) — Penguat Sel Daun',
        category: 'Pupuk Daun / Imunitas',
        registeredBrands: 'Pak Tani MKP / MerokeMKP',
        dosagePer16LTank: '3 – 4 sendok makan penuh (45–60 gram) per tangki 16 Liter',
        dosagePerArea: '± 1,0 – 1,5 kg/Ha',
        applicationNotes: 'Mengeringkan luka bakteri lebih cepat dan membuat helai daun lebih kaku tegak sehingga tahan terpaan angin.',
      },
    ],
    bestSprayingWindowToday: sprayWindow,
    recommendedAgendaTaskTitle: 'Aplikasi Bakterisida Tembaga / Corynebacterium + MKP (Kendali Kresek/HDB)',
    recommendedAgendaDosageNote: `Takaran Tangki 16L: Nordox 56 WP / Agrept 20 WP (1,5–2 sdm / 20–25 gr) + Pupuk MKP (3 sdm). Keringkan air macak-macak. Waktu: ${sprayWindow.recommendedHours}.`,
  };

  // =========================================================================
  // ATURAN EPIDEMIOLOGI 3:
  // Cuaca Panas-Lembap Pengap (Kelembapan >80%, Suhu 28–33°C) & Kanopi Rapat
  // -> Risiko Ledakan Wereng Batang Coklat (WBC / Hopperburn - Nilaparvata lugens)
  // =========================================================================
  let wbcScore = 52;
  if (humidityPct >= 80 && tempC >= 27 && tempC <= 34) {
    wbcScore += 28; // Kondisi panas-lembap pengap sangat memicu penetasan telur WBC
  } else if (humidityPct >= 75 || (tempC >= 28 && tempC <= 33)) {
    wbcScore += 16;
  }
  if (hst >= 18) wbcScore += 10; // Kanopi mulai menutup
  if (seasonMT.includes('MT1') || seasonMT.includes('MT2')) wbcScore += 6;
  wbcScore = Math.min(95, Math.max(44, wbcScore));

  const wbcRiskLevel: EpidemiologyOptAlert['riskLevel'] =
    wbcScore >= 76 ? 'Tinggi / Siaga' : wbcScore >= 60 ? 'Waspada' : 'Terkendali';

  const wbcAlert: EpidemiologyOptAlert = {
    id: 'opt-epid-wbc-hopperburn',
    optName: 'Wereng Batang Coklat (WBC / Gejala Hopperburn)',
    scientificName: 'Nilaparvata lugens Stål',
    targetCommodity: 'Padi',
    category: 'Serangan Hama',
    riskLevel: wbcRiskLevel,
    riskScorePct: wbcScore,
    plantingSeasonMT: seasonMT,
    cropAgeHstLabel: `${hst} HST (${phaseLabel} — Kanopi Rumpun Mulai Rapat)`,
    weatherTriggerHeadline: `Cuaca Pengap Panas-Lembap (${tempC}°C & Kelembapan ${humidityPct}%) · Iklim Mikro Pangkal Batang`,
    whyItThreatensNow: `Kombinasi suhu hangat ${tempC}°C dengan kelembapan udara tinggi (${humidityPct}%) menciptakan kondisi panas-lembap (pengap) di bawah kanopi rumpun padi umur ${hst} HST. Iklim mikro yang lembap dan teduh di pangkal batang mempercepat siklus hidup nimfa Wereng Batang Coklat serta memicu kemunculan wereng bersayap pendek (brakiptera) yang mampu bertelur hingga 300–500 butir per betina dan menyebabkan hamparan padi mengering terbakar (hopperburn) dalam hitungan hari.`,
    earlyFieldSymptoms: [
      'Singkap rumpun padi dan tepuk pangkal batang di dekat permukaan air: terlihat serangga kecil berwarna coklat kekuningan hingga coklat tua melompat di pangkal pelepah.',
      'Pangkal batang berubah warna menjadi coklat kehitaman disertai lapisan jelaga hitam tipis akibat cairan manis (embun madu) kotoran wereng.',
      'Daun-daun mulai menguning dari bawah lalu mengering coklat kemerahan melingkar di tengah petakan seperti tersiram air panas / terbakar (Hopperburn).',
    ],
    culturalPreventionSteps: [
      'KERINGKAN PETAKAN SAWAH SEGERA selama 3–4 hari (Pengairan Berselang / AWD) hingga tanah agak retak rambut! Sinar matahari dan udara kering yang masuk ke pangkal batang akan menggagalkan penetasan telur wereng.',
      'DILARANG KERAS menyemprot insektisida golongan Piretroid sintetik (seperti sipermetrin/deltametrin/lamda sihalotrin) pada padi karena terbukti membunuh laba-laba predator dan memicu resurgensi (ledakan telur wereng berlipat ganda).',
      'Singkap lorong tanam (sibak barisan padi setiap 6–8 baris) agar sinar matahari menembus pangkal rumpun dan sirkulasi angin lancar.',
      'Lestarikan musuh alami di pangkal rumpun: Laba-laba Serigala (Lycosa pseudoannulata), Kepik Mirid (Cyrtorhinus lividipennis), dan Kumbang Paederus.',
    ],
    biologicalOrganicControl: [
      {
        agentName: 'Cendawan Entomopatogen Beauveria bassiana & Metarhizium anisopliae',
        practicalDosage: '5 – 6 sendok makan (75–100 gram) atau 100 ml isolat cair per tangki 16 Liter',
        applicationMethod: 'Semprotkan wajib SORE HARI (pukul 15:30–17:30 WIB) diarahkan langsung ke PANGKAL BATANG bawah (bukan pucuk daun) agar spora jamur menginfeksi kulit wereng.',
      },
      {
        agentName: 'Pestisida Nabati Ekstrak Biji Mimba (Azadirachtin) + Serai Wangi',
        practicalDosage: '4 – 5 tutup botol (60–80 ml) per tangki 16 Liter',
        applicationMethod: 'Menghambat pergantian kulit (molting) nimfa wereng muda tanpa membunuh laba-laba predator.',
      },
    ],
    chemicalControlGuides: [
      {
        activeIngredient: 'Pimetrozine 50% (Penghambat Makan Spesifik Wereng & Penekan Telur)',
        category: 'Insektisida',
        registeredBrands: 'Plenum 50 WG / Chess 50 WG',
        dosagePer16LTank: '1 – 1,5 sendok makan rata (12,5 – 15 gram) per tangki 16 Liter',
        dosagePerArea: '± 250–300 gram/Ha (atau ± 175–210 gram per Bahu 0,7 Ha)',
        applicationNotes: 'Begitu terhisap, wereng langsung berhenti makan dalam 1 jam dan mati kelaparan. Arahkan nozzle semprot ke pangkal batang setelah sawah dikeringkan.',
      },
      {
        activeIngredient: 'Triflumezopyrim 106 g/l / Dinotefuran 20% (Sistemik Akropetal Pangkal Batang)',
        category: 'Insektisida',
        registeredBrands: 'Pyriproxyfen / Pexalon 106 SC / Oshin 20 SG',
        dosagePer16LTank: '1 sendok makan (12–15 ml atau 15 gram) per tangki 16 Liter',
        dosagePerArea: '± 240 ml/Ha (Maksimal 2 kali aplikasi per musim untuk cegah resistensi)',
        applicationNotes: 'Efektif untuk nimfa dan imago wereng yang sudah tahan terhadap bahan aktif imidakloprid/buprofezin lama.',
      },
      {
        activeIngredient: 'Buprofezin 100 g/l + MIPC / BPMC (Penghambat Kitin Nimfa Muda)',
        category: 'Insektisida',
        registeredBrands: 'Applaud 10 WP / Dharmabas 500 EC',
        dosagePer16LTank: '2 sendok makan (25–30 gram/ml) per tangki 16 Liter',
        dosagePerArea: '± 400–500 gram/Ha',
        applicationNotes: 'Gunakan khusus saat populasi didominasi nimfa kecil (wereng muda belum bersayap) >10 ekor/rumpun.',
      },
    ],
    bestSprayingWindowToday: sprayWindow,
    recommendedAgendaTaskTitle: 'Keringkan Petakan Sawah (AWD) & Semprot Pangkal Batang Kendali WBC',
    recommendedAgendaDosageNote: `Keringkan air 3 hari. Takaran Tangki 16L: Plenum 50 WG (1–1,5 sdm / 15 gr) atau Beauveria bassiana (100 ml) diarahkan ke pangkal batang. Waktu: ${sprayWindow.recommendedHours}.`,
  };

  // =========================================================================
  // ATURAN EPIDEMIOLOGI 4:
  // Musim Peralihan / Kemarau (MT2 / MT3 — Padi, Kacang Hijau & Hortikultura):
  // Risiko Tinggi Thrips, Kutu Kebul, Ulat Grayak, Penggerek Batang (Sundep/Beluk)
  // & Bercak Daun Cercospora / Embun Tepung
  // =========================================================================
  let mt2Mt3PalawijaScore = 58;
  if (seasonMT.includes('MT3')) mt2Mt3PalawijaScore += 26;
  else if (seasonMT.includes('MT2')) mt2Mt3PalawijaScore += 18;
  else mt2Mt3PalawijaScore += 8;

  if (tempC >= 28) mt2Mt3PalawijaScore += 10;
  if (hasKacangHijauOrPalawija) mt2Mt3PalawijaScore += 8;
  mt2Mt3PalawijaScore = Math.min(96, Math.max(50, mt2Mt3PalawijaScore));

  const palawijaRiskLevel: EpidemiologyOptAlert['riskLevel'] =
    mt2Mt3PalawijaScore >= 76 ? 'Tinggi / Siaga' : mt2Mt3PalawijaScore >= 60 ? 'Waspada' : 'Terkendali';

  const palawijaAndBorerAlert: EpidemiologyOptAlert = {
    id: 'opt-epid-mt2-mt3-palawija-sundep',
    optName:
      'Thrips, Kutu Kebul, Ulat Grayak, Sundep/Beluk & Cercospora / Embun Tepung (Padi & Kacang Hijau)',
    scientificName:
      'Scirpophaga incertulas, Thrips palmi, Bemisia tabaci, Spodoptera litura & Cercospora canescens',
    targetCommodity: 'Padi & Palawija',
    category: 'Kompleks Hama & Jamur Palawija',
    riskLevel: palawijaRiskLevel,
    riskScorePct: mt2Mt3PalawijaScore,
    plantingSeasonMT: seasonMT,
    cropAgeHstLabel: `${hst} HST (Rotasi Padi – Kacang Hijau / Palawija)`,
    weatherTriggerHeadline: `${seasonMT} · Suhu ${tempC}°C & Kelembapan ${humidityPct}% · Migrasi Hama Peralihan/Kemarau`,
    whyItThreatensNow: `Pada periode ${seasonMT} dengan suhu siang ${tempC}°C dan kelembapan malam/pagi ${humidityPct}%, populasi ngengat Penggerek Batang Padi (Sundep/Beluk) meningkat tajam saat peralihan musim. Selain itu, pada tanaman Kacang Hijau, Kedelai, dan Cabai yang ditanam pasca-padi, udara siang yang hangat-kering mempercepat perkembangbiakan Thrips, Kutu Kebul (vektor virus kuning), dan Ulat Grayak, sementara embun malam memicu jamur Bercak Daun Cercospora dan Embun Tepung (Erysiphe polygoni).`,
    earlyFieldSymptoms: [
      'Pada Padi (Sundep/Beluk): Pucuk daun tengah menggulung kering kecoklatan dan mudah dicabut (Sundep fase vegetatif), atau malai keluar putih hampa berdiri tegak (Beluk fase berbunga) disertai penerbangan ngengat putih/kuning di sore hari.',
      'Pada Kacang Hijau & Cabai (Thrips & Kutu Kebul): Daun muda mengeriting melengkung ke atas dengan warna keperakan di permukaan bawah daun, disertai kutu putih kecil berterbangan saat tanaman digoyang.',
      'Pada Daun & Polong (Ulat Grayak): Daun berlubang-lubang tidak beraturan hingga tinggal tulang daun transparan; ulat aktif menyerang malam hari.',
      'Penyakit Cercospora & Embun Tepung Kacang Hijau: Bercak bulat coklat kemerahan berpusat pucat atau lapisan bedak putih seperti tepung pada permukaan daun tua menjelang pembungaan (25–45 HST).',
    ],
    culturalPreventionSteps: [
      'Pasang Perangkap Likat Kuning (Yellow Sticky Trap) sebanyak 25–40 buah/Ha setinggi pucuk tanaman untuk memonitor dan menangkap imago Thrips, Kutu Kebul, serta ngengat penggerek.',
      'Untuk Kacang Hijau pasca-padi (sistem tugal tanpa olah tanah): taburkan abu sekam / mulsa jerami tipis untuk menekan gulma dan menjaga kelembapan tanah tanpa menggenang (drainase keliling wajib kering).',
      'Kumpulkan dan musnahkan kelompok telur Penggerek Batang (tertutup bulu halus kecoklatan) dan kelompok telur Ulat Grayak di permukaan bawah daun.',
      'Lakukan penyemprotan hama ulat pada SORE menjelang MALAM hari (pukul 16:00–18:00 WIB) karena ulat grayak keluar dari persembunyian tanah saat matahari terbenam.',
    ],
    biologicalOrganicControl: [
      {
        agentName: 'Bio-Insektisida Bacillus thuringiensis (Bt) & Virus SLNPV',
        practicalDosage: '2 sendok makan (25–30 gram) per tangki semprot 16 Liter',
        applicationMethod: 'Semprotkan sore hari untuk meracuni pencernaan larva Ulat Grayak & Penggerek Batang secara spesifik.',
      },
      {
        agentName: 'Jamur Lecanicillium lecanii / Beauveria bassiana + Sabun Kalium Pertanian',
        practicalDosage: '100 ml isolat hayati + 1 sendok makan sabun kalium lembut per tangki 16 Liter',
        applicationMethod: 'Semprotkan ke balik bawah daun untuk meluruhkan lapisan lilin Kutu Kebul dan Thrips.',
      },
    ],
    chemicalControlGuides: [
      {
        activeIngredient: 'Klorantraniliprol 100 g/l + Tiametoksam 200 g/l (Sistemik Sundep/Beluk & Ulat)',
        category: 'Insektisida',
        registeredBrands: 'Virtako 300 SC / Prevathon 50 SC (Klorantraniliprol) / Belt Expert 480 SC',
        dosagePer16LTank: '1/2 – 1 sendok makan (7,5 – 12 ml / setengah tutup takar) per tangki 16 Liter',
        dosagePerArea: '± 150–200 ml/Ha (atau ± 100–140 ml per Bahu 0,7 Ha)',
        applicationNotes: 'Sangat ampuh menembus batang padi untuk mematikan ulat Sundep/Beluk di dalam ruas batang sekaligus mengendalikan ulat pemakan daun & polong Kacang Hijau.',
      },
      {
        activeIngredient: 'Abamektin 18 g/l atau Spinetoram 120 g/l (Spesialis Thrips & Kutu Kebul)',
        category: 'Insektisida',
        registeredBrands: 'Agrimec 18 EC / Demolish 18 EC / Endure 120 SC / Curacron 500 EC',
        dosagePer16LTank: '1 sendok makan (10–15 ml) per tangki 16 Liter',
        dosagePerArea: '± 250–300 ml/Ha (Arahkan nozzle menghadap ke balik bawah daun)',
        applicationNotes: 'Bekerja translaminar menembus jaringan daun untuk menghentikan hisapan Thrips dan Kutu Kebul penyebab daun keriting.',
      },
      {
        activeIngredient: 'Difenokonazol 250 g/l atau Belerang Aktif 80% (Cercospora & Embun Tepung Kacang Hijau)',
        category: 'Fungisida',
        registeredBrands: 'Score 250 EC / Amistartop 325 SC / Kumulus 80 DF (Belerang)',
        dosagePer16LTank: '1 sendok makan (12–15 ml Score) atau 2 sendok makan (30 gr Kumulus) per tangki 16 Liter',
        dosagePerArea: '± 250 ml/Ha (Score 250 EC) pada umur 25 & 40 HST Kacang Hijau',
        applicationNotes: 'Mencegah rontok bunga dan mengendalikan Bercak Daun Cercospora serta Embun Tepung putih pada Kacang Hijau.',
      },
    ],
    bestSprayingWindowToday: sprayWindow,
    recommendedAgendaTaskTitle:
      'Penyemprotan PHT Terpadu: Kendali Sundep/Beluk, Thrips, Ulat Grayak & Cercospora',
    recommendedAgendaDosageNote: `Takaran Tangki 16L: Virtako 300 SC (10 ml) atau Agrimec 18 EC (12 ml) + Score 250 EC (12 ml). Waktu ideal: ${sprayWindow.recommendedHours}.`,
  };

  const allAlerts = [blasAlert, kresekAlert, wbcAlert, palawijaAndBorerAlert];

  // Urutkan berdasarkan skor risiko tertinggi agar ancaman paling mendesak tampil paling atas
  return allAlerts.sort((a, b) => b.riskScorePct - a.riskScorePct);
}
