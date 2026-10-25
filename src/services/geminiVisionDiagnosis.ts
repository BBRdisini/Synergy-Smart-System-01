import { GoogleGenAI, Type } from '@google/genai';
import { CommodityType, DiagnosisResult, OfficialDiseaseId } from '../types/agronomy';
import {
  buildDiagnosisFromMatchedDiseaseId,
  normalizeOfficialDiseaseId,
  OFFICIAL_DISEASE_REGISTRY,
} from '../data/agronomyDatabase';

/**
 * Daftar model Multimodal Gemini Vision aktif dengan fallback berjenjang
 * agar analisis gambar nyata tetap berjalan 100% meskipun salah satu model mengalami lonjakan trafik (503/429).
 */
export const GEMINI_VISION_MODEL_CASCADE = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3-flash-preview',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-flash-lite-latest',
] as const;

export const STRICT_PHYTOPATHOLOGY_SYSTEM_INSTRUCTION = `Anda adalah Doktor Ahli Fitopatologi & Entomologi Pertanian Indonesia (Standar Balai Besar Penelitian Tanaman Padi / BB Padi Kementan RI).
Tugas utama Anda adalah menganalisis gambar nyata tanaman (baik foto jarak dekat/makro 1 helai daun/batang/malai MAUPUN foto skala hamparan/rumpun padi di sawah) secara objektif dan akurat murni berdasarkan morfologi visual pada foto tanaman.

ATURAN KRITIS ANTI-HALUSINASI TANGKAPAN LAYAR (SCREENSHOT):
- Apabila gambar yang diunggah pengguna adalah tangkapan layar (screenshot) antarmuka aplikasi (misalnya terlihat bingkai kotak viewfinder kamera di sebelah kiri dan kartu teks hasil diagnosis di sebelah kanan yang bertuliskan "Penyakit Blas Daun (Pyricularia oryzae)" / "Keyakinan Visual: 93%"), TEKS DI SEBELAH KANAN TERSEBUT ADALAH TEKS UI LAMA YANG SALAH!
- DILARANG KERAS menyalin, membaca, atau terpengaruh oleh teks "Penyakit Blas Daun" di luar foto tanaman!
- Anda WAJIB 100% HANYA mengamati foto objek tanaman/daun/sawah di dalam bingkai foto!
  * Jika di dalam foto tanaman terlihat helai daun dengan jalur/lesi memanjang berwarna kuning pucat/putih jerami mengering sepanjang tepi atau helai daun (tanpa bercak mata belah ketupat kecil), pilih \`"kresek_hdb"\` (Hawar Daun Bakteri / Kresek) atau \`"hama_putih_palsu"\`!
  * Jika di dalam foto tanaman terlihat hamparan rumpun padi mengering coklat kemerahan seperti terbakar (hopperburn), pilih \`"wereng_batang_coklat"\`!

PANDUAN IDENTIFIKASI VISUAL KETAT (SKALA MAKRO DAUN & SKALA HAMPARAN SAWAH):
1. **Wereng Batang Coklat / WBC & Hopperburn (Nilaparvata lugens)** -> pilih \`"wereng_batang_coklat"\`:
   - **Skala Hamparan / Rumpun Sawah**: Hamparan atau kelompok rumpun padi tampak **menguning lalu mengering coklat kemerahan/kecoklatan seperti terbakar (hopperburn)**, daun dan batang rebah/mengering parah dari bagian bawah ke atas.
   - **Skala Jarak Dekat**: Pangkal batang coklat kehitaman disertai gejala mengering terbakar (hopperburn) atau tampak koloni nimfa/imago wereng coklat di pangkal batang.
2. **Hawar Daun Bakteri / Kresek (Xanthomonas oryzae pv. oryzae)** -> pilih \`"kresek_hdb"\`:
   - **Skala Dekat**: Lesi atau jalur memanjang bergelombang warna **kuning jerami hingga putih pucat mengering** dimulai dari **tepi, ujung, atau sepanjang helai daun** menuju ke arah pangkal.
   - **Skala Hamparan**: Tajuk daun bagian atas/ujung tampak mengering kuning jerami pucat merata akibat gesekan angin/hujan.
3. **Bercak Coklat (Bipolaris oryzae)** -> pilih \`"bercak_coklat"\`:
   - **Bintik-bintik oval/bulat kecil coklat tua merata seperti biji wijen** (sering disertai halo kuning tipis) tersebar di helai daun **TANPA pusat abu-abu berbentuk belah ketupat**.
4. **Hawar Pelepah (Rhizoctonia solani)** -> pilih \`"hawar_pelepah"\`:
   - **Bercak besar oval tidak beraturan** warna abu-abu kehijauan dengan tepi coklat tua menyerupai **belang kulit ular** pada pelepah atau daun bawah.
5. **Bercak Coklat Sempit (Cercospora janseana)** -> pilih \`"bercak_coklat_sempit"\`:
   - Garis-garis pendek sangat sempit (lebar 1-1.5 mm) berwarna coklat kemerahan sejajar tulang daun.
6. **Hama Putih Palsu / Pelipat Daun (Cnaphalocrocis medinalis)** -> pilih \`"hama_putih_palsu"\`:
   - Daun terlipat memanjang atau terdapat **alur garis putih transparan memanjang sejajar tulang daun** akibat jaringan klorofil dikerok ulat.
7. **Tungro (Rice Tungro Virus)** -> pilih \`"tungro"\`:
   - Daun **menguning-oranye cerah** dimulai dari ujung daun muda, tanaman tampak kerdil mengelompok di hamparan sawah, tanpa bercak jamur.
8. **Sundep / Beluk — Penggerek Batang Padi (Scirpophaga incertulas)** -> pilih \`"sundep_beluk"\`:
   - Pucuk daun tengah menggulung kering mati pada fase vegetatif (Sundep) atau malai keluar putih hampa berdiri tegak di hamparan sawah (Beluk).
9. **Defisiensi Nitrogen / Kahat N** -> pilih \`"kahat_n"\`:
   - Daun **menguning pucat hingga hijau kekuningan seragam** (terutama daun tua/bawah) tanpa lesi/bercak nekrotik dan tanpa pengeringan terbakar.
10. **Defisiensi Kalium / Keracunan Besi (Kahat K / Fe)** -> pilih \`"kahat_k_fe"\`:
    - Tepi daun tua mengering kecoklatan atau muncul bintik coklat kemerahan halus (bronzing) dari ujung daun tua.
11. **Blas Daun (Pyricularia oryzae)** -> pilih \`"blas_daun"\`:
    - **DILARANG KERAS memilih \`"blas_daun"\` sebagai tebakan default atau karena membaca teks UI pada screenshot!**
    - HANYA pilih \`"blas_daun"\` apabila pada foto daun benar-benar terlihat jelas **bercak spesifik berbentuk belah ketupat / mata (meruncing di kedua ujung)** dengan **tepi coklat tua** dan **pusat abu-abu keputihan**. Jika lesi berupa garis/jalur memanjang kuning pucat/putih sepanjang helai daun, pilih \`"kresek_hdb"\` atau \`"hama_putih_palsu"\`, BUKAN \`"blas_daun"\`!
12. **Antraknosa / Patek Cabai (Colletotrichum spp.)** -> pilih \`"antraknosa_cabai"\`:
    - Lesi cekung melingkar konsentris berwarna coklat kehitaman pada buah/daun cabai.
13. **Hawar Daun / Bulai Jagung** -> pilih \`"hawar_daun_jagung"\`:
    - Lesi elips memanjang kecoklatan atau garis klorotik sejajar tulang daun pada tanaman jagung.
14. **Tanaman Sehat** -> pilih \`"tanaman_sehat"\`:
    - Helai daun atau hamparan tanaman tampak hijau segar merata tanpa bercak penyakit dan tanpa kerusakan hama.`;

export interface GeminiVisionDiagnosisInput {
  commodity: CommodityType;
  plantPart: DiagnosisResult['plantPart'];
  symptomNotes?: string;
  imageBase64: string;
  mimeType?: string;
  plotId?: string;
  plotName?: string;
  apiKey?: string;
}

export interface GeminiVisionDiagnosisOutput {
  matchedDiseaseId: OfficialDiseaseId;
  confidenceScore: number;
  visualObservations: string;
  differentialReasoning: string;
  visibleSymptoms: string[];
  modelUsed: string;
  result: DiagnosisResult;
}

/**
 * Menormalkan skor keyakinan dari Gemini (mendukung skala 0.0-1.0 maupun 0-100)
 * tanpa pernah memaksa ke angka statis 93%.
 */
export function normalizeDynamicConfidenceScore(rawScore: unknown, fallbackPct = 88): number {
  const num = Number(rawScore);
  if (!Number.isFinite(num) || num <= 0) {
    return fallbackPct;
  }
  const scaled = num <= 1 ? Math.round(num * 100) : Math.round(num);
  return Math.min(99, Math.max(55, scaled));
}

/**
 * Memanggil SDK resmi `@google/genai` secara langsung dengan gambar base64 (inlineData)
 * dan skema JSON terstruktur (`responseSchema`).
 */
export async function runDirectGeminiVisionDiagnosis(
  input: GeminiVisionDiagnosisInput
): Promise<GeminiVisionDiagnosisOutput> {
  const resolvedApiKey =
    input.apiKey ||
    (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : undefined);

  if (!resolvedApiKey || resolvedApiKey === 'MY_GEMINI_API_KEY' || resolvedApiKey.trim().length < 8) {
    throw new Error('GEMINI_API_KEY tidak ditemukan atau belum dikonfigurasi.');
  }

  if (!input.imageBase64 || input.imageBase64.trim().length < 50) {
    throw new Error('Data gambar (base64) kosong atau tidak valid untuk dianalisis oleh Gemini Vision.');
  }

  const isServerRuntime = typeof window === 'undefined';
  const ai = new GoogleGenAI(
    isServerRuntime
      ? {
          apiKey: resolvedApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        }
      : {
          apiKey: resolvedApiKey,
        }
  );

  const officialDiseaseIds = Object.keys(OFFICIAL_DISEASE_REGISTRY);
  const mimeMatch = input.imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const detectedMimeType = mimeMatch ? mimeMatch[1] : input.mimeType || 'image/jpeg';
  const cleanBase64 = input.imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

  const userPromptText = `Analisis foto tanaman berikut secara objektif menggunakan panduan fitopatologi ketat di atas:
- Komoditas: ${input.commodity}
- Bagian tanaman yang diamati: ${input.plantPart}
- Catatan tambahan petani: ${
    input.symptomNotes && input.symptomNotes.trim()
      ? input.symptomNotes.trim()
      : 'Tidak ada catatan teks; analisis 100% murni berdasarkan bukti visual tanaman pada foto.'
  }

Instruksi Wajib:
1. PERINGATAN SCREENSHOT: Jika gambar yang diunggah ini adalah tangkapan layar aplikasi yang memuat panel UI di sebelah kanan bertuliskan "Penyakit Blas Daun (Pyricularia oryzae)", ABAIKAN TOTAL teks UI di sebelah kanan tersebut karena itu adalah teks statis yang salah! Amati HANYA foto tanaman di dalam kotak viewfinder di sebelah kiri!
2. Tuliskan \`visualObservations\` secara spesifik dan objektif sesuai apa yang benar-benar terlihat pada foto tanaman (warna daun/rumpun, apakah berupa lesi jalur memanjang kuning pucat/putih atau pengeringan hamparan hopperburn, lokasi kerusakan).
3. Pilih \`matchedDiseaseId\` yang paling tepat secara ilmiah dari daftar resmi: ${officialDiseaseIds.join(', ')}. JANGAN memilih \`blas_daun\` apabila lesi pada daun berbentuk jalur/garis memanjang pucat mengering (pilih \`kresek_hdb\` atau \`hama_putih_palsu\`) atau hamparan mengering terbakar (pilih \`wereng_batang_coklat\`)!
4. Berikan \`confidenceScore\` berupa bilangan bulat antara 65 sampai 98 yang mencerminkan tingkat keyakinan visual nyata pada foto ini.
5. Jelaskan \`differentialReasoning\` secara spesifik: mengapa gejala pada foto tanaman ini didiagnosis sebagai \`matchedDiseaseId\` tersebut dan BUKAN penyakit/hama lain yang mirip (seperti Blas Daun).
6. Tuliskan 3 poin \`visibleSymptoms\` dalam Bahasa Indonesia yang merangkum ciri visual nyata pada foto tanaman ini.`;

  const diagnosisResponseSchema = {
    type: Type.OBJECT,
    properties: {
      visualObservations: {
        type: Type.STRING,
        description:
          'Deskripsi objektif morfologi gejala pada foto (bentuk lesi atau pola kerusakan hamparan rumpun, warna tepi/pusat, lokasi pada daun/pelepah/pangkal batang/hamparan sawah).',
      },
      matchedDiseaseId: {
        type: Type.STRING,
        enum: officialDiseaseIds,
        description:
          'ID penyakit/hama resmi yang paling cocok secara ilmiah dari OFFICIAL_DISEASE_REGISTRY di agronomyDatabase.ts.',
      },
      confidenceScore: {
        type: Type.INTEGER,
        description: 'Tingkat keyakinan diagnosis berupa bilangan bulat dalam rentang 65-98.',
      },
      differentialReasoning: {
        type: Type.STRING,
        description:
          'Alasan spesifik mengapa foto tersebut didiagnosis sebagai penyakit/hama terpilih dan bukan penyakit/hama lain yang mirip.',
      },
      visibleSymptoms: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '3 poin gejala visual spesifik yang terlihat langsung pada foto.',
      },
    },
    required: [
      'visualObservations',
      'matchedDiseaseId',
      'confidenceScore',
      'differentialReasoning',
      'visibleSymptoms',
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

  const errors: string[] = [];

  for (const modelName of GEMINI_VISION_MODEL_CASCADE) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          systemInstruction: STRICT_PHYTOPATHOLOGY_SYSTEM_INSTRUCTION,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: diagnosisResponseSchema,
        },
      });

      const rawText = (response.text || '').trim();
      if (!rawText) {
        throw new Error(`Respons kosong dari model ${modelName}`);
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

      const matchedDiseaseId = normalizeOfficialDiseaseId(
        parsed.matchedDiseaseId,
        input.commodity
      );
      const confidenceScore = normalizeDynamicConfidenceScore(parsed.confidenceScore, 88);
      const visualObservations = String(parsed.visualObservations || '').trim();
      const differentialReasoning = String(parsed.differentialReasoning || '').trim();
      const visibleSymptoms = Array.isArray(parsed.visibleSymptoms)
        ? parsed.visibleSymptoms.map((s: unknown) => String(s).trim()).filter(Boolean)
        : [];

      const synchronizedResult = buildDiagnosisFromMatchedDiseaseId({
        matchedDiseaseId,
        commodity: input.commodity,
        plantPart: input.plantPart,
        visualObservations,
        confidenceScore,
        differentialReasoning,
        visibleSymptoms,
        plotId: input.plotId,
        plotName: input.plotName || 'Lahan Pengamatan',
        aiModelUsed: `${modelName} (Multimodal Gemini Vision Fitopatologi)`,
      });

      return {
        matchedDiseaseId,
        confidenceScore,
        visualObservations: synchronizedResult.visualObservations || visualObservations,
        differentialReasoning: synchronizedResult.differentialReasoning || differentialReasoning,
        visibleSymptoms: synchronizedResult.visibleSymptoms,
        modelUsed: modelName,
        result: synchronizedResult,
      };
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`${modelName}: ${msg.slice(0, 120)}`);
    }
  }

  throw new Error(
    `Seluruh model Gemini Vision gagal merespons (${errors.slice(0, 2).join(' | ')})`
  );
}

/**
 * Helper utama untuk Frontend (`CameraDiagnosisView.tsx`):
 * 1. Memanggil langsung SDK `@google/genai` dari sisi client (menggunakan `process.env.GEMINI_API_KEY`).
 * 2. Apabila panggilan langsung dari browser terkendala, otomatis meneruskan ke endpoint `/api/ai/diagnose` di `server.ts`.
 * 3. JIKA KEDUANYA GAGAL, melempar Error asli agar UI menampilkan pesan error jujur — TIDAK PERNAH memalsukan hasil ke `blas_daun` 93%!
 */
export async function diagnosePlantWithGeminiClientOrServer(
  input: GeminiVisionDiagnosisInput
): Promise<GeminiVisionDiagnosisOutput> {
  let clientErrorMsg = '';

  // 1. Coba panggil langsung @google/genai dari frontend terlebih dahulu
  try {
    return await runDirectGeminiVisionDiagnosis(input);
  } catch (clientErr: any) {
    clientErrorMsg = clientErr?.message || String(clientErr);
  }

  // 2. Fallback ke server endpoint /api/ai/diagnose yang juga menjalankan Gemini Vision SDK
  const response = await fetch('/api/ai/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commodity: input.commodity,
      plantPart: input.plantPart,
      symptomNotes: input.symptomNotes || '',
      imageBase64: input.imageBase64,
      mimeType: input.mimeType || 'image/jpeg',
      plotId: input.plotId,
      plotName: input.plotName || 'Lahan Pengamatan',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error || !data.result) {
    const serverErrorMsg = data?.error || `HTTP ${response.status}`;
    throw new Error(
      `Gagal menganalisis gambar melalui Gemini Vision API. Detail Client: ${clientErrorMsg} | Detail Server: ${serverErrorMsg}`
    );
  }

  return {
    matchedDiseaseId: data.matchedDiseaseId || data.result.matchedDiseaseId,
    confidenceScore: data.result.confidencePct,
    visualObservations: data.result.visualObservations || '',
    differentialReasoning: data.result.differentialReasoning || '',
    visibleSymptoms: data.result.visibleSymptoms || [],
    modelUsed: data.modelUsed || data.result.aiModelUsed || 'Gemini Vision API',
    result: data.result,
  };
}
