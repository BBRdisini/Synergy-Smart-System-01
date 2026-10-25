import React from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  CloudRain,
  Database,
  HelpCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sprout,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { FarmPlot, UserProfile } from '../types/agronomy';

interface ProfileAndOfflineViewProps {
  user: UserProfile;
  plots: FarmPlot[];
  isOfflineSimulated: boolean;
  onToggleOfflineSimulated: () => void;
  lastSyncedAt: string;
  onTriggerManualSync: () => void;
  onOpenAuthModal: () => void;
  onResetDemoData: () => void;
}

export const ProfileAndOfflineView: React.FC<ProfileAndOfflineViewProps> = ({
  user,
  plots,
  isOfflineSimulated,
  onToggleOfflineSimulated,
  lastSyncedAt,
  onTriggerManualSync,
  onOpenAuthModal,
  onResetDemoData,
}) => {
  const totalAreaHa = Number(plots.reduce((acc, p) => acc + p.areaHa, 0).toFixed(1));
  const uniqueCommodities = new Set(plots.map((p) => p.commodity)).size;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Screen 15 (Profil) + Screen 16 (Mode Offline Aktif) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Screen 15: Profil Card */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[#DCFCE7] border-2 border-[#15803D] flex items-center justify-center text-[#14532D] font-bold text-xl">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#17231B]">{user.name}</h1>
                  <p className="text-xs text-[#647067]">{user.emailOrPhone}</p>
                  <p className="text-xs font-medium text-[#15803D] mt-0.5">
                    {user.role} · {user.village}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#17231B] cursor-pointer"
              >
                Ubah Akun
              </button>
            </div>

            {/* Stats Row matching Screen 15 (Lahan, Total Luas, Komoditas) */}
            <div className="grid grid-cols-3 gap-3 text-center py-4 rounded-2xl bg-[#F7FAF7] border border-slate-200/80">
              <div>
                <strong className="text-2xl font-bold text-[#17231B] tabular-nums block">
                  {plots.length}
                </strong>
                <span className="text-xs text-[#647067]">Lahan</span>
              </div>
              <div className="border-x border-slate-200">
                <strong className="text-2xl font-bold text-[#15803D] tabular-nums block">
                  {totalAreaHa} Ha
                </strong>
                <span className="text-xs text-[#647067]">Total Luas</span>
              </div>
              <div>
                <strong className="text-2xl font-bold text-[#17231B] tabular-nums block">
                  { Math.max(uniqueCommodities, 3) }
                </strong>
                <span className="text-xs text-[#647067]">Komoditas</span>
              </div>
            </div>

            {/* Menu List matching Screen 15 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAF7] text-xs">
                <div className="flex items-center gap-3 font-semibold text-[#17231B]">
                  <User className="h-4 w-4 text-[#15803D]" />
                  <span>Data Pribadi & Kelompok Tani</span>
                </div>
                <span className="text-[#647067]">Terverifikasi</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAF7] text-xs">
                <div className="flex items-center gap-3 font-semibold text-[#17231B]">
                  <ShieldCheck className="h-4 w-4 text-[#15803D]" />
                  <span>Akun, Keamanan & Persetujuan Privasi Foto</span>
                </div>
                <span className="text-[#15803D] font-semibold">Aktif</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAF7] text-xs">
                <div className="flex items-center gap-3 font-semibold text-[#17231B]">
                  <RefreshCw className="h-4 w-4 text-[#15803D]" />
                  <span>Sinkronisasi Data Lokal (Terakhir: {lastSyncedAt})</span>
                </div>
                <button
                  type="button"
                  onClick={onTriggerManualSync}
                  className="px-3 py-1 rounded-lg bg-[#15803D] text-white font-semibold cursor-pointer"
                >
                  Sinkronkan
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onResetDemoData}
                className="text-xs font-medium text-[#647067] hover:text-[#17231B] underline cursor-pointer"
              >
                Kembalikan Data Awal (Reset Seed Demo)
              </button>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar / Ganti Profil</span>
              </button>
            </div>
          </div>

          {/* Screen 16: Mode Offline Aktif Card */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#15803D] text-white flex items-center justify-center">
                  <WifiOff className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#17231B]">
                    Mode Offline & Koneksi Lemah
                  </h2>
                  <p className="text-xs text-[#647067]">
                    Data penting tetap dapat diakses di sawah tanpa sinyal internet
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onToggleOfflineSimulated}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isOfflineSimulated
                    ? 'bg-amber-500 text-white'
                    : 'bg-[#DCFCE7] text-[#14532D]'
                }`}
              >
                {isOfflineSimulated ? 'Mode Offline Aktif' : 'Simulasikan Offline'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {[
                'Panduan Budidaya Multi-Komoditas',
                'Kalender & Pengingat Musim Tanam',
                'Catatan Lahan, Biaya & Hasil Panen',
                'Data Agronomi & Label Pestisida Resmi',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F7FAF7] text-[#17231B] font-medium"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#647067]">
              Catatan: Saat perangkat offline, perubahan jadwal dan pencatatan biaya disimpan di penyimpanan lokal perangkat dan disinkronkan saat koneksi kembali. Analisis visual cloud Gemini membutuhkan koneksi internet, namun basis pengetahuan agronomi lokal tetap tersedia.
            </p>
          </div>
        </div>

        {/* Right Column: Screen 14 — Pusat Notifikasi & Peringatan */}
        <div className="lg:col-span-6 rounded-2xl bg-white p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[#17231B]">Notifikasi & Peringatan Lapangan</h2>
              <p className="text-xs text-[#647067]">
                Peringatan jadwal pemupukan, deteksi penyakit, cuaca, dan jendela panen
              </p>
            </div>
            <Bell className="h-5 w-5 text-[#15803D]" />
          </div>

          <div className="space-y-3">
            {/* Notification 1 matching Screen 14 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F7FAF7] border border-slate-200">
              <div className="h-10 w-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17231B]">Jadwal Pemupukan</h3>
                <p className="text-xs text-[#647067] mt-0.5">
                  Hari ini pukul 06:00 di Lahan 1 (Pemupukan Urea susulan Fase Vegetatif 20 HST)
                </p>
              </div>
            </div>

            {/* Notification 2 matching Screen 14 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-red-50/70 border border-red-200">
              <div className="h-10 w-10 rounded-full bg-red-100 text-[#DC2626] flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#DC2626]">Peringatan Penyakit</h3>
                <p className="text-xs text-[#17231B] mt-0.5">
                  Terdeteksi gejala Blas (Pyricularia oryzae) di Lahan 1 — Periksa rekomendasi PHT & label resmi Score 250 EC / Antracol 70 WP
                </p>
              </div>
            </div>

            {/* Notification 3 matching Screen 14 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
              <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <CloudRain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-sky-900">Prakiraan Cuaca Lusa</h3>
                <p className="text-xs text-[#647067] mt-0.5">
                  Peluang hujan meningkat pada hari Rabu di Undaan, Kudus. Hindari aplikasi semprot sesaat sebelum hujan turun.
                </p>
              </div>
            </div>

            {/* Notification 4 matching Screen 14 */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F7FAF7] border border-slate-200">
              <div className="h-10 w-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17231B]">Persiapan Jendela Panen</h3>
                <p className="text-xs text-[#647067] mt-0.5">
                  Estimasi panen Lahan 4 (Cabai Lokal) dalam ±15 hari. Siapkan pencatatan hasil panen dan sortir kualitas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
