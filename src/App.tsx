import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Circle,
  CloudSun,
  Droplets,
  Eye,
  Home,
  Layers,
  LayoutGrid,
  MapPin,
  Plus,
  Sprout,
  User,
  Wallet,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  ActivityLogItem,
  AiPredictiveAlert,
  CommodityType,
  CropProfile,
  CultivationTaskEntity,
  DiagnosisResult,
  EpidemiologyOptAlert,
  ExpenseRecord,
  FarmEntity,
  FarmPlot,
  GrowingSeasonEntity,
  HarvestRecord,
  PhaseStatus,
  ScheduledTask,
  SeasonActivityLog,
  SeasonExpenseRecord,
  SeasonHarvestRecord,
  SoilObservation,
  UserProfile,
  WeatherSnapshot,
} from './types/agronomy';
import {
  buildInitialSeedState,
  DEFAULT_USER_PROFILE,
  SAMPLE_DIAGNOSIS_PRESETS,
} from './data/agronomyDatabase';
import {
  CropThumbnailIllustration,
  SymptomLeafIllustration,
} from './components/VisualAssets';
import {
  PresentationBoardModal,
  SplashAndAuthModal,
} from './components/SplashAndAuthModal';
import { PlotManagerView } from './components/PlotManagerView';
import { CameraDiagnosisView } from './components/CameraDiagnosisView';
import { CalendarAndWeatherView } from './components/CalendarAndWeatherView';
import { GuideAndCatalogView } from './components/GuideAndCatalogView';
import { RecordsAndCalculatorView } from './components/RecordsAndCalculatorView';
import { ProfileAndOfflineView } from './components/ProfileAndOfflineView';
import { DashboardAnalyticsAndProfiles } from './components/DashboardAnalyticsAndProfiles';
import { DashboardGeminiAgriChat } from './components/DashboardGeminiAgriChat';
import { RiceCultivationLifecycleView } from './components/RiceCultivationLifecycleView';
import { NotchedMobileNavbar } from './components/NotchedMobileNavbar';
import {
  fetchPersistentState,
  syncPersistentState,
  SyncStatus,
} from './services/databaseService';
import {
  DEFAULT_LARIKREJO_COORDS,
  fetchLiveMultiSourceWeather,
} from './services/liveWeatherService';
import { addDaysToIsoDate, formatIndonesianDate } from './utils/agronomyCalculations';

type MainTab =
  | 'beranda'
  | 'lahan'
  | 'budidaya'
  | 'kamera'
  | 'agenda'
  | 'panduan'
  | 'keuangan'
  | 'profil';

const STORAGE_KEY = 'tanicerdas_ai_app_state_v1';

export default function App() {
  const seed = buildInitialSeedState();

  const [activeTab, setActiveTab] = useState<MainTab>('beranda');
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [plots, setPlots] = useState<FarmPlot[]>(seed.plots);
  const [selectedPlotId, setSelectedPlotId] = useState<string>(seed.plots[0]?.id || 'lahan-1');
  const [tasks, setTasks] = useState<ScheduledTask[]>(seed.tasks);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(seed.activityLogs);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(seed.expenses);
  const [harvests, setHarvests] = useState<HarvestRecord[]>(seed.harvests);
  const [diagnosisHistory, setDiagnosisHistory] = useState<DiagnosisResult[]>([]);
  const [hasNewPriorityDiagnosis, setHasNewPriorityDiagnosis] = useState<boolean>(false);
  const [weather, setWeather] = useState<WeatherSnapshot>(seed.defaultWeather);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [remindersActive, setRemindersActive] = useState<boolean>(true);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Baru saja');

  // Persistent Database Entities (Tahap 1 & Profil Tanaman Dashboard)
  const [farms, setFarms] = useState<FarmEntity[]>(seed.farms);
  const [growingSeasons, setGrowingSeasons] = useState<GrowingSeasonEntity[]>(seed.growingSeasons);
  const [cultivationTasks, setCultivationTasks] = useState<CultivationTaskEntity[]>(seed.cultivationTasks);
  const [seasonActivityLogs, setSeasonActivityLogs] = useState<SeasonActivityLog[]>(seed.seasonActivityLogs);
  const [seasonExpenseRecords, setSeasonExpenseRecords] = useState<SeasonExpenseRecord[]>(seed.seasonExpenseRecords);
  const [seasonHarvestRecords, setSeasonHarvestRecords] = useState<SeasonHarvestRecord[]>(seed.seasonHarvestRecords);
  const [cropProfiles, setCropProfiles] = useState<CropProfile[]>(seed.cropProfiles);
  const [dbSyncStatus, setDbSyncStatus] = useState<SyncStatus>('Online — Tersinkronkan');
  const [openSeasonWizardDirectly, setOpenSeasonWizardDirectly] = useState<boolean>(false);

  // Modals
  const [authModalMode, setAuthModalMode] = useState<'splash' | 'login' | 'register' | null>(null);
  const [showBoardModal, setShowBoardModal] = useState<boolean>(false);
  const [cameraCommodity, setCameraCommodity] = useState<CommodityType>('Padi');
  const [guideInitialSubTab, setGuideInitialSubTab] = useState<'Panduan' | 'Tanya AI' | 'Katalog Hama'>('Panduan');

  // Hydrate persistent state from Server DB (/api/db/state) + IndexedDB on mount
  useEffect(() => {
    let active = true;
    fetchPersistentState(user.id, {
      farms: seed.farms,
      growingSeasons: seed.growingSeasons,
      cultivationTasks: seed.cultivationTasks,
      seasonActivityLogs: seed.seasonActivityLogs,
      seasonExpenseRecords: seed.seasonExpenseRecords,
      seasonHarvestRecords: seed.seasonHarvestRecords,
      cropProfiles: seed.cropProfiles,
    }).then(({ state, syncStatus }) => {
      if (!active) return;
      setFarms(state.farms);
      setGrowingSeasons(state.growingSeasons);
      setCultivationTasks(state.cultivationTasks);
      setSeasonActivityLogs(state.seasonActivityLogs);
      setSeasonExpenseRecords(state.seasonExpenseRecords);
      setSeasonHarvestRecords(state.seasonHarvestRecords);
      setCropProfiles(state.cropProfiles);
      setDbSyncStatus(syncStatus);
      setLastSyncedAt(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      );
    });
    return () => {
      active = false;
    };
  }, [user.id]);

  // Hydrate secondary UI state from LocalStorage on mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed.plots) && parsed.plots.length > 0) setPlots(parsed.plots);
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
        if (Array.isArray(parsed.activityLogs)) setActivityLogs(parsed.activityLogs);
        if (Array.isArray(parsed.expenses)) setExpenses(parsed.expenses);
        if (Array.isArray(parsed.harvests)) setHarvests(parsed.harvests);
        if (parsed.user) setUser(parsed.user);
      }
    } catch (_e) {
      // Ignore malformed storage
    }
  }, []);

  // Scroll to top when changing main tab
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab]);

  // Save secondary UI state to LocalStorage whenever core data changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          plots,
          tasks,
          activityLogs,
          expenses,
          harvests,
        })
      );
    } catch (_e) {
      // Ignore quota errors
    }
  }, [user, plots, tasks, activityLogs, expenses, harvests]);

  const persistAndSyncEntities = async (next: {
    farms?: FarmEntity[];
    growingSeasons?: GrowingSeasonEntity[];
    cultivationTasks?: CultivationTaskEntity[];
    seasonActivityLogs?: SeasonActivityLog[];
    seasonExpenseRecords?: SeasonExpenseRecord[];
    seasonHarvestRecords?: SeasonHarvestRecord[];
    cropProfiles?: CropProfile[];
  }) => {
    const nextFarms = next.farms ?? farms;
    const nextSeasons = next.growingSeasons ?? growingSeasons;
    const nextTasks = next.cultivationTasks ?? cultivationTasks;
    const nextActs = next.seasonActivityLogs ?? seasonActivityLogs;
    const nextExps = next.seasonExpenseRecords ?? seasonExpenseRecords;
    const nextHarvs = next.seasonHarvestRecords ?? seasonHarvestRecords;
    const nextProfiles = next.cropProfiles ?? cropProfiles;

    if (next.farms) setFarms(next.farms);
    if (next.growingSeasons) setGrowingSeasons(next.growingSeasons);
    if (next.cultivationTasks) setCultivationTasks(next.cultivationTasks);
    if (next.seasonActivityLogs) setSeasonActivityLogs(next.seasonActivityLogs);
    if (next.seasonExpenseRecords) setSeasonExpenseRecords(next.seasonExpenseRecords);
    if (next.seasonHarvestRecords) setSeasonHarvestRecords(next.seasonHarvestRecords);
    if (next.cropProfiles) setCropProfiles(next.cropProfiles);

    const status = await syncPersistentState(
      {
        ownerId: user.id,
        updatedAt: new Date().toISOString(),
        farms: nextFarms,
        growingSeasons: nextSeasons,
        cultivationTasks: nextTasks,
        seasonActivityLogs: nextActs,
        seasonExpenseRecords: nextExps,
        seasonHarvestRecords: nextHarvs,
        cropProfiles: nextProfiles,
      },
      isOfflineSimulated
    );
    setDbSyncStatus(status);
    setLastSyncedAt(
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    );
  };

  const fetchLiveWeather = async (options?: {
    forceGps?: boolean;
    customCoords?: {
      latitude: number;
      longitude: number;
      locationName?: string;
      bmkgAdm4Code?: string;
      source?: WeatherSnapshot['locationSource'];
    };
    providerMode?: 'open-meteo' | 'bmkg-hybrid';
  }) => {
    if (isOfflineSimulated) return;
    setIsLoadingWeather(true);
    try {
      const snapshot = await fetchLiveMultiSourceWeather({
        useBrowserGps: options?.forceGps ?? !options?.customCoords,
        customCoords: options?.customCoords,
        providerMode: options?.providerMode || weather.providerMode || 'bmkg-hybrid',
      });
      setWeather(snapshot);
    } catch (_e) {
      // Retain cached weather snapshot
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Initial live weather fetch + 10-minute auto-refresh interval
  useEffect(() => {
    fetchLiveWeather({ forceGps: true });
    const intervalId = window.setInterval(() => {
      fetchLiveWeather();
    }, 10 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleUpdateUserProfile = (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    if (
      typeof updatedProfile.latitude === 'number' &&
      typeof updatedProfile.longitude === 'number'
    ) {
      fetchLiveWeather({
        customCoords: {
          latitude: updatedProfile.latitude,
          longitude: updatedProfile.longitude,
          locationName: `${updatedProfile.village}${
            updatedProfile.provinceName ? `, ${updatedProfile.provinceName}` : ''
          }`,
          bmkgAdm4Code: DEFAULT_LARIKREJO_COORDS.bmkgAdm4Code,
        },
      });
    }
  };

  const handleAddOptSprayToAgenda = (optAlert: EpidemiologyOptAlert) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const tomorrowIso = addDaysToIsoDate(todayIso, 1);
    const targetPlot = plots.find((p) => p.id === selectedPlotId) || plots[0];
    const resolvedCommodity: CommodityType =
      optAlert.targetCommodity === 'Padi & Palawija'
        ? user.mainCommodity || targetPlot?.commodity || 'Padi'
        : optAlert.targetCommodity;

    const newTask: ScheduledTask = {
      id: `task-opt-spray-${Date.now()}`,
      plotId: targetPlot?.id || 'lahan-1',
      plotName: targetPlot?.name || 'Lahan 1',
      commodity: resolvedCommodity,
      title: optAlert.recommendedAgendaTaskTitle,
      category: 'Penyemprotan Tervalidasi',
      dateLabel: `${formatIndonesianDate(tomorrowIso)}, 06:30 – 09:00`,
      isoDate: tomorrowIso,
      timeSlot: '06:30 – 09:00',
      completed: false,
      dosageOrNote: optAlert.recommendedAgendaDosageNote,
      phaseNumber: 5,
    };
    setTasks((prev) => [newTask, ...prev]);

    const activeSeason = growingSeasons.find((s) => s.status === 'Aktif') || growingSeasons[0];
    if (activeSeason) {
      const newCultTask: CultivationTaskEntity = {
        id: `ctask-opt-${Date.now()}`,
        ownerId: user.id,
        seasonId: activeSeason.id,
        farmId: activeSeason.farmId,
        stageOrder: 6,
        category: 'Pengendalian Hama & Penyakit',
        title: optAlert.recommendedAgendaTaskTitle,
        scheduledDate: tomorrowIso,
        status: 'Terjadwal',
        priority: optAlert.riskLevel === 'Tinggi / Siaga' ? 'Tinggi' : 'Sedang',
        notes: optAlert.recommendedAgendaDosageNote,
        recommendationSource: 'Sistem Peringatan Dini Epidemiologi OPT Real-Time',
        createdAt: new Date().toISOString(),
      };
      persistAndSyncEntities({
        cultivationTasks: [newCultTask, ...cultivationTasks],
      });
    }
  };

  // Handlers
  const handleAddPlot = (newPlot: FarmPlot, generatedTasks: ScheduledTask[]) => {
    setPlots((prev) => [newPlot, ...prev]);
    setSelectedPlotId(newPlot.id);
    setTasks((prev) => [...generatedTasks, ...prev]);
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        plotId: newPlot.id,
        plotName: `${newPlot.name} (${newPlot.commodity})`,
        commodity: newPlot.commodity,
        dateLabel: formatIndonesianDate(newPlot.plantingDate),
        isoDate: newPlot.plantingDate,
        title: `Pendaftaran ${newPlot.name} & Rencana 8 Fase`,
        category: 'Tanam',
        detail: `${newPlot.commodity} Varietas ${newPlot.variety} seluas ${newPlot.areaHa} Ha (${newPlot.plantingSystem}).`,
      },
      ...prev,
    ]);

    // Also persist to Tahap 1 FarmEntity collection
    const nowIso = new Date().toISOString();
    const newFarmEntity: FarmEntity = {
      id: `farm-${Date.now()}`,
      ownerId: user.id,
      name: newPlot.name,
      location: newPlot.locationVillage,
      areaValue: newPlot.areaHa,
      areaUnit: 'ha',
      areaHaNormalized: newPlot.areaHa,
      soilType: 'Aluvial Sawah',
      waterSource: 'Irigasi Teknis',
      notes: `Varietas awal: ${newPlot.variety} (${newPlot.plantingSystem})`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    persistAndSyncEntities({ farms: [newFarmEntity, ...farms] });
  };

  const handleDeletePlot = (plotId: string) => {
    setPlots((prev) => {
      const remaining = prev.filter((p) => p.id !== plotId);
      if (selectedPlotId === plotId && remaining[0]) {
        setSelectedPlotId(remaining[0].id);
      }
      return remaining;
    });
    setTasks((prev) => prev.filter((t) => t.plotId !== plotId));
  };

  const handleTogglePhaseChecklist = (plotId: string, phaseId: string, checklistId: string) => {
    setPlots((prev) =>
      prev.map((plot) => {
        if (plot.id !== plotId) return plot;
        return {
          ...plot,
          phases: plot.phases.map((ph) => {
            if (ph.id !== phaseId) return ph;
            return {
              ...ph,
              checklist: ph.checklist.map((item) =>
                item.id === checklistId ? { ...item, completed: !item.completed } : item
              ),
            };
          }),
        };
      })
    );
  };

  const handleUpdatePhaseStatus = (plotId: string, phaseId: string, newStatus: PhaseStatus) => {
    setPlots((prev) =>
      prev.map((plot) => {
        if (plot.id !== plotId) return plot;
        return {
          ...plot,
          phases: plot.phases.map((ph) =>
            ph.id === phaseId ? { ...ph, status: newStatus } : ph
          ),
        };
      })
    );
  };

  const handleToggleTaskCompleted = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (newTask: ScheduledTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateSoilObservation = (plotId: string, obs: SoilObservation) => {
    setPlots((prev) =>
      prev.map((p) => (p.id === plotId ? { ...p, soilObservation: obs } : p))
    );
  };

  const handleDiagnosisComplete = (diag: DiagnosisResult, plotId?: string) => {
    const resolvedPlotId = plotId || diag.plotId || selectedPlotId || plots[0]?.id || 'lahan-1';
    const nextDiag: DiagnosisResult = {
      ...diag,
      plotId: resolvedPlotId,
      timestamp: diag.timestamp || new Date().toISOString(),
    };
    setDiagnosisHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== nextDiag.id);
      return [nextDiag, ...filtered];
    });
    setHasNewPriorityDiagnosis(true);
  };

  const handleSaveDiagnosisToHistory = (diag: DiagnosisResult, plotId?: string) => {
    const resolvedPlotId = plotId || diag.plotId || selectedPlotId || plots[0]?.id || 'lahan-1';
    const savedDiag: DiagnosisResult = {
      ...diag,
      id: `diag-saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      plotId: resolvedPlotId,
      timestamp: new Date().toISOString(),
    };
    setDiagnosisHistory((prev) => [savedDiag, ...prev]);
    setHasNewPriorityDiagnosis(true);
    const targetPlot = plots.find((p) => p.id === resolvedPlotId) || plots[0];
    const plotLabel = targetPlot ? `${targetPlot.name} (${targetPlot.commodity})` : 'Lahan 1';
    const todayIso = new Date().toISOString().slice(0, 10);
    const recheckIso = addDaysToIsoDate(todayIso, 7);

    setActivityLogs((prev) => [
      {
        id: `log-diag-${Date.now()}`,
        plotId: targetPlot?.id || 'lahan-1',
        plotName: plotLabel,
        commodity: diag.commodity,
        dateLabel: 'Hari Ini',
        isoDate: todayIso,
        title: `Diagnosis Kamera AI: ${diag.detectedName}`,
        category: 'Pengamatan',
        detail: `Tingkat keyakinan ${diag.confidencePct}%. Rekomendasi PHT & produk terverifikasi disimpan.`,
      },
      ...prev,
    ]);

    setTasks((prev) => [
      {
        id: `task-recheck-${Date.now()}`,
        plotId: targetPlot?.id || 'lahan-1',
        plotName: targetPlot?.name || 'Lahan 1',
        commodity: diag.commodity,
        title: `Pemeriksaan Ulang Pasca Diagnosis (${diag.detectedName})`,
        category: 'Pemeriksaan Hama & Penyakit',
        dateLabel: `${formatIndonesianDate(recheckIso)}, 07:00 – 09:00`,
        isoDate: recheckIso,
        timeSlot: '07:00 – 09:00',
        completed: false,
        dosageOrNote: 'Evaluasi perkembangan gejala 7 hari pasca tindakan PHT',
        phaseNumber: 6,
      },
      ...prev,
    ]);

    // Sync diagnosis log & follow-up task into Persistent Tahap 1 Season DB
    const activeSeason = growingSeasons.find((s) => s.status === 'Aktif') || growingSeasons[0];
    if (activeSeason) {
      const newSeasonLog: SeasonActivityLog = {
        id: `act-diag-${Date.now()}`,
        ownerId: user.id,
        farmId: activeSeason.farmId,
        seasonId: activeSeason.id,
        activityType: 'Pengendalian OPT',
        executionDate: todayIso,
        inputUsed: `Diagnosis Kamera AI: ${diag.detectedName}`,
        quantity: 1,
        unit: 'pengamatan',
        unitCostRp: 0,
        actualCostRp: 0,
        notes: `${diag.nonChemicalIpmActions[0] || diag.diseaseInfoSummary} (Keyakinan ${diag.confidencePct}%)`,
        createdAt: new Date().toISOString(),
      };
      const newCultivationTask: CultivationTaskEntity = {
        id: `ctask-diag-${Date.now()}`,
        ownerId: user.id,
        seasonId: activeSeason.id,
        farmId: activeSeason.farmId,
        stageOrder: 8,
        category: 'Pengendalian Hama & Penyakit',
        title: `Evaluasi Lapangan Pasca Diagnosis: ${diag.detectedName}`,
        scheduledDate: recheckIso,
        status: 'Terjadwal',
        priority: diag.urgencyLevel === 'Tinggi' ? 'Tinggi' : 'Sedang',
        notes: diag.followUpFieldChecks[0] || 'Cek perkembangan gejala pada 10 rumpun diagonal.',
        recommendationSource: 'Rekomendasi Kamera AI & Pakar Fitopatologi',
        createdAt: new Date().toISOString(),
      };
      persistAndSyncEntities({
        seasonActivityLogs: [newSeasonLog, ...seasonActivityLogs],
        cultivationTasks: [newCultivationTask, ...cultivationTasks],
      });
    }
  };

  const handleResetDemoData = async () => {
    const fresh = buildInitialSeedState();
    setPlots(fresh.plots);
    setSelectedPlotId(fresh.plots[0].id);
    setTasks(fresh.tasks);
    setActivityLogs(fresh.activityLogs);
    setExpenses(fresh.expenses);
    setHarvests(fresh.harvests);
    setFarms(fresh.farms);
    setGrowingSeasons(fresh.growingSeasons);
    setCultivationTasks(fresh.cultivationTasks);
    setSeasonActivityLogs(fresh.seasonActivityLogs);
    setSeasonExpenseRecords(fresh.seasonExpenseRecords);
    setSeasonHarvestRecords(fresh.seasonHarvestRecords);
    setCropProfiles(fresh.cropProfiles);
    localStorage.removeItem(STORAGE_KEY);
    try {
      await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user.id, resetToSeed: true }),
      });
      setDbSyncStatus('Online — Tersinkronkan');
    } catch {
      // Ignore offline reset
    }
  };

  const handleSaveCropProfile = (profile: CropProfile) => {
    const exists = cropProfiles.some((p) => p.id === profile.id);
    const nextProfiles = exists
      ? cropProfiles.map((p) => (p.id === profile.id ? profile : p))
      : [profile, ...cropProfiles];
    persistAndSyncEntities({ cropProfiles: nextProfiles });
  };

  const handleDeleteCropProfile = (profileId: string) => {
    const nextProfiles = cropProfiles.filter((p) => p.id !== profileId);
    persistAndSyncEntities({ cropProfiles: nextProfiles });
  };

  const handleScheduleAlertAction = (alert: AiPredictiveAlert) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const tomorrowIso = addDaysToIsoDate(todayIso, 1);
    const newTask: ScheduledTask = {
      id: `task-ai-${Date.now()}`,
      plotId: alert.plotId || selectedPlotId,
      plotName: alert.cropName,
      commodity: 'Padi',
      title: `Tindakan Peringatan AI: ${alert.title}`,
      category:
        alert.riskCategory === 'Kekurangan Air'
          ? 'Pengairan'
          : alert.riskCategory === 'Defisiensi Nutrisi'
          ? 'Pemupukan'
          : 'Pemeriksaan Hama & Penyakit',
      dateLabel: `${formatIndonesianDate(tomorrowIso)}, 06:30 – 08:30`,
      isoDate: tomorrowIso,
      timeSlot: '06:30 – 08:30',
      completed: false,
      dosageOrNote: alert.actionableSteps[0] || alert.predictedTrigger,
      phaseNumber: 5,
    };
    setTasks((prev) => [newTask, ...prev]);

    const activeSeason = growingSeasons.find((s) => s.status === 'Aktif') || growingSeasons[0];
    if (activeSeason) {
      const newCultTask: CultivationTaskEntity = {
        id: `ctask-alert-${Date.now()}`,
        ownerId: user.id,
        seasonId: activeSeason.id,
        farmId: activeSeason.farmId,
        stageOrder: 6,
        category:
          alert.riskCategory === 'Kekurangan Air'
            ? 'Pengairan'
            : alert.riskCategory === 'Defisiensi Nutrisi'
            ? 'Pemupukan'
            : 'Pengendalian Hama & Penyakit',
        title: `Peringatan AI: ${alert.title}`,
        scheduledDate: tomorrowIso,
        status: 'Terjadwal',
        priority: alert.severity === 'Kritis' || alert.severity === 'Waspada' ? 'Tinggi' : 'Sedang',
        notes: alert.actionableSteps.join(' '),
        recommendationSource: 'Mesin Prediksi Peringatan Dini AI',
        createdAt: new Date().toISOString(),
      };
      persistAndSyncEntities({
        cultivationTasks: [newCultTask, ...cultivationTasks],
      });
    }
  };

  const primaryPlot = plots.find((p) => p.id === selectedPlotId) || plots[0];
  const todayTasks = tasks.slice(0, 4);
  const totalAreaHa = Number(
    (
      farms.length > 0
        ? farms.reduce((acc, f) => acc + f.areaHaNormalized, 0)
        : plots.reduce((acc, p) => acc + p.areaHa, 0)
    ).toFixed(2)
  );
  const totalExpensesRp =
    seasonExpenseRecords.length > 0
      ? seasonExpenseRecords.reduce((acc, e) => acc + e.totalRp, 0)
      : expenses.reduce((acc, e) => acc + e.totalRp, 0);
  const activeSeasonsCount = growingSeasons.filter((s) => s.status === 'Aktif').length;
  const overdueCultivationTasksCount = cultivationTasks.filter(
    (t) => t.status === 'Terjadwal' && t.scheduledDate < '2025-05-02'
  ).length;

  const userInitials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BS';

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FAF7] text-[#17231B]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 h-12 sm:h-14 bg-[#14532D] text-white border-b border-white/10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('beranda');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          TaniCerdas AI
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-white/85"
        >
          <a
            href="#beranda"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('beranda');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'beranda' ? 'text-white font-semibold underline' : ''
            }`}
          >
            Beranda
          </a>
          <a
            href="#budidaya"
            onClick={(e) => {
              e.preventDefault();
              setOpenSeasonWizardDirectly(false);
              setActiveTab('budidaya');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'budidaya' ? 'text-white font-semibold underline' : ''
            }`}
          >
            Budidaya Padi
          </a>
          <a
            href="#lahan"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('lahan');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'lahan' ? 'text-white font-semibold underline' : ''
            }`}
          >
            Lahan
          </a>
          <a
            href="#agenda"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('agenda');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'agenda' ? 'text-white font-semibold underline' : ''
            }`}
          >
            Kalender
          </a>
          <a
            href="#keuangan"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('keuangan');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'keuangan' ? 'text-white font-semibold underline' : ''
            }`}
          >
            Laporan
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('kamera')}
            className="group inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#14532D] bg-[#DCFCE7] hover:bg-white rounded-lg transition-all duration-300 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
          >
            <Camera className="h-4 w-4 text-[#15803D] transition-transform duration-300 ease-out group-hover:scale-125" />
            <span>Kamera AI</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Container (Sidebar on Desktop matching Screen 13 + Main Content Viewport) */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-6 px-4 sm:px-6 pt-5 pb-32">
        {/* Left Sidebar matching Screen 13: Menu Samping */}
        <aside
          aria-label="Menu Samping TaniCerdas AI"
          className="hidden lg:flex lg:w-64 shrink-0 flex-col justify-between rounded-3xl bg-[#14532D] text-white p-5 self-start sticky top-20 shadow-lg"
        >
          <div className="space-y-5">
            {/* Farmer Profile Block (Screen 13) */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/15">
              {user.avatarDataUrl ? (
                <img
                  src={user.avatarDataUrl}
                  alt={user.name}
                  className="h-11 w-11 rounded-full object-cover border border-[#DCFCE7] shrink-0"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-[#DCFCE7] text-[#14532D] font-bold flex items-center justify-center shrink-0">
                  {userInitials}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{user.name}</div>
                <div className="text-xs text-[#DCFCE7]/85 truncate">{user.role}</div>
              </div>
            </div>

            {/* Menu Items matching Screen 13 + Tahap 1 Budidaya Padi */}
            <nav className="space-y-1">
              {[
                { id: 'beranda', label: 'Beranda & Analitik AI', icon: Home },
                { id: 'budidaya', label: 'Budidaya Padi (14 Tahap)', icon: Layers },
                { id: 'lahan', label: 'Lahan & Tanaman', icon: Sprout },
                { id: 'kamera', label: 'Kamera AI', icon: Camera },
                { id: 'agenda', label: 'Kalender & Cuaca', icon: Calendar },
                { id: 'panduan', label: 'Panduan & Katalog', icon: BookOpen },
                { id: 'keuangan', label: 'Hasil & Keuangan', icon: Wallet },
                { id: 'profil', label: 'Profil & Offline', icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'budidaya') setOpenSeasonWizardDirectly(false);
                      setActiveTab(item.id as MainTab);
                    }}
                    className={`group w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#15803D] text-white shadow-xs'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 ease-out group-hover:scale-125" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Utility Links */}
          <div className="mt-8 pt-4 border-t border-white/15 space-y-2">
            <button
              type="button"
              onClick={() => setShowBoardModal(true)}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-left text-xs font-medium text-[#DCFCE7] transition-colors cursor-pointer"
            >
              Lihat Papan Presentasi UI
            </button>
            <button
              type="button"
              onClick={() => setAuthModalMode('splash')}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-xs font-medium text-white/80 transition-colors cursor-pointer"
            >
              Buka Splash / Login
            </button>
          </div>
        </aside>

        {/* Main Viewport Content */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: BERANDA (DASHBOARD — Screen 3 + Profil Tanaman + Peringatan AI + Grafik Interaktif) */}
          {activeTab === 'beranda' && (
            <div className="space-y-6">
              {/* Top Greeting & Status Strip */}
              <div className="rounded-2xl bg-white p-5 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {user.avatarDataUrl ? (
                    <img
                      src={user.avatarDataUrl}
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-[#15803D] shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#DCFCE7] border-2 border-[#15803D] text-[#14532D] font-bold flex items-center justify-center text-base shrink-0">
                      {userInitials}
                    </div>
                  )}
                  <div>
                    <h1
                      className="text-lg sm:text-xl font-bold text-[#17231B]"
                      data-testid="beranda-greeting-name"
                    >
                      Halo, {user.name}
                    </h1>
                    <p className="text-xs text-[#647067] mt-0.5 tabular-nums">
                      {user.role} · {user.village}
                      {user.poktanName ? ` · ${user.poktanName}` : ''} ·{' '}
                      <span className="font-semibold text-[#15803D]">{dbSyncStatus}</span>
                      {' · '}
                      <span>
                        {activeSeasonsCount} Musim Tanam Aktif
                        {overdueCultivationTasksCount > 0
                          ? ` · ${overdueCultivationTasksCount} Kegiatan Perlu Konfirmasi`
                          : ''}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBoardModal(true)}
                    className="h-10 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#17231B] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Papan Presentasi UI
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('lahan')}
                    className="h-10 px-3.5 rounded-xl border border-[#15803D] hover:bg-[#F2F7F0] text-xs font-semibold text-[#15803D] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    + Tambah Lahan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSeasonWizardDirectly(true);
                      setActiveTab('budidaya');
                    }}
                    className="h-10 px-4 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Mulai Musim Tanam</span>
                  </button>
                </div>
              </div>

              {/* Hero Row: Live Weather Card (Full Width on Dashboard) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Weather Summary Card — Synchronized with Live Open-Meteo & BMKG */}
                <div
                  className="lg:col-span-12 rounded-2xl bg-white p-5 border border-slate-200 flex flex-col justify-between"
                  data-testid="beranda-live-weather-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="h-14 w-14 rounded-2xl bg-amber-100/80 text-amber-500 flex items-center justify-center shrink-0">
                        <CloudSun className="h-9 w-9" />
                      </div>
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-[#17231B] tabular-nums">
                            {weather.tempC}°C
                          </span>
                          <span className="text-[11px] font-semibold text-[#647067] tabular-nums">
                            Terasa {weather.apparentTempC ?? weather.tempC}°C
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#17231B]">
                          {weather.conditionText}
                        </div>
                        <div className="text-xs text-[#647067] mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#15803D] shrink-0" />
                          <span>{weather.locationName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#647067] block">Kelembapan</span>
                      <strong className="text-base font-bold text-sky-700 tabular-nums">
                        {weather.humidityPct}%
                      </strong>
                      <span className="text-[11px] text-[#647067] block tabular-nums mt-0.5">
                        Hujan {weather.rainProbabilityPct}% ({weather.rainfallMm}mm) · Angin{' '}
                        {weather.windSpeedKmh} km/j
                      </span>
                    </div>
                  </div>

                  {/* GPS Accuracy Verification / Mandatory Device Location Notice on Beranda */}
                  {weather.locationSource === 'GPS Browser Akurat' ? (
                    <div className="mt-3 rounded-xl bg-[#F0FDF4] border border-[#15803D]/25 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-[#14532D] flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D] shrink-0" />
                        <span>
                          GPS Perangkat Aktif & Akurat
                          {weather.gpsAccuracyMeters ? ` (±${weather.gpsAccuracyMeters}m)` : ''}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchLiveWeather({ forceGps: true })}
                        className="font-bold text-[#15803D] hover:underline cursor-pointer"
                      >
                        Kalibrasi GPS
                      </button>
                    </div>
                  ) : weather.locationSource === 'Lokasi Terpilih Presisi' ? (
                    <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-semibold text-[#14532D] flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#15803D] shrink-0" />
                        <span>
                          Titik Lokasi Lahan Terkunci ({weather.latitude?.toFixed(3)}, {weather.longitude?.toFixed(3)})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => fetchLiveWeather({ forceGps: true })}
                        className="font-bold text-[#15803D] hover:underline cursor-pointer"
                      >
                        Aktifkan GPS
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-300 px-3 py-2.5 space-y-1.5 text-[11px]">
                      <div className="flex items-start gap-1.5 text-amber-950 font-bold">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>Wajib Aktifkan Lokasi (GPS) Perangkat untuk Akurasi Cuaca</span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-snug">
                        Aktifkan izin Lokasi/GPS di perangkat Anda agar deteksi cuaca tepat di titik lahan.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => fetchLiveWeather({ forceGps: true })}
                          className="px-2.5 py-1 rounded-lg bg-[#15803D] hover:bg-[#14532D] text-white font-bold cursor-pointer"
                        >
                          📍 Aktifkan GPS Sekarang
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('agenda')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 font-semibold cursor-pointer"
                        >
                          Cari / Pilih Lokasi Desa
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Spraying & Fertilizing Recommendation Badge on Beranda */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md ${
                        weather.sprayingAdvisory.status.toLowerCase().includes('tunda')
                          ? 'bg-amber-100 text-amber-950'
                          : 'bg-[#DCFCE7] text-[#14532D]'
                      }`}
                    >
                      {weather.sprayingAdvisory.status}
                    </span>
                    <span className="text-[#647067] tabular-nums">
                      Diperbarui: {weather.updatedAt}
                    </span>
                  </div>

                  {/* Soil Condition Mini Row (Screen 9 integration) */}
                  {primaryPlot && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-[#647067]">
                        Tanah {primaryPlot.name}:{' '}
                        <strong className="text-[#15803D] tabular-nums">
                          pH {primaryPlot.soilObservation.ph}
                        </strong>{' '}
                        ·{' '}
                        <strong className="text-[#17231B] tabular-nums">
                          Lembap {primaryPlot.soilObservation.moisturePct}%
                        </strong>{' '}
                        ·{' '}
                        <strong className="text-[#17231B] tabular-nums">
                          {primaryPlot.soilObservation.soilTempC}°C
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('agenda')}
                        className="font-semibold text-[#15803D] hover:underline cursor-pointer whitespace-nowrap"
                      >
                        Detail Cuaca →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Quick Action Buttons matching Screen 3 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('kamera')}
                  className="rounded-2xl bg-white p-4 border border-slate-200 hover:border-[#15803D] transition-all flex items-center gap-3.5 text-left cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#17231B]">Kamera AI</div>
                    <div className="text-xs text-[#647067]">Diagnosis daun & hama</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOpenSeasonWizardDirectly(false);
                    setActiveTab('budidaya');
                  }}
                  className="rounded-2xl bg-white p-4 border border-slate-200 hover:border-[#15803D] transition-all flex items-center gap-3.5 text-left cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#17231B]">Budidaya Padi</div>
                    <div className="text-xs text-[#647067]">14 Tahap & Wizard</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('agenda')}
                  className="rounded-2xl bg-white p-4 border border-slate-200 hover:border-[#15803D] transition-all flex items-center gap-3.5 text-left cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#17231B]">Jadwal</div>
                    <div className="text-xs text-[#647067]">Kalender & pengingat</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGuideInitialSubTab('Panduan');
                    setActiveTab('panduan');
                  }}
                  className="rounded-2xl bg-white p-4 border border-slate-200 hover:border-[#15803D] transition-all flex items-center gap-3.5 text-left cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#17231B]">Panduan</div>
                    <div className="text-xs text-[#647067]">SOP Padi & Katalog Hama</div>
                  </div>
                </button>
              </div>

              {/* EMBEDDED GEMINI AI 3.8 FLASH AGRICULTURAL ASSISTANT ON DASHBOARD */}
              <DashboardGeminiAgriChat
                user={user}
                primaryPlot={primaryPlot}
                weather={weather}
                latestDiagnosis={diagnosisHistory[0] || null}
              />

              {/* NEW: PERINGATAN DINI AI, VISUALISASI DATA INTERAKTIF (GARIS, BATANG, HEATMAP) & PROFIL TANAMAN */}
              <DashboardAnalyticsAndProfiles
                ownerId={user.id}
                plots={plots}
                cropProfiles={cropProfiles}
                weather={weather}
                heatmapSectors={seed.heatmapSectors}
                telemetrySeries={seed.telemetrySeries}
                sectionYieldComparison={seed.sectionYieldComparison}
                latestDiagnosis={diagnosisHistory[0] || null}
                diagnosisHistory={diagnosisHistory}
                isNewPriorityDiagnosis={hasNewPriorityDiagnosis}
                plantingSeasonMT={user.plantingSeasonMT}
                mainCommodity={user.mainCommodity}
                onSaveCropProfile={handleSaveCropProfile}
                onDeleteCropProfile={handleDeleteCropProfile}
                onScheduleAlertAction={handleScheduleAlertAction}
                onAddOptSprayToAgenda={handleAddOptSprayToAgenda}
                onOpenCameraDiagnosis={() => setActiveTab('kamera')}
              />

              {/* Lower Dashboard Grid: Left Agenda Hari Ini + Right AI Diagnosis & Financial Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Agenda Hari Ini matching Screen 3 */}
                <div className="lg:col-span-6 rounded-2xl bg-white p-5 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#17231B]">Agenda Hari Ini</h2>
                      <p className="text-xs text-[#647067]">
                        Klik kegiatan untuk menandai selesai · Terhubung Google Calendar
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#15803D] tabular-nums">
                      {todayTasks.filter((t) => !t.completed).length} kegiatan
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {todayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTaskCompleted(task.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleToggleTaskCompleted(task.id);
                          }
                        }}
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          task.completed
                            ? 'bg-[#F7FAF7] border-slate-200 opacity-75'
                            : 'bg-white border-slate-200 hover:border-[#15803D]'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5">
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
                            ) : (
                              <Circle className="h-5 w-5 text-[#15803D]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3
                              className={`text-sm font-bold ${
                                task.completed ? 'line-through text-[#647067]' : 'text-[#17231B]'
                              }`}
                            >
                              {task.title}
                            </h3>
                            <p className="text-xs text-[#647067] mt-0.5">
                              {task.commodity} - {task.plotName}
                            </p>
                            <p className="text-xs text-[#15803D] font-medium tabular-nums">
                              {task.dateLabel}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('agenda')}
                      className="w-full h-10 rounded-xl bg-[#F7FAF7] hover:bg-slate-100 text-xs font-semibold text-[#15803D] transition-colors cursor-pointer"
                    >
                      Buka Kalender Tanam →
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('agenda')}
                      data-testid="btn-dashboard-open-google-calendar"
                      className="w-full h-10 rounded-xl bg-[#DCFCE7] hover:bg-[#BBF7D0] text-xs font-bold text-[#14532D] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5 text-[#15803D]" />
                      <span>Sinkron Google Calendar</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Latest AI Diagnosis Highlight + Financial Summary */}
                <div className="lg:col-span-6 space-y-5">
                  {diagnosisHistory[0] && (
                    <div className="rounded-2xl bg-white p-5 border border-slate-200 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-[#DC2626]">
                            Pemantauan Kamera AI Terakhir
                          </span>
                          <h2 className="text-base font-bold text-[#17231B]">
                            Terdeteksi: {diagnosisHistory[0].detectedName}
                          </h2>
                        </div>
                        <span className="text-xs font-bold text-[#DC2626] tabular-nums">
                          Keyakinan {diagnosisHistory[0].confidencePct}%
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#F7FAF7] border border-slate-200">
                        <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                          <SymptomLeafIllustration
                            visualKey="blas"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-xs text-[#647067]">
                          <p className="text-[#17231B] font-medium line-clamp-2">
                            {diagnosisHistory[0].diseaseInfoSummary}
                          </p>
                          <p className="mt-1 text-[#15803D] font-semibold line-clamp-1">
                            Tindakan Utama: {diagnosisHistory[0].nonChemicalIpmActions[0] || 'Sanitasi & Pengendalian Hama Terpadu (PHT)'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveTab('kamera')}
                          className="flex-1 h-10 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Buka Kamera AI & Detail Obat
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGuideInitialSubTab('Katalog Hama');
                            setActiveTab('panduan');
                          }}
                          className="h-10 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#17231B] cursor-pointer"
                        >
                          Katalog Penyakit
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ringkasan Lahan & Biaya */}
                  <div className="rounded-2xl bg-white p-5 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#17231B]">
                        Ringkasan Lahan & Biaya Musim Aktif
                      </h2>
                      <button
                        type="button"
                        onClick={() => setActiveTab('keuangan')}
                        className="text-xs font-semibold text-[#15803D] hover:underline cursor-pointer"
                      >
                        Kalkulator & Laporan →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#F7FAF7]">
                        <span className="text-xs text-[#647067] block">Biaya Saprodi Tercatat</span>
                        <strong className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                          Rp {totalExpensesRp.toLocaleString('id-ID')}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F7FAF7]">
                        <span className="text-xs text-[#647067] block">Target Panen Lahan 1</span>
                        <strong className="text-sm font-bold text-[#15803D] tabular-nums mt-0.5 block">
                          ± 8.160 kg GKP (1,2 Ha)
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB BUDIDAYA PADI 14 TAHAP & WIZARD 8 LANGKAH (TAHAP 1 PERSISTENT DB) */}
          {activeTab === 'budidaya' && (
            <RiceCultivationLifecycleView
              ownerId={user.id}
              farms={farms}
              growingSeasons={growingSeasons}
              cultivationTasks={cultivationTasks}
              seasonActivityLogs={seasonActivityLogs}
              seasonExpenseRecords={seasonExpenseRecords}
              seasonHarvestRecords={seasonHarvestRecords}
              initialWizardOpen={openSeasonWizardDirectly}
              onUpdatePersistentData={persistAndSyncEntities}
            />
          )}

          {/* TAB 2: LAHAN & TANAMAN (Screen 4 + 8-Phase Rice Cultivation Engine) */}
          {activeTab === 'lahan' && (
            <PlotManagerView
              plots={plots}
              selectedPlotId={selectedPlotId}
              onSelectPlot={setSelectedPlotId}
              onAddPlot={handleAddPlot}
              onDeletePlot={handleDeletePlot}
              onTogglePhaseChecklist={handleTogglePhaseChecklist}
              onUpdatePhaseStatus={handleUpdatePhaseStatus}
              onNavigateToCamera={(comm, pId) => {
                setCameraCommodity(comm);
                setSelectedPlotId(pId);
                setActiveTab('kamera');
              }}
              onNavigateToCalendar={(pId) => {
                setSelectedPlotId(pId);
                setActiveTab('agenda');
              }}
              weather={weather}
              isLoadingWeather={isLoadingWeather}
              onRefreshWeather={() => fetchLiveWeather()}
            />
          )}

          {/* TAB 3: KAMERA AI & DIAGNOSIS (Screens 5, 6, 7 & 17) */}
          {activeTab === 'kamera' && (
            <CameraDiagnosisView
              plots={plots}
              selectedPlotId={selectedPlotId}
              initialCommodity={cameraCommodity}
              diagnosisHistory={diagnosisHistory}
              onSaveDiagnosisToHistory={handleSaveDiagnosisToHistory}
              onDiagnosisComplete={handleDiagnosisComplete}
              onClearDiagnosisHistory={() => {
                setDiagnosisHistory([]);
                setHasNewPriorityDiagnosis(false);
              }}
              onNavigateToDashboard={() => setActiveTab('beranda')}
            />
          )}

          {/* TAB 4: AGENDA / KALENDER TANAM & CUACA (Screens 8 & 9) */}
          {activeTab === 'agenda' && (
            <CalendarAndWeatherView
              plots={plots}
              selectedPlotId={selectedPlotId}
              onSelectPlot={setSelectedPlotId}
              tasks={tasks}
              onToggleTaskCompleted={handleToggleTaskCompleted}
              onAddTask={handleAddTask}
              weather={weather}
              isLoadingWeather={isLoadingWeather}
              onRefreshWeather={fetchLiveWeather}
              onUpdateSoilObservation={handleUpdateSoilObservation}
              remindersActive={remindersActive}
              onToggleReminders={() => setRemindersActive(!remindersActive)}
            />
          )}

          {/* TAB 5: PANDUAN, TANYA AI & KATALOG PENYAKIT (Screens 10 & 11) */}
          {activeTab === 'panduan' && (
            <GuideAndCatalogView
              plots={plots}
              initialSubTab={guideInitialSubTab}
            />
          )}

          {/* TAB 6: CATATAN LAHAN, KALKULATOR & LAPORAN (Screen 12) */}
          {activeTab === 'keuangan' && (
            <RecordsAndCalculatorView
              plots={plots}
              selectedPlotId={selectedPlotId}
              onSelectPlot={setSelectedPlotId}
              activityLogs={activityLogs}
              expenses={expenses}
              harvests={harvests}
              onAddActivityLog={(log) => setActivityLogs((prev) => [log, ...prev])}
              onAddExpense={(exp) => setExpenses((prev) => [exp, ...prev])}
              onAddHarvest={(harv) => setHarvests((prev) => [harv, ...prev])}
            />
          )}

          {/* TAB 7: PROFIL, NOTIFIKASI & MODE OFFLINE (Screens 14, 15, 16) */}
          {activeTab === 'profil' && (
            <ProfileAndOfflineView
              user={user}
              onUpdateUser={handleUpdateUserProfile}
              plots={plots}
              weather={weather}
              isOfflineSimulated={isOfflineSimulated}
              onToggleOfflineSimulated={() => setIsOfflineSimulated(!isOfflineSimulated)}
              lastSyncedAt={`${lastSyncedAt} (${dbSyncStatus})`}
              onTriggerManualSync={() => {
                persistAndSyncEntities({});
              }}
              onOpenAuthModal={() => setAuthModalMode('login')}
              onResetDemoData={handleResetDemoData}
              onAddSprayAlertToAgenda={handleAddOptSprayToAgenda}
              onOpenCameraDiagnosis={() => setActiveTab('kamera')}
            />
          )}

          {/* CREATOR SIGNATURE BANNER: HANYA TAMPIL DI MENU DASHBOARD (BERANDA) ATAU PROFIL SAJA */}
          {(activeTab === 'beranda' || activeTab === 'profil') && (
            <footer
              aria-label="Kredit Pembuat Aplikasi SYNERGY Smart System"
              className="mt-8 rounded-2xl bg-gradient-to-r from-[#14532D] to-[#0F766E] text-white p-5 border border-emerald-400/20 shadow-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/15 text-[#DCFCE7] text-[11px] font-semibold tracking-wide">
                    <span>Inovasi Teknologi Pertanian Digital Indonesia</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Dirancang & Dikembangkan oleh{' '}
                    <span className="text-[#BBF7D0] font-extrabold">
                      SYNERGY Smart System
                    </span>
                  </h2>
                  <p className="text-xs text-[#DCFCE7]/90 leading-relaxed">
                    Menghadirkan ekosistem <em>Smart Farming</em> terpadu berbasis kecerdasan buatan <strong>Gemini AI 3.8 Flash</strong>, deteksi organ tanaman presisi, rekomendasi PHT multi-merk dagang, serta telemetri cuaca pertanian real-time untuk petani Indonesia.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-64">
                  <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#BBF7D0] uppercase tracking-wide">
                      Arsitektur & Rekayasa Sistem
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      SYNERGY Smart System
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/15 px-3 py-2">
                    <div className="text-[10px] font-semibold text-[#DCFCE7]/80 uppercase tracking-wide">
                      Fokus Teknologi
                    </div>
                    <div className="text-xs font-medium text-white mt-0.5">
                      Precision Agro-AI & Live Telemetry
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#DCFCE7]/80">
                <span>
                  © {new Date().getFullYear()} <strong>SYNERGY Smart System</strong> — Ekosistem TaniCerdas AI.
                </span>
                <span className="font-medium text-[#BBF7D0]">
                  Petani Cerdas, Lahan Berkualitas, Panen Melimpah
                </span>
              </div>
            </footer>
          )}
        </main>
      </div>

      {/* Dynamic Notched Mobile & Floating Navigation Bar matching reference design */}
      <NotchedMobileNavbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'budidaya') {
            setOpenSeasonWizardDirectly(false);
          }
          setActiveTab(tab);
        }}
      />

      {/* Modals for Splash / Login / Register & Presentation Board */}
      <SplashAndAuthModal
        mode={authModalMode}
        onClose={() => setAuthModalMode(null)}
        onSelectMode={setAuthModalMode}
        onLoginSuccess={(profile) => setUser(profile)}
      />

      <PresentationBoardModal
        open={showBoardModal}
        onClose={() => setShowBoardModal(false)}
      />
    </div>
  );
}
