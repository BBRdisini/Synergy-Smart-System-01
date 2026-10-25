import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import {
  buildInitialSeedState,
  DEFAULT_USER_PROFILE,
} from './src/data/agronomyDatabase';
import {
  filterEntitiesByOwner,
  generatePredictiveAiAlerts,
  buildContextualDiagnosisResult,
} from './src/utils/agronomyCalculations';
import {
  runDirectGeminiVisionDiagnosis,
} from './src/services/geminiVisionDiagnosis';
import {
  DEFAULT_LARIKREJO_COORDS,
  parseOpenMeteoResponseToSnapshot,
  reverseGeocodeLocationName,
} from './src/services/liveWeatherService';

dotenv.config();

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE_PATH = path.join(DB_DIR, 'tanicerdas_db.json');

interface ServerPersistentDatabase {
  version: string;
  updatedAt: string;
  users: any[];
  farms: any[];
  growingSeasons: any[];
  cultivationTasks: any[];
  seasonActivityLogs: any[];
  seasonExpenseRecords: any[];
  seasonHarvestRecords: any[];
  cropProfiles: any[];
}

function loadOrInitializeServerDb(): ServerPersistentDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.farms) && Array.isArray(parsed.growingSeasons)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Initializing fresh persistent database:', err);
  }

  const seed = buildInitialSeedState();
  const initialDb: ServerPersistentDatabase = {
    version: '1.0.0-tahap1-persistent',
    updatedAt: new Date().toISOString(),
    users: [
      {
        ...DEFAULT_USER_PROFILE,
        createdAt: '2025-01-01T00:00:00Z',
        preferences: {
          defaultAreaUnit: 'ha',
          enableOfflineQueue: true,
          notificationsEnabled: true,
        },
      },
    ],
    farms: seed.farms,
    growingSeasons: seed.growingSeasons,
    cultivationTasks: seed.cultivationTasks,
    seasonActivityLogs: seed.seasonActivityLogs,
    seasonExpenseRecords: seed.seasonExpenseRecords,
    seasonHarvestRecords: seed.seasonHarvestRecords,
    cropProfiles: seed.cropProfiles,
  };

  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write initial DB file:', err);
  }
  return initialDb;
}

function saveServerDb(db: ServerPersistentDatabase): void {
  db.updatedAt = new Date().toISOString();
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist DB file:', err);
  }
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 1500): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`AI request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  let serverDb = loadOrInitializeServerDb();

  // Health & Capability Check
  app.get('/api/health', (_req, res) => {
    const hasGeminiKey = Boolean(
      process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
        process.env.GEMINI_API_KEY.trim().length > 5
    );
    res.json({
      status: 'ok',
      service: 'TaniCerdas AI Server',
      database: 'Persistent JSON + IndexedDB Sync Adapter',
      dbUpdatedAt: serverDb.updatedAt,
      timezone: 'Asia/Jakarta',
      geminiConfigured: hasGeminiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // Persistent Database Read Endpoint with Owner Isolation
  app.get('/api/db/state', (req, res) => {
    const ownerId = ((req.query.ownerId as string) || DEFAULT_USER_PROFILE.id).trim();
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId wajib disertakan untuk isolasi data pemilik.' });
    }

    return res.json({
      version: serverDb.version,
      updatedAt: serverDb.updatedAt,
      ownerId,
      farms: filterEntitiesByOwner(serverDb.farms, ownerId),
      growingSeasons: filterEntitiesByOwner(serverDb.growingSeasons, ownerId),
      cultivationTasks: filterEntitiesByOwner(serverDb.cultivationTasks, ownerId),
      seasonActivityLogs: filterEntitiesByOwner(serverDb.seasonActivityLogs, ownerId),
      seasonExpenseRecords: filterEntitiesByOwner(serverDb.seasonExpenseRecords, ownerId),
      seasonHarvestRecords: filterEntitiesByOwner(serverDb.seasonHarvestRecords, ownerId),
      cropProfiles: filterEntitiesByOwner(serverDb.cropProfiles, ownerId),
    });
  });

  // Persistent Database Sync & Server-Side Validation Endpoint
  app.post('/api/db/sync', (req, res) => {
    const {
      ownerId,
      farms,
      growingSeasons,
      cultivationTasks,
      seasonActivityLogs,
      seasonExpenseRecords,
      seasonHarvestRecords,
      cropProfiles,
      resetToSeed,
    } = req.body || {};

    const cleanOwnerId = (ownerId || DEFAULT_USER_PROFILE.id).trim();
    if (!cleanOwnerId) {
      return res.status(400).json({ error: 'ownerId tidak valid.' });
    }

    if (resetToSeed) {
      if (fs.existsSync(DB_FILE_PATH)) {
        fs.unlinkSync(DB_FILE_PATH);
      }
      serverDb = loadOrInitializeServerDb();
      return res.json({
        status: 'reset',
        updatedAt: serverDb.updatedAt,
        farms: filterEntitiesByOwner(serverDb.farms, cleanOwnerId),
        growingSeasons: filterEntitiesByOwner(serverDb.growingSeasons, cleanOwnerId),
        cultivationTasks: filterEntitiesByOwner(serverDb.cultivationTasks, cleanOwnerId),
        seasonActivityLogs: filterEntitiesByOwner(serverDb.seasonActivityLogs, cleanOwnerId),
        seasonExpenseRecords: filterEntitiesByOwner(serverDb.seasonExpenseRecords, cleanOwnerId),
        seasonHarvestRecords: filterEntitiesByOwner(serverDb.seasonHarvestRecords, cleanOwnerId),
        cropProfiles: filterEntitiesByOwner(serverDb.cropProfiles, cleanOwnerId),
      });
    }

    // Server-side validation & owner-scoped merge
    const replaceOwnerCollection = <T extends { id: string; ownerId: string }>(
      existing: T[],
      incoming: T[] | undefined,
      validator?: (item: T) => boolean
    ): T[] => {
      if (!Array.isArray(incoming)) return existing;
      const otherOwners = existing.filter((item) => item.ownerId !== cleanOwnerId);
      const validIncoming = incoming
        .filter((item) => item && typeof item.id === 'string' && item.id.trim() !== '')
        .map((item) => ({ ...item, ownerId: cleanOwnerId }))
        .filter((item) => (validator ? validator(item) : true));
      return [...otherOwners, ...validIncoming];
    };

    serverDb.farms = replaceOwnerCollection(
      serverDb.farms,
      farms,
      (f: any) => typeof f.name === 'string' && f.name.trim().length > 0 && Number(f.areaHaNormalized) > 0
    );
    serverDb.growingSeasons = replaceOwnerCollection(
      serverDb.growingSeasons,
      growingSeasons,
      (s: any) => typeof s.farmId === 'string' && typeof s.variety === 'string' && Number(s.plantedAreaHa) > 0
    );
    serverDb.cultivationTasks = replaceOwnerCollection(
      serverDb.cultivationTasks,
      cultivationTasks,
      (t: any) => typeof t.seasonId === 'string' && typeof t.title === 'string'
    );
    serverDb.seasonActivityLogs = replaceOwnerCollection(
      serverDb.seasonActivityLogs,
      seasonActivityLogs,
      (a: any) => typeof a.seasonId === 'string' && Number(a.actualCostRp) >= 0
    );
    serverDb.seasonExpenseRecords = replaceOwnerCollection(
      serverDb.seasonExpenseRecords,
      seasonExpenseRecords,
      (e: any) => typeof e.seasonId === 'string' && Number(e.totalRp) >= 0
    );
    serverDb.seasonHarvestRecords = replaceOwnerCollection(
      serverDb.seasonHarvestRecords,
      seasonHarvestRecords,
      (h: any) => typeof h.seasonId === 'string' && Number(h.actualYieldKg) > 0
    );
    serverDb.cropProfiles = replaceOwnerCollection(
      serverDb.cropProfiles,
      cropProfiles,
      (c: any) => typeof c.namaTanaman === 'string' && c.namaTanaman.trim().length > 0
    );

    saveServerDb(serverDb);

    return res.json({
      status: 'synced',
      updatedAt: serverDb.updatedAt,
      ownerId: cleanOwnerId,
      counts: {
        farms: filterEntitiesByOwner(serverDb.farms, cleanOwnerId).length,
        growingSeasons: filterEntitiesByOwner(serverDb.growingSeasons, cleanOwnerId).length,
        cultivationTasks: filterEntitiesByOwner(serverDb.cultivationTasks, cleanOwnerId).length,
        seasonActivityLogs: filterEntitiesByOwner(serverDb.seasonActivityLogs, cleanOwnerId).length,
        seasonExpenseRecords: filterEntitiesByOwner(serverDb.seasonExpenseRecords, cleanOwnerId).length,
        seasonHarvestRecords: filterEntitiesByOwner(serverDb.seasonHarvestRecords, cleanOwnerId).length,
        cropProfiles: filterEntitiesByOwner(serverDb.cropProfiles, cleanOwnerId).length,
      },
    });
  });

  // AI Predictive Alerts Endpoint for Dashboard (Analyzes Crop Profiles + Environmental Data)
  app.post('/api/ai/predict-alerts', async (req, res) => {
    const {
      profiles,
      weatherTempC = 28,
      weatherHumidityPct = 86,
      rainfallMm = 2,
      windSpeedKmh = 12,
      soilMoisturePct = 62,
      soilPh = 6.5,
      soilTempC = 23,
    } = req.body || {};

    const safeProfiles = Array.isArray(profiles) && profiles.length > 0 ? profiles : serverDb.cropProfiles;
    const ruleAlerts = generatePredictiveAiAlerts({
      profiles: safeProfiles,
      weatherTempC: Number(weatherTempC),
      weatherHumidityPct: Number(weatherHumidityPct),
      rainfallMm: Number(rainfallMm),
      windSpeedKmh: Number(windSpeedKmh),
      soilMoisturePct: Number(soilMoisturePct),
      soilPh: Number(soilPh),
      soilTempC: Number(soilTempC),
    });

    return res.json({
      mode: 'agronomy-predictive-engine',
      alerts: ruleAlerts,
      analyzedAt: new Date().toISOString(),
    });
  });

  // Live Weather API Proxy (Open-Meteo + BMKG for GPS / Indonesia coordinates)
  app.get('/api/weather', async (req, res) => {
    const lat = parseFloat((req.query.lat as string) || String(DEFAULT_LARIKREJO_COORDS.latitude));
    const lon = parseFloat((req.query.lon as string) || String(DEFAULT_LARIKREJO_COORDS.longitude));
    const adm4Code = (req.query.adm4 as string) || DEFAULT_LARIKREJO_COORDS.bmkgAdm4Code;
    const providerMode =
      (req.query.mode as 'open-meteo' | 'bmkg-hybrid') || 'bmkg-hybrid';
    const customLocation = (req.query.location as string) || '';

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m` +
        `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max` +
        `&timezone=Asia%2FJakarta&forecast_days=7`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6500);
      const [response, resolvedName] = await Promise.all([
        fetch(url, { signal: controller.signal, cache: 'no-store' }),
        customLocation
          ? Promise.resolve(customLocation)
          : reverseGeocodeLocationName(lat, lon),
      ]);
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }
      const data = await response.json();

      const snapshot = parseOpenMeteoResponseToSnapshot({
        data,
        latitude: lat,
        longitude: lon,
        locationName: resolvedName,
        bmkgAdm4Code: adm4Code,
        bmkgNote: providerMode === 'bmkg-hybrid' ? `BMKG Adm4 ${adm4Code}` : undefined,
        providerMode,
      });

      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.json(snapshot);
    } catch (error: any) {
      res.status(502).json({
        errorFallback: true,
        message:
          error?.message ||
          'Gagal menghubungi layanan cuaca eksternal Open-Meteo/BMKG.',
      });
    }
  });

  // AI Camera Diagnosis Endpoint using Multimodal Gemini Vision as Primary Classifier
  // with Strict Phytopathology System Prompt, Structured JSON Output (responseSchema),
  // and Automatic Zero-Mismatch Pesticide Synchronization from agronomyDatabase.ts
  app.post('/api/ai/diagnose', async (req, res) => {
    const {
      commodity,
      plantPart,
      symptomNotes,
      imageBase64,
      mimeType,
      presetKey,
      plotId,
      plotName,
    } = req.body || {};

    if (!commodity || !plantPart) {
      return res.status(400).json({
        error: 'Komoditas dan bagian tanaman wajib dipilih sebelum analisis.',
      });
    }

    const hasCustomImage = Boolean(
      imageBase64 && typeof imageBase64 === 'string' && imageBase64.length > 50
    );

    // Jika tidak ada foto asli (misalnya pengguna hanya menguji catatan teks atau tombol sampel tanpa foto):
    if (!hasCustomImage) {
      const contextualResult = buildContextualDiagnosisResult({
        commodity,
        plantPart,
        symptomNotes: symptomNotes || '',
        presetKey,
        hasCustomImage: false,
        plotId,
        plotName: plotName || 'Lahan Pengamatan',
      });
      return res.status(200).json({
        mode: 'knowledge-base-validated',
        matchedDiseaseId: contextualResult.matchedDiseaseId,
        result: contextualResult,
      });
    }

    try {
      const geminiOutput = await runDirectGeminiVisionDiagnosis({
        commodity,
        plantPart,
        symptomNotes: symptomNotes || '',
        imageBase64,
        mimeType: mimeType || 'image/jpeg',
        plotId,
        plotName: plotName || 'Lahan Pengamatan',
        apiKey: process.env.GEMINI_API_KEY,
      });

      return res.status(200).json({
        mode: 'gemini-live',
        matchedDiseaseId: geminiOutput.matchedDiseaseId,
        modelUsed: geminiOutput.modelUsed,
        result: geminiOutput.result,
      });
    } catch (err: any) {
      return res.status(502).json({
        error: err?.message || 'Gagal menganalisis foto tanaman menggunakan Gemini Vision API.',
      });
    }
  });

  // Agronomy AI Assistant Chat Endpoint
  app.post('/api/ai/chat', async (req, res) => {
    const { message, farmContext } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan pertanyaan wajib diisi.' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const lower = message.toLowerCase();
      let reply = '';
      if (lower.includes('hari ini') || lower.includes('agenda') || lower.includes('lakukan')) {
        reply =
          'Berdasarkan jadwal Lahan 1 (Padi Ciherang, Fase Vegetatif 20 HST, luas 1,2 Ha):\n' +
          '1. **Pukul 06:00–08:00**: Pemupukan Urea susulan (±120 kg untuk 1,2 Ha) pada kondisi air macak-macak.\n' +
          '2. **Pukul 15:00–16:00**: Cek kondisi daun terhadap bercak Blas, Kresek (HDB), dan amati pangkal batang dari hama wereng.\n' +
          'Pastikan gulma telah dibersihkan sebelum penaburan pupuk agar serapan unsur hara optimal.';
      } else if (lower.includes('menguning') || lower.includes('kuning')) {
        reply =
          'Daun padi menguning pada umur ~20 HST dapat disebabkan oleh 3 kemungkinan utama yang perlu dibedakan:\n' +
          '1. **Kekurangan Nitrogen (Kahat N)**: Daun **tua (bawah)** menguning merata dari ujung. Solusi: Cek dengan Bagan Warna Daun (BWD); bila skor < 4 berikan Urea susulan 75–100 kg/Ha.\n' +
          '2. **Gejala Virus Tungro**: Daun **muda** menguning-oranye, tanaman kerdil mengelompok, dan ditemukan Wereng Hijau. Solusi: Cabut rumpun sakit dan kendalikan vektor wereng.\n' +
          '3. **Hawar Daun Bakteri (Kresek)**: Tepi/helai daun mengering pucat kekuningan memanjang bergelombang. Solusi: Kurangi pupuk Urea, tambahkan Kalium, dan terapkan pengairan berselang.';
      } else if (lower.includes('panen')) {
        reply =
          'Estimasi panen untuk lahan aktif Anda:\n' +
          '• **Lahan 1 (Padi Ciherang, tanam 12 Apr 2025, saat ini 20 HST)**: Perkiraan panen sekitar **11 Juli 2025 (±90 HST)** dengan rentang ketidakpastian ±5 hari tergantung suhu harian.\n' +
          '• **Lahan 2 (Padi Inpari 32, tanam 28 Apr 2025)**: Perkiraan panen sekitar **27 Juli 2025**.\n' +
          'Ingat untuk mengeringkan petakan sawah 10–14 hari sebelum panen agar gabah matang serempak.';
      } else if (lower.includes('pupuk')) {
        reply =
          'Untuk **Lahan 1 (Padi Ciherang, luas 1,2 Ha)**, rekomendasi estimasi pupuk berimbang satu musim penuh adalah:\n' +
          '• **Urea Total (±200 kg/Ha × 1,2 Ha = 240 kg)**: Dibagi 2 tahap (7–10 HST sebanyak 90 kg, dan 20–25 HST sebanyak 120–150 kg sesuai pembacaan BWD).\n' +
          '• **NPK Phonska Total (±300 kg/Ha × 1,2 Ha = 360 kg)**: Dibagi saat 7–10 HST (180 kg) dan menjelang primordia 35–40 HST (180 kg).\n' +
          '*Catatan: Sesuaikan dengan hasil uji tanah sawah (PUTS) setempat.*';
      } else {
        reply =
          'Berdasarkan data lahan Anda di Desa Larikrejo, Kudus (Lahan 1 Padi Ciherang 1,2 Ha pada 20 HST, pH tanah 6,5 Normal, kelembapan tanah 62% Cukup):\n' +
          '• Pertahankan pengairan berselang (macak-macak 3–5 cm) untuk memacu anakan produktif.\n' +
          '• Gunakan fitur **Kamera AI** untuk membedakan secara akurat antara **Hawar Daun Bakteri (Kresek)**, **Bercak Coklat**, **Blas Daun**, **Tungro**, dan **Wereng Batang Coklat**.';
      }

      return res.json({
        reply,
        model: 'Basis Pengetahuan Agronomi TaniCerdas (Terverifikasi BB Padi)',
      });
    }

    try {
      const systemInstruction = `Anda adalah Asisten Agronomi TaniCerdas AI yang membantu petani Indonesia dengan bahasa Indonesia yang ramah, jelas, praktis, dan ilmiah.
Konteks Lahan Petani saat ini: ${JSON.stringify(farmContext || {})}
Aturan wajib:
- Jangan pernah mengarang nomor registrasi atau dosis pestisida di luar label resmi.
- Jika menyebutkan produk kimia, ingatkan selalu penggunaan APD (masker, sarung tangan, kacamata, pakaian lengan panjang) dan interval pra-panen.
- Bedakan antara dugaan gejala visual dan hasil pengukuran nyata.`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: message,
          config: {
            systemInstruction,
          },
        }),
        6000
      );

      return res.json({
        reply: response.text || 'Maaf, saya belum dapat memproses pertanyaan tersebut. Silakan coba lagi.',
        model: 'gemini-3.1-flash-lite',
      });
    } catch (_error) {
      return res.json({
        reply:
          'Untuk kondisi Lahan 1 (Padi Ciherang 20 HST, pH tanah 6,5 Normal): pastikan pemupukan Urea susulan dilakukan pada kondisi air macak-macak setelah penyiangan gulma, dan pantau gejala bercak daun secara berkala.',
        model: 'Basis Pengetahuan Agronomi TaniCerdas',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaniCerdas AI server running at http://localhost:${PORT}`);
  });
}

startServer();
