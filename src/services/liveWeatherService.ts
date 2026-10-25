import {
  WeatherConditionLabel,
  WeatherForecastDay,
  WeatherHourlyPoint,
  WeatherSnapshot,
} from '../types/agronomy';

export const DEFAULT_LARIKREJO_COORDS = {
  latitude: -6.899,
  longitude: 110.802,
  bmkgAdm4Code: '33.19.03.2007',
  locationName: 'Desa Larikrejo, Kec. Undaan, Kab. Kudus, Jawa Tengah',
};

export interface BmkgAdminRegionPreset {
  id: string;
  label: string;
  adm4Code: string;
  bmkgAdm4Code: string;
  latitude: number;
  longitude: number;
}

export const BMKG_ADMIN_REGION_PRESETS: BmkgAdminRegionPreset[] = [
  {
    id: 'kudus-larikrejo',
    label: 'Desa Larikrejo, Kec. Undaan, Kab. Kudus',
    adm4Code: '33.19.03.2007',
    bmkgAdm4Code: '33.19.03.2007',
    latitude: -6.899,
    longitude: 110.802,
  },
  {
    id: 'kudus-wates',
    label: 'Desa Wates, Kec. Undaan, Kab. Kudus',
    adm4Code: '33.19.03.2009',
    bmkgAdm4Code: '33.19.03.2009',
    latitude: -6.885,
    longitude: 110.812,
  },
  {
    id: 'demak-gajah',
    label: 'Kec. Gajah, Kab. Demak, Jawa Tengah',
    adm4Code: '33.21.07.2001',
    bmkgAdm4Code: '33.21.07.2001',
    latitude: -6.872,
    longitude: 110.732,
  },
  {
    id: 'pati-sukolilo',
    label: 'Kec. Sukolilo, Kab. Pati, Jawa Tengah',
    adm4Code: '33.18.01.2001',
    bmkgAdm4Code: '33.18.01.2001',
    latitude: -6.924,
    longitude: 110.896,
  },
  {
    id: 'grobogan-purwodadi',
    label: 'Kec. Purwodadi, Kab. Grobogan, Jawa Tengah',
    adm4Code: '33.15.13.1001',
    bmkgAdm4Code: '33.15.13.1001',
    latitude: -7.086,
    longitude: 110.916,
  },
];

/**
 * Menerjemahkan kode cuaca standar WMO (0-99) ke dalam Bahasa Indonesia secara akurat
 * dengan memperhitungkan kondisi Siang/Malam (`isDay`).
 */
export function translateWmoWeatherCode(
  code: number,
  isDay = true
): {
  label: WeatherConditionLabel;
  shortDesc: string;
  iconKey:
    | 'sun'
    | 'moon'
    | 'cloud-sun'
    | 'cloud-moon'
    | 'cloud'
    | 'cloud-fog'
    | 'cloud-drizzle'
    | 'cloud-rain'
    | 'cloud-lightning';
} {
  const safeCode = Number.isFinite(code) ? Math.round(code) : 2;

  if (safeCode === 0) {
    return isDay
      ? { label: 'Cerah', shortDesc: 'Langit cerah terik', iconKey: 'sun' }
      : { label: 'Cerah Malam', shortDesc: 'Langit malam cerah', iconKey: 'moon' };
  }
  if (safeCode === 1 || safeCode === 2) {
    return isDay
      ? { label: 'Cerah Berawan', shortDesc: 'Berawan sebagian (Siang)', iconKey: 'cloud-sun' }
      : { label: 'Cerah Berawan', shortDesc: 'Berawan sebagian (Malam)', iconKey: 'cloud-moon' };
  }
  if (safeCode === 3) {
    return { label: 'Berawan', shortDesc: 'Tertutup awan merata', iconKey: 'cloud' };
  }
  if (safeCode === 45 || safeCode === 48) {
    return {
      label: 'Berawan Tebal / Kabut',
      shortDesc: 'Kabut / embun tebal permukaan',
      iconKey: 'cloud-fog',
    };
  }
  if (safeCode >= 51 && safeCode <= 57) {
    return {
      label: 'Hujan Ringan',
      shortDesc: 'Gerimis / hujan rintik ringan',
      iconKey: 'cloud-drizzle',
    };
  }
  if (safeCode === 61 || safeCode === 80) {
    return {
      label: 'Hujan Ringan',
      shortDesc: 'Hujan intensitas ringan',
      iconKey: 'cloud-rain',
    };
  }
  if (safeCode === 63 || safeCode === 81) {
    return {
      label: 'Hujan Sedang',
      shortDesc: 'Hujan intensitas sedang',
      iconKey: 'cloud-rain',
    };
  }
  if ((safeCode >= 65 && safeCode <= 67) || safeCode === 82) {
    return {
      label: 'Hujan Lebat',
      shortDesc: 'Hujan deras / lebat',
      iconKey: 'cloud-rain',
    };
  }
  if (safeCode >= 95) {
    return {
      label: 'Hujan Lebat Disertai Petir',
      shortDesc: 'Badai hujan disertai kilat/petir',
      iconKey: 'cloud-lightning',
    };
  }
  return {
    label: 'Hujan Ringan',
    shortDesc: 'Presipitasi lokal',
    iconKey: 'cloud-rain',
  };
}

/**
 * Mengonversi arah angin derajat (0-360) menjadi mata angin Bahasa Indonesia.
 */
export function degreesToCardinalId(deg?: number): string {
  if (typeof deg !== 'number' || !Number.isFinite(deg)) return 'Timur';
  const normalized = ((deg % 360) + 360) % 360;
  const directions = [
    'Utara',
    'Timur Laut',
    'Timur',
    'Tenggara',
    'Selatan',
    'Barat Daya',
    'Barat',
    'Barat Laut',
  ];
  const index = Math.round(normalized / 45) % 8;
  return directions[index] || 'Timur';
}

/**
 * Memformat tanggal ISO (YYYY-MM-DD) dari array `daily.time` menggunakan
 * `Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })`.
 */
export function formatDynamicForecastDateId(
  dateIso: string,
  index = 0
): {
  dayName: string;
  formattedDate: string;
  dateStr: string;
} {
  try {
    const cleanIso = dateIso.slice(0, 10);
    const dateObj = new Date(`${cleanIso}T12:00:00+07:00`);
    if (Number.isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    const fullFormatted = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(dateObj);

    const weekdayShort = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      timeZone: 'Asia/Jakarta',
    }).format(dateObj);

    return {
      dayName: index === 0 ? `Hari Ini (${weekdayShort})` : weekdayShort,
      formattedDate: fullFormatted,
      dateStr: index === 0 ? 'Hari Ini' : index === 1 ? 'Besok' : cleanIso,
    };
  } catch {
    return {
      dayName: index === 0 ? 'Hari Ini' : `H+${index}`,
      formattedDate: dateIso,
      dateStr: index === 0 ? 'Hari Ini' : index === 1 ? 'Besok' : dateIso,
    };
  }
}

/**
 * Menghitung status "Rekomendasi Cuaca & Penyemprotan/Pemupukan" secara dinamis
 * berdasarkan parameter cuaca real-time:
 * - Jika peluang hujan > 60% ATAU curah hujan > 2 mm ATAU kecepatan angin > 15 km/jam (atau sedang hujan kode >= 51):
 *   -> "Kurang Kondusif / Tunda Penyemprotan & Pemupukan"
 * - Selain itu:
 *   -> "Kondusif untuk Pemupukan & Penyemprotan PHT"
 */
export function evaluateAgronomyWeatherAdvisory(params: {
  rainProbabilityPct: number;
  rainfallMm: number;
  windSpeedKmh: number;
  humidityPct?: number;
  weatherCode?: number;
  tempC?: number;
  conditionText?: string;
}): WeatherSnapshot['sprayingAdvisory'] {
  const rainProb = Number(params.rainProbabilityPct) || 0;
  const rainMm = Number(params.rainfallMm) || 0;
  const windKmh = Number(params.windSpeedKmh) || 0;
  const code = typeof params.weatherCode === 'number' ? params.weatherCode : 1;
  const tempC = typeof params.tempC === 'number' ? params.tempC : 29;
  const conditionText = params.conditionText || translateWmoWeatherCode(code, true).label;

  const limitingFactors: string[] = [];

  if (rainProb > 60) {
    limitingFactors.push(`peluang hujan tinggi (${rainProb}% > 60%)`);
  }
  if (rainMm > 2) {
    limitingFactors.push(`curah hujan aktual (${rainMm} mm > 2 mm)`);
  }
  if (windKmh > 15) {
    limitingFactors.push(`kecepatan angin kencang (${windKmh} km/jam > 15 km/jam)`);
  }
  if (code >= 51 && rainMm <= 2 && rainProb <= 60) {
    limitingFactors.push(`kondisi langit sedang ${conditionText.toLowerCase()}`);
  }

  if (limitingFactors.length > 0) {
    return {
      status: 'Kurang Kondusif / Tunda Penyemprotan & Pemupukan',
      isCondusive: false,
      limitingFactors,
      recommendation: `Tunda penyemprotan pestisida PHT dan penaburan pupuk karena terdeteksi ${limitingFactors.join(
        ', '
      )}. Aplikasi pada kondisi ini berisiko tinggi menyebabkan pupuk/pestisida tercuci air hujan (run-off) atau terbawa angin (drift).`,
    };
  }

  return {
    status: 'Kondusif untuk Pemupukan & Penyemprotan PHT',
    isCondusive: true,
    limitingFactors: [],
    recommendation: `Kondisi cuaca ${conditionText.toLowerCase()} (${tempC}°C), peluang hujan rendah (${rainProb}% ≤ 60%), curah hujan ${rainMm} mm (≤ 2 mm), dan angin tenang (${windKmh} km/jam ≤ 15 km/jam). Aman dan optimal untuk pemupukan berimbang maupun penyemprotan PHT.`,
  };
}

/**
 * Memformat waktu pembaruan aktual dalam zona waktu Asia/Jakarta (HH:mm:ss WIB).
 */
export function formatCurrentWibTimestamp(date = new Date()): string {
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  })
    .format(date)
    .replace(/\./g, ':');
  return `${timePart} WIB`;
}

const VERIFIED_GPS_STORAGE_KEY = 'tanicerdas_verified_device_gps_v1';

export interface VerifiedGpsDetectionResult {
  latitude: number;
  longitude: number;
  source:
    | 'GPS Browser Akurat'
    | 'Lokasi Terpilih Presisi'
    | 'Koordinat Presisi Desa Larikrejo, Kudus';
  locationSource?:
    | 'GPS Browser Akurat'
    | 'Lokasi Terpilih Presisi'
    | 'Koordinat Presisi Desa Larikrejo, Kudus';
  accuracyMeters?: number;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'manual';
  errorMessage?: string;
}

export function getSavedVerifiedGpsLocation(): {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationName?: string;
  source: 'GPS Browser Akurat' | 'Lokasi Terpilih Presisi';
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VERIFIED_GPS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.latitude === 'number' &&
      typeof parsed?.longitude === 'number' &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveVerifiedGpsLocation(payload: {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationName?: string;
  source: 'GPS Browser Akurat' | 'Lokasi Terpilih Presisi';
}): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VERIFIED_GPS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

/**
 * Mencari titik koordinat Desa / Kecamatan / Kabupaten di Indonesia menggunakan
 * Open-Meteo Geocoding API & Nominatim OpenStreetMap.
 */
export async function searchIndonesianLocationCoordinates(query: string): Promise<
  Array<{
    id: string;
    name: string;
    fullName: string;
    latitude: number;
    longitude: number;
  }>
> {
  const cleanQuery = (query || '').trim();
  if (cleanQuery.length < 2) return [];

  try {
    const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cleanQuery
    )}&count=6&language=id&format=json`;
    const res = await fetch(omUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      const mapped = results.map((item: any, idx: number) => {
        const parts = [item.name, item.admin3, item.admin2, item.admin1, item.country]
          .map((p) => String(p || '').trim())
          .filter(Boolean);
        const unique = Array.from(new Set(parts));
        return {
          id: `geo-${item.id || idx}-${item.latitude}-${item.longitude}`,
          name: item.name || cleanQuery,
          fullName: unique.join(', '),
          latitude: Number(Number(item.latitude).toFixed(5)),
          longitude: Number(Number(item.longitude).toFixed(5)),
        };
      });
      if (mapped.length > 0) return mapped;
    }
  } catch {
    // Lanjut ke Nominatim
  }

  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      `${cleanQuery}, Indonesia`
    )}&limit=5&accept-language=id`;
    const res = await fetch(nomUrl, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any, idx: number) => ({
          id: `nom-${idx}-${item.lat}-${item.lon}`,
          name: String(item.display_name || cleanQuery).split(',')[0],
          fullName: String(item.display_name || cleanQuery),
          latitude: Number(Number(item.lat).toFixed(5)),
          longitude: Number(Number(item.lon).toFixed(5)),
        }));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Mendeteksi koordinat GPS perangkat pengguna secara real-time menggunakan `navigator.geolocation.getCurrentPosition`
 * (2 tahap: High-Accuracy GPS Satelit -> Fallback Network/Wi-Fi Geolocation) agar sangat akurat di HP maupun Laptop.
 * Jika izin lokasi ditolak/belum aktif, mengembalikan status `permissionStatus: 'denied' | 'prompt'` beserta pesan wajib aktifkan lokasi.
 */
export async function detectUserCoordinatesWithFallback(
  timeoutMs = 7000
): Promise<VerifiedGpsDetectionResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    const saved = getSavedVerifiedGpsLocation();
    if (saved) {
      return {
        latitude: saved.latitude,
        longitude: saved.longitude,
        source: saved.source,
        locationSource: saved.source,
        accuracyMeters: saved.accuracyMeters,
        permissionStatus: saved.source === 'GPS Browser Akurat' ? 'granted' : 'manual',
      };
    }
    return {
      latitude: DEFAULT_LARIKREJO_COORDS.latitude,
      longitude: DEFAULT_LARIKREJO_COORDS.longitude,
      source: 'Koordinat Presisi Desa Larikrejo, Kudus',
      locationSource: 'Koordinat Presisi Desa Larikrejo, Kudus',
      permissionStatus: 'denied',
      errorMessage:
        'Perangkat/browser tidak mendukung modul Geolocation. Wajib aktifkan layanan Lokasi (GPS) atau pilih titik lokasi lahan.',
    };
  }

  // Helper untuk memanggil getCurrentPosition sebagai Promise
  const requestPosition = (highAccuracy: boolean, waitMs: number) =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      let done = false;
      const timer = setTimeout(() => {
        if (!done) {
          done = true;
          reject({ code: 3, message: 'Timeout' });
        }
      }, waitMs);

      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            resolve(pos);
          },
          (err) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            reject(err);
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: waitMs,
            maximumAge: highAccuracy ? 0 : 15000,
          }
        );
      } catch (err) {
        if (!done) {
          done = true;
          clearTimeout(timer);
          reject(err);
        }
      }
    });

  try {
    // Tahap 1: Presisi Tinggi (GPS Satelit / Sensor Perangkat, maximumAge: 0)
    const pos = await requestPosition(true, timeoutMs);
    const lat = Number(pos.coords.latitude.toFixed(5));
    const lon = Number(pos.coords.longitude.toFixed(5));
    const acc = Math.max(3, Math.round(Number(pos.coords.accuracy || 15)));
    saveVerifiedGpsLocation({
      latitude: lat,
      longitude: lon,
      accuracyMeters: acc,
      source: 'GPS Browser Akurat',
    });
    return {
      latitude: lat,
      longitude: lon,
      source: 'GPS Browser Akurat',
      locationSource: 'GPS Browser Akurat',
      accuracyMeters: acc,
      permissionStatus: 'granted',
    };
  } catch (firstErr: any) {
    // Jika bukan karena ditolak eksplisit (code === 1), coba Tahap 2: Network/Wi-Fi Location agar tetap akurat di dalam ruangan/laptop
    if (firstErr?.code !== 1) {
      try {
        const netPos = await requestPosition(false, 4500);
        const lat = Number(netPos.coords.latitude.toFixed(5));
        const lon = Number(netPos.coords.longitude.toFixed(5));
        const acc = Math.max(10, Math.round(Number(netPos.coords.accuracy || 50)));
        saveVerifiedGpsLocation({
          latitude: lat,
          longitude: lon,
          accuracyMeters: acc,
          source: 'GPS Browser Akurat',
        });
        return {
          latitude: lat,
          longitude: lon,
          source: 'GPS Browser Akurat',
          locationSource: 'GPS Browser Akurat',
          accuracyMeters: acc,
          permissionStatus: 'granted',
        };
      } catch {
        // Lanjut ke penanganan fallback
      }
    }

    // Jika sebelumnya pengguna sudah pernah mengaktifkan GPS atau mengunci lokasi, gunakan koordinat tersebut
    const saved = getSavedVerifiedGpsLocation();
    if (saved) {
      return {
        latitude: saved.latitude,
        longitude: saved.longitude,
        source: saved.source,
        locationSource: saved.source,
        accuracyMeters: saved.accuracyMeters,
        permissionStatus: saved.source === 'GPS Browser Akurat' ? 'granted' : 'manual',
      };
    }

    const isDenied = firstErr?.code === 1;
    return {
      latitude: DEFAULT_LARIKREJO_COORDS.latitude,
      longitude: DEFAULT_LARIKREJO_COORDS.longitude,
      source: 'Koordinat Presisi Desa Larikrejo, Kudus',
      locationSource: 'Koordinat Presisi Desa Larikrejo, Kudus',
      permissionStatus: isDenied ? 'denied' : 'prompt',
      errorMessage: isDenied
        ? 'Izin lokasi (GPS) perangkat ditolak/nonaktif. Wajib aktifkan izin Lokasi pada browser/HP Anda agar deteksi cuaca akurat sesuai titik lahan.'
        : 'Lokasi GPS perangkat belum aktif atau sinyal lemah. Klik "Aktifkan GPS Perangkat" untuk mengunci cuaca akurat di lokasi Anda.',
    };
  }
}

/**
 * Reverse Geocoding otomatis dari koordinat latitude & longitude menggunakan
 * BigDataCloud & OpenStreetMap Nominatim agar nama Desa/Kecamatan/Kabupaten tampil akurat.
 */
export async function reverseGeocodeLocationName(
  latitude: number,
  longitude: number
): Promise<string> {
  const isDefaultKudus =
    Math.abs(latitude - DEFAULT_LARIKREJO_COORDS.latitude) < 0.008 &&
    Math.abs(longitude - DEFAULT_LARIKREJO_COORDS.longitude) < 0.008;

  if (isDefaultKudus) {
    return DEFAULT_LARIKREJO_COORDS.locationName;
  }

  // 1. Coba Nominatim OpenStreetMap (memiliki detail village/suburb/county Indonesia yang sangat akurat)
  try {
    const nomController = new AbortController();
    const nomTimer = setTimeout(() => nomController.abort(), 3200);
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1&accept-language=id`;
    const nomRes = await fetch(nomUrl, {
      signal: nomController.signal,
      cache: 'no-store',
    });
    clearTimeout(nomTimer);

    if (nomRes.ok) {
      const nomData = await nomRes.json();
      const addr = nomData?.address || {};
      const village =
        addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || addr.town || '';
      const district = addr.municipality || addr.city_district || addr.subdistrict || '';
      const regency = addr.county || addr.city || addr.regency || '';
      const state = addr.state || '';

      const parts = [village, district, regency, state]
        .map((p) => String(p || '').trim())
        .filter(Boolean);
      const uniqueParts = Array.from(new Set(parts));
      if (uniqueParts.length >= 2) {
        return uniqueParts.slice(0, 4).join(', ');
      }
    }
  } catch {
    // Lanjut ke BigDataCloud
  }

  // 2. Fallback ke BigDataCloud Client Reverse Geocode API
  try {
    const bdcController = new AbortController();
    const bdcTimer = setTimeout(() => bdcController.abort(), 3200);
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`;
    const bdcRes = await fetch(bdcUrl, {
      signal: bdcController.signal,
      cache: 'no-store',
    });
    clearTimeout(bdcTimer);

    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      const locality = bdcData?.locality || '';
      const city = bdcData?.city || '';
      const subdivision = bdcData?.principalSubdivision || '';
      const parts = [locality, city, subdivision]
        .map((p) => String(p || '').trim())
        .filter(Boolean);
      const uniqueParts = Array.from(new Set(parts));
      if (uniqueParts.length >= 2) {
        if (isDefaultKudus && !uniqueParts[0].toLowerCase().includes('larikrejo')) {
          return `Desa Larikrejo, ${uniqueParts.join(', ')}`;
        }
        return uniqueParts.join(', ');
      }
    }
  } catch {
    // Gunakan nama koordinat terverifikasi
  }

  if (isDefaultKudus) {
    return DEFAULT_LARIKREJO_COORDS.locationName;
  }
  return `Koordinat Lahan (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
}

/**
 * Mengurai respons JSON Open-Meteo (`current`, `hourly`, `daily`) menjadi `WeatherSnapshot`
 * lengkap tanpa data statis/hardcoded.
 */
export function parseOpenMeteoResponseToSnapshot(params: {
  data?: any;
  raw?: any;
  latitude: number;
  longitude: number;
  locationName: string;
  locationSource?: WeatherSnapshot['locationSource'];
  gpsAccuracyMeters?: number;
  gpsPermissionStatus?: WeatherSnapshot['gpsPermissionStatus'];
  gpsErrorMessage?: string;
  bmkgAdm4Code?: string;
  bmkgNote?: string;
  providerMode?: 'open-meteo' | 'bmkg-hybrid';
}): WeatherSnapshot {
  const {
    latitude,
    longitude,
    locationName,
    locationSource = 'Koordinat Presisi Desa Larikrejo, Kudus',
    gpsAccuracyMeters,
    gpsPermissionStatus,
    gpsErrorMessage,
    bmkgAdm4Code = DEFAULT_LARIKREJO_COORDS.bmkgAdm4Code,
    bmkgNote,
    providerMode = 'bmkg-hybrid',
  } = params;

  const data = params.data || params.raw || {};
  const current = data?.current || {};
  const hourly = data?.hourly || {};
  const daily = data?.daily || {};

  const isDay = current.is_day !== undefined ? Number(current.is_day) === 1 : true;
  const weatherCode = Number(current.weather_code ?? 1);
  const translatedCurrent = translateWmoWeatherCode(weatherCode, isDay);

  const tempC = Number(Number(current.temperature_2m ?? 29).toFixed(1));
  const apparentTempC = Number(Number(current.apparent_temperature ?? tempC).toFixed(1));
  const humidityPct = Math.round(Number(current.relative_humidity_2m ?? 75));

  // Gunakan nilai tertinggi antara precipitation & rain aktual
  const rawPrecip = Number(current.precipitation ?? 0);
  const rawRain = Number(current.rain ?? 0);
  const rainfallMm = Number(Math.max(rawPrecip, rawRain).toFixed(1));

  const windSpeedKmh = Number(Number(current.wind_speed_10m ?? 8).toFixed(1));
  const windDirectionDeg = Math.round(Number(current.wind_direction_10m ?? 90));
  const windDirectionCardinal = degreesToCardinalId(windDirectionDeg);

  // Cari indeks jam saat ini pada array hourly.time untuk mendapatkan peluang hujan jam berjalan yang presisi
  const hourlyTimes: string[] = Array.isArray(hourly.time) ? hourly.time : [];
  const currentTimePrefix = String(current.time || '').slice(0, 13);
  let currentHourIdx = hourlyTimes.findIndex((t) => t.slice(0, 13) === currentTimePrefix);
  if (currentHourIdx < 0) currentHourIdx = 0;

  const hourlyForecast: WeatherHourlyPoint[] = hourlyTimes
    .slice(currentHourIdx, currentHourIdx + 8)
    .map((timeIso, idx) => {
      const actualIdx = currentHourIdx + idx;
      const hCode = Number(hourly.weather_code?.[actualIdx] ?? weatherCode);
      const hourStr = timeIso.slice(11, 16) || '00:00';
      const hourNumber = parseInt(hourStr.slice(0, 2), 10);
      const hourIsDay = hourNumber >= 6 && hourNumber < 18;
      return {
        timeIso,
        hourLabel: idx === 0 ? 'Sekarang' : hourStr,
        tempC: Math.round(Number(hourly.temperature_2m?.[actualIdx] ?? tempC)),
        rainProbabilityPct: Math.round(Number(hourly.precipitation_probability?.[actualIdx] ?? 0)),
        precipitationMm: Number(Number(hourly.precipitation?.[actualIdx] ?? 0).toFixed(1)),
        weatherCode: hCode,
        condition: translateWmoWeatherCode(hCode, hourIsDay).label,
      };
    });

  // Prakiraan 7 Hari ke Depan berdasarkan daily.time
  const dailyTimes: string[] = Array.isArray(daily.time) ? daily.time : [];
  const forecast: WeatherForecastDay[] = dailyTimes.slice(0, 7).map((dateIso, idx) => {
    const dCode = Number(daily.weather_code?.[idx] ?? 1);
    const { dayName, formattedDate } = formatDynamicForecastDateId(dateIso, idx);
    return {
      dayName,
      formattedDate,
      dateStr: dateIso,
      weatherCode: dCode,
      condition: translateWmoWeatherCode(dCode, true).label,
      tempMaxC: Math.round(Number(daily.temperature_2m_max?.[idx] ?? tempC + 3)),
      tempMinC: Math.round(Number(daily.temperature_2m_min?.[idx] ?? tempC - 4)),
      rainChancePct: Math.round(Number(daily.precipitation_probability_max?.[idx] ?? 0)),
      rainfallMm: Number(Number(daily.precipitation_sum?.[idx] ?? 0).toFixed(1)),
      windSpeedMaxKmh: Math.round(Number(daily.wind_speed_10m_max?.[idx] ?? windSpeedKmh)),
    };
  });

  // Gunakan peluang hujan jam berjalan (atau maksimum 3 jam terdekat / hari ini) agar akurat & konsisten dengan rekomendasi cuaca
  const immediateHourlyProbs = hourlyForecast
    .slice(0, 3)
    .map((h) => h.rainProbabilityPct)
    .filter((v) => Number.isFinite(v));
  const currentRainProbPct =
    immediateHourlyProbs.length > 0
      ? Math.max(...immediateHourlyProbs)
      : forecast[0]?.rainChancePct ?? 0;

  const sprayingAdvisory = evaluateAgronomyWeatherAdvisory({
    rainProbabilityPct: currentRainProbPct,
    rainfallMm,
    windSpeedKmh,
    weatherCode,
    tempC: Math.round(tempC),
    conditionText: translatedCurrent.label,
  });

  const sourceLabel = bmkgNote
    ? `Open-Meteo Live & BMKG (${bmkgNote}) • (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`
    : `Open-Meteo Live API (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;

  return {
    locationName,
    latitude,
    longitude,
    locationSource,
    gpsAccuracyMeters,
    gpsPermissionStatus,
    gpsErrorMessage,
    bmkgAdm4Code,
    tempC: Math.round(tempC),
    apparentTempC: Math.round(apparentTempC),
    weatherCode,
    isDay,
    conditionText: translatedCurrent.label,
    humidityPct,
    rainfallMm,
    rainMm: Number(rawRain.toFixed(1)),
    rainProbabilityPct: currentRainProbPct,
    windSpeedKmh: Math.round(windSpeedKmh),
    windDirectionDeg,
    windDirectionCardinal,
    updatedAt: formatCurrentWibTimestamp(),
    fetchedAtIso: new Date().toISOString(),
    sourceName: sourceLabel,
    providerMode,
    isLiveApi: true,
    sprayingAdvisory,
    hourlyForecast,
    forecast,
  };
}

/**
 * Mengambil data cuaca real-time langsung dari Open-Meteo Forecast API
 * (`https://api.open-meteo.com/v1/forecast`) dengan parameter lengkap sesuai spesifikasi:
 * - `current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m`
 * - `hourly=temperature_2m,precipitation_probability,precipitation,weather_code`
 * - `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max`
 * - `timezone=Asia%2FJakarta&forecast_days=7`
 * Serta mengintegrasikan data wilayah BMKG (API Terbuka BMKG) bila diaktifkan.
 */
export async function fetchLiveMultiSourceWeather(options?: {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationSource?: WeatherSnapshot['locationSource'];
  bmkgAdm4Code?: string;
  providerMode?: 'open-meteo' | 'bmkg-hybrid';
  useBrowserGps?: boolean;
  customCoords?: {
    latitude: number;
    longitude: number;
    locationName?: string;
    bmkgAdm4Code?: string;
    source?: WeatherSnapshot['locationSource'];
  };
}): Promise<WeatherSnapshot> {
  let lat = options?.customCoords?.latitude ?? options?.latitude;
  let lon = options?.customCoords?.longitude ?? options?.longitude;
  const preferredLocationName = options?.customCoords?.locationName ?? options?.locationName;
  let locSource: WeatherSnapshot['locationSource'] =
    options?.customCoords?.source ||
    options?.locationSource ||
    'Lokasi Terpilih Presisi';
  let gpsAccuracyMeters: number | undefined;
  let gpsPermissionStatus: WeatherSnapshot['gpsPermissionStatus'] = 'manual';
  let gpsErrorMessage: string | undefined;

  if (options?.useBrowserGps || typeof lat !== 'number' || typeof lon !== 'number') {
    const detected = await detectUserCoordinatesWithFallback();
    lat = detected.latitude;
    lon = detected.longitude;
    locSource = detected.source;
    gpsAccuracyMeters = detected.accuracyMeters;
    gpsPermissionStatus = detected.permissionStatus;
    gpsErrorMessage = detected.errorMessage;
  } else {
    saveVerifiedGpsLocation({
      latitude: lat,
      longitude: lon,
      locationName: preferredLocationName,
      source: locSource === 'GPS Browser Akurat' ? 'GPS Browser Akurat' : 'Lokasi Terpilih Presisi',
    });
  }

  const matchedPreset = BMKG_ADMIN_REGION_PRESETS.find(
    (p) => Math.abs(p.latitude - lat!) < 0.015 && Math.abs(p.longitude - lon!) < 0.015
  );
  const adm4Code =
    options?.customCoords?.bmkgAdm4Code ||
    options?.bmkgAdm4Code ||
    matchedPreset?.adm4Code ||
    DEFAULT_LARIKREJO_COORDS.bmkgAdm4Code;
  const providerMode = options?.providerMode || 'bmkg-hybrid';

  const openMeteoUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
    `&timezone=Asia%2FJakarta&forecast_days=7&_t=${Date.now()}`;

  try {
    const [openMeteoResp, resolvedLocationName, bmkgInfo] = await Promise.all([
      fetch(openMeteoUrl, { cache: 'no-store' }).then(async (res) => {
        if (!res.ok) {
          throw new Error(`Open-Meteo HTTP ${res.status}`);
        }
        return res.json();
      }),
      preferredLocationName
        ? Promise.resolve(preferredLocationName)
        : reverseGeocodeLocationName(lat, lon),
      providerMode === 'bmkg-hybrid'
        ? fetchBmkgAdm4Verification(adm4Code)
        : Promise.resolve(null),
    ]);

    const finalLocationName =
      preferredLocationName
        ? preferredLocationName
        : matchedPreset && bmkgInfo?.desa && bmkgInfo?.kecamatan && bmkgInfo?.kotkab
        ? `Desa ${bmkgInfo.desa}, Kec. ${bmkgInfo.kecamatan}, ${bmkgInfo.kotkab}`
        : resolvedLocationName;

    return parseOpenMeteoResponseToSnapshot({
      data: openMeteoResp,
      latitude: lat,
      longitude: lon,
      locationName: finalLocationName,
      locationSource: locSource,
      gpsAccuracyMeters,
      gpsPermissionStatus,
      gpsErrorMessage,
      bmkgAdm4Code: adm4Code,
      bmkgNote:
        providerMode === 'bmkg-hybrid'
          ? bmkgInfo?.summaryNote || `BMKG Adm4 ${adm4Code}`
          : undefined,
      providerMode,
    });
  } catch (_directError) {
    // Fallback ke endpoint server /api/weather yang juga memanggil Open-Meteo & BMKG secara real-time
    const serverRes = await fetch(
      `/api/weather?lat=${lat}&lon=${lon}&adm4=${encodeURIComponent(adm4Code)}&mode=${providerMode}&_t=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!serverRes.ok) {
      throw new Error(`Gagal memuat API cuaca real-time (HTTP ${serverRes.status})`);
    }
    const serverSnapshot = await serverRes.json();
    if (serverSnapshot && typeof serverSnapshot.tempC === 'number') {
      return {
        ...serverSnapshot,
        locationSource: locSource,
        gpsAccuracyMeters,
        gpsPermissionStatus,
        gpsErrorMessage,
      };
    }
    throw new Error('Respons data cuaca tidak valid.');
  }
}

/**
 * Mengambil verifikasi wilayah & prakiraan cuaca resmi dari API Publik BMKG
 * (`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=...`) apabila terjangkau dari jaringan pengguna.
 */
async function fetchBmkgAdm4Verification(adm4Code: string): Promise<{
  desa?: string;
  kecamatan?: string;
  kotkab?: string;
  provinsi?: string;
  summaryNote?: string;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const url = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(
      adm4Code
    )}`;
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!res.ok) return null;
    const json = await res.json();
    const loc = json?.lokasi || json?.data?.[0]?.lokasi;
    if (loc) {
      return {
        desa: loc.desa,
        kecamatan: loc.kecamatan,
        kotkab: loc.kotkab,
        provinsi: loc.provinsi,
        summaryNote: `BMKG Adm4 ${adm4Code}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}
