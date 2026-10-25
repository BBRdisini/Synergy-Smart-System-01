import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Sprout,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  ActivityLogItem,
  CommodityType,
  ExpenseRecord,
  FarmPlot,
  HarvestRecord,
} from '../types/agronomy';
import {
  calculateInputsAndFinancials,
  formatIndonesianDate,
} from '../utils/agronomyCalculations';

interface RecordsAndCalculatorViewProps {
  plots: FarmPlot[];
  selectedPlotId: string;
  onSelectPlot: (plotId: string) => void;
  activityLogs: ActivityLogItem[];
  expenses: ExpenseRecord[];
  harvests: HarvestRecord[];
  onAddActivityLog: (log: ActivityLogItem) => void;
  onAddExpense: (exp: ExpenseRecord) => void;
  onAddHarvest: (harv: HarvestRecord) => void;
}

export const RecordsAndCalculatorView: React.FC<RecordsAndCalculatorViewProps> = ({
  plots,
  selectedPlotId,
  onSelectPlot,
  activityLogs,
  expenses,
  harvests,
  onAddActivityLog,
  onAddExpense,
  onAddHarvest,
}) => {
  // Screen 12 Tabs: Riwayat, Biaya, Hasil Panen, Kalkulator
  const [subTab, setSubTab] = useState<'Riwayat' | 'Biaya' | 'Hasil Panen' | 'Kalkulator'>('Riwayat');
  const activePlot = plots.find((p) => p.id === selectedPlotId) || plots[0];

  // Add Activity Form
  const [actTitle, setActTitle] = useState('');
  const [actCategory, setActCategory] = useState<ActivityLogItem['category']>('Pemupukan');
  const [actDate, setActDate] = useState('2025-05-12');
  const [actDetail, setActDetail] = useState('');

  // Add Expense Form
  const [expName, setExpName] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('Pupuk');
  const [expQty, setExpQty] = useState('100');
  const [expUnit, setExpUnit] = useState('kg');
  const [expPrice, setExpPrice] = useState('2500');

  // Add Harvest Form
  const [harvDate, setHarvDate] = useState('2025-07-11');
  const [harvGrossKg, setHarvGrossKg] = useState('8200');
  const [harvMoisturePct, setHarvMoisturePct] = useState('18.0');
  const [harvLossPct, setHarvLossPct] = useState('2.0');
  const [harvPriceRp, setHarvPriceRp] = useState('6600');

  // Calculator State (Section 11)
  const [calcAreaHa, setCalcAreaHa] = useState(String(activePlot?.areaHa ?? 1.2));
  const [calcCommodity, setCalcCommodity] = useState<CommodityType>(activePlot?.commodity ?? 'Padi');
  const [calcMethod, setCalcMethod] = useState<'Jajar Legowo 2:1' | 'Tegel (25x25 cm)' | 'Tabela'>('Jajar Legowo 2:1');
  const [calcSeedPrice, setCalcSeedPrice] = useState('14000');
  const [calcUreaPrice, setCalcUreaPrice] = useState('2500');
  const [calcNpkPrice, setCalcNpkPrice] = useState('2600');
  const [calcSprayDosage, setCalcSprayDosage] = useState('1.0');
  const [calcSprayVol, setCalcSprayVol] = useState('500');
  const [calcTankCap, setCalcTankCap] = useState('16');
  const [calcLaborHa, setCalcLaborHa] = useState('4500000');
  const [calcPrepHa, setCalcPrepHa] = useState('2000000');
  const [calcHarvestHa, setCalcHarvestHa] = useState('1800000');
  const [calcTargetYieldTon, setCalcTargetYieldTon] = useState('6.8');
  const [calcGabahPrice, setCalcGabahPrice] = useState('6500');

  const calcResult = calculateInputsAndFinancials({
    areaHa: parseFloat(calcAreaHa),
    commodity: calcCommodity,
    plantingMethod: calcMethod,
    seedPricePerKgRp: parseFloat(calcSeedPrice) || 0,
    ureaPricePerKgRp: parseFloat(calcUreaPrice) || 0,
    npkPricePerKgRp: parseFloat(calcNpkPrice) || 0,
    sprayDosageMlPerLiter: parseFloat(calcSprayDosage) || 0,
    sprayVolumeLiterPerHa: parseFloat(calcSprayVol) || 0,
    tankCapacityLiter: parseFloat(calcTankCap) || 16,
    laborCostPerHaRp: parseFloat(calcLaborHa) || 0,
    landPrepAndToolCostPerHaRp: parseFloat(calcPrepHa) || 0,
    harvestAndPostHarvestCostPerHaRp: parseFloat(calcHarvestHa) || 0,
    targetYieldTonPerHa: parseFloat(calcTargetYieldTon) || 0,
    expectedPricePerKgGabahRp: parseFloat(calcGabahPrice) || 0,
  });

  const totalActualExpenseRp = expenses.reduce((acc, e) => acc + e.totalRp, 0);
  const totalActualHarvestRevenueRp = harvests.reduce((acc, h) => acc + h.totalRevenueRp, 0);

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim() || !activePlot) return;
    onAddActivityLog({
      id: `log-${Date.now()}`,
      plotId: activePlot.id,
      plotName: `${activePlot.name} (${activePlot.commodity})`,
      commodity: activePlot.commodity,
      dateLabel: formatIndonesianDate(actDate),
      isoDate: actDate,
      title: actTitle.trim(),
      category: actCategory,
      detail: actDetail.trim() || 'Catatan kegiatan lapangan petani.',
    });
    setActTitle('');
    setActDetail('');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expName.trim() || !activePlot) return;
    const q = parseFloat(expQty) || 0;
    const p = parseFloat(expPrice) || 0;
    if (q <= 0 || p <= 0) return;

    onAddExpense({
      id: `exp-${Date.now()}`,
      plotId: activePlot.id,
      plotName: activePlot.name,
      date: new Date().toISOString().slice(0, 10),
      category: expCategory,
      itemName: expName.trim(),
      quantity: q,
      unit: expUnit,
      unitPriceRp: p,
      totalRp: Math.round(q * p),
      isActual: true,
    });
    setExpName('');
  };

  const handleCreateHarvest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlot) return;
    const gross = parseFloat(harvGrossKg) || 0;
    const loss = parseFloat(harvLossPct) || 0;
    const price = parseFloat(harvPriceRp) || 0;
    if (gross <= 0 || price <= 0) return;

    const net = Math.round(gross * (1 - loss / 100));
    onAddHarvest({
      id: `harv-${Date.now()}`,
      plotId: activePlot.id,
      plotName: activePlot.name,
      commodity: activePlot.commodity,
      variety: activePlot.variety,
      harvestDate: harvDate,
      grossYieldKg: gross,
      moistureContentPct: parseFloat(harvMoisturePct) || 18,
      estimatedLossPct: loss,
      netYieldKg: net,
      sellingPricePerKgRp: price,
      totalRevenueRp: Math.round(net * price),
      notes: `Panen tercatat pada ${formatIndonesianDate(harvDate)}`,
    });
  };

  const handleExportCsv = () => {
    const rows = [
      ['Tipe', 'Tanggal', 'Lahan', 'Kategori/Uraian', 'Jumlah', 'Nilai (Rp)'],
      ...expenses.map((e) => [
        'Biaya Aktual',
        e.date,
        e.plotName,
        `${e.category} - ${e.itemName}`,
        `${e.quantity} ${e.unit}`,
        String(e.totalRp),
      ]),
      ...harvests.map((h) => [
        'Hasil Panen',
        h.harvestDate,
        h.plotName,
        `${h.commodity} (${h.variety})`,
        `${h.netYieldKg} kg bersih`,
        String(h.totalRevenueRp),
      ]),
    ];

    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan-TaniCerdas-AI-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Segmented Tabs matching Screen 12 (Riwayat, Biaya, Hasil Panen + Kalkulator) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#17231B]">
            Catatan Lahan, Kalkulator Saprodi & Laporan Keuangan
          </h1>
          <p className="text-xs text-[#647067] mt-0.5">
            Rekam jejak kegiatan budidaya, pembukuan biaya aktual, hasil panen, dan kalkulator dosis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#F7FAF7] p-1.5 rounded-xl border border-slate-200">
          {(['Riwayat', 'Biaya', 'Hasil Panen', 'Kalkulator'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubTab(tab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                subTab === tab
                  ? 'bg-[#15803D] text-white shadow-sm'
                  : 'text-[#647067] hover:text-[#17231B]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-[#647067] block">Total Biaya Tercatat (Aktual)</span>
          <strong className="text-xl font-bold text-[#17231B] tabular-nums mt-1 block">
            Rp {totalActualExpenseRp.toLocaleString('id-ID')}
          </strong>
          <span className="text-[11px] text-[#647067]">{expenses.length} transaksi sarana produksi</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200">
          <span className="text-xs text-[#647067] block">Pendapatan Panen Tercatat</span>
          <strong className="text-xl font-bold text-[#15803D] tabular-nums mt-1 block">
            Rp {totalActualHarvestRevenueRp.toLocaleString('id-ID')}
          </strong>
          <span className="text-[11px] text-[#647067]">{harvests.length} catatan hasil panen</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#647067] block">Selisih Kas / Laba Tercatat</span>
            <strong className="text-xl font-bold text-[#14532D] tabular-nums mt-1 block">
              Rp {(totalActualHarvestRevenueRp - totalActualExpenseRp).toLocaleString('id-ID')}
            </strong>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-10 px-3.5 rounded-xl bg-[#DCFCE7] hover:bg-emerald-200 text-[#14532D] text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Riwayat Timeline (Screen 12) */}
      {subTab === 'Riwayat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Timeline matching Screen 12 */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-[#17231B]">
                Riwayat Kegiatan — {activePlot ? `${activePlot.name} (${activePlot.commodity})` : 'Semua Lahan'}
              </h2>
              <select
                aria-label="Filter Lahan Catatan"
                value={activePlot?.id || ''}
                onChange={(e) => onSelectPlot(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-[#F7FAF7] text-xs font-semibold text-[#17231B]"
              >
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.commodity})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-600/30">
              {activityLogs.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[21px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#15803D]" />
                  <div className="rounded-xl bg-[#F7FAF7] p-3.5 border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs text-[#647067] tabular-nums">
                      <span className="font-bold text-[#15803D]">{item.dateLabel}</span>
                      <span>{item.plotName}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#17231B] mt-0.5">{item.title}</h3>
                    <p className="text-xs text-[#647067] mt-0.5">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Activity Form */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#17231B] mb-3">
              Catat Kegiatan Lapangan Baru
            </h3>
            <form onSubmit={handleCreateActivity} className="space-y-3">
              <div>
                <label htmlFor="act-title" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Judul Kegiatan *
                </label>
                <input
                  id="act-title"
                  type="text"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="Contoh: Penyiangan Gulma Tahap I"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="act-cat" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Kategori
                  </label>
                  <select
                    id="act-cat"
                    value={actCategory}
                    onChange={(e) => setActCategory(e.target.value as ActivityLogItem['category'])}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="Pemupukan">Pemupukan</option>
                    <option value="Penyemprotan">Penyemprotan</option>
                    <option value="Pengamatan">Pengamatan</option>
                    <option value="Pengairan">Pengairan</option>
                    <option value="Tanam">Tanam</option>
                    <option value="Panen">Panen</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="act-date" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Tanggal
                  </label>
                  <input
                    id="act-date"
                    type="date"
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="act-detail" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Rincian Dosis / Hasil Pengamatan
                </label>
                <textarea
                  id="act-detail"
                  rows={2}
                  value={actDetail}
                  onChange={(e) => setActDetail(e.target.value)}
                  placeholder="Contoh: Dosis Urea 100 kg/ha pada kondisi air macak-macak"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-semibold cursor-pointer"
              >
                + Simpan ke Riwayat Lahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SubTab 2: Biaya Ledger */}
      {subTab === 'Biaya' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 overflow-x-auto">
            <h2 className="text-base font-bold text-[#17231B] mb-3">
              Rincian Pengeluaran Sarana Produksi & Tenaga Kerja
            </h2>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#647067]">
                  <th className="py-2.5 pr-3">Tanggal</th>
                  <th className="py-2.5 pr-3">Uraian & Kategori</th>
                  <th className="py-2.5 pr-3 text-right">Volume</th>
                  <th className="py-2.5 text-right">Total (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3 pr-3 tabular-nums text-[#647067]">{exp.date}</td>
                    <td className="py-3 pr-3">
                      <div className="font-bold text-[#17231B]">{exp.itemName}</div>
                      <div className="text-[11px] text-[#647067]">
                        {exp.category} · {exp.plotName}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      {exp.quantity} {exp.unit}
                    </td>
                    <td className="py-3 text-right font-bold text-[#17231B] tabular-nums">
                      Rp {exp.totalRp.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#17231B] mb-3">Catat Biaya Baru</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label htmlFor="exp-name" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Nama Pengeluaran / Barang *
                </label>
                <input
                  id="exp-name"
                  type="text"
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  placeholder="Contoh: Pupuk NPK Phonska"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label htmlFor="exp-cat" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Kategori Biaya
                </label>
                <select
                  id="exp-cat"
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseRecord['category'])}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="Pupuk">Pupuk</option>
                  <option value="Benih">Benih</option>
                  <option value="Pestisida">Pestisida</option>
                  <option value="Tenaga Kerja">Tenaga Kerja</option>
                  <option value="Sewa Alat & Olah Lahan">Sewa Alat & Olah Lahan</option>
                  <option value="Panen & Pascapanen">Panen & Pascapanen</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="exp-qty" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Jumlah
                  </label>
                  <input
                    id="exp-qty"
                    type="number"
                    value={expQty}
                    onChange={(e) => setExpQty(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="exp-unit" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Satuan
                  </label>
                  <input
                    id="exp-unit"
                    type="text"
                    value={expUnit}
                    onChange={(e) => setExpUnit(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="exp-price" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Harga/Satuan (Rp)
                  </label>
                  <input
                    id="exp-price"
                    type="number"
                    value={expPrice}
                    onChange={(e) => setExpPrice(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-semibold cursor-pointer"
              >
                + Simpan Catatan Biaya
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SubTab 3: Hasil Panen Ledger */}
      {subTab === 'Hasil Panen' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h2 className="text-base font-bold text-[#17231B]">Catatan Hasil Panen Aktual</h2>
            {harvests.map((h) => (
              <div key={h.id} className="p-4 rounded-xl bg-[#F7FAF7] border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#17231B]">
                      {h.plotName} — {h.commodity} ({h.variety})
                    </h3>
                    <p className="text-xs text-[#647067] tabular-nums">
                      Tanggal Panen: {h.harvestDate} · Kadar Air: {h.moistureContentPct}% · Susut: {h.estimatedLossPct}%
                    </p>
                  </div>
                  <div className="text-right">
                    <strong className="text-sm font-bold text-[#15803D] tabular-nums block">
                      Rp {h.totalRevenueRp.toLocaleString('id-ID')}
                    </strong>
                    <span className="text-xs text-[#17231B] tabular-nums">
                      {h.netYieldKg.toLocaleString('id-ID')} kg bersih @ Rp {h.sellingPricePerKgRp.toLocaleString('id-ID')}/kg
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#17231B] mb-3">Catat Hasil Panen Baru</h3>
            <form onSubmit={handleCreateHarvest} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="harv-date" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Tanggal Panen
                  </label>
                  <input
                    id="harv-date"
                    type="date"
                    value={harvDate}
                    onChange={(e) => setHarvDate(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="harv-gross" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Bobot Kotor GKP (kg)
                  </label>
                  <input
                    id="harv-gross"
                    type="number"
                    value={harvGrossKg}
                    onChange={(e) => setHarvGrossKg(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="harv-moist" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Kadar Air (%)
                  </label>
                  <input
                    id="harv-moist"
                    type="number"
                    step="0.1"
                    value={harvMoisturePct}
                    onChange={(e) => setHarvMoisturePct(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="harv-loss" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Susut (%)
                  </label>
                  <input
                    id="harv-loss"
                    type="number"
                    step="0.1"
                    value={harvLossPct}
                    onChange={(e) => setHarvLossPct(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="harv-price" className="block text-xs font-semibold text-[#17231B] mb-1">
                    Harga Jual/kg (Rp)
                  </label>
                  <input
                    id="harv-price"
                    type="number"
                    value={harvPriceRp}
                    onChange={(e) => setHarvPriceRp(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-[#15803D] hover:bg-[#14532D] text-white text-xs font-semibold cursor-pointer"
              >
                + Simpan Hasil Panen & Hitung Pendapatan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SubTab 4: Kalkulator Kebutuhan & Biaya (Section 11) */}
      {subTab === 'Kalkulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Inputs */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5">
            <h2 className="text-base font-bold text-[#17231B]">
              Input Parameter Lahan & Harga Satuan Lokal
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="calc-area" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Luas Lahan (Ha)
                </label>
                <input
                  id="calc-area"
                  type="number"
                  step="0.1"
                  value={calcAreaHa}
                  onChange={(e) => setCalcAreaHa(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="calc-method" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Sistem Tanam
                </label>
                <select
                  id="calc-method"
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value as any)}
                  className="w-full h-10 px-2.5 rounded-xl border border-slate-200 bg-white text-xs"
                >
                  <option value="Jajar Legowo 2:1">Jajar Legowo 2:1</option>
                  <option value="Tegel (25x25 cm)">Tegel (25x25 cm)</option>
                  <option value="Tabela">Tabela (Benih Langsung)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label htmlFor="calc-dosage" className="block text-[11px] font-semibold text-[#17231B] mb-1">
                  Dosis Label (ml/L)
                </label>
                <input
                  id="calc-dosage"
                  type="number"
                  step="0.1"
                  value={calcSprayDosage}
                  onChange={(e) => setCalcSprayDosage(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="calc-vol" className="block text-[11px] font-semibold text-[#17231B] mb-1">
                  Vol Semprot (L/Ha)
                </label>
                <input
                  id="calc-vol"
                  type="number"
                  value={calcSprayVol}
                  onChange={(e) => setCalcSprayVol(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="calc-tank" className="block text-[11px] font-semibold text-[#17231B] mb-1">
                  Ukuran Tangki (L)
                </label>
                <input
                  id="calc-tank"
                  type="number"
                  value={calcTankCap}
                  onChange={(e) => setCalcTankCap(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="calc-target" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Target Hasil (Ton/Ha)
                </label>
                <input
                  id="calc-target"
                  type="number"
                  step="0.1"
                  value={calcTargetYieldTon}
                  onChange={(e) => setCalcTargetYieldTon(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="calc-gabah" className="block text-xs font-semibold text-[#17231B] mb-1">
                  Harga Gabah (Rp/kg)
                </label>
                <input
                  id="calc-gabah"
                  type="number"
                  value={calcGabahPrice}
                  onChange={(e) => setCalcGabahPrice(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl border border-slate-200 text-xs tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Right Outputs */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <h2 className="text-base font-bold text-[#17231B]">
              Hasil Perhitungan Kebutuhan Saprodi, Takaran Tangki & Analisis Usaha Tani
            </h2>

            {!calcResult.isValid ? (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] space-y-1">
                {calcResult.validationErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F7FAF7] border border-slate-200">
                    <span className="text-xs text-[#647067] block">Kebutuhan Benih</span>
                    <strong className="text-lg font-bold text-[#17231B] tabular-nums">
                      {calcResult.seedRequiredKg} kg
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F7FAF7] border border-slate-200">
                    <span className="text-xs text-[#647067] block">Pupuk Urea & NPK</span>
                    <strong className="text-sm font-bold text-[#17231B] tabular-nums block mt-0.5">
                      Urea: {calcResult.ureaTotalKg} kg · NPK: {calcResult.npkTotalKg} kg
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#DCFCE7]/40 border border-[#15803D]/25">
                    <span className="text-xs text-[#14532D] block">Takaran Semprot Label</span>
                    <strong className="text-sm font-bold text-[#14532D] tabular-nums block mt-0.5">
                      {calcResult.pesticidePerTankMl} ml / tangki ({calcTankCap} L)
                    </strong>
                    <span className="text-[11px] text-[#647067] tabular-nums">
                      Total: {calcResult.pesticideTotalMl} ml ({calcResult.numberOfTanksRequired} tangki)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-[#647067] block">Estimasi Total Biaya</span>
                    <strong className="text-base font-bold text-[#17231B] tabular-nums">
                      Rp {calcResult.totalEstimatedCostRp.toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-[#647067] block">Estimasi Pendapatan</span>
                    <strong className="text-base font-bold text-[#15803D] tabular-nums">
                      Rp {calcResult.estimatedRevenueRp.toLocaleString('id-ID')}
                    </strong>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#DCFCE7]/50 border border-[#15803D]/30">
                    <span className="text-xs text-[#14532D] block">Estimasi Laba Bersih (R/C {calcResult.rcRatio})</span>
                    <strong className="text-base font-bold text-[#14532D] tabular-nums">
                      Rp {calcResult.estimatedNetProfitRp.toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                <div className="rounded-xl bg-[#F7FAF7] p-3.5 border border-slate-200 text-xs text-[#647067] space-y-1">
                  <div className="font-bold text-[#17231B]">Rumus & Asumsi Perhitungan:</div>
                  {calcResult.assumptions.map((a, i) => (
                    <p key={i}>• {a}</p>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
