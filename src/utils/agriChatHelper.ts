export type GeminiAgriModelId = 'gemini-3.8-flash';

export interface AgriTopicClassification {
  isAgricultural: boolean;
  detectedCategory: 'pertanian' | 'sapaan_pertanian' | 'luar_topik';
  matchedOffTopicKeyword?: string;
}

const OFF_TOPIC_KEYWORDS = [
  'politik',
  'presiden',
  'pilpres',
  'pilkada',
  'partai',
  'dpr',
  'menteri korupsi',
  'artis',
  'selebriti',
  'gosip',
  'pacar',
  'putus cinta',
  'jodoh',
  'zodiak',
  'ramalan bintang',
  'kripto',
  'bitcoin',
  'ethereum',
  'trading forex',
  'saham',
  'judi',
  'slot gacor',
  'pinjol',
  'mobile legends',
  'free fire',
  'pubg',
  'genshin',
  'valorant',
  'playstation',
  'sepak bola',
  'liga inggris',
  'liga champions',
  'timnas',
  'cristiano ronaldo',
  'messi',
  'film bioskop',
  'netflix',
  'drama korea',
  'drakor',
  'anime',
  'koding',
  'javascript',
  'python',
  'react js',
  'typescript',
  'css',
  'html',
  'algoritma pemrograman',
  'ibu kota negara',
  'penemu lampu',
  'presiden pertama amerika',
  'rumus fisika kuantum',
  'resep kue bolu',
  'resep martabak',
  'mobil sport',
  'motor balap',
];

const AGRI_KEYWORDS = [
  // Umum Pertanian & Lahan
  'tani',
  'petani',
  'pertanian',
  'perkebunan',
  'agronomi',
  'agribisnis',
  'sawah',
  'lahan',
  'kebun',
  'ladang',
  'pekarangan',
  'greenhouse',
  'hidroponik',
  'tabulampot',
  'polybag',
  'pot',
  'petak',
  'bedengan',
  'mulsa',
  'tanah',
  'media tanam',
  'sekam',
  'cocopeat',
  'kompos',
  'humus',
  'lumpur',
  // Tanaman Pangan & Palawija
  'padi',
  'gabah',
  'beras',
  'ciherang',
  'inpari',
  'ir64',
  'situ bagendit',
  'ketan',
  'jagung',
  'palawija',
  'kacang',
  'kedelai',
  'singkong',
  'ubi',
  'ketela',
  'porang',
  'talas',
  'sorgum',
  'kentang',
  // Sayuran & Hortikultura
  'sayur',
  'sayuran',
  'hortikultura',
  'cabai',
  'cabe',
  'rawit',
  'bawang',
  'tomat',
  'terong',
  'timun',
  'mentimun',
  'kubis',
  'kol',
  'sawi',
  'pakcoy',
  'caisim',
  'bayam',
  'kangkung',
  'buncis',
  'wortel',
  'seledri',
  'selada',
  'brokoli',
  'pare',
  'oyong',
  'gambas',
  'labu',
  'paprika',
  // Buah-buahan & Tanaman Keras / Tahunan
  'tanaman keras',
  'pohon',
  'buah',
  'jambu',
  'jambu kristal',
  'jambu air',
  'jambu biji',
  'durian',
  'musang king',
  'bawor',
  'montong',
  'jeruk',
  'lemon',
  'nipis',
  'keprok',
  'pamelo',
  'alpukat',
  'alpokat',
  'miki',
  'aligator',
  'hass',
  'mangga',
  'rambutan',
  'kelengkeng',
  'lengkeng',
  'manggis',
  'duku',
  'nangka',
  'cempedak',
  'pepaya',
  'pisang',
  'salak',
  'sirsak',
  'sawo',
  'belimbing',
  'anggur',
  'apel',
  'stroberi',
  'buah naga',
  'melon',
  'semangka',
  'nanas',
  'kelapa',
  'sawit',
  'karet',
  'kopi',
  'kakao',
  'cokelat',
  'teh',
  'cengkeh',
  'lada',
  'merica',
  'pala',
  'vanili',
  'tebu',
  'jati',
  'sengon',
  'mahoni',
  'akasia',
  'gaharu',
  // Bunga-bungaan & Tanaman Hias (Florikultura)
  'bunga',
  'hias',
  'tanaman hias',
  'mawar',
  'anggrek',
  'melati',
  'krisan',
  'aglaonema',
  'aglonema',
  'monstera',
  'anthurium',
  'gelombang cinta',
  'keladi',
  'caladium',
  'bougenville',
  'bugenvil',
  'kertas',
  'adenium',
  'kamboja',
  'sukulen',
  'kaktus',
  'bonsai',
  'pucuk merah',
  'sansevieria',
  'lidah mertua',
  'philodendron',
  'begonia',
  'lili',
  'tulip',
  'matahari',
  'lavender',
  'taman',
  // Organ & Fase Fisiologis Tanaman
  'tanaman',
  'tumbuhan',
  'rumpun',
  'anakan',
  'akar',
  'serabut',
  'batang',
  'ranting',
  'dahan',
  'cabang',
  'tunas',
  'pucuk',
  'tajuk',
  'pelepah',
  'malai',
  'bulir',
  'biji',
  'benih',
  'bibit',
  'semai',
  'persemaian',
  'cangkok',
  'stek',
  'okulasi',
  'sambung',
  'grafting',
  'pangkas',
  'pruning',
  'daun',
  'menguning',
  'kuning',
  'bercak',
  'busuk',
  'kering',
  'layu',
  'kerdil',
  'keriting',
  'rontok',
  'gugur',
  'patah',
  'hampa',
  // Hama & Penyakit Tanaman (OPT)
  'beluk',
  'sundep',
  'wereng',
  'blas',
  'kresek',
  'hawar',
  'tungro',
  'patek',
  'antraknosa',
  'phytophthora',
  'fusarium',
  'cvpd',
  'kanker batang',
  'embun tepung',
  'embun bulu',
  'penggerek',
  'ulat',
  'grayak',
  'faw',
  'thrips',
  'trips',
  'kutu',
  'kebul',
  'kutu putih',
  'tungau',
  'mite',
  'lalat buah',
  'afid',
  'walang sangit',
  'keong',
  'tikus',
  'burung',
  'pipit',
  'rayap',
  'nematoda',
  'orong',
  'jamur',
  'cendawan',
  'bakteri',
  'virus',
  'opt',
  'hama',
  'penyakit',
  'gulma',
  'rumput',
  // Pupuk, Nutrisi & ZPT
  'pupuk',
  'urea',
  'npk',
  'phonska',
  'mutiara',
  'sp-36',
  'sp36',
  'za',
  'kcl',
  'zk',
  'mkp',
  'kno3',
  'kalsium',
  'boron',
  'magnesium',
  'znso4',
  'gandasil',
  'growmore',
  'dekastar',
  'osmocote',
  'organik',
  'kandang',
  'hayati',
  'poc',
  'kapur',
  'dolomit',
  'belerang',
  'silika',
  'zpt',
  'paklobutrazol',
  'giberelin',
  'auksin',
  'sitokinin',
  'perangsang',
  'bwd',
  // Pestisida & Bahan Aktif / Merk
  'obat',
  'pestisida',
  'insektisida',
  'fungisida',
  'bakterisida',
  'herbisida',
  'akarisida',
  'moluskisida',
  'rodentisida',
  'racun',
  'semprot',
  'nyemprot',
  'penyemprotan',
  'pemupukan',
  'mupuk',
  'kocor',
  'tangki',
  'dosis',
  'takaran',
  'bahan aktif',
  'merk',
  'merek',
  'amistartop',
  'score',
  'nativo',
  'antracol',
  'daconil',
  'ridomil',
  'aliette',
  'virtako',
  'prevathon',
  'plenum',
  'applaud',
  'marshal',
  'regent',
  'curacron',
  'decis',
  'agrimec',
  'abacel',
  'movento',
  'confidor',
  'nordox',
  'kocide',
  'agrept',
  'bactocyn',
  'petrogenol',
  // Cuaca, Air & Budidaya
  'cuaca',
  'hujan',
  'kemarau',
  'angin',
  'kelembapan',
  'suhu',
  'panas',
  'mendung',
  'air',
  'siram',
  'penyiraman',
  'irigasi',
  'macak',
  'genangan',
  'drainase',
  'pompa',
  'ph',
  'masam',
  'asem',
  'hst',
  'musim',
  'mt1',
  'mt2',
  'mt3',
  'gadu',
  'rendeng',
  'panen',
  'pascapanen',
  'jemur',
  'giling',
  'rendemen',
  'ton',
  'kwintal',
  'kuintal',
  'harga',
  'bulog',
  'poktan',
  'gapoktan',
  'penyuluh',
  'ppl',
  'traktor',
  'combine',
  'sabit',
  'tandur',
  'tanam',
  'menanam',
  'matun',
  'siang',
  'subur',
  'berbuah',
  'berbunga',
  'lebat',
  'manis',
  'synergy',
  'smart system',
  'tanicerdas',
  'pembuat',
  'pencipta',
  'developer',
];

const GREETING_PATTERNS = [
  /^(halo|hai|hi|hello|assalamualaikum|permisi|selamat\s+(pagi|siang|sore|malam)|pagi|siang|sore|malam|tes|ping|bosku|kang|min|pak|bu|sobat\s*tani)[\s!.,?]*$/i,
  /^(halo|hai|assalamualaikum).*(mau\s+tanya|boleh\s+tanya|nanya\s+dong|konsultasi)[\s!.,?]*$/i,
];

/**
 * Classifies whether a user query is strictly about agriculture/plants, a greeting, or off-topic.
 */
export function classifyAgriChatTopic(message: string): AgriTopicClassification {
  const normalized = (message || '').trim().toLowerCase();
  if (!normalized) {
    return { isAgricultural: false, detectedCategory: 'luar_topik' };
  }

  for (const regex of GREETING_PATTERNS) {
    if (regex.test(normalized)) {
      return { isAgricultural: true, detectedCategory: 'sapaan_pertanian' };
    }
  }

  const hasAgriKeyword = AGRI_KEYWORDS.some((kw) => normalized.includes(kw));

  for (const offKw of OFF_TOPIC_KEYWORDS) {
    if (normalized.includes(offKw) && !hasAgriKeyword) {
      return {
        isAgricultural: false,
        detectedCategory: 'luar_topik',
        matchedOffTopicKeyword: offKw,
      };
    }
  }

  if (hasAgriKeyword) {
    return { isAgricultural: true, detectedCategory: 'pertanian' };
  }

  const generalNonAgriIndicators = [
    'siapa ',
    'kapan indonesia merdeka',
    'ibu kota',
    'buatkan puisi',
    'buatkan cerita',
    'buatkan lagu',
    'terjemahkan bahasa',
    'hitung integral',
    'rumus matematika',
    'cara membuat website',
    'cara hack',
    'rekomendasi film',
    'rekomendasi lagu',
    'rekomendasi hp',
    'laptop gaming',
  ];

  for (const indicator of generalNonAgriIndicators) {
    if (normalized.includes(indicator)) {
      return {
        isAgricultural: false,
        detectedCategory: 'luar_topik',
        matchedOffTopicKeyword: indicator.trim(),
      };
    }
  }

  return {
    isAgricultural: false,
    detectedCategory: 'luar_topik',
  };
}

/**
 * Builds a polite, firm (tegas), warm (ramah), and casual/friendly (gaul & bersahabat)
 * refusal message when the farmer asks something outside of agriculture & plants.
 */
export function buildAgriRefusalReply(message: string, farmerName = 'Sobat Tani'): string {
  const shortName = farmerName.split(' ')[0] || 'Bosku';
  return (
    `Waduh maaf banget nih **${shortName} / Bosku**! 🙏😊\n\n` +
    `Saya **Kang Tani AI (Gemini AI 3.8 Flash)** punya aturan tegas: saya **100% fokus khusus membahas dunia Pertanian & Tanaman saja** dan nggak melayani obrolan di luar pertanian.\n\n` +
    `Yuk, kita ngobrolin tanaman aja biar hasilnya makin jos! Bosku bebas tanya seputar:\n` +
    `• **Tanaman Pangan & Palawija**: Padi, jagung, kedelai, kacang hijau, singkong, ubi, kentang, porang.\n` +
    `• **Sayuran & Hortikultura**: Cabai, bawang merah, tomat, terong, timun, kubis, sawi, kangkung, bayam.\n` +
    `• **Buah & Tanaman Keras**: Durian, alpukat (alpokat), jeruk, jambu kristal/air, mangga, kelengkeng, kopi, kakao, sawit.\n` +
    `• **Bunga & Tanaman Hias**: Anggrek, mawar, aglaonema, monstera, bougenville, adenium, bonsai.\n` +
    `• **Perawatan, Pupuk & Multi-Merk Obat**: Diagnosa akar/batang/daun/bunga/buah, perangsang buah, serta pilihan bahan aktif & merk dagang insektisida/fungisida.`
  );
}

/**
 * Builds a fast, smart, accurate, friendly, tegas, ramah, gaul & bersahabat agricultural response
 * covering Padi, Jagung, Sayuran, Palawija, Tanaman Keras, Bunga/Hias, Jambu, Durian, Jeruk, Alpukat, etc.
 */
export function buildSmartAgriFallbackReply(
  message: string,
  farmContext?: {
    farmerName?: string;
    plotName?: string;
    commodity?: string;
    variety?: string;
    hst?: number;
    areaHa?: number;
    soilPh?: number;
    weatherTempC?: number;
    weatherHumidityPct?: number;
    weatherRainProbPct?: number;
    sprayingStatus?: string;
    cameraDiagnosis?: {
      detectedName?: string;
      scientificName?: string;
      plantPart?: string;
      commodity?: string;
      confidencePct?: number;
      causeCategory?: string;
      visualObservations?: string;
      recommendedProductsSummary?: string;
    };
  }
): string {
  const classification = classifyAgriChatTopic(message);
  const farmerName = farmContext?.farmerName || 'Pak Budi';
  const shortName = farmerName.split(' ')[0] || 'Sobat Tani';
  const plotName = farmContext?.plotName || 'Lahan 1';
  const commodity = farmContext?.commodity || 'Padi';
  const variety = farmContext?.variety || 'Ciherang';
  const hst = farmContext?.hst ?? 20;
  const areaHa = farmContext?.areaHa ?? 1.2;
  const soilPh = farmContext?.soilPh ?? 6.5;

  if (!classification.isAgricultural) {
    return buildAgriRefusalReply(message, farmerName);
  }

  if (classification.detectedCategory === 'sapaan_pertanian') {
    return (
      `Halo juga **${shortName} / Sobat Tani**! Salam sehat dan semangat terus merawat tanaman! 🌾🥑🍊🌸\n\n` +
      `Saya **Kang Tani AI (Gemini AI 3.8 Flash)** siap menjawab cepat, cerdas, dan tepat seputar **semua jenis tanaman pertanian**:\n` +
      `• **Padi, Jagung & Palawija** (kedelai, kacang hijau, singkong, ubi)\n` +
      `• **Sayuran** (cabai, bawang merah, tomat, terong, timun, sawi, kangkung)\n` +
      `• **Tanaman Buah & Tanaman Keras** (durian, alpukat/alpokat, jeruk, jambu, mangga, kopi, sawit)\n` +
      `• **Bunga & Tanaman Hias** (anggrek, mawar, bougenville, aglaonema, monstera, adenium)\n\n` +
      `Tanaman apa yang mau kita bahas hari ini Bosku? Langsung ketik aja ya!`
    );
  }

  const lower = message.toLowerCase();

  // If question comes from Camera AI with active cameraDiagnosis context
  if (farmContext?.cameraDiagnosis?.detectedName) {
    const cam = farmContext.cameraDiagnosis;
    return (
      `Siap Bosku **${shortName}**! Berdasarkan **Analisis Kamera Gemini AI 3.8 Flash** pada organ **${cam.plantPart || 'Tanaman'} (${cam.commodity || commodity})**, berikut jawaban tegas & tepat untuk pertanyaan Bosku:\n\n` +
      `• **Diagnosis Kamera Terdeteksi**: **${cam.detectedName}** (*${cam.scientificName || '-'}* — Keyakinan **${cam.confidencePct ?? 92}%**).\n` +
      `• **Kondisi Visual Organ (${cam.plantPart})**: ${cam.visualObservations || 'Gejala spesifik teridentifikasi pada jaringan organ tanaman.'}\n` +
      `• **Rekomendasi Bahan Aktif & Multi-Merk Terbaik**:\n` +
      `${cam.recommendedProductsSummary || 'Gunakan rotasi bahan aktif sesuai golongan IRAC/FRAC yang tertera pada kartu rekomendasi di atas.'}\n\n` +
      `**Saran Praktis Gemini AI 3.8 Flash**: Aplikasikan pada pagi hari (**06.30–09.00 WIB**) atau sore (**15.30–17.00 WIB**) saat cuaca tidak hujan, gunakan takaran sesuai tangki 16L, dan tambahkan perekat non-ionik bila kelembapan tinggi!`
    );
  }

  // 0. Creator / SYNERGY Smart System queries
  if (
    lower.includes('synergy') ||
    lower.includes('smart system') ||
    lower.includes('siapa pembuat') ||
    lower.includes('siapa yang buat') ||
    lower.includes('pencipta') ||
    lower.includes('developer')
  ) {
    return (
      `Siap Bosku **${shortName}**! 🌟\n\n` +
      `Aplikasi **TaniCerdas AI** ini dirancang dan dikembangkan oleh **SYNERGY Smart System** untuk mendukung petani dan pecinta tanaman di Indonesia dengan kecerdasan buatan **Gemini AI 3.8 Flash**, deteksi kamera per organ tanaman (Akar, Batang, Daun, Bunga/Malai, Buah/Gabah), serta telemetri cuaca presisi.\n\n` +
      `Yuk Bosku, ada tanaman (padi, jagung, sayuran, durian, alpukat, jeruk, jambu, atau bunga hias) yang mau dikonsultasikan sekarang?`
    );
  }

  // 1. Buah-buahan & Tanaman Keras (Durian, Alpukat/Alpokat, Jeruk, Jambu, Mangga, Kelengkeng, Kopi, Sawit)
  if (
    lower.includes('durian') ||
    lower.includes('alpukat') ||
    lower.includes('alpokat') ||
    lower.includes('jeruk') ||
    lower.includes('jambu') ||
    lower.includes('mangga') ||
    lower.includes('kelengkeng') ||
    lower.includes('lengkeng') ||
    lower.includes('tanaman keras') ||
    lower.includes('kopi') ||
    lower.includes('sawit') ||
    lower.includes('kakao') ||
    lower.includes('tabulampot')
  ) {
    const detectedFruit = lower.includes('durian')
      ? 'Durian'
      : lower.includes('alpukat') || lower.includes('alpokat')
      ? 'Alpukat (Alpokat)'
      : lower.includes('jeruk')
      ? 'Jeruk'
      : lower.includes('jambu')
      ? 'Jambu (Kristal / Air / Biji)'
      : lower.includes('mangga')
      ? 'Mangga'
      : lower.includes('kelengkeng') || lower.includes('lengkeng')
      ? 'Kelengkeng'
      : 'Tanaman Buah & Tanaman Keras';

    return (
      `Siap Bosku **${shortName}**! Ini panduan **cerdas, tegas & tepat** untuk perawatan **${detectedFruit}** agar tumbuh subur, cepat berbunga/berbuah lebat, dan bebas penyakit: 🌳🍊🥑\n\n` +
      `**1. Nutrisi Fase Pertumbuhan vs Pembungaan/Pembuahan (Booster Buah):**\n` +
      `• **Fase Vegetatif (Pertumbuhan Cabang & Daun)**: Berikan **NPK 16-16-16** (*Mutiara / Pak Tani / YaraMila*) rutin setiap bulan + pupuk kandang fermentasi + **Dolomit** agar pH tanah 6,0–6,8.\n` +
      `• **Fase Perangsang Bunga & Penguat Bakal Buah (Anti Rontok)**: Kocor & semprot **MKP (Mono Kalium Phosphate) Pak Tani** (3–5 g/L) + **KNO3 Putih** + **Kalsium-Boron** (*Calha / Karate Plus Boroni*) setiap 10–14 hari. Ini kunci tegas supaya bunga tidak rontok dan daging buah tebal/manis!\n\n` +
      `**2. Pengendalian Hama & Penyakit Utama (Pilihan Bahan Aktif & Multi-Merk):**\n` +
      `• **Kanker Batang & Busuk Akar (*Phytophthora* — sering di Durian, Alpukat & Jeruk)**:\n` +
      `  - *Metalaksil + Mankozeb*: **Ridomil Gold MZ 4/64 WG**, **Starmyl 25 WP** (oleskan/kocor di pangkal batang & akar).\n` +
      `  - *Fosetil Aluminium*: **Aliette 80 WP** (sistemik dua arah dari daun ke akar).\n` +
      `  - *Tembaga Oksiklorida*: **Nordox 56 WP**, **Kocide 77 WP** + kocor agens hayati **Trichoderma spp.**\n` +
      `• **Lalat Buah (Buah Busuk Berulat di Jambu, Jeruk, Mangga, Alpukat)**:\n` +
      `  - Pasang perangkap atraktan **Petrogenol 800 L (Metil Eugenol)** + semprot rotasi *Profenofos* (**Curacron 500 EC**), *Deltametrin* (**Decis 25 EC**), atau *Lambda Sihalotrin + Tiametoksam* (**Alika 247 ZC**) + lakukan pembungkusan buah (*fruit bagging*).\n` +
      `• **Penggerek Batang / Cabang & Ulat Daun**:\n` +
      `  - *Klorantraniliprol*: **Prevathon 50 SC**, **Virtako 300 SC**; atau *Asefat*: **Orthene 75 SP / DGW**.\n\n` +
      `**3. Teknik Pangkas (Pruning)**: Pangkas tunas air (*water sprout*) dan cabang yang saling tumpang tindih agar sinar matahari tembus ke batang utama!`
    );
  }

  // 2. Bunga-bungaan & Tanaman Hias (Anggrek, Mawar, Aglaonema, Monstera, Bougenville, Adenium, Keladi, Bonsai)
  if (
    lower.includes('bunga') ||
    lower.includes('hias') ||
    lower.includes('anggrek') ||
    lower.includes('mawar') ||
    lower.includes('aglaonema') ||
    lower.includes('aglonema') ||
    lower.includes('monstera') ||
    lower.includes('bougenville') ||
    lower.includes('bugenvil') ||
    lower.includes('adenium') ||
    lower.includes('keladi') ||
    lower.includes('bonsai') ||
    lower.includes('melati') ||
    lower.includes('krisan')
  ) {
    return (
      `Mantap Bosku **${shortName}**! Ini resep **tepat & praktis** merawat **Bunga & Tanaman Hias** (Mawar, Anggrek, Bougenville, Aglaonema, Monstera, Adenium, dll.) supaya rajin berbunga kompak dan daunnya glowing sehat: 🌸🌺🪴\n\n` +
      `**1. Media Tanam Porous (Kunci Akar Tidak Busuk)**:\n` +
      `• Gunakan campuran **Sekam Bakar + Andam/Kompos Daun Bambu + Pasir Malang/Perlit (2:1:1)** ditambah sedikit **Kapur Dolomit** & taburan **Furadan/Purdan** secukupnya. Untuk **Anggrek**, gunakan arang kayu + pakis/moss yang sirkulasi udaranya lancar.\n\n` +
      `**2. Nutrisi Pembungaan Lebat & Daun Cerah**:\n` +
      `• **Pemacu Bunga (Mawar, Bougenville, Adenium, Anggrek, Krisan)**: Semprot **Gandasil B (6-20-30)** atau **Growmore Merah (10-55-10)** + **MKP Pak Tani** (1–2 g/L) seminggu sekali di bawah daun pada pagi hari.\n` +
      `• **Tanaman Hias Daun (Aglaonema, Monstera, Keladi, Philodendron)**: Gunakan pupuk *slow-release* **Dekastar Osmocote (13-13-13 / 17-11-10)** + semprot **Gandasil D (20-15-15)** & **Vitamin B1 Liquinox Start** saat pindah pot agar akar tidak stres.\n\n` +
      `**3. Obat Hama & Jamur Tanaman Hias (Multi-Merk Pilihan)**:\n` +
      `• **Kutu Putih (*Mealybugs*), Thrips, Kutu Sisik & Tungau**:\n` +
      `  - *Abamektin 18 g/L*: **Agrimec 18 EC**, **Demolish 18 EC**, **Abacel 18 EC** (0,5–1 ml/L).\n` +
      `  - *Imidakloprid / Spirotetramat*: **Confidor 200 SL**, **Movento 240 SC**, atau **Starkle G** (tabur di pot).\n` +
      `• **Busuk Akar / Busuk Batang Lunak & Bercak Daun**:\n` +
      `  - *Propineb / Mankozeb*: **Antracol 70 WP**, **Dithane M-45** (2 g/L).\n` +
      `  - *Difenokonazol + Azoksistrobin*: **Score 250 EC**, **Amistartop 325 SC** + bakterisida **Bactocyn 150 AL** (khusus busuk lunak berlendir pada Aglaonema/Anggrek).`
    );
  }

  // 3. Sayuran, Jagung & Palawija (Cabai, Bawang, Tomat, Terong, Timun, Sawi, Jagung, Kedelai, Kacang Hijau, Singkong)
  if (
    lower.includes('sayur') ||
    lower.includes('cabai') ||
    lower.includes('cabe') ||
    lower.includes('bawang') ||
    lower.includes('tomat') ||
    lower.includes('terong') ||
    lower.includes('timun') ||
    lower.includes('sawi') ||
    lower.includes('kangkung') ||
    lower.includes('bayam') ||
    lower.includes('kubis') ||
    lower.includes('kol') ||
    lower.includes('jagung') ||
    lower.includes('kedelai') ||
    lower.includes('kacang hijau') ||
    lower.includes('singkong') ||
    lower.includes('palawija')
  ) {
    return (
      `Siap Bosku **${shortName}**! Ini solusi **cepat, cerdas & tepat** untuk **Tanaman Sayuran, Jagung & Palawija** (Cabai, Bawang Merah, Tomat, Sayur Daun, Jagung, Kacang Hijau/Kedelai): 🌽🌶️🥬\n\n` +
      `**1. Manajemen Pupuk & Pencegahan Rontok/Busuk Buah**:\n` +
      `• **Sayuran Buah (Cabai, Tomat, Terong, Timun)**: Kocor **NPK 16-16-16** + **KNO3 Merah** saat vegetatif, lalu masuk fase berbunga/berbuah ganti ke **NPK Grower (15-9-20) + MKP + Kalsium Nitrat (Calcinit / Meroke Calnit)** agar dinding sel tebal, tahan rontok, dan tahan penyakit Patek!\n` +
      `• **Jagung & Palawija**: Pastikan drainase lancar (jangan tergenang >24 jam karena akar jagung/palawija rawan busuk). Untuk **Jagung**, berikan Urea + NPK Phonska pada umur 10–15 HST dan 30–35 HST.\n\n` +
      `**2. Pengendalian Hama & Penyakit Utama (Multi-Bahan Aktif & Merk Dagang)**:\n` +
      `• **Thrips, Kutu Kebul & Tungau (Penyebab Daun Keriting Cabai/Tomat)**:\n` +
      `  - *Abamektin*: **Agrimec 18 EC**, **Demolish 18 EC**, **Abacel 18 EC**.\n` +
      `  - *Imidakloprid / Diafentiuron*: **Confidor 200 SL**, **Pegasus 500 SC**, **Curacron 500 EC**.\n` +
      `• **Ulat Grayak / Ulat FAW Jagung, Bawang & Sayuran**:\n` +
      `  - *Emamektin Benzoat*: **Proclaim 5 SG**, **Siklon 5.7 WG**, **Gordon 30 EC**.\n` +
      `  - *Klorantraniliprol / Spinetoram*: **Prevathon 50 SC**, **Besromil**, **Endure 120 SC**.\n` +
      `• **Antraknosa (Patek Cabai), Bercak Ungu (*Trotol* Bawang) & Busuk Daun**:\n` +
      `  - *Azoksistrobin + Difenokonazol*: **Amistartop 325 SC**, **Score 250 EC**.\n` +
      `  - *Klorotalonil / Mankozeb / Propineb*: **Daconil 75 WP**, **Antracol 70 WP**, **Bion-M 1/48 WP**.\n` +
      `• **Layu Fusarium & Layu Bakteri (*Ralstonia*)**:\n` +
      `  - Kocor pangkal batang dengan **Trichoderma + PGPR**, jaga pH tanah > 6,2 dengan **Dolomit**, dan aplikasikan bakterisida **Bactocyn 150 AL / Nordox 56 WP / Agrept 20 WP**.`
    );
  }

  // 4. Root / Akar / Asem-aseman queries
  if (lower.includes('akar') || lower.includes('asem') || lower.includes('masam') || lower.includes('busuk akar')) {
    return (
      `Siap Bosku **${shortName}**, kita bedah tegas soal **Kesehatan Akar & Tanah** ya! 🌱🔍\n\n` +
      `Kalau **akar tanaman menghitam/coklat lembek, bau busuk/belerang, dan minim akar putih baru**, itu tanda **Busuk Akar / Asem-Aseman (Keracunan Besi Fe²⁺ pada padi atau serangan jamur *Phytophthora/Fusarium* pada tanaman darat/buah)**.\n\n` +
      `**Langkah Tegas & Solusi Lapangan:**\n` +
      `1. **Perbaiki Drainase & Aerasi Tanah Segera**: Keringkan genangan air (pada sawah keringkan 3–5 hari sampai retak rambut; pada kebun buah/sayur buka parit drainase). **STOP pupuk Urea sementara!**\n` +
      `2. **Pemulihan Akar & pH**: Tabur **Kapur Dolomit** (*Kebomas / Super Dolomit*) bila pH < 6,0 + semprot/kocor **ZnSO4 (Seng Sulfat)** & **Asam Humat**.\n` +
      `3. **Fungisida & Bakterisida Perakaran (Pilihan Bahan Aktif & Merk Dagang)**:\n` +
      `   • **Metalaksil / Fosetil-Al (Untuk Akar Buah/Durian/Alpukat/Sayur)**: *Ridomil Gold MZ*, *Aliette 80 WP*, *Previcur N*.\n` +
      `   • **Asam Klorobromo Isosianurat / Tembaga (Untuk Sawah & Bakteri Akar)**: *Bactocyn 150 AL*, *Nordox 56 WP*, *Kocide 77 WP*, *Kuproxat 345 SC*.\n` +
      `   • **Agens Hayati Penguat Akar**: *Trichoderma spp. + PGPR* (*Tricho-G*, *Bio-PF*, *Anfus*) dikocorkan ke perakaran.`
    );
  }

  // 5. Insecticide / Hama / Wereng / Sundep / Beluk / Obat queries
  if (
    lower.includes('insektisida') ||
    lower.includes('wereng') ||
    lower.includes('sundep') ||
    lower.includes('beluk') ||
    lower.includes('penggerek') ||
    lower.includes('ulat') ||
    lower.includes('obat') ||
    lower.includes('hama') ||
    lower.includes('merk')
  ) {
    return (
      `Oke Bosku **${shortName}**, ini rekomendasi **tegas & lengkap pilihan bahan aktif beserta beberapa merk dagangnya** (biar Bosku gampang cari di kios pertanian dan bisa rotasi bahan aktif): 🛡️🌾\n\n` +
      `**1. Untuk Wereng Batang Coklat (WBC) & Wereng Hijau:**\n` +
      `• **Pymetrozine 50%** (Penghambat makan sistemik): *Plenum 50 WG*, *Chess 50 WG*, *Pyro 50 WG* (0,5–0,75 g/L).\n` +
      `• **Buprofezin 10–25%** (Pengatur tumbuh nimfa & telur): *Applaud 10 WP*, *Bassa 500 EC*, *Buprosida 100 EC* (1–1,5 g/L).\n` +
      `• **Dinotefuran / Nitenpiram** (Knockdown cepat): *Oshin 20 WP*, *Nitenpiram 100 SL*.\n\n` +
      `**2. Untuk Penggerek Batang (Sundep & Beluk) serta Ulat Grayak:**\n` +
      `• **Klorantraniliprol 50 g/L**: *Prevathon 50 SC*, *Ferterra 0.4 GR (tabur)*, *Coragen* (1,5 ml/L).\n` +
      `• **Klorantraniliprol + Tiametoksam**: *Virtako 300 SC*, *Voliam Targo* (0,5–0,75 ml/L).\n` +
      `• **Flubendiamida / Emamektin Benzoat**: *Belt Expert 480 SC*, *Takumi 20 WG*, *Siklon 5.7 WG*, *Proclaim 5 SG*.\n\n` +
      `**3. Untuk Jamur (Blas, Bercak Daun, Patek/Antraknosa):**\n` +
      `• **Azoksistrobin + Difenokonazol**: *Amistartop 325 SC*, *Tandem 325 SC*, *Miravis Duo* (1 ml/L).\n` +
      `• **Trisiklazol / Propineb / Tebukonazol**: *Filia 525 SE*, *Beam 75 WP*, *Antracol 70 WP*, *Nativo 75 WG*, *Score 250 EC*.`
    );
  }

  // 6. Fertilizer / Pupuk queries
  if (lower.includes('pupuk') || lower.includes('urea') || lower.includes('npk') || lower.includes('phonska') || lower.includes('mupuk')) {
    const ureaTotal = Math.round(200 * areaHa);
    const npkTotal = Math.round(300 * areaHa);
    return (
      `Siap **${shortName}**! Ini panduan pemupukan berimbang yang **tepat & presisi**: 💪🌾\n\n` +
      `• **Untuk Padi Sawah (${plotName}, luas ${areaHa} Ha)**:\n` +
      `  - **Urea Total**: ±**${ureaTotal} kg** (200 kg/Ha) & **NPK Phonska**: ±**${npkTotal} kg** (300 kg/Ha).\n` +
      `  - **Tahap 1 (7–10 HST)**: 35% Urea + 50% NPK.\n` +
      `  - **Tahap 2 (20–25 HST)**: 40% Urea sesuai pembacaan BWD pada kondisi air macak-macak.\n` +
      `  - **Tahap 3 (35–42 HST)**: 25% Urea + 50% NPK + KCl 50 kg/Ha.\n` +
      `• **Untuk Tanaman Buah (Durian, Alpukat, Jeruk, Jambu) & Sayuran**:\n` +
      `  - Gunakan **NPK 16-16-16 Mutiara** saat pertumbuhan vegetatif, dan kombinasikan **MKP + KNO3 Putih + Kalsium-Boron** saat fase pembungaan & pengisian buah agar tidak rontok!`
    );
  }

  // 7. Weather / Spraying queries
  if (lower.includes('cuaca') || lower.includes('hujan') || lower.includes('semprot') || lower.includes('nyemprot') || lower.includes('angin')) {
    return (
      `Mantap pertanyaannya Bosku **${shortName}**! Soal cuaca dan waktu semprot ini krusial banget biar obat atau pupuk nggak terbuang sia-sia: 🌤️🚿\n\n` +
      `• **Kondisi Lahan Saat Ini**: Suhu sekitar **${farmContext?.weatherTempC ?? 29}°C**, Kelembapan **${farmContext?.weatherHumidityPct ?? 74}%**, Peluang Hujan **${farmContext?.weatherRainProbPct ?? 25}%**.\n` +
      `• **Status Rekomendasi**: **${farmContext?.sprayingStatus || 'Kondusif untuk Pemupukan & Penyemprotan PHT'}**.\n\n` +
      `**Aturan Emas Penyemprotan Tanaman:**\n` +
      `1. **Waktu Terbaik**: Pagi hari pukul **06.00 – 09.00 WIB** (saat stomata daun terbuka) atau sore hari pukul **15.30 – 17.00 WIB**.\n` +
      `2. **Batas Tegas Tunda Semprot**: Jika peluang hujan **> 60%**, curah hujan **> 2 mm**, atau kecepatan angin **> 15 km/jam**, **WAJIB TUNDA** dulu supaya pestisida/pupuk daun tidak tercuci air hujan.`
    );
  }

  // Default comprehensive friendly agricultural response
  return (
    `Siap Bosku **${shortName}**! Saya **Kang Tani AI (Gemini AI 3.8 Flash)** siap membantu dengan cepat, cerdas, dan tepat! 🤝🌱\n\n` +
    `Berdasarkan pertanyaan Bosku, berikut prinsip penanganan tanaman yang tepat:\n` +
    `1. **Cek Spesifik Organ Tanaman**: Perhatikan apakah gejala muncul di **Akar** (busuk/hitam/asem-aseman), **Batang/Cabang** (lubang penggerek/kanker batang), **Daun** (bercak jamur/keriting thrips/kuning kahat hara), **Bunga/Malai**, atau **Buah/Gabah**.\n` +
    `2. **Nutrisi Tepat Fase**: Gunakan **NPK seimbang + Nitrogen** pada fase pertumbuhan tunas/daun, serta **MKP + KNO3 + Kalsium-Boron** saat fase pembungaan & pembuahan (baik untuk padi, jagung, sayuran, maupun pohon buah seperti durian, alpukat, jeruk, jambu, dan tanaman hias).\n` +
    `3. **Rotasi Bahan Aktif Obat**: Selalu gunakan minimal 2–3 pilihan bahan aktif berbeda (misal *Klorantraniliprol / Prevathon & Virtako* untuk ulat/penggerek, *Abamektin / Agrimec* untuk thrips/tungau, *Pymetrozine / Plenum* untuk wereng, atau *Azoksistrobin+Difenokonazol / Amistartop & Score* untuk jamur).\n\n` +
    `Sebutkan nama tanaman dan gejala spesifiknya ya Bosku biar langsung saya kasih dosis dan merk obat paling jitu!`
  );
}

export function isStrictAgriculturalTopic(message: string): { allowed: boolean; category: string } {
  const res = classifyAgriChatTopic(message);
  return {
    allowed: res.isAgricultural,
    category: res.detectedCategory,
  };
}

