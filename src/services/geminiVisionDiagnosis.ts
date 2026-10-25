import { CommodityType, DiagnosisResult, OfficialDiseaseId } from '../types/agronomy';

/**
 * Daftar model Multimodal Gemini Vision aktif (Hanya keluarga Gemini 3.8 Flash sesuai spesifikasi aplikasi).
 */
export const GEMINI_VISION_MODEL_CASCADE = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
] as const;

export const STRICT_PHYTOPATHOLOGY_SYSTEM_INSTRUCTION = `Anda adalah Doktor Ahli Fitopatologi, Fisiologi Perakaran & Entomologi Pertanian Indonesia (Standar Balai Besar Penelitian Tanaman Padi / BB Padi Kementan RI) yang ditenagai oleh Gemini AI 3.8 Flash.
Tugas utama Anda adalah menganalisis gambar nyata tanaman (baik foto makro AKAR yang dicabut, PANGKAL BATANG/PELEPAH, HELAI DAUN, MALAI/GABAH, maupun foto skala HAMPARAN SAWAH) secara objektif dan presisi 100% sesuai organ anatomi yang tampak pada foto, lalu memberikan Jawaban Analisis Gemini AI 3.8 Flash yang cerdas, tegas, ramah, dan tepat.

ATURAN KRITIS #1 — DETEKSI PRESISI ORGAN TANAMAN (AKAR vs BATANG vs DAUN vs MALAI/GABAH):
- Langkah pertama yang WAJIB Anda lakukan adalah mengidentifikasi organ tanaman apa yang sedang difoto (\`detectedPlantPart\`): \`"Akar"\`, \`"Batang"\`, \`"Daun"\`, \`"Malai / Bunga"\`, \`"Buah / Gabah"\`, atau \`"Keseluruhan Tanaman"\`.
- **APABILA FOTO MENAMPILKAN AKAR TANAMAN (serabut akar, bonggol perakaran yang dicabut dari lumpur/tanah, akar berwarna hitam/coklat karat atau putih)**:
  * Anda WAJIB menetapkan \`detectedPlantPart: "Akar"\` (meskipun pengguna lupa mengubah dropdown di aplikasi dan masih memilih "Daun")!
  * DILARANG KERAS menganalisis foto AKAR sebagai penyakit DAUN (seperti Blas Daun, Kresek, atau Bercak Coklat)!
  * Untuk foto AKAR, pilih HANYA salah satu dari ID diagnosis akar berikut:
    1) \`"busuk_akar_keracunan_besi"\` — jika serabut akar tampak menghitam pekat (endapan FeS/H₂S), berlumpur anaerobik bau belerang, atau terselubung kerak karat coklat kemerahan (plak besi Fe³⁺) dan akar lembek/minim akar rambut putih.
    2) \`"hama_akar_orong_nematoda"\` — jika serabut akar tampak terpotong/putus akibat gigitan Orong-Orong (*Gryllotalpa*) / Uret (*Phyllophaga*), atau terdapat bintil-bintil bengkak/puru (*gall* pengait ujung akar) akibat Nematoda Puru Akar (*Meloidogyne graminicola*).
    3) \`"akar_sehat_optimal"\` — jika sistem perakaran tampak lebat, serabut akar baru berwarna putih kekuningan bersih hingga coklat muda sehat, kokoh, tanpa pembusukan hitam maupun puru.
- **APABILA FOTO MENAMPILKAN MALAI / BUNGA ATAU BULIR BUAH / GABAH**:
  * Tetapkan \`detectedPlantPart: "Malai / Bunga"\` atau \`"Buah / Gabah"\`.
  * Pilih diagnosis spesifik organ malai/gabah: \`"blas_leher_malai"\` (leher malai menghitam/patah leher), \`"walang_sangit_gabah"\` (bulir gabah bernoda coklat bekas tusukan hisapan walang sangit / hampa sebagian), \`"kotor_bulir_gabah"\` (kulit gabah bernoda hitam/coklat kusam akibat kompleks jamur), \`"sundep_beluk"\` (malai putih hampa tegak / Beluk), atau \`"antraknosa_cabai"\` (buah cabai patek).
- **APABILA FOTO MENAMPILKAN PANGKAL BATANG / PELEPAH**:
  * Tetapkan \`detectedPlantPart: "Batang"\`.
  * Pilih diagnosis spesifik batang/pelepah: \`"wereng_batang_coklat"\` (koloni wereng atau pangkal batang coklat kehitaman/hopperburn), \`"hawar_pelepah"\` (bercak besar belang kulit ular pada pelepah), atau \`"sundep_beluk"\` (lubang gerek batang / pucuk mati).

ATURAN KRITIS #2 — ANTI-HALUSINASI TANGKAPAN LAYAR (SCREENSHOT):
- Apabila gambar yang diunggah pengguna adalah tangkapan layar (screenshot) antarmuka aplikasi, DILARANG KERAS menyalin teks lama di luar foto tanaman!
- Anda WAJIB 100% HANYA mengamati foto objek tanaman (akar/batang/daun/malai/sawah) di dalam bingkai foto!

PANDUAN IDENTIFIKASI VISUAL LENGKAP BERDASARKAN ORGAN TANAMAN:
A. **ORGAN AKAR (\`detectedPlantPart: "Akar"\`)**:
   1. \`"busuk_akar_keracunan_besi"\`: Serabut akar menghitam pekat (FeS/H₂S), lembek membusuk, atau dilapisi kerak coklat kemerahan tebal akibat toksisitas besi (Fe²⁺) di lahan sawah tergenang terus-menerus / masam.
   2. \`"hama_akar_orong_nematoda"\`: Pangkal/serabut akar putus tergigit serangga tanah (Orong-orong / Uret) atau ujung akar membengkak membentuk bintil puru/kait (Nematoda *Meloidogyne graminicola*).
   3. \`"akar_sehat_optimal"\`: Serabut akar putih bersih kekuningan, gondrong/lebat, panjang dan aktif menyerap hara.

B. **ORGAN BATANG / PELEPAH (\`detectedPlantPart: "Batang"\`)**:
   4. \`"wereng_batang_coklat"\`: Koloni nimfa/imago wereng di pangkal batang atau rumpun padi mengering coklat kemerahan terbakar (*hopperburn*).
   5. \`"hawar_pelepah"\`: Bercak besar oval abu-abu kehijauan bertepi coklat tua menyerupai belang kulit ular pada pelepah batang (*Rhizoctonia solani*).
   6. \`"sundep_beluk"\`: Lubang gerek pada batang bawah, anakan tengah menggulung kering mati (Sundep) dan mudah dicabut.

C. **ORGAN MALAI / BUNGA & BUAH / GABAH (\`detectedPlantPart: "Malai / Bunga"\` atau \`"Buah / Gabah"\`)**:
   7. \`"blas_leher_malai"\`: Buku leher malai (*neck node*) membusuk coklat kehitaman keabu-abuan dan patah sehingga seluruh malai hampa.
   8. \`"walang_sangit_gabah"\`: Hama Walang Sangit (*Leptocorisa oratorius*) pada malai atau bercak coklat bekas tusukan pada bulir gabah fase masak susu yang membuat gabah kempes/berkapur.
   9. \`"kotor_bulir_gabah"\`: Kulit bulir gabah bernoda coklat tua/hitam kusam tidak merata menjelang panen (*Grain Discoloration*).
   10. \`"antraknosa_cabai"\`: Lesi cekung melingkar konsentris hitam/oranye pada buah cabai (Patek).

D. **ORGAN DAUN & HAMPARAN TAJUK (\`detectedPlantPart: "Daun"\` atau \`"Keseluruhan Tanaman"\`)**:
   11. \`"kresek_hdb"\`: Lesi/jalur memanjang bergelombang warna kuning jerami hingga putih pucat mengering dari tepi atau ujung helai daun (*Xanthomonas oryzae*).
   12. \`"bercak_coklat"\`: Bintik-bintik oval/bulat kecil coklat tua merata seperti biji wijen (*Bipolaris oryzae*) tanpa pusat abu-abu belah ketupat.
   13. \`"bercak_coklat_sempit"\`: Garis-garis pendek sangat sempit coklat kemerahan sejajar tulang daun (*Cercospora janseana*).
   14. \`"hama_putih_palsu"\`: Daun terlipat memanjang atau alur garis putih transparan memanjang akibat klorofil dikerok ulat (*Cnaphalocrocis medinalis*).
   15. \`"tungro"\`: Daun muda menguning-oranye cerah disertai tanaman kerdil mengelompok (*Rice Tungro Virus*).
   16. \`"kahat_n"\`: Daun tua/bawah menguning pucat seragam berbentuk huruf V dari ujung daun tanpa bercak penyakit.
   17. \`"kahat_k_fe"\`: Tepi daun tua mengering kecoklatan atau bintik karat coklat kemerahan (*bronzing*) pada helai daun tua.
   18. \`"blas_daun"\`: HANYA pilih jika pada helai daun benar-benar tampak bercak spesifik berbentuk **belah ketupat / mata** (meruncing di kedua ujung) dengan tepi coklat tua dan pusat abu-abu keputihan.
   19. \`"hawar_daun_jagung"\`: Lesi elips memanjang kecoklatan atau garis klorotik bulai pada daun jagung.
   20. \`"tanaman_sehat"\`: Helai daun/rumpun hijau segar merata (skor BWD 4) tanpa gejala hama/penyakit.`;

export interface GeminiVisionDiagnosisInput {
  commodity: CommodityType;
  plantPart: DiagnosisResult['plantPart'];
  symptomNotes?: string;
  imageBase64?: string;
  mimeType?: string;
  presetKey?: string;
  plotId?: string;
  plotName?: string;
}

export interface GeminiVisionDiagnosisOutput {
  matchedDiseaseId: OfficialDiseaseId;
  detectedPlantPart: DiagnosisResult['plantPart'];
  organSpecificAnatomyCheck: string;
  confidenceScore: number;
  visualObservations: string;
  differentialReasoning: string;
  visibleSymptoms: string[];
  geminiAnalysisAnswer: string;
  modelUsed: string;
  result: DiagnosisResult;
}

/**
 * Menormalkan skor keyakinan dari Gemini AI 3.8 Flash (mendukung skala 0.0-1.0 maupun 0-100)
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

export function normalizeDetectedPlantPart(
  rawPart: unknown,
  fallbackPart: DiagnosisResult['plantPart']
): DiagnosisResult['plantPart'] {
  const clean = String(rawPart || '').trim().toLowerCase();
  if (clean.includes('akar') || clean.includes('root')) return 'Akar';
  if (clean.includes('batang') || clean.includes('pelepah') || clean.includes('stem')) return 'Batang';
  if (clean.includes('malai') || clean.includes('bunga') || clean.includes('panicle')) return 'Malai / Bunga';
  if (clean.includes('buah') || clean.includes('gabah') || clean.includes('bulir') || clean.includes('grain')) return 'Buah / Gabah';
  if (clean.includes('keseluruhan') || clean.includes('hamparan')) return 'Keseluruhan Tanaman';
  if (clean.includes('daun') || clean.includes('leaf')) return 'Daun';
  return fallbackPart;
}

/**
 * Menghubungkan Kamera AI (CameraDiagnosisView.tsx) ke endpoint server `/api/ai/diagnose`
 * yang ditenagai oleh Gemini AI 3.8 Flash.
 */
export async function diagnosePlantWithGeminiClientOrServer(
  input: GeminiVisionDiagnosisInput
): Promise<GeminiVisionDiagnosisOutput> {
  const response = await fetch('/api/ai/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commodity: input.commodity,
      plantPart: input.plantPart,
      symptomNotes: input.symptomNotes || '',
      imageBase64: input.imageBase64 || '',
      mimeType: input.mimeType || 'image/jpeg',
      presetKey: input.presetKey,
      plotId: input.plotId,
      plotName: input.plotName || 'Lahan Pengamatan',
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error || !data.result) {
    const serverErrorMsg = data?.error || `HTTP ${response.status}`;
    throw new Error(
      `Gagal menganalisis gambar melalui Gemini AI 3.8 Flash. Detail Server: ${serverErrorMsg}`
    );
  }

  return {
    matchedDiseaseId: data.matchedDiseaseId || data.result.matchedDiseaseId,
    detectedPlantPart: data.result.detectedPlantPartFromPhoto || data.result.plantPart,
    organSpecificAnatomyCheck: data.result.organSpecificAnatomyCheck || '',
    confidenceScore: data.result.confidencePct,
    visualObservations: data.result.visualObservations || '',
    differentialReasoning: data.result.differentialReasoning || '',
    visibleSymptoms: data.result.visibleSymptoms || [],
    geminiAnalysisAnswer: data.result.geminiAnalysisAnswer || '',
    modelUsed: data.modelUsed || data.result.aiModelUsed || 'Gemini AI 3.8 Flash',
    result: data.result,
  };
}
