import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  Edit3,
  Layers,
  MapPin,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sprout,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  CultivationSystem,
  CultivationTaskEntity,
  FarmEntity,
  GrowingSeasonEntity,
  RiceStageOrder,
  SeasonActivityLog,
  SeasonExpenseRecord,
  SeasonHarvestRecord,
} from '../types/agronomy';
import {
  addDaysIso,
  calculateSeasonFinancialSummary,
  formatDateIndonesian,
  formatRupiah,
  generate14StageRiceLifecycle,
  getVarietyMaturityProfile,
  normalizeAreaToHa,
  recalculateSeasonScheduleOnPlantingDateChange,
} from '../utils/agronomyCalculations';

interface RiceCultivationLifecycleViewProps {
  ownerId: string;
  farms: FarmEntity[];
  growingSeasons: GrowingSeasonEntity[];
  cultivationTasks: CultivationTaskEntity[];
  seasonActivityLogs: SeasonActivityLog[];
  seasonExpenseRecords: SeasonExpenseRecord[];
  seasonHarvestRecords: SeasonHarvestRecord[];
  initialWizardOpen?: boolean;
  onUpdatePersistentData: (next: {
    farms?: FarmEntity[];
    growingSeasons?: GrowingSeasonEntity[];
    cultivationTasks?: CultivationTaskEntity[];
    seasonActivityLogs?: SeasonActivityLog[];
    seasonExpenseRecords?: SeasonExpenseRecord[];
    seasonHarvestRecords?: SeasonHarvestRecord[];
  }) => void;
}

const RICE_VARIETIES = [
  'Ciherang',
  'Inpari 32 HDB',
  'Inpari 42 Agritan GSR',
  'IR64',
  'Situ Bagendit',
];

const CULTIVATION_SYSTEMS: CultivationSystem[] = [
  'Pindah Tanam (Jajar Legowo 2:1)',
  'Pindah Tanam (Tegel 25x25 cm)',
  'Tanam Benih Langsung (Tabela)',
  'SRI (System of Rice Intensification)',
];

export const RiceCultivationLifecycleView: React.FC<RiceCultivationLifecycleViewProps> = ({
  ownerId,
  farms,
  growingSeasons,
  cultivationTasks,
  seasonActivityLogs,
  seasonExpenseRecords,
  seasonHarvestRecords,
  initialWizardOpen = false,
  onUpdatePersistentData,
}) => {
  const activeFarms = useMemo(() => farms.filter((f) => !f.isArchived), [farms]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    growingSeasons[0]?.id || ''
  );
  const [subView, setSubView] = useState<'detail' | 'wizard' | 'farms' | 'tasks' | 'logs'>(
    initialWizardOpen ? 'wizard' : 'detail'
  );

  // Selected Growing Season
  const activeSeason = useMemo(
    () =>
      growingSeasons.find((s) => s.id === selectedSeasonId) ||
      growingSeasons[0] ||
      null,
    [growingSeasons, selectedSeasonId]
  );

  const seasonTasks = useMemo(
    () =>
      activeSeason
        ? cultivationTasks.filter((t) => t.seasonId === activeSeason.id)
        : [],
    [cultivationTasks, activeSeason]
  );

  const seasonActivities = useMemo(
    () =>
      activeSeason
        ? seasonActivityLogs.filter((a) => a.seasonId === activeSeason.id)
        : [],
    [seasonActivityLogs, activeSeason]
  );

  const seasonExpenses = useMemo(
    () =>
      activeSeason
        ? seasonExpenseRecords.filter((e) => e.seasonId === activeSeason.id)
        : [],
    [seasonExpenseRecords, activeSeason]
  );

  const seasonHarvests = useMemo(
    () =>
      activeSeason
        ? seasonHarvestRecords.filter((h) => h.seasonId === activeSeason.id)
        : [],
    [seasonHarvestRecords, activeSeason]
  );

  const financialSummary = useMemo(() => {
    if (!activeSeason) {
      return {
        totalActivityCostRp: 0,
        totalStandaloneExpenseRp: 0,
        totalHarvestCostRp: 0,
        totalSeasonCostRp: 0,
        costPerHaRp: 0,
        totalHarvestKg: 0,
        grossRevenueRp: 0,
        netProfitRp: 0,
        yieldTonPerHa: 0,
      };
    }
    return calculateSeasonFinancialSummary({
      plantedAreaHa: activeSeason.plantedAreaHa,
      activities: seasonActivities,
      expenses: seasonExpenses,
      harvests: seasonHarvests,
    });
  }, [activeSeason, seasonActivities, seasonExpenses, seasonHarvests]);

  // ============================================================================
  // STATE UNTUK WIZARD 8 LANGKAH "MULAI MUSIM TANAM PADI"
  // ============================================================================
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizFarmId, setWizFarmId] = useState<string>(activeFarms[0]?.id || 'lahan-1');
  const [wizAreaValue, setWizAreaValue] = useState<number>(1.0);
  const [wizAreaUnit, setWizAreaUnit] = useState<'ha' | 'm2'>('ha');
  const [wizVariety, setWizVariety] = useState<string>('Inpari 32 HDB');
  const [wizSeedingDate, setWizSeedingDate] = useState<string>('2025-04-14');
  const [wizPlantingDate, setWizPlantingDate] = useState<string>('2025-05-01');
  const [wizSystem, setWizSystem] = useState<CultivationSystem>('Pindah Tanam (Jajar Legowo 2:1)');
  const [wizInitialSoil, setWizInitialSoil] = useState<string>(
    'Tanah aluvial berlumpur rata, pH 6,5, saluran irigasi teknis lancar'
  );
  const [wizPrevCrop, setWizPrevCrop] = useState<string>('Padi Musim Tanam I');
  const [wizTargetYieldKg, setWizTargetYieldKg] = useState<number>(7200);
  const [wizConfirmDuplicate, setWizConfirmDuplicate] = useState<boolean>(false);
  const [wizError, setWizError] = useState<string>('');

  const wizSelectedFarm = useMemo(
    () => farms.find((f) => f.id === wizFarmId) || activeFarms[0],
    [farms, activeFarms, wizFarmId]
  );

  const wizNormalizedHa = useMemo(
    () => normalizeAreaToHa(wizAreaValue, wizAreaUnit),
    [wizAreaValue, wizAreaUnit]
  );

  const wizVarietyProfile = useMemo(
    () => getVarietyMaturityProfile(wizVariety, wizSystem),
    [wizVariety, wizSystem]
  );

  const existingActiveSeasonOnWizFarm = useMemo(
    () =>
      growingSeasons.find(
        (s) => s.farmId === wizFarmId && s.status === 'Aktif'
      ),
    [growingSeasons, wizFarmId]
  );

  // ============================================================================
  // STATE UNTUK KONFIRMASI PINDAH FASE & UBAH TANGGAL TANAM (RESCHEDULER)
  // ============================================================================
  const [confirmStageOrder, setConfirmStageOrder] = useState<RiceStageOrder | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newPlantingDateInput, setNewPlantingDateInput] = useState(
    activeSeason?.plantingDate || '2025-04-12'
  );
  const [rescheduleBanner, setRescheduleBanner] = useState<string>('');

  // ============================================================================
  // STATE UNTUK TAMBAH LAHAN, AKTIVITAS, BIAYA & PANEN
  // ============================================================================
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [farmNameInput, setFarmNameInput] = useState('');
  const [farmLocInput, setFarmLocInput] = useState('Desa Larikrejo, Kec. Undaan, Kudus');
  const [farmAreaValInput, setFarmAreaValInput] = useState(0.5);
  const [farmAreaUnitInput, setFarmAreaUnitInput] = useState<'ha' | 'm2'>('ha');
  const [farmSoilInput, setFarmSoilInput] = useState<FarmEntity['soilType']>('Aluvial Sawah');
  const [farmWaterInput, setFarmWaterInput] = useState<FarmEntity['waterSource']>('Irigasi Teknis');
  const [farmNotesInput, setFarmNotesInput] = useState('');
  const [confirmDeleteFarmId, setConfirmDeleteFarmId] = useState<string | null>(null);

  // Activity Log Form
  const [actType, setActType] = useState<SeasonActivityLog['activityType']>('Pemupukan');
  const [actDate, setActDate] = useState('2025-05-02');
  const [actInputUsed, setActInputUsed] = useState('Pupuk Urea Susulan (BWD < 4)');
  const [actQty, setActQty] = useState(120);
  const [actUnit, setActUnit] = useState('kg');
  const [actUnitPrice, setActUnitPrice] = useState(2600);
  const [actNotes, setActNotes] = useState('Aplikasi merata kondisi air macak-macak');

  // Harvest Form
  const [harvDate, setHarvDate] = useState('2025-07-11');
  const [harvAreaHa, setHarvAreaHa] = useState(activeSeason?.plantedAreaHa || 1.2);
  const [harvYieldKg, setHarvYieldKg] = useState(8400);
  const [harvMoisture, setHarvMoisture] = useState(18.0);
  const [harvPriceKg, setHarvPriceKg] = useState(6800);
  const [harvCostRp, setHarvCostRp] = useState(3800000);
  const [harvNotes, setHarvNotes] = useState('Panen GKP dengan Combine Harvester');

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleSaveNewSeasonFromWizard = () => {
    setWizError('');
    if (!wizSelectedFarm) {
      setWizError('Pilih lahan terlebih dahulu pada Langkah 1.');
      return;
    }
    if (wizNormalizedHa <= 0 || wizNormalizedHa > wizSelectedFarm.areaHaNormalized) {
      setWizError(
        `Luas tanam (${wizNormalizedHa} Ha) harus lebih dari 0 dan tidak melebihi luas lahan (${wizSelectedFarm.areaHaNormalized} Ha).`
      );
      return;
    }
    if (wizSystem !== 'Tanam Benih Langsung (Tabela)' && wizSeedingDate > wizPlantingDate) {
      setWizError('Tanggal semai tidak boleh lebih lambat dari tanggal pindah tanam.');
      return;
    }
    if (existingActiveSeasonOnWizFarm && !wizConfirmDuplicate) {
      setWizError(
        `Lahan "${wizSelectedFarm.name}" masih memiliki musim tanam aktif. Centang konfirmasi di bawah jika Anda ingin tetap membuat musim tanam baru.`
      );
      return;
    }

    const newSeasonId = `season-padi-${Date.now()}`;
    const lifecycle = generate14StageRiceLifecycle({
      seasonId: newSeasonId,
      farmId: wizSelectedFarm.id,
      ownerId,
      variety: wizVariety,
      plantedAreaHa: wizNormalizedHa,
      seedingDate:
        wizSystem === 'Tanam Benih Langsung (Tabela)' ? undefined : wizSeedingDate,
      plantingDate: wizPlantingDate,
      cultivationSystem: wizSystem,
      currentHst: 0,
    });

    const newSeason: GrowingSeasonEntity = {
      id: newSeasonId,
      farmId: wizSelectedFarm.id,
      farmName: wizSelectedFarm.name,
      ownerId,
      commodity: 'Padi',
      variety: wizVariety,
      plantedAreaHa: wizNormalizedHa,
      startDate: addDaysIso(wizPlantingDate, -21),
      seedingDate:
        wizSystem === 'Tanam Benih Langsung (Tabela)' ? undefined : wizSeedingDate,
      plantingDate: wizPlantingDate,
      cultivationSystem: wizSystem,
      currentStageOrder: lifecycle.currentStageOrder,
      currentStageName: lifecycle.currentStageName,
      currentHst: 0,
      targetYieldKg:
        Number(wizTargetYieldKg) || Math.round(wizNormalizedHa * 6800),
      status: 'Aktif',
      estimatedHarvestDate: lifecycle.estimatedHarvestDate,
      harvestWindowEnd: lifecycle.harvestWindowEnd,
      initialSoilCondition: wizInitialSoil,
      previousCropHistory: wizPrevCrop,
      notes: `Musim tanam Padi ${wizVariety} (${wizSystem}) dibuat melalui Wizard 8 Langkah.`,
      stages: lifecycle.stages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onUpdatePersistentData({
      growingSeasons: [newSeason, ...growingSeasons],
      cultivationTasks: [...cultivationTasks, ...lifecycle.tasks],
    });
    setSelectedSeasonId(newSeasonId);
    setWizardStep(1);
    setSubView('detail');
  };

  const handleConfirmStageChange = (targetOrder: RiceStageOrder) => {
    if (!activeSeason) return;
    const updatedStages = activeSeason.stages.map((st) => ({
      ...st,
      status:
        st.order < targetOrder
          ? ('Selesai' as const)
          : st.order === targetOrder
          ? ('Aktif' as const)
          : ('Belum Dimulai' as const),
    }));
    const targetStageObj = updatedStages.find((st) => st.order === targetOrder);
    const updatedSeason: GrowingSeasonEntity = {
      ...activeSeason,
      currentStageOrder: targetOrder,
      currentStageName: targetStageObj?.name || activeSeason.currentStageName,
      currentHst: Math.max(0, targetStageObj?.hstStart ?? activeSeason.currentHst),
      stages: updatedStages,
      updatedAt: new Date().toISOString(),
    };

    onUpdatePersistentData({
      growingSeasons: growingSeasons.map((s) =>
        s.id === activeSeason.id ? updatedSeason : s
      ),
    });
    setConfirmStageOrder(null);
  };

  const handleApplyReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeason || !newPlantingDateInput) return;

    const res = recalculateSeasonScheduleOnPlantingDateChange({
      oldPlantingDate: activeSeason.plantingDate,
      newPlantingDate: newPlantingDateInput,
      variety: activeSeason.variety,
      cultivationSystem: activeSeason.cultivationSystem,
      existingTasks: seasonTasks,
    });

    const otherTasks = cultivationTasks.filter(
      (t) => t.seasonId !== activeSeason.id
    );
    const updatedSeason: GrowingSeasonEntity = {
      ...activeSeason,
      plantingDate: newPlantingDateInput,
      estimatedHarvestDate: res.newEstimatedHarvestDate,
      harvestWindowEnd: res.newHarvestWindowEnd,
      updatedAt: new Date().toISOString(),
    };

    onUpdatePersistentData({
      growingSeasons: growingSeasons.map((s) =>
        s.id === activeSeason.id ? updatedSeason : s
      ),
      cultivationTasks: [...otherTasks, ...res.updatedTasks],
    });

    setRescheduleBanner(
      `Tanggal tanam diperbarui (${res.dayDelta >= 0 ? `+${res.dayDelta}` : res.dayDelta} hari): ${res.shiftedPlannedCount} jadwal 'Terjadwal' digeser otomatis, ${res.preservedCompletedCount} kegiatan 'Selesai' tetap dipertahankan.`
    );
    setShowRescheduleModal(false);
  };

  const handleToggleTaskStatus = (
    task: CultivationTaskEntity,
    nextStatus: CultivationTaskEntity['status']
  ) => {
    const updated: CultivationTaskEntity = {
      ...task,
      status: nextStatus,
      completedDate:
        nextStatus === 'Selesai'
          ? new Date().toISOString().slice(0, 10)
          : undefined,
    };
    onUpdatePersistentData({
      cultivationTasks: cultivationTasks.map((t) =>
        t.id === task.id ? updated : t
      ),
    });
  };

  const handleAddActivityAndSyncExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeason) return;
    const totalCost = Math.max(0, Math.round(Number(actQty) * Number(actUnitPrice)));
    const newActId = `act-log-${Date.now()}`;
    const newAct: SeasonActivityLog = {
      id: newActId,
      farmId: activeSeason.farmId,
      seasonId: activeSeason.id,
      ownerId,
      activityType: actType,
      executionDate: actDate,
      inputUsed: actInputUsed.trim() || actType,
      quantity: Number(actQty),
      unit: actUnit,
      unitPriceRp: Number(actUnitPrice),
      actualCostRp: totalCost,
      notes: actNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextExpenses = [...seasonExpenseRecords];
    if (totalCost > 0) {
      const categoryMap: Record<
        SeasonActivityLog['activityType'],
        SeasonExpenseRecord['category']
      > = {
        'Olah Lahan': 'Sewa Alat',
        Semai: 'Benih',
        Tanam: 'Tenaga Kerja',
        Pengairan: 'Irigasi',
        Pemupukan: 'Pupuk',
        Penyiangan: 'Tenaga Kerja',
        Pengamatan: 'Lainnya',
        'Pengendalian OPT': 'Pengendalian OPT',
        Panen: 'Panen & Pascapanen',
        Pascapanen: 'Panen & Pascapanen',
      };
      nextExpenses.unshift({
        id: `sexp-${Date.now()}`,
        seasonId: activeSeason.id,
        farmId: activeSeason.farmId,
        ownerId,
        category: categoryMap[actType] || 'Lainnya',
        description: `${actType}: ${actInputUsed.trim()}`,
        quantity: Number(actQty),
        unit: actUnit,
        unitPriceRp: Number(actUnitPrice),
        totalRp: totalCost,
        date: actDate,
        notes: actNotes.trim(),
        linkedActivityId: newActId,
        createdAt: new Date().toISOString(),
      });
    }

    onUpdatePersistentData({
      seasonActivityLogs: [newAct, ...seasonActivityLogs],
      seasonExpenseRecords: nextExpenses,
    });
    setActInputUsed('');
    setActNotes('');
  };

  const handleAddHarvestRecord = (e: React.FormEvent, markSeasonCompleted: boolean) => {
    e.preventDefault();
    if (!activeSeason || harvYieldKg <= 0) return;

    const grossRev = Math.round(Number(harvYieldKg) * Number(harvPriceKg));
    const newHarv: SeasonHarvestRecord = {
      id: `sharv-${Date.now()}`,
      seasonId: activeSeason.id,
      farmId: activeSeason.farmId,
      ownerId,
      harvestDate: harvDate,
      harvestedAreaHa: Number(harvAreaHa),
      actualYieldKg: Number(harvYieldKg),
      moisturePct: Number(harvMoisture),
      sellingPricePerKgRp: Number(harvPriceKg),
      grossRevenueRp: grossRev,
      harvestCostRp: Number(harvCostRp),
      notes: harvNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextSeasons = markSeasonCompleted
      ? growingSeasons.map((s) =>
          s.id === activeSeason.id
            ? {
                ...s,
                status: 'Selesai' as const,
                currentStageOrder: 14 as RiceStageOrder,
                currentStageName: 'Pascapanen & Evaluasi Musim',
                stages: s.stages.map((st) => ({ ...st, status: 'Selesai' as const })),
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      : growingSeasons;

    onUpdatePersistentData({
      seasonHarvestRecords: [newHarv, ...seasonHarvestRecords],
      growingSeasons: nextSeasons,
    });
  };

  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmNameInput.trim() || farmAreaValInput <= 0) return;
    const normHa = normalizeAreaToHa(farmAreaValInput, farmAreaUnitInput);
    const newFarm: FarmEntity = {
      id: `lahan-${Date.now()}`,
      ownerId,
      name: farmNameInput.trim(),
      location: farmLocInput.trim() || 'Desa Larikrejo, Kudus',
      areaValue: Number(farmAreaValInput),
      areaUnit: farmAreaUnitInput,
      areaHaNormalized: normHa,
      soilType: farmSoilInput,
      waterSource: farmWaterInput,
      notes: farmNotesInput.trim() || 'Lahan budidaya padi baru.',
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdatePersistentData({
      farms: [...farms, newFarm],
    });
    setFarmNameInput('');
    setFarmNotesInput('');
    setShowAddFarmModal(false);
  };

  const handleSafeDeleteFarm = (farmId: string) => {
    const hasSeasons = growingSeasons.some((s) => s.farmId === farmId);
    if (hasSeasons) {
      // Safe policy: archive if it has historical seasons
      onUpdatePersistentData({
        farms: farms.map((f) =>
          f.id === farmId ? { ...f, isArchived: true, updatedAt: new Date().toISOString() } : f
        ),
      });
    } else {
      onUpdatePersistentData({
        farms: farms.filter((f) => f.id !== farmId),
      });
    }
    setConfirmDeleteFarmId(null);
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR & SUB-NAVIGATION */}
      <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E7D32]">
              Tahap 1 • Sistem Siklus Budidaya Padi Persisten
            </span>
            <h2 className="text-lg font-extrabold text-[#142615]">
              Budidaya Padi dari Lahan sampai Panen (14 Tahap)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setWizardStep(1);
                setSubView('wizard');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white text-xs font-bold whitespace-nowrap shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Mulai Musim Tanam Padi
            </button>
            <button
              type="button"
              onClick={() => setShowAddFarmModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F2F7F0] hover:bg-[#E2EFE0] text-[#1E5622] border border-[#DCE8DC] text-xs font-bold whitespace-nowrap"
            >
              + Tambah Lahan
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E8F0E8]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSubView('detail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                subView === 'detail'
                  ? 'bg-[#1E5622] text-white'
                  : 'bg-[#F2F7F0] text-[#2F4F32] hover:bg-[#E2EFE0]'
              }`}
            >
              14 Tahap & Detail Musim
            </button>
            <button
              type="button"
              onClick={() => setSubView('tasks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                subView === 'tasks'
                  ? 'bg-[#1E5622] text-white'
                  : 'bg-[#F2F7F0] text-[#2F4F32] hover:bg-[#E2EFE0]'
              }`}
            >
              Kalender Kegiatan ({seasonTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('logs')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                subView === 'logs'
                  ? 'bg-[#1E5622] text-white'
                  : 'bg-[#F2F7F0] text-[#2F4F32] hover:bg-[#E2EFE0]'
              }`}
            >
              Catatan Aktivitas, Biaya & Panen
            </button>
            <button
              type="button"
              onClick={() => setSubView('farms')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                subView === 'farms'
                  ? 'bg-[#1E5622] text-white'
                  : 'bg-[#F2F7F0] text-[#2F4F32] hover:bg-[#E2EFE0]'
              }`}
            >
              Lahan Saya ({farms.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('wizard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                subView === 'wizard'
                  ? 'bg-[#1E5622] text-white'
                  : 'bg-[#F2F7F0] text-[#2F4F32] hover:bg-[#E2EFE0]'
              }`}
            >
              Wizard 8 Langkah
            </button>
          </div>

          {/* Season Selector */}
          {growingSeasons.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#4A634D]">Musim Aktif:</span>
              <select
                value={activeSeason?.id || ''}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                aria-label="Pilih Musim Tanam"
                className="px-3 py-1.5 rounded-xl border border-[#DCE8DC] bg-[#F7FAF6] text-xs font-bold text-[#142615]"
              >
                {growingSeasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.farmName} — Padi {s.variety} ({s.plantedAreaHa} Ha • {s.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          SUBVIEW 1: WIZARD 8 LANGKAH "MULAI MUSIM TANAM PADI"
         ===================================================================== */}
      {subView === 'wizard' && (
        <section
          aria-label="Wizard 8 Langkah Mulai Musim Tanam Padi"
          className="bg-white rounded-2xl border border-[#DCE8DC] p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6EFE6] pb-3">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E7D32]">
                Wizard Mulai Musim Tanam • Langkah {wizardStep} dari 8
              </span>
              <h3 className="text-base font-extrabold text-[#142615]">
                Perencanaan Siklus Budidaya Padi 14 Tahap
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => setWizardStep(step)}
                  className={`w-7 h-7 rounded-lg text-xs font-extrabold tabular-nums transition-colors ${
                    wizardStep === step
                      ? 'bg-[#1E5622] text-white'
                      : wizardStep > step
                      ? 'bg-[#E8F5E9] text-[#1E5622]'
                      : 'bg-[#F2F7F0] text-[#5B735E]'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {wizError && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#991B1B]">
              {wizError}
            </div>
          )}

          {/* Step 1: Pilih Lahan */}
          {wizardStep === 1 && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#142615]">
                Langkah 1: Pilih Lahan Sawah
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeFarms.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setWizFarmId(f.id);
                      setWizAreaValue(f.areaHaNormalized);
                      setWizAreaUnit('ha');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      wizFarmId === f.id
                        ? 'border-[#1E5622] bg-[#F2F7F0] ring-2 ring-[#1E5622]/20'
                        : 'border-[#DCE8DC] bg-white hover:border-[#2E7D32]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#142615]">{f.name}</span>
                      <span className="text-xs font-bold text-[#1E5622] tabular-nums">
                        {f.areaHaNormalized} Ha
                      </span>
                    </div>
                    <p className="text-[11px] text-[#4A634D] mt-1">{f.location}</p>
                    <p className="text-[11px] text-[#2F4F32] mt-1">
                      Tanah: {f.soilType} • Air: {f.waterSource}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Masukkan Luas Tanam */}
          {wizardStep === 2 && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#142615]">
                Langkah 2: Masukkan Luas Tanam Padi
              </h4>
              <p className="text-xs text-[#4A634D]">
                Luas maksimum pada {wizSelectedFarm?.name}:{' '}
                <strong>{wizSelectedFarm?.areaHaNormalized} Ha</strong>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Nilai Luas Tanam
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.05"
                    value={wizAreaValue}
                    onChange={(e) => setWizAreaValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold text-[#142615]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Satuan Luas
                  </label>
                  <select
                    value={wizAreaUnit}
                    onChange={(e) => setWizAreaUnit(e.target.value as 'ha' | 'm2')}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold text-[#142615] bg-white"
                  >
                    <option value="ha">Hektare (Ha)</option>
                    <option value="m2">Meter Persegi (m²)</option>
                  </select>
                </div>
              </div>
              <p className="text-xs font-bold text-[#1E5622] tabular-nums">
                Konversi Standar: {wizNormalizedHa} Ha ({Math.round(wizNormalizedHa * 10000).toLocaleString('id-ID')} m²)
              </p>
            </div>
          )}

          {/* Step 3: Pilih Varietas Padi */}
          {wizardStep === 3 && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#142615]">
                Langkah 3: Pilih Varietas Unggul Padi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {RICE_VARIETIES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setWizVariety(v)}
                    className={`p-3 rounded-xl border text-left ${
                      wizVariety === v
                        ? 'border-[#1E5622] bg-[#F2F7F0] font-extrabold text-[#142615]'
                        : 'border-[#DCE8DC] bg-white text-[#2F4F32]'
                    }`}
                  >
                    <span className="text-xs block">{v}</span>
                    <span className="text-[10px] text-[#4A634D]">
                      Komoditas: Padi Sawah
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Tanggal Semai & Tanggal Tanam */}
          {wizardStep === 4 && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#142615]">
                Langkah 4: Masukkan Tanggal Semai & Tanggal Tanam
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Tanggal Semai Benih
                  </label>
                  <input
                    type="date"
                    value={wizSeedingDate}
                    onChange={(e) => setWizSeedingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold text-[#142615]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Tanggal Tanam / Pindah Tanam (0 HST)
                  </label>
                  <input
                    type="date"
                    value={wizPlantingDate}
                    onChange={(e) => setWizPlantingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold text-[#142615]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Pilih Sistem Budidaya */}
          {wizardStep === 5 && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#142615]">
                Langkah 5: Pilih Sistem Budidaya Padi
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CULTIVATION_SYSTEMS.map((sys) => (
                  <button
                    key={sys}
                    type="button"
                    onClick={() => setWizSystem(sys)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold ${
                      wizSystem === sys
                        ? 'border-[#1E5622] bg-[#F2F7F0] text-[#142615]'
                        : 'border-[#DCE8DC] bg-white text-[#2F4F32]'
                    }`}
                  >
                    {sys}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Informasi Awal Kondisi Lahan */}
          {wizardStep === 6 && (
            <div className="space-y-3 max-w-xl">
              <h4 className="text-sm font-extrabold text-[#142615]">
                Langkah 6: Informasi Awal Kondisi Lahan & Target Hasil
              </h4>
              <div>
                <label className="block text-xs font-bold text-[#142615] mb-1">
                  Kondisi Awal Tanah & Air
                </label>
                <input
                  type="text"
                  value={wizInitialSoil}
                  onChange={(e) => setWizInitialSoil(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Riwayat Tanaman Sebelumnya
                  </label>
                  <input
                    type="text"
                    value={wizPrevCrop}
                    onChange={(e) => setWizPrevCrop(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#142615] mb-1">
                    Target Hasil Panen (Kg GKP)
                  </label>
                  <input
                    type="number"
                    value={wizTargetYieldKg}
                    onChange={(e) => setWizTargetYieldKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-semibold text-[#142615]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 7 & 8: Tinjau Rencana Budidaya & Simpan */}
          {(wizardStep === 7 || wizardStep === 8) && (
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-[#142615]">
                {wizardStep === 7
                  ? 'Langkah 7: Tinjau Rencana Budidaya & Estimasi Input'
                  : 'Langkah 8: Konfirmasi & Buat Kalender Kegiatan 14 Tahap'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#F7FAF6] border border-[#DCE8DC] rounded-xl p-3.5 text-xs tabular-nums">
                <div>
                  <span className="text-[10px] text-[#5B735E] block">Lahan & Luas</span>
                  <strong className="text-[#142615]">
                    {wizSelectedFarm?.name} ({wizNormalizedHa} Ha)
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#5B735E] block">Varietas & Sistem</span>
                  <strong className="text-[#142615]">
                    {wizVariety} • {wizSystem}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#5B735E] block">Estimasi Panen</span>
                  <strong className="text-[#1E5622]">
                    {formatDateIndonesian(
                      addDaysIso(wizPlantingDate, wizVarietyProfile.maturityDaysAfterPlanting)
                    )}{' '}
                    ({wizVarietyProfile.maturityDaysAfterPlanting} HST)
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#5B735E] block">Estimasi Benih & Pupuk</span>
                  <strong className="text-[#142615]">
                    Benih {Math.round(wizNormalizedHa * wizVarietyProfile.seedRateKgPerHa)} kg •
                    Urea {Math.round(wizNormalizedHa * wizVarietyProfile.ureaKgPerHa)} kg
                  </strong>
                </div>
              </div>

              {existingActiveSeasonOnWizFarm && (
                <label className="flex items-start gap-2 p-3 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/40 text-xs text-[#92400E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wizConfirmDuplicate}
                    onChange={(e) => setWizConfirmDuplicate(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Konfirmasi Musim Tanam Baru:</strong> Lahan ini sudah memiliki musim
                    tanam aktif ({existingActiveSeasonOnWizFarm.variety}). Saya mengonfirmasi ingin
                    membuat jadwal musim tanam baru.
                  </span>
                </label>
              )}
            </div>
          )}

          {/* Wizard Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E6EFE6]">
            <button
              type="button"
              onClick={() =>
                wizardStep > 1 ? setWizardStep(wizardStep - 1) : setSubView('detail')
              }
              className="px-4 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold text-[#2F4F32]"
            >
              {wizardStep > 1 ? '← Langkah Sebelumnya' : 'Kembali ke Detail'}
            </button>

            {wizardStep < 8 ? (
              <button
                type="button"
                onClick={() => setWizardStep(wizardStep + 1)}
                className="px-4 py-2 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white text-xs font-bold"
              >
                Lanjut ke Langkah {wizardStep + 1} →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveNewSeasonFromWizard}
                className="px-4 py-2 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white text-xs font-bold shadow-sm"
              >
                ✓ Simpan & Buat Kalender 14 Tahap
              </button>
            )}
          </div>
        </section>
      )}

      {/* =====================================================================
          SUBVIEW 2: DETAIL MUSIM TANAM & MESIN SIKLUS 14 TAHAP BUDIDAYA PADI
         ===================================================================== */}
      {subView === 'detail' && activeSeason && (
        <div className="space-y-4">
          {rescheduleBanner && (
            <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#81C784] text-xs font-bold text-[#1B5E20] flex items-center justify-between">
              <span>{rescheduleBanner}</span>
              <button
                type="button"
                onClick={() => setRescheduleBanner('')}
                className="text-xs underline ml-2"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Season Summary Cards */}
          <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#2E7D32]">
                  {activeSeason.farmName} • Status Musim: {activeSeason.status}
                </span>
                <h3 className="text-base font-extrabold text-[#142615]">
                  Padi Varietas {activeSeason.variety} ({activeSeason.plantedAreaHa} Ha) —{' '}
                  {activeSeason.cultivationSystem}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewPlantingDateInput(activeSeason.plantingDate);
                    setShowRescheduleModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F2F7F0] hover:bg-[#E2EFE0] text-[#1E5622] border border-[#DCE8DC] text-xs font-bold whitespace-nowrap"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Ubah Tanggal Tanam & Hitung Ulang
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs tabular-nums">
              <div className="bg-[#F7FAF6] rounded-xl p-2.5 border border-[#E2ECE2]">
                <span className="text-[10px] text-[#5B735E] block">Tanggal Tanam (0 HST)</span>
                <strong className="text-[#142615]">
                  {formatDateIndonesian(activeSeason.plantingDate)}
                </strong>
              </div>
              <div className="bg-[#F7FAF6] rounded-xl p-2.5 border border-[#E2ECE2]">
                <span className="text-[10px] text-[#5B735E] block">Tahap Aktif Saat Ini</span>
                <strong className="text-[#1E5622]">
                  Tahap {activeSeason.currentStageOrder}/14: {activeSeason.currentStageName}
                </strong>
              </div>
              <div className="bg-[#F7FAF6] rounded-xl p-2.5 border border-[#E2ECE2]">
                <span className="text-[10px] text-[#5B735E] block">Estimasi Panen</span>
                <strong className="text-[#142615]">
                  {formatDateIndonesian(activeSeason.estimatedHarvestDate)}
                </strong>
              </div>
              <div className="bg-[#F7FAF6] rounded-xl p-2.5 border border-[#E2ECE2]">
                <span className="text-[10px] text-[#5B735E] block">Total Biaya Aktual</span>
                <strong className="text-[#B45309]">
                  {formatRupiah(financialSummary.totalSeasonCostRp)}
                </strong>
              </div>
              <div className="bg-[#F7FAF6] rounded-xl p-2.5 border border-[#E2ECE2]">
                <span className="text-[10px] text-[#5B735E] block">Estimasi Keuntungan Bersih</span>
                <strong className="text-[#1E5622]">
                  {formatRupiah(financialSummary.netProfitRp)}
                </strong>
              </div>
            </div>
          </div>

          {/* 14-Stage Rice Cultivation Lifecycle Engine */}
          <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-[#142615]">
                  Mesin Siklus Budidaya Padi 14 Tahap (Olah Lahan s/d Pascapanen)
                </h3>
                <p className="text-[11px] text-[#4A634D]">
                  Perpindahan tahap wajib melalui konfirmasi petani agar sesuai kondisi aktual sawah
                </p>
              </div>
              {activeSeason.currentStageOrder < 14 && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmStageOrder(
                      (activeSeason.currentStageOrder + 1) as RiceStageOrder
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white text-xs font-bold whitespace-nowrap"
                >
                  Majukan ke Tahap {activeSeason.currentStageOrder + 1} →
                </button>
              )}
            </div>

            {confirmStageOrder !== null && (
              <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-[#92400E]">
                  <strong>Konfirmasi Perbarui Fase Pertumbuhan:</strong> Apakah tanaman padi di{' '}
                  {activeSeason.farmName} benar-benar sudah memasuki{' '}
                  <strong>
                    Tahap {confirmStageOrder}:{' '}
                    {activeSeason.stages.find((s) => s.order === confirmStageOrder)?.name}
                  </strong>
                  ?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmStageOrder(null)}
                    className="px-3 py-1 rounded-lg border border-[#D97706] text-xs font-bold text-[#92400E]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmStageChange(confirmStageOrder)}
                    className="px-3 py-1 rounded-lg bg-[#1E5622] text-white text-xs font-bold"
                  >
                    Ya, Konfirmasi Fase
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeSeason.stages.map((stage: any) => {
                const stageNum = stage.order ?? stage.stageNumber ?? 1;
                const hstStart = stage.hstStart ?? stage.estimatedDayStart ?? 0;
                const hstEnd = stage.hstEnd ?? stage.estimatedDayEnd ?? 0;
                const startDate = stage.estimatedStartDate || stage.estimatedDateStart || activeSeason.plantingDate;
                const objective = stage.objective || stage.description || '';
                const indicators: string[] = stage.successIndicators || stage.recommendedActions || [];
                const risks: string[] = stage.commonRisks || (stage.notes ? [stage.notes] : []);
                const isCurrent =
                  stage.status === 'Aktif' || stage.status === 'Sedang Berjalan';
                const isDone = stage.status === 'Selesai';
                return (
                  <div
                    key={stageNum}
                    className={`rounded-xl border p-3.5 transition-all ${
                      isCurrent
                        ? 'border-[#1E5622] bg-[#F2F7F0] ring-1 ring-[#1E5622]'
                        : isDone
                        ? 'border-[#C8E6C9] bg-[#F9FBF9]'
                        : 'border-[#E2ECE2] bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E7D32] tabular-nums">
                          Tahap {stageNum}/14 • {hstStart} s/d {hstEnd} HST (
                          {formatDateIndonesian(startDate)})
                        </span>
                        <h4 className="text-xs font-extrabold text-[#142615]">
                          {stage.name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmStageOrder(stageNum as RiceStageOrder)}
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md whitespace-nowrap ${
                          isCurrent
                            ? 'bg-[#1E5622] text-white'
                            : isDone
                            ? 'bg-[#E8F5E9] text-[#1E5622]'
                            : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2EFE0]'
                        }`}
                      >
                        {stage.status}
                      </button>
                    </div>

                    <p className="text-[11px] text-[#2F4F32] mb-1.5">
                      <strong>Tujuan:</strong> {objective}
                    </p>
                    <p className="text-[11px] text-[#4A634D] mb-1.5">
                      <strong>Indikator:</strong> {indicators.join(' • ')}
                    </p>
                    <p className="text-[10px] text-[#B45309] font-semibold">
                      <strong>Catatan & Risiko:</strong> {risks.join('; ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBVIEW 3: KALENDER KEGIATAN OTOMATIS
         ===================================================================== */}
      {subView === 'tasks' && activeSeason && (
        <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-[#142615]">
                Kalender Kegiatan Budidaya Padi ({seasonTasks.length} Agenda)
              </h3>
              <p className="text-[11px] text-[#4A634D]">
                Semua jadwal dihitung otomatis dari tanggal tanam {activeSeason.plantingDate} dan
                tidak menjadwalkan penyemprotan kimia tanpa indikasi
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {seasonTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-[#E2ECE2] p-3 flex flex-wrap items-center justify-between gap-3 bg-[#FBFDFB]"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-[#2E7D32] tabular-nums">
                    <span>Tahap {task.stageOrder}</span>
                    <span>•</span>
                    <span>{formatDateIndonesian(task.scheduledDate)} ({task.scheduledDate})</span>
                    <span>•</span>
                    <span>Prioritas {task.priority}</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-[#142615]">{task.title}</h4>
                  <p className="text-[11px] text-[#4A634D]">{task.notes}</p>
                  <p className="text-[10px] text-[#5B735E]">
                    Sumber: {task.recommendationSource}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['Terjadwal', 'Selesai', 'Ditunda', 'Dilewati'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleToggleTaskStatus(task, st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                        task.status === st
                          ? st === 'Selesai'
                            ? 'bg-[#1E5622] text-white'
                            : 'bg-[#142615] text-white'
                          : 'bg-[#F2F7F0] text-[#2F4F32] hover:bg-[#E2EFE0]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBVIEW 4: CATATAN AKTIVITAS, BIAYA & PANEN BERTAHAP
         ===================================================================== */}
      {subView === 'logs' && activeSeason && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Form Catat Aktivitas & Biaya */}
          <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-[#142615]">
              Catat Aktivitas Lapangan & Biaya Aktual
            </h3>
            <form onSubmit={handleAddActivityAndSyncExpense} className="space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Jenis Aktivitas</label>
                  <select
                    value={actType}
                    onChange={(e) =>
                      setActType(e.target.value as SeasonActivityLog['activityType'])
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] bg-white font-semibold"
                  >
                    {[
                      'Olah Lahan',
                      'Semai',
                      'Tanam',
                      'Pengairan',
                      'Pemupukan',
                      'Penyiangan',
                      'Pengamatan',
                      'Pengendalian OPT',
                      'Panen',
                      'Pascapanen',
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#142615] mb-1">
                    Tanggal Pelaksanaan
                  </label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#142615] mb-1">Input yang Digunakan</label>
                <input
                  type="text"
                  required
                  value={actInputUsed}
                  onChange={(e) => setActInputUsed(e.target.value)}
                  placeholder="Contoh: Pupuk Urea Susulan 120 kg"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Kuantitas</label>
                  <input
                    type="number"
                    value={actQty}
                    onChange={(e) => setActQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Satuan</label>
                  <input
                    type="text"
                    value={actUnit}
                    onChange={(e) => setActUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    value={actUnitPrice}
                    onChange={(e) => setActUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white font-bold"
              >
                + Simpan Aktivitas & Sinkronkan Biaya ({formatRupiah(actQty * actUnitPrice)})
              </button>
            </form>

            <div className="pt-3 border-t border-[#E6EFE6] space-y-2">
              <h4 className="text-xs font-extrabold text-[#142615]">
                Riwayat Aktivitas Musim Ini ({seasonActivities.length})
              </h4>
              {seasonActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded-xl bg-[#F7FAF6] border border-[#E2ECE2] flex items-center justify-between text-xs tabular-nums"
                >
                  <div>
                    <strong className="text-[#142615]">
                      {act.activityType} — {act.inputUsed}
                    </strong>
                    <p className="text-[11px] text-[#4A634D]">
                      {act.executionDate} • {act.quantity} {act.unit}
                    </p>
                  </div>
                  <span className="font-extrabold text-[#1E5622]">
                    {formatRupiah(act.actualCostRp)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Pencatatan Panen & Ringkasan Hasil Musim */}
          <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-[#142615]">
              Pencatatan Panen Padi & Evaluasi Hasil Akhir
            </h3>
            <form
              onSubmit={(e) => handleAddHarvestRecord(e, false)}
              className="space-y-2.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Tanggal Panen</label>
                  <input
                    type="date"
                    value={harvDate}
                    onChange={(e) => setHarvDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Luas Dipanen (Ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={harvAreaHa}
                    onChange={(e) => setHarvAreaHa(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Hasil Aktual (Kg)</label>
                  <input
                    type="number"
                    value={harvYieldKg}
                    onChange={(e) => setHarvYieldKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Harga Jual/Kg (Rp)</label>
                  <input
                    type="number"
                    value={harvPriceKg}
                    onChange={(e) => setHarvPriceKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Biaya Panen (Rp)</label>
                  <input
                    type="number"
                    value={harvCostRp}
                    onChange={(e) => setHarvCostRp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1E5622] hover:bg-[#164219] text-white font-bold"
                >
                  + Catat Panen Bertahap
                </button>
                <button
                  type="button"
                  onClick={(e) => handleAddHarvestRecord(e as any, true)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#142615] hover:bg-black text-white font-bold"
                >
                  ✓ Catat & Selesaikan Musim
                </button>
              </div>
            </form>

            {/* Ringkasan Finansial & Hasil Panen Musim */}
            <div className="p-3.5 rounded-xl bg-[#F7FAF6] border border-[#DCE8DC] space-y-2 text-xs tabular-nums">
              <h4 className="font-extrabold text-[#142615]">
                Ringkasan Evaluasi Musim Tanam ({activeSeason.variety})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#5B735E] block">Total Hasil Panen</span>
                  <strong className="text-[#142615]">
                    {financialSummary.totalHarvestKg.toLocaleString('id-ID')} kg (
                    {financialSummary.yieldTonPerHa} Ton/Ha)
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#5B735E] block">Target Hasil</span>
                  <strong className="text-[#142615]">
                    {activeSeason.targetYieldKg.toLocaleString('id-ID')} kg
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#5B735E] block">Pendapatan Kotor</span>
                  <strong className="text-[#1E5622]">
                    {formatRupiah(financialSummary.grossRevenueRp)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#5B735E] block">
                    Total Biaya (Rp {financialSummary.costPerHaRp.toLocaleString('id-ID')}/Ha)
                  </span>
                  <strong className="text-[#B45309]">
                    {formatRupiah(financialSummary.totalSeasonCostRp)}
                  </strong>
                </div>
              </div>
              <div className="pt-2 border-t border-[#DCE8DC] flex items-center justify-between">
                <span className="font-bold text-[#142615]">Estimasi Keuntungan Bersih:</span>
                <span className="text-sm font-extrabold text-[#1E5622]">
                  {formatRupiah(financialSummary.netProfitRp)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUBVIEW 5: LAHAN SAYA (CRUD LAHAN + RIWAYAT MUSIM PER LAHAN)
         ===================================================================== */}
      {subView === 'farms' && (
        <div className="bg-white rounded-2xl border border-[#DCE8DC] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#142615]">
              Daftar Lahan Saya & Riwayat Musim Tanam
            </h3>
            <button
              type="button"
              onClick={() => setShowAddFarmModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#1E5622] text-white text-xs font-bold"
            >
              + Tambah Lahan Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {farms.map((f) => {
              const farmSeasons = growingSeasons.filter((s) => s.farmId === f.id);
              return (
                <div
                  key={f.id}
                  className="rounded-xl border border-[#DCE8DC] p-3.5 bg-[#FBFDFB] space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#2E7D32]">
                        {f.soilType} • {f.waterSource} {f.isArchived ? '• (DIARSIPKAN)' : ''}
                      </span>
                      <h4 className="text-sm font-extrabold text-[#142615]">{f.name}</h4>
                      <p className="text-xs text-[#4A634D]">
                        {f.location} • Luas: <strong>{f.areaHaNormalized} Ha</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteFarmId(f.id)}
                      className="p-1.5 rounded-lg text-[#B91C1C] hover:bg-[#FEE2E2]"
                      title="Arsipkan / Hapus Lahan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {confirmDeleteFarmId === f.id && (
                    <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs space-y-2">
                      <p className="text-[#991B1B] font-semibold">
                        Konfirmasi penghapusan aman: Lahan yang memiliki riwayat musim tanam akan
                        diarsipkan agar data keuangan tidak hilang. Lanjutkan?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSafeDeleteFarm(f.id)}
                          className="px-2.5 py-1 rounded-md bg-[#B91C1C] text-white font-bold"
                        >
                          Ya, Proses
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteFarmId(null)}
                          className="px-2.5 py-1 rounded-md bg-white border border-[#DCE8DC] font-bold"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E6EFE6]">
                    <span className="text-[11px] font-bold text-[#142615] block mb-1">
                      Riwayat Musim Tanam ({farmSeasons.length}):
                    </span>
                    {farmSeasons.map((s) => (
                      <div
                        key={s.id}
                        className="text-[11px] text-[#2F4F32] flex items-center justify-between py-0.5 tabular-nums"
                      >
                        <span>
                          • Padi {s.variety} (Tanam {s.plantingDate})
                        </span>
                        <span className="font-bold text-[#1E5622]">{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL UBAH TANGGAL TANAM & HITUNG ULANG KALENDER */}
      {showRescheduleModal && activeSeason && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-[#DCE8DC] max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6EFE6] pb-2.5">
              <h3 className="text-sm font-extrabold text-[#142615]">
                Ubah Tanggal Tanam & Hitung Ulang Kalender
              </h3>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="p-1 text-[#4A634D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#4A634D]">
              Jika tanggal tanam diubah, seluruh kegiatan yang berstatus{' '}
              <strong>Terjadwal</strong> akan digeser otomatis, sedangkan kegiatan yang sudah{' '}
              <strong>Selesai</strong> tidak akan diubah.
            </p>
            <form onSubmit={handleApplyReschedule} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#142615] mb-1">
                  Tanggal Tanam Baru (Sebelumnya: {activeSeason.plantingDate})
                </label>
                <input
                  type="date"
                  required
                  value={newPlantingDateInput}
                  onChange={(e) => setNewPlantingDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#DCE8DC] text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#1E5622] text-white text-xs font-bold"
                >
                  Terapkan & Hitung Ulang Kalender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH LAHAN */}
      {showAddFarmModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-[#DCE8DC] max-w-md w-full p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#E6EFE6] pb-2">
              <h3 className="text-sm font-extrabold text-[#142615]">Tambah Lahan Sawah Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddFarmModal(false)}
                className="p-1 text-[#4A634D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFarm} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#142615] mb-1">Nama Lahan *</label>
                <input
                  type="text"
                  required
                  value={farmNameInput}
                  onChange={(e) => setFarmNameInput(e.target.value)}
                  placeholder="Contoh: Lahan 5 — Blok Selatan"
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#142615] mb-1">Lokasi Desa/Kecamatan *</label>
                <input
                  type="text"
                  required
                  value={farmLocInput}
                  onChange={(e) => setFarmLocInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Luas Lahan *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={farmAreaValInput}
                    onChange={(e) => setFarmAreaValInput(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#142615] mb-1">Satuan</label>
                  <select
                    value={farmAreaUnitInput}
                    onChange={(e) => setFarmAreaUnitInput(e.target.value as 'ha' | 'm2')}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE8DC] bg-white font-semibold"
                  >
                    <option value="ha">Hektare (Ha)</option>
                    <option value="m2">Meter Persegi (m²)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFarmModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-[#DCE8DC] font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#1E5622] text-white font-bold"
                >
                  Simpan Lahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
