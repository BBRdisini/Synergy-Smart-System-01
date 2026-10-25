import React, { useState } from 'react';
import {
  BookOpen,
  Bug,
  ChevronRight,
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react';
import {
  AgronomyGuideModule,
  FarmPlot,
  PestDiseaseCatalogItem,
  PesticideProduct,
} from '../types/agronomy';
import {
  AGRONOMY_GUIDE_MODULES,
  PEST_DISEASE_CATALOG,
  VERIFIED_PESTICIDE_PRODUCTS,
} from '../data/agronomyDatabase';
import { SymptomLeafIllustration } from './VisualAssets';

interface GuideAndCatalogViewProps {
  plots: FarmPlot[];
  initialSubTab?: 'Panduan' | 'Tanya AI' | 'Katalog Hama';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const QUICK_AI_PROMPTS = [
  'Apa yang harus saya lakukan hari ini?',
  'Mengapa daun padi menguning?',
  'Kapan perkiraan panen saya?',
  'Berapa kebutuhan pupuk untuk lahan saya?',
];

export const GuideAndCatalogView: React.FC<GuideAndCatalogViewProps> = ({
  plots,
  initialSubTab = 'Panduan',
}) => {
  const [activeTab, setActiveTab] = useState<'Panduan' | 'Tanya AI' | 'Katalog Hama'>(initialSubTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<AgronomyGuideModule>(AGRONOMY_GUIDE_MODULES[0]);

  // Catalog filter matching Screen 11: Penyakit, Hama, Defisiensi Hara
  const [catalogCategory, setCatalogCategory] = useState<'Semua' | 'Penyakit' | 'Hama' | 'Defisiensi Hara'>('Semua');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<PestDiseaseCatalogItem | null>(null);

  // AI Assistant state (Section 12)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-ai',
      sender: 'ai',
      text: 'Halo Pak Budi Santoso! Saya Asisten Agronomi TaniCerdas AI. Saya terhubung dengan data Lahan 1 (Padi Ciherang, 1,2 Ha, Vegetatif 20 HST) di Desa Larikrejo, Kudus. Silakan pilih pertanyaan cepat di bawah atau ketik pertanyaan budidaya Anda.',
      timestamp: '08:00 WIB',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);

  const filteredGuides = AGRONOMY_GUIDE_MODULES.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.commodity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCatalog = PEST_DISEASE_CATALOG.filter((item) => {
    if (catalogCategory !== 'Semua' && item.category !== catalogCategory) return false;
    if (
      searchQuery.trim() &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.scientificName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleSendQuestion = async (questionText: string) => {
    const cleanQ = questionText.trim();
    if (!cleanQ || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: cleanQ,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsSendingChat(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: cleanQ,
          farmContext: plots.map((p) => ({
            name: p.name,
            commodity: p.commodity,
            variety: p.variety,
            areaHa: p.areaHa,
            currentHst: p.currentHst,
            phase: p.currentPhaseName,
            soilPh: p.soilObservation.ph,
          })),
        }),
      });
      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply || 'Terima kasih, silakan periksa rekomendasi pemeliharaan pada kalender lahan Anda.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        },
      ]);
    } catch (_err) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'Mode Offline: Untuk Lahan 1 (Padi Ciherang 20 HST), fokuskan pada pemupukan Urea susulan (±100 kg/Ha) pada kondisi air macak-macak dan pengamatan bercak daun Blas.',
          timestamp: 'Mode Offline',
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Segmented Tabs matching Screen 10 & 11 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17231B]">
            Panduan Budidaya, Konsultasi AI & Katalog Penyakit
          </h1>
          <p className="text-xs text-[#647067] mt-0.5">
            Basis pengetahuan multi-komoditas terverifikasi BB Padi / Kementan RI (Tersedia dalam Mode Offline)
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F7FAF7] p-1.5 rounded-xl border border-slate-200">
          {(['Panduan', 'Tanya AI', 'Katalog Hama'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-[#15803D] text-white shadow-sm'
                  : 'text-[#647067] hover:text-[#17231B]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Panduan Budidaya (Screen 10) */}
      {activeTab === 'Panduan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left List of Guides matching Screen 10 */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 text-[#647067] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari panduan budidaya, pemupukan, varietas..."
                aria-label="Cari panduan"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F7FAF7] border border-slate-200 text-xs text-[#17231B] focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div className="space-y-2.5">
              {filteredGuides.map((guide) => {
                const isSelected = selectedGuide.id === guide.id;
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuide(guide)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#DCFCE7]/35 border-[#15803D]'
                        : 'bg-white border-slate-200 hover:border-emerald-600/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shrink-0">
                        <Sprout className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-bold text-[#17231B] truncate">{guide.title}</h2>
                        <p className="text-xs text-[#647067] truncate mt-0.5">{guide.subtitle}</p>
                        <p className="text-[11px] text-[#15803D] mt-1">
                          {guide.commodity} · {guide.readingTimeMinutes} menit baca
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Guide Reader */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
            <div className="pb-4 border-b border-slate-100">
              <div className="text-xs text-[#15803D] font-semibold">
                {selectedGuide.commodity} · {selectedGuide.category} · {selectedGuide.reliabilityLevel}
              </div>
              <h2 className="text-2xl font-bold text-[#17231B] mt-1">{selectedGuide.title}</h2>
              <p className="text-sm text-[#647067] mt-1">{selectedGuide.subtitle}</p>
              <p className="text-xs text-[#647067] mt-2">
                Sumber: <strong className="text-[#17231B]">{selectedGuide.sourceReference}</strong> · Wilayah:{' '}
                {selectedGuide.applicableRegion} · Pembaruan: {selectedGuide.updatedAt}
              </p>
            </div>

            <div className="rounded-xl bg-[#F7FAF7] p-4 border border-slate-200">
              <h3 className="text-sm font-bold text-[#17231B] mb-2">Prinsip Kunci Agronomi</h3>
              <ul className="space-y-1.5 text-xs text-[#17231B]">
                {selectedGuide.keyPoints.map((pt, i) => (
                  <li key={i}>• {pt}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#17231B]">Tahapan Pelaksanaan Teknis</h3>
              {selectedGuide.steps.map((st, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                  <h4 className="text-sm font-bold text-[#14532D]">{st.stepTitle}</h4>
                  <p className="text-xs text-[#17231B] mt-1 leading-relaxed">{st.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tanya AI — Asisten AI Pertanian (Section 12) */}
      {activeTab === 'Tanya AI' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#17231B]">
                Konsultasi Asisten AI Pertanian (Kontekstual Lahan)
              </h2>
              <p className="text-xs text-[#647067]">
                Menjawab berdasarkan profil lahan, varietas, fase HST, dan basis pengetahuan agronomi terverifikasi
              </p>
            </div>
            <span className="text-xs font-semibold text-[#15803D]">
              Konteks Aktif: {plots.length} Lahan Terhubung
            </span>
          </div>

          {/* Quick Prompt Buttons */}
          <div className="flex flex-wrap gap-2">
            {QUICK_AI_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendQuestion(q)}
                className="px-3 py-1.5 rounded-xl bg-[#DCFCE7]/60 hover:bg-[#DCFCE7] text-[#14532D] text-xs font-semibold transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Message Stream */}
          <div className="h-80 overflow-y-auto rounded-2xl bg-[#F7FAF7] p-4 space-y-3 border border-slate-200">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#15803D] text-white'
                      : 'bg-white text-[#17231B] border border-slate-200 shadow-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block mt-1.5 text-[10px] ${
                      msg.sender === 'user' ? 'text-emerald-100' : 'text-[#647067]'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuestion(chatInput);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tanyakan seputar budidaya padi, jadwal pupuk, atau gejala daun menguning..."
              aria-label="Pertanyaan untuk Asisten AI"
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-xs text-[#17231B] focus:outline-none focus:border-[#15803D]"
            />
            <button
              type="submit"
              disabled={isSendingChat}
              className="h-11 px-5 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Kirim</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Katalog Penyakit & Hama (Screen 11: Blas, Tungro, Wereng Batang Coklat, Penggerek Batang, Hawar Daun) */}
      {activeTab === 'Katalog Hama' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-[#F7FAF7] p-1.5 rounded-xl border border-slate-200">
              {(['Semua', 'Penyakit', 'Hama', 'Defisiensi Hara'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    catalogCategory === cat
                      ? 'bg-[#15803D] text-white shadow-sm'
                      : 'text-[#647067] hover:text-[#17231B]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-[#647067] absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari organisme / gejala..."
                aria-label="Cari katalog hama dan penyakit"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F7FAF7] border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Grid of Catalog Cards matching Screen 11 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedCatalogItem(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCatalogItem(item);
                  }
                }}
                className="rounded-2xl border border-slate-200 p-4 hover:border-[#15803D] transition-all flex items-center gap-4 cursor-pointer bg-white"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                  <SymptomLeafIllustration
                    visualKey={item.visualKey}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#17231B] truncate">{item.name}</h3>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </div>
                  <p className="text-xs italic text-[#647067] truncate">({item.scientificName})</p>
                  <p className="text-xs text-[#15803D] font-semibold mt-1">
                    {item.commodity} · {item.category}
                  </p>
                  <p className="text-xs text-[#647067] line-clamp-2 mt-1">{item.shortSummary}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal for Catalog Item */}
      {selectedCatalogItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail ${selectedCatalogItem.name}`}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-semibold text-[#15803D]">
                  {selectedCatalogItem.commodity} · {selectedCatalogItem.category}
                </span>
                <h3 className="text-lg font-bold text-[#17231B]">
                  {selectedCatalogItem.name} ({selectedCatalogItem.scientificName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCatalogItem(null)}
                aria-label="Tutup detail katalog"
                className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200">
              <SymptomLeafIllustration
                visualKey={selectedCatalogItem.visualKey}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-[#17231B] leading-relaxed">
              {selectedCatalogItem.shortSummary}
            </p>

            <div className="rounded-xl bg-[#F7FAF7] p-3.5 border border-slate-200">
              <h4 className="text-xs font-bold text-[#17231B]">Gejala Spesifik di Lapangan:</h4>
              <ul className="mt-1.5 space-y-1 text-xs text-[#647067]">
                {selectedCatalogItem.symptoms.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-[#DCFCE7]/40 p-3.5 border border-[#15803D]/20">
              <h4 className="text-xs font-bold text-[#14532D]">
                Pengendalian Hama Terpadu (PHT):
              </h4>
              <ul className="mt-1.5 space-y-1 text-xs text-[#17231B]">
                {selectedCatalogItem.ipmControl.map((c, i) => (
                  <li key={i}>• {c}</li>
                ))}
              </ul>
            </div>

            <div className="text-[11px] text-[#647067]">
              Referensi: {selectedCatalogItem.sourceReference}
            </div>

            <button
              type="button"
              onClick={() => setSelectedCatalogItem(null)}
              className="w-full h-11 rounded-xl bg-[#15803D] text-white text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
