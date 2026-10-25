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
import {
  OFFICIAL_DISEASE_REGISTRY,
  VERIFIED_PESTICIDE_PRODUCTS,
} from '../data/agronomyDatabase';
import {
  AGRI_SYSTEM_INSTRUCTION,
  GEMINI_AGRI_GENERATION_CONFIG,
  classifyAgriChatTopic,
  buildAgriRefusalReply,
  buildSmartAgriFallbackReply,
} from './agriChatHelper';


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

test('buildDiagnosisFromMatchedDiseaseId & buildContextualDiagnosisResult enforce strict zero-mismatch multi-brand pesticide mapping and organ-precise detection', () => {
  // 1. Sundep / Penggerek Batang -> Multiple Systemic Insecticides (Virtako, Prevathon, Regent, Trichoderma/Hayati), NEVER fungicide
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
  assert.ok(sundepDiag.verifiedProductIds.length >= 3);
  assert.ok(sundepDiag.verifiedProductIds.includes('prod-virtako-300sc'));
  assert.ok(sundepDiag.verifiedProductIds.includes('prod-prevathon-50sc'));
  assert.ok(sundepDiag.verifiedProductIds.includes('prod-regent-50sc'));

  // 2. Hawar Daun Bakteri (HDB / Kresek) -> Multiple Bactericides + Biological + Recovery Nutrients, NEVER fungicide Score/Antracol
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
  assert.ok(kresekDiag.verifiedProductIds.length >= 3);
  assert.ok(kresekDiag.verifiedProductIds.includes('prod-nordox-56wp'));
  assert.ok(kresekDiag.verifiedProductIds.includes('prod-agrept-20wp'));
  assert.ok(!kresekDiag.verifiedProductIds.includes('prod-score-250ec'));
  assert.ok(!kresekDiag.verifiedProductIds.includes('prod-antracol-70wp'));

  // 3. Bercak Coklat Padi (Bipolaris oryzae) -> Multiple Fungicides + Recovery Nutrients
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
  assert.ok(brownSpotDiag.verifiedProductIds.length >= 3);
  assert.ok(brownSpotDiag.verifiedProductIds.includes('prod-amistartop-325sc'));
  assert.ok(brownSpotDiag.verifiedProductIds.includes('prod-score-250ec'));

  // 4. Blas Daun (Pyricularia oryzae) -> Multiple Blast-Specific & Systemic Fungicides (Fujiwan/Filia, Nativo, Score, Antracol)
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
  assert.ok(blasDiag.verifiedProductIds.length >= 3);
  assert.ok(blasDiag.verifiedProductIds.includes('prod-fujiwan-400ec'));
  assert.ok(blasDiag.verifiedProductIds.includes('prod-amistartop-325sc'));
  assert.ok(blasDiag.verifiedProductIds.includes('prod-score-250ec'));
  assert.ok(blasDiag.verifiedProductIds.includes('prod-antracol-70wp'));

  // 5. Virus Tungro -> Multiple Vector Insecticides + Recovery Nutrients, NEVER fungicide
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
  assert.ok(tungroDiag.verifiedProductIds.length >= 3);
  assert.ok(tungroDiag.verifiedProductIds.includes('prod-plenum-50wg'));
  assert.ok(tungroDiag.verifiedProductIds.includes('prod-applaud-10wp'));

  // 6. Hama Putih Palsu (Cnaphalocrocis medinalis) -> Multiple Lepidoptera Insecticides (Proclaim/Siklon, Prevathon, Virtako)
  const pelipatDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    matchedDiseaseId: 'hama_putih_palsu',
    visualObservations: 'Daun terlipat dengan alur garis putih transparan memanjang sejajar tulang daun.',
    confidenceScore: 92,
    plotName: 'Lahan 1',
  });
  assert.equal(pelipatDiag.matchedDiseaseId, 'hama_putih_palsu');
  assert.ok(pelipatDiag.detectedName.includes('Hama Putih Palsu'));
  assert.ok(pelipatDiag.verifiedProductIds.length >= 3);
  assert.ok(pelipatDiag.verifiedProductIds.includes('prod-proclaim-5sg'));
  assert.ok(pelipatDiag.verifiedProductIds.includes('prod-prevathon-50sc'));
  assert.ok(pelipatDiag.verifiedProductIds.includes('prod-virtako-300sc'));

  // 7. Defisiensi Nitrogen (Kahat N) -> Pupuk & Hayati (No chemical insecticide/fungicide)
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
  assert.ok(kahatNDiag.verifiedProductIds.includes('prod-nutrisi-kalium-zn'));

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

test('organ-precise detection ensures Akar (roots) is NEVER analyzed as Daun and every disease has multiple trade brands & supporting recommendations', () => {
  // A. When plantPart is Akar with empty notes -> analyzes Akar (Busuk Akar & Toksisitas Besi/Sulfida), NEVER Daun!
  const rootDefaultDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Akar',
    symptomNotes: '',
  });
  assert.equal(rootDefaultDiag.plantPart, 'Akar');
  assert.equal(rootDefaultDiag.matchedDiseaseId, 'busuk_akar_keracunan_besi');
  assert.ok(rootDefaultDiag.detectedName.includes('Akar'));
  assert.ok(!rootDefaultDiag.detectedName.includes('Daun'));

  // B. When plantPart is Akar with soil pest notes (orong-orong / nematoda) -> hama_akar_orong_nematoda
  const rootPestDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Akar',
    symptomNotes: 'Akar putus dimakan orong-orong dan ada bengkak puru nematoda',
  });
  assert.equal(rootPestDiag.plantPart, 'Akar');
  assert.equal(rootPestDiag.matchedDiseaseId, 'hama_akar_orong_nematoda');
  assert.ok(rootPestDiag.verifiedProductIds.includes('prod-regent-50sc'));
  assert.ok(rootPestDiag.verifiedProductIds.includes('prod-trichoderma-pgpr'));

  // C. Even if matchedDiseaseId was a leaf disease ('blas_daun'), if detectedPlantPartFromPhoto is 'Akar', it MUST override to a root diagnosis!
  const rootPhotoOverrideDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Daun',
    detectedPlantPartFromPhoto: 'Akar',
    matchedDiseaseId: 'blas_daun',
    visualObservations: 'Serabut akar padi tampak menghitam pekat dan berlumpur bau belerang.',
  });
  assert.equal(rootPhotoOverrideDiag.plantPart, 'Akar');
  assert.equal(rootPhotoOverrideDiag.matchedDiseaseId, 'busuk_akar_keracunan_besi');
  assert.ok(rootPhotoOverrideDiag.detectedName.includes('Akar'));

  // D. Every disease in OFFICIAL_DISEASE_REGISTRY has >= 2 verifiedProductIds and >= 2 biologicalAndSupportingRecommendations
  for (const [diseaseId, entry] of Object.entries(OFFICIAL_DISEASE_REGISTRY)) {
    assert.ok(
      entry.verifiedProductIds.length >= 2,
      `Expected ${diseaseId} to have at least 2 verifiedProductIds, got ${entry.verifiedProductIds.length}`
    );
    assert.ok(
      entry.biologicalAndSupportingRecommendations.length >= 2,
      `Expected ${diseaseId} to have biologicalAndSupportingRecommendations`
    );
  }

  // E. Every product in VERIFIED_PESTICIDE_PRODUCTS has multiple alternativeBrands (>= 3)
  for (const product of VERIFIED_PESTICIDE_PRODUCTS) {
    assert.ok(
      Array.isArray(product.alternativeBrands) && product.alternativeBrands.length >= 3,
      `Expected ${product.id} to have >= 3 alternativeBrands`
    );
  }
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
  assert.ok(hopperburnDiag.verifiedProductIds.length >= 3);
  assert.ok(hopperburnDiag.verifiedProductIds.includes('prod-plenum-50wg'));
  assert.ok(hopperburnDiag.verifiedProductIds.includes('prod-applaud-10wp'));
  assert.ok(hopperburnDiag.verifiedProductIds.includes('prod-virtako-300sc'));

  // Empty notes and no presetKey must NOT fall back to blas_daun 93%
  const noPresetDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Batang',
    symptomNotes: '',
  });
  assert.notEqual(noPresetDiag.matchedDiseaseId, 'blas_daun');
  assert.notEqual(noPresetDiag.confidencePct, 93);
});

test('Gemini agriChatHelper strictly allows all plant & agricultural queries (padi, jagung, sayuran, palawija, tanaman keras, bunga-bungaan, jambu, durian, jeruk, alpukat/alpokat) and firmly/warmly refuses non-agricultural queries', () => {
  // 1. Agricultural & plant queries across all requested categories must be allowed
  const rootQuery = classifyAgriChatTopic('Bosku, akar padi menghitam dan bau belerang obatnya apa?');
  assert.equal(rootQuery.isAgricultural, true);
  assert.equal(rootQuery.detectedCategory, 'pertanian');

  const insecticideQuery = classifyAgriChatTopic('Rekomendasi insektisida wereng dan penggerek batang multi merk');
  assert.equal(insecticideQuery.isAgricultural, true);

  const fruitAndPerennialQueries = [
    'Tips booster bunga durian dan alpokat supaya tidak rontok saat hujan?',
    'Cara merawat pohon jeruk dan jambu kristal agar berbuah lebat dan manis',
    'Budidaya tanaman keras kopi, sawit, dan mangga agar cepat panen',
    'Cara merawat bunga anggrek, mawar, bougenville dan tanaman hias aglaonema biar rajin berbunga',
    'Pemupukan jagung, kedelai, singkong palawija dan sayuran cabai tomat',
  ];
  for (const q of fruitAndPerennialQueries) {
    const check = classifyAgriChatTopic(q);
    assert.equal(check.isAgricultural, true, `Expected query to be classified as agricultural: ${q}`);
  }

  // 2. Non-agricultural queries must be strictly rejected
  const politicsQuery = classifyAgriChatTopic('Siapa calon presiden favorit di pilpres tahun ini?');
  assert.equal(politicsQuery.isAgricultural, false);
  assert.equal(politicsQuery.detectedCategory, 'luar_topik');

  const cryptoQuery = classifyAgriChatTopic('Cara trading bitcoin dan saham biar cuan banyak');
  assert.equal(cryptoQuery.isAgricultural, false);

  const refusalText = buildAgriRefusalReply('Siapa presiden pertama amerika?', 'Pak Budi Santoso');
  assert.ok(refusalText.includes('Bosku'));
  assert.ok(refusalText.includes('100% fokus khusus membahas dunia Pertanian & Tanaman saja'));

  // 3. Multi-brand insecticide reply contains multiple active ingredients and brands
  const replyInsecticide = buildSmartAgriFallbackReply('Obat insektisida wereng dan sundep apa saja merknya?', {
    farmerName: 'Pak Budi Santoso',
  });
  assert.ok(replyInsecticide.includes('Plenum 50 WG'));
  assert.ok(replyInsecticide.includes('Applaud 10 WP'));
  assert.ok(replyInsecticide.includes('Prevathon 50 SC'));
  assert.ok(replyInsecticide.includes('Virtako 300 SC'));

  // 4. Smart replies for Durian, Alpukat/Alpokat, Jeruk, Jambu, Bunga Hias, Jagung/Palawija/Sayuran
  const replyFruit = buildSmartAgriFallbackReply(
    'Tips merawat durian, alpokat, jeruk, dan jambu kristal agar bunga tidak rontok?',
    { farmerName: 'Pak Budi Santoso' }
  );
  assert.ok(replyFruit.includes('Durian'));
  assert.ok(replyFruit.includes('Alpukat'));
  assert.ok(replyFruit.includes('Jeruk'));
  assert.ok(replyFruit.includes('Jambu'));
  assert.ok(replyFruit.includes('MKP'));

  const replyFlower = buildSmartAgriFallbackReply(
    'Cara merawat bunga anggrek, mawar, dan bougenville biar berbunga lebat?',
    { farmerName: 'Pak Budi Santoso' }
  );
  assert.ok(replyFlower.includes('Bunga'));
  assert.ok(replyFlower.includes('Dekastar'));

  const replyVegCorn = buildSmartAgriFallbackReply(
    'Pemupukan jagung, palawija, dan sayuran cabai agar bebas ulat FAW dan patek?',
    { farmerName: 'Pak Budi Santoso' }
  );
  assert.ok(replyVegCorn.includes('Jagung'));
  assert.ok(replyVegCorn.includes('Sayuran'));

  // 5. SYNERGY Smart System creator query is recognized and proudly answered
  const synergyCheck = classifyAgriChatTopic('Siapa pembuat aplikasi ini? Apakah SYNERGY Smart System?');
  assert.equal(synergyCheck.isAgricultural, true);
  const synergyReply = buildSmartAgriFallbackReply('Siapa pembuat aplikasi ini? SYNERGY Smart System ya?', {
    farmerName: 'Pak Budi Santoso',
  });
  assert.ok(synergyReply.includes('SYNERGY Smart System'));
  assert.ok(synergyReply.includes('Gemini AI 3.8 Flash'));
  assert.ok(!synergyReply.toLowerCase().includes('argon'));

  // 6. Camera AI diagnosis includes geminiAnalysisAnswer powered by Gemini AI 3.8 Flash and supports Camera Q&A
  const rootDiag = buildContextualDiagnosisResult({
    commodity: 'Padi',
    plantPart: 'Akar',
    symptomNotes: 'Akar menghitam pekat bau belerang',
  });
  assert.ok(rootDiag.geminiAnalysisAnswer && rootDiag.geminiAnalysisAnswer.includes('Gemini AI 3.8 Flash'));
  assert.ok(!rootDiag.geminiAnalysisAnswer!.toLowerCase().includes('argon'));
  assert.ok(rootDiag.aiModelUsed?.includes('Gemini AI 3.8 Flash'));

  const camReply = buildSmartAgriFallbackReply('Apa obat terbaik untuk hasil kamera ini?', {
    farmerName: 'Pak Budi Santoso',
    cameraDiagnosis: {
      detectedName: rootDiag.detectedName,
      scientificName: rootDiag.scientificName,
      plantPart: rootDiag.plantPart,
      commodity: rootDiag.commodity,
      confidencePct: rootDiag.confidencePct,
      visualObservations: rootDiag.visualObservations,
      recommendedProductsSummary: 'Bactocyn 150 AL, Nordox 56 WP',
    },
  });
  assert.ok(camReply.includes('Analisis Kamera Gemini AI 3.8 Flash'));
  assert.ok(camReply.includes(rootDiag.detectedName));
  assert.ok(!camReply.toLowerCase().includes('argon'));

  // 7. AGRI_SYSTEM_INSTRUCTION and GEMINI_AGRI_GENERATION_CONFIG follow anti-hallucination & synchronization rules
  assert.ok(AGRI_SYSTEM_INSTRUCTION.includes('AKURAT, NYATA, DAN ANTI-HALUSINASI'));
  assert.ok(AGRI_SYSTEM_INSTRUCTION.includes('Opsi 1'));
  assert.ok(AGRI_SYSTEM_INSTRUCTION.includes('Opsi 2'));
  assert.equal(GEMINI_AGRI_GENERATION_CONFIG.temperature, 0.3);
  assert.equal(GEMINI_AGRI_GENERATION_CONFIG.topP, 0.85);

  // 8. Question-to-Answer Synchronization: "bantu saya tentang padi ketan" answers Padi Ketan cultivation directly without generic organ inspection template
  const ketanReply = buildSmartAgriFallbackReply('bantu saya tentang padi ketan', {
    farmerName: 'Pak Budi Santoso',
  });
  assert.ok(ketanReply.includes('Padi Ketan'));
  assert.ok(ketanReply.includes('Jarak Tanam'));
  assert.ok(!ketanReply.includes('Langkah Cek Cepat Organ Tanaman'));

  // 9. Ambiguous symptom ("daun kuning") lists 2-3 possibilities and asks for physical confirmation
  const yellowLeafReply = buildSmartAgriFallbackReply('daun kuning', {
    farmerName: 'Pak Budi Santoso',
  });
  assert.ok(yellowLeafReply.includes('Kemungkinan 1'));
  assert.ok(yellowLeafReply.includes('Kemungkinan 2'));
  assert.ok(yellowLeafReply.includes('Kemungkinan 3'));
  assert.ok(yellowLeafReply.includes('Konfirmasi Ciri Fisik'));
});


