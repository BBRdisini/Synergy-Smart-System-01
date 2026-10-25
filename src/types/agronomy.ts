export type CommodityType =
  | 'Padi'
  | 'Kacang Hijau'
  | 'Jagung'
  | 'Cabai'
  | 'Kedelai'
  | 'Bawang Merah'
  | 'Tomat'
  | 'Kentang'
  | 'Kakao'
  | 'Lainnya';

export type PlantingSeasonMT =
  | 'MT1 Penghujan (Nov–Feb)'
  | 'MT2 Gadu / Peralihan (Mar–Jun)'
  | 'MT3 Kemarau / Palawija (Jul–Okt)';

export type PhaseStatus =
  | 'Belum Dimulai'
  | 'Terjadwal'
  | 'Sedang Berjalan'
  | 'Aktif'
  | 'Selesai'
  | 'Terlewat';

export type CultivationSystem = string;
export type RiceStageOrder = number;

export type OfficialDiseaseId =
  | 'blas_daun'
  | 'kresek_hdb'
  | 'bercak_coklat'
  | 'hawar_pelepah'
  | 'bercak_coklat_sempit'
  | 'tungro'
  | 'hama_putih_palsu'
  | 'wereng_batang_coklat'
  | 'sundep_beluk'
  | 'kahat_n'
  | 'kahat_k_fe'
  | 'antraknosa_cabai'
  | 'hawar_daun_jagung'
  | 'tanaman_sehat'
  | 'busuk_akar_keracunan_besi'
  | 'hama_akar_orong_nematoda'
  | 'akar_sehat_optimal'
  | 'blas_leher_malai'
  | 'walang_sangit_gabah'
  | 'kotor_bulir_gabah';


/**
 * Profil Tanaman (Dashboard Plant Profile Management)
 */
export interface CropProfile {
  id: string;
  ownerId: string;
  plotId?: string;
  namaTanaman: string;
  jenis: string;
  tanggalTanam: string;
  persyaratanNutrisi: string;
  kebutuhanAir: string;
  toleransiSuhu: string;
  minTempC?: number;
  maxTempC?: number;
  tempMinC?: number;
  tempMaxC?: number;
  moistureMinPct?: number;
  moistureMaxPct?: number;
  catatanKhusus: string;
  linkedFarmId?: string;
  updatedAt: string;
}

/**
 * Peringatan Dini AI (Dashboard AI Predictive Alert)
 */
export interface AiPredictiveAlert {
  id: string;
  severity: 'Tinggi' | 'Sedang' | 'Rendah' | 'Kritis' | 'Waspada';
  category: 'Risiko Penyakit' | 'Kekurangan Air' | 'Potensi Hama' | 'Stres Suhu & Nutrisi';
  riskCategory:
    | 'Penyakit Tanaman'
    | 'Kekurangan Air'
    | 'Serangan Hama'
    | 'Defisiensi Nutrisi'
    | 'Stres Suhu & Iklim';
  confidencePct: number;
  title: string;
  targetName: string;
  cropName: string;
  plotId?: string;
  predictionSummary: string;
  predictedTrigger: string;
  triggerFactors: string[];
  actionableSteps: string[];
  recommendedTaskTitle: string;
  sourceBasis: string;
  createdAt: string;
  isPriorityDiagnosis?: boolean;
  diagnosisId?: string;
  scientificName?: string;
  urgencyLevel?: 'Tinggi' | 'Sedang' | 'Rendah';
}

/**
 * Sel Peta Panas Lahan (Interactive Heatmap Sector)
 */
export interface HeatmapSector {
  id: string;
  row: number;
  col: number;
  sectorCode: string;
  farmName?: string;
  sectionName?: string;
  plotName?: string;
  riskScore: number; // 0-100
  statusLevel?: 'Optimal' | 'Perlu Pantau' | 'Perhatian Tinggi' | 'Waspada';
  riskCategory?: 'Optimal' | 'Perlu Pantau' | 'Perhatian Tinggi' | 'Waspada';
  soilMoisturePct?: number;
  moisturePct?: number;
  soilPh?: number;
  ph?: number;
  tempC?: number;
  issueSummary?: string;
  primaryIssue?: string;
  recommendedAction: string;
}

/**
 * 14 Tahap Siklus Budidaya Padi (Tahap 1 Section D)
 */
export interface RiceLifecycleStage {
  stageNumber: number;
  order: number;
  id: string;
  name: string;
  description: string;
  objective?: string;
  recommendedActions: string[];
  successIndicators?: string[];
  commonRisks?: string[];
  estimatedDayStart: number;
  estimatedDayEnd: number;
  hstStart: number;
  hstEnd: number;
  estimatedDateStart: string;
  estimatedDateEnd: string;
  estimatedStartDate: string;
  estimatedEndDate: string;
  status: PhaseStatus;
  notes: string;
  recommendationSource: string;
  confirmedByFarmerAt?: string;
}

/**
 * Entitas 2: Farms (Lahan)
 */
export interface FarmEntity {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  area?: number;
  unit?: 'Ha' | 'm2' | 'ha';
  areaValue?: number;
  areaUnit?: 'Ha' | 'm2' | 'ha';
  areaHaNormalized: number;
  soilType: string;
  waterSource: string;
  status?: 'Aktif' | 'Diarsipkan';
  isArchived?: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Entitas 3: GrowingSeasons (Musim Tanam Padi)
 */
export interface GrowingSeasonEntity {
  id: string;
  ownerId: string;
  farmId: string;
  farmName: string;
  commodity: 'Padi' | CommodityType;
  variety: string;
  plantedAreaHa: number;
  startDate: string;
  seedingDate?: string;
  plantingDate: string;
  cultivationSystem: string;
  currentStageIndex?: number; // 1..14
  currentStageOrder: number;
  currentStageName: string;
  currentHst: number;
  targetYieldKg: number;
  status: 'Aktif' | 'Selesai Panen' | 'Selesai' | 'Dibatalkan';
  estimatedHarvestDate: string;
  harvestWindowEnd?: string;
  initialSoilConditionNotes?: string;
  initialSoilCondition?: string;
  previousCropHistory?: string;
  notes: string;
  stages: RiceLifecycleStage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Entitas 4: CultivationTasks (Kegiatan Kalender Musim Tanam)
 */
export interface CultivationTaskEntity {
  id: string;
  ownerId: string;
  seasonId: string;
  farmId: string;
  farmName?: string;
  stageNumber?: number;
  stageOrder?: number;
  category?: string;
  activityType?:
    | 'Persiapan Lahan'
    | 'Persiapan Benih'
    | 'Persemaian'
    | 'Penanaman'
    | 'Adaptasi Awal'
    | 'Pemupukan'
    | 'Pengairan'
    | 'Penyiangan Gulma'
    | 'Pemantauan Hama & Penyakit'
    | 'Pembungaan & Pengisian'
    | 'Panen'
    | 'Pascapanen'
    | string;
  title: string;
  scheduledDate: string;
  status: 'Terjadwal' | 'Selesai' | 'Terlambat' | 'Dijadwalkan Ulang' | 'Ditunda' | 'Dilewati';
  priority: 'Tinggi' | 'Sedang' | 'Normal';
  notes: string;
  completedDate?: string;
  recommendationSource: string;
  createdAt?: string;
}

/**
 * Entitas 5: ActivityLogs (Pencatatan Aktivitas Pelaksanaan)
 */
export interface SeasonActivityLog {
  id: string;
  ownerId: string;
  farmId: string;
  seasonId: string;
  activityType: string;
  executionDate: string;
  inputUsed: string;
  quantity: number;
  unit: string;
  unitCostRp?: number;
  unitPriceRp?: number;
  actualCostRp: number;
  notes: string;
  linkedTaskId?: string;
  createdAt: string;
}

/**
 * Entitas 6: ExpenseRecords (Transaksi Biaya Musim Tanam)
 */
export interface SeasonExpenseRecord {
  id: string;
  ownerId: string;
  seasonId: string;
  farmId: string;
  farmName?: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceRp: number;
  totalRp: number;
  date: string;
  notes: string;
  linkedActivityId?: string;
  createdAt?: string;
}

/**
 * Entitas 7: HarvestRecords (Pencatatan Panen Bertahap / Akhir)
 */
export interface SeasonHarvestRecord {
  id: string;
  ownerId: string;
  seasonId: string;
  farmId: string;
  farmName?: string;
  harvestDate: string;
  harvestedAreaHa: number;
  actualYieldKg: number;
  moisturePct?: number;
  sellingPricePerKgRp: number;
  grossRevenueRp: number;
  harvestCostRp: number;
  qualityNotes?: string;
  notes?: string;
  createdAt: string;
}

export interface CultivationPhaseItem {
  phaseNumber: number;
  id: string;
  name: string;
  hstRange: string;
  minHst: number;
  maxHst: number;
  status: PhaseStatus;
  description: string;
  checklist: {
    id: string;
    label: string;
    completed: boolean;
  }[];
  agronomicNotes: string;
}

export interface SoilObservation {
  id: string;
  plotId: string;
  recordedAt: string;
  ph: number;
  moisturePct: number;
  soilTempC: number;
  waterCondition: 'Tergenang Ideal (3-5 cm)' | 'Lembap / Macak-macak' | 'Kering' | 'Berlebih / Banjir';
  sourceType: 'Input Manual Petani' | 'Alat Ukur Tanah / pH Meter' | 'Sensor IoT Lahan';
  notes: string;
}

export interface FarmPlot {
  id: string;
  ownerId?: string;
  name: string;
  locationVillage: string;
  locationDistrict: string;
  locationRegency: string;
  coordinates?: { lat: number; lon: number };
  areaHa: number;
  ownershipStatus: 'Milik Sendiri' | 'Sewa' | 'Bagi Hasil' | 'Kelompok Tani';
  soilType: 'Aluvial' | 'Latosol' | 'Regosol' | 'Grumosol' | 'Andosol' | 'Belum Diketahui';
  irrigationSource: 'Irigasi Teknis' | 'Irigasi Setengah Teknis' | 'Tadah Hujan' | 'Pompa Sumur Bor';
  commodity: CommodityType;
  variety: string;
  plantingSystem:
    | 'Jajar Legowo 2:1'
    | 'Jajar Legowo 4:1'
    | 'Tegel (25x25 cm)'
    | 'SRI (System of Rice Intensification)'
    | 'Tanam Benih Langsung (Tabela)'
    | 'Bedengan / Mulsa';
  seedingDate?: string;
  plantingDate: string;
  targetYieldTonPerHa: number;
  seasonStatus: 'Aktif' | 'Persiapan' | 'Panen Selesai' | 'Diarsipkan';
  currentHst: number;
  daysAfterPlanting?: number;
  currentPhaseName: string;
  estimatedHarvestDate: string;
  harvestUncertaintyDays: number;
  notes: string;
  isDemoData?: boolean;
  phases: CultivationPhaseItem[];
  soilObservation: SoilObservation;
}

export interface ScheduledTask {
  id: string;
  plotId: string;
  plotName: string;
  commodity: CommodityType;
  title: string;
  category:
    | 'Persiapan Lahan'
    | 'Persemaian'
    | 'Penanaman'
    | 'Pemupukan'
    | 'Pengairan'
    | 'Pemeriksaan Gulma'
    | 'Pemeriksaan Hama & Penyakit'
    | 'Penyemprotan Tervalidasi'
    | 'Pembungaan & Pengisian Gabah'
    | 'Panen & Pascapanen';
  dateLabel: string;
  isoDate: string;
  timeSlot: string;
  completed: boolean;
  isOverdue?: boolean;
  dosageOrNote?: string;
  phaseNumber: number;
}

export interface ActivityLogItem {
  id: string;
  plotId: string;
  plotName: string;
  commodity: CommodityType;
  dateLabel: string;
  isoDate: string;
  title: string;
  category: 'Tanam' | 'Pemupukan' | 'Penyemprotan' | 'Pengamatan' | 'Pengairan' | 'Panen';
  detail: string;
}

export interface ExpenseRecord {
  id: string;
  plotId: string;
  plotName: string;
  date: string;
  category: 'Benih' | 'Pupuk' | 'Pestisida' | 'Tenaga Kerja' | 'Sewa Alat & Olah Lahan' | 'Panen & Pascapanen' | 'Lainnya';
  itemName: string;
  quantity: number;
  unit: string;
  unitPriceRp: number;
  totalRp: number;
  isActual: boolean;
}

export interface HarvestRecord {
  id: string;
  plotId: string;
  plotName: string;
  commodity: CommodityType;
  variety: string;
  harvestDate: string;
  grossYieldKg: number;
  moistureContentPct: number;
  estimatedLossPct: number;
  netYieldKg: number;
  sellingPricePerKgRp: number;
  totalRevenueRp: number;
  notes: string;
}

export interface PesticideProduct {
  id: string;
  productName: string;
  alternativeBrands?: string[];
  manufacturer: string;
  registrationNumber: string;
  registrationStatus: 'Terdaftar Resmi Kementan RI' | 'Perlu Verifikasi Ulang';
  category:
    | 'Fungisida'
    | 'Insektisida'
    | 'Bakterisida'
    | 'Bakterisida & Fungisida'
    | 'Herbisida'
    | 'Agensia Hayati & Pembenah Akar'
    | 'Nutrisi & Pemulihan Fisiologis';
  activeIngredient: string;
  concentration: string;
  modeOfActionGroup?: string;
  formulation:
    | 'EC (Emulsifiable Concentrate)'
    | 'WP (Wettable Powder)'
    | 'SC (Suspension Concentrate)'
    | 'WG (Water Dispersible Granule)'
    | 'SG / GR / SL (Granul & Larutan Air)';
  allowedCommodities: CommodityType[];
  targetOrganisms: string[];
  dosagePerLiter: string;
  dosagePer16LTank?: string;
  dosagePerHaEstimate: string;
  sprayVolumePerHa: string;
  applicationMethod: string;
  applicationInterval: string;
  preHarvestIntervalDays: number;
  requiredApd: ('Masker Respirator' | 'Sarung Tangan Nitril' | 'Kacamata Pelindung' | 'Pakaian Lengan Panjang' | 'Sepatu Boot')[];
  safetyWarnings: string[];
  resistanceWarning: string;
  labelSource: string;
  verificationDate: string;
  dataVersion: string;
}

export interface DiagnosisSupportingRecommendation {
  category:
    | 'Agensia Hayati & Organik'
    | 'Pemupukan & Pembenah Tanah/Akar'
    | 'Perlakuan Fisik & Air'
    | 'Agensia Hayati & Bio-Pestisida'
    | 'Pembenah Tanah & Akar'
    | 'Nutrisi & Pemulihan Fisiologis'
    | 'Sanitasi & Pengelolaan Air';
  title: string;
  activeSubstancesAndBrands: string;
  materialsAndBrands?: string[];
  dosageAndApplication: string;
  agronomicBenefit?: string;
}

export interface DiagnosisResult {
  id: string;
  timestamp: string;
  plotId?: string;
  commodity: CommodityType;
  plantPart: 'Daun' | 'Batang' | 'Malai / Bunga' | 'Akar' | 'Buah / Gabah' | 'Keseluruhan Tanaman';
  detectedPlantPartFromPhoto?: 'Daun' | 'Batang' | 'Malai / Bunga' | 'Akar' | 'Buah / Gabah' | 'Keseluruhan Tanaman';
  organSpecificAnatomyCheck?: string;
  samplePresetId?: string;
  matchedDiseaseId?: OfficialDiseaseId;
  visualObservations?: string;
  differentialReasoning?: string;
  imageQualityStatus: 'Tajam & Jelas' | 'Kurang Fokus / Perlu Foto Ulang';
  detectedName: string;
  scientificName: string;
  causeCategory:
    | 'Penyakit Jamur'
    | 'Penyakit Bakteri'
    | 'Penyakit Virus'
    | 'Serangan Hama'
    | 'Gangguan Perakaran & Toksisitas Tanah'
    | 'Hama Perakaran & Tanah'
    | 'Defisiensi Nutrisi'
    | 'Defisiensi Hara'
    | 'Stres Lingkungan / Belum Pasti'
    | 'Tanaman Sehat';
  confidencePct: number;
  urgencyLevel: 'Tinggi' | 'Sedang' | 'Rendah';
  visibleSymptoms: string[];
  visualEvidenceSummary: string;
  diseaseInfoSummary: string;
  alternativeDiagnoses: {
    name: string;
    distinguishingCheck: string;
  }[];
  missingInformation: string[];
  followUpFieldChecks: string[];
  nonChemicalIpmActions: string[];
  biologicalAndSupportingRecommendations?: DiagnosisSupportingRecommendation[];
  verifiedProductIds: string[];
  validationStatus: 'Terverifikasi Basis Pengetahuan Agronomi' | 'Dugaan Awal — Perlu Konfirmasi Penyuluh';
  sourceReferences: string[];
  aiModelUsed: string;
  geminiAnalysisAnswer?: string;
}

export interface PestDiseaseCatalogItem {
  id: string;
  name: string;
  scientificName: string;
  category: 'Penyakit' | 'Hama' | 'Defisiensi Hara';
  commodity: CommodityType;
  visualKey: 'blas' | 'tungro' | 'wereng' | 'penggerek' | 'hawar' | 'kahat_n' | 'antraknosa';
  shortSummary: string;
  symptoms: string[];
  triggerConditions: string;
  ipmControl: string[];
  verifiedProductIds: string[];
  sourceReference: string;
}

export interface AgronomyGuideModule {
  id: string;
  commodity: CommodityType;
  title: string;
  subtitle: string;
  category: 'Budidaya Lengkap' | 'Pengendalian Hama & Penyakit' | 'Pemupukan Berimbang' | 'Pengairan Berselang' | 'Varietas Unggul' | 'Pascapanen';
  readingTimeMinutes: number;
  updatedAt: string;
  applicableRegion: string;
  sourceReference: string;
  reliabilityLevel: 'Standar Resmi Balitbangtan / BRMP Kementan' | 'Panduan Penyuluhan Lapangan';
  keyPoints: string[];
  steps: {
    stepTitle: string;
    detail: string;
  }[];
}

export type WeatherConditionLabel =
  | 'Cerah'
  | 'Cerah Malam'
  | 'Cerah Berawan'
  | 'Berawan'
  | 'Berawan Tebal / Kabut'
  | 'Hujan Ringan'
  | 'Hujan Sedang'
  | 'Hujan Lebat'
  | 'Hujan Petir'
  | 'Hujan Lebat Disertai Petir';

export interface WeatherHourlyPoint {
  timeIso: string;
  hourLabel: string;
  tempC: number;
  rainProbabilityPct: number;
  precipitationMm: number;
  weatherCode: number;
  condition: WeatherConditionLabel;
}

export interface WeatherForecastDay {
  dayName: string;
  formattedDate?: string;
  dateStr: string;
  weatherCode?: number;
  condition: WeatherConditionLabel;
  tempMaxC: number;
  tempMinC: number;
  rainChancePct: number;
  rainfallMm: number;
  windSpeedMaxKmh?: number;
}

export interface WeatherSnapshot {
  locationName: string;
  latitude?: number;
  longitude?: number;
  locationSource?:
    | 'GPS Browser Akurat'
    | 'Lokasi Terpilih Presisi'
    | 'Koordinat Presisi Desa Larikrejo, Kudus';
  gpsAccuracyMeters?: number;
  gpsPermissionStatus?: 'granted' | 'denied' | 'prompt' | 'manual';
  gpsErrorMessage?: string;
  bmkgAdm4Code?: string;
  tempC: number;
  apparentTempC?: number;
  weatherCode?: number;
  isDay?: boolean;
  conditionText: string;
  humidityPct: number;
  rainfallMm: number;
  rainMm?: number;
  rainProbabilityPct: number;
  windSpeedKmh: number;
  windDirectionDeg?: number;
  windDirectionCardinal?: string;
  updatedAt: string;
  fetchedAtIso?: string;
  sourceName: string;
  providerMode?: 'open-meteo' | 'bmkg-hybrid';
  isLiveApi: boolean;
  sprayingAdvisory: {
    status:
      | 'Kondusif untuk Pemupukan & Penyemprotan PHT'
      | 'Kurang Kondusif / Tunda Penyemprotan & Pemupukan'
      | 'Kondusif'
      | 'Waspada Angin/Hujan'
      | 'Tunda Penyemprotan';
    isCondusive?: boolean;
    recommendation: string;
    limitingFactors?: string[];
  };
  hourlyForecast?: WeatherHourlyPoint[];
  forecast: WeatherForecastDay[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: string;
  village: string;
  emailOrPhone: string;
  isLoggedIn: boolean;
  privacyConsentAccepted: boolean;
  createdAt?: string;
  // Extended Farmer Account & Profile Fields (Full CRUD & Avatar)
  avatarDataUrl?: string;
  phoneWhatsapp?: string;
  email?: string;
  villageName?: string;
  districtName?: string;
  regencyName?: string;
  provinceName?: string;
  latitude?: number;
  longitude?: number;
  poktanName?: string;
  kartuTaniNumber?: string;
  mainCommodity?: CommodityType;
  irrigationSystem?: 'Teknis' | 'Setengah Teknis' | 'Tadah Hujan';
  plantingSeasonMT?: PlantingSeasonMT;
  updatedAt?: string;
}

export interface OptChemicalGuide {
  activeIngredient: string;
  category: 'Fungisida' | 'Bakterisida' | 'Insektisida' | 'Akarisida' | 'Pupuk Daun / Imunitas';
  registeredBrands: string;
  dosagePer16LTank: string;
  dosagePerArea: string;
  applicationNotes: string;
}

export interface EpidemiologyOptAlert {
  id: string;
  optName: string;
  scientificName: string;
  targetCommodity: CommodityType | 'Padi & Palawija';
  category: 'Penyakit Jamur' | 'Penyakit Bakteri' | 'Serangan Hama' | 'Kompleks Hama & Jamur Palawija';
  riskLevel: 'Tinggi / Siaga' | 'Waspada' | 'Terkendali';
  riskScorePct: number;
  plantingSeasonMT: PlantingSeasonMT;
  cropAgeHstLabel: string;
  weatherTriggerHeadline: string;
  // 6 Comprehensive Solution Sections for Farmer Popup Modal
  whyItThreatensNow: string;
  earlyFieldSymptoms: string[];
  culturalPreventionSteps: string[];
  biologicalOrganicControl: {
    agentName: string;
    practicalDosage: string;
    applicationMethod: string;
  }[];
  chemicalControlGuides: OptChemicalGuide[];
  bestSprayingWindowToday: {
    statusLabel: string;
    recommendedHours: string;
    weatherReasoning: string;
  };
  recommendedAgendaTaskTitle: string;
  recommendedAgendaDosageNote: string;
}
