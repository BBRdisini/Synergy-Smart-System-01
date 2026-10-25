import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Camera,
  CheckCircle2,
  Droplets,
  Edit3,
  Flame,
  Grid,
  Leaf,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Sprout,
  Thermometer,
  Trash2,
  X,
} from 'lucide-react';
import {
  AiPredictiveAlert,
  CommodityType,
  CropProfile,
  DiagnosisResult,
  EpidemiologyOptAlert,
  FarmPlot,
  HeatmapSector,
  PlantingSeasonMT,
  WeatherSnapshot,
} from '../types/agronomy';
import {
  buildIntelligentDiagnosisRecommendationSummary,
  generatePredictiveAiAlerts,
} from '../utils/agronomyCalculations';
import {
  detectDefaultPlantingSeasonMT,
  generateRealTimeEpidemiologyOptAlerts,
} from '../utils/epidemiologyOptEngine';
import { OptSolutionPopupModal } from './OptSolutionPopupModal';

interface TelemetryPoint {
  dateLabel: string;
  isoDate: string;
  tempC: number;
  humidityPct: number;
  soilMoisturePct: number;
  rainfallMm: number;
}

interface SectionYieldItem {
  id: string;
  sectionLabel: string;
  variety: string;
  areaHa: number;
  actualTonPerHa: number;
  targetTonPerHa: number;
  totalKg: number;
  seasonLabel: string;
}

interface DashboardAnalyticsAndProfilesProps {
  ownerId: string;
  plots: FarmPlot[];
  cropProfiles: CropProfile[];
  weather: WeatherSnapshot;
  heatmapSectors: HeatmapSector[];
  telemetrySeries: TelemetryPoint[];
  sectionYieldComparison: SectionYieldItem[];
  latestDiagnosis?: DiagnosisResult | null;
  diagnosisHistory?: DiagnosisResult[];
  isNewPriorityDiagnosis?: boolean;
  plantingSeasonMT?: PlantingSeasonMT;
  mainCommodity?: CommodityType;
  onSaveCropProfile: (profile: CropProfile) => void;
  onDeleteCropProfile: (profileId: string) => void;
  onScheduleAlertAction: (alert: AiPredictiveAlert) => void;
  onAddOptSprayToAgenda?: (alert: EpidemiologyOptAlert) => void;
  onOpenCameraDiagnosis?: () => void;
}

export const DashboardAnalyticsAndProfiles: React.FC<DashboardAnalyticsAndProfilesProps> = ({
  ownerId,
  plots,
  cropProfiles,
  weather,
  heatmapSectors,
  telemetrySeries,
  sectionYieldComparison,
  latestDiagnosis,
  diagnosisHistory,
  isNewPriorityDiagnosis = false,
  plantingSeasonMT,
  mainCommodity,
  onSaveCropProfile,
  onDeleteCropProfile,
  onScheduleAlertAction,
  onAddOptSprayToAgenda,
  onOpenCameraDiagnosis,
}) => {
  // Plant Profile Modal & Form State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [namaTanaman, setNamaTanaman] = useState('');
  const [jenis, setJenis] = useState('');
  const [plotId, setPlotId] = useState(plots[0]?.id || 'lahan-1');
  const [tanggalTanam, setTanggalTanam] = useState('2025-04-12');
  const [persyaratanNutrisi, setPersyaratanNutrisi] = useState('');
  const [kebutuhanAir, setKebutuhanAir] = useState('');
  const [toleransiSuhu, setToleransiSuhu] = useState('22°C – 32°C');
  const [tempMinC, setTempMinC] = useState(22);
  const [tempMaxC, setTempMaxC] = useState(32);
  const [moistureMinPct, setMoistureMinPct] = useState(65);
  const [moistureMaxPct, setMoistureMaxPct] = useState(85);
  const [catatanKhusus, setCatatanKhusus] = useState('');
  const [formError, setFormError] = useState('');

  const primarySoil = plots[0]?.soilObservation;
  const activePriorityDiagnosis = latestDiagnosis || diagnosisHistory?.[0] || null;

  const resolvedDiagnosisPlotName = useMemo(() => {
    if (!activePriorityDiagnosis) return undefined;
    const matchedPlot =
      plots.find((p) => p.id === activePriorityDiagnosis.plotId) || plots[0];
    if (matchedPlot) {
      return `${matchedPlot.commodity} ${matchedPlot.variety} — ${matchedPlot.name}`;
    }
    return `${activePriorityDiagnosis.commodity} (${activePriorityDiagnosis.plantPart}) — Lahan 1`;
  }, [activePriorityDiagnosis, plots]);

  // AI Predictive Alert State — automatically initialized & synchronized with latest diagnosis
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [aiExtraNote, setAiExtraNote] = useState<string>(() => {
    if (activePriorityDiagnosis) {
      return buildIntelligentDiagnosisRecommendationSummary({
        diagnosis: activePriorityDiagnosis,
        weatherTempC: weather.tempC,
        weatherHumidityPct: weather.humidityPct,
        soilMoisturePct: primarySoil?.moisturePct ?? 62,
        plotName: resolvedDiagnosisPlotName,
      });
    }
    return 'Analisis prediktif aktif memantau korelasi profil tanaman terhadap kelembapan udara, suhu kanopi, dan kelembapan tanah.';
  });
  const [scheduledAlertIds, setScheduledAlertIds] = useState<string[]>([]);

  // Automatically trigger intelligent recommendation update whenever diagnosis changes
  useEffect(() => {
    if (activePriorityDiagnosis) {
      setAiExtraNote(
        buildIntelligentDiagnosisRecommendationSummary({
          diagnosis: activePriorityDiagnosis,
          weatherTempC: weather.tempC,
          weatherHumidityPct: weather.humidityPct,
          soilMoisturePct: primarySoil?.moisturePct ?? 62,
          plotName: resolvedDiagnosisPlotName,
        })
      );
    }
  }, [
    activePriorityDiagnosis?.id,
    activePriorityDiagnosis?.detectedName,
    activePriorityDiagnosis?.confidencePct,
    weather.tempC,
    weather.humidityPct,
    primarySoil?.moisturePct,
    resolvedDiagnosisPlotName,
  ]);

  // Interactive Chart & Heatmap State
  const [activeChartTab, setActiveChartTab] = useState<'line' | 'bar' | 'heatmap'>('line');
  const [lineRangeDays, setLineRangeDays] = useState<7 | 14>(14);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number>(telemetrySeries.length - 1);
  const [selectedSector, setSelectedSector] = useState<HeatmapSector>(
    heatmapSectors.find((s) => (s as any).riskCategory === 'Perhatian Tinggi') || heatmapSectors[0]
  );

  // Real-Time Epidemiological OPT Early Warning State & Popup Modal
  const [selectedSeasonMT, setSelectedSeasonMT] = useState<PlantingSeasonMT>(
    plantingSeasonMT || detectDefaultPlantingSeasonMT()
  );
  const [selectedOptAlertModal, setSelectedOptAlertModal] = useState<EpidemiologyOptAlert | null>(
    null
  );

  useEffect(() => {
    if (plantingSeasonMT) {
      setSelectedSeasonMT(plantingSeasonMT);
    }
  }, [plantingSeasonMT]);

  const realTimeOptAlerts = useMemo(() => {
    return generateRealTimeEpidemiologyOptAlerts({
      weather,
      plots,
      plantingSeasonMT: selectedSeasonMT,
      mainCommodity,
    });
  }, [weather, plots, selectedSeasonMT, mainCommodity]);

  const predictiveAlerts = useMemo(() => {
    return generatePredictiveAiAlerts({
      profiles: cropProfiles,
      weatherTempC: weather.tempC,
      weatherHumidityPct: weather.humidityPct,
      rainfallMm: weather.rainfallMm,
      windSpeedKmh: weather.windSpeedKmh,
      soilMoisturePct: primarySoil?.moisturePct ?? 62,
      soilPh: primarySoil?.ph ?? 6.5,
      soilTempC: primarySoil?.soilTempC ?? 23,
      latestDiagnosis: activePriorityDiagnosis,
      diagnosisPlotName: resolvedDiagnosisPlotName,
    });
  }, [
    cropProfiles,
    weather,
    primarySoil,
    activePriorityDiagnosis,
    resolvedDiagnosisPlotName,
  ]);

  const handleOpenAddModal = () => {
    setEditingProfileId(null);
    setNamaTanaman('');
    setJenis('Padi Inbrida — Varietas Inpari 32 HDB');
    setPlotId(plots[0]?.id || 'lahan-1');
    setTanggalTanam('2025-04-15');
    setPersyaratanNutrisi('Urea 200 kg/Ha + NPK Phonska 300 kg/Ha (3 tahap sesuai BWD)');
    setKebutuhanAir('Pengairan berselang (AWD) macak-macak 3–5 cm; kelembapan 65–85%');
    setToleransiSuhu('22°C – 32°C (Optimal pembentukan anakan)');
    setTempMinC(22);
    setTempMaxC(32);
    setMoistureMinPct(65);
    setMoistureMaxPct(85);
    setCatatanKhusus('');
    setFormError('');
    setShowProfileModal(true);
  };

  const handleOpenEditModal = (profile: CropProfile) => {
    setEditingProfileId(profile.id);
    setNamaTanaman(profile.namaTanaman);
    setJenis(profile.jenis);
    setPlotId((profile as any).plotId || plots[0]?.id || 'lahan-1');
    setTanggalTanam(profile.tanggalTanam);
    setPersyaratanNutrisi(profile.persyaratanNutrisi);
    setKebutuhanAir(profile.kebutuhanAir);
    setToleransiSuhu(profile.toleransiSuhu);
    setTempMinC((profile as any).tempMinC ?? profile.minTempC ?? 22);
    setTempMaxC((profile as any).tempMaxC ?? profile.maxTempC ?? 32);
    setMoistureMinPct((profile as any).moistureMinPct ?? 65);
    setMoistureMaxPct((profile as any).moistureMaxPct ?? 85);
    setCatatanKhusus(profile.catatanKhusus);
    setFormError('');
    setShowProfileModal(true);
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaTanaman.trim() || !jenis.trim() || !tanggalTanam) {
      setFormError('Nama tanaman, jenis varietas, dan tanggal tanam wajib diisi.');
      return;
    }
    if (tempMinC >= tempMaxC) {
      setFormError('Suhu minimum harus lebih kecil dari suhu maksimum.');
      return;
    }

    const newProfile: any = {
      id: editingProfileId || `prof-${Date.now()}`,
      ownerId,
      plotId,
      namaTanaman: namaTanaman.trim(),
      jenis: jenis.trim(),
      tanggalTanam,
      persyaratanNutrisi:
        persyaratanNutrisi.trim() || 'NPK berimbang 300 kg/Ha + Urea bertahap sesuai BWD',
      kebutuhanAir:
        kebutuhanAir.trim() || `Kelembapan tanah optimal ${moistureMinPct}%–${moistureMaxPct}%`,
      toleransiSuhu: toleransiSuhu.trim() || `${tempMinC}°C – ${tempMaxC}°C`,
      minTempC: Number(tempMinC),
      maxTempC: Number(tempMaxC),
      tempMinC: Number(tempMinC),
      tempMaxC: Number(tempMaxC),
      moistureMinPct: Number(moistureMinPct),
      moistureMaxPct: Number(moistureMaxPct),
      catatanKhusus: catatanKhusus.trim() || 'Pantau kondisi daun dan kelembapan tanah rutin.',
      updatedAt: new Date().toISOString(),
    };

    onSaveCropProfile(newProfile);
    setShowProfileModal(false);
  };

  const handleRefreshAiPredictions = async () => {
    setAiRefreshing(true);
    try {
      const res = await fetch('/api/ai/predict-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profiles: cropProfiles,
          weatherTempC: weather.tempC,
          weatherHumidityPct: weather.humidityPct,
          rainfallMm: weather.rainfallMm,
          windSpeedKmh: weather.windSpeedKmh,
          soilMoisturePct: primarySoil?.moisturePct ?? 62,
          soilPh: primarySoil?.ph ?? 6.5,
          soilTempC: primarySoil?.soilTempC ?? 23,
          latestDiagnosis: activePriorityDiagnosis,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (activePriorityDiagnosis) {
          const diagSummary = buildIntelligentDiagnosisRecommendationSummary({
            diagnosis: activePriorityDiagnosis,
            weatherTempC: weather.tempC,
            weatherHumidityPct: weather.humidityPct,
            soilMoisturePct: primarySoil?.moisturePct ?? 62,
            plotName: resolvedDiagnosisPlotName,
          });
          setAiExtraNote(
            data.aiAdvisoryNote ? `${diagSummary} • ${data.aiAdvisoryNote}` : diagSummary
          );
        } else if (data.aiAdvisoryNote) {
          setAiExtraNote(data.aiAdvisoryNote);
        } else {
          setAiExtraNote(
            `Diperbarui pukul ${new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })} WIB: ${predictiveAlerts.length} prediksi aktif dianalisis dari ${
              cropProfiles.length
            } profil tanaman.`
          );
        }
      }
    } catch {
      if (activePriorityDiagnosis) {
        setAiExtraNote(
          buildIntelligentDiagnosisRecommendationSummary({
            diagnosis: activePriorityDiagnosis,
            weatherTempC: weather.tempC,
            weatherHumidityPct: weather.humidityPct,
            soilMoisturePct: primarySoil?.moisturePct ?? 62,
            plotName: resolvedDiagnosisPlotName,
          })
        );
      } else {
        setAiExtraNote('Analisis lokal selesai menggunakan parameter agronomi BB Padi.');
      }
    } finally {
      setAiRefreshing(false);
    }
  };

  // Filtered Line Chart points
  const visibleTelemetry = useMemo(() => {
    return lineRangeDays === 7 ? telemetrySeries.slice(-7) : telemetrySeries;
  }, [telemetrySeries, lineRangeDays]);

  const safePointIdx = Math.min(
    visibleTelemetry.length - 1,
    Math.max(0, selectedPointIdx >= visibleTelemetry.length ? visibleTelemetry.length - 1 : selectedPointIdx)
  );
  const inspectedPoint = visibleTelemetry[safePointIdx] || visibleTelemetry[visibleTelemetry.length - 1];

  return (
    <div className="space-y-4">
      {/* =====================================================================
          0. PREDIKSI RISIKO OPT (HAMA & PENYAKIT) REAL-TIME BERBASIS CUACA,
             KELEMBAPAN & KALENDER MUSIM TANAM LOKAL + POPUP SOLUSI KOMPREHENSIF
         ===================================================================== */}
      <section
        aria-label="Prediksi Risiko OPT Real-Time"
        data-testid="realtime-opt-early-warning-section"
        className="bg-white rounded-2xl border-2 border-[#15803D]/30 p-4 sm:p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] border border-red-200 flex items-center justify-center text-[#DC2626] shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#142615]">
                  Prediksi Risiko OPT (Hama & Penyakit) Real-Time
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold uppercase tracking-wider">
                  Epidemiologi Cuaca Live & Musim Tanam
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#4A634D] mt-0.5">
                Dihitung dinamis dari cuaca live {weather.locationName} (Suhu{' '}
                <strong>{weather.tempC}°C</strong>, Kelembapan{' '}
                <strong>{weather.humidityPct}%</strong>, Hujan{' '}
                <strong>{weather.rainfallMm} mm</strong>, Angin{' '}
                <strong>{weather.windSpeedKmh} km/jam</strong>) & umur tanaman. Klik kartu untuk
                membuka <strong>Popup Solusi Lengkap & Takaran Obat Tangki 16L</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="dashboard-season-mt-select" className="text-[11px] font-bold text-[#142615]">
              Musim Tanam:
            </label>
            <select
              id="dashboard-season-mt-select"
              data-testid="select-dashboard-season-mt"
              value={selectedSeasonMT}
              onChange={(e) => setSelectedSeasonMT(e.target.value as PlantingSeasonMT)}
              className="h-9 px-3 rounded-xl border border-[#DCE8DC] bg-[#F7FAF6] text-xs font-bold text-[#14532D]"
            >
              <option value="MT1 Penghujan (Nov–Feb)">MT1 Penghujan (Nov–Feb)</option>
              <option value="MT2 Gadu / Peralihan (Mar–Jun)">MT2 Gadu / Peralihan (Mar–Jun)</option>
              <option value="MT3 Kemarau / Palawija (Jul–Okt)">
                MT3 Kemarau / Palawija (Jul–Okt)
              </option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {realTimeOptAlerts.map((opt) => {
            const isHigh = opt.riskLevel === 'Tinggi / Siaga';
            const isMed = opt.riskLevel === 'Waspada';
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedOptAlertModal(opt)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedOptAlertModal(opt);
                  }
                }}
                data-testid={`opt-alert-card-${opt.id}`}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all cursor-pointer ${
                  isHigh
                    ? 'bg-gradient-to-br from-[#FFF5F5] via-white to-[#FFFBEB] border-red-300 hover:border-[#DC2626] shadow-2xs'
                    : isMed
                    ? 'bg-gradient-to-br from-[#FFFBEB] via-white to-[#F0FDF4] border-amber-300 hover:border-amber-500'
                    : 'bg-[#F8FBF8] border-[#DCE8DC] hover:border-[#15803D]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          isHigh
                            ? 'bg-[#DC2626] text-white'
                            : isMed
                            ? 'bg-[#D97706] text-white'
                            : 'bg-[#15803D] text-white'
                        }`}
                      >
                        Risiko {opt.riskLevel} ({opt.riskScorePct}%)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-extrabold text-[#14532D]">
                        {opt.targetCommodity}
                      </span>
                      <span className="text-[10px] font-semibold text-[#5B735E]">
                        {opt.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#142615] leading-snug">
                      {opt.optName}
                    </h4>
                    <p className="text-[11px] italic text-[#4A634D]">{opt.scientificName}</p>
                  </div>

                  <div className="rounded-lg bg-white/90 border border-slate-200/80 px-2.5 py-1.5 text-[11px] font-semibold text-sky-950">
                    Pemicu Cuaca: <span className="font-bold">{opt.weatherTriggerHeadline}</span>
                  </div>

                  <p className="text-[11px] text-[#3B523D] line-clamp-2 leading-relaxed">
                    {opt.whyItThreatensNow}
                  </p>

                  <div className="rounded-lg bg-[#F0FDF4] border border-emerald-200 px-2.5 py-1.5 text-[11px]">
                    <span className="font-extrabold text-[#14532D]">Solusi Cepat & Obat 16L: </span>
                    <span className="text-[#17231B]">
                      {opt.chemicalControlGuides[0]?.registeredBrands} (
                      {opt.chemicalControlGuides[0]?.dosagePer16LTank})
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-[#15803D] tabular-nums">
                    Jam Semprot: {opt.bestSprayingWindowToday.recommendedHours}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOptAlertModal(opt);
                    }}
                    data-testid={`btn-open-opt-solution-${opt.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-[11px] font-extrabold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    Lihat Solusi Lengkap & Cara Mengatasi →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          1. PERINGATAN DINI AI (PREDIKSI PENYAKIT, AIR, HAMA & SARAN TINDAKAN)
         ===================================================================== */}
      <section
        aria-label="Peringatan Dini AI"
        className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3CD] border border-[#F59E0B]/30 flex items-center justify-center text-[#B45309]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#142615]">
                  Peringatan Dini & Prediksi AI
                </h3>
                <span className="text-[11px] font-bold text-[#B45309] tabular-nums">
                  • {predictiveAlerts.length} Peringatan Aktif
                </span>
                {activePriorityDiagnosis && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    {isNewPriorityDiagnosis
                      ? 'Diagnosis Baru Diperbarui Otomatis'
                      : 'Prioritas Diagnosis Kamera AI'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#4A634D]">
                Sinkronisasi otomatis hasil diagnosis Kamera AI, profil tanaman, kelembapan {weather.humidityPct}%, dan suhu {weather.tempC}°C
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshAiPredictions}
            disabled={aiRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F7F0] hover:bg-[#E2EFE0] text-[#1E5622] text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiRefreshing ? 'animate-spin' : ''}`} />
            {aiRefreshing ? 'Menganalisis...' : 'Analisis Ulang AI'}
          </button>
        </div>

        <div
          data-testid="ai-intelligent-recommendation-banner"
          className="text-[11px] text-[#142615] bg-gradient-to-r from-[#ECFDF3] via-[#F7FAF6] to-[#FFFBEB] border border-[#86EFAC] rounded-xl px-3.5 py-2.5 mb-3.5 flex items-start gap-2"
        >
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#15803D]" />
          <div className="leading-relaxed">
            <span className="font-extrabold text-[#15803D] mr-1">
              Pembaruan Rekomendasi Cerdas AI:
            </span>
            <span>{aiExtraNote}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predictiveAlerts.map((alert) => {
            const isPriorityDiag = Boolean(alert.isPriorityDiagnosis);
            const isHigh = alert.severity === 'Tinggi';
            const isMedium = alert.severity === 'Sedang';
            const isScheduled = scheduledAlertIds.includes(alert.id);
            return (
              <div
                key={alert.id}
                data-testid={isPriorityDiag ? 'priority-diagnosis-alert-card' : undefined}
                className={`rounded-xl border p-3.5 flex flex-col justify-between transition-all ${
                  isPriorityDiag
                    ? 'md:col-span-2 bg-gradient-to-br from-[#FFF5F5] via-[#FFF9F5] to-[#F0FDF4] border-2 border-[#DC2626]/60 shadow-sm ring-2 ring-[#DC2626]/10'
                    : isHigh
                    ? 'bg-[#FFF9F5] border-[#F97316]/40'
                    : isMedium
                    ? 'bg-[#FFFDF4] border-[#EAB308]/40'
                    : 'bg-[#F8FBF8] border-[#DCE8DC]'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isPriorityDiag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#DC2626] text-white text-[10px] font-extrabold uppercase tracking-wider">
                            <Camera className="w-3 h-3" />
                            Prioritas Utama • Kamera AI
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider ${
                            isPriorityDiag
                              ? 'text-[#B91C1C]'
                              : isHigh
                              ? 'text-[#C2410C]'
                              : isMedium
                              ? 'text-[#A16207]'
                              : 'text-[#1E5622]'
                          }`}
                        >
                          {alert.riskCategory} • Risiko {alert.severity} ({alert.confidencePct}%)
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#142615] mt-1">
                        {alert.title}
                      </h4>
                      {alert.scientificName && (
                        <p className="text-[11px] italic text-[#4A634D]">
                          Patogen / Penyebab: {alert.scientificName}
                        </p>
                      )}
                    </div>
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isPriorityDiag
                          ? 'text-[#DC2626]'
                          : isHigh
                          ? 'text-[#EA580C]'
                          : isMedium
                          ? 'text-[#D97706]'
                          : 'text-[#2E7D32]'
                      }`}
                    />
                  </div>

                  <p className="text-[11px] font-semibold text-[#3B523D] mb-1">
                    Tanaman: <span className="font-bold text-[#142615]">{alert.cropName}</span>
                  </p>
                  <p className="text-[11px] text-[#4A634D] leading-relaxed mb-2">
                    <span className="font-bold text-[#142615]">Pemicu & Korelasi AI:</span>{' '}
                    {alert.predictedTrigger}
                  </p>

                  <div className="bg-white/95 rounded-lg border border-[#E2ECE2] p-2.5 mb-2.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1E5622] mb-1">
                      {isPriorityDiag
                        ? 'Rekomendasi Cerdas PHT & Tindakan Prioritas:'
                        : 'Saran Tindakan yang Dapat Diambil:'}
                    </p>
                    <ul className="space-y-1">
                      {alert.actionableSteps.map((step, i) => (
                        <li
                          key={i}
                          className="text-[11px] text-[#1F3321] flex items-start gap-1.5 leading-snug"
                        >
                          <span className="text-[#2E7D32] font-bold">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[#E6EFE6]">
                  <span className="text-[10px] text-[#5B735E] truncate">{alert.sourceBasis}</span>
                  <div className="flex items-center gap-2">
                    {isPriorityDiag && onOpenCameraDiagnosis && (
                      <button
                        type="button"
                        onClick={onOpenCameraDiagnosis}
                        className="px-2.5 py-1.5 rounded-lg border border-[#1E5622] text-[#1E5622] hover:bg-[#F2F7F0] text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer"
                      >
                        Detail Kamera AI
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onScheduleAlertAction(alert);
                        if (!isScheduled) {
                          setScheduledAlertIds((prev) => [...prev, alert.id]);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        isScheduled
                          ? 'bg-[#E3F2E5] text-[#1E5622]'
                          : isPriorityDiag
                          ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                          : 'bg-[#1E5622] hover:bg-[#164219] text-white'
                      }`}
                    >
                      {isScheduled
                        ? '✓ Masuk Agenda'
                        : isPriorityDiag
                        ? '+ Jadwalkan Tindakan Prioritas'
                        : '+ Jadwalkan Tindakan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          2. VISUALISASI DATA INTERAKTIF (BAGAN GARIS, BAGAN BATANG, PETA PANAS)
         ===================================================================== */}
      <section
        aria-label="Visualisasi Data Interaktif"
        className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-[#142615]">
              Visualisasi Data Lahan & Telemetri Interaktif
            </h3>
            <p className="text-[11px] text-[#4A634D]">
              Pantau tren suhu & kelembapan, perbandingan hasil panen antar petak, dan peta panas risiko lahan
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F2F7F0] p-1 rounded-xl border border-[#DCE8DC]">
            <button
              type="button"
              onClick={() => setActiveChartTab('line')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeChartTab === 'line'
                  ? 'bg-[#1E5622] text-white shadow-xs'
                  : 'text-[#2F4F32] hover:bg-white/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Suhu & Kelembapan
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('bar')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeChartTab === 'bar'
                  ? 'bg-[#1E5622] text-white shadow-xs'
                  : 'text-[#2F4F32] hover:bg-white/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Perbandingan Panen
            </button>
            <button
              type="button"
              onClick={() => setActiveChartTab('heatmap')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeChartTab === 'heatmap'
                  ? 'bg-[#1E5622] text-white shadow-xs'
                  : 'text-[#2F4F32] hover:bg-white/60'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Peta Panas Sawah
            </button>
          </div>
        </div>

        {/* TAB 1: BAGAN GARIS (LINE CHART SUHU & KELEMBAPAN DARI WAKTU KE WAKTU) */}
        {activeChartTab === 'line' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7FAF6] border border-[#E2ECE2] rounded-xl px-3 py-2">
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#0284C7]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] inline-block" />
                  Kelembapan Udara (%)
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#EA580C]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] inline-block" />
                  Suhu Harian (°C)
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLineRangeDays(7);
                    setSelectedPointIdx(6);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                    lineRangeDays === 7
                      ? 'bg-[#1E5622] text-white'
                      : 'bg-white text-[#2F4F32] border border-[#DCE8DC]'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLineRangeDays(14);
                    setSelectedPointIdx(13);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                    lineRangeDays === 14
                      ? 'bg-[#1E5622] text-white'
                      : 'bg-white text-[#2F4F32] border border-[#DCE8DC]'
                  }`}
                >
                  14 Hari
                </button>
              </div>
            </div>

            {/* Interactive SVG Line Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 640 210"
                className="w-full h-48 select-none"
                role="img"
                aria-label="Bagan Garis Pemantauan Suhu dan Kelembapan dari Waktu ke Waktu"
              >
                {/* Horizontal Reference Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 24 + ratio * 140;
                  const humVal = Math.round(100 - ratio * 50); // 100% down to 50%
                  const tempVal = Math.round(36 - ratio * 16); // 36C down to 20C
                  return (
                    <g key={idx}>
                      <line
                        x1={44}
                        y1={y}
                        x2={596}
                        y2={y}
                        stroke="#E5EFE5"
                        strokeDasharray={idx === 1 ? '4 4' : undefined}
                        strokeWidth={1}
                      />
                      <text x={10} y={y + 4} fontSize="10" fill="#0284C7" fontWeight="700">
                        {humVal}%
                      </text>
                      <text x={602} y={y + 4} fontSize="10" fill="#EA580C" fontWeight="700">
                        {tempVal}°C
                      </text>
                    </g>
                  );
                })}

                {/* Blas Threshold Line at 85% Humidity */}
                <line
                  x1={44}
                  y1={24 + ((100 - 85) / 50) * 140}
                  x2={596}
                  y2={24 + ((100 - 85) / 50) * 140}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  strokeWidth={1.2}
                />
                <text
                  x={48}
                  y={20 + ((100 - 85) / 50) * 140}
                  fontSize="9"
                  fill="#B45309"
                  fontWeight="700"
                >
                  Ambang Waspada Jamur Blas (Kelembapan 85%)
                </text>

                {/* Polyline for Humidity */}
                <polyline
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={visibleTelemetry
                    .map((pt, i) => {
                      const x =
                        54 +
                        (i / Math.max(1, visibleTelemetry.length - 1)) * 532;
                      const y = 24 + ((100 - pt.humidityPct) / 50) * 140;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Polyline for Temperature */}
                <polyline
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={visibleTelemetry
                    .map((pt, i) => {
                      const x =
                        54 +
                        (i / Math.max(1, visibleTelemetry.length - 1)) * 532;
                      const y = 24 + ((36 - pt.tempC) / 16) * 140;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {/* Interactive Data Points */}
                {visibleTelemetry.map((pt, i) => {
                  const x =
                    54 + (i / Math.max(1, visibleTelemetry.length - 1)) * 532;
                  const yHum = 24 + ((100 - pt.humidityPct) / 50) * 140;
                  const yTemp = 24 + ((36 - pt.tempC) / 16) * 140;
                  const isSelected = i === safePointIdx;
                  return (
                    <g
                      key={pt.isoDate}
                      className="cursor-pointer"
                      onClick={() => setSelectedPointIdx(i)}
                    >
                      {isSelected && (
                        <line
                          x1={x}
                          y1={20}
                          x2={x}
                          y2={168}
                          stroke="#1E5622"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}
                      <circle
                        cx={x}
                        cy={yHum}
                        r={isSelected ? 5.5 : 3.8}
                        fill={isSelected ? '#0369A1' : '#0284C7'}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={x}
                        cy={yTemp}
                        r={isSelected ? 5.5 : 3.8}
                        fill={isSelected ? '#C2410C' : '#EA580C'}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x}
                        y={188}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight={isSelected ? '800' : '600'}
                        fill={isSelected ? '#142615' : '#5B735E'}
                      >
                        {pt.dateLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Day Telemetry Inspector */}
            {inspectedPoint && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#F7FAF6] border border-[#DCE8DC] rounded-xl p-3">
                <div>
                  <span className="text-[10px] font-bold text-[#5B735E] uppercase">
                    Tanggal Pengamatan
                  </span>
                  <p className="text-xs font-extrabold text-[#142615] tabular-nums">
                    {inspectedPoint.dateLabel} ({inspectedPoint.isoDate})
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#0284C7] uppercase">
                    Kelembapan Udara
                  </span>
                  <p className="text-xs font-extrabold text-[#0369A1] tabular-nums">
                    {inspectedPoint.humidityPct}%{' '}
                    {inspectedPoint.humidityPct >= 85 ? '(Waspada Blas)' : '(Normal)'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#EA580C] uppercase">
                    Suhu Udara Harian
                  </span>
                  <p className="text-xs font-extrabold text-[#C2410C] tabular-nums">
                    {inspectedPoint.tempC}°C (Optimal Padi)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#1E5622] uppercase">
                    Kelembapan Tanah & Hujan
                  </span>
                  <p className="text-xs font-extrabold text-[#1E5622] tabular-nums">
                    Tanah {inspectedPoint.soilMoisturePct}% • Hujan {inspectedPoint.rainfallMm} mm
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BAGAN BATANG (BAR CHART PERBANDINGAN HASIL PANEN ANTAR BAGIAN LAHAN) */}
        {activeChartTab === 'bar' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7FAF6] border border-[#E2ECE2] rounded-xl px-3 py-2 text-xs">
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 font-bold text-[#1E5622]">
                  <span className="w-3 h-3 rounded-xs bg-[#1E5622] inline-block" />
                  Hasil Panen Aktual (Ton/Ha)
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-[#94A3B8]">
                  <span className="w-3 h-3 rounded-xs bg-[#CBD5E1] inline-block" />
                  Target Produktivitas (Ton/Ha)
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#4A634D] tabular-nums">
                Rata-rata Aktual: 7,28 Ton/Ha GKP
              </span>
            </div>

            <div className="space-y-3">
              {sectionYieldComparison.map((item) => {
                const maxScale = 9.0;
                const actualPct = Math.min(100, Math.round((item.actualTonPerHa / maxScale) * 100));
                const targetPct = Math.min(100, Math.round((item.targetTonPerHa / maxScale) * 100));
                const beatTarget = item.actualTonPerHa >= item.targetTonPerHa;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#E2ECE2] p-3 bg-[#FBFDFB]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="text-xs font-extrabold text-[#142615]">
                          {item.sectionLabel}
                        </h4>
                        <p className="text-[11px] text-[#4A634D]">
                          {item.variety} • Luas {item.areaHa} Ha • {item.seasonLabel}
                        </p>
                      </div>
                      <div className="text-right tabular-nums">
                        <span
                          className={`text-xs font-extrabold ${
                            beatTarget ? 'text-[#1E5622]' : 'text-[#B45309]'
                          }`}
                        >
                          Aktual: {item.actualTonPerHa.toFixed(1)} Ton/Ha ({item.totalKg.toLocaleString('id-ID')} kg)
                        </span>
                        <p className="text-[10px] text-[#5B735E]">
                          Target: {item.targetTonPerHa.toFixed(1)} Ton/Ha{' '}
                          {beatTarget ? '✓ Melampaui Target' : '• Perlu Optimasi Pupuk K'}
                        </p>
                      </div>
                    </div>

                    {/* Dual Horizontal Bar Comparison */}
                    <div className="space-y-1.5 mt-2">
                      <div className="w-full h-3 bg-[#EBF2EA] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            beatTarget ? 'bg-[#2E7D32]' : 'bg-[#D97706]'
                          }`}
                          style={{ width: `${actualPct}%` }}
                        />
                      </div>
                      <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#94A3B8] rounded-full"
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PETA PANAS (HEATMAP 4x4 SEKTOR PETAKAN SAWAH) */}
        {activeChartTab === 'heatmap' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#142615]">
                  Klik petak sektor (A1–D4) untuk inspeksi kondisi mikro sawah:
                </span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 font-bold text-[#1E5622]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2E7D32] inline-block" /> Optimal
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#B45309]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B] inline-block" /> Waspada
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[#C2410C]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#EA580C] inline-block" /> Perhatian Tinggi
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {heatmapSectors.map((sector) => {
                  const isSelected = selectedSector?.id === sector.id;
                  const isHigh = sector.riskCategory === 'Perhatian Tinggi';
                  const isMed = sector.riskCategory === 'Waspada';
                  return (
                    <button
                      key={sector.id}
                      type="button"
                      onClick={() => setSelectedSector(sector)}
                      className={`p-2.5 rounded-xl border text-left transition-all tabular-nums ${
                        isHigh
                          ? 'bg-[#FFF0E6] border-[#EA580C] text-[#9A3412]'
                          : isMed
                          ? 'bg-[#FEF9C3] border-[#EAB308] text-[#854D0E]'
                          : 'bg-[#E8F5E9] border-[#81C784] text-[#1B5E20]'
                      } ${isSelected ? 'ring-2 ring-[#142615] shadow-sm scale-[1.02]' : 'hover:opacity-95'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">{sector.sectorCode}</span>
                        <span className="text-[10px] font-bold">{sector.plotName}</span>
                      </div>
                      <p className="text-[11px] font-bold mt-1">
                        Air {sector.moisturePct}% • pH {sector.ph}
                      </p>
                      <p className="text-[10px] font-extrabold mt-0.5 truncate">
                        Skor Risiko: {sector.riskScore}/100
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Heatmap Sector Detail Card */}
            {selectedSector && (
              <div className="lg:col-span-5 rounded-xl border border-[#DCE8DC] bg-[#F7FAF6] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#DCE8DC] pb-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#4A634D]">
                      Inspeksi Sektor Petakan {selectedSector.sectorCode}
                    </span>
                    <h4 className="text-sm font-extrabold text-[#142615]">
                      {selectedSector.sectionName} ({selectedSector.plotName})
                    </h4>
                  </div>
                  <span
                    className={`text-xs font-extrabold tabular-nums ${
                      selectedSector.riskCategory === 'Perhatian Tinggi'
                        ? 'text-[#C2410C]'
                        : selectedSector.riskCategory === 'Waspada'
                        ? 'text-[#B45309]'
                        : 'text-[#1E5622]'
                    }`}
                  >
                    {selectedSector.riskCategory} ({selectedSector.riskScore}/100)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                  <div className="bg-white rounded-lg p-2 border border-[#E2ECE2]">
                    <span className="text-[10px] text-[#5B735E] block">Kelembapan Tanah</span>
                    <span className="font-extrabold text-[#142615]">{selectedSector.moisturePct}%</span>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-[#E2ECE2]">
                    <span className="text-[10px] text-[#5B735E] block">pH Tanah</span>
                    <span className="font-extrabold text-[#142615]">{selectedSector.ph}</span>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-[#142615]">
                    <span className="font-bold">Temuan Utama:</span> {selectedSector.primaryIssue}
                  </p>
                  <p className="text-[#1E5622] font-semibold">
                    <span className="font-bold text-[#142615]">Rekomendasi Lapangan:</span>{' '}
                    {selectedSector.recommendedAction}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================================
          3. MANAJEMEN PROFIL TANAMAN DI DASBOR (TAMBAH, UBAH, HAPUS PROFIL)
         ===================================================================== */}
      <section
        aria-label="Manajemen Profil Tanaman"
        className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5E9] border border-[#81C784]/50 flex items-center justify-center text-[#1E5622]">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#142615]">
                Profil Tanaman & Parameter Agronomi ({cropProfiles.length})
              </h3>
              <p className="text-[11px] text-[#4A634D]">
                Kelola persyaratan nutrisi, kebutuhan air, toleransi suhu, dan catatan khusus setiap tanaman
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white text-xs font-bold whitespace-nowrap transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Profil Tanaman
          </button>
        </div>

        {cropProfiles.length === 0 ? (
          <div className="text-center py-6 bg-[#F7FAF6] rounded-xl border border-dashed border-[#DCE8DC]">
            <p className="text-xs font-bold text-[#142615] mb-1">
              Belum ada profil tanaman yang tersimpan
            </p>
            <p className="text-[11px] text-[#4A634D] mb-3">
              Tambahkan profil tanaman untuk mengaktifkan analisis peringatan dini AI yang akurat.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 rounded-xl bg-[#1E5622] text-white text-xs font-bold"
            >
              + Buat Profil Tanaman Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cropProfiles.map((prof) => (
              <div
                key={prof.id}
                className="rounded-xl border border-[#DCE8DC] bg-[#FBFDFB] p-3.5 flex flex-col justify-between hover:border-[#2E7D32] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E7D32]">
                        {prof.jenis}
                      </span>
                      <h4 className="text-xs font-extrabold text-[#142615] mt-0.5">
                        {prof.namaTanaman}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(prof)}
                        title="Edit Profil Tanaman"
                        className="p-1.5 rounded-lg text-[#2F4F32] hover:bg-[#E8F5E9]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCropProfile(prof.id)}
                        title="Hapus Profil Tanaman"
                        className="p-1.5 rounded-lg text-[#B91C1C] hover:bg-[#FEE2E2]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1.5 pt-1 border-t border-[#E8F0E8]">
                    <p className="text-[#2F4F32] flex items-center gap-1.5 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                      <span>
                        <strong className="text-[#142615]">Tanggal Tanam:</strong> {prof.tanggalTanam}
                      </span>
                    </p>
                    <p className="text-[#2F4F32] flex items-start gap-1.5">
                      <Leaf className="w-3.5 h-3.5 text-[#2E7D32] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#142615]">Nutrisi:</strong> {prof.persyaratanNutrisi}
                      </span>
                    </p>
                    <p className="text-[#2F4F32] flex items-start gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-[#0284C7] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#142615]">Kebutuhan Air:</strong> {prof.kebutuhanAir}
                      </span>
                    </p>
                    <p className="text-[#2F4F32] flex items-start gap-1.5 tabular-nums">
                      <Thermometer className="w-3.5 h-3.5 text-[#EA580C] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#142615]">Toleransi Suhu:</strong> {prof.toleransiSuhu}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#E8F0E8]">
                  <p className="text-[11px] text-[#4A634D] italic">
                    <strong className="not-italic text-[#142615]">Catatan Khusus:</strong>{' '}
                    {prof.catatanKhusus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL TAMBAH / EDIT PROFIL TANAMAN */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Formulir Profil Tanaman"
        >
          <div className="bg-white rounded-2xl border border-[#DCE8DC] max-w-lg w-full p-5 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#E6EFE6] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#142615]">
                  {editingProfileId ? 'Edit Profil Tanaman' : 'Tambah Profil Tanaman Baru'}
                </h3>
                <p className="text-xs text-[#4A634D]">
                  Data profil ini digunakan AI untuk memprediksi risiko penyakit, air, dan suhu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg text-[#4A634D] hover:bg-[#F2F7F0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#991B1B]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProfile} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Nama Tanaman *
                  </label>
                  <input
                    type="text"
                    required
                    value={namaTanaman}
                    onChange={(e) => setNamaTanaman(e.target.value)}
                    placeholder="Contoh: Padi Blok Selatan"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Jenis / Varietas *
                  </label>
                  <input
                    type="text"
                    required
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                    placeholder="Contoh: Padi Inpari 32 HDB"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Tanggal Tanam *
                  </label>
                  <input
                    type="date"
                    required
                    value={tanggalTanam}
                    onChange={(e) => setTanggalTanam(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Lahan Terkait
                  </label>
                  <select
                    value={plotId}
                    onChange={(e) => setPlotId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615] bg-white"
                  >
                    {plots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.commodity} - {p.areaHa} Ha)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142615] mb-1">
                  Persyaratan Nutrisi *
                </label>
                <input
                  type="text"
                  required
                  value={persyaratanNutrisi}
                  onChange={(e) => setPersyaratanNutrisi(e.target.value)}
                  placeholder="Contoh: Urea 200 kg/Ha + NPK Phonska 300 kg/Ha (3 tahap BWD)"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142615] mb-1">
                  Kebutuhan Air *
                </label>
                <input
                  type="text"
                  required
                  value={kebutuhanAir}
                  onChange={(e) => setKebutuhanAir(e.target.value)}
                  placeholder="Contoh: Pengairan berselang (AWD) macak-macak 3-5 cm"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Toleransi Suhu (Label)
                  </label>
                  <input
                    type="text"
                    value={toleransiSuhu}
                    onChange={(e) => setToleransiSuhu(e.target.value)}
                    placeholder="22°C – 32°C"
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Suhu Min (°C)
                  </label>
                  <input
                    type="number"
                    value={tempMinC}
                    onChange={(e) => setTempMinC(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Suhu Maks (°C)
                  </label>
                  <input
                    type="number"
                    value={tempMaxC}
                    onChange={(e) => setTempMaxC(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142615] mb-1">
                  Catatan Khusus
                </label>
                <textarea
                  rows={2}
                  value={catatanKhusus}
                  onChange={(e) => setCatatanKhusus(e.target.value)}
                  placeholder="Catatan kerentanan hama, drainase, atau perlakuan khusus..."
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6EFE6]">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold text-[#4A634D]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white text-xs font-bold"
                >
                  Simpan Profil Tanaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP SOLUSI KOMPREHENSIF OPT (6 SEKSI LENGKAP UNTUK PETANI) */}
      <OptSolutionPopupModal
        alert={selectedOptAlertModal}
        weather={weather}
        onClose={() => setSelectedOptAlertModal(null)}
        onAddSprayToAgenda={(optAlert) => {
          if (onAddOptSprayToAgenda) {
            onAddOptSprayToAgenda(optAlert);
          } else {
            onScheduleAlertAction({
              id: `ai-opt-${optAlert.id}-${Date.now()}`,
              severity: optAlert.riskLevel === 'Tinggi / Siaga' ? 'Tinggi' : 'Sedang',
              category: 'Risiko Penyakit',
              riskCategory: 'Penyakit Tanaman',
              confidencePct: optAlert.riskScorePct,
              title: optAlert.recommendedAgendaTaskTitle,
              targetName: optAlert.optName,
              cropName: String(optAlert.targetCommodity),
              plotId: plots[0]?.id || 'lahan-1',
              predictionSummary: optAlert.whyItThreatensNow,
              predictedTrigger: optAlert.weatherTriggerHeadline,
              triggerFactors: [optAlert.weatherTriggerHeadline],
              actionableSteps: [optAlert.recommendedAgendaDosageNote],
              recommendedTaskTitle: optAlert.recommendedAgendaTaskTitle,
              sourceBasis: 'Mesin Epidemiologi OPT Real-Time',
              createdAt: new Date().toISOString(),
            });
          }
        }}
        onOpenCameraDiagnosis={() => {
          if (onOpenCameraDiagnosis) onOpenCameraDiagnosis();
        }}
      />
    </div>
  );
};
