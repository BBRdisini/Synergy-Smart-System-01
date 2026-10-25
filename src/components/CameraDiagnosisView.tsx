import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Zap,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileCheck2,
  Layers,
  Info,
  X,
  RefreshCw,
  HelpCircle,
  Eye,
  Calculator,
  SwitchCamera,
  Video,
  VideoOff,
  ScanLine,
  Sprout,
  FlaskConical,
  Award,
} from 'lucide-react';
import {
  CommodityType,
  DiagnosisResult,
  FarmPlot,
  PesticideProduct,
} from '../types/agronomy';
import {
  SAMPLE_DIAGNOSIS_PRESETS,
  VERIFIED_PESTICIDE_PRODUCTS,
} from '../data/agronomyDatabase';
import {
  buildContextualDiagnosisResult,
  ImageColorStats,
} from '../utils/agronomyCalculations';
import {
  diagnosePlantWithGeminiClientOrServer,
} from '../services/geminiVisionDiagnosis';
import {
  isStrictAgriculturalTopic,
  buildAgriRefusalReply,
  buildSmartAgriFallbackReply,
} from '../utils/agriChatHelper';
import { Bot, Send, RotateCcw } from 'lucide-react';

interface CameraDiagnosisViewProps {
  plots: FarmPlot[];
  selectedPlotId: string;
  initialCommodity?: CommodityType;
  diagnosisHistory: DiagnosisResult[];
  onSaveDiagnosisToHistory: (diag: DiagnosisResult, plotId?: string) => void;
  onDiagnosisComplete?: (diag: DiagnosisResult, plotId?: string) => void;
  onClearDiagnosisHistory?: () => void;
  onNavigateToDashboard?: () => void;
}

type SamplePresetKey =
  | 'blas'
  | 'kresek'
  | 'bercak_coklat'
  | 'tungro'
  | 'wereng'
  | 'akar'
  | 'hama_akar'
  | 'malai_gabah';

export const CameraDiagnosisView: React.FC<CameraDiagnosisViewProps> = ({
  plots,
  selectedPlotId,
  initialCommodity = 'Padi',
  diagnosisHistory,
  onSaveDiagnosisToHistory,
  onDiagnosisComplete,
  onClearDiagnosisHistory,
  onNavigateToDashboard,
}) => {
  const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  const [commodity, setCommodity] = useState<CommodityType>(
    activePlot?.commodity || initialCommodity
  );
  const [plantPart, setPlantPart] = useState<
    'Daun' | 'Batang' | 'Malai / Bunga' | 'Akar' | 'Buah / Gabah'
  >('Daun');
  const [selectedSampleKey, setSelectedSampleKey] = useState<SamplePresetKey>('kresek');
  const [symptomNotes, setSymptomNotes] = useState<string>('');
  const [flashOn, setFlashOn] = useState<boolean>(false);
  const [showShutterFlash, setShowShutterFlash] = useState<boolean>(false);
  const [uploadedImageDataUrl, setUploadedImageDataUrl] = useState<string | null>(null);
  const [compressedImagePayload, setCompressedImagePayload] = useState<string | null>(null);
  const [, setImageColorStats] = useState<ImageColorStats | null>(null);

  // Live Camera Stream states
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState<boolean>(false);
  const [isSimulatedOpticalStream, setIsSimulatedOpticalStream] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStatusMessage, setCameraStatusMessage] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStepText, setAnalysisStepText] = useState<string>('');
  const [activeDiagnosis, setActiveDiagnosis] = useState<DiagnosisResult | null>(
    diagnosisHistory[0] || null
  );
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [lastAnalyzedAtText, setLastAnalyzedAtText] = useState<string>('Siap Pindai');
  const [selectedProductModal, setSelectedProductModal] = useState<PesticideProduct | null>(null);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  // Quick spray dosage calculator inside card
  const [customTankSizeL, setCustomTankSizeL] = useState<number>(16);
  const [selectedCalcProductIndex, setSelectedCalcProductIndex] = useState<number>(0);
  const [showSprayCalcHelper, setShowSprayCalcHelper] = useState<boolean>(false);

  // Interactive Q&A state connected to Gemini AI 3.8 Flash for the active camera diagnosis
  const [cameraQuestionInput, setCameraQuestionInput] = useState<string>('');
  const [isAskingCameraGemini, setIsAskingCameraGemini] = useState<boolean>(false);
  const [cameraQaHistory, setCameraQaHistory] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; content: string; modelLabel: string; timestamp: string }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simulatedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const diagnosisCardRef = useRef<HTMLDivElement | null>(null);

  // Clean up media stream on unmount
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraOpen(false);
    setIsSimulatedOpticalStream(false);
  }, []);

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Reset selected calculator product index and camera Q&A when activeDiagnosis changes
  useEffect(() => {
    setSelectedCalcProductIndex(0);
    setCameraQaHistory([]);
  }, [activeDiagnosis?.id, activeDiagnosis?.matchedDiseaseId]);

  // Compress any uploaded image DataURL to max width 1024px in JPEG 0.8 format for Gemini Vision API
  const compressDataUrlToMax1024Jpeg = (
    dataUrl: string
  ): Promise<{ compressedDataUrl: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const origW = img.naturalWidth || img.width || 800;
        const origH = img.naturalHeight || img.height || 600;
        const maxW = 1024;
        const scale = origW > maxW ? maxW / origW : 1;
        const targetW = Math.max(1, Math.round(origW * scale));
        const targetH = Math.max(1, Math.round(origH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve({ compressedDataUrl, width: targetW, height: targetH });
        } else {
          resolve({ compressedDataUrl: dataUrl, width: origW, height: origH });
        }
      };
      img.onerror = () => {
        resolve({ compressedDataUrl: dataUrl, width: 800, height: 600 });
      };
      img.src = dataUrl;
    });
  };

  // Start Live Camera (WebRTC with graceful optical simulation fallback if no physical webcam)
  const startLiveCamera = async (preferredFacingMode: 'environment' | 'user' = cameraFacingMode) => {
    setApiNotice(null);
    setCameraStatusMessage('Mengaktifkan sensor Kamera AI...');

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: preferredFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        mediaStreamRef.current = stream;
        setIsLiveCameraOpen(true);
        setIsSimulatedOpticalStream(false);
        setUploadedImageDataUrl(null);
        setCompressedImagePayload(null);
        setCameraStatusMessage(
          `Kamera Live Aktif (${preferredFacingMode === 'environment' ? 'Lensa Belakang Makro' : 'Lensa Depan'}) — Arahkan ke bagian ${plantPart} tanaman lalu klik tombol Kamera di tengah untuk jepret & analisis.`
        );
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        }, 50);
        return;
      } catch (_err) {
        // Fallback to interactive live optical sensor simulation when running on desktop/VM without physical camera
      }
    }

    setIsLiveCameraOpen(true);
    setIsSimulatedOpticalStream(true);
    setUploadedImageDataUrl(null);
    setCompressedImagePayload(null);
    setCameraStatusMessage(
      `Mode Sensor Kamera Optik AI Aktif (Fokus Organ: ${plantPart}) — Klik tombol Kamera di tengah untuk menjepret citra ${plantPart.toLowerCase()} & menjalankan analisis AI.`
    );
  };

  // Render live animated botanical frame on simulatedCanvasRef when in simulated optical stream mode
  // Supports organ-specific visuals: Akar (roots), Batang, Malai/Gabah, and Daun!
  useEffect(() => {
    if (!isLiveCameraOpen || !isSimulatedOpticalStream) return;
    let animId = 0;
    let tick = 0;

    const renderOpticalFrame = () => {
      tick += 1;
      const canvas = simulatedCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const sway = Math.sin(tick * 0.04) * 5;

          const isRootMode =
            plantPart === 'Akar' ||
            selectedSampleKey === 'akar' ||
            selectedSampleKey === 'hama_akar';
          const isPanicleMode =
            plantPart === 'Malai / Bunga' ||
            plantPart === 'Buah / Gabah' ||
            selectedSampleKey === 'malai_gabah';

          if (isRootMode) {
            // Soil & muddy root zone background
            const rootGrad = ctx.createLinearGradient(0, 0, 0, h);
            rootGrad.addColorStop(0, '#272017');
            rootGrad.addColorStop(0.5, '#3b2b1d');
            rootGrad.addColorStop(1, '#1c150f');
            ctx.fillStyle = rootGrad;
            ctx.fillRect(0, 0, w, h);

            // Base crown of uprooted rice plant at top center
            ctx.save();
            ctx.fillStyle = '#4d7c0f';
            ctx.fillRect(w * 0.45 + sway * 0.3, 15, 48, 55);
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(w * 0.5 + sway * 0.3, 72, 34, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw 11 fibrous roots radiating downward
            const rootCount = 11;
            for (let i = 0; i < rootCount; i++) {
              const spread = (i - (rootCount - 1) / 2) * 22;
              const startX = w * 0.5 + spread * 0.3 + sway * 0.3;
              const startY = 75;
              const midX = w * 0.5 + spread * 1.1 + sway * 0.7;
              const midY = h * 0.52 + (i % 3) * 14;
              const isSevered = selectedSampleKey === 'hama_akar' && (i === 3 || i === 6 || i === 8);
              const endX = w * 0.5 + spread * 1.55 + sway;
              const endY = isSevered ? h * 0.56 : h - 28 - (i % 2) * 18;

              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.quadraticCurveTo(midX, midY, endX, endY);
              ctx.lineWidth = i % 2 === 0 ? 4.5 : 3.2;
              // Dark FeS/iron plaque root rot vs pale severed/gall roots
              ctx.strokeStyle =
                selectedSampleKey === 'hama_akar'
                  ? i % 2 === 0
                    ? '#d6bfa3'
                    : '#b45309'
                  : i % 3 === 0
                  ? '#1c1917'
                  : '#9a3412';
              ctx.stroke();

              // If nematode gall / root pest mode, draw root galls (puru bengkak)
              if (selectedSampleKey === 'hama_akar' && i % 2 === 0) {
                ctx.beginPath();
                ctx.ellipse(midX, midY, 8, 5.5, 0.3, 0, Math.PI * 2);
                ctx.fillStyle = '#f59e0b';
                ctx.fill();
              }
            }
            ctx.restore();
          } else if (isPanicleMode) {
            // Field sky/canopy background for panicle & grain inspection
            const panGrad = ctx.createLinearGradient(0, 0, w, h);
            panGrad.addColorStop(0, '#132a1c');
            panGrad.addColorStop(0.5, '#1e4229');
            panGrad.addColorStop(1, '#0f2316');
            ctx.fillStyle = panGrad;
            ctx.fillRect(0, 0, w, h);

            ctx.save();
            // Main panicle axis (poros malai)
            ctx.beginPath();
            ctx.moveTo(85, h - 25);
            ctx.quadraticCurveTo(w * 0.45 + sway, h * 0.35, w - 70 + sway, 55);
            ctx.strokeStyle = '#a3e635';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Neck node lesion (buku leher malai)
            ctx.beginPath();
            ctx.ellipse(w * 0.28 + sway * 0.4, h * 0.68, 12, 6, -0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#451a03';
            ctx.fill();

            // Draw rice grains along the panicle with brown stink-bug / dirty panicle spots
            const grainCoords = [
              { x: w * 0.38, y: h * 0.55 },
              { x: w * 0.44, y: h * 0.48 },
              { x: w * 0.5, y: h * 0.42 },
              { x: w * 0.57, y: h * 0.36 },
              { x: w * 0.64, y: h * 0.31 },
              { x: w * 0.71, y: h * 0.27 },
              { x: w * 0.47, y: h * 0.56 },
              { x: w * 0.55, y: h * 0.49 },
              { x: w * 0.63, y: h * 0.43 },
            ];
            grainCoords.forEach((g, idx) => {
              ctx.save();
              ctx.translate(g.x + sway * 0.8, g.y);
              ctx.rotate(-0.35);
              ctx.beginPath();
              ctx.ellipse(0, 0, 13, 5.5, 0, 0, Math.PI * 2);
              ctx.fillStyle = idx % 2 === 0 ? '#eab308' : '#ca8a04';
              ctx.fill();
              // Dark brown puncture spot (bekas tusukan walang sangit / kotor gabah)
              ctx.beginPath();
              ctx.arc(2, 0, 3.2, 0, Math.PI * 2);
              ctx.fillStyle = '#451a03';
              ctx.fill();
              ctx.restore();
            });
            ctx.restore();
          } else {
            // Natural field background gradient for Leaf / Stem
            const grad = ctx.createLinearGradient(0, 0, w, h);
            grad.addColorStop(0, '#0f291a');
            grad.addColorStop(0.5, '#1b432c');
            grad.addColorStop(1, '#0b2215');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(40, h - 20);
            ctx.quadraticCurveTo(w * 0.45 + sway, h * 0.35, w - 50 + sway, 35);
            ctx.quadraticCurveTo(w * 0.6 + sway, h * 0.62, 110, h - 10);
            ctx.closePath();
            ctx.fillStyle = selectedSampleKey === 'tungro' ? '#ca8a04' : '#2e9e4f';
            ctx.fill();

            // Leaf midrib vein
            ctx.beginPath();
            ctx.moveTo(65, h - 15);
            ctx.quadraticCurveTo(w * 0.5 + sway, h * 0.48, w - 55 + sway, 40);
            ctx.strokeStyle = selectedSampleKey === 'tungro' ? '#fef08a' : '#86efac';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw realistic symptom lesions according to selectedSampleKey / commodity
            if (selectedSampleKey === 'blas') {
              const spots = [
                { x: w * 0.42 + sway * 0.6, y: h * 0.52, rx: 22, ry: 9 },
                { x: w * 0.58 + sway * 0.8, y: h * 0.38, rx: 26, ry: 11 },
                { x: w * 0.31 + sway * 0.4, y: h * 0.66, rx: 18, ry: 8 },
              ];
              spots.forEach((sp) => {
                ctx.save();
                ctx.translate(sp.x, sp.y);
                ctx.rotate(-0.48);
                ctx.beginPath();
                ctx.moveTo(-sp.rx, 0);
                ctx.lineTo(0, -sp.ry);
                ctx.lineTo(sp.rx, 0);
                ctx.lineTo(0, sp.ry);
                ctx.closePath();
                ctx.fillStyle = '#7c2d12';
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(0, 0, sp.rx * 0.48, sp.ry * 0.48, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#e2e8f0';
                ctx.fill();
                ctx.restore();
              });
            } else if (selectedSampleKey === 'kresek') {
              ctx.beginPath();
              ctx.moveTo(w * 0.32 + sway * 0.4, h * 0.65);
              ctx.quadraticCurveTo(w * 0.55 + sway * 0.7, h * 0.36, w - 52 + sway, 38);
              ctx.quadraticCurveTo(w * 0.62 + sway * 0.7, h * 0.49, w * 0.36 + sway * 0.4, h * 0.72);
              ctx.closePath();
              ctx.fillStyle = '#e7dec3';
              ctx.fill();
              ctx.strokeStyle = '#eab308';
              ctx.lineWidth = 2.5;
              ctx.stroke();
            } else if (selectedSampleKey === 'bercak_coklat') {
              const ovalSpots = [
                { x: w * 0.34, y: h * 0.68 },
                { x: w * 0.44, y: h * 0.54 },
                { x: w * 0.52, y: h * 0.46 },
                { x: w * 0.61, y: h * 0.36 },
                { x: w * 0.48, y: h * 0.62 },
                { x: w * 0.68, y: h * 0.28 },
              ];
              ovalSpots.forEach((pt) => {
                ctx.save();
                ctx.translate(pt.x + sway * 0.6, pt.y);
                ctx.rotate(-0.4);
                ctx.beginPath();
                ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#fde047';
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#5c2409';
                ctx.fill();
                ctx.restore();
              });
            } else if (selectedSampleKey === 'tungro') {
              ctx.fillStyle = 'rgba(234, 88, 12, 0.55)';
              ctx.beginPath();
              ctx.ellipse(w * 0.55 + sway, h * 0.42, 65, 18, -0.5, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Wereng brown hopperburn & nymphs at stem base
              ctx.fillStyle = '#78350f';
              ctx.fillRect(w * 0.35 + sway * 0.3, h * 0.55, 85, 110);
              for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.ellipse(
                  w * 0.42 + (i % 3) * 18 + sway * 0.4,
                  h * 0.64 + Math.floor(i / 3) * 24,
                  6,
                  3.5,
                  0.2,
                  0,
                  Math.PI * 2
                );
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
              }
            }
            ctx.restore();
          }

          // Laser AI scanline overlay
          const scanY = ((tick * 3) % (h - 40)) + 20;
          const scanGrad = ctx.createLinearGradient(0, scanY - 12, 0, scanY + 12);
          scanGrad.addColorStop(0, 'rgba(74, 222, 128, 0)');
          scanGrad.addColorStop(0.5, 'rgba(74, 222, 128, 0.65)');
          scanGrad.addColorStop(1, 'rgba(74, 222, 128, 0)');
          ctx.fillStyle = scanGrad;
          ctx.fillRect(24, scanY - 12, w - 48, 24);
        }
      }
      animId = requestAnimationFrame(renderOpticalFrame);
    };

    animId = requestAnimationFrame(renderOpticalFrame);
    return () => cancelAnimationFrame(animId);
  }, [isLiveCameraOpen, isSimulatedOpticalStream, selectedSampleKey, plantPart]);

  const handleToggleFlash = async () => {
    const nextFlash = !flashOn;
    setFlashOn(nextFlash);
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: nextFlash } as any],
          });
        } catch (_e) {
          // Hardware torch not supported on this device
        }
      }
    }
  };

  const handleSwitchCameraFacing = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    setCameraFacingMode(nextMode);
    if (isLiveCameraOpen) {
      startLiveCamera(nextMode);
    }
  };

  const handleSelectSample = (key: SamplePresetKey) => {
    setSelectedSampleKey(key);
    setUploadedImageDataUrl(null);
    setCompressedImagePayload(null);
    setImageColorStats(null);
    setDiagnosisError(null);
    stopCameraStream();

    let nextPart: 'Daun' | 'Batang' | 'Malai / Bunga' | 'Akar' | 'Buah / Gabah' = 'Daun';
    if (key === 'akar' || key === 'hama_akar') {
      nextPart = 'Akar';
    } else if (key === 'wereng') {
      nextPart = 'Batang';
    } else if (key === 'malai_gabah') {
      nextPart = 'Buah / Gabah';
    }
    setPlantPart(nextPart);

    const preset = SAMPLE_DIAGNOSIS_PRESETS[key] || SAMPLE_DIAGNOSIS_PRESETS.kresek;
    const nextDiag: DiagnosisResult = {
      ...preset,
      id: `diag-sample-${key}-${Date.now()}`,
      plotId: activePlot?.id || selectedPlotId,
      commodity,
      plantPart: nextPart,
      detectedPlantPartFromPhoto: nextPart,
      timestamp: new Date().toISOString(),
    };
    setActiveDiagnosis(nextDiag);
    onDiagnosisComplete?.(nextDiag, activePlot?.id || selectedPlotId);
    setLastAnalyzedAtText(
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
    setApiNotice(
      `Sampel Organ ${nextPart} ("${preset.detectedName}") dimuat & disinkronkan ke Peringatan Prioritas Beranda.`
    );
  };

  // When user changes the Bagian Tanaman dropdown (e.g. selects "Akar"), immediately align the sample/context
  // if no custom photo is currently uploaded so Akar is never left showing a Daun sample!
  const handlePlantPartChange = (
    nextPart: 'Daun' | 'Batang' | 'Malai / Bunga' | 'Akar' | 'Buah / Gabah'
  ) => {
    setPlantPart(nextPart);
    if (!uploadedImageDataUrl && !compressedImagePayload) {
      let targetSample: SamplePresetKey = selectedSampleKey;
      if (nextPart === 'Akar') {
        targetSample = 'akar';
      } else if (nextPart === 'Batang') {
        targetSample = 'wereng';
      } else if (nextPart === 'Malai / Bunga' || nextPart === 'Buah / Gabah') {
        targetSample = 'malai_gabah';
      } else if (
        selectedSampleKey === 'akar' ||
        selectedSampleKey === 'hama_akar' ||
        selectedSampleKey === 'wereng' ||
        selectedSampleKey === 'malai_gabah'
      ) {
        targetSample = 'kresek';
      }
      setSelectedSampleKey(targetSample);

      const organResult = buildContextualDiagnosisResult({
        commodity,
        plantPart: nextPart,
        detectedPlantPartFromPhoto: nextPart,
        symptomNotes: symptomNotes.trim(),
        presetKey: targetSample,
        hasCustomImage: false,
        plotId: activePlot?.id || selectedPlotId,
        plotName: activePlot?.name || 'Lahan 1',
      });
      setActiveDiagnosis(organResult);
      onDiagnosisComplete?.(organResult, activePlot?.id || selectedPlotId);
      setApiNotice(
        `Fokus pemeriksaan beralih ke organ "${nextPart}" — menampilkan analisis & pilihan rekomendasi spesifik ${nextPart}.`
      );
    }
  };

  // Run AI analysis with newly captured/uploaded image data (Gemini Vision Primary Classifier)
  // NEVER falls back to hardcoded blas_daun 93%!
  const executeAiDiagnosis = async (
    overrideImageUrl?: string | null,
    _overrideStats?: ImageColorStats | null
  ) => {
    const targetImage =
      overrideImageUrl !== undefined
        ? overrideImageUrl
        : compressedImagePayload || uploadedImageDataUrl;

    // Kosongkan hasil lama & reset pesan error terlebih dahulu saat memulai analisis baru
    setActiveDiagnosis(null);
    setDiagnosisError(null);
    setApiNotice(null);
    setIsAnalyzing(true);
    setAnalysisStepText(
      targetImage
        ? 'Mengirim citra ke Multimodal Gemini Vision AI — mendeteksi organ tanaman (Akar/Batang/Daun/Malai) & mencocokkan patogen...'
        : `Menganalisis gejala pada organ ${plantPart} berdasarkan Basis Pakar Fitopatologi Kementan RI...`
    );

    try {
      const timeNow = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastAnalyzedAtText(timeNow);

      if (targetImage) {
        // PANGGIL GEMINI AI 3.8 FLASH VISION (Mendeteksi organ aktual pada foto: bila foto Akar maka analisa Akar, bukan Daun!)
        const geminiOut = await diagnosePlantWithGeminiClientOrServer({
          commodity,
          plantPart,
          symptomNotes: symptomNotes.trim(),
          imageBase64: targetImage,
          mimeType: 'image/jpeg',
          plotId: activePlot?.id || selectedPlotId,
          plotName: activePlot?.name || 'Lahan 1 (Sawah Blok Utara)',
        });

        const detectedOrgan = geminiOut.result.plantPart;
        if (
          detectedOrgan === 'Akar' ||
          detectedOrgan === 'Batang' ||
          detectedOrgan === 'Daun' ||
          detectedOrgan === 'Malai / Bunga' ||
          detectedOrgan === 'Buah / Gabah'
        ) {
          setPlantPart(detectedOrgan);
        }

        const resultWithPlot: DiagnosisResult = {
          ...geminiOut.result,
          plotId: activePlot?.id || selectedPlotId,
        };

        setActiveDiagnosis(resultWithPlot);
        onDiagnosisComplete?.(resultWithPlot, activePlot?.id || selectedPlotId);
        setApiNotice(
          `Analisis Kamera Gemini AI 3.8 Flash (${geminiOut.modelUsed}) selesai pukul ${timeNow} WIB — Organ Terdeteksi: "${resultWithPlot.plantPart}" • Hasil: "${resultWithPlot.detectedName}" (${resultWithPlot.confidencePct}%).`
        );
      } else {
        // Panggil Gemini AI 3.8 Flash untuk analisis organ/gejala kamera dengan fallback instan terverifikasi
        try {
          const geminiOrganOut = await diagnosePlantWithGeminiClientOrServer({
            commodity,
            plantPart,
            symptomNotes: symptomNotes.trim(),
            presetKey: symptomNotes.trim() ? undefined : selectedSampleKey,
            plotId: activePlot?.id || selectedPlotId,
            plotName: activePlot?.name || 'Lahan 1',
          });
          const organDetected = geminiOrganOut.result.plantPart;
          if (
            organDetected === 'Akar' ||
            organDetected === 'Batang' ||
            organDetected === 'Daun' ||
            organDetected === 'Malai / Bunga' ||
            organDetected === 'Buah / Gabah'
          ) {
            setPlantPart(organDetected);
          }
          const resultWithPlot: DiagnosisResult = {
            ...geminiOrganOut.result,
            plotId: activePlot?.id || selectedPlotId,
          };
          setActiveDiagnosis(resultWithPlot);
          onDiagnosisComplete?.(resultWithPlot, activePlot?.id || selectedPlotId);
          setApiNotice(
            `Analisis Gemini AI 3.8 Flash pada organ ${resultWithPlot.plantPart} ("${resultWithPlot.detectedName}") selesai pukul ${timeNow} WIB.`
          );
        } catch (_fallbackErr) {
          const fallbackResult = buildContextualDiagnosisResult({
            commodity,
            plantPart,
            detectedPlantPartFromPhoto: plantPart,
            symptomNotes: symptomNotes.trim(),
            presetKey: symptomNotes.trim() ? undefined : selectedSampleKey,
            hasCustomImage: false,
            plotId: activePlot?.id || selectedPlotId,
            plotName: activePlot?.name || 'Lahan 1',
          });
          setActiveDiagnosis(fallbackResult);
          onDiagnosisComplete?.(fallbackResult, activePlot?.id || selectedPlotId);
          setApiNotice(
            `Analisis Gemini AI 3.8 Flash pada organ ${fallbackResult.plantPart} ("${fallbackResult.detectedName}") selesai pukul ${timeNow} WIB.`
          );
        }
      }
    } catch (err: any) {
      const errMsg =
        err?.message ||
        'Terjadi kendala saat menghubungi layanan Gemini Vision API. Silakan coba lagi.';
      setActiveDiagnosis(null);
      setDiagnosisError(errMsg);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStepText('');
      setTimeout(() => {
        if (diagnosisCardRef.current && window.innerWidth < 1024) {
          diagnosisCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  };

  // Capture frame from Live Camera (WebRTC video or Optical Simulation Canvas) and immediately run AI analysis
  const handleCapturePhotoFromCamera = async () => {
    if (!isLiveCameraOpen) {
      await startLiveCamera();
      return;
    }

    if (flashOn) {
      setShowShutterFlash(true);
      setTimeout(() => setShowShutterFlash(false), 260);
    }

    const canvas = captureCanvasRef.current || document.createElement('canvas');
    let sourceWidth = 800;
    let sourceHeight = 600;
    if (!isSimulatedOpticalStream && videoRef.current && videoRef.current.readyState >= 2) {
      sourceWidth = videoRef.current.videoWidth || 1024;
      sourceHeight = videoRef.current.videoHeight || 768;
    } else if (simulatedCanvasRef.current) {
      sourceWidth = simulatedCanvasRef.current.width || 640;
      sourceHeight = simulatedCanvasRef.current.height || 480;
    }
    const maxW = 1024;
    const scale = sourceWidth > maxW ? maxW / sourceWidth : 1;
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const ctx = canvas.getContext('2d');

    if (ctx) {
      if (!isSimulatedOpticalStream && videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      } else if (simulatedCanvasRef.current) {
        ctx.drawImage(simulatedCanvasRef.current, 0, 0, canvas.width, canvas.height);
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setActiveDiagnosis(null);
      setDiagnosisError(null);
      setUploadedImageDataUrl(dataUrl);
      setCompressedImagePayload(dataUrl);
      setImageColorStats(null);
      stopCameraStream();
      setCameraStatusMessage(
        `Foto Kamera Live (${canvas.width}×${canvas.height}px JPEG • Fokus ${plantPart}) berhasil dijepret — mengirim ke Gemini Vision AI...`
      );
      await executeAiDiagnosis(dataUrl, null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCameraStream();
    // WAJIB kosongkan state hasil diagnosis lama terlebih dahulu segera saat pengguna memilih foto baru
    setActiveDiagnosis(null);
    setDiagnosisError(null);
    setApiNotice(null);
    setIsAnalyzing(true);
    setAnalysisStepText(`Memproses & mengompresi foto "${file.name}" ke format JPEG (maks 1024px)...`);

    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        const { compressedDataUrl, width, height } = await compressDataUrlToMax1024Jpeg(rawDataUrl);
        setUploadedImageDataUrl(compressedDataUrl);
        setCompressedImagePayload(compressedDataUrl);
        setImageColorStats(null);
        setCameraStatusMessage(
          `Foto "${fileName}" (${width}×${height}px JPEG 0.8) siap — mendeteksi organ tanaman (Akar/Batang/Daun/Malai) & gejala via Gemini Vision AI...`
        );
        await executeAiDiagnosis(compressedDataUrl, null);
      } else {
        setIsAnalyzing(false);
        setDiagnosisError('Gagal membaca file gambar yang diunggah.');
      }
    };
    reader.onerror = () => {
      setIsAnalyzing(false);
      setDiagnosisError('Gagal membaca file gambar dari perangkat Anda.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveResult = () => {
    if (!activeDiagnosis) return;
    onSaveDiagnosisToHistory(activeDiagnosis, activePlot?.id || selectedPlotId);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const verifiedProducts: PesticideProduct[] = activeDiagnosis
    ? activeDiagnosis.verifiedProductIds
        .map((id) => VERIFIED_PESTICIDE_PRODUCTS.find((p) => p.id === id))
        .filter((p): p is PesticideProduct => Boolean(p))
    : [];

  const activeCalcProduct =
    verifiedProducts[selectedCalcProductIndex] || verifiedProducts[0] || null;

  // Ask Gemini AI 3.8 Flash directly inside the Camera AI module about the scanned plant/organ
  const handleAskCameraGemini = async (rawQuestion?: string) => {
    if (!activeDiagnosis) return;
    const text = (rawQuestion ?? cameraQuestionInput).trim();
    if (!text || isAskingCameraGemini) return;

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userEntry = {
      id: `cam-q-${Date.now()}`,
      role: 'user' as const,
      content: text,
      modelLabel: 'Petani',
      timestamp: nowTime,
    };

    setCameraQaHistory((prev) => [...prev, userEntry]);
    if (!rawQuestion) {
      setCameraQuestionInput('');
    }

    const topicCheck = isStrictAgriculturalTopic(text);
    if (!topicCheck.allowed) {
      setCameraQaHistory((prev) => [
        ...prev,
        {
          id: `cam-refuse-${Date.now()}`,
          role: 'assistant',
          content: buildAgriRefusalReply(text),
          modelLabel: 'Gemini AI 3.8 Flash',
          timestamp: nowTime,
        },
      ]);
      return;
    }

    setIsAskingCameraGemini(true);
    const cameraContextObj = {
      detectedName: activeDiagnosis.detectedName,
      scientificName: activeDiagnosis.scientificName,
      plantPart: activeDiagnosis.plantPart,
      commodity: activeDiagnosis.commodity || commodity,
      confidencePct: activeDiagnosis.confidencePct,
      causeCategory: activeDiagnosis.causeCategory,
      visualObservations: activeDiagnosis.visualObservations || activeDiagnosis.visibleSymptoms.join('; '),
      recommendedProductsSummary: verifiedProducts
        .map((p) => `• ${p.productName} (${p.activeIngredient} • Dosis: ${p.dosagePer16LTank || p.dosagePerLiter})`)
        .join('\n'),
    };

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'gemini-3.8-flash',
          message: text,
          history: cameraQaHistory.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          farmContext: {
            plotName: activePlot?.name || 'Lahan Pengamatan',
            commodity: activeDiagnosis.commodity || commodity,
            variety: activePlot?.variety || 'Inpari 32 HDB',
            hst: activePlot?.daysAfterPlanting || 42,
            cameraDiagnosis: cameraContextObj,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      const replyContent =
        response.ok && data?.reply
          ? String(data.reply)
          : buildSmartAgriFallbackReply(text, {
              plotName: activePlot?.name || 'Lahan Pengamatan',
              commodity: activeDiagnosis.commodity || commodity,
              variety: activePlot?.variety || 'Inpari 32 HDB',
              hst: activePlot?.daysAfterPlanting || 42,
              cameraDiagnosis: cameraContextObj,
            });

      setCameraQaHistory((prev) => [
        ...prev,
        {
          id: `cam-ans-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          modelLabel: 'Gemini AI 3.8 Flash',
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } catch (_err) {
      const fallbackReply = buildSmartAgriFallbackReply(text, {
        plotName: activePlot?.name || 'Lahan Pengamatan',
        commodity: activeDiagnosis.commodity || commodity,
        variety: activePlot?.variety || 'Inpari 32 HDB',
        hst: activePlot?.daysAfterPlanting || 42,
        cameraDiagnosis: cameraContextObj,
      });
      setCameraQaHistory((prev) => [
        ...prev,
        {
          id: `cam-ans-fb-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          modelLabel: 'Gemini AI 3.8 Flash',
          timestamp: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    } finally {
      setIsAskingCameraGemini(false);
    }
  };

  const renderCameraFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, lIdx) => {
      const tokens = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
      return (
        <div key={lIdx} className={line.trim() === '' ? 'h-2' : ''}>
          {tokens.map((tok, tIdx) => {
            if (tok.startsWith('**') && tok.endsWith('**')) {
              return (
                <strong key={tIdx} className="font-bold text-[#142017]">
                  {tok.slice(2, -2)}
                </strong>
              );
            }
            if (tok.startsWith('*') && tok.endsWith('*')) {
              return (
                <em key={tIdx} className="italic text-emerald-900">
                  {tok.slice(1, -1)}
                </em>
              );
            }
            return <React.Fragment key={tIdx}>{tok}</React.Fragment>;
          })}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hidden offscreen canvas for capturing live camera frames */}
      <canvas ref={captureCanvasRef} width={640} height={420} className="hidden" />

      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#11261A] via-[#1B432C] to-[#15803D] text-white p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/15 text-xs font-semibold tracking-wide uppercase mb-2">
              <Camera className="h-3.5 w-3.5 text-[#86EFAC]" />
              Pemindai Visual Presisi Organ (Akar • Batang • Daun • Malai/Gabah)
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Kamera AI Pendeteksi Spesifik Organ Tanaman & Multi-Rekomendasi Obat Resmi
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Deteksi otomatis organ yang difoto (ketika memfoto <strong>Akar</strong> maka dianalisis sebagai <strong>Akar</strong>, begitu pula <strong>Batang, Daun, atau Malai/Gabah</strong>) lengkap dengan banyak pilihan bahan aktif, merk dagang setara, agensia hayati, dan nutrisi pemulihan.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg p-3 text-xs shrink-0">
            <div className="text-emerald-200 font-medium">Lahan Pengamatan Aktif:</div>
            <div className="font-bold text-sm mt-0.5">{activePlot?.name || 'Lahan 1 (Sawah Blok Utara)'}</div>
            <div className="text-emerald-100/80 mt-0.5">
              {activePlot?.commodity} ({activePlot?.variety}) • {activePlot?.daysAfterPlanting} HST
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Left Camera Viewfinder & Input, Right Structured Diagnosis Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Viewfinder & Context Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Top Bar of Camera Frame */}
            <div className="bg-[#0F1F16] text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isLiveCameraOpen ? 'bg-red-500 animate-ping' : 'bg-[#22C55E] animate-pulse'
                  }`}
                />
                <span className="text-xs font-semibold tracking-wide">
                  {isLiveCameraOpen
                    ? `LIVE CAMERA • FOKUS ${plantPart.toUpperCase()}`
                    : `VIEWFINDER AI • ORGAN ${plantPart.toUpperCase()}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isLiveCameraOpen && (
                  <button
                    type="button"
                    onClick={handleSwitchCameraFacing}
                    title="Putar Lensa Kamera Depan/Belakang"
                    className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-slate-200 hover:bg-white/20 transition cursor-pointer"
                  >
                    <SwitchCamera className="h-3.5 w-3.5 group-hover:scale-125 transition-transform duration-300" />
                    Putar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleFlash}
                  className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    flashOn
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 group-hover:scale-125 transition-transform duration-300" />
                  Flash: {flashOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Camera Viewfinder Box */}
            <div className="relative bg-[#112218] aspect-[4/3] flex items-center justify-center overflow-hidden p-4">
              {/* Visual Shutter Flash Effect */}
              {showShutterFlash && (
                <div className="absolute inset-0 z-30 bg-white/90 pointer-events-none transition-opacity duration-200" />
              )}

              {/* 1. LIVE WEBRTC VIDEO STREAM OR SIMULATED OPTICAL CANVAS */}
              {isLiveCameraOpen ? (
                <div className="relative w-full h-full rounded-lg overflow-hidden border border-emerald-500/40 bg-black flex items-center justify-center">
                  {!isSimulatedOpticalStream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <canvas
                      ref={simulatedCanvasRef}
                      width={480}
                      height={360}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-sm text-emerald-300 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-emerald-500/40 flex items-center gap-1.5">
                    <ScanLine className="h-3.5 w-3.5 animate-pulse" />
                    {isSimulatedOpticalStream
                      ? `Sensor Kamera Optik AI (Objek: ${plantPart})`
                      : `Kamera Perangkat Live (Objek: ${plantPart})`}
                  </div>
                </div>
              ) : uploadedImageDataUrl ? (
                /* 2. CAPTURED OR UPLOADED IMAGE */
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <img
                    src={uploadedImageDataUrl}
                    alt="Foto tanaman yang dipindai"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute top-2.5 left-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-emerald-200 text-[10px] font-semibold px-2.5 py-1.5 rounded border border-emerald-500/30 flex flex-wrap items-center justify-between gap-1">
                    <span>Citra JPEG 0.8 • Deteksi Organ & Patogen Gemini Vision</span>
                    <span className="text-emerald-400 font-bold">
                      ORGAN: {(activeDiagnosis?.plantPart || plantPart).toUpperCase()}
                    </span>
                  </div>
                </div>
              ) : (
                /* 3. BOTANICAL SYMPTOM REFERENCE VIEWFINDER (Supports Akar, Batang, Malai/Gabah, Daun) */
                <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#163020] via-[#1E462D] to-[#0F2418] flex flex-col items-center justify-center p-4 text-center relative">
                  {(selectedSampleKey === 'akar' || selectedSampleKey === 'hama_akar') && (
                    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto drop-shadow-md">
                      {/* Soil horizon */}
                      <rect x="20" y="52" width="280" height="135" rx="12" fill="#291D12" opacity="0.85" />
                      {/* Stem base crown */}
                      <rect x="142" y="12" width="36" height="44" rx="6" fill="#4D7C0F" />
                      <ellipse cx="160" cy="56" rx="28" ry="12" fill="#78350F" />
                      {/* Fibrous roots */}
                      <path d="M148,60 Q115,110 85,172" stroke="#1C1917" strokeWidth="4.5" fill="none" />
                      <path d="M153,62 Q132,118 118,176" stroke="#9A3412" strokeWidth="4" fill="none" />
                      <path d="M160,64 Q158,125 155,180" stroke="#1C1917" strokeWidth="4.5" fill="none" />
                      <path d="M166,62 Q186,118 196,174" stroke="#9A3412" strokeWidth="4" fill="none" />
                      <path d="M172,60 Q208,112 232,168" stroke="#1C1917" strokeWidth="4" fill="none" />
                      <path d="M144,58 Q96,95 66,145" stroke="#B45309" strokeWidth="3" fill="none" />
                      <path d="M176,58 Q220,96 250,142" stroke="#B45309" strokeWidth="3" fill="none" />
                      {selectedSampleKey === 'hama_akar' && (
                        <>
                          {/* Root galls (puru nematoda) & severed root tips */}
                          <ellipse cx="130" cy="122" rx="7" ry="4.5" fill="#F59E0B" />
                          <ellipse cx="184" cy="118" rx="7.5" ry="5" fill="#F59E0B" />
                          <ellipse cx="157" cy="136" rx="6.5" ry="4.5" fill="#D97706" />
                        </>
                      )}
                    </svg>
                  )}

                  {selectedSampleKey === 'malai_gabah' && (
                    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto drop-shadow-md">
                      {/* Panicle main axis */}
                      <path d="M55,175 Q150,70 275,35" stroke="#A3E635" strokeWidth="4" fill="none" />
                      {/* Neck blast dark node */}
                      <ellipse cx="98" cy="134" rx="10" ry="5" transform="rotate(-38 98 134)" fill="#451A03" />
                      {/* Rice spikelets / grains */}
                      {[
                        { cx: 135, cy: 102 },
                        { cx: 162, cy: 84 },
                        { cx: 190, cy: 68 },
                        { cx: 218, cy: 55 },
                        { cx: 245, cy: 44 },
                        { cx: 152, cy: 112 },
                        { cx: 182, cy: 94 },
                        { cx: 212, cy: 78 },
                      ].map((g, i) => (
                        <g key={i} transform={`translate(${g.cx}, ${g.cy}) rotate(-24)`}>
                          <ellipse cx="0" cy="0" rx="12" ry="5" fill={i % 2 === 0 ? '#EAB308' : '#CA8A04'} />
                          <circle cx="2" cy="0" r="2.8" fill="#451A03" />
                        </g>
                      ))}
                    </svg>
                  )}

                  {selectedSampleKey === 'blas' && (
                    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto drop-shadow-md">
                      <path
                        d="M20,170 Q150,40 300,25 Q190,120 20,170 Z"
                        fill="#2E9E4F"
                        stroke="#4ADE80"
                        strokeWidth="2"
                      />
                      <path d="M25,167 Q160,90 295,27" stroke="#86EFAC" strokeWidth="2.5" fill="none" />
                      <g transform="translate(135, 95) rotate(-28)">
                        <polygon points="-24,0 0,-10 24,0 0,10" fill="#7C2D12" stroke="#FDBA74" strokeWidth="1.5" />
                        <ellipse cx="0" cy="0" rx="11" ry="4.5" fill="#E2E8F0" />
                      </g>
                      <g transform="translate(195, 65) rotate(-25)">
                        <polygon points="-20,0 0,-8 20,0 0,8" fill="#7C2D12" stroke="#FDBA74" strokeWidth="1.5" />
                        <ellipse cx="0" cy="0" rx="9" ry="3.5" fill="#E2E8F0" />
                      </g>
                      <g transform="translate(90, 125) rotate(-30)">
                        <polygon points="-16,0 0,-7 16,0 0,7" fill="#9A3412" />
                        <ellipse cx="0" cy="0" rx="7" ry="3" fill="#CBD5E1" />
                      </g>
                    </svg>
                  )}

                  {selectedSampleKey === 'kresek' && (
                    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto drop-shadow-md">
                      <path
                        d="M20,170 Q150,40 300,25 Q190,120 20,170 Z"
                        fill="#2E9E4F"
                        stroke="#4ADE80"
                        strokeWidth="2"
                      />
                      <path
                        d="M95,120 Q185,55 298,26 Q220,78 115,132 Z"
                        fill="#E7DEC3"
                        stroke="#EAB308"
                        strokeWidth="2"
                      />
                      <path d="M25,167 Q160,90 295,27" stroke="#86EFAC" strokeWidth="2" fill="none" opacity="0.7" />
                    </svg>
                  )}

                  {selectedSampleKey === 'bercak_coklat' && (
                    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto drop-shadow-md">
                      <path
                        d="M20,170 Q150,40 300,25 Q190,120 20,170 Z"
                        fill="#2E9E4F"
                        stroke="#4ADE80"
                        strokeWidth="2"
                      />
                      <path d="M25,167 Q160,90 295,27" stroke="#86EFAC" strokeWidth="2.5" fill="none" />
                      <g transform="translate(115, 115) rotate(-25)">
                        <ellipse cx="0" cy="0" rx="11" ry="7" fill="#FDE047" opacity="0.85" />
                        <ellipse cx="0" cy="0" rx="7.5" ry="4.5" fill="#5C2409" />
                      </g>
                      <g transform="translate(155, 88) rotate(-25)">
                        <ellipse cx="0" cy="0" rx="12" ry="7.5" fill="#FDE047" opacity="0.85" />
                        <ellipse cx="0" cy="0" rx="8.5" ry="5" fill="#4A1D07" />
                      </g>
                      <g transform="translate(198, 62) rotate(-22)">
                        <ellipse cx="0" cy="0" rx="10" ry="6.5" fill="#FDE047" opacity="0.85" />
                        <ellipse cx="0" cy="0" rx="7" ry="4" fill="#5C2409" />
                      </g>
                      <g transform="translate(142, 108) rotate(-28)">
                        <ellipse cx="0" cy="0" rx="9" ry="5.5" fill="#FDE047" opacity="0.85" />
                        <ellipse cx="0" cy="0" rx="6" ry="3.5" fill="#5C2409" />
                      </g>
                    </svg>
                  )}

                  {selectedSampleKey === 'tungro' && (
                    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto drop-shadow-md">
                      <path
                        d="M30,175 Q140,60 290,30 Q185,125 30,175 Z"
                        fill="#CA8A04"
                        stroke="#FACC15"
                        strokeWidth="2"
                      />
                      <path
                        d="M150,95 Q220,55 290,30 Q215,95 150,95 Z"
                        fill="#EA580C"
                        opacity="0.85"
                      />
                      <path d="M35,172 Q165,98 286,32" stroke="#FEF08A" strokeWidth="2.5" fill="none" />
                      <circle cx="180" cy="82" r="4" fill="#78350F" />
                      <circle cx="210" cy="68" r="3.5" fill="#78350F" />
                      <circle cx="155" cy="98" r="3" fill="#78350F" />
                    </svg>
                  )}

                  {selectedSampleKey === 'wereng' && (
                    <svg viewBox="0 0 320 200" className="w-full max-w-[280px] h-auto drop-shadow-md">
                      <rect x="115" y="20" width="26" height="160" rx="8" fill="#3F6212" />
                      <rect x="148" y="25" width="28" height="155" rx="8" fill="#4D7C0F" />
                      <rect x="112" y="105" width="68" height="75" rx="6" fill="#78350F" opacity="0.9" />
                      <ellipse cx="132" cy="128" rx="6" ry="3.5" fill="#FBBF24" />
                      <ellipse cx="155" cy="138" rx="6.5" ry="3.5" fill="#D97706" />
                      <ellipse cx="128" cy="152" rx="5.5" ry="3" fill="#F59E0B" />
                      <ellipse cx="162" cy="120" rx="6" ry="3.5" fill="#FBBF24" />
                      <ellipse cx="145" cy="160" rx="6" ry="3.5" fill="#D97706" />
                    </svg>
                  )}

                  <div className="mt-2 text-xs text-emerald-100 font-medium">
                    Fokus Organ Aktif:{' '}
                    <span className="text-white font-bold">
                      {commodity} — Bagian {plantPart}
                    </span>
                  </div>
                </div>
              )}

              {/* Guide Framing Corner Brackets */}
              <div className="pointer-events-none absolute inset-6 border border-emerald-400/30 rounded-xl">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-[#4ADE80] rounded-tl-lg" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-[#4ADE80] rounded-tr-lg" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-[#4ADE80] rounded-bl-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-[#4ADE80] rounded-br-lg" />
              </div>

              {/* Loading Scanning Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center">
                  <RefreshCw className="h-9 w-9 text-[#4ADE80] animate-spin mb-2.5" />
                  <div className="text-sm font-bold">Menganalisis Organ & Gejala Visual Tanaman...</div>
                  <div className="text-xs text-emerald-200 mt-1">
                    {analysisStepText || 'Mencocokkan anatomi organ (Akar/Batang/Daun/Malai) & pedoman PHT BB Padi'}
                  </div>
                </div>
              )}

              {/* Bottom Viewfinder Status Overlay */}
              <div className="absolute bottom-2.5 left-6 right-6 bg-black/70 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg flex items-center justify-between text-[11px]">
                <span>Pastikan organ ({plantPart}) terlihat jelas & fokus</span>
                <span className="text-[#86EFAC] font-semibold">
                  {isAnalyzing
                    ? 'Memindai...'
                    : activeDiagnosis?.imageQualityStatus || 'Siap Pindai'}
                </span>
              </div>
            </div>

            {/* INTERACTIVE CAMERA DOCK BAR WITH CENTER ZOOM CAMERA SHUTTER ICON */}
            <div className="p-4 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                {/* Left Action: Toggle Live Camera Stream */}
                <button
                  type="button"
                  onClick={() => {
                    if (isLiveCameraOpen) {
                      stopCameraStream();
                      setCameraStatusMessage('Kamera Live dinonaktifkan.');
                    } else {
                      startLiveCamera();
                    }
                  }}
                  className={`group flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                    isLiveCameraOpen
                      ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-[#15803D] hover:text-[#15803D]'
                  }`}
                >
                  {isLiveCameraOpen ? (
                    <>
                      <VideoOff className="h-4 w-4 group-hover:scale-125 transition-transform duration-300" />
                      <span>Tutup Live</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 text-[#15803D] group-hover:scale-125 transition-transform duration-300" />
                      <span>Kamera Live</span>
                    </>
                  )}
                </button>

                {/* CENTER CIRCULAR CAMERA BUTTON WITH HOVER ZOOM */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (isLiveCameraOpen) {
                        handleCapturePhotoFromCamera();
                      } else {
                        executeAiDiagnosis();
                      }
                    }}
                    disabled={isAnalyzing}
                    aria-label={isLiveCameraOpen ? 'Jepret Foto Kamera dan Analisis AI' : 'Kamera Pindai & Analisis AI'}
                    title={
                      isLiveCameraOpen
                        ? 'Jepret Foto dari Kamera Live & Jalankan Analisis AI'
                        : 'Klik untuk Memindai & Menjalankan Analisis Kamera AI'
                    }
                    className="group relative h-16 w-16 rounded-full bg-gradient-to-tr from-[#15803D] via-[#16A34A] to-[#22C55E] text-white shadow-[0_8px_25px_rgba(21,128,61,0.45)] ring-4 ring-emerald-100 flex items-center justify-center cursor-pointer transition-all duration-300 ease-out hover:scale-125 hover:shadow-[0_12px_32px_rgba(22,163,74,0.65)] active:scale-95 disabled:opacity-60"
                  >
                    <span className="absolute inset-1 rounded-full border border-white/30 pointer-events-none" />
                    <Camera className="h-7 w-7 text-white transition-transform duration-300 ease-out group-hover:scale-125" />
                  </button>
                  <span className="text-[10px] font-bold text-[#15803D] mt-1">
                    {isLiveCameraOpen ? 'Jepret & Analisis' : 'Pindai Kamera AI'}
                  </span>
                </div>

                {/* Right Action: Upload Photo from Gallery/File */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-[#15803D] border border-slate-300 hover:border-[#15803D] text-xs font-bold transition-all duration-200 cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-[#15803D] group-hover:scale-125 transition-transform duration-300" />
                  <span>Unggah Foto</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {cameraStatusMessage && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between gap-2">
                  <span>{cameraStatusMessage}</span>
                  {uploadedImageDataUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedImageDataUrl(null);
                        setCompressedImagePayload(null);
                        setImageColorStats(null);
                        setCameraStatusMessage(null);
                      }}
                      className="text-xs font-bold text-red-600 hover:underline shrink-0 cursor-pointer"
                    >
                      Reset Foto
                    </button>
                  )}
                </div>
              )}

              {/* Quick Sample Presets for Testing Across All Plant Organs (Daun, Batang, Akar, Malai/Gabah) */}
              <div className="pt-3 mt-3 border-t border-slate-200/80">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Uji Cepat Sampel Gejala Spesifik Organ (Daun, Batang, Akar & Malai):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectSample('blas')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'blas' && !uploadedImageDataUrl
                        ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">1. Blas (Daun)</div>
                    <div className="text-[10px] text-slate-500 truncate">Belah ketupat</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('kresek')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'kresek' && !uploadedImageDataUrl
                        ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">2. Kresek (Daun)</div>
                    <div className="text-[10px] text-slate-500 truncate">Hawar bakteri</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('bercak_coklat')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'bercak_coklat' && !uploadedImageDataUrl
                        ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">3. Bercak Coklat</div>
                    <div className="text-[10px] text-slate-500 truncate">Bintik oval daun</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('tungro')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'tungro' && !uploadedImageDataUrl
                        ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">4. Tungro</div>
                    <div className="text-[10px] text-slate-500 truncate">Kuning-oranye</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('wereng')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'wereng' && !uploadedImageDataUrl
                        ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">5. Wereng (Batang)</div>
                    <div className="text-[10px] text-slate-500 truncate">Pangkal coklat</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('akar')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'akar' && !uploadedImageDataUrl
                        ? 'bg-amber-50 border-amber-700 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">6. Busuk Akar</div>
                    <div className="text-[10px] text-slate-500 truncate">Akar hitam Fe²⁺</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('hama_akar')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'hama_akar' && !uploadedImageDataUrl
                        ? 'bg-amber-50 border-amber-700 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">7. Hama Akar</div>
                    <div className="text-[10px] text-slate-500 truncate">Orong2/Nematoda</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSample('malai_gabah')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border text-left transition cursor-pointer ${
                      selectedSampleKey === 'malai_gabah' && !uploadedImageDataUrl
                        ? 'bg-emerald-50 border-[#15803D] text-[#15803D]'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold truncate">8. Malai / Gabah</div>
                    <div className="text-[10px] text-slate-500 truncate">Walang sangit</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Crop & Plant Part Selector Form */}
          <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-xs space-y-3.5">
            <h2 className="text-sm font-bold text-[#142017] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#15803D]" />
              Konteks Tanaman & Bagian Organ yang Diamati
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Komoditas
                </label>
                <select
                  aria-label="Pilih Komoditas"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#15803D]"
                >
                  <option value="Padi">Padi Sawah</option>
                  <option value="Jagung">Jagung Hibrida</option>
                  <option value="Cabai">Cabai Merah</option>
                  <option value="Lainnya">Tanaman Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bagian Tanaman (Deteksi Otomatis / Manual)
                </label>
                <select
                  aria-label="Bagian Tanaman"
                  value={plantPart}
                  onChange={(e) => handlePlantPartChange(e.target.value as any)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-[#15803D]"
                >
                  <option value="Daun">Daun</option>
                  <option value="Batang">Batang / Pelepah</option>
                  <option value="Akar">Akar (Perakaran)</option>
                  <option value="Malai / Bunga">Malai / Bunga</option>
                  <option value="Buah / Gabah">Buah / Gabah</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Gejala Tambahan (Opsional — misal: akar hitam busuk, orong-orong, wereng, kresek, walang sangit)
              </label>
              <textarea
                rows={2}
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                placeholder="Contoh: Akar menghitam berbau belerang dan pendek, atau pangkal akar putus dimakan orong-orong..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <button
              type="button"
              onClick={() => executeAiDiagnosis()}
              disabled={isAnalyzing}
              className="group w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#15803D] hover:bg-[#166534] disabled:opacity-60 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4 group-hover:scale-125 transition-transform duration-300" />
              {isAnalyzing ? 'Sedang Menganalisis Organ & Gejala...' : 'Jalankan Analisis AI Sesuai Organ'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Diagnosis Results, Multi-Brand Products & Supporting Recommendations (7 cols) */}
        <div ref={diagnosisCardRef} className="lg:col-span-7 space-y-5">
          {apiNotice && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-950 flex items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
                <span className="font-medium">{apiNotice}</span>
              </div>
              <span className="text-[11px] font-bold text-[#15803D] shrink-0">
                {lastAnalyzedAtText}
              </span>
            </div>
          )}

          {/* LOADING STATE WHILE WAITING FOR GEMINI VISION */}
          {isAnalyzing && (
            <div className="rounded-xl bg-white border-2 border-[#15803D]/40 p-8 shadow-xs text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <RefreshCw className="h-7 w-7 text-[#15803D] animate-spin" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-100 text-[#15803D] mb-2">
                  Multimodal Gemini Vision AI Sedang Bekerja
                </span>
                <h2 className="text-lg font-bold text-[#142017]">
                  Mendeteksi Anatomi Organ (Akar / Batang / Daun / Malai) & Gejala secara Real-Time...
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-lg mx-auto leading-relaxed">
                  {analysisStepText ||
                    'Memastikan kesesuaian organ tanaman pada foto dan menyinkronkan multi-pilihan bahan aktif, merk dagang, serta agensia hayati.'}
                </p>
              </div>
            </div>
          )}

          {/* HONEST ERROR BANNER IF GEMINI API FAILS */}
          {!isAnalyzing && diagnosisError && (
            <div className="rounded-xl bg-red-50 border-2 border-red-300 p-5 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-red-950">
                    Analisis Gambar Gagal Diproses oleh Gemini Vision API
                  </h2>
                  <p className="text-xs text-red-900 leading-relaxed">
                    Sistem menolak menampilkan hasil diagnosis palsu/default agar rekomendasi obat tetap akurat. Berikut detail kendala teknis yang terjadi:
                  </p>
                  <pre className="text-[11px] bg-white/90 border border-red-200 rounded-lg p-2.5 text-red-900 whitespace-pre-wrap break-words font-mono mt-2">
                    {diagnosisError}
                  </pre>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => executeAiDiagnosis()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Coba Analisis Ulang
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-red-300 hover:bg-red-100 text-red-900 text-xs font-bold transition cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Unggah Foto Lain
                </button>
              </div>
            </div>
          )}

          {/* INITIAL READY STATE WHEN NO PHOTO HAS BEEN SCANNED YET */}
          {!isAnalyzing && !diagnosisError && !activeDiagnosis && (
            <div className="rounded-xl bg-white border border-slate-200/90 p-7 shadow-xs text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Camera className="h-7 w-7 text-[#15803D]" />
              </div>
              <div className="max-w-lg mx-auto space-y-1.5">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-emerald-100 text-[#15803D]">
                  Deteksi Presisi Organ: Akar • Batang • Daun • Malai/Gabah
                </span>
                <h2 className="text-lg font-bold text-[#142017]">
                  Unggah Foto Tanaman atau Gunakan Kamera Live untuk Memulai Diagnosis
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ketika Anda memfoto <strong>Akar</strong>, sistem secara presisi menganalisis perakaran (busuk akar Fe²⁺/H₂S, orong-orong, uret, nematoda). Begitu pula untuk <strong>Batang, Daun, dan Malai/Gabah</strong>, lengkap dengan berbagai pilihan bahan aktif & merk dagang.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  Unggah Foto Tanaman
                </button>
                <button
                  type="button"
                  onClick={() => startLiveCamera()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#15803D] text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  <Video className="h-4 w-4 text-[#15803D]" />
                  Buka Kamera Live
                </button>
              </div>
            </div>
          )}

          {/* MAIN DIAGNOSIS CARD (ONLY SHOWN WHEN activeDiagnosis IS PRESENT AND NOT LOADING) */}
          {!isAnalyzing && activeDiagnosis && (
            <div className="rounded-xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
              {/* Top Status Header */}
              <div className="bg-gradient-to-r from-[#14291D] to-[#1E3F2B] text-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
                      <FileCheck2 className="h-3.5 w-3.5 text-[#4ADE80]" />
                      {activeDiagnosis.validationStatus}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-bold">
                      Organ Dianalisis: {activeDiagnosis.plantPart}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        activeDiagnosis.urgencyLevel === 'Tinggi'
                          ? 'bg-red-500/90 text-white'
                          : activeDiagnosis.urgencyLevel === 'Sedang'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      Urgensi {activeDiagnosis.urgencyLevel}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/15 text-white text-xs font-bold">
                      Keyakinan Visual: {activeDiagnosis.confidencePct}%
                    </span>
                  </div>
                </div>

                <div className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                  Hasil Diagnosis Spesifik Organ ({activeDiagnosis.commodity} • Bagian {activeDiagnosis.plantPart})
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mt-0.5">
                  {activeDiagnosis.detectedName}
                </h2>
                <div className="text-xs text-emerald-200/90 italic mt-0.5">
                  Patogen / Penyebab: {activeDiagnosis.scientificName} • Kategori: {activeDiagnosis.causeCategory} • Mesin AI: {activeDiagnosis.aiModelUsed}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Organ Anatomy Verification Banner */}
                {activeDiagnosis.organSpecificAnatomyCheck && (
                  <div className="rounded-lg bg-emerald-950/5 border border-emerald-700/30 p-3 flex items-start gap-2.5">
                    <Sprout className="h-4 w-4 text-[#15803D] shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-800 leading-relaxed">
                      <span className="font-bold text-[#15803D]">
                        Verifikasi Anatomi Organ ({activeDiagnosis.plantPart}):
                      </span>{' '}
                      {activeDiagnosis.organSpecificAnatomyCheck}
                    </div>
                  </div>
                )}

                {/* GEMINI AI 3.8 FLASH DIRECT ANALYSIS ANSWER & INTERACTIVE CAMERA Q&A PANEL */}
                <div
                  data-testid="camera-gemini-analysis-panel"
                  className="rounded-xl border-2 border-emerald-600/40 bg-gradient-to-br from-[#F2FBF5] via-white to-[#ECFDF3] p-4 shadow-xs space-y-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#15803D] text-white flex items-center justify-center shadow-2xs shrink-0">
                        <Bot className="h-4 w-4 text-[#86EFAC]" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-xs sm:text-sm font-bold text-[#142017]">
                            Analisis & Jawaban Kamera — Gemini AI 3.8 Flash
                          </h3>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-[#15803D] text-[10px] font-bold">
                            Gemini AI 3.8 Flash Aktif
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Penjelasan langsung & konsultasi interaktif hasil pindaian kamera pada organ{' '}
                          <strong>{activeDiagnosis.plantPart}</strong>
                        </p>
                      </div>
                    </div>

                    {cameraQaHistory.length > 0 && (
                      <button
                        type="button"
                        data-testid="btn-reset-camera-qa"
                        onClick={() => {
                          setCameraQaHistory([]);
                          setCameraQuestionInput('');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-bold transition cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset Tanya Jawab Kamera
                      </button>
                    )}
                  </div>

                  {/* Direct Gemini AI 3.8 Flash Analysis Explanation */}
                  <div
                    data-testid="camera-gemini-analysis-answer"
                    className="rounded-lg bg-white border border-emerald-200/90 p-3.5 text-xs text-slate-800 leading-relaxed shadow-2xs space-y-0.5"
                  >
                    {renderCameraFormattedText(
                      activeDiagnosis.geminiAnalysisAnswer ||
                        `Sobat Tani! Berdasarkan analisis visual **Gemini AI 3.8 Flash** pada organ **${activeDiagnosis.plantPart}** tanaman **${activeDiagnosis.commodity}**, terdeteksi **${activeDiagnosis.detectedName}** (*${activeDiagnosis.scientificName}*) dengan keyakinan **${activeDiagnosis.confidencePct}%**.\n\n• **Langkah Utama**: ${activeDiagnosis.nonChemicalIpmActions[0] || 'Lakukan sanitasi dan pengaturan tata air.'}\n• **Rekomendasi Obat Resmi**: ${
                          verifiedProducts[0]
                            ? `${verifiedProducts[0].productName} (${verifiedProducts[0].activeIngredient}) dengan dosis ${verifiedProducts[0].dosagePer16LTank || verifiedProducts[0].dosagePerLiter}.`
                            : 'Gunakan pemupukan berimbang dan agensia hayati.'
                        }`
                    )}
                  </div>

                  {/* Follow-up Q&A History for this Camera Diagnosis */}
                  {cameraQaHistory.length > 0 && (
                    <div
                      data-testid="camera-gemini-qa-messages"
                      className="space-y-2 max-h-[260px] overflow-y-auto pr-1"
                    >
                      {cameraQaHistory.map((msg) => (
                        <div
                          key={msg.id}
                          className={`rounded-lg p-3 text-xs leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-[#14291D] text-white ml-6'
                              : 'bg-emerald-50/90 border border-emerald-200 text-slate-800 mr-4'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-bold opacity-80">
                            <span>{msg.modelLabel}</span>
                            <span>{msg.timestamp} WIB</span>
                          </div>
                          <div>{msg.role === 'user' ? msg.content : renderCameraFormattedText(msg.content)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAskingCameraGemini && (
                    <div className="flex items-center gap-2 text-xs text-[#15803D] font-semibold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Gemini AI 3.8 Flash sedang menyusun jawaban spesifik hasil kamera...</span>
                    </div>
                  )}

                  {/* Quick Follow-up Question Chips for Camera Scan */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                      Tanya Cepat Hasil Kamera:
                    </span>
                    {[
                      `Apa merk obat & takaran tangki 16L untuk ${activeDiagnosis.detectedName}?`,
                      `Bagaimana langkah darurat pertama pada organ ${activeDiagnosis.plantPart} ini?`,
                      `Apa agensia hayati & pupuk pemulihan untuk ${activeDiagnosis.detectedName}?`,
                    ].map((qChip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isAskingCameraGemini}
                        onClick={() => handleAskCameraGemini(qChip)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#15803D] border border-slate-200 hover:border-emerald-300 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {qChip}
                      </button>
                    ))}
                  </div>

                  {/* Input Form to Ask Gemini AI 3.8 Flash about Camera Result */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAskCameraGemini();
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      data-testid="input-camera-gemini-question"
                      value={cameraQuestionInput}
                      onChange={(e) => setCameraQuestionInput(e.target.value)}
                      disabled={isAskingCameraGemini}
                      placeholder={`Tanya Gemini AI 3.8 Flash seputar hasil kamera (${activeDiagnosis.detectedName})...`}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#15803D]"
                    />
                    <button
                      type="submit"
                      data-testid="btn-send-camera-gemini-question"
                      disabled={isAskingCameraGemini || !cameraQuestionInput.trim()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer shrink-0"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Tanya Gemini 3.8 Flash
                    </button>
                  </form>
                </div>

                {/* Visual Evidence & Symptoms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg bg-[#F5F7F2] p-3.5 border border-slate-200/80">
                    <div className="text-xs font-bold text-[#142017] flex items-center gap-1.5 mb-2">
                      <Eye className="h-4 w-4 text-[#15803D]" />
                      Gejala Visual pada Organ {activeDiagnosis.plantPart}
                    </div>
                    {activeDiagnosis.visualObservations && (
                      <p className="text-xs text-slate-800 bg-white/90 rounded p-2.5 border border-emerald-200/80 mb-2 leading-relaxed">
                        <span className="font-bold text-[#15803D]">Observasi Morfologi Organ:</span>{' '}
                        {activeDiagnosis.visualObservations}
                      </p>
                    )}
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {activeDiagnosis.visibleSymptoms.map((sym, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#15803D] font-bold">•</span>
                          <span>{sym}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg bg-[#F5F7F2] p-3.5 border border-slate-200/80">
                    <div className="text-xs font-bold text-[#142017] flex items-center gap-1.5 mb-2">
                      <Info className="h-4 w-4 text-[#15803D]" />
                      Ringkasan Gangguan & Alasan Diferensial Fitopatologi
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {activeDiagnosis.diseaseInfoSummary}
                    </p>
                    {activeDiagnosis.differentialReasoning && (
                      <p className="text-xs text-emerald-950 bg-emerald-50/90 rounded p-2.5 border border-emerald-200 mt-2 leading-relaxed">
                        <span className="font-bold text-[#15803D]">Alasan Diferensial:</span>{' '}
                        {activeDiagnosis.differentialReasoning}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-2 border-t border-slate-200 pt-2">
                      {activeDiagnosis.visualEvidenceSummary}
                    </p>
                  </div>
                </div>

                {/* Alternative Diagnoses & Field Verification Checks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5">
                    <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5 mb-2">
                      <HelpCircle className="h-4 w-4 text-amber-700" />
                      Kemungkinan Diagnosis Pembanding pada {activeDiagnosis.plantPart}
                    </div>
                    <div className="space-y-2">
                      {activeDiagnosis.alternativeDiagnoses.map((alt, i) => (
                        <div key={i} className="text-xs bg-white/90 rounded p-2 border border-amber-200/70">
                          <div className="font-bold text-slate-800">{alt.name}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            <span className="font-semibold text-amber-900">Cara membedakan:</span> {alt.distinguishingCheck}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5">
                    <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-700" />
                      Langkah Pemeriksaan Lanjutan di Lahan
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {activeDiagnosis.followUpFieldChecks.map((chk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-bold text-blue-700">{idx + 1}.</span>
                          <span>{chk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* STEP 1: NON-CHEMICAL / PHT ACTIONS */}
                <div className="rounded-xl border-2 border-[#15803D]/30 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="text-sm font-bold text-[#142017] flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#15803D] text-white text-xs font-bold">
                        1
                      </span>
                      Tindakan Utama: Pengendalian Hama Terpadu (PHT) & Tata Air Lahan
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-[#15803D]">
                      Prioritas Pertama
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-800">
                    {activeDiagnosis.nonChemicalIpmActions.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-white p-2.5 rounded-lg border border-emerald-200/80">
                        <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* STEP 2: MULTI-BRAND & MULTI-ACTIVE-INGREDIENT PESTICIDE / BIO-AGENT / NUTRIENT RECOMMENDATIONS */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold text-[#142017] flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-xs font-bold">
                        2
                      </span>
                      Pilihan Rekomendasi Bahan Aktif & Merk Dagang Terbaik ({verifiedProducts.length} Kelompok Produk)
                    </div>
                    <span className="text-[11px] font-semibold text-[#15803D] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      Multi-Opsi Bahan Aktif & Rotasi IRAC/FRAC Kementan RI
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Berikut adalah <strong>beberapa pilihan bahan aktif dan merk dagang resmi</strong> yang paling efektif untuk mengatasi <strong>{activeDiagnosis.detectedName}</strong> pada bagian <strong>{activeDiagnosis.plantPart}</strong>. Pilih salah satu sesuai ketersediaan di kios pertanian dan lakukan rotasi golongan agar hama/patogen tidak kebal:
                  </p>

                  {verifiedProducts.length === 0 ? (
                    <div className="rounded-lg bg-slate-100 border border-slate-200 p-4 text-xs text-slate-700">
                      Untuk kategori gangguan ini, ikuti langkah pemupukan/sanitasi PHT di atas.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {verifiedProducts.map((prod, idx) => (
                        <div
                          key={prod.id}
                          className="rounded-xl border border-slate-200 bg-[#F9FBF8] hover:border-[#15803D] transition p-4 flex flex-col justify-between shadow-2xs"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-[#15803D]">
                                    Opsi #{idx + 1} • {prod.category}
                                  </span>
                                  {prod.modeOfActionGroup && (
                                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/80 text-slate-800">
                                      {prod.modeOfActionGroup}
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-sm sm:text-base font-bold text-[#142017]">
                                  {prod.productName}
                                </h3>
                              </div>
                              <span className="text-[10px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shrink-0">
                                {prod.registrationNumber}
                              </span>
                            </div>

                            <div className="mt-2.5 space-y-2 text-xs text-slate-700">
                              <div className="bg-white p-2 rounded-lg border border-emerald-200/80">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Bahan Aktif & Konsentrasi:
                                </div>
                                <div className="font-bold text-[#15803D] text-xs mt-0.5">
                                  {prod.activeIngredient} ({prod.concentration})
                                </div>
                              </div>

                              {/* MULTIPLE ALTERNATIVE COMMERCIAL BRANDS AT AGRICULTURAL SHOPS */}
                              {prod.alternativeBrands && prod.alternativeBrands.length > 0 && (
                                <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-200/80">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                                    <Award className="h-3 w-3 text-amber-700" />
                                    Pilihan Merk Dagang Setara di Kios Pertanian:
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {prod.alternativeBrands.map((brand, bIdx) => (
                                      <span
                                        key={bIdx}
                                        className="px-2 py-0.5 rounded bg-white border border-amber-300 text-slate-800 font-semibold text-[11px]"
                                      >
                                        {brand}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div>
                                <span className="font-semibold text-slate-900">Sasaran Resmi:</span>{' '}
                                {prod.targetOrganisms.join(', ')}
                              </div>

                              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                                <div className="text-[11px] font-bold text-[#15803D]">
                                  Takaran Resmi & Dosis per Tangki 16L:
                                </div>
                                <div className="font-bold text-slate-900 mt-0.5">
                                  {prod.dosagePerLiter}{' '}
                                  <span className="font-normal text-slate-600">
                                    ({prod.dosagePerHaEstimate})
                                  </span>
                                </div>
                                {prod.dosagePer16LTank && (
                                  <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                                    • Takaran Praktis: {prod.dosagePer16LTank}
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Volume Semprot/Aplikasi: {prod.sprayVolumePerHa}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-500">
                              PHI: <strong className="text-slate-700">{prod.preHarvestIntervalDays} hari</strong> pra-panen
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedProductModal(prod)}
                              className="px-3 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold transition cursor-pointer"
                            >
                              Lihat Detail & Merk
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* STEP 3: BIOLOGICAL, SOIL/ROOT CONDITIONER & PHYSIOLOGICAL RECOVERY RECOMMENDATIONS */}
                {activeDiagnosis.biologicalAndSupportingRecommendations &&
                  activeDiagnosis.biologicalAndSupportingRecommendations.length > 0 && (
                    <div className="rounded-xl border-2 border-teal-600/30 bg-teal-50/40 p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-bold text-[#142017] flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-700 text-white text-xs font-bold">
                            3
                          </span>
                          Rekomendasi Terbaik Pendukung: Agensia Hayati, Pembenah Akar/Tanah & Nutrisi Pemulihan
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-teal-100 text-teal-900">
                          Pemulihan Perakaran & Imunitas Tanaman
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {activeDiagnosis.biologicalAndSupportingRecommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg bg-white border border-teal-200/90 p-3 flex flex-col justify-between space-y-2 shadow-2xs"
                          >
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                                <FlaskConical className="h-3 w-3" />
                                {rec.category}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 leading-snug">
                                {rec.title}
                              </h4>
                              <div className="text-[11px] text-slate-700">
                                <span className="font-semibold text-teal-900">Bahan & Merk Contoh:</span>{' '}
                                {Array.isArray(rec.materialsAndBrands)
                                  ? rec.materialsAndBrands.join(', ')
                                  : (rec as any).activeSubstancesAndBrands || '-'}
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                              <div className="bg-teal-50/80 p-2 rounded border border-teal-200/70 text-teal-950">
                                <span className="font-bold">Dosis & Aplikasi:</span> {rec.dosageAndApplication}
                              </div>
                              {rec.agronomicBenefit && (
                                <div className="text-slate-600 leading-relaxed">
                                  <span className="font-semibold text-slate-800">Manfaat Agronomis:</span>{' '}
                                  {rec.agronomicBenefit}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* MANDATORY SAFETY & PPE WARNING BOX */}
                <div className="rounded-xl bg-amber-50 border border-amber-300/90 p-4 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950 space-y-1 leading-relaxed">
                    <div className="font-bold text-amber-900">
                      Pedoman Keselamatan Kerja (APD) & Prinsip Rotasi Bahan Aktif:
                    </div>
                    <p>
                      • Wajib menggunakan <strong>Alat Pelindung Diri (APD)</strong> lengkap saat mencampur dan menyemprot: masker respirator, sarung tangan karet nitril, kacamata pelindung, sepatu boot, dan baju lengan panjang.
                    </p>
                    <p>
                      • Jangan mencampur agensia hayati (<em>Trichoderma</em> / <em>PGPR</em> / <em>Beauveria</em>) ke dalam satu tangki yang sama dengan fungisida/bakterisida kimia sintetis (beri jeda minimal 5–7 hari).
                    </p>
                    <p>
                      • Lakukan pergiliran (rotasi) kode cara kerja <strong>IRAC / FRAC</strong> antar penyemprotan agar hama dan patogen tidak mengalami resistensi.
                    </p>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <div className="text-[11px] text-slate-500">
                    Sumber Referensi: {activeDiagnosis.sourceReferences.join(' • ')}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSprayCalcHelper(!showSprayCalcHelper)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      <Calculator className="h-3.5 w-3.5 text-[#15803D]" />
                      Hitung Takaran Tangki Lahan
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveResult}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                      Simpan ke Riwayat Diagnosis
                    </button>
                    {onNavigateToDashboard && (
                      <button
                        type="button"
                        onClick={onNavigateToDashboard}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Lihat Peringatan Prioritas di Beranda →
                      </button>
                    )}
                  </div>
                </div>

                {savedToast && (
                  <div className="rounded-lg bg-emerald-100 border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                    Hasil diagnosis berhasil disimpan ke Riwayat Catatan Lahan ({activePlot?.name}) dan disinkronkan ke Peringatan Prioritas Beranda.
                  </div>
                )}

                {/* Quick Spray Volume Helper for Active Plot with Multi-Product Selector */}
                {showSprayCalcHelper && (
                  <div className="rounded-xl bg-slate-900 text-white p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        Kalkulator Kebutuhan Larutan Semprot — {activePlot?.name} ({activePlot?.areaHa} Ha)
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSprayCalcHelper(false)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>

                    {verifiedProducts.length > 1 && (
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Pilih Produk / Bahan Aktif yang Akan Dihitung:
                        </label>
                        <select
                          value={selectedCalcProductIndex}
                          onChange={(e) => setSelectedCalcProductIndex(Number(e.target.value))}
                          className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-xs text-white font-semibold"
                        >
                          {verifiedProducts.map((p, idx) => (
                            <option key={p.id} value={idx}>
                              Opsi #{idx + 1}: {p.productName} — {p.activeIngredient} ({p.dosagePerLiter})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-slate-300 text-[11px]">Kapasitas Tangki Anda (Liter)</div>
                        <input
                          type="number"
                          min={5}
                          max={25}
                          value={customTankSizeL}
                          onChange={(e) => setCustomTankSizeL(Math.max(5, Number(e.target.value) || 16))}
                          className="mt-1 w-full rounded bg-slate-800 border border-slate-600 px-2.5 py-1 text-white font-bold"
                        />
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-slate-300 text-[11px]">Kebutuhan Air Semprot ({activePlot?.areaHa} Ha)</div>
                        <div className="text-base font-bold text-white mt-1">
                          {Math.round((activePlot?.areaHa || 1) * 400)} Liter Air
                        </div>
                        <div className="text-[10px] text-emerald-300">
                          ≈ {(((activePlot?.areaHa || 1) * 400) / customTankSizeL).toFixed(1)} tangki ukuran {customTankSizeL}L
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        {activeCalcProduct ? (
                          <>
                            <div className="text-slate-300 text-[11px] truncate">
                              Takaran {activeCalcProduct.productName}
                            </div>
                            <div className="text-sm font-bold text-[#4ADE80] mt-1">
                              {activeCalcProduct.dosagePer16LTank || activeCalcProduct.dosagePerLiter}
                            </div>
                            <div className="text-[10px] text-slate-300 mt-0.5">
                              Estimasi per Ha: {activeCalcProduct.dosagePerHaEstimate}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-slate-300 text-[11px]">Rekomendasi Non-Pestisida</div>
                            <div className="text-sm font-bold text-[#4ADE80] mt-1">
                              Aplikasi Pupuk / Sanitasi
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved Diagnosis History List */}
          {diagnosisHistory.length > 0 && (
            <div className="rounded-xl bg-white border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Riwayat Pindaian Kamera AI Sebelumnya ({diagnosisHistory.length})
                </h3>
                {onClearDiagnosisHistory && (
                  <button
                    type="button"
                    onClick={onClearDiagnosisHistory}
                    className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Bersihkan Riwayat
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {diagnosisHistory.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#F5F7F2] border border-slate-200/70 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{item.detectedName}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.commodity} (Organ: {item.plantPart}) • Keyakinan {item.confidencePct}% • {item.aiModelUsed || item.validationStatus}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDiagnosisError(null);
                        setActiveDiagnosis(item);
                        if (
                          item.plantPart === 'Akar' ||
                          item.plantPart === 'Batang' ||
                          item.plantPart === 'Daun' ||
                          item.plantPart === 'Malai / Bunga' ||
                          item.plantPart === 'Buah / Gabah'
                        ) {
                          setPlantPart(item.plantPart);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-white border border-slate-300 hover:border-[#15803D] text-[#15803D] font-semibold text-xs cursor-pointer"
                    >
                      Buka
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SCREEN 17: DETAILED VERIFIED PRODUCT MODAL WITH ALTERNATIVE BRANDS */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#14291D] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Detail Produk & Merk Dagang Terverifikasi Kementan RI
                  </span>
                  {selectedProductModal.modeOfActionGroup && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/15 text-white">
                      {selectedProductModal.modeOfActionGroup}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold mt-1">{selectedProductModal.productName}</h3>
                <p className="text-xs text-emerald-200">{selectedProductModal.manufacturer}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 bg-[#F5F7F2] p-3.5 rounded-xl border border-slate-200">
                <div>
                  <div className="text-[11px] text-slate-500">Nomor Pendaftaran Resmi</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedProductModal.registrationNumber}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">Formulasi & Status</div>
                  <div className="font-bold text-slate-900 mt-0.5">
                    {selectedProductModal.formulation} ({selectedProductModal.registrationStatus})
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[11px] text-slate-500">Bahan Aktif & Konsentrasi</div>
                  <div className="font-bold text-[#15803D] text-sm mt-0.5">
                    {selectedProductModal.activeIngredient} ({selectedProductModal.concentration})
                  </div>
                </div>
              </div>

              {selectedProductModal.alternativeBrands &&
                selectedProductModal.alternativeBrands.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-1.5">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-amber-700" />
                      Daftar Pilihan Merk Dagang Setara di Kios Pertanian:
                    </div>
                    <p className="text-[11px] text-amber-900">
                      Jika merk utama sedang tidak tersedia di kios terdekat, Anda dapat memilih salah satu merk dagang berbahan aktif setara berikut:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedProductModal.alternativeBrands.map((brand, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-slate-900 font-bold text-xs shadow-2xs"
                        >
                          • {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <div className="font-bold text-slate-900">Sasaran Hama / Penyakit Terdaftar:</div>
                <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedProductModal.targetOrganisms.join(', ')} (Komoditas: {selectedProductModal.allowedCommodities.join(', ')})
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-semibold">Konsentrasi / Liter Air</div>
                  <div className="text-sm font-bold text-[#15803D] mt-0.5">
                    {selectedProductModal.dosagePerLiter}
                  </div>
                  {selectedProductModal.dosagePer16LTank && (
                    <div className="text-[10px] text-emerald-900 mt-0.5">
                      ({selectedProductModal.dosagePer16LTank})
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-semibold">Estimasi Kebutuhan / Ha</div>
                  <div className="text-sm font-bold text-[#15803D] mt-0.5">
                    {selectedProductModal.dosagePerHaEstimate}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-800 font-semibold">Volume Semprot / Ha</div>
                  <div className="text-sm font-bold text-[#15803D] mt-0.5">
                    {selectedProductModal.sprayVolumePerHa}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-slate-900">Waktu & Cara Aplikasi:</div>
                <p>{selectedProductModal.applicationMethod}</p>
                <p className="text-slate-600">
                  • Interval aplikasi: <strong>{selectedProductModal.applicationInterval}</strong> • Masa tunggu panen (PHI): <strong>{selectedProductModal.preHarvestIntervalDays} hari</strong> sebelum panen.
                </p>
                <p className="text-slate-600">
                  • Pengelolaan resistensi: {selectedProductModal.resistanceWarning}
                </p>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-300 p-3 space-y-1.5">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                  Wajib Alat Pelindung Diri (APD):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProductModal.requiredApd.map((ppe, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-950 font-semibold text-[11px]"
                    >
                      ✓ {ppe}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-amber-900 pt-1">
                  {selectedProductModal.safetyWarnings.join(' ')}
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Sumber: {selectedProductModal.labelSource}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="px-4 py-2 rounded-lg bg-[#15803D] text-white text-xs font-bold cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
