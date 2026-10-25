import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Edit3,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Trash2,
  Upload,
  User,
  WifiOff,
  X,
} from 'lucide-react';
import {
  CommodityType,
  EpidemiologyOptAlert,
  FarmPlot,
  PlantingSeasonMT,
  UserProfile,
  WeatherSnapshot,
} from '../types/agronomy';
import {
  DEFAULT_LARIKREJO_COORDS,
  detectUserCoordinatesWithFallback,
  reverseGeocodeLocationName,
} from '../services/liveWeatherService';
import { generateRealTimeEpidemiologyOptAlerts } from '../utils/epidemiologyOptEngine';
import { OptSolutionPopupModal } from './OptSolutionPopupModal';

interface ProfileAndOfflineViewProps {
  user: UserProfile;
  onUpdateUser: (updatedProfile: UserProfile) => void;
  plots: FarmPlot[];
  weather: WeatherSnapshot;
  isOfflineSimulated: boolean;
  onToggleOfflineSimulated: () => void;
  lastSyncedAt: string;
  onTriggerManualSync: () => void;
  onOpenAuthModal: () => void;
  onResetDemoData: () => void;
  onAddSprayAlertToAgenda: (alert: EpidemiologyOptAlert) => void;
  onOpenCameraDiagnosis: () => void;
}

/**
 * Mengompresi file gambar foto profil menjadi Base64 JPEG ringan (maks 256x256px)
 * agar tersimpan permanen di localStorage tanpa melampaui kuota.
 */
async function compressAvatarFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(String(reader.result || ''));
      img.src = String(reader.result || '');
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const ProfileAndOfflineView: React.FC<ProfileAndOfflineViewProps> = ({
  user,
  onUpdateUser,
  plots,
  weather,
  isOfflineSimulated,
  onToggleOfflineSimulated,
  lastSyncedAt,
  onTriggerManualSync,
  onOpenAuthModal,
  onResetDemoData,
  onAddSprayAlertToAgenda,
  onOpenCameraDiagnosis,
}) => {
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<'all' | 'privacy'>('all');
  const [profileSavedBanner, setProfileSavedBanner] = useState<string | null>(null);
  const [selectedOptAlert, setSelectedOptAlert] = useState<EpidemiologyOptAlert | null>(null);

  // Form states for Full Farmer Account & Profile CRUD
  const [fullName, setFullName] = useState(user.name || 'Budi Santoso');
  const [role, setRole] = useState(user.role || 'Petani Padi & Palawija');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState(
    user.phoneWhatsapp || user.emailOrPhone || '0812-2845-9910'
  );
  const [email, setEmail] = useState(user.email || 'budi.santoso.tani@gmail.com');
  const [avatarDataUrl, setAvatarDataUrl] = useState(user.avatarDataUrl || '');

  const [villageName, setVillageName] = useState(user.villageName || 'Desa Larikrejo');
  const [districtName, setDistrictName] = useState(user.districtName || 'Kec. Undaan');
  const [regencyName, setRegencyName] = useState(user.regencyName || 'Kab. Kudus');
  const [provinceName, setProvinceName] = useState(user.provinceName || 'Jawa Tengah');
  const [latitude, setLatitude] = useState<string>(
    String(user.latitude ?? DEFAULT_LARIKREJO_COORDS.latitude)
  );
  const [longitude, setLongitude] = useState<string>(
    String(user.longitude ?? DEFAULT_LARIKREJO_COORDS.longitude)
  );
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  const [poktanName, setPoktanName] = useState(
    user.poktanName || 'Poktan Sido Makmur Larikrejo'
  );
  const [kartuTaniNumber, setKartuTaniNumber] = useState(
    user.kartuTaniNumber || '3319-0320-0701-8842'
  );
  const [mainCommodity, setMainCommodity] = useState<CommodityType>(
    user.mainCommodity || 'Padi'
  );
  const [irrigationSystem, setIrrigationSystem] = useState<
    'Teknis' | 'Setengah Teknis' | 'Tadah Hujan'
  >(user.irrigationSystem || 'Teknis');
  const [plantingSeasonMT, setPlantingSeasonMT] = useState<PlantingSeasonMT>(
    user.plantingSeasonMT || 'MT2 Gadu / Peralihan (Mar–Jun)'
  );
  const [privacyConsent, setPrivacyConsent] = useState<boolean>(
    user.privacyConsentAccepted ?? true
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openAccountSettings = (mode: 'all' | 'privacy' = 'all') => {
    setFullName(user.name || 'Budi Santoso');
    setRole(user.role || 'Petani Padi & Palawija');
    setPhoneWhatsapp(user.phoneWhatsapp || user.emailOrPhone || '0812-2845-9910');
    setEmail(user.email || 'budi.santoso.tani@gmail.com');
    setAvatarDataUrl(user.avatarDataUrl || '');
    setVillageName(user.villageName || 'Desa Larikrejo');
    setDistrictName(user.districtName || 'Kec. Undaan');
    setRegencyName(user.regencyName || 'Kab. Kudus');
    setProvinceName(user.provinceName || 'Jawa Tengah');
    setLatitude(String(user.latitude ?? DEFAULT_LARIKREJO_COORDS.latitude));
    setLongitude(String(user.longitude ?? DEFAULT_LARIKREJO_COORDS.longitude));
    setPoktanName(user.poktanName || 'Poktan Sido Makmur Larikrejo');
    setKartuTaniNumber(user.kartuTaniNumber || '3319-0320-0701-8842');
    setMainCommodity(user.mainCommodity || 'Padi');
    setIrrigationSystem(user.irrigationSystem || 'Teknis');
    setPlantingSeasonMT(user.plantingSeasonMT || 'MT2 Gadu / Peralihan (Mar–Jun)');
    setPrivacyConsent(user.privacyConsentAccepted ?? true);
    setGpsStatusMsg(null);
    setActiveSettingsSection(mode);
    setShowProfileSettingsModal(true);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarFileToBase64(file);
      setAvatarDataUrl(compressed);
    } catch {
      // Fallback ignore
    }
  };

  const handleDetectGpsCoordinates = async () => {
    setIsDetectingGps(true);
    setGpsStatusMsg('Mendeteksi titik koordinat GPS perangkat...');
    try {
      const detected = await detectUserCoordinatesWithFallback(5000);
      setLatitude(String(Number(detected.latitude.toFixed(5))));
      setLongitude(String(Number(detected.longitude.toFixed(5))));

      const geocodedName = await reverseGeocodeLocationName(
        detected.latitude,
        detected.longitude
      );
      if (geocodedName) {
        const parts = geocodedName.split(',').map((s) => s.trim());
        if (parts[0]) setVillageName(parts[0]);
        if (parts[1]) setDistrictName(parts[1]);
        if (parts[2]) setRegencyName(parts[2]);
        if (parts[3]) setProvinceName(parts[3]);
      }
      setGpsStatusMsg(
        `Koordinat berhasil diperbarui (${detected.latitude.toFixed(4)}, ${detected.longitude.toFixed(4)}) — ${detected.locationSource}`
      );
    } catch {
      setLatitude(String(DEFAULT_LARIKREJO_COORDS.latitude));
      setLongitude(String(DEFAULT_LARIKREJO_COORDS.longitude));
      setGpsStatusMsg('Menggunakan titik koordinat presisi Desa Larikrejo (-6.899, 110.802).');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSaveProfileSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim() || 'Budi Santoso';
    const cleanVillage = villageName.trim() || 'Desa Larikrejo';
    const cleanDistrict = districtName.trim() || 'Kec. Undaan';
    const cleanRegency = regencyName.trim() || 'Kab. Kudus';
    const cleanProvince = provinceName.trim() || 'Jawa Tengah';
    const formattedVillageLine = `${cleanVillage}, ${cleanDistrict}, ${cleanRegency}`;

    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);
    const safeLat = Number.isFinite(parsedLat) ? parsedLat : DEFAULT_LARIKREJO_COORDS.latitude;
    const safeLon = Number.isFinite(parsedLon) ? parsedLon : DEFAULT_LARIKREJO_COORDS.longitude;

    const updatedUser: UserProfile = {
      ...user,
      name: cleanName,
      role: role.trim() || 'Petani Padi & Palawija',
      village: formattedVillageLine,
      emailOrPhone: phoneWhatsapp.trim() || email.trim() || '0812-2845-9910',
      avatarDataUrl,
      phoneWhatsapp: phoneWhatsapp.trim() || '0812-2845-9910',
      email: email.trim() || 'budi.santoso.tani@gmail.com',
      villageName: cleanVillage,
      districtName: cleanDistrict,
      regencyName: cleanRegency,
      provinceName: cleanProvince,
      latitude: safeLat,
      longitude: safeLon,
      poktanName: poktanName.trim() || 'Poktan Sido Makmur Larikrejo',
      kartuTaniNumber: kartuTaniNumber.trim(),
      mainCommodity,
      irrigationSystem,
      plantingSeasonMT,
      privacyConsentAccepted: privacyConsent,
      updatedAt: new Date().toISOString(),
    };

    onUpdateUser(updatedUser);
    setShowProfileSettingsModal(false);
    setProfileSavedBanner(
      `Profil ${cleanName} (${formattedVillageLine}) & preferensi Poktan berhasil disimpan permanen.`
    );
    setTimeout(() => setProfileSavedBanner(null), 5000);
  };

  const totalAreaHa = Number(plots.reduce((acc, p) => acc + p.areaHa, 0).toFixed(1));
  const uniqueCommodities = new Set([
    ...plots.map((p) => p.commodity),
    user.mainCommodity || 'Padi',
  ]).size;

  const userInitials =
    user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'BS';

  // Real-time epidemiological OPT alerts synchronized with weather & farmer's season/commodity
  const optAlerts = useMemo(() => {
    return generateRealTimeEpidemiologyOptAlerts({
      weather,
      plots,
      plantingSeasonMT: user.plantingSeasonMT,
      mainCommodity: user.mainCommodity,
    });
  }, [weather, plots, user.plantingSeasonMT, user.mainCommodity]);

  return (
    <div className="space-y-6">
      {profileSavedBanner && (
        <div
          data-testid="profile-saved-banner"
          className="rounded-2xl bg-[#DCFCE7] border border-[#15803D] px-4 py-3 text-xs sm:text-sm font-bold text-[#14532D] flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
            <span>{profileSavedBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setProfileSavedBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Screen 15 (Profil Petani Lengkap) + Screen 16 (Mode Offline Aktif) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Screen 15: Profil Card */}
          <div className="rounded-2xl bg-white p-6 border border-slate-200 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {user.avatarDataUrl ? (
                  <img
                    src={user.avatarDataUrl}
                    alt={`Foto profil ${user.name}`}
                    data-testid="profile-avatar-img"
                    className="h-16 w-16 rounded-full object-cover border-2 border-[#15803D] shrink-0"
                  />
                ) : (
                  <div
                    data-testid="profile-avatar-initials"
                    className="h-16 w-16 rounded-full bg-[#DCFCE7] border-2 border-[#15803D] flex items-center justify-center text-[#14532D] font-bold text-xl shrink-0"
                  >
                    {userInitials}
                  </div>
                )}
                <div>
                  <h1
                    className="text-xl font-bold text-[#17231B]"
                    data-testid="profile-card-name"
                  >
                    {user.name}
                  </h1>
                  <p className="text-xs text-[#647067] tabular-nums">
                    WA: {user.phoneWhatsapp || user.emailOrPhone}{' '}
                    {user.email ? `· ${user.email}` : ''}
                  </p>
                  <p className="text-xs font-medium text-[#15803D] mt-0.5">
                    {user.role} · {user.village}
                  </p>
                  {user.poktanName && (
                    <p className="text-[11px] font-semibold text-[#14532D] mt-0.5">
                      {user.poktanName} · Komoditas Utama: {user.mainCommodity || 'Padi'} (Irigasi{' '}
                      {user.irrigationSystem || 'Teknis'})
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => openAccountSettings('all')}
                data-testid="btn-open-account-settings"
                className="px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Ubah Akun</span>
              </button>
            </div>

            {/* Stats Row (Lahan, Total Luas, Komoditas) */}
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
                  {Math.max(uniqueCommodities, 3)}
                </strong>
                <span className="text-xs text-[#647067]">Komoditas</span>
              </div>
            </div>

            {/* Summary Details of Farmer Group & Address */}
            <div className="rounded-xl bg-[#F7FAF7] border border-slate-200 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#14532D] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#15803D]" />
                  {user.poktanName || 'Poktan Sido Makmur Larikrejo'}
                </span>
                <span className="text-[11px] font-semibold text-[#15803D]">
                  {user.plantingSeasonMT || 'MT2 Gadu / Peralihan (Mar–Jun)'}
                </span>
              </div>
              <p className="text-[#4A634D] tabular-nums">
                Lokasi Lahan Utama: {user.villageName || 'Desa Larikrejo'},{' '}
                {user.districtName || 'Kec. Undaan'}, {user.regencyName || 'Kab. Kudus'},{' '}
                {user.provinceName || 'Jawa Tengah'} (
                {(user.latitude ?? DEFAULT_LARIKREJO_COORDS.latitude).toFixed(3)},{' '}
                {(user.longitude ?? DEFAULT_LARIKREJO_COORDS.longitude).toFixed(3)})
              </p>
              {user.kartuTaniNumber && (
                <p className="text-[11px] text-[#647067] tabular-nums">
                  No. Registrasi / Kartu Tani: <strong>{user.kartuTaniNumber}</strong>
                </p>
              )}
            </div>

            {/* Interactive Menu List matching Screen 15 */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => openAccountSettings('all')}
                data-testid="btn-menu-personal-poktan"
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAF7] hover:bg-[#DCFCE7]/50 border border-transparent hover:border-[#15803D]/30 text-xs transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 font-semibold text-[#17231B]">
                  <User className="h-4 w-4 text-[#15803D]" />
                  <span>Data Pribadi & Kelompok Tani (Klik untuk Edit)</span>
                </div>
                <span className="text-[#15803D] font-bold flex items-center gap-1">
                  Terverifikasi <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => openAccountSettings('privacy')}
                data-testid="btn-menu-account-privacy"
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[#F7FAF7] hover:bg-[#DCFCE7]/50 border border-transparent hover:border-[#15803D]/30 text-xs transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 font-semibold text-[#17231B]">
                  <ShieldCheck className="h-4 w-4 text-[#15803D]" />
                  <span>Akun, Keamanan & Persetujuan Privasi Foto</span>
                </div>
                <span className="text-[#15803D] font-semibold flex items-center gap-1">
                  {user.privacyConsentAccepted ? 'Aktif' : 'Perlu Persetujuan'}{' '}
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </button>

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
              Catatan: Saat perangkat offline, perubahan profil petani, foto avatar, jadwal, dan pencatatan biaya disimpan di penyimpanan lokal perangkat dan disinkronkan saat koneksi kembali.
            </p>
          </div>
        </div>

        {/* Right Column: Screen 14 — Pusat Notifikasi & Peringatan Dini OPT Berbasis Cuaca Live */}
        <div className="lg:col-span-6 rounded-2xl bg-white p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[#17231B]">
                Notifikasi & Peringatan Dini OPT Lapangan
              </h2>
              <p className="text-xs text-[#647067]">
                Prediksi risiko hama & penyakit real-time berdasarkan cuaca live ({weather.tempC}°C,
                kelembapan {weather.humidityPct}%) & musim tanam lokal — Klik untuk solusi lengkap
              </p>
            </div>
            <Bell className="h-5 w-5 text-[#15803D] shrink-0" />
          </div>

          {/* Dynamic Epidemiological OPT Early Warning Cards */}
          <div className="space-y-3">
            {optAlerts.map((alert) => {
              const isHigh = alert.riskLevel === 'Tinggi / Siaga';
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedOptAlert(alert)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedOptAlert(alert);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isHigh
                      ? 'bg-red-50/70 border-red-200 hover:border-red-400'
                      : 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                          isHigh
                            ? 'bg-red-100 text-[#DC2626]'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isHigh
                                ? 'bg-[#DC2626] text-white'
                                : 'bg-amber-600 text-white'
                            }`}
                          >
                            Risiko {alert.riskLevel} ({alert.riskScorePct}%)
                          </span>
                          <span className="text-[10px] font-bold text-[#14532D] bg-white px-2 py-0.5 rounded border border-slate-200">
                            {alert.targetCommodity}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-[#17231B] mt-1">
                          {alert.optName}
                        </h3>
                        <p className="text-[11px] text-[#4A634D] mt-0.5">
                          {alert.weatherTriggerHeadline}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#17231B] line-clamp-2 leading-relaxed">
                    {alert.whyItThreatensNow}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-[#15803D]">
                      Waktu Semprot: {alert.bestSprayingWindowToday.recommendedHours}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOptAlert(alert);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Lihat Solusi Lengkap & Cara Mengatasi →
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Standard Field Schedule & Weather Notifications */}
            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#F7FAF7] border border-slate-200">
              <div className="h-10 w-10 rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17231B]">Jadwal Pemupukan & Pengamatan</h3>
                <p className="text-xs text-[#647067] mt-0.5">
                  Pukul 06:30 WIB di Lahan 1 — Cek Bagan Warna Daun (BWD) sebelum pemupukan susulan
                  dan pastikan kondisi cuaca ({weather.sprayingAdvisory.status}).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
              <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                <CloudRain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-sky-900">
                  Status Cuaca Live ({weather.locationName})
                </h3>
                <p className="text-xs text-[#647067] mt-0.5">
                  {weather.sprayingAdvisory.recommendation}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL PENGATURAN AKUN & PROFIL PETANI LENGKAP (FULL CRUD & AVATAR UPLOAD)
         ===================================================================== */}
      {showProfileSettingsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Pengaturan Akun & Profil Petani Lengkap"
          data-testid="account-profile-settings-modal"
        >
          <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-6 bg-[#14532D] text-white flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold">
                  Pengaturan Akun, Profil Petani & Lokasi Lahan Utama
                </h2>
                <p className="text-xs text-[#DCFCE7]/90">
                  Perubahan foto profil, nama, alamat GPS, dan Poktan langsung tersimpan ke perangkat & memperbarui sapaan Beranda serta Cuaca
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileSettingsModal(false)}
                aria-label="Tutup modal pengaturan akun"
                className="h-9 w-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={handleSaveProfileSettings}
              className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm"
            >
              {/* 1. FOTO PROFIL (AVATAR UPLOAD & PREVIEW) */}
              <div className="rounded-2xl bg-[#F7FAF7] border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {avatarDataUrl ? (
                    <img
                      src={avatarDataUrl}
                      alt="Pratinjau foto profil"
                      data-testid="modal-avatar-preview-img"
                      className="h-18 w-18 rounded-full object-cover border-2 border-[#15803D] shrink-0"
                    />
                  ) : (
                    <div className="h-18 w-18 rounded-full bg-[#DCFCE7] border-2 border-[#15803D] flex items-center justify-center text-[#14532D] font-extrabold text-2xl shrink-0">
                      {(fullName || 'BS')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0]?.toUpperCase())
                        .join('')}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-extrabold text-[#17231B]">
                      Foto Profil Petani (Avatar)
                    </h3>
                    <p className="text-xs text-[#647067] mt-0.5">
                      Unggah foto dari galeri/kamera perangkat. Otomatis dikompresi ke Base64 agar hemat memori lokal.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    data-testid="input-upload-avatar-file"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 px-3.5 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Ganti Foto</span>
                  </button>
                  {avatarDataUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarDataUrl('')}
                      data-testid="btn-remove-avatar"
                      className="h-10 px-3.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-[#DC2626] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. DATA DIRI & KONTAK PETANI */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-extrabold text-[#14532D] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#15803D]" />
                  <span>1. Data Diri & Kontak Petani</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="prof-fullname"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Nama Lengkap Petani *
                    </label>
                    <input
                      id="prof-fullname"
                      data-testid="input-profile-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: H. Budi Santoso"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-role"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Peran / Profesi *
                    </label>
                    <select
                      id="prof-role"
                      data-testid="select-profile-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#17231B]"
                    >
                      <option value="Petani Padi & Palawija">Petani Padi & Palawija</option>
                      <option value="Petani Padi">Petani Padi Sawah</option>
                      <option value="Ketua Kelompok Tani (Poktan)">
                        Ketua Kelompok Tani (Poktan)
                      </option>
                      <option value="Pengurus Gapoktan / P3A Dharma Tirta">
                        Pengurus Gapoktan / P3A Dharma Tirta
                      </option>
                      <option value="Penyuluh Pertanian Swadaya (PPS)">
                        Penyuluh Pertanian Swadaya (PPS)
                      </option>
                      <option value="Petani Hortikultura & Cabai">
                        Petani Hortikultura & Cabai
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prof-whatsapp"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Nomor Telepon / WhatsApp Aktif (+62 / 08xx) *
                    </label>
                    <div className="relative">
                      <input
                        id="prof-whatsapp"
                        data-testid="input-profile-whatsapp"
                        type="tel"
                        required
                        value={phoneWhatsapp}
                        onChange={(e) => setPhoneWhatsapp(e.target.value)}
                        placeholder="0812-2845-9910 atau +6281228459910"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B] tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="prof-email"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Alamat Email (Opsional)
                    </label>
                    <input
                      id="prof-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="budi.santoso.tani@gmail.com"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B]"
                    />
                  </div>
                </div>
              </div>

              {/* 3. ALAMAT & LOKASI LAHAN UTAMA (TERINTEGRASI CUACA & KALENDER TANAM) */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[#14532D] flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#15803D]" />
                    <span>2. Alamat & Lokasi Lahan Utama (Terintegrasi Cuaca Live)</span>
                  </h3>

                  <button
                    type="button"
                    onClick={handleDetectGpsCoordinates}
                    disabled={isDetectingGps}
                    data-testid="btn-profile-detect-gps"
                    className="h-9 px-3 rounded-xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#15803D]/30 text-[#14532D] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Navigation
                      className={`h-3.5 w-3.5 text-[#15803D] ${
                        isDetectingGps ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      {isDetectingGps
                        ? 'Mendeteksi GPS...'
                        : 'Ambil Titik Koordinat Lokasi Saya (GPS)'}
                    </span>
                  </button>
                </div>

                {gpsStatusMsg && (
                  <p className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] px-3 py-2 rounded-xl border border-emerald-200">
                    {gpsStatusMsg}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="prof-village"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Desa / Kelurahan *
                    </label>
                    <input
                      id="prof-village"
                      data-testid="input-profile-village"
                      type="text"
                      required
                      value={villageName}
                      onChange={(e) => setVillageName(e.target.value)}
                      placeholder="Desa Larikrejo"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-district"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Kecamatan *
                    </label>
                    <input
                      id="prof-district"
                      data-testid="input-profile-district"
                      type="text"
                      required
                      value={districtName}
                      onChange={(e) => setDistrictName(e.target.value)}
                      placeholder="Kec. Undaan"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-regency"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Kabupaten / Kota *
                    </label>
                    <input
                      id="prof-regency"
                      data-testid="input-profile-regency"
                      type="text"
                      required
                      value={regencyName}
                      onChange={(e) => setRegencyName(e.target.value)}
                      placeholder="Kab. Kudus"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-province"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Provinsi *
                    </label>
                    <input
                      id="prof-province"
                      type="text"
                      required
                      value={provinceName}
                      onChange={(e) => setProvinceName(e.target.value)}
                      placeholder="Jawa Tengah"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-lat"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Titik Koordinat Latitude (Garis Lintang)
                    </label>
                    <input
                      id="prof-lat"
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B] tabular-nums"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-lon"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Titik Koordinat Longitude (Garis Bujur)
                    </label>
                    <input
                      id="prof-lon"
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B] tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* 4. DATA KELOMPOK TANI (POKTAN) & PREFERENSI BUDIDAYA */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
                <h3 className="text-sm font-extrabold text-[#14532D] flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-[#15803D]" />
                  <span>3. Data Kelompok Tani (Poktan) & Preferensi Budidaya</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="prof-poktan"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Nama Kelompok Tani (Poktan / Gapoktan) *
                    </label>
                    <input
                      id="prof-poktan"
                      data-testid="input-profile-poktan"
                      type="text"
                      required
                      value={poktanName}
                      onChange={(e) => setPoktanName(e.target.value)}
                      placeholder="Contoh: Poktan Sido Makmur Larikrejo"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-kartutani"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Nomor Registrasi / Kartu Tani (Opsional)
                    </label>
                    <input
                      id="prof-kartutani"
                      type="text"
                      value={kartuTaniNumber}
                      onChange={(e) => setKartuTaniNumber(e.target.value)}
                      placeholder="Contoh: 3319-0320-0701-8842"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#17231B] tabular-nums"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-commodity"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Komoditas Utama Budidaya
                    </label>
                    <select
                      id="prof-commodity"
                      data-testid="select-profile-commodity"
                      value={mainCommodity}
                      onChange={(e) => setMainCommodity(e.target.value as CommodityType)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#17231B]"
                    >
                      <option value="Padi">Padi</option>
                      <option value="Kacang Hijau">Kacang Hijau</option>
                      <option value="Cabai">Cabai</option>
                      <option value="Jagung">Jagung</option>
                      <option value="Bawang Merah">Bawang Merah</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prof-irrigation"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Sistem Irigasi Lahan Utama
                    </label>
                    <select
                      id="prof-irrigation"
                      data-testid="select-profile-irrigation"
                      value={irrigationSystem}
                      onChange={(e) =>
                        setIrrigationSystem(
                          e.target.value as 'Teknis' | 'Setengah Teknis' | 'Tadah Hujan'
                        )
                      }
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#17231B]"
                    >
                      <option value="Teknis">Irigasi Teknis</option>
                      <option value="Setengah Teknis">Irigasi Setengah Teknis</option>
                      <option value="Tadah Hujan">Tadah Hujan</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="prof-season-mt"
                      className="block text-xs font-bold text-[#17231B] mb-1"
                    >
                      Kalender Musim Tanam Lokal Saat Ini (MT1 / MT2 / MT3)
                    </label>
                    <select
                      id="prof-season-mt"
                      value={plantingSeasonMT}
                      onChange={(e) => setPlantingSeasonMT(e.target.value as PlantingSeasonMT)}
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-[#17231B]"
                    >
                      <option value="MT1 Penghujan (Nov–Feb)">
                        MT1 Penghujan (Nov–Feb) — Fokus Padi Sawah & Drainase
                      </option>
                      <option value="MT2 Gadu / Peralihan (Mar–Jun)">
                        MT2 Gadu / Peralihan (Mar–Jun) — Fokus Padi Walik Jerami & Pengairan Berselang
                      </option>
                      <option value="MT3 Kemarau / Palawija (Jul–Okt)">
                        MT3 Kemarau / Palawija (Jul–Okt) — Fokus Kacang Hijau, Jagung & Hortikultura
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 5. KEAMANAN & PERSETUJUAN PRIVASI FOTO */}
              <div
                className={`rounded-2xl p-4 border space-y-2 ${
                  activeSettingsSection === 'privacy'
                    ? 'bg-[#ECFDF5] border-[#15803D]'
                    : 'bg-[#F7FAF7] border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#14532D]">
                  <ShieldCheck className="h-4 w-4 text-[#15803D]" />
                  <span>4. Keamanan Akun & Persetujuan Privasi Foto Kamera AI</span>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={privacyConsent}
                    onChange={(e) => setPrivacyConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded accent-[#15803D]"
                  />
                  <span className="text-xs text-[#4A634D] leading-relaxed">
                    Saya menyetujui penggunaan foto daun/tanaman yang diunggah pada fitur Kamera AI semata-mata untuk keperluan diagnosis fitopatologi dan rekomendasi pengendalian hama terpadu (PHT) secara aman.
                  </span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowProfileSettingsModal(false)}
                  className="h-11 px-4 rounded-xl border border-slate-200 text-xs font-bold text-[#647067] hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  data-testid="btn-save-profile-settings"
                  className="h-11 px-5 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-extrabold cursor-pointer shadow-sm"
                >
                  Simpan Perubahan Profil & Sinkronkan Lokasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup Solusi Komprehensif OPT */}
      <OptSolutionPopupModal
        alert={selectedOptAlert}
        weather={weather}
        onClose={() => setSelectedOptAlert(null)}
        onAddSprayToAgenda={onAddSprayAlertToAgenda}
        onOpenCameraDiagnosis={onOpenCameraDiagnosis}
      />
    </div>
  );
};
