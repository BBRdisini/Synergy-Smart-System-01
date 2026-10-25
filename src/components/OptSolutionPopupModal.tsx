import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CloudRain,
  Droplets,
  FlaskConical,
  Leaf,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Wind,
  X,
} from 'lucide-react';
import { EpidemiologyOptAlert, WeatherSnapshot } from '../types/agronomy';

interface OptSolutionPopupModalProps {
  alert: EpidemiologyOptAlert | null;
  weather: WeatherSnapshot;
  onClose: () => void;
  onAddSprayToAgenda: (alert: EpidemiologyOptAlert) => void;
  onOpenCameraDiagnosis: () => void;
}

export const OptSolutionPopupModal: React.FC<OptSolutionPopupModalProps> = ({
  alert,
  weather,
  onClose,
  onAddSprayToAgenda,
  onOpenCameraDiagnosis,
}) => {
  const [addedToAgenda, setAddedToAgenda] = useState(false);

  if (!alert) return null;

  const isHighRisk = alert.riskLevel === 'Tinggi / Siaga';
  const isMedRisk = alert.riskLevel === 'Waspada';

  const handleScheduleClick = () => {
    onAddSprayToAgenda(alert);
    setAddedToAgenda(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Solusi Lengkap ${alert.optName}`}
      data-testid="opt-solution-popup-modal"
    >
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Sticky Top Header */}
        <div
          className={`px-5 py-4 sm:px-6 sm:py-5 border-b flex items-start justify-between gap-4 ${
            isHighRisk
              ? 'bg-gradient-to-r from-[#FEF2F2] via-[#FFF7ED] to-[#F0FDF4] border-red-200'
              : isMedRisk
              ? 'bg-gradient-to-r from-[#FFFBEB] via-[#FEFCE8] to-[#F0FDF4] border-amber-200'
              : 'bg-[#F0FDF4] border-emerald-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-extrabold uppercase tracking-wider ${
                  isHighRisk
                    ? 'bg-[#DC2626] text-white'
                    : isMedRisk
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#15803D] text-white'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Risiko {alert.riskLevel} ({alert.riskScorePct}%)
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/90 border border-slate-200 text-xs font-bold text-[#14532D]">
                Komoditas: {alert.targetCommodity}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-white/90 border border-slate-200 text-xs font-semibold text-[#4A634D]">
                {alert.plantingSeasonMT} · {alert.cropAgeHstLabel}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-[#17231B] leading-snug">
              {alert.optName}
            </h2>
            <p className="text-xs italic text-[#4A634D]">
              Organisme Pengganggu Tumbuhan (OPT): {alert.scientificName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup popup solusi lengkap"
            className="h-9 w-9 rounded-xl bg-white/90 hover:bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 cursor-pointer shadow-2xs"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable 6-Section Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-[#17231B]">
          {/* SECTION 1: Mengapa Penyakit Ini Mengancam Sekarang? (Alasan Cuaca & Musim) */}
          <section className="rounded-2xl bg-[#F8FAFC] border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#14532D]">
              <CloudRain className="h-4 w-4 text-sky-600 shrink-0" />
              <h3>1. Mengapa Penyakit / Hama Ini Mengancam Sekarang? (Alasan Cuaca & Musim)</h3>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-sky-900 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
              <span>Pemicu Cuaca Live ({weather.locationName}):</span>
              <span className="tabular-nums">{alert.weatherTriggerHeadline}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#1F3321] leading-relaxed">
              {alert.whyItThreatensNow}
            </p>
          </section>

          {/* SECTION 2: Kenali Gejala Awal di Sawah (Ciri Fisik) */}
          <section className="rounded-2xl bg-[#FFFBEB]/70 border border-amber-200/80 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#92400E]">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <h3>2. Kenali Gejala Awal di Sawah (Ciri Fisik Lapangan)</h3>
            </div>
            <ul className="space-y-2">
              {alert.earlyFieldSymptoms.map((symptom, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-[#17231B] leading-relaxed bg-white/90 p-3 rounded-xl border border-amber-200/60"
                >
                  <span className="h-5 w-5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* SECTION 3: Langkah Pencegahan & Tindakan Darurat (Tanpa Obat Kimia / Kultur Teknis) */}
          <section className="rounded-2xl bg-[#F0FDF4] border border-emerald-200 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-extrabold text-[#14532D]">
              <Sprout className="h-4 w-4 text-[#15803D] shrink-0" />
              <h3>
                3. Langkah Pencegahan & Tindakan Darurat di Sawah (Tanpa Obat Kimia / Kultur Teknis)
              </h3>
            </div>
            <ul className="space-y-2">
              {alert.culturalPreventionSteps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-[#17231B] leading-relaxed bg-white p-3 rounded-xl border border-emerald-200/70"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0 mt-0.5" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* SECTION 4: Rekomendasi Pengendalian Hayati / Organik */}
          <section className="rounded-2xl bg-[#ECFDF5]/60 border border-teal-200 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-teal-900">
              <Leaf className="h-4 w-4 text-teal-700 shrink-0" />
              <h3>4. Rekomendasi Pengendalian Hayati & Organik (Ramah Musuh Alami)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alert.biologicalOrganicControl.map((bio, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white p-3.5 border border-teal-200/80 space-y-1.5"
                >
                  <h4 className="text-xs sm:text-sm font-extrabold text-teal-950">
                    {bio.agentName}
                  </h4>
                  <p className="text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    Takaran Praktis: {bio.practicalDosage}
                  </p>
                  <p className="text-xs text-[#4A634D] leading-relaxed">
                    <strong className="text-[#17231B]">Cara Aplikasi:</strong>{' '}
                    {bio.applicationMethod}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: Panduan Obat / Pestisida Tepat Sasaran & Takaran Praktis per Tangki 16 Liter */}
          <section className="rounded-2xl bg-white border-2 border-[#15803D]/30 p-4 space-y-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#14532D]">
                <FlaskConical className="h-4 w-4 text-[#15803D] shrink-0" />
                <h3>
                  5. Panduan Obat / Pestisida Tepat Sasaran & Takaran Praktis per Tangki 16 Liter
                </h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D]">
                Terdaftar Resmi Kementan RI
              </span>
            </div>

            <div className="space-y-3">
              {alert.chemicalControlGuides.map((chem, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-[#F7FAF7] border border-slate-200 p-3.5 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#14532D] text-white mr-2">
                        {chem.category}
                      </span>
                      <strong className="text-xs sm:text-sm font-extrabold text-[#17231B]">
                        Bahan Aktif: {chem.activeIngredient}
                      </strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-[#647067] uppercase block">
                        Contoh Merek Terdaftar Kementan
                      </span>
                      <strong className="text-[#14532D] font-extrabold mt-0.5 block">
                        {chem.registeredBrands}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#ECFDF5] border border-emerald-300">
                      <span className="text-[10px] font-bold text-[#14532D] uppercase block">
                        Takaran Praktis per Tangki 16 Liter
                      </span>
                      <strong className="text-[#15803D] font-extrabold mt-0.5 block tabular-nums">
                        {chem.dosagePer16LTank}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] font-bold text-[#647067] uppercase block">
                        Kebutuhan per Hektare / Bahu
                      </span>
                      <strong className="text-[#17231B] font-bold mt-0.5 block tabular-nums">
                        {chem.dosagePerArea}
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs text-[#4A634D] leading-relaxed">
                    <strong className="text-[#17231B]">Petunjuk Lapangan:</strong>{' '}
                    {chem.applicationNotes}
                  </p>
                </div>
              ))}
            </div>

            {/* Waktu Semprot Terbaik Berdasarkan Cuaca Hari Ini */}
            <div
              className={`rounded-xl p-3.5 border flex items-start gap-3 ${
                alert.bestSprayingWindowToday.statusLabel.includes('Kurang Kondusif')
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-sky-50 border-sky-200 text-sky-950'
              }`}
            >
              <Clock className="h-5 w-5 text-[#15803D] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-extrabold text-[#17231B]">
                    Waktu Semprot Terbaik Berdasarkan Cuaca Live Hari Ini:
                  </strong>
                  <span className="px-2 py-0.5 rounded bg-white font-extrabold text-[#14532D] border border-slate-200">
                    {alert.bestSprayingWindowToday.statusLabel}
                  </span>
                </div>
                <p className="font-bold text-[#15803D] tabular-nums">
                  Revisi Jam Semprot Ideal: {alert.bestSprayingWindowToday.recommendedHours}
                </p>
                <p className="text-[#4A634D] leading-relaxed">
                  {alert.bestSprayingWindowToday.weatherReasoning}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 6: Sticky Bottom Action Bar — Tombol Aksi Langsung di Dalam Popup */}
        <div className="px-5 py-4 sm:px-6 bg-[#F7FAF7] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#647067]">
            <ShieldCheck className="h-4 w-4 text-[#15803D] inline mr-1" />
            Gunakan APD lengkap (masker, sarung tangan, lengan panjang) saat menyemprot di sawah.
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleScheduleClick}
              data-testid="btn-modal-add-spray-agenda"
              className={`flex-1 sm:flex-initial h-11 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                addedToAgenda
                  ? 'bg-[#DCFCE7] text-[#14532D] border border-[#15803D]'
                  : 'bg-[#15803D] hover:bg-[#14532D] text-white shadow-sm'
              }`}
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span>
                {addedToAgenda
                  ? '✓ Berhasil Masuk ke Jadwal/Agenda Semprot'
                  : 'Masukkan ke Jadwal/Agenda Semprot'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCameraDiagnosis();
              }}
              data-testid="btn-modal-open-camera-ai"
              className="flex-1 sm:flex-initial h-11 px-4 rounded-xl bg-[#14532D] hover:bg-[#0F3F22] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Camera className="h-4 w-4 shrink-0" />
              <span>Buka Kamera AI untuk Cek Daun Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
