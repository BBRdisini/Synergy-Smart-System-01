import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Droplets,
  Layers,
  MapPin,
  Plus,
  Sprout,
  Trash2,
  X,
} from 'lucide-react';
import {
  CommodityType,
  FarmPlot,
  PhaseStatus,
} from '../types/agronomy';
import { CropThumbnailIllustration } from './VisualAssets';
import {
  calculateDaysAfterPlanting,
  determineRiceGrowthPhase,
  generateCultivationPlanAndTasks,
  validatePlotForm,
} from '../utils/agronomyCalculations';

interface PlotManagerViewProps {
  plots: FarmPlot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  onAddPlot: (newPlot: FarmPlot, generatedTasks: any[]) => void;
  onDeletePlot: (plotId: string) => void;
  onTogglePhaseChecklist: (plotId: string, phaseId: string, checklistId: string) => void;
  onUpdatePhaseStatus: (plotId: string, phaseId: string, newStatus: PhaseStatus) => void;
  onNavigateToCamera: (commodity: CommodityType, plotId: string) => void;
  onNavigateToCalendar: (plotId: string) => void;
}

export const PlotManagerView: React.FC<PlotManagerViewProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  onAddPlot,
  onDeletePlot,
  onTogglePhaseChecklist,
  onUpdatePhaseStatus,
  onNavigateToCamera,
  onNavigateToCalendar,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [locationVillage, setLocationVillage] = useState('Desa Larikrejo, Undaan, Kudus');
  const [areaHa, setAreaHa] = useState('1.0');
  const [commodity, setCommodity] = useState<CommodityType>('Padi');
  const [variety, setVariety] = useState('Inpari 32 HDB');
  const [plantingSystem, setPlantingSystem] = useState<FarmPlot['plantingSystem']>('Jajar Legowo 2:1');
  const [soilType, setSoilType] = useState<FarmPlot['soilType']>('Aluvial');
  const [irrigationSource, setIrrigationSource] = useState<FarmPlot['irrigationSource']>('Irigasi Teknis');
  const [plantingDate, setPlantingDate] = useState('2025-04-15');
  const [targetYield, setTargetYield] = useState('6.8');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  const handleCreatePlot = (e: React.FormEvent) => {
    e.preventDefault();
    const numericArea = parseFloat(areaHa);
    const validation = validatePlotForm({
      name,
      locationVillage,
      areaHa: numericArea,
      variety,
      plantingDate,
    });

    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors([]);
    const newPlotId = `lahan-${Date.now()}`;
    const computedHst = Math.max(1, calculateDaysAfterPlanting(plantingDate, '2025-05-02'));
    const phaseInfo = determineRiceGrowthPhase(computedHst);

    const plan = generateCultivationPlanAndTasks({
      plotId: newPlotId,
      plotName: name.trim(),
      commodity,
      varietyName: variety.trim(),
      plantingDate,
      areaHa: numericArea,
      currentHst: computedHst,
    });

    const newPlot: FarmPlot = {
      id: newPlotId,
      name: name.trim(),
      locationVillage: locationVillage.trim(),
      locationDistrict: 'Undaan',
      locationRegency: 'Kudus, Jawa Tengah',
      areaHa: numericArea,
      ownershipStatus: 'Milik Sendiri',
      soilType,
      irrigationSource,
      commodity,
      variety: variety.trim(),
      plantingSystem,
      plantingDate,
      targetYieldTonPerHa: parseFloat(targetYield) || 6.5,
      seasonStatus: 'Aktif',
      currentHst: computedHst,
      currentPhaseName: phaseInfo.shortLabel,
      estimatedHarvestDate: plan.estimatedHarvestDate,
      harvestUncertaintyDays: 5,
      notes: notes.trim() || `Rencana budidaya ${commodity} varietas ${variety.trim()}.`,
      isDemoData: false,
      phases: plan.phases,
      soilObservation: {
        id: `soil-${Date.now()}`,
        plotId: newPlotId,
        recordedAt: 'Baru ditambahkan',
        ph: 6.5,
        moisturePct: 64,
        soilTempC: 24,
        waterCondition: 'Lembap / Macak-macak',
        sourceType: 'Input Manual Petani',
        notes: 'Pengamatan awal saat pembuatan lahan.',
      },
    };

    onAddPlot(newPlot, plan.tasks);
    setName('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Section matching Screen 4: Lahan & Tanaman */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-[#17231B]">Lahan & Tanaman</h1>
          <p className="text-xs text-[#647067] mt-0.5">
            Kelola petakan sawah, komoditas, varietas, dan Mesin Perencanaan Budidaya Padi 8 Fase
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormErrors([]);
            setShowAddModal(true);
          }}
          className="flex h-11 items-center gap-2 rounded-xl bg-[#15803D] hover:bg-[#14532D] px-4 text-sm font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Lahan</span>
        </button>
      </div>

      {/* Main Split Grid: Left Plot List (Screen 4) + Right 8-Phase Cultivation Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Plot Cards (Screen 4) */}
        <div className="lg:col-span-5 space-y-3">
          {plots.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center border border-slate-200">
              <Sprout className="h-10 w-10 text-[#15803D] mx-auto mb-2" />
              <h2 className="text-base font-bold text-[#17231B]">Belum Ada Lahan Terdaftar</h2>
              <p className="text-xs text-[#647067] mt-1">
                Tambahkan lahan pertama Anda untuk membuat jadwal budidaya dan pemantauan otomatis.
              </p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2.5 rounded-xl bg-[#15803D] text-white text-xs font-semibold"
              >
                + Tambahkan Lahan Pertama
              </button>
            </div>
          ) : (
            plots.map((plot) => {
              const isSelected = selectedPlot?.id === plot.id;
              return (
                <div
                  key={plot.id}
                  onClick={() => onSelectPlot(plot.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPlot(plot.id);
                    }
                  }}
                  aria-label={`Pilih ${plot.name} ${plot.commodity} Varietas ${plot.variety}`}
                  className={`w-full text-left rounded-2xl p-4 transition-all border cursor-pointer flex items-center gap-4 ${
                    isSelected
                      ? 'bg-white border-[#15803D] ring-2 ring-[#15803D]/15 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-600/40'
                  }`}
                >
                  <CropThumbnailIllustration
                    commodity={plot.commodity}
                    className="w-16 h-16 rounded-xl shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-base font-bold text-[#17231B] truncate">{plot.name}</h2>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? 'text-[#15803D]' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <p className="text-xs font-medium text-[#15803D] mt-0.5 truncate">
                      {plot.commodity} · Varietas {plot.variety}
                    </p>
                    <p className="text-xs text-[#647067] mt-1 tabular-nums">
                      Luas: <strong className="text-[#17231B]">{plot.areaHa} Ha</strong> · Fase:{' '}
                      <strong className="text-[#17231B]">{plot.currentPhaseName}</strong>
                    </p>
                    <p className="text-[11px] text-[#647067] mt-0.5 truncate">
                      {plot.locationVillage} · {plot.irrigationSource}{' '}
                      {plot.isDemoData ? '· DATA DEMO' : '· Data Petani'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Plot Profile & 8-Phase Rice Cultivation Engine */}
        {selectedPlot && (
          <div className="lg:col-span-7 space-y-5">
            {/* Plot Detail Banner */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#647067]">
                    <span>{selectedPlot.commodity}</span>
                    <span aria-hidden="true">·</span>
                    <span>Varietas {selectedPlot.variety}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedPlot.ownershipStatus}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#17231B] mt-1">
                    {selectedPlot.name} — {selectedPlot.locationVillage}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToCamera(selectedPlot.commodity, selectedPlot.id)}
                    className="px-3.5 py-2 rounded-xl bg-[#DCFCE7] hover:bg-emerald-200 text-[#14532D] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Periksa via Kamera AI
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToCalendar(selectedPlot.id)}
                    className="px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Buka Kalender Tanam
                  </button>
                  {plots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeletePlot(selectedPlot.id)}
                      aria-label={`Hapus ${selectedPlot.name}`}
                      className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-[#DC2626] hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Plot Agronomic Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div className="p-3 rounded-xl bg-[#F7FAF7]">
                  <span className="text-[11px] text-[#647067] block">Luas & Sistem Tanam</span>
                  <span className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                    {selectedPlot.areaHa} Ha
                  </span>
                  <span className="text-[11px] text-[#647067]">{selectedPlot.plantingSystem}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7FAF7]">
                  <span className="text-[11px] text-[#647067] block">Tanggal Tanam & Umur</span>
                  <span className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                    {selectedPlot.currentHst} HST
                  </span>
                  <span className="text-[11px] text-[#647067]">Tanam: {selectedPlot.plantingDate}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7FAF7]">
                  <span className="text-[11px] text-[#647067] block">Jenis Tanah & Air</span>
                  <span className="text-sm font-bold text-[#17231B] mt-0.5 block">
                    {selectedPlot.soilType}
                  </span>
                  <span className="text-[11px] text-[#647067]">{selectedPlot.irrigationSource}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F7FAF7]">
                  <span className="text-[11px] text-[#647067] block">Target & Estimasi Panen</span>
                  <span className="text-sm font-bold text-[#15803D] tabular-nums mt-0.5 block">
                    {(selectedPlot.areaHa * selectedPlot.targetYieldTonPerHa).toFixed(1)} Ton GKP
                  </span>
                  <span className="text-[11px] text-[#647067]">
                    {selectedPlot.estimatedHarvestDate} (±{selectedPlot.harvestUncertaintyDays} hr)
                  </span>
                </div>
              </div>

              {selectedPlot.notes && (
                <p className="mt-3 text-xs text-[#647067] bg-[#F7FAF7] px-3.5 py-2.5 rounded-xl">
                  <strong className="text-[#17231B]">Catatan Lahan:</strong> {selectedPlot.notes}
                </p>
              )}
            </div>

            {/* Section 6: Mesin Perencanaan Budidaya 8 Fase */}
            <div className="rounded-2xl bg-white p-5 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#17231B]">
                    Mesin Perencanaan Budidaya 8 Fase ({selectedPlot.name})
                  </h3>
                  <p className="text-xs text-[#647067]">
                    Centang daftar periksa di setiap fase atau sesuaikan status tahapan secara manual
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#15803D] tabular-nums">
                  {selectedPlot.phases.filter((p) => p.status === 'Selesai').length}/8 Fase Selesai
                </span>
              </div>

              <div className="space-y-3">
                {selectedPlot.phases.map((phase) => {
                  const isRunning = phase.status === 'Sedang Berjalan';
                  const isDone = phase.status === 'Selesai';
                  return (
                    <div
                      key={phase.id}
                      className={`rounded-xl p-4 border transition-colors ${
                        isRunning
                          ? 'bg-[#DCFCE7]/30 border-[#15803D]'
                          : isDone
                          ? 'bg-[#F7FAF7] border-slate-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#17231B]">{phase.name}</span>
                            <span className="text-xs text-[#647067] tabular-nums">
                              · {phase.hstRange}
                            </span>
                          </div>
                          <p className="text-xs text-[#647067] mt-1">{phase.description}</p>
                        </div>

                        <select
                          aria-label={`Status ${phase.name}`}
                          value={phase.status}
                          onChange={(e) =>
                            onUpdatePhaseStatus(
                              selectedPlot.id,
                              phase.id,
                              e.target.value as PhaseStatus
                            )
                          }
                          className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-[#17231B] focus:outline-none focus:border-[#15803D]"
                        >
                          <option value="Belum Dimulai">Belum Dimulai</option>
                          <option value="Terjadwal">Terjadwal</option>
                          <option value="Sedang Berjalan">Sedang Berjalan</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Terlewat">Terlewat</option>
                        </select>
                      </div>

                      <p className="mt-2 text-xs text-[#14532D] bg-[#DCFCE7]/50 px-3 py-1.5 rounded-lg">
                        {phase.agronomicNotes}
                      </p>

                      {/* Interactive Phase Checklist */}
                      <div className="mt-3 space-y-1.5">
                        {phase.checklist.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              onTogglePhaseChecklist(selectedPlot.id, phase.id, item.id)
                            }
                            className="w-full flex items-center gap-2.5 text-left py-1.5 px-2 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <span
                              className={`text-xs ${
                                item.completed
                                  ? 'line-through text-[#647067]'
                                  : 'text-[#17231B] font-medium'
                              }`}
                            >
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Lahan Baru */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah Lahan Pertanian Baru"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg font-bold text-[#17231B]">Tambah Lahan & Musim Tanam Baru</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup modal tambah lahan"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-[#DC2626] space-y-1">
                {formErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}

            <form onSubmit={handleCreatePlot} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="plot-name" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Nama Lahan *
                  </label>
                  <input
                    id="plot-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Lahan 5 (Blok Timur)"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#15803D]"
                  />
                </div>
                <div>
                  <label htmlFor="plot-area" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Luas Lahan (Hektare / Ha) *
                  </label>
                  <input
                    id="plot-area"
                    type="number"
                    step="0.1"
                    value={areaHa}
                    onChange={(e) => setAreaHa(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="plot-location" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Lokasi Desa / Kecamatan *
                </label>
                <input
                  id="plot-location"
                  type="text"
                  value={locationVillage}
                  onChange={(e) => setLocationVillage(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="plot-commodity" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Komoditas Tanaman
                  </label>
                  <select
                    id="plot-commodity"
                    value={commodity}
                    onChange={(e) => setCommodity(e.target.value as CommodityType)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="Padi">Padi (Unggulan)</option>
                    <option value="Jagung">Jagung</option>
                    <option value="Cabai">Cabai</option>
                    <option value="Kedelai">Kedelai</option>
                    <option value="Bawang Merah">Bawang Merah</option>
                    <option value="Tomat">Tomat</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="plot-variety" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Varietas Tanaman *
                  </label>
                  <input
                    id="plot-variety"
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="Contoh: Ciherang / Inpari 32"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="plot-planting-date" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Tanggal Tanam / Pindah Tanam *
                  </label>
                  <input
                    id="plot-planting-date"
                    type="date"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#15803D]"
                  />
                </div>
                <div>
                  <label htmlFor="plot-system" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Sistem Budidaya
                  </label>
                  <select
                    id="plot-system"
                    value={plantingSystem}
                    onChange={(e) => setPlantingSystem(e.target.value as FarmPlot['plantingSystem'])}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-[#15803D]"
                  >
                    <option value="Jajar Legowo 2:1">Jajar Legowo 2:1</option>
                    <option value="Jajar Legowo 4:1">Jajar Legowo 4:1</option>
                    <option value="Tegel (25x25 cm)">Tegel (25x25 cm)</option>
                    <option value="SRI (System of Rice Intensification)">SRI (System of Rice Intensification)</option>
                    <option value="Tanam Benih Langsung (Tabela)">Tanam Benih Langsung (Tabela)</option>
                    <option value="Bedengan / Mulsa">Bedengan / Mulsa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="plot-soil" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Jenis Tanah
                  </label>
                  <select
                    id="plot-soil"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value as FarmPlot['soilType'])}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="Aluvial">Aluvial</option>
                    <option value="Latosol">Latosol</option>
                    <option value="Regosol">Regosol</option>
                    <option value="Andosol">Andosol</option>
                    <option value="Belum Diketahui">Belum Diketahui</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="plot-irrigation" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Sumber Irigasi
                  </label>
                  <select
                    id="plot-irrigation"
                    value={irrigationSource}
                    onChange={(e) => setIrrigationSource(e.target.value as FarmPlot['irrigationSource'])}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="Irigasi Teknis">Irigasi Teknis</option>
                    <option value="Irigasi Setengah Teknis">Setengah Teknis</option>
                    <option value="Tadah Hujan">Tadah Hujan</option>
                    <option value="Pompa Sumur Bor">Pompa Sumur Bor</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="plot-target" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Target Panen (Ton/Ha)
                  </label>
                  <input
                    id="plot-target"
                    type="number"
                    step="0.1"
                    value={targetYield}
                    onChange={(e) => setTargetYield(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="plot-notes" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Catatan Kondisi Awal Lahan
                </label>
                <textarea
                  id="plot-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Riwayat tanaman sebelumnya, kondisi drainase, dsb."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 h-11 rounded-xl border border-slate-200 text-xs font-semibold text-[#647067] hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 h-11 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-xs font-semibold text-white cursor-pointer"
                >
                  Simpan Lahan & Buat Kalender 8 Fase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
