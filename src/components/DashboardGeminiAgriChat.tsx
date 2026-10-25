import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  ShieldCheck,
  Sprout,
  RotateCcw,
  MessageSquare,
  Zap,
  Cpu,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  GeminiAgriModelId,
  classifyAgriChatTopic,
  buildAgriRefusalReply,
  buildSmartAgriFallbackReply,
} from '../utils/agriChatHelper';
import { FarmPlot, WeatherSnapshot, DiagnosisResult, UserProfile } from '../types/agronomy';

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modelBadge?: string;
  isGuardrailRefusal?: boolean;
  isWelcome?: boolean;
}

interface DashboardGeminiAgriChatProps {
  user: UserProfile;
  primaryPlot?: FarmPlot;
  weather: WeatherSnapshot;
  latestDiagnosis?: DiagnosisResult | null;
}

const STORAGE_KEY_CHAT = 'tanicerdas_dashboard_gemini_agri_chat_v4';

const QUICK_AGRI_PROMPTS = [
  {
    label: '🌾 Akar Padi & Obat Wereng',
    prompt: 'Bosku, akar padi menghitam dan ada wereng di pangkal batang. Solusi tegas & pilihan merk obatnya apa saja?',
  },
  {
    label: '🥑🍊 Durian, Alpukat, Jeruk & Jambu',
    prompt: 'Bagaimana cara merawat pohon durian, alpukat, jeruk, dan jambu supaya cepat berbunga/berbuah lebat dan tidak rontok?',
  },
  {
    label: '🌽🌶️ Jagung, Sayuran & Palawija',
    prompt: 'Rekomendasi pupuk dan obat hama ulat/thrips/patek terbaik untuk tanaman jagung, cabai, sayuran, dan palawija?',
  },
  {
    label: '🌸🪴 Bunga & Tanaman Hias',
    prompt: 'Tips media tanam, pupuk pembungaan, dan obat kutu putih/jamur untuk tanaman bunga mawar, anggrek, bougenville & aglaonema?',
  },
];

export const DashboardGeminiAgriChat: React.FC<DashboardGeminiAgriChatProps> = ({
  user,
  primaryPlot,
  weather,
  latestDiagnosis,
}) => {
  const selectedModel: GeminiAgriModelId = 'gemini-3.8-flash';
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => `sesi-${Date.now()}`);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const buildInitialWelcome = (): ChatMessageItem => {
    const shortName = user.name.split(' ')[0] || 'Sobat Tani';
    const plotInfo = primaryPlot
      ? `${primaryPlot.name} (${primaryPlot.commodity} ${primaryPlot.variety}, ${primaryPlot.currentHst} HST, ${primaryPlot.areaHa} Ha)`
      : 'Lahan Utama';

    return {
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      isWelcome: true,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      modelBadge: 'Gemini AI 3.8 Flash',
      text:
        `Halo **${shortName} / Bosku**! Salam tani cerdas & berkah selalu! 🌾🥑🍊🌸\n\n` +
        `Kenalin, saya **Kang Tani AI (Powered by Gemini AI 3.8 Flash)** yang siap menjawab **cepat, cerdas, dan tepat** langsung dari Dashboard.\n\n` +
        `📌 **Cakupan Konsultasi Tanaman Lengkap (100% Khusus Pertanian)**:\n` +
        `• **Padi, Jagung & Palawija** (kedelai, kacang hijau, singkong, ubi, kentang)\n` +
        `• **Sayuran** (cabai, bawang merah, tomat, terong, timun, kubis, sawi, kangkung)\n` +
        `• **Tanaman Keras & Buah** (jambu, durian, jeruk, alpukat/alpokat, mangga, kelengkeng, kopi, sawit)\n` +
        `• **Bunga & Tanaman Hias** (anggrek, mawar, bougenville, aglaonema, monstera, adenium, bonsai)\n` +
        `• **Diagnosa Akar/Batang/Daun/Bunga/Buah, Pupuk & Multi-Merk Obat Pertanian**\n\n` +
        `📍 *Konteks Lahan Aktif*: **${plotInfo}** · Suhu **${weather.tempC}°C** · Kelembapan **${weather.humidityPct}%**. Yuk tanya tanaman apa aja di bawah!`,
    };
  };

  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHAT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_e) {
      // ignore
    }
    return [buildInitialWelcome()];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages.slice(-20)));
    } catch (_e) {
      // ignore storage quota
    }
  }, [messages]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleResetChatWithNewMemory = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    setInputMessage('');
    const newSession = `sesi-${Date.now()}`;
    setSessionId(newSession);
    try {
      localStorage.removeItem(STORAGE_KEY_CHAT);
    } catch (_e) {
      // ignore
    }
    const freshWelcome = [buildInitialWelcome()];
    setMessages(freshWelcome);
    setResetNotice('Memori percakapan berhasil di-reset! Percakapan baru dengan memori baru telah dimulai.');
    setTimeout(() => {
      setResetNotice(null);
    }, 4000);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? inputMessage).trim();
    if (!textToSend || isSending) return;

    setResetNotice(null);

    const nowTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: nowTime,
    };

    // Only include non-welcome messages from the current active session in chatHistory so reset truly starts with fresh memory
    const conversationMemory = messages
      .filter((m) => !m.isWelcome)
      .slice(-5)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (!customPrompt) {
      setInputMessage('');
    }
    setIsSending(true);

    const farmContext = {
      sessionId,
      farmerName: user.name,
      farmerRole: user.role,
      village: user.village,
      district: user.districtName,
      regency: user.regencyName,
      poktanName: user.poktanName,
      mainCommodity: user.mainCommodity,
      plantingSeasonMT: user.plantingSeasonMT,
      plotName: primaryPlot?.name || 'Lahan 1',
      commodity: primaryPlot?.commodity || 'Padi',
      variety: primaryPlot?.variety || 'Ciherang',
      hst: primaryPlot?.currentHst ?? 20,
      areaHa: primaryPlot?.areaHa ?? 1.2,
      soilPh: primaryPlot?.soilObservation?.ph ?? 6.5,
      soilMoisturePct: primaryPlot?.soilObservation?.moisturePct ?? 62,
      weatherTempC: weather.tempC,
      weatherHumidityPct: weather.humidityPct,
      weatherRainProbPct: weather.rainProbabilityPct,
      weatherWindKmh: weather.windSpeedKmh,
      sprayingStatus: weather.sprayingAdvisory.status,
      latestDiagnosisName: latestDiagnosis?.detectedName || null,
    };

    const localTopicCheck = classifyAgriChatTopic(textToSend);
    const activeModelLabel = 'Gemini AI 3.8 Flash';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          preferredModel: selectedModel,
          sessionId,
          farmContext,
          chatHistory: conversationMemory,
        }),
      });

      if (!response.ok) {
        throw new Error('Server chat response not ok');
      }

      const data = await response.json();
      const replyTime = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const assistantMsg: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text:
          data.reply ||
          (localTopicCheck.isAgricultural
            ? buildSmartAgriFallbackReply(textToSend, farmContext)
            : buildAgriRefusalReply(textToSend, user.name)),
        timestamp: replyTime,
        modelBadge: data.model || `${activeModelLabel} • TaniCerdas AI`,
        isGuardrailRefusal: data.isAgricultural === false || !localTopicCheck.isAgricultural,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      const replyTime = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const fallbackText = localTopicCheck.isAgricultural
        ? buildSmartAgriFallbackReply(textToSend, farmContext)
        : buildAgriRefusalReply(textToSend, user.name);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-fallback-${Date.now()}`,
          role: 'assistant',
          text: fallbackText,
          timestamp: replyTime,
          modelBadge: `${activeModelLabel} • Asisten Tanaman`,
          isGuardrailRefusal: !localTopicCheck.isAgricultural,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Helper to render simple bold markdown (**text**) cleanly
  const renderFormattedText = (rawText: string) => {
    return rawText.split('\n').map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={lineIdx} className={line.trim() === '' ? 'h-2' : 'leading-relaxed'}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={partIdx} className="font-bold text-[#14532D]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <React.Fragment key={partIdx}>{part}</React.Fragment>;
          })}
        </p>
      );
    });
  };

  return (
    <section
      id="tanya-kang-tani-ai"
      data-testid="dashboard-gemini-agri-chat"
      aria-label="Asisten Gemini AI 3.8 Flash Pertanian"
      className="rounded-2xl bg-white border-2 border-[#15803D]/25 shadow-sm overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#14532D] via-[#15803D] to-[#0F766E] px-5 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-[#BBF7D0]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Tanya Kang Tani AI — Gemini AI 3.8 Flash
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DCFCE7] text-[#14532D] text-[11px] font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Khusus Tanaman & Pertanian
                </span>
              </div>
              <p className="text-xs text-[#DCFCE7] mt-0.5">
                Padi, Jagung, Sayuran, Palawija, Tanaman Keras, Bunga Hias, Jambu, Durian, Jeruk, Alpukat & Obat Tanaman
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Active Model Badge: Gemini AI 3.8 Flash Only */}
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#14532D] text-xs font-bold shadow-xs">
              <Zap className="h-3.5 w-3.5 text-[#15803D]" />
              <span>Gemini AI 3.8 Flash</span>
            </div>

            {/* Prominent Reset Conversation & Memory Button */}
            <button
              type="button"
              onClick={handleResetChatWithNewMemory}
              data-testid="btn-reset-kang-tani-chat"
              title="Hapus memori lama dan mulai percakapan baru"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white text-white hover:text-[#14532D] border border-white/30 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset / Memori Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Notice when Memory is Reset */}
      {resetNotice && (
        <div
          data-testid="reset-kang-tani-notice"
          className="px-5 py-2.5 bg-[#DCFCE7] border-b border-[#15803D]/20 text-xs font-semibold text-[#14532D] flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#15803D] shrink-0" />
            <span>{resetNotice}</span>
          </div>
          <span className="text-[11px] font-bold text-[#15803D]">Sesi Baru Aktif</span>
        </div>
      )}

      {/* Quick Prompt Chips Bar */}
      <div className="px-5 py-3 bg-[#F7FAF7] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-[#647067] uppercase tracking-wider mr-1">
            Topik Cepat:
          </span>
          {QUICK_AGRI_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSending}
              onClick={() => handleSendMessage(item.prompt)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white hover:bg-[#DCFCE7] text-[#17231B] hover:text-[#14532D] border border-slate-200 hover:border-[#15803D] transition-colors cursor-pointer disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleResetChatWithNewMemory}
          title="Mulai Percakapan Baru dengan Memori Baru"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#15803D] hover:text-[#14532D] px-2.5 py-1 rounded-lg bg-[#DCFCE7]/60 hover:bg-[#DCFCE7] transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Percakapan Baru</span>
        </button>
      </div>

      {/* Chat Messages Container */}
      <div
        ref={chatScrollRef}
        className="p-5 space-y-4 max-h-[380px] overflow-y-auto bg-gradient-to-b from-white to-[#F7FAF7]/60"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    msg.isGuardrailRefusal
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-[#DCFCE7] border-[#15803D]/20 text-[#15803D]'
                  }`}
                >
                  {msg.isGuardrailRefusal ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Sprout className="h-5 w-5" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm ${
                  isUser
                    ? 'bg-[#15803D] text-white rounded-br-xs shadow-xs'
                    : msg.isGuardrailRefusal
                      ? 'bg-amber-50/90 border border-amber-300 text-[#17231B] rounded-bl-xs'
                      : 'bg-white border border-slate-200 text-[#17231B] rounded-bl-xs shadow-2xs'
                }`}
              >
                {!isUser && (
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-100">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {msg.modelBadge?.replace(/•\s*Argon/gi, '').replace(/&\s*Argon/gi, '').trim() || 'Gemini AI 3.8 Flash'}
                    </span>
                    <span className="text-[10px] text-[#647067] tabular-nums">{msg.timestamp}</span>
                  </div>
                )}

                <div className={isUser ? 'text-white leading-relaxed' : 'space-y-1 text-[#17231B]'}>
                  {isUser ? msg.text : renderFormattedText(msg.text)}
                </div>

                {isUser && (
                  <div className="text-[10px] text-[#DCFCE7] text-right mt-1 tabular-nums">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 animate-spin" />
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-xs text-[#647067] flex items-center gap-2">
              <span className="font-semibold text-[#15803D]">Gemini AI 3.8 Flash</span>
              <span>sedang menyiapkan jawaban pertanian yang tepat buat Bosku...</span>
            </div>
          </div>
        )}
      </div>

      {/* Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="relative flex-1">
          <MessageSquare className="h-4 w-4 text-[#647067] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tanya tanaman apa saja (padi, jagung, sayur, durian, alpukat, jeruk, jambu, bunga hias, obat & pupuk)..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 focus:border-[#15803D] focus:outline-none text-xs sm:text-sm text-[#17231B] placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetChatWithNewMemory}
            title="Reset & mulai percakapan baru dengan memori baru"
            className="h-11 px-3.5 rounded-xl border border-slate-300 hover:border-[#15803D] bg-slate-50 hover:bg-[#DCFCE7] text-[#17231B] hover:text-[#14532D] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-[#15803D]" />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="h-11 px-5 rounded-xl bg-[#15803D] hover:bg-[#14532D] disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Tanya Kang Tani AI</span>
          </button>
        </div>
      </form>
    </section>
  );
};
