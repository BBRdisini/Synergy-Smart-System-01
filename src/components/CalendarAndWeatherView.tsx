import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  ExternalLink,
  LogOut,
  MapPin,
  Navigation,
  Plus,
  RefreshCw,
  ShieldCheck,
  Search,
  Sun,
  Trash2,
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
import {
  BMKG_ADMIN_REGION_PRESETS,
  searchIndonesianLocationCoordinates,
} from '../services/liveWeatherService';
import {
  GoogleCalendarEventItem,
  initAuth,
  googleSignIn,
  logout as googleLogout,
  listGoogleCalendarEvents,
  createGoogleCalendarEvent,
  syncFarmTasksToGoogleCalendar,
  deleteGoogleCalendarEvent,
} from '../services/googleCalendarService';

interface CalendarAndWeatherViewProps {
  plots: FarmPlot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  tasks: ScheduledTask[];
  onToggleTaskCompleted: (taskId: string) => void;
  onAddTask: (task: ScheduledTask) => void;
  weather: WeatherSnapshot;
  isLoadingWeather: boolean;
  onRefreshWeather: (options?: {
    forceGps?: boolean;
    customCoords?: {
      latitude: number;
      longitude: number;
      locationName?: string;
      bmkgAdm4Code?: string;
      source?: WeatherSnapshot['locationSource'];
    };
    providerMode?: 'open-meteo' | 'bmkg-hybrid';
  }) => void;
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
  const [commodityFilter, setCommodityFilter] = useState<'Semua' | CommodityType>('Semua');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<ScheduledTask['category']>('Pemupukan');
  const [newTaskDate, setNewTaskDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTaskTime, setNewTaskTime] = useState('06:30 – 08:30');
  const [newTaskNote, setNewTaskNote] = useState('');

  const [selectedProvider, setSelectedProvider] = useState<'bmkg-hybrid' | 'open-meteo'>(
    weather.providerMode || 'bmkg-hybrid'
  );
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>(
    weather.bmkgAdm4Code || BMKG_ADMIN_REGION_PRESETS[0].bmkgAdm4Code
  );
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [locationSearchResults, setLocationSearchResults] = useState<
    Array<{
      id: string;
      name: string;
      fullName: string;
      latitude: number;
      longitude: number;
    }>
  >([]);

  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (locationSearchQuery.trim().length < 2) return;
    setIsSearchingLocation(true);
    try {
      const results = await searchIndonesianLocationCoordinates(locationSearchQuery);
      setLocationSearchResults(results);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectSearchedLocation = (item: {
    fullName: string;
    latitude: number;
    longitude: number;
  }) => {
    setLocationSearchResults([]);
    setLocationSearchQuery('');
    onRefreshWeather({
      customCoords: {
        latitude: item.latitude,
        longitude: item.longitude,
        locationName: item.fullName,
        source: 'Lokasi Terpilih Presisi',
      },
      providerMode: selectedProvider,
    });
  };

  const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  const [phInput, setPhInput] = useState(String(activePlot?.soilObservation.ph ?? 6.5));
  const [moistureInput, setMoistureInput] = useState(
    String(activePlot?.soilObservation.moisturePct ?? 62)
  );
  const [tempInput, setTempInput] = useState(String(activePlot?.soilObservation.soilTempC ?? 24));
  const [sourceInput, setSourceInput] = useState<SoilObservation['sourceType']>(
    'Alat Ukur Tanah / pH Meter'
  );
  const [soilSavedMsg, setSoilSavedMsg] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    if (commodityFilter !== 'Semua' && t.commodity !== commodityFilter) return false;
    return true;
  });

  const soilEval = evaluateSoilParameters(
    activePlot?.soilObservation.ph ?? 6.5,
    activePlot?.soilObservation.moisturePct ?? 62,
    activePlot?.soilObservation.soilTempC ?? 24
  );

  const isWeatherCondusive =
    weather.sprayingAdvisory.isCondusive ??
    !weather.sprayingAdvisory.status.toLowerCase().includes('tunda');

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
    const tempVal = Math.min(45, Math.max(10, Math.round(parseFloat(tempInput) || 24)));

    const evalRes = evaluateSoilParameters(phVal, moistVal, tempVal);
    onUpdateSoilObservation(activePlot.id, {
      id: `soil-${Date.now()}`,
      plotId: activePlot.id,
      recordedAt:
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
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

  const handleRegionPresetChange = (adm4Code: string) => {
    setSelectedPresetCode(adm4Code);
    const preset = BMKG_ADMIN_REGION_PRESETS.find((r) => r.bmkgAdm4Code === adm4Code);
    if (preset) {
      onRefreshWeather({
        customCoords: {
          latitude: preset.latitude,
          longitude: preset.longitude,
          locationName: preset.label,
          bmkgAdm4Code: preset.bmkgAdm4Code,
        },
        providerMode: selectedProvider,
      });
    }
  };

  // ============================================================================
  // GOOGLE CALENDAR WORKSPACE OAUTH 2.0 STATE & MANDATORY CONFIRMATION MODAL
  // ============================================================================
  const [gcalUser, setGcalUser] = useState<{
    email: string | null;
    displayName: string | null;
  } | null>(null);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState<boolean>(true);
  const [gcalEvents, setGcalEvents] = useState<GoogleCalendarEventItem[]>([]);
  const [isLoadingGcal, setIsLoadingGcal] = useState<boolean>(false);
  const [gcalStatusMsg, setGcalStatusMsg] = useState<string | null>(null);
  const [gcalErrorMsg, setGcalErrorMsg] = useState<string | null>(null);

  // Confirmation modal state for mutating/destructive Google Calendar API operations
  const [pendingGcalAction, setPendingGcalAction] = useState<
    | {
        type: 'sync-tasks';
        tasksToSync: ScheduledTask[];
      }
    | {
        type: 'create-single';
        summary: string;
        description: string;
        isoDate: string;
        timeSlot: string;
      }
    | {
        type: 'delete-event';
        eventId: string;
        eventSummary: string;
      }
    | null
  >(null);

  const fetchUpcomingGoogleEvents = async () => {
    setIsLoadingGcal(true);
    setGcalErrorMsg(null);
    try {
      const items = await listGoogleCalendarEvents(12);
      setGcalEvents(items);
      setNeedsGoogleAuth(false);
    } catch (err: any) {
      if (err?.message === 'AUTH_REQUIRED') {
        setNeedsGoogleAuth(true);
      } else {
        setGcalErrorMsg(err?.message || 'Gagal memuat jadwal dari Google Calendar.');
      }
    } finally {
      setIsLoadingGcal(false);
    }
  };

  useEffect(() => {
    const unsubscribe = initAuth((firebaseUser) => {
      if (firebaseUser) {
        setGcalUser({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        fetchUpcomingGoogleEvents();
      } else {
        setGcalUser(null);
        setNeedsGoogleAuth(true);
        setGcalEvents([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleCalendarSignIn = async () => {
    setGcalErrorMsg(null);
    setGcalStatusMsg(null);
    setIsLoadingGcal(true);
    try {
      await googleSignIn();
      setNeedsGoogleAuth(false);
      await fetchUpcomingGoogleEvents();
      setGcalStatusMsg('Berhasil terhubung ke Google Calendar! Jadwal siap disinkronkan.');
    } catch (err: any) {
      setGcalErrorMsg(
        err?.message ||
          'Gagal masuk dengan akun Google. Pastikan jendela pop-up diizinkan di browser Anda.'
      );
    } finally {
      setIsLoadingGcal(false);
    }
  };

  const handleGoogleCalendarSignOut = async () => {
    await googleLogout();
    setGcalUser(null);
    setNeedsGoogleAuth(true);
    setGcalEvents([]);
    setGcalStatusMsg('Akun Google Calendar telah diputuskan.');
  };

  const requestSyncTasksConfirmation = () => {
    setGcalErrorMsg(null);
    setGcalStatusMsg(null);
    const pendingTasks = filteredTasks.filter((t) => !t.completed);
    if (pendingTasks.length === 0) {
      setGcalErrorMsg('Tidak ada jadwal kegiatan belum selesai untuk disinkronkan.');
      return;
    }
    setPendingGcalAction({
      type: 'sync-tasks',
      tasksToSync: pendingTasks,
    });
  };

  const requestSingleTaskToGcalConfirmation = (task: ScheduledTask) => {
    setGcalErrorMsg(null);
    setGcalStatusMsg(null);
    setPendingGcalAction({
      type: 'create-single',
      summary: `[TaniCerdas - ${task.commodity}] ${task.title} (${task.plotName})`,
      description: `Kegiatan Budidaya: ${task.title}\nLahan: ${task.plotName} (${task.commodity})\nKategori: ${task.category}\nCatatan/Dosis: ${task.dosageOrNote || '-'}\nWaktu: ${task.dateLabel}`,
      isoDate: task.isoDate,
      timeSlot: task.timeSlot,
    });
  };

  const requestDeleteGcalEventConfirmation = (ev: GoogleCalendarEventItem) => {
    setGcalErrorMsg(null);
    setGcalStatusMsg(null);
    setPendingGcalAction({
      type: 'delete-event',
      eventId: ev.id,
      eventSummary: ev.summary || 'Jadwal Pertanian',
    });
  };

  const executeConfirmedGcalAction = async () => {
    if (!pendingGcalAction) return;
    const action = pendingGcalAction;
    setPendingGcalAction(null);
    setIsLoadingGcal(true);
    setGcalErrorMsg(null);
    setGcalStatusMsg(null);

    try {
      if (action.type === 'sync-tasks') {
        const createdItems = await syncFarmTasksToGoogleCalendar(action.tasksToSync);
        setGcalStatusMsg(
          `Berhasil menyinkronkan ${createdItems.length} jadwal tanam ke Google Calendar utama Anda!`
        );
        await fetchUpcomingGoogleEvents();
      } else if (action.type === 'create-single') {
        const datePrefix =
          action.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(action.isoDate)
            ? action.isoDate
            : new Date().toISOString().slice(0, 10);
        await createGoogleCalendarEvent({
          summary: action.summary,
          description: action.description,
          location: activePlot?.name || 'Lahan Pertanian TaniCerdas',
          isoDate: datePrefix,
          timeSlot: action.timeSlot,
        });
        setGcalStatusMsg(`Acara "${action.summary}" berhasil ditambahkan ke Google Calendar!`);
        await fetchUpcomingGoogleEvents();
      } else if (action.type === 'delete-event') {
        await deleteGoogleCalendarEvent(action.eventId);
        setGcalStatusMsg(`Acara "${action.eventSummary}" berhasil dihapus dari Google Calendar.`);
        await fetchUpcomingGoogleEvents();
      }
    } catch (err: any) {
      if (err?.message === 'AUTH_REQUIRED') {
        setNeedsGoogleAuth(true);
        setGcalErrorMsg(
          'Sesi token Google Calendar berakhir atau belum login. Silakan klik "Sign in with Google" terlebih dahulu.'
        );
      } else {
        setGcalErrorMsg(err?.message || 'Gagal menjalankan aksi pada Google Calendar.');
      }
    } finally {
      setIsLoadingGcal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GOOGLE CALENDAR WORKSPACE INTEGRATION CARD */}
      <section
        data-testid="google-calendar-integration-card"
        className="rounded-2xl bg-white p-5 border-2 border-[#15803D]/25 shadow-xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-[#F0FDF4] border border-[#15803D]/20 flex items-center justify-center shrink-0">
              <CalendarIcon className="h-6 w-6 text-[#15803D]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#17231B]">
                  Integrasi Google Calendar Pertanian
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#15803D]" />
                  Google Workspace OAuth 2.0
                </span>
              </div>
              <p className="text-xs text-[#647067] mt-0.5">
                Sinkronkan jadwal pemupukan, penyemprotan OPT, pengairan, dan estimasi panen langsung ke Google Calendar pribadi Anda (WIB).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {needsGoogleAuth ? (
              <button
                type="button"
                onClick={handleGoogleCalendarSignIn}
                disabled={isLoadingGcal}
                data-testid="btn-google-calendar-signin"
                className="flex items-center justify-center gap-3 bg-white text-gray-700 font-medium py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all shadow-xs cursor-pointer text-xs sm:text-sm"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{isLoadingGcal ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {gcalUser && (
                  <span className="text-xs font-semibold text-[#14532D] bg-[#F0FDF4] border border-[#15803D]/25 px-3 py-1.5 rounded-xl">
                    Terhubung: {gcalUser.email || gcalUser.displayName || 'Akun Google'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={fetchUpcomingGoogleEvents}
                  disabled={isLoadingGcal}
                  className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#17231B] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingGcal ? 'animate-spin' : ''}`} />
                  <span>Muat Ulang Acara</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleCalendarSignOut}
                  className="h-9 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={requestSyncTasksConfirmation}
              disabled={isLoadingGcal}
              data-testid="btn-sync-tasks-google-calendar"
              className="h-10 px-4 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarIcon className="h-4 w-4" />
              <span>
                Sinkronkan {filteredTasks.filter((t) => !t.completed).length} Jadwal Tanam ke Google Calendar
              </span>
            </button>
          </div>
        </div>

        {gcalStatusMsg && (
          <div className="rounded-xl bg-[#DCFCE7] border border-[#15803D]/30 px-4 py-2.5 text-xs font-semibold text-[#14532D] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
              <span>{gcalStatusMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setGcalStatusMsg(null)}
              className="text-[#14532D] hover:underline text-[11px] font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {gcalErrorMsg && (
          <div className="rounded-xl bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs font-semibold text-amber-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{gcalErrorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setGcalErrorMsg(null)}
              className="text-amber-900 hover:underline text-[11px] font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Live Google Calendar Events List when signed in */}
        {!needsGoogleAuth && (
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#647067]">
                Acara Mendatang di Google Calendar Anda ({gcalEvents.length})
              </h3>
              <span className="text-[11px] text-[#15803D] font-semibold">
                Kalender Utama (primary) · Asia/Jakarta
              </span>
            </div>

            {gcalEvents.length === 0 ? (
              <div className="rounded-xl bg-[#F7FAF7] border border-slate-200 p-3.5 text-xs text-[#647067]">
                Belum ada acara mendatang di Google Calendar Anda. Klik tombol{' '}
                <strong>Sinkronkan Jadwal Tanam ke Google Calendar</strong> di atas untuk mengirim jadwal budidaya lahan Anda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {gcalEvents.map((ev) => {
                  const rawStart = ev.start?.dateTime || ev.start?.date || '';
                  const formattedStart = rawStart
                    ? new Date(rawStart).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: ev.start?.dateTime ? 'short' : undefined,
                      })
                    : 'Jadwal Aktif';
                  return (
                    <div
                      key={ev.id}
                      className="rounded-xl bg-[#F7FAF7] border border-slate-200 p-3 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#17231B] truncate">
                          {ev.summary || '(Tanpa Judul)'}
                        </div>
                        <div className="text-[11px] text-[#15803D] font-medium mt-0.5 tabular-nums">
                          {formattedStart}
                        </div>
                        {ev.description && (
                          <p className="text-[11px] text-[#647067] mt-0.5 line-clamp-1">
                            {ev.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka di Google Calendar"
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-[#15803D] hover:bg-[#DCFCE7]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => requestDeleteGcalEventConfirmation(ev)}
                          title="Hapus acara dari Google Calendar"
                          className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Main 2-Column Split: Screen 8 (Kalender Tanam & Pengingat) + Screen 9 (Data Cuaca & Kondisi Lahan Live) */}
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

          {/* Commodity Filter Tabs (Padi, Kacang Hijau, Jagung, Cabai, Semua) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F7FAF7] p-1.5 rounded-xl border border-slate-200">
            {(['Semua', 'Padi', 'Kacang Hijau', 'Jagung', 'Cabai'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCommodityFilter(item as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  commodityFilter === item
                    ? 'bg-[#15803D] text-white shadow-sm'
                    : 'text-[#647067] hover:text-[#17231B]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Active Plot Progress Banner */}
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

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-[#15803D]">Fase {activePlot.currentPhaseName}</span>
                  <span className="text-[#17231B] tabular-nums">
                    Estimasi Panen: ± 90 HST ({formatIndonesianDate(activePlot.estimatedHarvestDate)})
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#15803D] transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(12, Math.round((activePlot.currentHst / 90) * 100))
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Jadwal Kegiatan List */}
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

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestSingleTaskToGcalConfirmation(task);
                      }}
                      title="Tambahkan jadwal ini ke Google Calendar"
                      className="px-2.5 py-1 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#14532D] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <CalendarIcon className="h-3 w-3 text-[#15803D]" />
                      <span>+ GCal</span>
                    </button>
                    <span className="text-xs font-medium text-[#647067]">
                      {task.completed ? 'Selesai' : 'Jadwal'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pengingat Aktif Button */}
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

        {/* Right Column: Screen 9 — Data Cuaca & Kondisi Lahan (Live Multi-Source BMKG & Open-Meteo) */}
        <div
          className="lg:col-span-6 rounded-2xl bg-white p-5 border border-slate-200 space-y-5"
          data-testid="live-weather-module"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#17231B]">Data Cuaca & Kondisi Lahan</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] animate-pulse" />
                  LIVE API
                </span>
              </div>
              <p className="text-xs text-[#647067] flex flex-wrap items-center gap-1.5 mt-1">
                <MapPin className="h-3.5 w-3.5 text-[#15803D] shrink-0" />
                <strong className="text-[#17231B]" data-testid="weather-location-name">
                  {weather.locationName}
                </strong>
                {typeof weather.latitude === 'number' && typeof weather.longitude === 'number' && (
                  <span className="text-[11px] text-[#647067] tabular-nums">
                    ({weather.latitude.toFixed(3)}, {weather.longitude.toFixed(3)})
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onRefreshWeather({ forceGps: true, providerMode: selectedProvider })}
                disabled={isLoadingWeather}
                title="Deteksi titik koordinat GPS aktual perangkat Anda"
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#15803D]/30 bg-[#F0FDF4] hover:bg-[#DCFCE7] px-3 text-xs font-bold text-[#14532D] cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5 text-[#15803D]" />
                <span>Aktifkan GPS Saya</span>
              </button>
              <button
                type="button"
                onClick={() => onRefreshWeather({ providerMode: selectedProvider })}
                disabled={isLoadingWeather}
                aria-label="Segarkan data cuaca"
                data-testid="btn-refresh-weather-api"
                className="flex h-9 items-center gap-1.5 rounded-xl bg-[#15803D] hover:bg-[#14532D] px-3.5 text-xs font-bold text-white cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
                <span>{isLoadingWeather ? 'Memuat...' : 'Segarkan API'}</span>
              </button>
            </div>
          </div>

          {/* STATUS AKURASI LOKASI & WAJIB AKTIFKAN GPS PERANGKAT */}
          {weather.locationSource === 'GPS Browser Akurat' ? (
            <div className="rounded-xl bg-[#DCFCE7]/70 border border-[#15803D]/30 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#14532D]">
                <ShieldCheck className="h-4 w-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>GPS Perangkat Aktif & Akurat</strong>
                  {weather.gpsAccuracyMeters ? ` (±${weather.gpsAccuracyMeters} meter)` : ''} — Cuaca terkunci pada titik koordinat riil perangkat Anda.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRefreshWeather({ forceGps: true, providerMode: selectedProvider })}
                className="text-[11px] font-bold text-[#15803D] hover:underline cursor-pointer"
              >
                Kalibrasi Ulang GPS →
              </button>
            </div>
          ) : weather.locationSource === 'Lokasi Terpilih Presisi' ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#14532D]">
                <MapPin className="h-4 w-4 text-[#15803D] shrink-0" />
                <span>
                  <strong>Titik Lokasi Lahan Terkunci Presisi</strong> ({weather.latitude?.toFixed(4)}, {weather.longitude?.toFixed(4)}) — Cuaca disesuaikan dengan lokasi terpilih.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRefreshWeather({ forceGps: true, providerMode: selectedProvider })}
                className="text-[11px] font-bold text-[#15803D] hover:underline cursor-pointer"
              >
                Gunakan GPS Perangkat →
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 border border-amber-300 p-3.5 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 text-amber-950">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">
                      Perangkat Wajib Mengaktifkan Lokasi (GPS) untuk Akurasi Cuaca Lahan
                    </strong>
                    <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                      {weather.gpsErrorMessage ||
                        'Agar suhu, peluang hujan, dan rekomendasi penyemprotan 100% akurat sesuai posisi sawah/perangkat Anda, wajib aktifkan izin Lokasi (GPS) pada perangkat/browser Anda atau cari nama desa/kecamatan Anda di bawah.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRefreshWeather({ forceGps: true, providerMode: selectedProvider })}
                  className="px-3 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-bold shrink-0 cursor-pointer"
                >
                  Aktifkan GPS Sekarang
                </button>
              </div>
            </div>
          )}

          {/* Pencarian Titik Koordinat Desa / Kecamatan / Kabupaten Seluruh Indonesia */}
          <div className="bg-[#F7FAF7] p-3 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <form onSubmit={handleSearchLocation} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="h-3.5 w-3.5 text-[#647067] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  placeholder="Cari nama Desa / Kecamatan / Kabupaten Anda (misal: Undaan, Subang, Ngawi, Klaten)..."
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-[#17231B] focus:border-[#15803D] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingLocation || locationSearchQuery.trim().length < 2}
                className="h-9 px-3.5 rounded-lg bg-[#15803D] hover:bg-[#14532D] disabled:bg-slate-300 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                {isSearchingLocation ? 'Mencari...' : 'Cari Lokasi'}
              </button>
            </form>

            {locationSearchResults.length > 0 && (
              <div className="rounded-lg bg-white border border-slate-200 divide-y divide-slate-100 max-h-44 overflow-y-auto">
                {locationSearchResults.map((resItem) => (
                  <button
                    key={resItem.id}
                    type="button"
                    onClick={() => handleSelectSearchedLocation(resItem)}
                    className="w-full px-3 py-2 text-left hover:bg-[#F0FDF4] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3.5 w-3.5 text-[#15803D] shrink-0" />
                      <span className="font-semibold text-[#17231B] truncate">
                        {resItem.fullName}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#647067] tabular-nums shrink-0">
                      {resItem.latitude.toFixed(3)}, {resItem.longitude.toFixed(3)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label
                  htmlFor="weather-region-select"
                  className="block text-[10px] font-bold uppercase text-[#647067] mb-1"
                >
                  Wilayah Lahan Cepat / Kode BMKG (adm4)
                </label>
                <select
                  id="weather-region-select"
                  value={selectedPresetCode}
                  onChange={(e) => handleRegionPresetChange(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#17231B]"
                >
                  {BMKG_ADMIN_REGION_PRESETS.map((reg) => (
                    <option key={reg.bmkgAdm4Code} value={reg.bmkgAdm4Code}>
                      {reg.label} ({reg.bmkgAdm4Code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="weather-provider-select"
                  className="block text-[10px] font-bold uppercase text-[#647067] mb-1"
                >
                  Sumber Mesin Cuaca Terverifikasi
                </label>
                <select
                  id="weather-provider-select"
                  value={selectedProvider}
                  onChange={(e) => {
                    const nextMode = e.target.value as 'bmkg-hybrid' | 'open-meteo';
                    setSelectedProvider(nextMode);
                    onRefreshWeather({ providerMode: nextMode });
                  }}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#17231B]"
                >
                  <option value="bmkg-hybrid">
                    BMKG Terbuka + Open-Meteo Forecast (Terverifikasi)
                  </option>
                  <option value="open-meteo">
                    Open-Meteo High-Resolution Seamless (Asia/Jakarta)
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Current Weather Hero Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#F0FDF4] via-white to-[#E0F2FE] p-5 border border-emerald-900/15 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-500 shrink-0">
                  {weather.conditionText.includes('Hujan') ? (
                    <CloudRain className="h-10 w-10 text-sky-600" />
                  ) : weather.conditionText === 'Cerah' ? (
                    <Sun className="h-10 w-10 text-amber-500" />
                  ) : (
                    <CloudSun className="h-10 w-10 text-amber-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl font-extrabold text-[#17231B] tabular-nums"
                      data-testid="weather-current-temp"
                    >
                      {weather.tempC}°C
                    </span>
                    <span className="text-xs font-semibold text-[#647067] tabular-nums">
                      Terasa {weather.apparentTempC ?? weather.tempC}°C
                    </span>
                  </div>
                  <div className="text-sm font-bold text-[#17231B] mt-0.5">
                    {weather.conditionText}
                  </div>
                  <div
                    className="text-[11px] text-[#647067] mt-0.5 tabular-nums"
                    data-testid="weather-updated-timestamp"
                  >
                    Diperbarui: <strong className="text-[#17231B]">{weather.updatedAt}</strong> ·{' '}
                    {weather.sourceName}
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span
                  data-testid="weather-advisory-status"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                    isWeatherCondusive
                      ? 'bg-[#DCFCE7] text-[#14532D] border border-emerald-300'
                      : 'bg-amber-100 text-amber-950 border border-amber-300'
                  }`}
                >
                  {isWeatherCondusive ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-[#15803D]" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                  )}
                  Rekomendasi Cuaca: {weather.sprayingAdvisory.status}
                </span>
                <span className="text-xs font-bold text-sky-800 tabular-nums block mt-1">
                  Peluang hujan hari ini: {weather.rainProbabilityPct}% (Curah hujan:{' '}
                  {weather.rainfallMm} mm)
                </span>
              </div>
            </div>

            {/* Dynamic Agronomic Spraying & Fertilizing Advisory Box */}
            <div
              className={`rounded-xl p-3 text-xs leading-relaxed border ${
                isWeatherCondusive
                  ? 'bg-[#F0FDF4] border-emerald-200 text-[#14532D]'
                  : 'bg-amber-50/90 border-amber-300 text-amber-950'
              }`}
            >
              <strong className="font-extrabold block mb-0.5">
                 Panduan Penyemprotan & Pemupukan Real-Time:
              </strong>
              <span>{weather.sprayingAdvisory.recommendation}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/70 text-center">
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
                  Kecepatan Angin
                </span>
                <strong className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                  {weather.windSpeedKmh} km/jam
                </strong>
              </div>
              <div>
                <span className="text-xs text-[#647067] flex items-center justify-center gap-1">
                  <Compass className="h-3.5 w-3.5 text-sky-600" />
                  Arah Angin
                </span>
                <strong className="text-sm font-bold text-[#17231B] tabular-nums mt-0.5 block">
                  {weather.windDirectionCardinal || 'Timur'}{' '}
                  {typeof weather.windDirectionDeg === 'number'
                    ? `(${weather.windDirectionDeg}°)`
                    : ''}
                </strong>
              </div>
            </div>
          </div>

          {/* Hourly Forecast Strip (if available from Open-Meteo Live) */}
          {Array.isArray(weather.hourlyForecast) && weather.hourlyForecast.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#647067] mb-2">
                Prakiraan Per Jam Hari Ini (Jendela Semprot & Hujan)
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {weather.hourlyForecast.slice(0, 8).map((hr, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#F7FAF7] border border-slate-200/80 p-2 text-center tabular-nums"
                  >
                    <span className="text-[10px] font-bold text-[#647067] block">
                      {hr.hourLabel}
                    </span>
                    <span className="text-xs font-extrabold text-[#17231B] block mt-1">
                      {hr.tempC}°C
                    </span>
                    <span
                      className={`text-[10px] font-bold block mt-0.5 ${
                        hr.rainProbabilityPct > 55 ? 'text-sky-700' : 'text-[#15803D]'
                      }`}
                    >
                      {hr.rainProbabilityPct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prakiraan 5–7 Hari ke Depan (Dynamic Intl.DateTimeFormat Dates) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-sm font-bold text-[#17231B]">
                Prakiraan {weather.forecast.length} Hari ke Depan (Tanggal Real-Time)
              </h3>
              <span className="text-[11px] text-[#647067]">Zona Waktu: Asia/Jakarta</span>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2"
              data-testid="weather-forecast-grid"
            >
              {weather.forecast.map((day, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-2.5 text-center border ${
                    idx === 0
                      ? 'bg-[#F0FDF4] border-[#15803D]/40'
                      : 'bg-[#F7FAF7] border-slate-200/80'
                  }`}
                >
                  <span className="text-[11px] font-extrabold text-[#17231B] block leading-tight">
                    {day.formattedDate || day.dayName}
                  </span>
                  <span className="text-[10px] text-[#15803D] font-semibold block">
                    {idx === 0 ? 'Hari Ini' : idx === 1 ? 'Besok' : day.condition}
                  </span>
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
                  <span className="text-[10px] text-sky-800 font-semibold tabular-nums block mt-0.5">
                    {day.rainChancePct}% · {day.rainfallMm}mm
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kondisi Tanah (Lahan Aktif) */}
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

              <div className="rounded-xl bg-[#DCFCE7]/50 border border-[#15803D]/20 p-3.5">
                <h4 className="text-xs font-bold text-[#14532D]">Rekomendasi Kondisi Lahan</h4>
                <p className="text-xs text-[#17231B] mt-0.5">{soilEval.recommendation}</p>
              </div>

              {/* Manual Soil Input Form */}
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
                    <option value="Alat Ukur Tanah / pH Meter">
                      Sumber: Alat Ukur Tanah / pH Meter
                    </option>
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
                <label
                  htmlFor="task-title"
                  className="block text-xs font-semibold text-[#17231B] mb-1"
                >
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
                <label
                  htmlFor="task-cat"
                  className="block text-xs font-semibold text-[#17231B] mb-1"
                >
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
                  <label
                    htmlFor="task-date"
                    className="block text-xs font-semibold text-[#17231B] mb-1"
                  >
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
                  <label
                    htmlFor="task-time"
                    className="block text-xs font-semibold text-[#17231B] mb-1"
                  >
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
                <label
                  htmlFor="task-note"
                  className="block text-xs font-semibold text-[#17231B] mb-1"
                >
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

      {/* MANDATORY USER CONFIRMATION MODAL FOR GOOGLE CALENDAR MUTATING/DESTRUCTIVE ACTIONS */}
      {pendingGcalAction && (
        <div
          data-testid="google-calendar-confirm-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Perubahan Google Calendar"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17231B]">
                    Konfirmasi Aksi Google Calendar
                  </h3>
                  <p className="text-xs text-[#647067]">
                    Tinjau detail jadwal sebelum mengubah data di Google Calendar Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingGcalAction(null)}
                aria-label="Tutup konfirmasi"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {pendingGcalAction.type === 'sync-tasks' && (
              <div className="space-y-3 text-xs">
                <p className="text-[#17231B] leading-relaxed">
                  Anda akan menambahkan{' '}
                  <strong>{pendingGcalAction.tasksToSync.length} jadwal kegiatan budidaya</strong>{' '}
                  berikut ke kalender utama (<strong>primary</strong>) Google Calendar Anda:
                </p>
                <div className="rounded-xl bg-[#F7FAF7] border border-slate-200 p-3 max-h-48 overflow-y-auto space-y-2">
                  {pendingGcalAction.tasksToSync.map((t) => (
                    <div
                      key={t.id}
                      className="pb-2 last:pb-0 border-b last:border-b-0 border-slate-200/70"
                    >
                      <div className="font-bold text-[#17231B]">
                        [{t.commodity}] {t.title} — {t.plotName}
                      </div>
                      <div className="text-[11px] text-[#15803D] tabular-nums">{t.dateLabel}</div>
                      {t.dosageOrNote && (
                        <div className="text-[11px] text-[#647067]">{t.dosageOrNote}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pendingGcalAction.type === 'create-single' && (
              <div className="space-y-2.5 text-xs">
                <p className="text-[#17231B]">
                  Anda akan membuat acara baru di Google Calendar utama Anda dengan rincian:
                </p>
                <div className="rounded-xl bg-[#F7FAF7] border border-slate-200 p-3.5 space-y-1.5">
                  <div>
                    <span className="text-[#647067] block">Judul Acara:</span>
                    <strong className="text-[#17231B]">{pendingGcalAction.summary}</strong>
                  </div>
                  <div>
                    <span className="text-[#647067] block">Tanggal & Jam (WIB):</span>
                    <strong className="text-[#15803D] tabular-nums">
                      {pendingGcalAction.isoDate} · {pendingGcalAction.timeSlot}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#647067] block">Deskripsi:</span>
                    <p className="text-[#17231B] whitespace-pre-line">
                      {pendingGcalAction.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pendingGcalAction.type === 'delete-event' && (
              <div className="space-y-2.5 text-xs">
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-rose-950">
                  <strong className="font-bold block mb-1">
                    Peringatan Penghapusan Acara Google Calendar
                  </strong>
                  <p>
                    Apakah Anda yakin ingin menghapus acara{' '}
                    <strong>"{pendingGcalAction.eventSummary}"</strong> secara permanen dari Google
                    Calendar Anda?
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingGcalAction(null)}
                data-testid="btn-cancel-gcal-confirm"
                className="px-4 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#647067] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedGcalAction}
                data-testid="btn-approve-gcal-confirm"
                className={`px-4 h-10 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  pendingGcalAction.type === 'delete-event'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#15803D] hover:bg-[#14532D]'
                }`}
              >
                {pendingGcalAction.type === 'delete-event'
                  ? 'Ya, Hapus dari Google Calendar'
                  : 'Konfirmasi & Simpan ke Google Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
