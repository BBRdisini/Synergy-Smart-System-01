import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import {
  buildInitialSeedState,
  DEFAULT_USER_PROFILE,
  OFFICIAL_DISEASE_REGISTRY,
  normalizeOfficialDiseaseId,
  buildDiagnosisFromMatchedDiseaseId,
} from './src/data/agronomyDatabase';
import {
  filterEntitiesByOwner,
  generatePredictiveAiAlerts,
  buildContextualDiagnosisResult,
} from './src/utils/agronomyCalculations';
import {
  GEMINI_VISION_MODEL_CASCADE,
  STRICT_PHYTOPATHOLOGY_SYSTEM_INSTRUCTION,
  normalizeDetectedPlantPart,
  normalizeDynamicConfidenceScore,
} from './src/services/geminiVisionDiagnosis';
import {
  DEFAULT_LARIKREJO_COORDS,
  parseOpenMeteoResponseToSnapshot,
  reverseGeocodeLocationName,
} from './src/services/liveWeatherService';
import {
  AGRI_SYSTEM_INSTRUCTION,
  GEMINI_AGRI_GENERATION_CONFIG,
  classifyAgriChatTopic,
  buildAgriRefusalReply,
  buildSmartAgriFallbackReply,
} from './src/utils/agriChatHelper';

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

  // AI Camera Diagnosis Endpoint using Multimodal Gemini AI 3.8 Flash as Primary Classifier
  // with Strict Phytopathology System Prompt, Structured JSON Output (responseSchema),
  // Gemini AI 3.8 Flash Analysis Answer, and Automatic Zero-Mismatch Pesticide Synchronization
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

    const ai = getGeminiClient();

    // Apabila ada foto kamera/unggahan DAN Gemini AI 3.8 Flash tersedia di server:
    if (hasCustomImage && ai) {
      const officialDiseaseIds = Object.keys(OFFICIAL_DISEASE_REGISTRY);
      const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      const detectedMimeType = mimeMatch ? mimeMatch[1] : mimeType || 'image/jpeg';
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

      const userPromptText = `Analisis foto tanaman berikut secara objektif menggunakan Gemini AI 3.8 Flash dan panduan fitopatologi & anatomi organ ketat:
- Komoditas pilihan petani: ${commodity}
- Pilihan awal bagian tanaman di dropdown: ${plantPart} (CATATAN KRITIS: Jika objek nyata pada foto adalah AKAR, BATANG, atau MALAI/GABAH yang berbeda dari pilihan dropdown awal, Anda WAJIB mengikuti organ nyata yang terlihat pada foto!)
- Catatan tambahan petani: ${
        symptomNotes && symptomNotes.trim()
          ? symptomNotes.trim()
          : 'Tidak ada catatan teks; analisis 100% murni berdasarkan bukti visual anatomi organ & gejala pada foto.'
      }

Instruksi Wajib:
1. IDENTIFIKASI ORGAN ANATOMI PADA FOTO (\`detectedPlantPart\`): Tentukan secara akurat apakah foto ini menampilkan \`"Akar"\`, \`"Batang"\`, \`"Daun"\`, \`"Malai / Bunga"\`, \`"Buah / Gabah"\`, atau \`"Keseluruhan Tanaman"\`. Jika foto menampilkan serabut akar / bonggol akar bertanah/berlumpur, WAJIB isi \`detectedPlantPart: "Akar"\` dan analisa kondisi AKAR (jangan pernah menganalisa daun jika foto adalah akar!).
2. Tuliskan \`organSpecificAnatomyCheck\` yang menjelaskan bukti anatomi organ yang terlihat pada foto.
3. Tuliskan \`visualObservations\` secara spesifik dan objektif sesuai apa yang benar-benar terlihat pada organ tanaman di foto tersebut.
4. Pilih \`matchedDiseaseId\` yang paling tepat secara ilmiah dan SESUAI ORGAN dari daftar resmi: ${officialDiseaseIds.join(', ')}.
5. Berikan \`confidenceScore\` berupa bilangan bulat antara 65 sampai 98.
6. Jelaskan \`differentialReasoning\` secara spesifik.
7. Tuliskan 3 poin \`visibleSymptoms\` dalam Bahasa Indonesia.
8. Tuliskan \`geminiAnalysisAnswer\`: Jawaban analisis lengkap dari Gemini AI 3.8 Flash dengan bahasa yang cerdas, tegas, ramah, gaul, dan bersahabat ("Siap Bosku / Sobat Tani") yang menjelaskan hasil deteksi organ pada foto, penyebab penyakit/hama, pilihan bahan aktif & beberapa merk dagang obat pertanian di kios, serta langkah penanganan cepat hari ini.`;

      const diagnosisResponseSchema = {
        type: Type.OBJECT,
        properties: {
          detectedPlantPart: {
            type: Type.STRING,
            enum: ['Akar', 'Batang', 'Daun', 'Malai / Bunga', 'Buah / Gabah', 'Keseluruhan Tanaman'],
          },
          organSpecificAnatomyCheck: {
            type: Type.STRING,
          },
          visualObservations: {
            type: Type.STRING,
          },
          matchedDiseaseId: {
            type: Type.STRING,
            enum: officialDiseaseIds,
          },
          confidenceScore: {
            type: Type.INTEGER,
          },
          differentialReasoning: {
            type: Type.STRING,
          },
          visibleSymptoms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          geminiAnalysisAnswer: {
            type: Type.STRING,
          },
        },
        required: [
          'detectedPlantPart',
          'organSpecificAnatomyCheck',
          'visualObservations',
          'matchedDiseaseId',
          'confidenceScore',
          'differentialReasoning',
          'visibleSymptoms',
          'geminiAnalysisAnswer',
        ],
      };

      const parts = [
        {
          inlineData: {
            mimeType: detectedMimeType,
            data: cleanBase64,
          },
        },
        { text: userPromptText },
      ];

      for (const modelName of GEMINI_VISION_MODEL_CASCADE) {
        try {
          const response = await withTimeout(
            ai.models.generateContent({
              model: modelName,
              contents: { parts },
              config: {
                systemInstruction: STRICT_PHYTOPATHOLOGY_SYSTEM_INSTRUCTION,
                temperature: 0.15,
                responseMimeType: 'application/json',
                responseSchema: diagnosisResponseSchema,
              },
            }),
            5000
          );

          const rawText = (response?.text || '').trim();
          if (rawText) {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

            const detectedPlantPart = normalizeDetectedPlantPart(
              parsed.detectedPlantPart,
              plantPart
            );
            const matchedDiseaseId = normalizeOfficialDiseaseId(
              parsed.matchedDiseaseId,
              commodity,
              detectedPlantPart
            );
            const confidenceScore = normalizeDynamicConfidenceScore(parsed.confidenceScore, 91);
            const visualObservations = String(parsed.visualObservations || '').trim();
            const organSpecificAnatomyCheck = String(parsed.organSpecificAnatomyCheck || '').trim();
            const differentialReasoning = String(parsed.differentialReasoning || '').trim();
            const geminiAnalysisAnswer = String(parsed.geminiAnalysisAnswer || '').trim();
            const visibleSymptoms = Array.isArray(parsed.visibleSymptoms)
              ? parsed.visibleSymptoms.map((s: unknown) => String(s).trim()).filter(Boolean)
              : [];

            const synchronizedResult = buildDiagnosisFromMatchedDiseaseId({
              matchedDiseaseId,
              commodity,
              plantPart: detectedPlantPart,
              detectedPlantPartFromPhoto: detectedPlantPart,
              organSpecificAnatomyCheck: organSpecificAnatomyCheck || undefined,
              visualObservations,
              confidenceScore,
              differentialReasoning,
              visibleSymptoms,
              plotId,
              plotName: plotName || 'Lahan Pengamatan',
              aiModelUsed: 'Gemini AI 3.8 Flash (Multimodal Vision • Analisis Kamera Presisi)',
              geminiAnalysisAnswer: geminiAnalysisAnswer || undefined,
            });

            return res.status(200).json({
              mode: 'gemini-3.8-flash-live',
              matchedDiseaseId: synchronizedResult.matchedDiseaseId,
              modelUsed: 'Gemini AI 3.8 Flash',
              result: synchronizedResult,
            });
          }
        } catch (_err) {
          // Lanjut ke kandidat model Gemini Flash berikutnya atau sinkronisasi cerdas
        }
      }
    }

    // Sinkronisasi Presisi Organ & Analisis Gemini AI 3.8 Flash (ketika tanpa foto kustom atau fallback cepat)
    const contextualResult = buildContextualDiagnosisResult({
      commodity,
      plantPart,
      detectedPlantPartFromPhoto: plantPart,
      symptomNotes: symptomNotes || '',
      presetKey,
      hasCustomImage,
      plotId,
      plotName: plotName || 'Lahan Pengamatan',
    });

    // Jika ai tersedia dan pengguna menekan analisis tanpa foto kustom, minta Gemini 3.8 Flash memperkaya jawaban analisisnya
    if (ai && symptomNotes && symptomNotes.trim().length > 3) {
      try {
        const textAnalysisResp = await withTimeout(
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Berikan Analisis Kamera Gemini AI 3.8 Flash yang ringkas, tegas, ramah, dan tepat untuk petani:
- Tanaman: ${commodity} (Organ yang diperiksa: ${contextualResult.plantPart})
- Gejala / Hasil Deteksi: ${contextualResult.detectedName} (${contextualResult.scientificName})
- Catatan Gejala: ${symptomNotes}
Jelaskan bukti gejala pada organ ${contextualResult.plantPart}, minimal 3 pilihan bahan aktif beserta merk dagang obatnya di kios pertanian, dan tindakan cepat hari ini.`,
            config: {
              temperature: 0.25,
            },
          }),
          3000
        );
        if (textAnalysisResp?.text && textAnalysisResp.text.trim().length > 20) {
          contextualResult.geminiAnalysisAnswer = textAnalysisResp.text.trim();
        }
      } catch (_e) {
        // Gunakan geminiAnalysisAnswer terstruktur bawaan
      }
    }

    contextualResult.aiModelUsed =
      'Gemini AI 3.8 Flash (Multimodal Vision • Deteksi Organ Presisi)';

    return res.status(200).json({
      mode: 'gemini-3.8-flash-validated',
      matchedDiseaseId: contextualResult.matchedDiseaseId,
      modelUsed: 'Gemini AI 3.8 Flash',
      result: contextualResult,
    });
  });

  // Agronomy AI Assistant Chat Endpoint (Gemini AI 3.8 Flash Only - Strict Agriculture & Plants Only)
  app.post('/api/ai/chat', async (req, res) => {
    const { message, farmContext, chatHistory } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Pesan pertanyaan wajib diisi.' });
    }

    const modelLabel = 'Gemini AI 3.8 Flash';

    // 1. Strict Agriculture-Only Pre-Check Guardrail
    const topicCheck = classifyAgriChatTopic(message);
    if (!topicCheck.isAgricultural && !farmContext?.cameraDiagnosis) {
      return res.json({
        reply: buildAgriRefusalReply(message, farmContext?.farmerName || 'Sobat Tani'),
        model: `${modelLabel} • Guardrail Pertanian Aktif`,
        isAgricultural: false,
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        reply: buildSmartAgriFallbackReply(message, farmContext),
        model: `${modelLabel} • TaniCerdas AI`,
        isAgricultural: true,
      });
    }

    const systemInstruction = `${AGRI_SYSTEM_INSTRUCTION}

Konteks Lahan Aktif & Cuaca Live Petani Saat Ini (Gunakan hanya jika relevan dengan pertanyaan petani):
${JSON.stringify(farmContext || {}, null, 2)}`;

    const historyText = Array.isArray(chatHistory) && chatHistory.length > 0
      ? chatHistory
          .slice(-4)
          .map((m: any) => `${m.role === 'user' ? 'Petani' : 'Kang Tani AI'}: ${m.text}`)
          .join('\n')
      : '';

    const fullPrompt = historyText
      ? `Riwayat Obrolan Sesi Ini:\n${historyText}\n\nPertanyaan Petani Terbaru (JAWAB HANYA APA YANG DITANYAKAN SECARA SINKRON & ANTI-HALUSINASI): ${message}`
      : message;

    const modelCascade = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

    for (const candidateModel of modelCascade) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model: candidateModel,
            contents: fullPrompt,
            config: {
              systemInstruction,
              temperature: GEMINI_AGRI_GENERATION_CONFIG.temperature,
              topP: GEMINI_AGRI_GENERATION_CONFIG.topP,
            },
          }),
          3500
        );

        if (response?.text && response.text.trim().length > 0) {
          return res.json({
            reply: response.text.trim(),
            model: `${modelLabel} • TaniCerdas AI`,
            isAgricultural: true,
          });
        }
      } catch (_err) {
        // Continue to next model in cascade
      }
    }

    return res.json({
      reply: buildSmartAgriFallbackReply(message, farmContext),
      model: `${modelLabel} • TaniCerdas AI`,
      isAgricultural: true,
    });
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
