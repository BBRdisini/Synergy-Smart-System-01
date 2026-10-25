import React, { useState } from 'react';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Plus,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';
import {
  CommodityType,
  FarmPlot,
  ScheduledTask,
  SoilObservation,
  WeatherSnapshot,
} from '../types/agronomy';
import { evaluateSoilParameters, formatIndonesianDate } from '../utils/agronomyCalculations';

interface CalendarAndWeatherViewProps {
  plots: FarmPlot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  tasks: ScheduledTask[];
  onToggleTaskCompleted: (taskId: string) => void;
  onAddTask: (task: ScheduledTask) => void;
  weather: WeatherSnapshot;
  isLoadingWeather: boolean;
  onRefreshWeather: () => void;
  onUpdateSoilObservation: (plotId: string, obs: SoilObservation) => void;
  remindersActive: boolean;
  onToggleReminders: () => void;
}

export const CalendarAndWeatherView: React.FC<CalendarAndWeatherViewProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  tasks,
  onToggleTaskCompleted,
  onAddTask,
  weather,
  isLoadingWeather,
  onRefreshWeather,
  onUpdateSoilObservation,
  remindersActive,
  onToggleReminders,
}) => {
  const [commodityFilter, setCommodityFilter] = useState<'Semua' | CommodityType>('Padi');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<ScheduledTask['category']>('Pemupukan');
  const [newTaskDate, setNewTaskDate] = useState('2025-05-05');
  const [newTaskTime, setNewTaskTime] = useState('06:30 – 08:30');
  const [newTaskNote, setNewTaskNote] = useState('');

  const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  const [phInput, setPhInput] = useState(String(activePlot?.soilObservation.ph ?? 6.5));
  const [moistureInput, setMoistureInput] = useState(String(activePlot?.soilObservation.moisturePct ?? 62));
  const [tempInput, setTempInput] = useState(String(activePlot?.soilObservation.soilTempC ?? 23));
  const [sourceInput, setSourceInput] = useState<SoilObservation['sourceType']>('Alat Ukur Tanah / pH Meter');
  const [soilSavedMsg, setSoilSavedMsg] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (commodityFilter !== 'Semua' && t.commodity !== commodityFilter) return false;
    return true;
  });

  const soilEval = evaluateSoilParameters(
    activePlot?.soilObservation.ph ?? 6.5,
    activePlot?.soilObservation.moisturePct ?? 62,
    activePlot?.soilObservation.soilTempC ?? 23
  );

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activePlot) return;

    const task: ScheduledTask = {
      id: `task-${Date.now()}`,
      plotId: activePlot.id,
      plotName: activePlot.name,
      commodity: activePlot.commodity,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      dateLabel: `${formatIndonesianDate(newTaskDate)}, ${newTaskTime}`,
      isoDate: newTaskDate,
      timeSlot: newTaskTime,
      completed: false,
      dosageOrNote: newTaskNote.trim() || 'Jadwal kegiatan manual petani',
      phaseNumber: 4,
    };

    onAddTask(task);
    setNewTaskTitle('');
    setNewTaskNote('');
    setShowAddTaskModal(false);
  };

  const handleSaveSoilManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlot) return;
    const phVal = Math.min(9.5, Math.max(3.5, parseFloat(phInput) || 6.5));
    const moistVal = Math.min(100, Math.max(5, Math.round(parseFloat(moistureInput) || 62)));
    const tempVal = Math.min(45, Math.max(10, Math.round(parseFloat(tempInput) || 23)));

    const evalRes = evaluateSoilParameters(phVal, moistVal, tempVal);
    onUpdateSoilObservation(activePlot.id, {
      id: `soil-${Date.now()}`,
      plotId: activePlot.id,
      recordedAt: 'Baru saja diperbarui',
      ph: phVal,
      moisturePct: moistVal,
      soilTempC: tempVal,
      waterCondition: moistVal >= 60 ? 'Lembap / Macak-macak' : 'Kering',
      sourceType: sourceInput,
      notes: evalRes.recommendation,
    });
    setSoilSavedMsg(`Data kondisi tanah ${activePlot.name} berhasil diperbarui.`);
    setTimeout(() => setSoilSavedMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Main 2-Column Split: Screen 8 (Kalender Tanam & Pengingat) + Screen 9 (Data Cuaca & Kondisi Lahan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Screen 8 — Kalender Tanam & Jadwal Kegiatan */}
        <div className="lg:col-span-6 rounded-2xl bg-white p-5 border border-slate-200 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#17231B]">Kalender Tanam & Agenda</h1>
              <p className="text-xs text-[#647067]">
                Jadwal otomatis berdasarkan tanggal tanam, fase fisiologis tanaman, dan pengamatan lapangan
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddTaskModal(true)}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-[#15803D] hover:bg-[#14532D] px-3.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Jadwal</span>
            </button>
          </div>

          {/* Commodity Filter Tabs (Layar 8: Padi, Jagung, Cabai, Semua) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F7FAF7] p-1.5 rounded-xl border border-slate-200">
            {(['Padi', 'Jagung', 'Cabai', 'Semua'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCommodityFilter(item as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  commodityFilter === item
                    ? 'bg-[#15803D] text-white shadow-sm'
                    : 'text-[#647067] hover:text-[#17231B]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Active Plot Progress Banner (Screen 8: Padi - Lahan 1 · Varietas: Ciherang · Tanam: 12 Apr 2025) */}
          {activePlot && (
            <div className="rounded-2xl bg-[#F7FAF7] p-4 border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[#17231B]">
                    {activePlot.commodity} - {activePlot.name}
                  </h2>
                  <p className="text-xs text-[#647067] mt-0.5 tabular-nums">
                    Varietas: {activePlot.variety} · Tanam: {formatIndonesianDate(activePlot.plantingDate)}
                  </p>
                </div>

                <select
                  aria-label="Pilih Lahan untuk Kalender"
                  value={activePlot.id}
                  onChange={(e) => onSelectPlot(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#17231B]"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.commodity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Phase Progress Bar matching Screen 8 */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#15803D]">
                    Fase {activePlot.currentPhaseName}
                  </span>
                  <span className="text-[#17231B] tabular-nums">
                    Estimasi Panen: ± 90 HST ({formatIndonesianDate(activePlot.estimatedHarvestDate)})
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#15803D] transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(12, Math.round((activePlot.currentHst / 90) * 100)))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Jadwal Kegiatan List (Screen 8) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#17231B]">Jadwal Kegiatan</h3>
              <span className="text-xs text-[#647067] tabular-nums">
                {filteredTasks.filter((t) => !t.completed).length} belum selesai
              </span>
            </div>

            <div className="space-y-2.5">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onToggleTaskCompleted(task.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleTaskCompleted(task.id);
                    }
                  }}
                  aria-label={`Tandai kegiatan ${task.title} pada ${task.plotName}`}
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
                      <h4
                        className={`text-sm font-bold ${
                          task.completed ? 'line-through text-[#647067]' : 'text-[#17231B]'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <p className="text-xs text-[#647067] mt-0.5 tabular-nums">
                        {task.dateLabel} · {task.plotName} ({task.commodity})
                      </p>
                      {task.dosageOrNote && (
                        <p className="text-[11px] text-[#15803D] mt-0.5">{task.dosageOrNote}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-medium text-[#647067] shrink-0">
                    {task.completed ? 'Selesai' : 'Jadwal'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pengingat Aktif Button matching Screen 8 bottom */}
          <button
            type="button"
            onClick={onToggleReminders}
            className={`w-full h-12 rounded-xl px-4 flex items-center justify-between text-sm font-semibold transition-colors cursor-pointer ${
              remindersActive
                ? 'bg-[#14532D] text-white'
                : 'bg-slate-100 text-[#17231B] hover:bg-slate-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4" />
              <span>
                {remindersActive
                  ? 'Pengingat Aktif (Zona Waktu: Asia/Jakarta WIB)'
                  : 'Pengingat Nonaktif — Klik untuk Mengaktifkan'}
              </span>
            </div>
            <span className="text-xs opacity-90">{remindersActive ? 'AKTIF' : 'OFF'}</span>
          </button>
        </div>

        {/* Right Column: Screen 9 — Data Cuaca & Kondisi Lahan */}
        <div className="lg:col-span-6 rounded-2xl bg-white p-5 border border-slate-200 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#17231B]">Data Cuaca & Kondisi Lahan</h2>
              <p className="text-xs text-[#647067] flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-[#15803D]" />
                <span>{weather.locationName}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={onRefreshWeather}
              disabled={isLoadingWeather}
              aria-label="Segarkan data cuaca"
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F7FAF7] hover:bg-slate-100 px-3 text-xs font-semibold text-[#17231B] cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
              <span>Segarkan API</span>
            </button>
          </div>

          {/* Current Weather Hero Card (Screen 9: 28°C Cerah Berawan · Kelembapan 68% · Curah Hujan 2 mm · Angin 12 km/jam) */}
          <div className="rounded-2xl bg-gradient-to-br from-[#F0FDF4] via-white to-[#E0F2FE] p-5 border border-emerald-900/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-500">
                  <CloudSun className="h-10 w-10" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#17231B] tabular-nums">
                    {weather.tempC}°C
                  </div>
                  <div className="text-sm font-semibold text-[#17231B]">{weather.conditionText}</div>
                  <div className="text-[11px] text-[#647067] mt-0.5">
                    Diperbarui: {weather.updatedAt} · {weather.sourceName}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-[#15803D] block">
                  Rekomendasi Cuaca: {weather.sprayingAdvisory.status}
                </span>
                <span className="text-[11px] text-[#647067] tabular-nums">
                  Peluang hujan: {weather.rainProbabilityPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/70 text-center">
              <div>
                <span className="text-xs text-[#647067] flex items-center justify-center gap-1">
                  <Droplets className="h-3.5 w-3.5 text-sky-600" />
                  Kelembapan
                </span>
                <strong className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                  {weather.humidityPct}%
                </strong>
              </div>
              <div>
                <span className="text-xs text-[#647067] flex items-center justify-center gap-1">
                  <CloudRain className="h-3.5 w-3.5 text-sky-600" />
                  Curah Hujan
                </span>
                <strong className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                  {weather.rainfallMm} mm
                </strong>
              </div>
              <div>
                <span className="text-xs text-[#647067] flex items-center justify-center gap-1">
                  <Wind className="h-3.5 w-3.5 text-sky-600" />
                  Angin
                </span>
                <strong className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                  {weather.windSpeedKmh} km/jam
                </strong>
              </div>
            </div>
          </div>

          {/* Prakiraan 5 Hari ke Depan (Screen 9: Sen, Sel, Rab, Kam, Jum) */}
          <div>
            <h3 className="text-sm font-bold text-[#17231B] mb-2.5">Prakiraan 5 Hari ke Depan</h3>
            <div className="grid grid-cols-5 gap-2">
              {weather.forecast.map((day, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#F7FAF7] p-2.5 text-center border border-slate-200/80"
                >
                  <span className="text-xs font-bold text-[#17231B] block">{day.dayName}</span>
                  <div className="my-2 flex justify-center">
                    {day.condition.includes('Hujan') ? (
                      <CloudRain className="h-5 w-5 text-sky-600" />
                    ) : day.condition === 'Cerah' ? (
                      <Sun className="h-5 w-5 text-amber-500" />
                    ) : (
                      <CloudSun className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#17231B] tabular-nums block">
                    {day.tempMinC}° / {day.tempMaxC}°
                  </span>
                  <span className="text-[10px] text-[#647067] tabular-nums block mt-0.5">
                    {day.rainChancePct}% hujan
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kondisi Tanah (Lahan 1) matching Screen 9: pH 6.5 Normal · Kelembapan 62% Cukup · Suhu Tanah 23°C Normal */}
          {activePlot && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#17231B]">
                  Kondisi Tanah ({activePlot.name})
                </h3>
                <span className="text-[11px] text-[#647067]">
                  Sumber: {activePlot.soilObservation.sourceType}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-[#F7FAF7] border border-slate-200">
                  <span className="text-xs text-[#647067] block">pH Tanah</span>
                  <strong className="text-xl font-bold text-[#15803D] tabular-nums mt-0.5 block">
                    {activePlot.soilObservation.ph}
                  </strong>
                  <span className="text-xs font-semibold text-[#15803D]">{soilEval.phStatus}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F7FAF7] border border-slate-200">
                  <span className="text-xs text-[#647067] block">Kelembapan</span>
                  <strong className="text-xl font-bold text-[#15803D] tabular-nums mt-0.5 block">
                    {activePlot.soilObservation.moisturePct}%
                  </strong>
                  <span className="text-xs font-semibold text-[#15803D]">
                    {soilEval.moistureStatus}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F7FAF7] border border-slate-200">
                  <span className="text-xs text-[#647067] block">Suhu Tanah</span>
                  <strong className="text-xl font-bold text-[#17231B] tabular-nums mt-0.5 block">
                    {activePlot.soilObservation.soilTempC}°C
                  </strong>
                  <span className="text-xs font-semibold text-[#15803D]">{soilEval.tempStatus}</span>
                </div>
              </div>

              {/* Rekomendasi Box matching Screen 9 bottom */}
              <div className="rounded-xl bg-[#DCFCE7]/50 border border-[#15803D]/20 p-3.5">
                <h4 className="text-xs font-bold text-[#14532D]">Rekomendasi Kondisi Lahan</h4>
                <p className="text-xs text-[#17231B] mt-0.5">{soilEval.recommendation}</p>
              </div>

              {/* Manual Soil Input Form (Section 10: Pencatatan manual pH, kelembapan, suhu tanah) */}
              <form
                onSubmit={handleSaveSoilManual}
                className="rounded-xl bg-[#F7FAF7] p-3.5 border border-slate-200 space-y-2.5"
              >
                <div className="text-xs font-bold text-[#17231B]">
                  Catat Pengukuran Tanah Baru (Alat Ukur pH / Sensor / Pengamatan Manual)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label htmlFor="soil-ph" className="block text-[11px] text-[#647067] mb-0.5">
                      pH Tanah
                    </label>
                    <input
                      id="soil-ph"
                      type="number"
                      step="0.1"
                      value={phInput}
                      onChange={(e) => setPhInput(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="soil-moist" className="block text-[11px] text-[#647067] mb-0.5">
                      Kelembapan (%)
                    </label>
                    <input
                      id="soil-moist"
                      type="number"
                      value={moistureInput}
                      onChange={(e) => setMoistureInput(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                    />
                  </div>
                  <div>
                    <label htmlFor="soil-temp" className="block text-[11px] text-[#647067] mb-0.5">
                      Suhu (°C)
                    </label>
                    <input
                      id="soil-temp"
                      type="number"
                      value={tempInput}
                      onChange={(e) => setTempInput(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <select
                    aria-label="Sumber Pengukuran Tanah"
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value as SoilObservation['sourceType'])}
                    className="h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs text-[#17231B]"
                  >
                    <option value="Alat Ukur Tanah / pH Meter">Sumber: Alat Ukur Tanah / pH Meter</option>
                    <option value="Input Manual Petani">Sumber: Pengamatan Manual Petani</option>
                    <option value="Sensor IoT Lahan">Sumber: Sensor IoT Lahan</option>
                  </select>
                  <button
                    type="submit"
                    className="h-9 px-3.5 rounded-lg bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-semibold cursor-pointer"
                  >
                    Simpan Pengukuran Tanah
                  </button>
                </div>
                {soilSavedMsg && (
                  <p className="text-xs font-medium text-[#15803D]">{soilSavedMsg}</p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Tambah Jadwal Kegiatan Baru"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-[#17231B]">Tambah Jadwal Kegiatan</h3>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                aria-label="Tutup modal jadwal"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-3">
              <div>
                <label htmlFor="task-title" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Nama Kegiatan *
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Contoh: Pemupukan Susulan NPK II"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label htmlFor="task-cat" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Kategori
                </label>
                <select
                  id="task-cat"
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as ScheduledTask['category'])}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="Pemupukan">Pemupukan</option>
                  <option value="Pengairan">Pengairan</option>
                  <option value="Pemeriksaan Hama & Penyakit">Pemeriksaan Hama & Penyakit</option>
                  <option value="Penyemprotan Tervalidasi">Penyemprotan Tervalidasi</option>
                  <option value="Pemeriksaan Gulma">Pemeriksaan Gulma</option>
                  <option value="Panen & Pascapanen">Panen & Pascapanen</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="task-date" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Tanggal
                  </label>
                  <input
                    id="task-date"
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="task-time" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Waktu
                  </label>
                  <input
                    id="task-time"
                    type="text"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="task-note" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Catatan / Dosis
                </label>
                <input
                  id="task-note"
                  type="text"
                  value={newTaskNote}
                  onChange={(e) => setNewTaskNote(e.target.value)}
                  placeholder="Contoh: 150 kg/Ha pada kondisi air macak-macak"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-[#647067]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 h-10 rounded-xl bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
                >
                  Simpan ke Kalender
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
