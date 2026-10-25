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

export const GEMINI_AGRI_GENERATION_CONFIG = {
  temperature: 0.3,
  topP: 0.85,
} as const;

export const AGRI_SYSTEM_INSTRUCTION = `ROLE & IDENTITAS:
Kamu adalah "Kang Tani AI", asisten pakar agronomi dan perlindungan tanaman presisi tinggi berbasis Gemini 3.8 Flash. Kamu bertugas melayani petani Indonesia dengan gaya bicara yang hangat, bersahabat, merakyat ("Sobat Tani" / "Bosku"), komunikatif, namun SANGAT DISIPLIN, TEGAS, dan ILMIAH saat memberikan dosis, diagnosa, dan cara aplikasi obat/pupuk.
Prinsip utamamu adalah: AKURAT, NYATA, DAN ANTI-HALUSINASI. Dilarang keras mengarang bahan aktif, takaran fiktif, atau memberikan diagnosa jika data lapangan tidak mendukung.

BATASAN DOMAIN KETAT:
- HANYA jawab pertanyaan seputar dunia pertanian, perkebunan, tanaman pangan (padi, jagung, ketan, dll.), sayuran, palawija, buah-buahan (durian, alpukat, jeruk, jambu), tanaman keras, dan tanaman hias/bunga.
- Tolak secara sopan segala topik di luar dunia tanaman dan pertanian (seperti politik, teknologi umum, gosip, finansial non-tani).

ATURAN WAJIB ANALISIS PERTANYAAN & ANTI-HALUSINASI (ANTI-TEMPLATE GENERIK):
1. JAWAB HANYA APA YANG DITANYAKAN (KLASIFIKASIKAN MAKSUD PETANI SEBELUM MENJAWAB):
   - Jika petani bertanya tentang VARIETAS/BUDIDAYA SPESIFIK (contoh: "bantu saya tentang padi ketan", "cara tanam jagung manis"):
     -> LANGSUNG jelaskan karakteristik komoditas tersebut, jarak tanam, pemupukan, kebutuhan air/hara khususnya, dan tips budidayanya. JANGAN memberikan template umum periksa organ tubuh tanaman atau penanganan hama/penyakit jika petani tidak menanyakannya!
   - Jika petani menanyakan HAMA/PENYAKIT/GEJALA tertentu:
     -> Langsung fokus ke organisme sasaran tersebut, identifikasi penyebabnya, sebutkan ciri fisik lapangan, dan berikan solusinya secara terstruktur.
   - Jika pertanyaan ambigu atau kurang data (misal: "daun kuning", "tanaman layu"):
     -> Sebutkan 2-3 kemungkinan paling umum di lapangan (jamur, bakteri, atau defisiensi hara) lalu minta konfirmasi ciri fisiknya sebelum menetapkan diagnosa pasti.
   - Jika pertanyaan singkat/umum (hanya menyebut nama tanaman):
     -> Berikan ringkasan kunci sukses komoditas tersebut, lalu tanyakan kebutuhan spesifiknya (apakah soal benih, pemupukan, atau kendala hama).

2. STANDAR REKOMENDASI PESTISIDA & PUPUK (WAJIB NYATA & MULTI-MERK):
   Jika memberikan rekomendasi kimia/obat, HANYA rekomendasikan Bahan Aktif dan Merk Dagang yang resmi terdaftar di Kementan RI, dan berikan minimal 2 opsi bahan aktif berbeda golongan (untuk rotasi anti-resistensi) dengan format wajib:
   - Opsi 1: [Bahan Aktif] -> Contoh Merk: [Merk A / Merk B] -> Dosis per Tangki 16L: [Takaran ml/gram atau sendok makan].
   - Opsi 2: [Bahan Aktif Pembanding] -> Contoh Merk: [Merk C / Merk D] -> Dosis per Tangki 16L: [Takaran].
   - Solusi Hayati / Organik & Nutrisi Pemulihan: Agens hayati (Trichoderma, PGPR, dll.) atau pupuk pemulih (MKP, Silika, Kalsium-Boron, dll.).

3. INTEGRASI KONTEKS LOKAL (JIKA TERSEDIA):
   - Manfaatkan konteks lahan aktif (umur HST, varietas, kondisi cuaca live, kelembapan) untuk memberikan anjuran jam semprot yang tepat (misal: "kondisi berawan/angin kencang, tunda penyemprotan").

4. GAYA PENYAMPAIAN:
   - Sapa akrab ("Sobat Tani" atau "Bosku").
   - Langsung ke poin solusi di baris pertama tanpa kalimat pembuka yang bertele-tele.
   - Gunakan format poin-poin terstruktur agar mudah dibaca di layar HP saat petani berada di sawah/kebun.`;

/**
 * Builds a polite, firm (tegas), warm (ramah), and casual/friendly (gaul & bersahabat)
 * refusal message when the farmer asks something outside of agriculture & plants.
 */
export function buildAgriRefusalReply(message: string, farmerName = 'Sobat Tani'): string {
  const shortName = farmerName.split(' ')[0] || 'Bosku';
  return (
    `Mohon maaf **${shortName} / Bosku** 🙏😊, **Kang Tani AI (Gemini AI 3.8 Flash)** **100% fokus khusus membahas dunia Pertanian & Tanaman saja** dan tidak melayani topik di luar pertanian.\n\n` +
    `Silakan tanyakan langsung seputar tanaman Bosku:\n` +
    `• **Tanaman Pangan & Palawija**: Padi sawah, padi ketan, jagung manis/hibrida, kedelai, kacang hijau, singkong, ubi.\n` +
    `• **Sayuran & Hortikultura**: Cabai, bawang merah, tomat, terong, timun, kubis, sawi, kangkung.\n` +
    `• **Buah & Tanaman Keras**: Durian, alpukat (alpokat), jeruk, jambu kristal, mangga, kelengkeng, kopi, sawit.\n` +
    `• **Bunga & Tanaman Hias**: Anggrek, mawar, aglaonema, monstera, bougenville, adenium.\n` +
    `• **Dosis Pupuk & Multi-Merk Obat Resmi**: Takaran per tangki 16L, bahan aktif rotasi, dan agensia hayati.`
  );
}

/**
 * Builds an accurate, non-hallucinating, strictly question-synchronized agricultural response
 * following AGRI_SYSTEM_INSTRUCTION.
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
  const areaHa = farmContext?.areaHa ?? 1.2;
  const weatherTemp = farmContext?.weatherTempC ?? 29;
  const weatherHum = farmContext?.weatherHumidityPct ?? 74;
  const sprayStatus = farmContext?.sprayingStatus || 'Kondusif untuk Pemupukan & Penyemprotan PHT';

  if (!classification.isAgricultural) {
    return buildAgriRefusalReply(message, farmerName);
  }

  if (classification.detectedCategory === 'sapaan_pertanian') {
    return (
      `Siap **${shortName} / Bosku**! **Kang Tani AI (Gemini AI 3.8 Flash)** siap membantu dengan akurat dan tepat sasaran. 🌾🌽🍊\n\n` +
      `Silakan sebutkan langsung apa yang ingin dibahas hari ini:\n` +
      `• **Budidaya & Varietas Spesifik** (misal: cara tanam padi ketan, jagung manis, cabai, durian, alpukat)\n` +
      `• **Dosis Pemupukan Berimbang** (Urea, NPK, MKP, KNO3, Kalsium-Boron)\n` +
      `• **Diagnosa Gejala & Rekomendasi Obat Resmi** (Multi-bahan aktif & takaran per tangki 16L)`
    );
  }

  const lower = message.toLowerCase().trim();

  // 0A. Camera AI active context
  if (farmContext?.cameraDiagnosis?.detectedName) {
    const cam = farmContext.cameraDiagnosis;
    return (
      `Siap Bosku **${shortName}**, berdasarkan **Analisis Kamera Gemini AI 3.8 Flash** pada organ **${cam.plantPart || 'Tanaman'} (${cam.commodity || commodity})**, hasil identifikasi adalah **${cam.detectedName}** (*${cam.scientificName || '-'}*, keyakinan **${cam.confidencePct ?? 92}%**):\n\n` +
      `• **Ciri Fisik Teramati (${cam.plantPart})**: ${cam.visualObservations || 'Gejala spesifik teridentifikasi pada jaringan organ tanaman.'}\n` +
      `• **Rekomendasi Bahan Aktif & Multi-Merk Terdaftar (Takaran Tangki 16L)**:\n` +
      `${cam.recommendedProductsSummary || 'Gunakan rotasi minimal 2 golongan bahan aktif berbeda sesuai kartu rekomendasi di atas.'}\n` +
      `• **Anjuran Waktu Aplikasi (${weatherTemp}°C, Kelembapan ${weatherHum}%)**: ${sprayStatus}. Semprot pagi (**06.30–09.00 WIB**) atau sore (**15.30–17.00 WIB**) saat tidak hujan.`
    );
  }

  // 0B. Creator / SYNERGY Smart System queries
  if (
    lower.includes('synergy') ||
    lower.includes('smart system') ||
    lower.includes('siapa pembuat') ||
    lower.includes('siapa yang buat') ||
    lower.includes('pencipta') ||
    lower.includes('developer')
  ) {
    return (
      `Siap Bosku **${shortName}**! Aplikasi **TaniCerdas AI** ini dirancang dan dikembangkan oleh **SYNERGY Smart System** menggunakan mesin **Gemini AI 3.8 Flash** untuk membantu petani Indonesia dalam budidaya presisi, deteksi kamera per organ tanaman, serta sinkronisasi kalender & cuaca. 🌟🌱\n\n` +
      `Ada komoditas atau kendala lahan yang ingin kita bahas sekarang Bosku?`
    );
  }

  // Helper flags to distinguish Cultivation/Variety intent vs Pest/Disease intent vs Ambiguous Symptom intent
  const hasPestOrDiseaseIntent =
    lower.includes('hama') ||
    lower.includes('penyakit') ||
    lower.includes('obat') ||
    lower.includes('racun') ||
    lower.includes('pestisida') ||
    lower.includes('insektisida') ||
    lower.includes('fungisida') ||
    lower.includes('bakterisida') ||
    lower.includes('wereng') ||
    lower.includes('sundep') ||
    lower.includes('beluk') ||
    lower.includes('penggerek') ||
    lower.includes('blas') ||
    lower.includes('kresek') ||
    lower.includes('hdb') ||
    lower.includes('walang sangit') ||
    lower.includes('ulat') ||
    lower.includes('faw') ||
    lower.includes('thrips') ||
    lower.includes('trips') ||
    lower.includes('kutu') ||
    lower.includes('tungau') ||
    lower.includes('patek') ||
    lower.includes('antraknosa') ||
    lower.includes('busuk') ||
    lower.includes('jamur') ||
    lower.includes('virus') ||
    lower.includes('tungro') ||
    lower.includes('lalat buah') ||
    lower.includes('keong') ||
    lower.includes('tikus') ||
    lower.includes('orong') ||
    lower.includes('nematoda') ||
    lower.includes('asem-aseman') ||
    lower.includes('merk');

  const isAmbiguousSymptomOnly =
    !hasPestOrDiseaseIntent &&
    (lower.includes('daun kuning') ||
      lower.includes('menguning') ||
      lower.includes('kenapa kuning') ||
      lower.includes('tanaman layu') ||
      lower.includes('daun layu') ||
      lower.includes('kenapa layu') ||
      lower.includes('kerdil') ||
      lower.includes('daun bercak') ||
      lower.includes('bercak daun'));

  // 1. AMBIGUOUS SYMPTOM QUERIES (Rule 1c: List 2-3 most common field possibilities & ask physical confirmation)
  if (isAmbiguousSymptomOnly) {
    if (lower.includes('layu')) {
      return (
        `Siap Bosku **${shortName}**, gejala **tanaman layu** tidak boleh langsung ditebak satu penyakit karena di lapangan ada **3 penyebab utama yang cara obatinya berbeda**:\n\n` +
        `1. **Layu Bakteri (*Ralstonia solanacearum*)**: Tanaman layu mendadak saat siang terik meski tanah lembap; jika batang bawah dipotong dan dicelup air bening akan keluar cairan putih keruh seperti asap.\n` +
        `2. **Layu Jamur (*Fusarium oxysporum* / *Phytophthora*)**: Daun menguning dari bawah lalu layu bertahap; bila batang dibelah tampak cincin pembuluh berwarna coklat kehitaman.\n` +
        `3. **Kerusakan Akar / Kekeringan / Hama Perakaran**: Akar putus dimakan uret/orong-orong atau tercekik genangan air (anaerob).\n\n` +
        `**Konfirmasi dulu ya Bosku**: Tanaman apa yang layu, dan apakah daunnya tetap hijau saat layu mendadak atau menguning dulu dari daun bawah?`
      );
    }

    return (
      `Siap Bosku **${shortName}**, gejala **daun menguning / bercak** punya **3 kemungkinan paling umum di lapangan** yang harus kita pastikan dulu ciri fisiknya agar tidak salah obat:\n\n` +
      `• **Kemungkinan 1 — Defisiensi Hara (Kurang Nitrogen / Kalium / Asem-aseman)**:\n` +
      `  - *Ciri Fisik*: Daun **tua (bawah)** menguning seragam mulai dari ujung daun membentuk huruf V tanpa bercak jamur, atau akar menghitam bau belerang.\n` +
      `• **Kemungkinan 2 — Infeksi Bakteri (Kresek / HDB) atau Virus Tungro**:\n` +
      `  - *Ciri Fisik*: Tepi helai daun mengering kuning jerami bergelombang (*Kresek*), atau daun **muda (pucuk)** berubah kuning-oranye cerah disertai rumpun kerdil (*Tungro*).\n` +
      `• **Kemungkinan 3 — Serangan Jamur Bercak Daun (*Bipolaris* / *Cercospora* / *Blas*)**:\n` +
      `  - *Ciri Fisik*: Terdapat bintik-bintik coklat tua oval atau belah ketupat yang dikelilingi halo kuning pada helai daun.\n\n` +
      `**Konfirmasi Ciri Fisik dulu ya Bosku**: Bagian mana yang menguning (**daun tua di bawah** atau **daun pucuk muda**), dan apakah ada bercak coklat/tepi daun kering?`
    );
  }

  // 2. SPECIFIC VARIETY / CULTIVATION QUERIES FOR PADI KETAN (Glutinous Rice)
  if (lower.includes('ketan')) {
    return (
      `Siap Bosku **${shortName}**, berikut panduan teknis budidaya **Padi Ketan (*Oryza sativa var. glutinosa*)** agar bulir bernas, kandungan amilopektin pekat (pulen lengket), dan tidak mudah rebah:\n\n` +
      `• **Karakteristik & Pilihan Varietas Unggul**:\n` +
      `  - Varietas populer: **Ketan Lusi** (tahan rebah, potensi 6–7,5 ton/Ha, umur ±110 HST), **Ketan Grendel**, **Ciasem**, **Setail**, atau **Ketan Hitam/Merah**.\n` +
      `  - Karakter khas padi ketan: Batang cenderung lebih tinggi dan rimbun dibanding padi biasa sehingga **rawan rebah (*lodging*)** jika kelebihan pupuk Urea.\n` +
      `• **Jarak Tanam & Pengairan**:\n` +
      `  - Gunakan sistem **Jajar Legowo 2:1 (25 × 12,5 × 50 cm)** dengan bibit muda **15–18 HSS** (2–3 batang/rumpun) agar batang bawah kokoh terkena sinar matahari.\n` +
      `  - Terapkan **pengairan berselang (AWD / macak-macak 3–5 cm)**; keringkan lahan 10–14 hari sebelum panen agar gabah ketan masak serempak.\n` +
      `• **Dosis Pemupukan Presisi per Hektare (Kunci Bulir Ketan Putih Pekat & Anti-Rebah)**:\n` +
      `  - **Tahap 1 (7–10 HST)**: **Urea 50 kg/Ha** + **NPK Phonska 150 kg/Ha**.\n` +
      `  - **Tahap 2 (21–25 HST)**: **Urea 50–75 kg/Ha** (jangan berlebihan) + **NPK Phonska 100 kg/Ha**.\n` +
      `  - **Tahap 3 / Fase Bunting (38–42 HST)**: **NPK 50 kg/Ha** + **KCl / MOP 50–75 kg/Ha** + semprot **MKP Pak Tani (4–5 sdm / tangki 16L)** & **Pupuk Silika Cair** untuk memperkokoh batang dan mengisi bulir ketan penuh sampai pangkal malai.\n\n` +
      `Apakah Bosku berencana menanam **Ketan Putih** atau **Ketan Hitam**, dan sudah masuk tahap persiapan benih atau pengolahan lahan?`
    );
  }

  // 3. SPECIFIC CULTIVATION / PLANTING QUERIES FOR JAGUNG (e.g., "cara tanam jagung manis")
  if (
    lower.includes('jagung') &&
    !hasPestOrDiseaseIntent &&
    (lower.includes('cara tanam') ||
      lower.includes('menanam') ||
      lower.includes('budidaya') ||
      lower.includes('manis') ||
      lower.includes('jarak tanam') ||
      lower.includes('pupuk') ||
      lower.includes('bantu'))
  ) {
    const isSweetCorn = lower.includes('manis');
    return (
      `Siap Bosku **${shortName}**, ini panduan teknis budidaya **${isSweetCorn ? 'Jagung Manis (*Sweet Corn* — misal Bonanza F1, Talenta, Secada)' : 'Jagung Hibrida (misal Bisi 18, Pioneer P32, NK Perkasa)'}** dari tanam hingga panen:\n\n` +
      `• **Persiapan Lahan & Jarak Tanam**:\n` +
      `  - Buat bedengan dengan parit drainase dalam (**30 cm**) karena akar jagung **sangat peka genangan air (>24 jam tergenang bikin kerdil/kuning)**.\n` +
      `  - **Jarak Tanam Ideal**: **70 cm × 20 cm** (1 benih per lubang) atau **75 cm × 25 cm**. Sebelum tanam, campur benih dengan perlakuan benih *Metalaksil* (misal **Saromyl 35 SD** 5 g/kg benih) agar bebas penyakit Bulai.\n` +
      `• **Jadwal Pemupukan Berimbang (Ditugal 7–10 cm di Samping Batang lalu Ditutup Tanah)**:\n` +
      `  - **Pupuk Dasar (0–7 HST)**: Pupuk kandang matang 2 ton/Ha + **NPK Phonska 150 kg/Ha**.\n` +
      `  - **Susulan I (14–18 HST)**: **Urea 100–150 kg/Ha** + **NPK Phonska 150 kg/Ha**.\n` +
      `  - **Susulan II (30–35 HST / Sebelum Keluar Bunga)**: **Urea 100–150 kg/Ha** + **KCl / MKP** agar tongkol besar dan biji terisi penuh sampai ujung (*tip filling*).\n` +
      `• **Pengairan & Pembumbunan**:\n` +
      `  - Lakukan pembumbunan (*pendangiran*) pada umur **20–25 HST** untuk menutup akar penyangga.\n` +
      `  - Pastikan kecukupan air terutama pada fase kritis **pembungaan & pengisian tongkol (40–60 HST)**.\n` +
      `  - **Umur Panen**: ${isSweetCorn ? 'Jagung Manis dipanen muda pada **65–72 HST** saat rambut tongkol coklat kering' : 'Jagung Pipilan dipanen kering fisiologis pada **95–105 HST**'}.`
    );
  }

  // 4. SPECIFIC CULTIVATION / PLANTING QUERIES FOR PADI SAWAH (when NOT asking about pests/diseases)
  if (
    (lower.includes('padi') ||
      lower.includes('ciherang') ||
      lower.includes('inpari') ||
      lower.includes('ir64') ||
      lower.includes('cara tanam') ||
      lower.includes('jarak tanam') ||
      lower.includes('semai')) &&
    !hasPestOrDiseaseIntent &&
    !lower.includes('pupuk')
  ) {
    return (
      `Siap Bosku **${shortName}**, berikut standar teknis budidaya **Padi Sawah Presisi (Ciherang / Inpari 32 / Inpari 42 / IR64)** untuk hasil panen maksimal:\n\n` +
      `• **1. Perlakuan Benih & Persemaian (Kebutuhan 25 kg/Ha)**:\n` +
      `  - Seleksi benih bernas dengan larutan air garam (telur mengapung), bilas bersih, rendam **24 jam**, lalu peram **48 jam** hingga berkecambah.\n` +
      `  - Pindah tanam bibit muda umur **15–18 HSS** (2–3 batang per lubang) agar anakan produktif maksimal (20–30 anakan/rumpun).\n` +
      `• **2. Jarak Tanam & Pengaturan Air (AWD)**:\n` +
      `  - Gunakan sistem **Jajar Legowo 2:1 (25 × 12,5 × 50 cm)** untuk meningkatkan populasi rumpun (+33%) dan sirkulasi cahaya.\n` +
      `  - Terapkan **Pengairan Berselang (*Alternate Wetting & Drying*)**: tinggi air 2–3 cm saat tanam & pemupukan, lalu biarkan macak-macak untuk memacu akar putih sehat.\n` +
      `• **3. Jadwal Pemupukan 3 Tahap (per Hektare)**:\n` +
      `  - **Tahap I (7–10 HST)**: **Urea 70 kg + NPK Phonska 150 kg**.\n` +
      `  - **Tahap II (21–25 HST)**: **Urea 80 kg** (sesuaikan Bagan Warna Daun / BWD).\n` +
      `  - **Tahap III / Primordia (35–42 HST)**: **Urea 50 kg + NPK Phonska 150 kg + KCl 50 kg**.\n\n` +
      `Saat ini lahan Bosku sedang di tahap apa (persiapan benih, olah tanah, atau sudah pindah tanam)?`
    );
  }

  // 5A. Multi-commodity Jagung, Palawija & Sayuran query (e.g. "Pemupukan jagung, palawija, dan sayuran cabai...")
  if (
    (lower.includes('sayur') ||
      lower.includes('cabai') ||
      lower.includes('cabe') ||
      lower.includes('bawang') ||
      lower.includes('tomat') ||
      lower.includes('palawija')) &&
    (lower.includes('jagung') || lower.includes('palawija') || !hasPestOrDiseaseIntent)
  ) {
    return (
      `Siap Bosku **${shortName}**, ini panduan teknis budidaya, pemupukan & perlindungan **Jagung, Palawija & Sayuran** (Cabai, Bawang Merah, Tomat, Sayur Daun, Kedelai/Kacang Hijau): 🌽🌶️🧅🥬\n\n` +
      `• **1. Bedengan, Jarak Tanam & Drainase**:\n` +
      `  - Buat bedengan tinggi **30–40 cm** dengan drainase lancar, tabur **Dolomit + Pupuk Kandang Fermentasi + Trichoderma** saat olah tanah. Jarak tanam **70 × 20 cm** (Jagung), **50 × 60 cm** (Cabai/Tomat), atau **15 × 15 cm** (Bawang Merah).\n` +
      `• **2. Program Pemupukan Presisi**:\n` +
      `  - **Jagung & Palawija**: Fase V3–V4 (10–14 HST) pupuk **NPK Phonska 200 kg/Ha + Urea 100 kg/Ha**; Fase V8–Tasseling (30–42 HST) susulan **Urea 150 kg/Ha + NPK 150 kg/Ha**.\n` +
      `  - **Sayuran (Cabai/Bawang/Tomat)**: Fase vegetatif kocor **NPK 16-16-16 Mutiara + KNO3 Merah** (3–5 g/L air); Fase generatif ganti ke **NPK Grower + MKP Pak Tani + Kalsium Nitrat (Calcinit)** agar bunga tidak rontok dan buah padat.\n` +
      `• **3. Standar Pengendalian Hama Ulat FAW, Thrips & Jamur Patek (Takaran Tangki 16L)**:\n` +
      `  - **Opsi 1 (Ulat Grayak FAW Jagung, Thrips & Kutu Kebul)**: *Emamektin Benzoat 5% / Klorantraniliprol* -> Contoh Merk: **Proclaim 5 SG / Siklon 5.7 WG / Prevathon 50 SC** (15 g atau 24 ml/tangki 16L) untuk ulat FAW; serta *Abamektin 18 g/L* (**Agrimec 18 EC / Demolish 18 EC**, 10 ml/tangki 16L) untuk Thrips.\n` +
      `  - **Opsi 2 (Jamur Patek/Antraknosa & Bulai)**: *Azoksistrobin + Difenokonazol* (**Amistartop 325 SC / Score 250 EC**, 15 ml/tangki 16L) + kontak *Propineb/Klorotalonil* (**Antracol 70 WP / Daconil 75 WP**, 30 g/tangki 16L).\n` +
      `  - **Solusi Hayati**: Semprot **Beauveria bassiana** pada sore hari dan kocor **PGPR + Trichoderma** di perakaran.`
    );
  }

  // 5. SPECIFIC PEST & DISEASE QUERIES (Rule 1b & Rule 2: Focus strictly on target organism + Opsi 1 & Opsi 2 + Dosage per 16L tank)
  if (hasPestOrDiseaseIntent) {
    // 5a. Wereng Batang Coklat / Wereng Hijau (and optional combined Sundep/Penggerek Batang)
    if (lower.includes('wereng') || lower.includes('wbc') || lower.includes('hopperburn')) {
      const alsoMentionsSundep =
        lower.includes('sundep') || lower.includes('beluk') || lower.includes('penggerek');
      return (
        `Siap Bosku **${shortName}**, untuk mengendalikan **Wereng Batang Coklat (*Nilaparvata lugens*) & Wereng Hijau**${alsoMentionsSundep ? ' sekaligus **Sundep/Beluk (Penggerek Batang)**' : ''}, fokuskan penyemprotan langsung ke **pangkal batang bawah** dan keringkan sawah (macak-macak) selama 3–4 hari:\n\n` +
        `• **Opsi 1 (Spesialis Wereng)**: **Pymetrozine 50%** (Penghambat makan sistemik) -> Contoh Merk: **Plenum 50 WG / Chess 50 WG / Pyro 50 WG** -> Dosis per Tangki 16L: **10 – 15 gram (1 – 1,5 sendok makan)**.\n` +
        `• **Opsi 2 (Pemutus Siklus Nimfa & Telur Wereng)**: **Buprofezin 10%** atau **Dinotefuran 20%** -> Contoh Merk: **Applaud 10 WP / Oshin 20 WP / Bassa 500 EC** -> Dosis per Tangki 16L: **20 – 25 gram (2 sendok makan)**.\n` +
        (alsoMentionsSundep
          ? `• **Opsi Khusus Sundep / Penggerek Batang**: **Klorantraniliprol 50 g/L** atau **Klorantraniliprol + Tiametoksam 300 g/L** -> Contoh Merk: **Prevathon 50 SC / Virtako 300 SC / Ferterra 0.4 GR** -> Dosis per Tangki 16L: **24 ml Prevathon (1,5 tutup botol)** atau **10–12 ml Virtako**.\n`
          : '') +
        `• **Solusi Non-Kimia & Nutrisi Pemulihan**:\n` +
        `  - **Kultur Teknis & Hayati**: Keringkan genangan air sawah, buka lorong *Jajar Legowo* agar sinar matahari masuk ke pangkal batang, dan aplikasikan jamur entomopatogen **Beauveria bassiana** (50 ml/tangki 16L) bila populasi masih di bawah ambang ekonomi.\n` +
        `  - **Nutrisi Pemulihan**: Hentikan pupuk Urea sementara; semprot **Pupuk Kalium + Silika Cair (MKP Pak Tani 3 sdm/tangki 16L)** agar pelepah batang keras dan tahan hisapan wereng.\n` +
        `  - *Pantangan Tegas*: **Dilarang menyemprot golongan Piretroid Sintetis** (Sihalotrin/Deltametrin) pada padi karena memicu *resurjensi* (ledakan telur wereng).\n\n` +
        `*Catatan Cuaca Live (${weatherTemp}°C, Kelembapan ${weatherHum}%)*: ${sprayStatus}.`
      );
    }

    // 5b. Penggerek Batang (Sundep / Beluk) & Ulat Grayak / FAW
    if (
      lower.includes('sundep') ||
      lower.includes('beluk') ||
      lower.includes('penggerek') ||
      lower.includes('ulat') ||
      lower.includes('faw') ||
      lower.includes('putih palsu')
    ) {
      return (
        `Siap Bosku **${shortName}**, untuk membasmi tuntas **Penggerek Batang (Sundep & Beluk / *Scirpophaga innotata*) maupun Ulat Grayak/Pelipat Daun**, gunakan insektisida sistemik penembus jaringan batang:\n\n` +
        `• **Opsi 1**: **Klorantraniliprol 50 g/L** (atau **Klorantraniliprol + Tiametoksam 300 g/L**) -> Contoh Merk: **Prevathon 50 SC / Virtako 300 SC / Ferterra 0.4 GR (Tabur)** -> Dosis per Tangki 16L: **24 ml Prevathon (1,5 tutup botol)** atau **10–12 ml Virtako**.\n` +
        `• **Opsi 2**: **Emamektin Benzoat 5%** atau **Flubendiamida 240 g/L** (Rotasi anti-resistensi) -> Contoh Merk: **Proclaim 5 SG / Siklon 5.7 WG / Belt Expert 480 SC / Takumi 20 WG** -> Dosis per Tangki 16L: **10 – 15 gram (1 sendok makan penuh)**.\n` +
        `• **Solusi Non-Kimia & Nutrisi Pemulihan**:\n` +
        `  - **Kultur Teknis**: Kumpulkan kelompok telur ngengat di daun dan atur tinggi air sawah agar pupa di pangkal batang terendam.\n` +
        `  - **Nutrisi Pemulihan**: Saat fase vegetatif (*Sundep*), berikan pupuk susulan **NPK + Fosfat + Asam Amino** untuk memacu keluarnya anakan baru pengganti; saat menjelang keluar malai (45–55 HST), lakukan 1 kali semprot pencegahan agar malai tidak putih hampa (*Beluk*).`
      );
    }

    // 5c. Hawar Daun Bakteri (HDB / Kresek)
    if (lower.includes('kresek') || lower.includes('hdb') || lower.includes('bakteri')) {
      return (
        `Siap Bosku **${shortName}**, penyakit **Hawar Daun Bakteri (HDB / Kresek — *Xanthomonas oryzae*)** disebabkan oleh **bakteri** (ciri: tepi daun mengering bergelombang warna kuning jerami), sehingga **wajib menggunakan Bakterisida** (bukan fungisida jamur biasa):\n\n` +
        `• **Opsi 1**: **Tembaga Oksida 56% / Tembaga Hidroksida** (Bakterisida kontak pelindung luka daun) -> Contoh Merk: **Nordox 56 WP / Kocide Opti 30 WG / Copcide 77 WP / Kuproxat 345 SC** -> Dosis per Tangki 16L: **30 – 40 gram (2 – 3 sendok makan)**.\n` +
        `• **Opsi 2**: **Streptomisin Sulfat 20% / Asam Oksolinat / Asam Klorobromo Isosianurat** (Bakterisida sistemik) -> Contoh Merk: **Agrept 20 WP / Bactocyn 150 AL / Starner 20 WP** -> Dosis per Tangki 16L: **25 – 30 gram (Agrept)** atau **20 – 30 ml (Bactocyn)**.\n` +
        `• **Solusi Non-Kimia & Nutrisi Pemulihan**:\n` +
        `  - **Tindakan Wajib**: **Hentikan segera pemupukan Urea (Nitrogen)** dan keringkan air petakan (macak-macak) agar bakteri tidak menular lewat aliran air.\n` +
        `  - **Nutrisi Pemulihan & Hayati**: Semprot **MKP Pak Tani (4 sdm/tangki 16L) + Kalsium-Silika** untuk menebalkan dinding sel daun, serta aplikasikan bakteri antagonis **Corynebacterium / PGPR** setelah jeda 5 hari dari bakterisida kimia.`
      );
    }

    // 5d. Penyakit Blas Daun / Blas Leher Malai (Pyricularia oryzae) & Bercak Coklat
    if (lower.includes('blas') || lower.includes('patah leher') || lower.includes('bercak coklat')) {
      return (
        `Siap Bosku **${shortName}**, untuk mengatasi **Penyakit Blas (*Pyricularia oryzae* — bercak belah ketupat / patah leher malai) & Bercak Coklat (*Bipolaris oryzae*)**, gunakan fungisida sistemik spesifik anti-blas:\n\n` +
        `• **Opsi 1**: **Trisiklazol 400 g/L + Propikonazol 125 g/L** atau **Isoprotiolan 400 g/L** -> Contoh Merk: **Filia 525 SE / Fujiwan 400 EC / Beam 75 WP** -> Dosis per Tangki 16L: **20 – 25 ml (Filia/Fujiwan)** atau **20 gram (Beam 75 WP)**.\n` +
        `• **Opsi 2**: **Azoksistrobin 200 g/L + Difenokonazol 125 g/L** atau **Tebukonazol + Trifloksistrobin** -> Contoh Merk: **Amistartop 325 SC / Nativo 75 WG / Score 250 EC** -> Dosis per Tangki 16L: **15 – 20 ml (Amistartop/Score)** atau **12 – 15 gram (Nativo)**.\n` +
        `• **Solusi Non-Kimia & Nutrisi Pemulihan**:\n` +
        `  - **Kultur Teknis**: Jaga genangan air tipis 3–5 cm (tanah sawah yang kering memicu pelepasan spora blas berkali-kali lipat) dan kurangi dosis Urea.\n` +
        `  - **Nutrisi Pemulihan**: Tambahkan **Pupuk Kalium (MKP) + Silika Cair** agar lapisan epidermis daun dan buku leher malai mengeras tahan penetrasi jamur.`
      );
    }

    // 5e. Walang Sangit (Leptocorisa oratorius)
    if (lower.includes('walang sangit')) {
      return (
        `Siap Bosku **${shortName}**, untuk mengendalikan **Walang Sangit (*Leptocorisa oratorius*)** pada fase **masak susu (pengisian bulir)** agar gabah tidak hampa/berbintik hitam:\n\n` +
        `• **Opsi 1**: **MIPC (Isoprokarb) 50%** atau **BPMC (Fenobukarb) 500 g/L** -> Contoh Merk: **Mipcinta 50 WP / Dharmabas 500 EC / Bassa 500 EC** -> Dosis per Tangki 16L: **30 – 40 gram (Mipcinta)** atau **30 ml (Dharmabas)**.\n` +
        `• **Opsi 2**: **Fipronil 50 g/L** atau **Tiametoksam + Lambda Sihalotrin** -> Contoh Merk: **Regent 50 SC / Alika 247 ZC** -> Dosis per Tangki 16L: **15 – 20 ml per tangki 16L**.\n` +
        `• **Solusi Non-Kimia & Nutrisi Pengisian Gabah**:\n` +
        `  - **Kultur Teknis**: Bersihkan gulma rumput-rumputan di pematang sawah dan pasang perangkap bau (umpan keong mas tumbuk/ikan asin busuk) di pinggir petakan.\n` +
        `  - **Nutrisi Pengisian Bulir**: Semprot **MKP Pak Tani (4 sdm/tangki 16L) + KNO3 Putih** agar kulit sekam cepat mengeras dan bulir bernas.`
      );
    }

    // 5f. Busuk Akar / Asem-aseman / Hama Akar
    if (lower.includes('akar') || lower.includes('asem') || lower.includes('orong') || lower.includes('nematoda')) {
      return (
        `Siap Bosku **${shortName}**, untuk mengatasi **Busuk Akar / Asem-Aseman (Keracunan Besi Fe²⁺/H₂S) maupun Hama Perakaran**, lakukan langkah terstruktur berikut:\n\n` +
        `• **Opsi 1 (Fungisida & Bakterisida Perakaran)**: **Metalaksil + Mankozeb** (tanaman darat/buah/sayur) atau **Asam Klorobromo Isosianurat / Tembaga** (padi sawah) -> Contoh Merk: **Ridomil Gold MZ 4/64 WG / Aliette 80 WP / Bactocyn 150 AL / Nordox 56 WP** -> Dosis per Tangki 16L: **30 gram (Ridomil/Nordox)** atau **25 ml (Bactocyn)**.\n` +
        `• **Opsi 2 (Khusus Hama Akar Orong-Orong / Uret / Nematoda)**: **Fipronil 50 g/L** atau **Karbofuran 3%** -> Contoh Merk: **Regent 50 SC (kocor pangkal) / Furadan 3GR / Curaterr 3GR (tabur tanah)** -> Dosis: **20 ml Regent per tangki 16L** atau **15–20 kg Furadan/Ha**.\n` +
        `• **Solusi Non-Kimia & Nutrisi Pemulihan Akar**:\n` +
        `  - **Drainase Wajib**: Keringkan genangan air sawah selama **3–5 hari** sampai tanah retak rambut agar gas H₂S menguap dan oksigen masuk ke akar; **STOP pupuk Urea**.\n` +
        `  - **Pemulih Akar & Hayati**: Taburkan **Kapur Dolomit + Pupuk ZnSO4 (Seng Sulfat 20–25 kg/Ha)** serta kocorkan **Trichoderma spp. + PGPR + Asam Humat** untuk menumbuhkan serabut akar putih baru.`
      );
    }

    // 5g. Thrips, Kutu Kebul, Tungau & Antraknosa (Patek) pada Cabai/Sayuran/Hias
    if (
      lower.includes('thrips') ||
      lower.includes('trips') ||
      lower.includes('kutu') ||
      lower.includes('tungau') ||
      lower.includes('keriting') ||
      lower.includes('patek') ||
      lower.includes('antraknosa')
    ) {
      return (
        `Siap Bosku **${shortName}**, berikut protokol pengendalian **Thrips/Kutu Kebul/Tungau (Daun Keriting) & Antraknosa (Patek Buah)** dengan rotasi bahan aktif resmi:\n\n` +
        `• **Opsi 1 (Khusus Thrips, Tungau & Kutu Kebul)**: **Abamektin 18 g/L** -> Contoh Merk: **Agrimec 18 EC / Demolish 18 EC / Abacel 18 EC** -> Dosis per Tangki 16L: **8 – 12 ml (½ – 1 tutup botol)**.\n` +
        `• **Opsi 2 (Rotasi Thrips/Kutu & Patek/Antraknosa)**:\n` +
        `  - *Untuk Kutu/Thrips*: **Imidakloprid 200 g/L / Diafentiuron 500 g/L** -> Contoh Merk: **Confidor 200 SL / Pegasus 500 SC / Curacron 500 EC** -> Dosis per Tangki 16L: **15 – 20 ml**.\n` +
        `  - *Untuk Jamur Patek (Antraknosa)*: **Azoksistrobin + Difenokonazol** dipadu kontak **Propineb / Klorotalonil** -> Contoh Merk: **Amistartop 325 SC + Antracol 70 WP / Daconil 75 WP** -> Dosis per Tangki 16L: **15 ml Amistartop + 30 gram Antracol**.\n` +
        `• **Solusi Non-Kimia & Nutrisi Pemulihan**:\n` +
        `  - Pasang **Perangkap Likat Kuning (*Yellow Sticky Trap*)** 40 buah/Ha, petik dan bakar buah yang terkena patek, serta semprot **Kalsium-Boron + MKP Pak Tani** (tanpa pupuk N tinggi) agar dinding sel buah tebal dan pucuk baru tumbuh normal.`
      );
    }

    // 5h. General Insecticide / Fungicide multi-brand reference when user asks broadly about "obat / insektisida / merk"
    return (
      `Siap Bosku **${shortName}**, berikut daftar **Bahan Aktif & Merk Dagang Resmi Kementan RI** beserta takaran per **Tangki 16 Liter** sesuai sasaran hama/penyakit:\n\n` +
      `**A. Sasaran Wereng Batang Coklat & Wereng Hijau:**\n` +
      `• **Opsi 1**: *Pymetrozine 50%* -> Contoh Merk: **Plenum 50 WG / Chess 50 WG** -> Dosis Tangki 16L: **10–15 gram**.\n` +
      `• **Opsi 2**: *Buprofezin 10%* -> Contoh Merk: **Applaud 10 WP / Bassa 500 EC** -> Dosis Tangki 16L: **20–25 gram**.\n\n` +
      `**B. Sasaran Penggerek Batang (Sundep/Beluk) & Ulat Grayak:**\n` +
      `• **Opsi 1**: *Klorantraniliprol* -> Contoh Merk: **Prevathon 50 SC / Virtako 300 SC** -> Dosis Tangki 16L: **24 ml (Prevathon)** atau **10 ml (Virtako)**.\n` +
      `• **Opsi 2**: *Emamektin Benzoat* -> Contoh Merk: **Proclaim 5 SG / Siklon 5.7 WG** -> Dosis Tangki 16L: **10–15 gram**.\n\n` +
      `**C. Sasaran Jamur Blas, Bercak Daun & Antraknosa (Patek):**\n` +
      `• **Opsi 1**: *Azoksistrobin + Difenokonazol* -> Contoh Merk: **Amistartop 325 SC / Score 250 EC** -> Dosis Tangki 16L: **15–20 ml**.\n` +
      `• **Opsi 2**: *Propineb 70% / Trisiklazol* -> Contoh Merk: **Antracol 70 WP / Filia 525 SE** -> Dosis Tangki 16L: **30 gram (Antracol)** atau **20 ml (Filia)**.\n\n` +
      `**D. Solusi Hayati & Pemulihan**: Gunakan agensia hayati **Trichoderma + PGPR** (dikocor dengan jeda 5–7 hari dari obat kimia) dan pupuk **MKP + Kalsium-Silika** untuk pemulihan jaringan tanaman.`
    );
  }

  // 6. Buah-buahan & Tanaman Keras (Durian, Alpukat/Alpokat, Jeruk, Jambu, Mangga, Kelengkeng, Kopi, Sawit)
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
    return (
      `Siap Bosku **${shortName}**, berikut panduan teknis perawatan & pembuahan **Durian, Alpukat (Alpokat), Jeruk, Jambu & Tanaman Keras** agar tumbuh subur, bunga tidak rontok, dan berbuah lebat: 🌳🍊🥑\n\n` +
      `• **1. Jarak Tanam, Drainase & Pangkas Tajuk (*Pruning*)**:\n` +
      `  - Buat gundukan/busut tanam tinggi **20–30 cm** agar leher akar **Durian & Alpukat** tidak tergenang air hujan (mencegah busuk akar *Phytophthora*).\n` +
      `  - Pangkas tunas air (*water sprout*) pada **Jeruk, Jambu Kristal, Durian & Alpukat** agar sinar matahari masuk langsung ke cabang utama dan memicu keluarnya bunga.\n` +
      `• **2. Program Pemupukan Fase Pertumbuhan vs Booster Bunga/Buah (Anti-Rontok)**:\n` +
      `  - **Fase Vegetatif (Tunas & Daun)**: Berikan **NPK 16-16-16** (*Mutiara / YaraMila*) rutin setiap bulan + pupuk kandang fermentasi + **Kapur Dolomit** (jaga pH tanah 6,0–6,8).\n` +
      `  - **Fase Perangsang Bunga & Penguat Bakal Buah**: Kocor dan semprot **MKP Pak Tani** (4–5 sendok makan / tangki 16L) + **KNO3 Putih** + **Kalsium-Boron** (*Calha / Karate Plus Boroni*) setiap 10–14 hari.\n` +
      `• **3. Perlindungan Tanaman Bila Muncul Gejala Hama/Jamur (Format Multi-Merk Tangki 16L)**:\n` +
      `  - **Opsi 1 (Kanker Batang & Busuk Akar *Phytophthora*)**: *Metalaksil + Mankozeb* -> Contoh Merk: **Ridomil Gold MZ 4/64 WG / Starmyl 25 WP** -> Dosis Tangki 16L: **30–40 gram** (kocor/oles batang).\n` +
      `  - **Opsi 2 (Sistemik Dua Arah & Lalat Buah)**: *Fosetil Aluminium 80%* (**Aliette 80 WP**, 30 g/tangki 16L) untuk akar; serta *Profenofos / Deltametrin* (**Curacron 500 EC / Decis 25 EC**, 15–20 ml/tangki 16L + perangkap **Petrogenol**) untuk lalat buah.\n` +
      `  - **Solusi Hayati**: Taburkan **Trichoderma spp. + Asam Humat** di piringan perakaran setiap awal dan akhir musim hujan.`
    );
  }

  // 7. Bunga-bungaan & Tanaman Hias (Anggrek, Mawar, Aglaonema, Monstera, Bougenville, Adenium, Keladi, Bonsai)
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
      `Siap Bosku **${shortName}**, ini panduan teknis perawatan **Bunga & Tanaman Hias** (Anggrek, Mawar, Bougenville, Aglaonema, Monstera, Adenium) agar rajin berbunga lebat dan daun sehat berkilau: 🌸🌺🪴\n\n` +
      `• **1. Media Tanam Porous (Kunci Akar Bebas Busuk)**:\n` +
      `  - Gunakan campuran **Sekam Bakar + Kompos Daun Bambu/Andam + Pasir Malang/Perlit (2:1:1)** ditambah sedikit **Dolomit**. Khusus **Anggrek**, gunakan media arang kayu + pakis/moss dengan aerasi tinggi.\n` +
      `• **2. Nutrisi Pemacu Bunga & Kesegaran Daun**:\n` +
      `  - **Tanaman Bunga (Mawar, Bougenville, Adenium, Anggrek)**: Semprot **Gandasil B (6-20-30)** atau **Growmore Merah (10-55-10)** + **MKP Pak Tani** (1–2 g/L air) seminggu sekali pada pagi hari.\n` +
      `  - **Tanaman Hias Daun (Aglaonema, Monstera, Keladi)**: Taburkan pupuk *slow-release* **Dekastar Osmocote (13-13-13)** di media pot + semprot **Gandasil D** & **Vitamin B1 Liquinox Start**.\n` +
      `• **3. Pengendalian Kutu Putih, Thrips & Busuk Lunak (Bila Terjadi Serangan)**:\n` +
      `  - **Opsi 1 (Kutu Putih / Thrips / Tungau)**: *Abamektin 18 g/L* -> Contoh Merk: **Agrimec 18 EC / Demolish 18 EC** -> Dosis: **0,5–1 ml per liter air (8–12 ml / tangki 16L)**.\n` +
      `  - **Opsi 2 (Jamur Bercak & Busuk Batang)**: *Propineb 70%* (**Antracol 70 WP**, 2 g/L) dipadu *Difenokonazol + Azoksistrobin* (**Score 250 EC / Amistartop 325 SC**, 1 ml/L) atau bakterisida **Bactocyn 150 AL** (khusus busuk berlendir).`
    );
  }

  // 8. Sayuran & Palawija (Cabai, Bawang, Tomat, Terong, Timun, Sawi, Kedelai, Kacang Hijau, Singkong)
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
    lower.includes('kedelai') ||
    lower.includes('kacang hijau') ||
    lower.includes('singkong') ||
    lower.includes('palawija')
  ) {
    return (
      `Siap Bosku **${shortName}**, ini panduan teknis budidaya & perawatan **Tanaman Sayuran & Palawija** (Cabai, Bawang Merah, Tomat, Sayur Daun, Kedelai/Kacang Hijau): 🌶️🧅🥬\n\n` +
      `• **1. Bedengan, Mulsa & Jarak Tanam**:\n` +
      `  - Buat bedengan tinggi **30–40 cm** dengan drainase lancar, tabur **Dolomit + Pupuk Kandang Fermentasi + Trichoderma** saat olah tanah. Gunakan jarak tanam **50 × 60 cm** (Cabai/Tomat) atau **15 × 15 cm** (Bawang Merah).\n` +
      `• **2. Program Pemupukan Kocor & Semprot**:\n` +
      `  - **Fase Vegetatif (7–30 HST)**: Kocor **NPK 16-16-16 Mutiara + KNO3 Merah** (3–5 gram/liter air, 200 ml per pohon).\n` +
      `  - **Fase Pembungaan & Pembuahan (>35 HST)**: Ganti ke **NPK Grower (15-9-20) + MKP Pak Tani + Kalsium Nitrat (Calcinit / Meroke Calnit)** agar bunga tidak rontok dan kulit buah tebal tahan penyakit.\n` +
      `• **3. Standar Pengendalian Hama & Penyakit Utama (Takaran Tangki 16L)**:\n` +
      `  - **Opsi 1 (Thrips, Kutu Kebul & Ulat)**: *Abamektin 18 g/L* (**Agrimec 18 EC / Demolish 18 EC**, 10 ml/tangki 16L) dirotasi dengan *Emamektin Benzoat / Klorantraniliprol* (**Proclaim 5 SG / Prevathon 50 SC**, 15 g atau 24 ml/tangki 16L).\n` +
      `  - **Opsi 2 (Jamur Patek/Antraknosa & Trotol Bawang)**: *Azoksistrobin + Difenokonazol* (**Amistartop 325 SC / Score 250 EC**, 15 ml/tangki 16L) + kontak *Propineb/Klorotalonil* (**Antracol 70 WP / Daconil 75 WP**, 30 g/tangki 16L).`
    );
  }

  // 9. Fertilizer / Pupuk queries
  if (
    lower.includes('pupuk') ||
    lower.includes('urea') ||
    lower.includes('npk') ||
    lower.includes('phonska') ||
    lower.includes('mupuk') ||
    lower.includes('mkp') ||
    lower.includes('kcl')
  ) {
    const ureaTotal = Math.round(200 * areaHa);
    const npkTotal = Math.round(300 * areaHa);
    return (
      `Siap Bosku **${shortName}**, ini dosis dan jadwal **Pemupukan Berimbang Presisi** sesuai fase tumbuh tanaman:\n\n` +
      `• **1. Dosis Padi Sawah (${plotName}, luas ${areaHa} Ha)**:\n` +
      `  - **Total Kebutuhan Musim**: **Urea ±${ureaTotal} kg** (200 kg/Ha) & **NPK Phonska ±${npkTotal} kg** (300 kg/Ha).\n` +
      `  - **Tahap I (7–10 HST)**: 35% Urea + 50% NPK Phonska.\n` +
      `  - **Tahap II (20–25 HST)**: 40% Urea (sesuaikan pembacaan Bagan Warna Daun / BWD).\n` +
      `  - **Tahap III / Bunting (35–42 HST)**: 25% Urea + 50% NPK Phonska + **KCl 50 kg/Ha**.\n` +
      `• **2. Pupuk Daun & Pengisian Bulir/Buah (Takaran per Tangki 16L)**:\n` +
      `  - **Fase Vegetatif**: **Gandasil D / Ultradap** (3–4 sendok makan per tangki 16L).\n` +
      `  - **Fase Generatif (Bunting, Berbunga & Pengisian Buah/Gabah)**: **MKP Pak Tani (Mono Kalium Phosphate)** **4–5 sendok makan (50–80 gram) per tangki 16L** + **KNO3 Putih** + **Kalsium-Boron** agar bulir bernas dan bunga/buah tidak rontok.`
    );
  }

  // 10. Weather / Spraying queries
  if (
    lower.includes('cuaca') ||
    lower.includes('hujan') ||
    lower.includes('semprot') ||
    lower.includes('nyemprot') ||
    lower.includes('angin')
  ) {
    return (
      `Siap Bosku **${shortName}**, berikut analisis **Cuaca Live & Waktu Penyemprotan Ideal** di lahan saat ini:\n\n` +
      `• **Data Telemetri Lahan**: Suhu **${weatherTemp}°C**, Kelembapan **${weatherHum}%**, Peluang Hujan **${farmContext?.weatherRainProbPct ?? 25}%**.\n` +
      `• **Status Rekomendasi Semprot**: **${sprayStatus}**.\n` +
      `• **Pedoman Jam Aplikasi Tepat**:\n` +
      `  1. **Pagi Hari (06.00 – 09.00 WIB)**: Waktu paling optimal karena stomata daun terbuka penuh dan angin masih tenang.\n` +
      `  2. **Sore Hari (15.30 – 17.00 WIB)**: Efektif untuk insektisida kontak/lambung karena ulat dan hama mulai aktif keluar.\n` +
      `  3. **Batas Tegas Tunda Semprot**: Jika peluang hujan **> 60%**, mendung gelap, atau angin kencang **> 15 km/jam**, tunda penyemprotan atau wajib tambahkan **perekat-perata non-ionik** (10–15 ml / tangki 16L).`
    );
  }

  // 11. Short / General Commodity or Farming Question (Rule 1d: Give key success summary & ask specific need)
  return (
    `Siap Bosku **${shortName}**! Untuk komoditas pertanian yang Bosku tanyakan (konteks aktif: **${commodity} di ${plotName}**), berikut **3 Kunci Sukses Utamanya**:\n\n` +
    `1. **Bibit & Jarak Tanam Ideal**: Gunakan benih berlabel resmi dengan sistem tanam yang memberi sirkulasi cahaya & udara optimal (seperti *Jajar Legowo 2:1* pada padi atau bedengan drainase dalam pada palawija/hortikultura).\n` +
    `2. **Nutrisi Tepat Fase**: Fokuskan **Nitrogen + Fosfat (Urea/NPK 16-16-16)** pada fase awal pertumbuhan akar & anakan, lalu beralih ke **Kalium + Fosfat + Kalsium-Boron (MKP Pak Tani 4–5 sdm / tangki 16L)** saat fase pembungaan dan pengisian bulir/buah.\n` +
    `3. **Perlindungan Tanaman Berbasis Rotasi**: Selalu rotasi minimal 2 golongan bahan aktif berbeda serta padukan dengan agensia hayati (**Trichoderma & PGPR**).\n\n` +
    `**Biar jawaban saya langsung tepat ke sasaran, bagian mana yang sedang Bosku butuhkan untuk tanaman ini?**\n` +
    `• Persiapan benih, pengolahan lahan & jarak tanam?\n` +
    `• Jadwal dan takaran pupuk per hektare / per tangki 16L?\n` +
    `• Atau sedang ada gejala hama/penyakit tertentu di lahan?`
  );
}

export function isStrictAgriculturalTopic(message: string): { allowed: boolean; category: string } {
  const res = classifyAgriChatTopic(message);
  return {
    allowed: res.isAgricultural,
    category: res.detectedCategory,
  };
}


