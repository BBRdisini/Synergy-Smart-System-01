import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDaysAfterPlanting,
  determineRiceGrowthPhase,
  generateCultivationPlanAndTasks,
  calculateInputsAndFinancials,
  validatePlotForm,
  evaluateSoilParameters,
  generate14StageRiceLifecycle,
  recalculateSeasonScheduleOnPlantingDateChange,
  calculateSeasonFinancialSummary,
  filterEntitiesByOwner,
  buildContextualDiagnosisResult,
  generatePredictiveAiAlerts,
  buildIntelligentDiagnosisRecommendationSummary,
} from './agronomyCalculations';

test('calculateDaysAfterPlanting computes accurate HST difference', () => {
  const hst = calculateDaysAfterPlanting('2025-04-12', '2025-05-02');
  assert.equal(hst, 20);
});

test('determineRiceGrowthPhase maps HST to the 8-phase rice cultivation engine', () => {
  const phaseVeg = determineRiceGrowthPhase(20);
  assert.equal(phaseVeg.phaseNumber, 4);
  assert.equal(phaseVeg.shortLabel, 'Vegetatif (20 HST)');

  const phaseGen = determineRiceGrowthPhase(65);
  assert.equal(phaseGen.phaseNumber, 7);

  const phaseHarvest = determineRiceGrowthPhase(92);
  assert.equal(phaseHarvest.phaseNumber, 8);
});

test('generate14StageRiceLifecycle creates all 14 stages and adapts maturity to variety and system', () => {
  const ciherang = generate14StageRiceLifecycle({
    seasonId: 'season-1',
    ownerId: 'usr-1',
    farmId: 'farm-1',
    farmName: 'Lahan 1',
    variety: 'Ciherang',
    plantedAreaHa: 1.2,
    seedingDate: '2025-03-25',
    plantingDate: '2025-04-12',
    cultivationSystem: 'Jajar Legowo 2:1',
    currentConfirmedStageIndex: 6,
  });

  const inpari42 = generate14StageRiceLifecycle({
    seasonId: 'season-2',
    ownerId: 'usr-1',
    farmId: 'farm-2',
    farmName: 'Lahan 2',
    variety: 'Inpari 42 Agritan GSR',
    plantedAreaHa: 1.0,
    seedingDate: '2025-03-25',
    plantingDate: '2025-04-12',
    cultivationSystem: 'SRI (System of Rice Intensification)',
    currentConfirmedStageIndex: 4,
  });

  assert.equal(ciherang.stages.length, 14);
  assert.equal(ciherang.tasks.length, 14);
  // Varieties do not share a universal maturity date
  assert.notEqual(ciherang.estimatedHarvestDate, inpari42.estimatedHarvestDate);
  // Stages 1..5 completed, stage 6 running
  assert.equal(ciherang.stages[0].status, 'Selesai');
  assert.equal(ciherang.stages[5].status, 'Sedang Berjalan');
  assert.equal(ciherang.stages[12].status, 'Terjadwal');
});

test('recalculateSeasonScheduleOnPlantingDateChange shifts planned tasks and preserves completed tasks', () => {
  const lifecycle = generate14StageRiceLifecycle({
    seasonId: 'season-1',
    ownerId: 'usr-1',
    farmId: 'farm-1',
    farmName: 'Lahan 1',
    variety: 'Ciherang',
    plantedAreaHa: 1.2,
    seedingDate: '2025-03-25',
    plantingDate: '2025-04-12',
    cultivationSystem: 'Jajar Legowo 2:1',
    currentConfirmedStageIndex: 6, // Stages 1..5 are 'Selesai', 6..14 are 'Terjadwal'
  });

  const originalCompletedDate = lifecycle.tasks[0].scheduledDate;
  const originalPlannedHarvestTaskDate = lifecycle.tasks[12].scheduledDate;

  const recalc = recalculateSeasonScheduleOnPlantingDateChange({
    season: {
      id: 'season-1',
      ownerId: 'usr-1',
      farmId: 'farm-1',
      farmName: 'Lahan 1',
      commodity: 'Padi',
      variety: 'Ciherang',
      plantedAreaHa: 1.2,
      startDate: '2025-03-22',
      seedingDate: '2025-03-25',
      plantingDate: '2025-04-12',
      cultivationSystem: 'Jajar Legowo 2:1',
      currentStageIndex: 6,
      currentStageOrder: 6,
      currentStageName: '6. Pertumbuhan Vegetatif',
      currentHst: 20,
      targetYieldKg: 8160,
      status: 'Aktif',
      estimatedHarvestDate: lifecycle.estimatedHarvestDate,
      initialSoilConditionNotes: 'pH 6.5',
      notes: '',
      stages: lifecycle.stages,
      createdAt: '2025-03-22',
      updatedAt: '2025-03-22',
    },
    tasks: lifecycle.tasks,
    newPlantingDate: '2025-04-17', // +5 days shift
  });

  assert.equal(recalc.dayDelta, 5);
  assert.equal(recalc.preservedCompletedCount, 5);
  assert.equal(recalc.shiftedPlannedCount, 9);
  // Completed task date must NOT change
  assert.equal(recalc.updatedTasks[0].scheduledDate, originalCompletedDate);
  // Planned task date must shift by +5 days
  assert.notEqual(recalc.updatedTasks[12].scheduledDate, originalPlannedHarvestTaskDate);
});

test('calculateSeasonFinancialSummary computes revenue, net profit, per-Ha cost, and prevents double counting', () => {
  const fin = calculateSeasonFinancialSummary({
    plantedAreaHa: 1.2,
    expenses: [
      {
        id: 'exp-1',
        ownerId: 'usr-1',
        seasonId: 'season-1',
        farmId: 'farm-1',
        farmName: 'Lahan 1',
        category: 'Pupuk',
        description: 'Urea & NPK',
        quantity: 300,
        unit: 'kg',
        unitPriceRp: 2500,
        totalRp: 750000,
        date: '2025-04-20',
        notes: '',
        linkedActivityId: 'act-1',
      },
    ],
    activities: [
      {
        id: 'act-1',
        ownerId: 'usr-1',
        farmId: 'farm-1',
        seasonId: 'season-1',
        activityType: 'Pemupukan',
        executionDate: '2025-04-20',
        inputUsed: 'Urea & NPK',
        quantity: 300,
        unit: 'kg',
        unitCostRp: 2500,
        actualCostRp: 750000, // Linked to exp-1 -> must NOT be double counted!
        notes: '',
        createdAt: '2025-04-20',
      },
      {
        id: 'act-2',
        ownerId: 'usr-1',
        farmId: 'farm-1',
        seasonId: 'season-1',
        activityType: 'Penyiangan',
        executionDate: '2025-04-25',
        inputUsed: 'Tenaga Kerja Penyiangan',
        quantity: 1,
        unit: 'paket',
        unitCostRp: 450000,
        actualCostRp: 450000, // Unlinked -> included
        notes: '',
        createdAt: '2025-04-25',
      },
    ],
    harvests: [
      {
        id: 'harv-1',
        ownerId: 'usr-1',
        seasonId: 'season-1',
        farmId: 'farm-1',
        farmName: 'Lahan 1',
        harvestDate: '2025-07-15',
        harvestedAreaHa: 1.2,
        actualYieldKg: 8000,
        moisturePct: 18,
        sellingPricePerKgRp: 6500,
        grossRevenueRp: 52000000,
        harvestCostRp: 1800000,
        qualityNotes: 'Gabah bernas bersih',
        createdAt: '2025-07-15',
      },
    ],
  });

  // Total cost = 750,000 (exp-1) + 450,000 (act-2 unlinked) + 1,800,000 (harvest cost) = 3,000,000
  assert.equal(fin.totalSeasonCostRp, 3000000);
  assert.equal(fin.costPerHectareRp, 2500000); // 3,000,000 / 1.2 Ha
  assert.equal(fin.totalGrossRevenueRp, 52000000);
  assert.equal(fin.netProfitRp, 49000000);
  assert.equal(fin.isProfitable, true);
});

test('filterEntitiesByOwner isolates user records strictly', () => {
  const farms = [
    { id: 'f1', ownerId: 'usr-budi', name: 'Lahan Budi' },
    { id: 'f2', ownerId: 'usr-other', name: 'Lahan Petani Lain' },
  ];
  const budiFarms = filterEntitiesByOwner(farms, 'usr-budi');
  assert.equal(budiFarms.length, 1);
  assert.equal(budiFarms[0].id, 'f1');
});

test('calculateInputsAndFinancials and validatePlotForm work accurately', () => {
  const res = calculateInputsAndFinancials({
    areaHa: 1.2,
    commodity: 'Padi',
    plantingMethod: 'Jajar Legowo 2:1',
    seedPricePerKgRp: 14000,
    ureaPricePerKgRp: 2500,
    npkPricePerKgRp: 2600,
    sprayDosageMlPerLiter: 1.0,
    sprayVolumeLiterPerHa: 500,
    tankCapacityLiter: 16,
    laborCostPerHaRp: 4500000,
    landPrepAndToolCostPerHaRp: 2000000,
    harvestAndPostHarvestCostPerHaRp: 1800000,
    targetYieldTonPerHa: 6.5,
    expectedPricePerKgGabahRp: 6500,
  });
  assert.equal(res.isValid, true);
  assert.equal(res.pesticidePerTankMl, 16);

  const validCheck = validatePlotForm({
    name: 'Lahan 1',
    locationVillage: 'Desa Larikrejo, Kudus',
    areaHa: 1.2,
    variety: 'Ciherang',
    plantingDate: '2025-04-12',
  });
  assert.equal(validCheck.valid, true);

  const soil = evaluateSoilParameters(6.5, 62, 23);
  assert.equal(soil.phStatus, 'Normal');
});

test('buildDiagnosisFromMatchedDiseaseId & buildContextualDiagnosisResult enforce strict zero-mismatch pesticide mapping across all diseases', () => {
  // 1. Sundep / Penggerek Batang -> Insektisida Sistemik (Virtako 300 SC), NEVER fungicide
  const sundepDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Batang',
    symptomNotes: 'Ditemukan lubang gerekan ulat dan pucuk mati sundep',
    presetKey: 'blas',
    hasCustomImage: false,
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  });
  assert.equal(sundepDiag.matchedDiseaseId, 'sundep_beluk');
  assert.equal(sundepDiag.causeCategory, 'Serangan Hama');
  assert.ok(sundepDiag.detectedName.includes('Penggerek Batang'));
  assert.deepEqual(sundepDiag.verifiedProductIds, ['prod-virtako-300sc']);

  // 2. Hawar Daun Bakteri (HDB / Kresek) -> Bakterisida Tembaga (Nordox 56 WP), NEVER fungicide Score/Antracol
  const kresekDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'kresek_hdb',
    visualObservations:
      'Lesi memanjang bergelombang warna kuning jerami hingga pucat mengering dimulai dari tepi dan ujung daun menuju pangkal.',
    confidenceScore: 93,
    differentialReasoning:
      'Didiagnosis sebagai Hawar Daun Bakteri (Kresek) dan bukan Blas Daun karena lesi berupa garis hawar memanjang dari tepi daun, tanpa bercak belah ketupat berpusat abu-abu.',
    plotName: 'Lahan 1',
  });
  assert.equal(kresekDiag.matchedDiseaseId, 'kresek_hdb');
  assert.equal(kresekDiag.detectedName, 'Penyakit Hawar Daun Bakteri (HDB / Kresek)');
  assert.equal(kresekDiag.causeCategory, 'Penyakit Bakteri');
  assert.deepEqual(kresekDiag.verifiedProductIds, ['prod-nordox-56wp']);
  assert.ok(!kresekDiag.verifiedProductIds.includes('prod-score-250ec'));
  assert.ok(!kresekDiag.verifiedProductIds.includes('prod-antracol-70wp'));

  // 3. Bercak Coklat Padi (Bipolaris oryzae) -> Fungisida Sistemik & Kontak (Amistartop, Score, Antracol)
  const brownSpotDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'bercak_coklat',
    visualObservations: 'Bintik-bintik oval bulat kecil coklat tua merata seperti biji wijen.',
    confidenceScore: 91,
    differentialReasoning:
      'Bercak berbentuk oval kecil coklat tua merata tanpa pusat abu-abu keputihan berbentuk belah ketupat seperti pada Blas Daun.',
    plotName: 'Lahan 1',
  });
  assert.equal(brownSpotDiag.matchedDiseaseId, 'bercak_coklat');
  assert.equal(brownSpotDiag.detectedName, 'Penyakit Bercak Coklat Padi (Brown Spot)');
  assert.ok(brownSpotDiag.scientificName.includes('Bipolaris oryzae'));
  assert.ok(brownSpotDiag.verifiedProductIds.includes('prod-amistartop-325sc'));

  // 4. Blas Daun (Pyricularia oryzae) -> Fungisida Sistemik & Kontak (Score 250 EC, Antracol 70 WP)
  const blasDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'blas_daun',
    visualObservations: 'Bercak belah ketupat meruncing di kedua ujung dengan tepi coklat tua dan pusat abu-abu keputihan.',
    confidenceScore: 95,
    plotName: 'Lahan 1',
  });
  assert.equal(blasDiag.matchedDiseaseId, 'blas_daun');
  assert.equal(blasDiag.detectedName, 'Penyakit Blas Daun (Pyricularia oryzae)');
  assert.deepEqual(blasDiag.verifiedProductIds, ['prod-score-250ec', 'prod-antracol-70wp']);

  // 5. Virus Tungro -> Pengendalian Vektor Wereng Hijau (Plenum 50 WG), NEVER fungicide
  const tungroDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'tungro',
    visualObservations: 'Daun muda menguning-oranye cerah dimulai dari ujung daun, rumpun tampak kerdil tanpa bercak jamur.',
    confidenceScore: 90,
    plotName: 'Lahan 1',
  });
  assert.equal(tungroDiag.matchedDiseaseId, 'tungro');
  assert.equal(tungroDiag.causeCategory, 'Penyakit Virus');
  assert.deepEqual(tungroDiag.verifiedProductIds, ['prod-plenum-50wg']);

  // 6. Hama Putih Palsu (Cnaphalocrocis medinalis) -> Insektisida (Virtako 300 SC)
  const pelipatDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'hama_putih_palsu',
    visualObservations: 'Daun terlipat dengan alur garis putih transparan memanjang sejajar tulang daun.',
    confidenceScore: 92,
    plotName: 'Lahan 1',
  });
  assert.equal(pelipatDiag.matchedDiseaseId, 'hama_putih_palsu');
  assert.equal(pelipatDiag.detectedName, 'Serangan Hama Putih Palsu / Pelipat Daun Padi');
  assert.deepEqual(pelipatDiag.verifiedProductIds, ['prod-virtako-300sc']);

  // 7. Defisiensi Nitrogen (Kahat N) -> Pupuk, ZERO chemical pesticide ([] verifiedProductIds)
  const kahatNDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'kahat_n',
    visualObservations: 'Daun tua bawah menguning pucat seragam tanpa lesi nekrotik.',
    confidenceScore: 89,
    plotName: 'Lahan 1',
  });
  assert.equal(kahatNDiag.matchedDiseaseId, 'kahat_n');
  assert.equal(kahatNDiag.causeCategory, 'Defisiensi Nutrisi');
  assert.deepEqual(kahatNDiag.verifiedProductIds, []);

  // Ensure all diagnoses are 100% distinct
  const uniqueDiagnoses = new Set([
    sundepDiag.detectedName,
    kresekDiag.detectedName,
    brownSpotDiag.detectedName,
    blasDiag.detectedName,
    tungroDiag.detectedName,
    pelipatDiag.detectedName,
    kahatNDiag.detectedName,
  ]);
  assert.equal(uniqueDiagnoses.size, 7);

  const cabaiDiag = buildContextualDiagnosisResult({
    commodity: 'Cabai',
    plantPart: 'Buah / Gabah',
    symptomNotes: 'Bercak hitam cekung patek pada buah cabai',
  });
  assert.equal(cabaiDiag.matchedDiseaseId, 'antraknosa_cabai');
  assert.ok(cabaiDiag.detectedName.includes('Antraknosa'));
  assert.ok(cabaiDiag.verifiedProductIds.includes('prod-antracol-70wp'));
});

test('generatePredictiveAiAlerts places latestDiagnosis at the top as a highlighted priority alert and updates intelligent recommendation', () => {
  const kresekDiagnosis = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    symptomNotes: 'Ujung daun mengering pucat kekuningan kresek pasca hujan',
    presetKey: 'kresek',
    hasCustomImage: false,
    plotName: 'Lahan 1 (Sawah Blok Utara)',
  });

  const alertsWithDiagnosis = generatePredictiveAiAlerts({
    weatherTempC: 29,
    weatherHumidityPct: 86,
    rainfallMm: 2,
    soilMoisturePct: 62,
    soilPh: 6.5,
    latestDiagnosis: kresekDiagnosis,
    diagnosisPlotName: 'Padi Ciherang — Lahan 1 (Sawah Blok Utara)',
  });

  assert.ok(alertsWithDiagnosis.length >= 3);
  const topPriorityAlert = alertsWithDiagnosis[0];
  assert.equal(topPriorityAlert.isPriorityDiagnosis, true);
  assert.equal(topPriorityAlert.severity, 'Tinggi');
  assert.ok(topPriorityAlert.title.includes(kresekDiagnosis.detectedName));
  assert.equal(topPriorityAlert.confidencePct, kresekDiagnosis.confidencePct);
  assert.equal(topPriorityAlert.scientificName, kresekDiagnosis.scientificName);
  assert.ok(topPriorityAlert.actionableSteps.length >= 2);

  const summary = buildIntelligentDiagnosisRecommendationSummary({
    diagnosis: kresekDiagnosis,
    weatherTempC: 29,
    weatherHumidityPct: 86,
    soilMoisturePct: 62,
    plotName: 'Padi Ciherang — Lahan 1 (Sawah Blok Utara)',
  });
  assert.ok(summary.includes('Rekomendasi Cerdas Prioritas'));
  assert.ok(summary.includes(kresekDiagnosis.detectedName));
  assert.ok(summary.includes(kresekDiagnosis.scientificName));
});

test('field-scale hopperburn / wereng diagnosis and dynamic confidence score normalization never default to blas_daun 93%', () => {
  // Field-scale hopperburn from Gemini Vision with decimal confidence 0.88 -> 88%
  const hopperburnDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'wereng_batang_coklat',
    visualObservations:
      'Hamparan rumpun padi tampak mengering coklat kemerahan seperti terbakar (hopperburn) merata.',
    confidenceScore: 0.88,
    differentialReasoning:
      'Gejala skala hamparan menunjukkan pengeringan coklat terbakar (hopperburn) khas serangan Wereng Batang Coklat, bukan bercak belah ketupat Blas Daun.',
    plotName: 'Lahan 1',
  });
  assert.equal(hopperburnDiag.matchedDiseaseId, 'wereng_batang_coklat');
  assert.equal(hopperburnDiag.confidencePct, 88);
  assert.notEqual(hopperburnDiag.matchedDiseaseId, 'blas_daun');
  assert.deepEqual(hopperburnDiag.verifiedProductIds, ['prod-plenum-50wg']);

  // Empty notes and no presetKey must NOT fall back to blas_daun 93%
  const noPresetDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Batang',
    symptomNotes: '',
  });
  assert.notEqual(noPresetDiag.matchedDiseaseId, 'blas_daun');
  assert.notEqual(noPresetDiag.confidencePct, 93);
});



