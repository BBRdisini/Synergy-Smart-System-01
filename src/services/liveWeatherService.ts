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
  latitude: number;
  longitude: number;
}

export const BMKG_ADMIN_REGION_PRESETS: BmkgAdminRegionPreset[] = [
  {
    id: 'kudus-larikrejo',
    label: 'Desa Larikrejo, Kec. Undaan, Kab. Kudus',
    adm4Code: '33.19.03.2007',
    latitude: -6.899,
    longitude: 110.802,
  },
  {
    id: 'kudus-wates',
    label: 'Desa Wates, Kec. Undaan, Kab. Kudus',
    adm4Code: '33.19.03.2009',
    latitude: -6.885,
    longitude: 110.812,
  },
  {
    id: 'demak-gajah',
    label: 'Kec. Gajah, Kab. Demak, Jawa Tengah',
    adm4Code: '33.21.07.2001',
    latitude: -6.872,
    longitude: 110.732,
  },
  {
    id: 'pati-sukolilo',
    label: 'Kec. Sukolilo, Kab. Pati, Jawa Tengah',
    adm4Code: '33.18.01.2001',
    latitude: -6.924,
    longitude: 110.896,
  },
  {
    id: 'grobogan-purwodadi',
    label: 'Kec. Purwodadi, Kab. Grobogan, Jawa Tengah',
    adm4Code: '33.15.13.1001',
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
    };
  } catch {
    return {
      dayName: index === 0 ? 'Hari Ini' : `H+${index}`,
      formattedDate: dateIso,
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

/**
 * Mendeteksi koordinat GPS pengguna secara real-time menggunakan `navigator.geolocation.getCurrentPosition`
 * dengan fallback presisi ke Desa Larikrejo, Kec. Undaan, Kab. Kudus (-6.899, 110.802).
 */
export async function detectUserCoordinatesWithFallback(timeoutMs = 4500): Promise<{
  latitude: number;
  longitude: number;
  source: 'GPS Browser Akurat' | 'Koordinat Presisi Desa Larikrejo, Kudus';
}> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return {
      latitude: DEFAULT_LARIKREJO_COORDS.latitude,
      longitude: DEFAULT_LARIKREJO_COORDS.longitude,
      source: 'Koordinat Presisi Desa Larikrejo, Kudus',
    };
  }

  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          latitude: DEFAULT_LARIKREJO_COORDS.latitude,
          longitude: DEFAULT_LARIKREJO_COORDS.longitude,
          source: 'Koordinat Presisi Desa Larikrejo, Kudus',
        });
      }
    }, timeoutMs);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lon = Number(pos.coords.longitude.toFixed(4));
          resolve({
            latitude: lat,
            longitude: lon,
            source: 'GPS Browser Akurat',
          });
        },
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve({
            latitude: DEFAULT_LARIKREJO_COORDS.latitude,
            longitude: DEFAULT_LARIKREJO_COORDS.longitude,
            source: 'Koordinat Presisi Desa Larikrejo, Kudus',
          });
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs,
          maximumAge: 60000,
        }
      );
    } catch {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          latitude: DEFAULT_LARIKREJO_COORDS.latitude,
          longitude: DEFAULT_LARIKREJO_COORDS.longitude,
          source: 'Koordinat Presisi Desa Larikrejo, Kudus',
        });
      }
    }
  });
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
  data: any;
  latitude: number;
  longitude: number;
  locationName: string;
  locationSource?: WeatherSnapshot['locationSource'];
  bmkgAdm4Code?: string;
  bmkgNote?: string;
  providerMode?: 'open-meteo' | 'bmkg-hybrid';
}): WeatherSnapshot {
  const {
    data,
    latitude,
    longitude,
    locationName,
    locationSource = 'Koordinat Presisi Desa Larikrejo, Kudus',
    bmkgAdm4Code = DEFAULT_LARIKREJO_COORDS.bmkgAdm4Code,
    bmkgNote,
    providerMode = 'bmkg-hybrid',
  } = params;

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
}): Promise<WeatherSnapshot> {
  let lat = options?.latitude;
  let lon = options?.longitude;
  let locSource: WeatherSnapshot['locationSource'] =
    options?.locationSource || 'Koordinat Presisi Desa Larikrejo, Kudus';

  if (options?.useBrowserGps || typeof lat !== 'number' || typeof lon !== 'number') {
    const detected = await detectUserCoordinatesWithFallback();
    lat = detected.latitude;
    lon = detected.longitude;
    locSource = detected.source;
  }

  const matchedPreset = BMKG_ADMIN_REGION_PRESETS.find(
    (p) => Math.abs(p.latitude - lat!) < 0.015 && Math.abs(p.longitude - lon!) < 0.015
  );
  const adm4Code =
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
      options?.locationName
        ? Promise.resolve(options.locationName)
        : reverseGeocodeLocationName(lat, lon),
      providerMode === 'bmkg-hybrid'
        ? fetchBmkgAdm4Verification(adm4Code)
        : Promise.resolve(null),
    ]);

    const finalLocationName =
      options?.locationName
        ? options.locationName
        : matchedPreset && bmkgInfo?.desa && bmkgInfo?.kecamatan && bmkgInfo?.kotkab
        ? `Desa ${bmkgInfo.desa}, Kec. ${bmkgInfo.kecamatan}, ${bmkgInfo.kotkab}`
        : resolvedLocationName;

    return parseOpenMeteoResponseToSnapshot({
      data: openMeteoResp,
      latitude: lat,
      longitude: lon,
      locationName: finalLocationName,
      locationSource: locSource,
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
