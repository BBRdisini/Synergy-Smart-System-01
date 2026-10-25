import {
  AiPredictiveAlert,
  CommodityType,
  CropProfile,
  CultivationPhaseItem,
  CultivationTaskEntity,
  DiagnosisResult,
  GrowingSeasonEntity,
  OfficialDiseaseId,
  PhaseStatus,
  RiceLifecycleStage,
  ScheduledTask,
  SeasonActivityLog,
  SeasonExpenseRecord,
  SeasonHarvestRecord,
  WeatherSnapshot,
} from '../types/agronomy';
import {
  buildDiagnosisFromMatchedDiseaseId,
  normalizeOfficialDiseaseId,
} from '../data/agronomyDatabase';

/**
 * Menghitung Hari Setelah Tanam (HST) dari tanggal tanam terhadap tanggal referensi.
 */
export function calculateDaysAfterPlanting(plantingDateIso: string, referenceDateIso?: string): number {
  const plantTime = new Date(plantingDateIso).getTime();
  const refTime = referenceDateIso ? new Date(referenceDateIso).getTime() : Date.now();
  if (Number.isNaN(plantTime) || Number.isNaN(refTime)) {
    return 0;
  }
  const diffDays = Math.floor((refTime - plantTime) / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Menentukan durasi siklus pasca-tanam (HST) spesifik berdasarkan varietas padi dan sistem tanam.
 * Tidak menggunakan satu angka universal untuk seluruh varietas.
 */
export function getVarietyMaturityProfile(variety: string, system: string): {
  nurseryDays: number;
  postPlantingDays: number;
  maturityDaysAfterPlanting: number;
  recommendedSeedKgPerHa: number;
  seedRateKgPerHa: number;
  ureaRecommendationKgPerHa: number;
  ureaKgPerHa: number;
  npkRecommendationKgPerHa: number;
  sourceReference: string;
} {
  const lower = variety.toLowerCase();
  const isTabela = system.toLowerCase().includes('tabela');
  const isSri = system.toLowerCase().includes('sri');

  let postPlantingDays = 95;
  if (lower.includes('inpari 42')) postPlantingDays = 88;
  else if (lower.includes('inpari 32')) postPlantingDays = 92;
  else if (lower.includes('ir64') || lower.includes('ir 64')) postPlantingDays = 85;
  else if (lower.includes('situ bagendit')) postPlantingDays = 90;

  const nurseryDays = isTabela ? 0 : isSri ? 12 : 18;
  const recommendedSeedKgPerHa = isTabela ? 45 : isSri ? 10 : 25;
  const ureaRecommendationKgPerHa = lower.includes('inpari 42') ? 175 : 200;
  const npkRecommendationKgPerHa = 300;

  return {
    nurseryDays,
    postPlantingDays,
    maturityDaysAfterPlanting: postPlantingDays,
    recommendedSeedKgPerHa,
    seedRateKgPerHa: recommendedSeedKgPerHa,
    ureaRecommendationKgPerHa,
    ureaKgPerHa: ureaRecommendationKgPerHa,
    npkRecommendationKgPerHa,
    sourceReference: `Deskripsi Varietas BB Padi Kementan RI (${variety} — Sistem ${system})`,
  };
}

/**
 * Menentukan fase pertumbuhan padi dari 8 Fase Budidaya berdasarkan HST.
 */
export function determineRiceGrowthPhase(hst: number): {
  phaseNumber: number;
  phaseName: string;
  shortLabel: string;
  estimatedTotalDays: number;
} {
  if (hst < -15) {
    return {
      phaseNumber: 1,
      phaseName: 'Fase 1 — Persiapan Lahan',
      shortLabel: 'Persiapan Lahan',
      estimatedTotalDays: 95,
    };
  }
  if (hst < 0) {
    return {
      phaseNumber: 2,
      phaseName: 'Fase 2 — Benih dan Persemaian',
      shortLabel: `Persemaian (${Math.abs(hst)} HSS)`,
      estimatedTotalDays: 95,
    };
  }
  if (hst <= 7) {
    return {
      phaseNumber: 3,
      phaseName: 'Fase 3 — Penanaman & Pemulihan Bibit',
      shortLabel: `Tanam (${hst} HST)`,
      estimatedTotalDays: 95,
    };
  }
  if (hst <= 35) {
    return {
      phaseNumber: 4,
      phaseName: 'Fase 4 — Vegetatif Aktif & Pemupukan',
      shortLabel: `Vegetatif (${hst} HST)`,
      estimatedTotalDays: 95,
    };
  }
  if (hst <= 45) {
    return {
      phaseNumber: 5,
      phaseName: 'Fase 5 — Pengairan & Pemeliharaan Anakan Maksimum',
      shortLabel: `Anakan Maksimum (${hst} HST)`,
      estimatedTotalDays: 95,
    };
  }
  if (hst <= 55) {
    return {
      phaseNumber: 6,
      phaseName: 'Fase 6 — Primordia & Pengendalian Hama Terpadu',
      shortLabel: `Primordia / Bunting (${hst} HST)`,
      estimatedTotalDays: 95,
    };
  }
  if (hst <= 80) {
    return {
      phaseNumber: 7,
      phaseName: 'Fase 7 — Pembungaan dan Pengisian Gabah',
      shortLabel: `Pembungaan & Pengisian (${hst} HST)`,
      estimatedTotalDays: 95,
    };
  }
  return {
    phaseNumber: 8,
    phaseName: 'Fase 8 — Panen dan Pascapanen',
    shortLabel: `Matang Panen (${hst} HST)`,
    estimatedTotalDays: 95,
  };
}

/**
 * Menambahkan sejumlah hari ke tanggal ISO (YYYY-MM-DD).
 */
export function addDaysToIsoDate(baseIsoDate: string, daysOffset: number): string {
  const d = new Date(baseIsoDate);
  if (Number.isNaN(d.getTime())) {
    return baseIsoDate;
  }
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

/**
 * Format tanggal ISO ke format ramah petani Indonesia (contoh: 12 Apr 2025).
 */
export function formatIndonesianDate(isoDate?: string): string {
  if (!isoDate || typeof isoDate !== 'string') return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) {
    return isoDate;
  }
  return `${day} ${months[monthIdx]} ${year}`;
}

/**
 * TAHAP 1 SECTION D & E:
 * Mesin Siklus Budidaya Padi 14 Tahap + Generator Kalender Kegiatan dengan ID Tetap.
 * Catatan penting: Tidak menjadwalkan penyemprotan kimia otomatis tanpa dasar pemantauan agronomi.
 */
export function generate14StageRiceLifecycle(params: {
  seasonId: string;
  ownerId: string;
  farmId: string;
  farmName?: string;
  variety: string;
  plantedAreaHa: number;
  seedingDate?: string;
  plantingDate: string;
  cultivationSystem: GrowingSeasonEntity['cultivationSystem'];
  currentConfirmedStageIndex?: number;
  currentHst?: number;
}): {
  stages: RiceLifecycleStage[];
  tasks: CultivationTaskEntity[];
  estimatedHarvestDate: string;
  harvestWindowEnd: string;
  currentStageOrder: number;
  currentStageName: string;
} {
  const {
    seasonId,
    ownerId,
    farmId,
    farmName = 'Lahan Sawah',
    variety,
    plantedAreaHa,
    plantingDate,
    cultivationSystem,
    currentConfirmedStageIndex = 6,
  } = params;

  const profile = getVarietyMaturityProfile(variety, cultivationSystem);
  const isTabela = cultivationSystem.includes('Tabela');
  const seedKg = Math.round(plantedAreaHa * profile.recommendedSeedKgPerHa);
  const ureaTotalKg = Math.round(plantedAreaHa * profile.ureaRecommendationKgPerHa);
  const npkTotalKg = Math.round(plantedAreaHa * profile.npkRecommendationKgPerHa);

  const stageDefinitions: {
    stageNumber: number;
    name: string;
    description: string;
    dayStart: number;
    dayEnd: number;
    activityType: CultivationTaskEntity['activityType'];
    taskTitle: string;
    priority: CultivationTaskEntity['priority'];
    actions: string[];
    notes: string;
  }[] = [
    {
      stageNumber: 1,
      name: '1. Persiapan Lahan',
      description: 'Sanitasi tunggul jerami, pembajakan tanah I & II, perataan lumpur, dan perbaikan pematang/saluran air.',
      dayStart: -21,
      dayEnd: -15,
      activityType: 'Persiapan Lahan',
      taskTitle: 'Pengolahan Tanah (Bajak & Garu) serta Perbaikan Saluran Irigasi',
      priority: 'Tinggi',
      actions: ['Bajak tanah kedalaman 15–20 cm', 'Benamkan bahan organik/kompos matang ±2 ton/Ha', 'Ratakan lumpur petakan sawah'],
      notes: `Estimasi waktu persiapan untuk luas ${plantedAreaHa} Ha.`,
    },
    {
      stageNumber: 2,
      name: '2. Persiapan Benih',
      description: 'Seleksi benih bernas dengan larutan air garam, pencucian, perendaman 24 jam, dan pemeraman 48 jam.',
      dayStart: -19,
      dayEnd: -17,
      activityType: 'Persiapan Benih',
      taskTitle: `Seleksi & Perendaman Benih Padi ${variety} (±${seedKg} kg)`,
      priority: 'Tinggi',
      actions: [`Siapkan ±${seedKg} kg benih berlabel resmi`, 'Seleksi benih hampa dan rendam 24 jam'],
      notes: `Kebutuhan benih dihitung memakai parameter sistem ${cultivationSystem} (${profile.recommendedSeedKgPerHa} kg/Ha).`,
    },
    {
      stageNumber: 3,
      name: '3. Persemaian',
      description: isTabela
        ? 'Sistem Tabela: Benih berkecambah disebar langsung di petakan sawah macak-macak tanpa bedengan semai terpisah.'
        : `Penaburan benih pada bedengan persemaian (4% luas tanam) selama ±${profile.nurseryDays} hari.`,
      dayStart: isTabela ? -2 : -profile.nurseryDays,
      dayEnd: -1,
      activityType: 'Persemaian',
      taskTitle: isTabela
        ? 'Persiapan Alur Sebar Benih Langsung (Tabela)'
        : `Penaburan & Pemeliharaan Bibit Persemaian (${profile.nurseryDays} HSS)`,
      priority: 'Tinggi',
      actions: ['Jaga kelembapan media semai', 'Pantau bibit dari kelompok telur penggerek batang'],
      notes: 'Jangan mencabut bibit terlalu tua agar anakan produktif maksimal.',
    },
    {
      stageNumber: 4,
      name: '4. Penanaman atau Pindah Tanam',
      description: `Penanaman bibit pada kondisi lahan macak-macak menggunakan sistem ${cultivationSystem}.`,
      dayStart: 0,
      dayEnd: 1,
      activityType: 'Penanaman',
      taskTitle: `Pindah Tanam Padi ${variety} (${cultivationSystem})`,
      priority: 'Tinggi',
      actions: ['Tanam 2–3 batang bibit muda per rumpun', 'Jangan memotong ujung daun bibit untuk mencegah infeksi bakteri Kresek'],
      notes: 'Tanggal 0 HST menjadi titik acuan kalender musim tanam.',
    },
    {
      stageNumber: 5,
      name: '5. Adaptasi Awal Tanaman',
      description: 'Fase pemulihan perakaran bibit (ngelilir) dan penyulaman rumpun yang mati atau kosong.',
      dayStart: 2,
      dayEnd: 7,
      activityType: 'Adaptasi Awal',
      taskTitle: 'Pemeriksaan Adaptasi Bibit & Penyulaman Rumpun Kosong (5–7 HST)',
      priority: 'Sedang',
      actions: ['Pertahankan air macak-macak 1–2 cm', 'Sulam rumpun kosong dengan bibit cadangan umur sama'],
      notes: 'Penyulaman wajib selesai sebelum pemupukan pertama.',
    },
    {
      stageNumber: 6,
      name: '6. Pertumbuhan Vegetatif',
      description: 'Pembentukan anakan aktif dan peningkatan jumlah daun.',
      dayStart: 8,
      dayEnd: 35,
      activityType: 'Pemantauan Hama & Penyakit',
      taskTitle: 'Pengamatan Pertumbuhan Anakan & Pembacaan Bagan Warna Daun (BWD)',
      priority: 'Normal',
      actions: ['Hitung jumlah anakan per rumpun', 'Ukur tingkat kehijauan daun dengan BWD setiap 7–10 hari'],
      notes: 'Fase vegetatif menentukan jumlah malai produktif per rumpun.',
    },
    {
      stageNumber: 7,
      name: '7. Pemupukan Sesuai Rekomendasi',
      description: 'Aplikasi pupuk berimbang bertahap (7–10 HST, 20–25 HST, dan 35–40 HST) disesuaikan kondisi tanah dan BWD.',
      dayStart: 7,
      dayEnd: 40,
      activityType: 'Pemupukan',
      taskTitle: `Pemupukan Berimbang Bertahap (Estimasi Total Urea ±${ureaTotalKg} kg & NPK ±${npkTotalKg} kg)`,
      priority: 'Tinggi',
      actions: [
        `Tahap I (7–10 HST): Urea ±${Math.round(ureaTotalKg * 0.35)} kg + NPK ±${Math.round(npkTotalKg * 0.5)} kg`,
        `Tahap II (20–25 HST): Urea ±${Math.round(ureaTotalKg * 0.65)} kg disesuaikan skor BWD`,
        `Tahap III (35–40 HST): NPK ±${Math.round(npkTotalKg * 0.5)} kg menjelang primordia`,
      ],
      notes: 'Estimasi awal; sesuaikan dengan Perangkat Uji Tanah Sawah (PUTS) setempat.',
    },
    {
      stageNumber: 8,
      name: '8. Pengairan dan Pemeliharaan',
      description: 'Pengairan berselang (Alternate Wetting & Drying / AWD) dan penyiangan gulma mekanis.',
      dayStart: 12,
      dayEnd: 50,
      activityType: 'Pengairan',
      taskTitle: 'Pengaturan Pengairan Berselang (AWD) & Penyiangan Gulma',
      priority: 'Sedang',
      actions: ['Siangi gulma sebelum pemupukan susulan', 'Airi 3–5 cm lalu biarkan surut alami hingga tanah macak-macak'],
      notes: 'Pengairan berselang memperkuat batang dan menekan perkembangan wereng.',
    },
    {
      stageNumber: 9,
      name: '9. Pemantauan Gulma, Hama, dan Penyakit',
      description: 'Pengamatan agroekosistem mingguan secara diagonal. Penyemprotan TIDAK dijadwalkan otomatis tanpa temuan ambang ekonomi.',
      dayStart: 15,
      dayEnd: 65,
      activityType: 'Pemantauan Hama & Penyakit',
      taskTitle: 'Inspeksi Rutin Agroekosistem (Blas, Wereng, Penggerek & Musuh Alami)',
      priority: 'Tinggi',
      actions: [
        'Amati 20 rumpun diagonal terhadap bercak daun Blas dan populasi wereng pangkal batang',
        'Catat keberadaan predator alami (laba-laba, kepik mirid)',
        'Hanya lakukan pengendalian tervalidasi bila populasi melampaui ambang ekonomi',
      ],
      notes: 'Sesuai prinsip PHT: Jangan melakukan penyemprotan kimia terjadwal tanpa dasar pemantauan.',
    },
    {
      stageNumber: 10,
      name: '10. Pembungaan',
      description: 'Fase keluar malai (heading) dan penyerbukan bunga padi (anthesis).',
      dayStart: profile.postPlantingDays - 35,
      dayEnd: profile.postPlantingDays - 25,
      activityType: 'Pembungaan & Pengisian',
      taskTitle: 'Pemantauan Keserempakan Keluar Malai & Kecukupan Air Pembungaan',
      priority: 'Tinggi',
      actions: ['Jaga genangan air tipis 3–5 cm agar bunga tidak hampa karena cekaman kekeringan', 'Pantau hama walang sangit pada pagi/sore hari'],
      notes: 'Hindari penyemprotan pada pukul 08:00–11:00 saat bunga padi sedang mekar menyerbuk.',
    },
    {
      stageNumber: 11,
      name: '11. Pengisian Gabah',
      description: 'Fase masak susu hingga masak tepung pada bulir gabah.',
      dayStart: profile.postPlantingDays - 24,
      dayEnd: profile.postPlantingDays - 12,
      activityType: 'Pembungaan & Pengisian',
      taskTitle: 'Pemeriksaan Pengisian Bulir Gabah & Kesehatan Leher Malai',
      priority: 'Sedang',
      actions: ['Periksa persentase gabah bernas', 'Awasi gejala busuk leher malai (neck blast)'],
      notes: 'Pastikan daun bendera tetap sehat dan hijau.',
    },
    {
      stageNumber: 12,
      name: '12. Pematangan',
      description: 'Fase masak kuning dan pengeringan lahan bertahap menjelang panen.',
      dayStart: profile.postPlantingDays - 11,
      dayEnd: profile.postPlantingDays - 1,
      activityType: 'Pengairan',
      taskTitle: 'Pengeringan Petakan Sawah (10–14 Hari Sebelum Panen)',
      priority: 'Tinggi',
      actions: ['Buka saluran pembuangan air agar tanah mengeras', 'Amati kematangan bulir hingga 90–95% gabah menguning keras'],
      notes: 'Pengeringan lahan mempercepat pematangan serempak dan memudahkan panen.',
    },
    {
      stageNumber: 13,
      name: '13. Panen',
      description: 'Pemanenan tepat waktu saat 90–95% bulir malai menguning bernas dan perontokan segera.',
      dayStart: profile.postPlantingDays,
      dayEnd: profile.postPlantingDays + 3,
      activityType: 'Panen',
      taskTitle: `Pelaksanaan Panen Padi ${variety} & Pencatatan Hasil GKP`,
      priority: 'Tinggi',
      actions: ['Potong padi dan gunakan alas terpal untuk menekan susut tercecer', 'Rontokkan gabah maksimal 24 jam setelah potong'],
      notes: `Estimasi tanggal panen varietas ${variety}: ±${profile.postPlantingDays} HST.`,
    },
    {
      stageNumber: 14,
      name: '14. Pascapanen dan Evaluasi',
      description: 'Pengeringan GKP menjadi GKG (kadar air ≤14%), penyimpanan, dan evaluasi laba/rugi musim tanam.',
      dayStart: profile.postPlantingDays + 4,
      dayEnd: profile.postPlantingDays + 10,
      activityType: 'Pascapanen',
      taskTitle: 'Penjemuran Gabah (Kadar Air ≤14%) & Evaluasi Laba/Rugi Musim Tanam',
      priority: 'Sedang',
      actions: ['Ukur kadar air gabah', 'Rekap seluruh biaya aktual, pendapatan panen, dan laba bersih musim tanam'],
      notes: 'Selesaikan evaluasi sebelum menutup musim tanam.',
    },
  ];

  const stages: any[] = stageDefinitions.map((def) => {
    const startIso = addDaysToIsoDate(plantingDate, def.dayStart);
    const endIso = addDaysToIsoDate(plantingDate, def.dayEnd);
    let status: any = 'Terjadwal';
    if (def.stageNumber < currentConfirmedStageIndex) status = 'Selesai';
    else if (def.stageNumber === currentConfirmedStageIndex) status = 'Sedang Berjalan';

    return {
      stageNumber: def.stageNumber,
      order: def.stageNumber,
      id: `${seasonId}-stage-${def.stageNumber}`,
      name: def.name,
      description: def.description,
      objective: def.description,
      recommendedActions: def.actions,
      successIndicators: def.actions,
      commonRisks: [def.notes],
      estimatedDayStart: def.dayStart,
      estimatedDayEnd: def.dayEnd,
      hstStart: def.dayStart,
      hstEnd: def.dayEnd,
      estimatedDateStart: startIso,
      estimatedDateEnd: endIso,
      estimatedStartDate: startIso,
      estimatedEndDate: endIso,
      status,
      notes: def.notes,
      recommendationSource: profile.sourceReference,
    };
  });

  const tasks: any[] = stageDefinitions.map((def) => {
    const scheduledIso = addDaysToIsoDate(plantingDate, def.dayStart);
    const isCompleted = def.stageNumber < currentConfirmedStageIndex;
    return {
      id: `${seasonId}-task-stage-${def.stageNumber}`,
      ownerId,
      seasonId,
      farmId,
      farmName: farmName || 'Lahan Sawah',
      stageNumber: def.stageNumber,
      stageOrder: def.stageNumber,
      activityType: def.activityType,
      title: def.taskTitle,
      scheduledDate: scheduledIso,
      status: isCompleted ? 'Selesai' : 'Terjadwal',
      priority: def.priority,
      notes: def.notes,
      completedDate: isCompleted ? scheduledIso : undefined,
      recommendationSource: profile.sourceReference,
    };
  });

  const estimatedHarvestDate = addDaysToIsoDate(plantingDate, profile.postPlantingDays);
  const harvestWindowEnd = addDaysToIsoDate(estimatedHarvestDate, 5);
  const activeStage = stages.find((s) => s.order === currentConfirmedStageIndex) || stages[0];

  return {
    stages,
    tasks,
    estimatedHarvestDate,
    harvestWindowEnd,
    currentStageOrder: activeStage.order,
    currentStageName: activeStage.name,
  };
}

/**
 * TAHAP 1 SECTION E:
 * Menghitung ulang kalender ketika tanggal tanam berubah.
 * Aturan wajib: Kegiatan yang sudah 'Selesai' TIDAK BOLEH diubah tanggal historisnya;
 * hanya kegiatan yang masih 'Terjadwal' / 'Dijadwalkan Ulang' / 'Terlambat' yang digeser sesuai selisih hari.
 */
export function recalculateSeasonScheduleOnPlantingDateChange(params: {
  season?: GrowingSeasonEntity;
  tasks?: CultivationTaskEntity[];
  oldPlantingDate?: string;
  newPlantingDate: string;
  variety?: string;
  cultivationSystem?: string;
  existingTasks?: CultivationTaskEntity[];
}): {
  dayDelta: number;
  updatedSeason?: GrowingSeasonEntity;
  updatedTasks: CultivationTaskEntity[];
  preservedCompletedCount: number;
  shiftedPlannedCount: number;
  summaryText: string;
  newEstimatedHarvestDate: string;
  newHarvestWindowEnd: string;
} {
  const { season, newPlantingDate } = params;
  const sourceTasks = params.tasks || params.existingTasks || [];
  const baseOldDate = season?.plantingDate || params.oldPlantingDate || newPlantingDate;
  const oldTime = new Date(baseOldDate).getTime();
  const newTime = new Date(newPlantingDate).getTime();
  const dayDelta = Math.round((newTime - oldTime) / (1000 * 60 * 60 * 24));

  let preservedCompletedCount = 0;
  let shiftedPlannedCount = 0;

  const updatedTasks = sourceTasks.map((task) => {
    if (season && task.seasonId !== season.id) return task;
    if (task.status === 'Selesai') {
      preservedCompletedCount += 1;
      return task; // Jangan ubah catatan historis yang sudah selesai
    }
    shiftedPlannedCount += 1;
    return {
      ...task,
      scheduledDate: addDaysToIsoDate(task.scheduledDate, dayDelta),
      status: 'Dijadwalkan Ulang' as const,
    };
  });

  const varietyProfile = getVarietyMaturityProfile(
    season?.variety || params.variety || 'Ciherang',
    season?.cultivationSystem || params.cultivationSystem || 'Jajar Legowo 2:1'
  );
  const newEstimatedHarvestDate = season
    ? addDaysToIsoDate(season.estimatedHarvestDate, dayDelta)
    : addDaysToIsoDate(newPlantingDate, varietyProfile.postPlantingDays);
  const newHarvestWindowEnd = addDaysToIsoDate(newEstimatedHarvestDate, 5);

  let updatedSeason: GrowingSeasonEntity | undefined;
  if (season) {
    const updatedStages = season.stages.map((st: any) => {
      if (st.status === 'Selesai') return st;
      const nextStart = addDaysToIsoDate(
        st.estimatedDateStart || st.estimatedStartDate || baseOldDate,
        dayDelta
      );
      const nextEnd = addDaysToIsoDate(
        st.estimatedDateEnd || st.estimatedEndDate || baseOldDate,
        dayDelta
      );
      return {
        ...st,
        estimatedDateStart: nextStart,
        estimatedDateEnd: nextEnd,
        estimatedStartDate: nextStart,
        estimatedEndDate: nextEnd,
      };
    });

    updatedSeason = {
      ...season,
      plantingDate: newPlantingDate,
      estimatedHarvestDate: newEstimatedHarvestDate,
      stages: updatedStages,
      updatedAt: new Date().toISOString(),
    };
  }

  const direction = dayDelta >= 0 ? `mundur +${dayDelta} hari` : `maju ${dayDelta} hari`;
  const summaryText = `Perubahan tanggal tanam dari ${baseOldDate} ke ${newPlantingDate} (${direction}): ${shiftedPlannedCount} kegiatan terjadwal digeser otomatis, sementara ${preservedCompletedCount} kegiatan yang telah selesai tetap dipertahankan pada tanggal pelaksanaan aslinya.`;

  return {
    dayDelta,
    updatedSeason,
    updatedTasks,
    preservedCompletedCount,
    shiftedPlannedCount,
    summaryText,
    newEstimatedHarvestDate,
    newHarvestWindowEnd,
  };
}

/**
 * TAHAP 1 SECTION G:
 * Kalkulator Biaya, Pendapatan, dan Laba Bersih Musim Tanam Aktual dengan Deduplikasi Transaksi.
 */
export function calculateSeasonFinancialSummary(params: {
  plantedAreaHa: number;
  expenses: SeasonExpenseRecord[];
  activities: SeasonActivityLog[];
  harvests: SeasonHarvestRecord[];
}): {
  totalExpenseRecordsRp: number;
  unlinkedActivityCostRp: number;
  totalActivityCostRp: number;
  totalStandaloneExpenseRp: number;
  totalHarvestCostRp: number;
  totalSeasonCostRp: number;
  costPerHectareRp: number;
  costPerHaRp: number;
  totalHarvestYieldKg: number;
  totalHarvestKg: number;
  totalHarvestedAreaHa: number;
  totalGrossRevenueRp: number;
  grossRevenueRp: number;
  netProfitRp: number;
  yieldTonPerHa: number;
  isProfitable: boolean;
} {
  const { plantedAreaHa, expenses, activities, harvests } = params;

  const linkedActivityIds = new Set(
    expenses.map((e) => e.linkedActivityId).filter(Boolean) as string[]
  );

  const totalExpenseRecordsRp = expenses.reduce((sum, e) => {
    const rowTotal = Math.round(e.quantity * e.unitPriceRp);
    return sum + (e.totalRp > 0 ? e.totalRp : rowTotal);
  }, 0);

  const unlinkedActivityCostRp = activities.reduce((sum, act) => {
    if (linkedActivityIds.has(act.id)) return sum;
    return sum + (act.actualCostRp || 0);
  }, 0);

  const totalHarvestCostRp = harvests.reduce((sum, h) => sum + (h.harvestCostRp || 0), 0);
  const totalSeasonCostRp = totalExpenseRecordsRp + unlinkedActivityCostRp + totalHarvestCostRp;

  const costPerHectareRp =
    Number.isFinite(plantedAreaHa) && plantedAreaHa > 0
      ? Math.round(totalSeasonCostRp / plantedAreaHa)
      : 0;

  const totalHarvestYieldKg = harvests.reduce((sum, h) => sum + h.actualYieldKg, 0);
  const totalHarvestedAreaHa = Number(
    harvests.reduce((sum, h) => sum + h.harvestedAreaHa, 0).toFixed(2)
  );

  const totalGrossRevenueRp = harvests.reduce((sum, h) => {
    const calculatedRev = Math.round(h.actualYieldKg * h.sellingPricePerKgRp);
    return sum + (h.grossRevenueRp > 0 ? h.grossRevenueRp : calculatedRev);
  }, 0);

  const netProfitRp = totalGrossRevenueRp - totalSeasonCostRp;
  const yieldTonPerHa =
    Number.isFinite(plantedAreaHa) && plantedAreaHa > 0
      ? Number((totalHarvestYieldKg / 1000 / plantedAreaHa).toFixed(2))
      : 0;

  return {
    totalExpenseRecordsRp,
    unlinkedActivityCostRp,
    totalActivityCostRp: unlinkedActivityCostRp,
    totalStandaloneExpenseRp: totalExpenseRecordsRp,
    totalHarvestCostRp,
    totalSeasonCostRp,
    costPerHectareRp,
    costPerHaRp: costPerHectareRp,
    totalHarvestYieldKg,
    totalHarvestKg: totalHarvestYieldKg,
    totalHarvestedAreaHa,
    totalGrossRevenueRp,
    grossRevenueRp: totalGrossRevenueRp,
    netProfitRp,
    yieldTonPerHa,
    isProfitable: netProfitRp >= 0,
  };
}

/**
 * Isolasi Data Berdasarkan Pemilik (Owner Isolation - Tahap 1 Section B)
 */
export function filterEntitiesByOwner<T extends { ownerId?: string }>(
  items: T[],
  currentOwnerId: string
): T[] {
  if (!currentOwnerId) return [];
  return items.filter((item) => !item.ownerId || item.ownerId === currentOwnerId);
}

/**
 * Menghasilkan ringkasan rekomendasi cerdas otomatis berdasarkan diagnosis Kamera AI terbaru
 * yang dikorelasikan dengan telemetri cuaca dan kelembapan tanah saat ini.
 */
export function buildIntelligentDiagnosisRecommendationSummary(params: {
  diagnosis: DiagnosisResult;
  weatherTempC?: number;
  weatherHumidityPct?: number;
  soilMoisturePct?: number;
  plotName?: string;
}): string {
  const { diagnosis } = params;
  const tempC = params.weatherTempC ?? 28;
  const humidityPct = params.weatherHumidityPct ?? 86;
  const soilMoisturePct = params.soilMoisturePct ?? 62;
  const targetLabel =
    params.plotName || `${diagnosis.commodity} (${diagnosis.plantPart}) — Lahan 1`;
  const primaryAction =
    diagnosis.nonChemicalIpmActions?.[0] ||
    'Terapkan sanitasi dan Pengendalian Hama Terpadu (PHT) sesuai pedoman Kementan RI.';
  return `Rekomendasi Cerdas Prioritas (${targetLabel}): Terdeteksi ${diagnosis.detectedName} (${diagnosis.scientificName}, keyakinan ${diagnosis.confidencePct}%) pada mikroklimat ${tempC}°C & kelembapan ${humidityPct}% (tanah ${soilMoisturePct}%). Tindakan utama: ${primaryAction}`;
}

/**
 * Mesin Peringatan Dini AI (Dashboard AI Predictive Alerts)
 * Menganalisis hasil diagnosis Kamera AI terbaru sebagai peringatan prioritas utama,
 * serta korelasi profil tanaman, toleransi suhu, kebutuhan air, cuaca & tanah.
 */
export function generatePredictiveAiAlerts(params: {
  cropProfiles?: CropProfile[];
  profiles?: CropProfile[];
  weather?: WeatherSnapshot;
  weatherTempC?: number;
  weatherHumidityPct?: number;
  rainfallMm?: number;
  windSpeedKmh?: number;
  soilPh?: number;
  soilMoisturePct?: number;
  soilTempC?: number;
  latestDiagnosis?: DiagnosisResult | null;
  diagnosisPlotName?: string;
}): AiPredictiveAlert[] {
  const safeProfiles = params.cropProfiles || params.profiles || [];
  const humidityPct = params.weather?.humidityPct ?? params.weatherHumidityPct ?? 86;
  const tempC = params.weather?.tempC ?? params.weatherTempC ?? 28;
  const rainfallMm = params.weather?.rainfallMm ?? params.rainfallMm ?? 2;
  const soilPh = params.soilPh ?? 6.5;
  const soilMoisturePct = params.soilMoisturePct ?? 62;
  const alerts: AiPredictiveAlert[] = [];

  // 0. Peringatan Prioritas Utama dari Diagnosis Kamera AI Terbaru
  if (params.latestDiagnosis) {
    const diag = params.latestDiagnosis;
    const matchedProfile = safeProfiles.find(
      (p) => (p as any).plotId === diag.plotId || p.linkedFarmId === diag.plotId
    );
    const targetCropLabel =
      params.diagnosisPlotName ||
      matchedProfile?.namaTanaman ||
      `${diag.commodity} (${diag.plantPart}) — ${safeProfiles[0]?.namaTanaman || 'Lahan 1'}`;

    const isPest = diag.causeCategory === 'Serangan Hama';
    const isNutrient = diag.causeCategory === 'Defisiensi Nutrisi';
    const category: AiPredictiveAlert['category'] = isPest
      ? 'Potensi Hama'
      : isNutrient
      ? 'Stres Suhu & Nutrisi'
      : 'Risiko Penyakit';
    const riskCategory: AiPredictiveAlert['riskCategory'] = isPest
      ? 'Serangan Hama'
      : isNutrient
      ? 'Defisiensi Nutrisi'
      : 'Penyakit Tanaman';

    const severity: AiPredictiveAlert['severity'] =
      diag.urgencyLevel === 'Rendah' ? 'Sedang' : 'Tinggi';

    const triggerSummary = `Hasil pindaian Kamera AI mendeteksi ${diag.detectedName} (${diag.scientificName}) pada ${diag.plantPart.toLowerCase()} ${diag.commodity.toLowerCase()} dengan tingkat keyakinan ${diag.confidencePct}%. Kondisi mikroklimat lahan saat ini (kelembapan udara ${humidityPct}%, suhu ${tempC}°C, kelembapan tanah ${soilMoisturePct}%, pH ${soilPh}) berkorelasi langsung terhadap perkembangan gejala sehingga memerlukan tindakan PHT prioritas.`;

    const steps: string[] = [
      ...(diag.nonChemicalIpmActions || []).slice(0, 3),
    ];
    if (diag.followUpFieldChecks && diag.followUpFieldChecks[0]) {
      steps.push(`Verifikasi Lapangan: ${diag.followUpFieldChecks[0]}`);
    }

    alerts.push({
      id: `alert-priority-diag-${diag.id || 'latest'}`,
      severity,
      category,
      riskCategory,
      confidencePct: diag.confidencePct,
      title: `Prioritas Diagnosis AI: ${diag.detectedName}`,
      targetName: targetCropLabel,
      cropName: targetCropLabel,
      plotId: diag.plotId || (safeProfiles[0] as any)?.plotId || 'lahan-1',
      predictionSummary: triggerSummary,
      predictedTrigger: triggerSummary,
      triggerFactors: [
        ...(diag.visibleSymptoms || []).slice(0, 2),
        `Korelasi mikroklimat: kelembapan ${humidityPct}%, suhu ${tempC}°C, tanah ${soilMoisturePct}%`,
      ],
      actionableSteps:
        steps.length > 0
          ? steps
          : ['Terapkan sanitasi dan Pengendalian Hama Terpadu (PHT) sesuai pedoman Kementan RI.'],
      recommendedTaskTitle: `Tindak Lanjut Prioritas Diagnosis: ${diag.detectedName}`,
      sourceBasis: `${diag.sourceReferences?.[0] || 'Pedoman PHT Kementan RI'} • Kamera AI (${diag.confidencePct}%)`,
      createdAt: 'Baru saja dari Kamera AI',
      isPriorityDiagnosis: true,
      diagnosisId: diag.id,
      scientificName: diag.scientificName,
      urgencyLevel: diag.urgencyLevel,
    });
  }

  // 1. Analisis Kelembapan Udara & Risiko Penyakit Jamur Blas
  if (humidityPct >= 65) {
    const summary = `Kelembapan udara saat ini (${humidityPct}%) disertai suhu ${tempC}°C meningkatkan potensi pembentukan spora jamur Blas pada daun fase vegetatif.`;
    alerts.push({
      id: 'alert-blast-risk',
      severity: humidityPct >= 75 ? 'Tinggi' : 'Sedang',
      category: 'Risiko Penyakit',
      riskCategory: 'Penyakit Tanaman',
      confidencePct: 92,
      title: 'Prediksi Risiko Infeksi Jamur Blas (Pyricularia oryzae)',
      targetName: safeProfiles[0]?.namaTanaman || 'Padi Ciherang — Lahan 1',
      cropName: safeProfiles[0]?.namaTanaman || 'Padi Ciherang — Lahan 1',
      plotId: (safeProfiles[0] as any)?.plotId || 'lahan-1',
      predictionSummary: summary,
      predictedTrigger: summary,
      triggerFactors: [
        `Kelembapan udara ${humidityPct}% (ambang waspada ≥70%)`,
        `Tanaman berada pada fase pembentukan anakan aktif (jaringan daun muda sukulen)`,
      ],
      actionableSteps: [
        'Lakukan pengamatan diagonal pada 20 rumpun untuk memeriksa bercak belah ketupat.',
        'Jangan memberikan pupuk Urea (Nitrogen) berlebih di luar jadwal BWD.',
        'Pertahankan genangan air tipis 3–5 cm (kondisi tanah kering memicu pelepasan spora blas).',
      ],
      recommendedTaskTitle: 'Inspeksi Dini Gejala Bercak Daun Blas & Pengaturan Air',
      sourceBasis: 'Model Epidemiologi Blas BB Padi & Telemetri Cuaca',
      createdAt: 'Diperbarui otomatis dari sensor & cuaca',
    });
  }

  // 2. Analisis Kebutuhan Air & Kelembapan Tanah
  if (soilMoisturePct < 65 || rainfallMm < 3) {
    const summary = `Curah hujan harian rendah (${rainfallMm} mm) dan kelembapan tanah tercatat ${soilMoisturePct}%. Pastikan tanah tetap macak-macak sebelum jadwal pemupukan susulan.`;
    alerts.push({
      id: 'alert-water-deficit',
      severity: soilMoisturePct < 50 ? 'Tinggi' : 'Sedang',
      category: 'Kekurangan Air',
      riskCategory: 'Kekurangan Air',
      confidencePct: 89,
      title: 'Peringatan Ketersediaan Air & Kelembapan Petakan Sawah',
      targetName: safeProfiles[0]?.namaTanaman || 'Padi Ciherang — Lahan 1',
      cropName: safeProfiles[0]?.namaTanaman || 'Padi Ciherang — Lahan 1',
      plotId: (safeProfiles[0] as any)?.plotId || 'lahan-1',
      predictionSummary: summary,
      predictedTrigger: summary,
      triggerFactors: [
        `Kelembapan tanah ${soilMoisturePct}% & curah hujan ${rainfallMm} mm`,
        `Kebutuhan profil tanaman: ${safeProfiles[0]?.kebutuhanAir || 'Pengairan Berselang AWD 3–5 cm'}`,
      ],
      actionableSteps: [
        'Buka pintu air tersier pada pagi hari hingga tinggi genangan mencapai 3–5 cm.',
        'Tutup pintu pembuangan selama 2–3 hari setelah penaburan pupuk Urea/NPK agar hara tidak hanyut.',
      ],
      recommendedTaskTitle: 'Pengairan Petakan Sawah (Target Genangan 3–5 cm)',
      sourceBasis: 'Standar Pengairan Berselang (AWD) IRRI & BB Padi',
      createdAt: 'Diperbarui otomatis dari kondisi tanah',
    });
  }

  // 3. Analisis Suhu & Potensi Hama Wereng / Penggerek
  const activeProfile: any = safeProfiles[0];
  const maxAllowedTemp = activeProfile?.maxTempC ?? activeProfile?.tempMaxC ?? 33;
  const pestSummary = `Suhu lingkungan ${tempC}°C (toleransi profil: ${activeProfile?.toleransiSuhu || '22°C – 33°C'}) dan kanopi padi yang mulai rapat berpotensi menjadi habitat mikro nimfa wereng di pangkal batang.`;
  alerts.push({
    id: 'alert-pest-stemborer',
    severity: tempC > maxAllowedTemp ? 'Tinggi' : 'Sedang',
    category: 'Potensi Hama',
    riskCategory: 'Serangan Hama',
    confidencePct: 87,
    title: 'Kewaspadaan Koloni Wereng Batang Coklat & Penggerek Batang',
    targetName: activeProfile?.namaTanaman || 'Padi Inpari 32 — Lahan 2',
    cropName: activeProfile?.namaTanaman || 'Padi Inpari 32 — Lahan 2',
    plotId: activeProfile?.plotId || 'lahan-2',
    predictionSummary: pestSummary,
    predictedTrigger: pestSummary,
    triggerFactors: [
      `Suhu harian ${tempC}°C & pH tanah ${soilPh}`,
      `Kanopi rumpun fase vegetatif mendukung kelembapan pangkal batang`,
    ],
    actionableSteps: [
      'Periksa pangkal batang 20 rumpun sampel; ambang ekonomi vegetatif adalah >10 ekor wereng/rumpun.',
      'Lestarikan musuh alami (laba-laba Lycosa & kepik Cyrtorhinus) dengan tidak menyemprot piretroid.',
      'Terapkan pengeringan berselang (AWD) 3 hari untuk menekan penetasan telur wereng.',
    ],
    recommendedTaskTitle: 'Pengamatan Populasi Wereng Pangkal Batang & Musuh Alami',
    sourceBasis: 'Pedoman PHT Wereng Batang Coklat BB Padi Sukamandi',
    createdAt: 'Diperbarui otomatis dari model agronomi',
  });

  return alerts;
}

/**
 * Membangun 8 Fase Rencana Budidaya Padi dan jadwal kegiatan otomatis per lahan.
 */
export function generateCultivationPlanAndTasks(params: {
  plotId: string;
  plotName: string;
  commodity: CommodityType;
  varietyName: string;
  plantingDate: string;
  areaHa: number;
  currentHst: number;
}): {
  phases: CultivationPhaseItem[];
  tasks: ScheduledTask[];
  estimatedHarvestDate: string;
} {
  const { plotId, plotName, commodity, plantingDate, areaHa, currentHst } = params;

  const resolveStatus = (minHst: number, maxHst: number): PhaseStatus => {
    if (currentHst > maxHst) return 'Selesai';
    if (currentHst >= minHst && currentHst <= maxHst) return 'Sedang Berjalan';
    return 'Terjadwal';
  };

  const seedKg = Math.round(areaHa * 25);
  const urea1Kg = Math.round(areaHa * 75);
  const npk1Kg = Math.round(areaHa * 150);
  const urea2Kg = Math.round(areaHa * 100);
  const npk2Kg = Math.round(areaHa * 150);

  const phases: CultivationPhaseItem[] = [
    {
      phaseNumber: 1,
      id: `${plotId}-phase-1`,
      name: 'Fase 1 — Persiapan Lahan',
      hstRange: '-21 s/d -15 HST',
      minHst: -25,
      maxHst: -15,
      status: resolveStatus(-25, -15),
      description: 'Pemeriksaan kondisi lahan, pengolahan tanah sempurna (bajak & garu), perbaikan saluran irigasi, dan aplikasi bahan organik.',
      agronomicNotes: `Rekomendasi kompos/pupuk kandang matang: ± ${Math.round(areaHa * 2000)} kg untuk luas ${areaHa} Ha.`,
      checklist: [
        { id: `${plotId}-c1-1`, label: 'Pemeriksaan riwayat tanaman & sanitasi jerami sisa panen', completed: currentHst > -15 },
        { id: `${plotId}-c1-2`, label: 'Pengolahan tanah pertama (bajak) & perataan lumpur (garu)', completed: currentHst > -15 },
        { id: `${plotId}-c1-3`, label: 'Pemeriksaan pH tanah awal dan saluran pintu air irigasi', completed: currentHst > -15 },
      ],
    },
    {
      phaseNumber: 2,
      id: `${plotId}-phase-2`,
      name: 'Fase 2 — Benih dan Persemaian',
      hstRange: '-18 s/d 0 HST',
      minHst: -18,
      maxHst: -1,
      status: resolveStatus(-18, -1),
      description: 'Seleksi benih bersertifikat menggunakan larutan garam/air, perendaman 24 jam, pemeraman 48 jam, dan semai di bedengan.',
      agronomicNotes: `Kebutuhan benih estimasi (${areaHa} Ha @ 25 kg/Ha): ${seedKg} kg benih berlabel.`,
      checklist: [
        { id: `${plotId}-c2-1`, label: `Siapkan ${seedKg} kg benih bersertifikat & uji bernas`, completed: currentHst >= 0 },
        { id: `${plotId}-c2-2`, label: 'Buat bedengan persemaian (4% dari luas lahan tanam)', completed: currentHst >= 0 },
        { id: `${plotId}-c2-3`, label: 'Pantau kesehatan bibit dari penggerek & wereng di persemaian', completed: currentHst >= 0 },
      ],
    },
    {
      phaseNumber: 3,
      id: `${plotId}-phase-3`,
      name: 'Fase 3 — Penanaman',
      hstRange: '0 s/d 7 HST',
      minHst: 0,
      maxHst: 7,
      status: resolveStatus(0, 7),
      description: 'Pindah tanam bibit muda (15–18 HSS), pengaturan jarak tanam Jajar Legowo, dan penyulaman bibit yang mati maksimal 7 HST.',
      agronomicNotes: 'Tanam 2–3 batang per rumpun pada kondisi tanah macak-macak (tidak tergenang dalam).',
      checklist: [
        { id: `${plotId}-c3-1`, label: 'Pindah tanam bibit dengan sistem jarak tanam terpilih', completed: currentHst > 0 },
        { id: `${plotId}-c3-2`, label: 'Pemeriksaan awal & penyulaman rumpun kosong (5–7 HST)', completed: currentHst > 7 },
      ],
    },
    {
      phaseNumber: 4,
      id: `${plotId}-phase-4`,
      name: 'Fase 4 — Pemupukan Berimbang',
      hstRange: '7 s/d 40 HST',
      minHst: 8,
      maxHst: 35,
      status: resolveStatus(8, 35),
      description: 'Aplikasi pupuk dasar dan susulan berdasarkan fase fisiologis tanaman serta pembacaan Bagan Warna Daun (BWD).',
      agronomicNotes: `Perkiraan awal (${areaHa} Ha): Pupuk I (7-10 HST) Urea ${urea1Kg} kg + NPK ${npk1Kg} kg; Pupuk II (20-25 HST) Urea ${urea2Kg} kg. Sesuaikan kondisi tanah setempat.`,
      checklist: [
        { id: `${plotId}-c4-1`, label: `Pemupukan Dasar / Susulan I (7–10 HST): Urea ±${urea1Kg} kg + NPK ±${npk1Kg} kg`, completed: currentHst > 12 },
        { id: `${plotId}-c4-2`, label: `Pemupukan Susulan II (20–25 HST): Urea ±${urea2Kg} kg (pantau BWD)`, completed: currentHst > 25 },
        { id: `${plotId}-c4-3`, label: `Pemupukan Susulan III / Primordia (35–42 HST): NPK ±${npk2Kg} kg`, completed: currentHst > 42 },
      ],
    },
    {
      phaseNumber: 5,
      id: `${plotId}-phase-5`,
      name: 'Fase 5 — Pengairan dan Pemeliharaan',
      hstRange: '10 s/d 50 HST',
      minHst: 15,
      maxHst: 45,
      status: resolveStatus(15, 45),
      description: 'Pengairan berselang (intermittent irrigation / AWD) untuk merangsang akar dan anakan produktif, serta penyiangan gulma.',
      agronomicNotes: 'Lakukan penyiangan gulma mekanis/landak sebelum pemupukan susulan agar pupuk tidak diserap gulma.',
      checklist: [
        { id: `${plotId}-c5-1`, label: 'Penyiangan gulma tahap I (15–18 HST) sebelum pemupukan ke-2', completed: currentHst > 18 },
        { id: `${plotId}-c5-2`, label: 'Pengaturan pengairan berselang (basah-kering 3–5 cm)', completed: currentHst > 30 },
      ],
    },
    {
      phaseNumber: 6,
      id: `${plotId}-phase-6`,
      name: 'Fase 6 — Hama dan Penyakit (PHT)',
      hstRange: '15 s/d 70 HST',
      minHst: 20,
      maxHst: 65,
      status: resolveStatus(20, 65),
      description: 'Pengamatan agroekosistem mingguan, deteksi dini gejala Blas/Tungro/Wereng/Penggerek dengan Kamera AI, dan pengendalian terpadu.',
      agronomicNotes: 'Gunakan pestisida kimia hanya bila serangan melewati ambang pengendalian dan gunakan produk terdaftar resmi sesuai label.',
      checklist: [
        { id: `${plotId}-c6-1`, label: 'Pengamatan rutin pangkal batang (Wereng) & bercak daun (Blas)', completed: currentHst > 22 },
        { id: `${plotId}-c6-2`, label: 'Dokumentasi gejala menggunakan Kamera AI bila ditemukan anomali', completed: false },
      ],
    },
    {
      phaseNumber: 7,
      id: `${plotId}-phase-7`,
      name: 'Fase 7 — Pembungaan dan Pengisian Gabah',
      hstRange: '55 s/d 85 HST',
      minHst: 55,
      maxHst: 85,
      status: resolveStatus(55, 85),
      description: 'Pemantauan fase bunting, keluar malai serempak, penjagaan kecukupan air saat berbunga, dan pencegahan blas leher malai/walang sangit.',
      agronomicNotes: 'Jaga air macak-macak saat pengisian bulir; keringkan lahan secara bertahap 10–14 hari menjelang panen.',
      checklist: [
        { id: `${plotId}-c7-1`, label: 'Inspeksi keserempakan keluar malai & kesehatan leher malai', completed: currentHst > 68 },
        { id: `${plotId}-c7-2`, label: 'Pengeringan lahan bertahap (10–14 hari sebelum panen) agar matang merata', completed: currentHst > 82 },
      ],
    },
    {
      phaseNumber: 8,
      id: `${plotId}-phase-8`,
      name: 'Fase 8 — Panen dan Pascapanen',
      hstRange: '90 s/d 105 HST',
      minHst: 86,
      maxHst: 110,
      status: resolveStatus(86, 110),
      description: 'Pemeriksaan kematangan bulir (90–95% gabah menguning bernas), pemanenan tepat waktu, perontokan, pengeringan GKP ke GKG (kadar air ≤14%).',
      agronomicNotes: 'Hindari penundaan perontokan lebih dari 24 jam pasca potong untuk menekan susut hasil (losses).',
      checklist: [
        { id: `${plotId}-c8-1`, label: 'Cek kematangan malai (90–95% bulir kuning keras)', completed: currentHst > 92 },
        { id: `${plotId}-c8-2`, label: 'Catat bobot Gabah Kering Panen (GKP), kadar air, dan laporan laba/rugi', completed: currentHst > 95 },
      ],
    },
  ];

  const ureaTaskDate = addDaysToIsoDate(plantingDate, 20);
  const sprayTaskDate = addDaysToIsoDate(plantingDate, 21);
  const waterTaskDate = addDaysToIsoDate(plantingDate, 8);
  const pestCheckDate = addDaysToIsoDate(plantingDate, 11);
  const npkTaskDate = addDaysToIsoDate(plantingDate, 16);
  const harvestIsoDate = addDaysToIsoDate(plantingDate, 90);

  const tasks: ScheduledTask[] = [
    {
      id: `${plotId}-task-1`,
      plotId,
      plotName,
      commodity,
      title: 'Pemupukan (Urea)',
      category: 'Pemupukan',
      dateLabel: 'Hari ini, 06:00 – 08:00',
      isoDate: ureaTaskDate,
      timeSlot: '06:00 – 08:00',
      completed: false,
      dosageOrNote: `Estimasi dosis: ± ${urea2Kg} kg untuk ${areaHa} Ha`,
      phaseNumber: 4,
    },
    {
      id: `${plotId}-task-2`,
      plotId,
      plotName,
      commodity,
      title: 'Cek kondisi tanaman',
      category: 'Pemeriksaan Hama & Penyakit',
      dateLabel: 'Hari ini, 15:00 – 16:00',
      isoDate: ureaTaskDate,
      timeSlot: '15:00 – 16:00',
      completed: false,
      dosageOrNote: 'Inspeksi bercak daun Blas & populasi wereng pangkal batang',
      phaseNumber: 6,
    },
    {
      id: `${plotId}-task-3`,
      plotId,
      plotName,
      commodity,
      title: 'Pemeriksaan Lanjutan & Evaluasi Ambang Pengendalian',
      category: 'Pemeriksaan Hama & Penyakit',
      dateLabel: 'Besok, 07:00 – 09:00',
      isoDate: sprayTaskDate,
      timeSlot: '07:00 – 09:00',
      completed: false,
      dosageOrNote: 'Tentukan tindakan PHT berdasarkan hasil pengamatan 20 rumpun',
      phaseNumber: 6,
    },
    {
      id: `${plotId}-task-4`,
      plotId,
      plotName,
      commodity,
      title: 'Pengairan Berselang',
      category: 'Pengairan',
      dateLabel: formatIndonesianDate(waterTaskDate),
      isoDate: waterTaskDate,
      timeSlot: '07:00 – 09:00',
      completed: currentHst > 8,
      dosageOrNote: 'Atur tinggi genangan air 3–5 cm pada petakan lahan',
      phaseNumber: 5,
    },
    {
      id: `${plotId}-task-5`,
      plotId,
      plotName,
      commodity,
      title: 'Pemeriksaan Hama & Penyakit',
      category: 'Pemeriksaan Hama & Penyakit',
      dateLabel: formatIndonesianDate(pestCheckDate),
      isoDate: pestCheckDate,
      timeSlot: '08:00 – 10:00',
      completed: currentHst > 11,
      dosageOrNote: 'Pengamatan 20 rumpun sampel diagonal',
      phaseNumber: 6,
    },
    {
      id: `${plotId}-task-6`,
      plotId,
      plotName,
      commodity,
      title: 'Pemupukan (NPK Phonska)',
      category: 'Pemupukan',
      dateLabel: formatIndonesianDate(npkTaskDate),
      isoDate: npkTaskDate,
      timeSlot: '06:30 – 08:30',
      completed: currentHst > 16,
      dosageOrNote: `Estimasi dosis: ± ${npk1Kg} kg untuk ${areaHa} Ha`,
      phaseNumber: 4,
    },
  ];

  return {
    phases,
    tasks,
    estimatedHarvestDate: harvestIsoDate,
  };
}

export interface CalculatorInput {
  areaHa: number;
  commodity: CommodityType;
  plantingMethod: 'Jajar Legowo 2:1' | 'Tegel (25x25 cm)' | 'Tabela';
  seedPricePerKgRp: number;
  ureaPricePerKgRp: number;
  npkPricePerKgRp: number;
  sprayDosageMlPerLiter: number;
  sprayVolumeLiterPerHa: number;
  tankCapacityLiter: number;
  laborCostPerHaRp: number;
  landPrepAndToolCostPerHaRp: number;
  harvestAndPostHarvestCostPerHaRp: number;
  targetYieldTonPerHa: number;
  expectedPricePerKgGabahRp: number;
}

export interface CalculatorOutput {
  isValid: boolean;
  validationErrors: string[];
  seedRequiredKg: number;
  ureaTotalKg: number;
  npkTotalKg: number;
  spraySolutionTotalLiter: number;
  numberOfTanksRequired: number;
  pesticidePerTankMl: number;
  pesticideTotalMl: number;
  seedCostRp: number;
  fertilizerCostRp: number;
  laborCostTotalRp: number;
  landPrepCostTotalRp: number;
  harvestCostTotalRp: number;
  totalEstimatedCostRp: number;
  estimatedYieldKgMin: number;
  estimatedYieldKgTarget: number;
  estimatedYieldKgMax: number;
  estimatedRevenueRp: number;
  estimatedNetProfitRp: number;
  rcRatio: number;
  assumptions: string[];
}

export function calculateInputsAndFinancials(input: CalculatorInput): CalculatorOutput {
  const errors: string[] = [];

  if (!Number.isFinite(input.areaHa) || input.areaHa <= 0) {
    errors.push('Luas lahan harus lebih besar dari 0 hektare.');
  }
  if (input.areaHa > 10000) {
    errors.push('Luas lahan melebihi batas wajar per blok (maksimal 10.000 Ha).');
  }
  if (input.seedPricePerKgRp < 0 || input.ureaPricePerKgRp < 0 || input.npkPricePerKgRp < 0) {
    errors.push('Harga benih dan pupuk tidak boleh bernilai negatif.');
  }
  if (input.sprayDosageMlPerLiter < 0 || input.sprayDosageMlPerLiter > 50) {
    errors.push('Dosis konsentrasi per liter air harus berada pada rentang wajar label (0 – 50 ml atau g/L).');
  }
  if (input.sprayVolumeLiterPerHa <= 0 || input.sprayVolumeLiterPerHa > 1200) {
    errors.push('Volume semprot per hektare harus berada antara 100 – 1.200 L/Ha.');
  }
  if (input.tankCapacityLiter <= 0 || input.tankCapacityLiter > 50) {
    errors.push('Kapasitas tangki semprot harus berada antara 5 – 50 liter.');
  }
  if (input.targetYieldTonPerHa <= 0 || input.targetYieldTonPerHa > 20) {
    errors.push('Target hasil panen harus berada antara 0,5 – 20 ton/Ha.');
  }
  if (input.expectedPricePerKgGabahRp <= 0) {
    errors.push('Harga jual hasil panen per kg harus lebih besar dari Rp 0.');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      validationErrors: errors,
      seedRequiredKg: 0,
      ureaTotalKg: 0,
      npkTotalKg: 0,
      spraySolutionTotalLiter: 0,
      numberOfTanksRequired: 0,
      pesticidePerTankMl: 0,
      pesticideTotalMl: 0,
      seedCostRp: 0,
      fertilizerCostRp: 0,
      laborCostTotalRp: 0,
      landPrepCostTotalRp: 0,
      harvestCostTotalRp: 0,
      totalEstimatedCostRp: 0,
      estimatedYieldKgMin: 0,
      estimatedYieldKgTarget: 0,
      estimatedYieldKgMax: 0,
      estimatedRevenueRp: 0,
      estimatedNetProfitRp: 0,
      rcRatio: 0,
      assumptions: [],
    };
  }

  const seedRatePerHa =
    input.plantingMethod === 'Jajar Legowo 2:1'
      ? 25
      : input.plantingMethod === 'Tegel (25x25 cm)'
      ? 30
      : 45;

  const seedRequiredKg = Number((input.areaHa * seedRatePerHa).toFixed(1));

  const ureaRatePerHa = input.commodity === 'Padi' ? 200 : input.commodity === 'Jagung' ? 300 : 180;
  const npkRatePerHa = input.commodity === 'Padi' ? 300 : input.commodity === 'Jagung' ? 350 : 400;

  const ureaTotalKg = Math.round(input.areaHa * ureaRatePerHa);
  const npkTotalKg = Math.round(input.areaHa * npkRatePerHa);

  const spraySolutionTotalLiter = Math.round(input.areaHa * input.sprayVolumeLiterPerHa);
  const numberOfTanksRequired = Number((spraySolutionTotalLiter / input.tankCapacityLiter).toFixed(1));
  const pesticidePerTankMl = Number((input.sprayDosageMlPerLiter * input.tankCapacityLiter).toFixed(1));
  const pesticideTotalMl = Number((spraySolutionTotalLiter * input.sprayDosageMlPerLiter).toFixed(1));

  const seedCostRp = Math.round(seedRequiredKg * input.seedPricePerKgRp);
  const fertilizerCostRp = Math.round(
    ureaTotalKg * input.ureaPricePerKgRp + npkTotalKg * input.npkPricePerKgRp
  );
  const laborCostTotalRp = Math.round(input.areaHa * input.laborCostPerHaRp);
  const landPrepCostTotalRp = Math.round(input.areaHa * input.landPrepAndToolCostPerHaRp);
  const harvestCostTotalRp = Math.round(input.areaHa * input.harvestAndPostHarvestCostPerHaRp);

  const totalEstimatedCostRp =
    seedCostRp + fertilizerCostRp + laborCostTotalRp + landPrepCostTotalRp + harvestCostTotalRp;

  const estimatedYieldKgTarget = Math.round(input.areaHa * input.targetYieldTonPerHa * 1000);
  const estimatedYieldKgMin = Math.round(estimatedYieldKgTarget * 0.88);
  const estimatedYieldKgMax = Math.round(estimatedYieldKgTarget * 1.10);

  const estimatedRevenueRp = Math.round(estimatedYieldKgTarget * input.expectedPricePerKgGabahRp);
  const estimatedNetProfitRp = estimatedRevenueRp - totalEstimatedCostRp;
  const rcRatio =
    totalEstimatedCostRp > 0
      ? Number((estimatedRevenueRp / totalEstimatedCostRp).toFixed(2))
      : 0;

  return {
    isValid: true,
    validationErrors: [],
    seedRequiredKg,
    ureaTotalKg,
    npkTotalKg,
    spraySolutionTotalLiter,
    numberOfTanksRequired,
    pesticidePerTankMl,
    pesticideTotalMl,
    seedCostRp,
    fertilizerCostRp,
    laborCostTotalRp,
    landPrepCostTotalRp,
    harvestCostTotalRp,
    totalEstimatedCostRp,
    estimatedYieldKgMin,
    estimatedYieldKgTarget,
    estimatedYieldKgMax,
    estimatedRevenueRp,
    estimatedNetProfitRp,
    rcRatio,
    assumptions: [
      `Kebutuhan benih dihitung memakai metode ${input.plantingMethod} (${seedRatePerHa} kg/Ha).`,
      `Dosis pupuk merupakan estimasi awal (${ureaRatePerHa} kg Urea/Ha & ${npkRatePerHa} kg NPK/Ha); sesuaikan hasil uji tanah PUTS dan Bagan Warna Daun (BWD).`,
      `Takaran pestisida dihitung terpisah antara per tangki (${pesticidePerTankMl} ml per tangki ${input.tankCapacityLiter} L) dan kebutuhan luas lahan (${pesticideTotalMl} ml dalam ${spraySolutionTotalLiter} L air).`,
      `Rentang hasil panen memperhitungkan variasi cuaca dan susut panen (${estimatedYieldKgMin.toLocaleString('id-ID')} – ${estimatedYieldKgMax.toLocaleString('id-ID')} kg).`,
    ],
  };
}

export function validatePlotForm(data: {
  name: string;
  locationVillage: string;
  areaHa: number;
  variety: string;
  plantingDate: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Nama lahan wajib diisi (minimal 2 karakter).');
  }
  if (!data.locationVillage || data.locationVillage.trim().length < 2) {
    errors.push('Lokasi desa/kecamatan wajib diisi.');
  }
  if (!Number.isFinite(data.areaHa) || data.areaHa <= 0 || data.areaHa > 5000) {
    errors.push('Luas lahan harus berupa angka positif (0,01 – 5.000 Ha).');
  }
  if (!data.variety || data.variety.trim().length < 2) {
    errors.push('Varietas tanaman wajib diisi.');
  }
  if (!data.plantingDate || Number.isNaN(new Date(data.plantingDate).getTime())) {
    errors.push('Tanggal tanam wajib diisi dengan format tanggal yang valid.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function evaluateSoilParameters(ph: number, moisturePct: number, tempC: number): {
  phStatus: 'Asam' | 'Normal' | 'Basa';
  moistureStatus: 'Kering' | 'Cukup' | 'Jenuh';
  tempStatus: 'Sejuk' | 'Normal' | 'Panas';
  recommendation: string;
} {
  const phStatus = ph < 5.5 ? 'Asam' : ph <= 7.2 ? 'Normal' : 'Basa';
  const moistureStatus = moisturePct < 45 ? 'Kering' : moisturePct <= 80 ? 'Cukup' : 'Jenuh';
  const tempStatus = tempC < 20 ? 'Sejuk' : tempC <= 32 ? 'Normal' : 'Panas';

  let recommendation = 'Jaga kelembapan tanah dan lakukan pemupukan sesuai jadwal.';
  if (phStatus === 'Asam') {
    recommendation = `pH tanah tergolong asam (${ph}). Pertimbangkan pemberian kapur pertanian (Dolomit) saat olah lahan dan gunakan pupuk organik matang.`;
  } else if (moistureStatus === 'Kering') {
    recommendation = `Kelembapan tanah rendah (${moisturePct}%). Segera lakukan pengairan hingga kondisi macak-macak sebelum aplikasi pupuk.`;
  } else if (phStatus === 'Basa') {
    recommendation = `pH tanah agak basa (${ph}). Gunakan bahan organik dan pupuk sumber sulfur seperti ZA sesuai rekomendasi penyuluh setempat.`;
  }

  return {
    phStatus,
    moistureStatus,
    tempStatus,
    recommendation,
  };
}

export function addDaysIso(isoDate: string, daysToAdd: number): string {
  return addDaysToIsoDate(isoDate, daysToAdd);
}

export function formatDateIndonesian(isoDate: string): string {
  return formatIndonesianDate(isoDate);
}

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rp ${safe.toLocaleString('id-ID')}`;
}

export function normalizeAreaToHa(value: number, unit: 'ha' | 'm2'): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (unit === 'm2') {
    return Number((num / 10000).toFixed(4));
  }
  return Number(num.toFixed(4));
}

export interface ImageColorStats {
  greenRatio: number;
  yellowRatio: number;
  orangeRatio?: number;
  brownRatio: number;
  paleBleachedRatio?: number;
  darkSpotRatio?: number;
  spotClusterCount?: number;
  streakContinuityScore?: number;
  lowerStemDamageRatio?: number;
  contrastStdDev?: number;
  brightness: number;
  visualHash?: number | string;
  width?: number;
  height?: number;
}

/**
 * Membangun hasil diagnosis kontekstual yang tersinkronisasi penuh (Zero-Mismatch)
 * dengan `OFFICIAL_DISEASE_REGISTRY` di `agronomyDatabase.ts`.
 *
 * Catatan Arsitektur:
 * - Untuk foto asli (Upload Foto / Kamera Live), klasifikasi utama dilakukan oleh
 *   Multimodal Gemini Vision API (`gemini-2.5-flash`) yang mengembalikan `matchedDiseaseId`,
 *   `visualObservations`, `confidenceScore`, dan `differentialReasoning`.
 * - Fungsi ini menarik rekomendasi PHT dan produk pestisida SECARA LANGSUNG dari
 *   `agronomyDatabase.ts` berdasarkan `matchedDiseaseId` sehingga tidak pernah terjadi
 *   salah obat (zero mismatch).
 */
export function buildContextualDiagnosisResult(params: {
  commodity: CommodityType;
  plantPart: DiagnosisResult['plantPart'];
  symptomNotes?: string;
  presetKey?: 'blas' | 'kresek' | 'bercak_coklat' | 'tungro' | 'wereng' | string;
  matchedDiseaseId?: OfficialDiseaseId | string;
  visualObservations?: string;
  confidenceScore?: number;
  differentialReasoning?: string;
  visibleSymptoms?: string[];
  hasCustomImage?: boolean;
  imageStats?: ImageColorStats | null;
  plotId?: string;
  plotName?: string;
  aiModelUsed?: string;
}): DiagnosisResult {
  const {
    commodity,
    plantPart,
    symptomNotes = '',
    presetKey,
    matchedDiseaseId,
    visualObservations,
    confidenceScore,
    differentialReasoning,
    visibleSymptoms,
    plotId,
    plotName = 'Lahan Pengamatan',
    aiModelUsed,
  } = params;

  // 1. Jika Gemini Vision telah mengembalikan matchedDiseaseId, gunakan langsung sebagai sumber kebenaran utama
  if (matchedDiseaseId && matchedDiseaseId.trim().length > 0) {
    return buildDiagnosisFromMatchedDiseaseId({
      matchedDiseaseId,
      commodity,
      plantPart,
      visualObservations,
      confidenceScore,
      differentialReasoning,
      visibleSymptoms,
      plotId,
      plotName,
      aiModelUsed: aiModelUsed || 'Multimodal Gemini Vision Fitopatologi',
    });
  }

  // 2. Pemetaan berbasis catatan gejala eksplisit petani atau tombol preset sampel uji
  const notesLower = symptomNotes.toLowerCase().trim();
  let resolvedDiseaseId: OfficialDiseaseId =
    plantPart === 'Batang'
      ? 'wereng_batang_coklat'
      : plantPart === 'Malai / Bunga'
      ? 'sundep_beluk'
      : 'kresek_hdb';

  if (commodity === 'Cabai' || notesLower.includes('cabai') || notesLower.includes('patek') || notesLower.includes('antraknosa')) {
    resolvedDiseaseId = 'antraknosa_cabai';
  } else if (commodity === 'Jagung' || notesLower.includes('jagung') || notesLower.includes('bulai')) {
    resolvedDiseaseId = 'hawar_daun_jagung';
  } else if (
    notesLower.includes('sundep') ||
    notesLower.includes('beluk') ||
    notesLower.includes('penggerek') ||
    notesLower.includes('lubang gerek') ||
    (plantPart === 'Malai / Bunga' && (notesLower.includes('hampa') || notesLower.includes('putih')))
  ) {
    resolvedDiseaseId = 'sundep_beluk';
  } else if (
    notesLower.includes('putih palsu') ||
    notesLower.includes('pelipat') ||
    notesLower.includes('lipat') ||
    notesLower.includes('transparan') ||
    notesLower.includes('dikerok')
  ) {
    resolvedDiseaseId = 'hama_putih_palsu';
  } else if (
    notesLower.includes('wereng') ||
    notesLower.includes('wbc') ||
    notesLower.includes('hopperburn') ||
    notesLower.includes('pangkal batang') ||
    notesLower.includes('terbakar') ||
    notesLower.includes('mengering coklat')
  ) {
    resolvedDiseaseId = 'wereng_batang_coklat';
  } else if (
    notesLower.includes('kresek') ||
    notesLower.includes('bakteri') ||
    notesLower.includes('hdb') ||
    notesLower.includes('hawar daun') ||
    notesLower.includes('kuning jerami') ||
    notesLower.includes('tepi daun mengering')
  ) {
    resolvedDiseaseId = 'kresek_hdb';
  } else if (
    notesLower.includes('pelepah') ||
    notesLower.includes('rhizoctonia') ||
    notesLower.includes('belang') ||
    notesLower.includes('kulit ular')
  ) {
    resolvedDiseaseId = 'hawar_pelepah';
  } else if (
    notesLower.includes('coklat sempit') ||
    notesLower.includes('cercospora') ||
    notesLower.includes('bercak garis')
  ) {
    resolvedDiseaseId = 'bercak_coklat_sempit';
  } else if (
    notesLower.includes('bercak coklat') ||
    notesLower.includes('bipolaris') ||
    notesLower.includes('helminthosporium') ||
    notesLower.includes('biji wijen') ||
    notesLower.includes('oval coklat')
  ) {
    resolvedDiseaseId = 'bercak_coklat';
  } else if (
    notesLower.includes('tungro') ||
    notesLower.includes('virus') ||
    notesLower.includes('oranye') ||
    notesLower.includes('kerdil')
  ) {
    resolvedDiseaseId = 'tungro';
  } else if (
    notesLower.includes('kalium') ||
    notesLower.includes('keracunan besi') ||
    notesLower.includes('bronzing')
  ) {
    resolvedDiseaseId = 'kahat_k_fe';
  } else if (
    notesLower.includes('nitrogen') ||
    notesLower.includes('kahat') ||
    notesLower.includes('kurang pupuk') ||
    notesLower.includes('daun tua menguning') ||
    notesLower.includes('daun bawah menguning')
  ) {
    resolvedDiseaseId = 'kahat_n';
  } else if (notesLower.includes('sehat') || notesLower.includes('normal')) {
    resolvedDiseaseId = 'tanaman_sehat';
  } else if (notesLower.includes('blas') || notesLower.includes('belah ketupat') || notesLower.includes('pyricularia')) {
    resolvedDiseaseId = 'blas_daun';
  } else if (presetKey) {
    const presetMap: Record<string, OfficialDiseaseId> = {
      blas: 'blas_daun',
      blas_daun: 'blas_daun',
      kresek: 'kresek_hdb',
      kresek_hdb: 'kresek_hdb',
      bercak_coklat: 'bercak_coklat',
      hawar_pelepah: 'hawar_pelepah',
      bercak_coklat_sempit: 'bercak_coklat_sempit',
      tungro: 'tungro',
      hama_putih_palsu: 'hama_putih_palsu',
      wereng: 'wereng_batang_coklat',
      wereng_batang_coklat: 'wereng_batang_coklat',
      sundep_beluk: 'sundep_beluk',
      kahat_n: 'kahat_n',
      kahat_k_fe: 'kahat_k_fe',
      tanaman_sehat: 'tanaman_sehat',
    };
    resolvedDiseaseId = presetMap[presetKey] || normalizeOfficialDiseaseId(presetKey, commodity);
  }

  return buildDiagnosisFromMatchedDiseaseId({
    matchedDiseaseId: resolvedDiseaseId,
    commodity,
    plantPart,
    visualObservations:
      visualObservations ||
      (symptomNotes.trim()
        ? `Pengamatan gejala pada ${plantPart.toLowerCase()} ${commodity}: "${symptomNotes.trim()}".`
        : undefined),
    confidenceScore,
    differentialReasoning,
    visibleSymptoms,
    plotId,
    plotName,
    aiModelUsed: aiModelUsed || 'Basis Pakar Fitopatologi Kementan RI',
  });
}




