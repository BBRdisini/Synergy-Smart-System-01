import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { TaniCerdasLogo } from './VisualAssets';
import { UserProfile } from '../types/agronomy';

interface SplashAndAuthModalProps {
  mode: 'splash' | 'login' | 'register' | null;
  onClose: () => void;
  onSelectMode: (mode: 'splash' | 'login' | 'register' | null) => void;
  onLoginSuccess: (profile: UserProfile) => void;
}

export const SplashAndAuthModal: React.FC<SplashAndAuthModalProps> = ({
  mode,
  onClose,
  onSelectMode,
  onLoginSuccess,
}) => {
  const [name, setName] = useState('Budi Santoso');
  const [village, setVillage] = useState('Desa Larikrejo, Undaan, Kudus');
  const [emailOrPhone, setEmailOrPhone] = useState('budi@email.com');
  const [password, setPassword] = useState('petani123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!mode) return null;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!emailOrPhone.trim() || emailOrPhone.trim().length < 4) {
      setErrorMessage('Mohon masukkan Nomor HP atau alamat Email yang valid.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Password minimal terdiri dari 4 karakter.');
      return;
    }
    if (!privacyAccepted) {
      setErrorMessage('Anda wajib menyetujui Syarat & Ketentuan serta Kebijakan Privasi.');
      return;
    }

    onLoginSuccess({
      id: `usr-${Date.now()}`,
      name: mode === 'register' && name.trim() ? name.trim() : 'Budi Santoso',
      role: 'Petani Padi',
      village: village.trim() || 'Desa Larikrejo, Undaan, Kudus',
      emailOrPhone: emailOrPhone.trim(),
      isLoggedIn: true,
      privacyConsentAccepted: true,
    });
    onClose();
  };

  // Screen 1: Splash Screen (Sesuai Layar 1 Papan Presentasi UI TaniCerdas AI)
  if (mode === 'splash') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Splash Screen TaniCerdas AI"
      >
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-[#14532D] text-white shadow-2xl border border-white/15">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Splash Screen"
            className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Scenic Indonesian Terraced Rice Field SVG Illustration */}
          <div className="relative h-96 w-full overflow-hidden bg-gradient-to-b from-[#0C4A6E] via-[#15803D] to-[#14532D]">
            <svg
              viewBox="0 0 400 400"
              className="absolute inset-0 h-full w-full object-cover"
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" />
                  <stop offset="55%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#FEF08A" />
                </linearGradient>
              </defs>
              <rect width="400" height="240" fill="url(#skyGrad)" />
              {/* Golden sunrise */}
              <circle cx="280" cy="175" r="42" fill="#FDE047" opacity="0.85" />
              {/* Distant mountains */}
              <path d="M0 210 L95 140 L195 205 L310 125 L400 190 L400 250 L0 250 Z" fill="#0F766E" opacity="0.65" />
              {/* Lush green rice terraces */}
              <path d="M0 230 Q140 200 260 235 T400 220 L400 400 L0 400 Z" fill="#16A34A" />
              <path d="M0 265 Q170 240 310 270 T400 260 L400 400 L0 400 Z" fill="#15803D" />
              <path d="M0 305 Q120 285 280 315 T400 300 L400 400 L0 400 Z" fill="#14532D" />
              {/* Farmer silhouette with caping & smartphone */}
              <g transform="translate(225, 225)">
                {/* Caping hat */}
                <path d="M5 24 L42 4 L79 24 Z" fill="#B45309" stroke="#FDE68A" strokeWidth="1.5" />
                {/* Head & torso */}
                <circle cx="42" cy="30" r="9" fill="#78350F" />
                <path d="M24 44 C26 38 58 38 60 44 L66 95 L18 95 Z" fill="#0F172A" />
                {/* Smartphone in hand with glowing screen */}
                <rect x="2" y="48" width="12" height="20" rx="2" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
              </g>
            </svg>

            <div className="absolute inset-0 bg-gradient-to-t from-[#14532D] via-[#14532D]/40 to-transparent" />

            {/* Top Brand Identity */}
            <div className="relative z-10 flex flex-col items-center pt-10 px-6 text-center">
              <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
                <TaniCerdasLogo className="h-16 w-16" light />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white">TaniCerdas AI</h2>
              <p className="mt-1 text-sm font-medium text-[#DCFCE7]">
                Sahabat Petani, Panen Maksimal
              </p>
            </div>
          </div>

          {/* Bottom Call to Action */}
          <div className="px-6 pb-7 pt-2 text-center bg-[#14532D]">
            <p className="text-base font-medium text-white/95 leading-snug">
              Teknologi, Data dan AI untuk Pertanian Indonesia yang Lebih Maju
            </p>
            <p className="mt-2 text-xs text-[#DCFCE7]/80">
              Diagnosis penyakit padi via Kamera AI, perencanaan budidaya 8 fase, kalender tanam, dan laporan usaha tani.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => onSelectMode('login')}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#15803D] hover:bg-[#16A34A] px-5 text-sm font-semibold text-white shadow-lg transition-colors cursor-pointer"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 px-4 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                Langsung ke Dashboard (Tanpa Login / Mode Publik)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Login / Daftar (Sesuai Layar 2 Papan Presentasi UI TaniCerdas AI)
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Masuk atau Daftar Akun TaniCerdas AI"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-emerald-900/10 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup jendela login"
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <TaniCerdasLogo className="h-14 w-14" />
          <h2 className="mt-2 text-2xl font-bold text-[#14532D]">TaniCerdas AI</h2>
          <p className="mt-1 text-sm text-[#647067]">
            {mode === 'login' ? 'Masuk untuk melanjutkan pengelolaan lahan' : 'Daftar akun petani atau penyuluh baru'}
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-[#DC2626]">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="mt-5 space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Nama Lengkap Petani / Penyuluh
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-[#647067] absolute left-3.5 top-3.5" />
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-[#17231B] focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="auth-village" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Desa & Kabupaten Lahan
                </label>
                <input
                  id="auth-village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Contoh: Desa Larikrejo, Kudus"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm text-[#17231B] focus:outline-none focus:border-[#15803D]"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#17231B] mb-1">
              Nomor HP atau Email
            </label>
            <div className="relative">
              <Phone className="h-4 w-4 text-[#647067] absolute left-3.5 top-3.5" />
              <input
                id="auth-email"
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Nomor HP atau Email"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm text-[#17231B] focus:outline-none focus:border-[#15803D]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-[#17231B] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 text-[#647067] absolute left-3.5 top-3.5" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 text-sm text-[#17231B] focus:outline-none focus:border-[#15803D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-2.5 top-2 h-7 w-7 flex items-center justify-center text-[#647067] hover:text-[#17231B]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#17231B] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-[#15803D]"
              />
              <span>Ingat saya</span>
            </label>
            <button
              type="button"
              onClick={() =>
                setErrorMessage('Tautan pemulihan akun akan dikirimkan ke nomor HP/Email terdaftar.')
              }
              className="font-medium text-[#15803D] hover:underline"
            >
              Lupa password?
            </button>
          </div>

          <label className="flex items-start gap-2 rounded-xl bg-[#F7FAF7] p-3 text-xs text-[#647067] border border-emerald-900/10 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded accent-[#15803D]"
            />
            <span>
              Dengan melanjutkan, saya menyetujui <strong className="text-[#15803D]">Syarat & Ketentuan</strong> dan{' '}
              <strong className="text-[#15803D]">Kebijakan Privasi</strong> perlindungan data lahan petani.
            </span>
          </label>

          <button
            type="submit"
            className="w-full h-12 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white font-semibold text-sm shadow-md transition-colors cursor-pointer"
          >
            {mode === 'login' ? 'Masuk' : 'Simpan & Daftar Akun'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-[#647067]">atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => onSelectMode(mode === 'login' ? 'register' : 'login')}
          className="w-full h-11 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#17231B] font-semibold text-sm transition-colors cursor-pointer"
        >
          {mode === 'login' ? 'Daftar Akun Baru' : 'Sudah Punya Akun? Masuk'}
        </button>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#DCFCE7]/50 px-3 py-2 text-[11px] text-[#14532D]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#15803D]" />
          <span>Data lahan & riwayat budidaya Anda tersimpan aman dan mendukung akses Mode Offline.</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Modal untuk melihat Papan Presentasi UI TaniCerdas AI asli yang diunggah pengguna sebagai referensi.
 */
export const PresentationBoardModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Referensi Papan Presentasi UI TaniCerdas AI"
    >
      <div className="relative w-full max-w-5xl rounded-2xl bg-white p-4 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#15803D]" />
            <h3 className="text-base font-bold text-[#17231B]">
              Papan Presentasi UI TaniCerdas AI (18 Layar Referensi Desain)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Papan Presentasi"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-3 overflow-y-auto flex-1 rounded-xl bg-slate-900 p-2">
          <img
            src="/assets/aistudio/Papan_Presentasi_UI_TaniCerdas_AI_95187bb1.png"
            alt="Papan Presentasi UI TaniCerdas AI — 18 Layar Aplikasi"
            referrerPolicy="no-referrer"
            className="w-full h-auto rounded-lg object-contain"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#647067]">
          <span>
            Seluruh 18 layar pada papan presentasi (Splash, Login, Beranda, Lahan, Kamera AI, Diagnosis Blas, Detail Score 250 EC & Antracol 70 WP, Kalender, Cuaca & pH Tanah, Panduan, Katalog Hama, Catatan Lahan, Notifikasi, Profil, dan Mode Offline) telah diimplementasikan secara interaktif.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#15803D] text-white font-semibold hover:bg-[#14532D]"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
