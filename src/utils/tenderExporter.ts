import * as XLSX from 'xlsx';
import type { TenderProject, BoQItem } from '../App';
import type { CommercialSummaryConfig } from '../components/OverheadModal';

interface ExportTenderOptions {
  tender: TenderProject;
  commercialConfig: CommercialSummaryConfig;
  grandTotalDirect: number;
  totalIndirectCost: number;
  calculateBoqTotals: (boq: BoQItem) => { totalDirect: number; unitPrice: number };
}

export const exportTenderToExcel = ({
  tender,
  commercialConfig,
  grandTotalDirect,
  totalIndirectCost,
  calculateBoqTotals
}: ExportTenderOptions) => {
  // 1. Perhitungan Rekapitulasi Komersial Tender
  const baseCost = grandTotalDirect + totalIndirectCost;
  const contingencyCost = baseCost * ((commercialConfig.contingencyPercent || 0) / 100);
  const totalBeforeProfit = baseCost + contingencyCost;
  const profitCost = totalBeforeProfit * ((commercialConfig.profitMarginPercent || 0) / 100);
  const subtotalBid = totalBeforeProfit + profitCost;
  const taxCost = subtotalBid * ((commercialConfig.taxPercent || 0) / 100);
  const finalBidTotal = commercialConfig.includeTaxInBid ? subtotalBid + taxCost : subtotalBid;

  // Faktor Pengali Penawaran terhadap Direct Cost
  const markupFactor = grandTotalDirect > 0 ? (subtotalBid / grandTotalDirect) : 1;

  // 2. Susun Baris Data Sheet 1: Rekap Penawaran BoQ
  const boqSheetData: (string | number)[][] = [
    // Header Baris 1: Judul Laporan
    [`REKAPITULASI HARGA PENAWARAN TENDER — ${tender.title.toUpperCase()}`],
    [`Klien: ${tender.client} | Tanggal Export: ${new Date().toLocaleDateString('id-ID')} | Penanggung Jawab: ${tender.author || 'Estimator'}`],
    [], // Baris Kosong
    // Header Tabel (Kolom A adalah Line ID / Unique Key untuk XLOOKUP / VLOOKUP)
    [
      'Line ID (Lookup Key)',
      'No Item',
      'Uraian Pekerjaan / Spesifikasi',
      'Kategori / Bab',
      'Volume (Qty)',
      'Satuan',
      'Direct Unit Rate (Rp)',
      'Total Direct Cost (Rp)',
      'Harga Satuan Penawaran (Rp)',
      'Total Harga Penawaran (Rp)',
      'Rincian Resource'
    ]
  ];

  let currentCategory = 'UMUM';

  tender.boqList.forEach((boq, idx) => {
    if (boq.isCategory) {
      currentCategory = boq.itemNo ? `${boq.itemNo} - ${boq.description}` : boq.description;
      boqSheetData.push([
        boq.rawLineId || boq.itemNo || `BAB-${idx + 1}`,
        boq.itemNo || '-',
        boq.description.toUpperCase(),
        'HEADER BAB',
        '',
        '',
        '',
        '',
        '',
        '',
        'Bab / Section Header'
      ]);
      return;
    }

    const { totalDirect, unitPrice } = calculateBoqTotals(boq);
    const bidTotal = totalDirect * markupFactor;
    const bidUnitPrice = boq.qty > 0 ? bidTotal / boq.qty : 0;

    const resourceSummary = boq.treatments && boq.treatments.length > 0
      ? boq.treatments.map(t => `${t.description || t.category} (${t.qty} ${t.unit})`).join('; ')
      : 'Estimasi Mandiri';

    boqSheetData.push([
      boq.rawLineId || boq.itemNo || `R${idx + 1}`,
      boq.itemNo || '-',
      boq.description,
      currentCategory,
      boq.qty,
      boq.unit,
      Math.round(unitPrice),
      Math.round(totalDirect),
      Math.round(bidUnitPrice),
      Math.round(bidTotal),
      resourceSummary
    ]);
  });

  // Baris Total di bagian bawah tabel BoQ
  boqSheetData.push([]);
  boqSheetData.push([
    'TOTAL',
    '',
    'GRAND TOTAL PENAWARAN (SEBELUM PPN)',
    '',
    '',
    '',
    '',
    Math.round(grandTotalDirect),
    '',
    Math.round(subtotalBid),
    ''
  ]);
  if (commercialConfig.includeTaxInBid) {
    boqSheetData.push([
      'TOTAL+PPN',
      '',
      `GRAND TOTAL PENAWARAN (TERMASUK PPN ${commercialConfig.taxPercent}%)`,
      '',
      '',
      '',
      '',
      '',
      '',
      Math.round(finalBidTotal),
      ''
    ]);
  }

  // 3. Susun Baris Data Sheet 2: Ringkasan Komersial & Formula Guide
  const summarySheetData: (string | number)[][] = [
    ['RINGKASAN KALKULASI FINANSIAL & PANDUAN FORMULA LOOKUP'],
    [`Proyek: ${tender.title}`],
    [],
    ['KOMPONEN BIAYA & MARGIN', 'NILAI / PERSENTASE', 'KETERANGAN'],
    ['Total Direct Cost (Biaya Langsung)', Math.round(grandTotalDirect), 'Jumlah dari seluruh breakdown material, alat, tenaga kerja BoQ'],
    ['Total Indirect Cost (Overhead Proyek)', Math.round(totalIndirectCost), `${tender.overheadItems?.length || 0} item overhead & operasional`],
    ['Durasi Proyek', `${commercialConfig.projectDurationMonths || 1} Bulan`, 'Periode pelaksanaan pekerjaan'],
    ['Base Cost (Direct + Indirect)', Math.round(baseCost), 'Direct Cost + Indirect Cost'],
    ['Contingency / Biaya Tak Terduga', `${commercialConfig.contingencyPercent}% (Rp ${Math.round(contingencyCost).toLocaleString('id-ID')})`, 'Dicadangkan untuk risiko eskalasi'],
    ['Total Cost Sebelum Margin', Math.round(totalBeforeProfit), 'Base Cost + Contingency'],
    ['Profit Margin', `${commercialConfig.profitMarginPercent}% (Rp ${Math.round(profitCost).toLocaleString('id-ID')})`, 'Target laba kotor perusahaan'],
    ['Subtotal Penawaran (Sebelum PPN)', Math.round(subtotalBid), 'Harga penawaran dasar'],
    ['PPN (Pajak Pertambahan Nilai)', `${commercialConfig.taxPercent}% (Rp ${Math.round(taxCost).toLocaleString('id-ID')})`, 'Kewajiban pajak'],
    ['GRAND TOTAL AKHIR PENAWARAN', Math.round(finalBidTotal), commercialConfig.includeTaxInBid ? 'Termasuk PPN' : 'Belum termasuk PPN'],
    [],
    ['-----------------------------------------------------------'],
    ['PANDUAN RUMUS EXCEL & LOOKUP UNTUK DOKUMEN TENDER RESMI KLIEN'],
    ['-----------------------------------------------------------'],
    ['Tujuan:', 'Mencocokkan harga penawaran dari sheet ini ke lembar kerja resmi tender klien tanpa risiko salah baris.'],
    ['Kolom Kunci:', 'Kolom A ("Line ID (Lookup Key)") pada sheet "Rekap Penawaran BoQ".'],
    [],
    ['0. Formula Penomoran ID di File Raw Klien (Auto Lewati Header & Subtotal):'],
    ['Rumus Excel (English):', '=IF(AND(ISNUMBER(F7), ISERR(SEARCH("total", E7&D7))), COUNT(A$6:A6)+1, "")'],
    ['Rumus Excel (Indonesian):', '=IF(AND(ISNUMBER(F7); ISERR(SEARCH("total"; E7&D7))); COUNT(A$6:A6)+1; "")'],
    ['Cara Pakai:', 'Masukkan di sel A7 (baris pertama item BoQ), lalu seret (drag) ke paling bawah. Kolom F = Volume/Qty, E = Uraian Pekerjaan, D = No Item.'],
    [],
    ['1. Formula Modern (XLOOKUP) — Rekomendasi:'],
    ['Rumus Ambil Harga Satuan (Unit Price):', "=XLOOKUP(A7 & \"\", 'Rekap Penawaran BoQ'!$A:$A & \"\", 'Rekap Penawaran BoQ'!$I:$I, 0)"],
    ['Rumus Ambil Total Harga (Total Bid):', "=XLOOKUP(A7 & \"\", 'Rekap Penawaran BoQ'!$A:$A & \"\", 'Rekap Penawaran BoQ'!$J:$J, 0)"],
    [],
    ['2. Formula Klasik (VLOOKUP):'],
    ['Rumus Ambil Harga Satuan (Kolom ke-9):', "=VLOOKUP(A7, 'Rekap Penawaran BoQ'!$A:$K, 9, FALSE)"],
    ['Rumus Ambil Total Harga (Kolom ke-10):', "=VLOOKUP(A7, 'Rekap Penawaran BoQ'!$A:$K, 10, FALSE)"],
    [],
    ['3. Tips Penting Jika Muncul #N/A:'],
    ['Solusi Tipe Data:', 'Tambahkan & "" pada lookup value: =XLOOKUP(A7 & "", ...) agar angka 1 cocok dengan teks "1".']
  ];

  // 4. Konversi Data ke Worksheet XLSX
  const wb = XLSX.utils.book_new();

  const wsBoq = XLSX.utils.aoa_to_sheet(boqSheetData);
  // Atur lebar kolom agar rapi saat dibuka di Microsoft Excel
  wsBoq['!cols'] = [
    { wch: 22 }, // A: Line ID
    { wch: 12 }, // B: No Item
    { wch: 45 }, // C: Uraian
    { wch: 26 }, // D: Kategori
    { wch: 14 }, // E: Qty
    { wch: 10 }, // F: Satuan
    { wch: 22 }, // G: Direct Unit Rate
    { wch: 22 }, // H: Total Direct
    { wch: 25 }, // I: Penawaran Unit Rate
    { wch: 25 }, // J: Total Penawaran
    { wch: 35 }  // K: Breakdown
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  wsSummary['!cols'] = [
    { wch: 35 },
    { wch: 30 },
    { wch: 55 }
  ];

  XLSX.utils.book_append_sheet(wb, wsBoq, 'Rekap Penawaran BoQ');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan & Rumus Lookup');

  // 5. Trigger Download File XLSX di Browser
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = tender.title.replace(/[^a-zA-Z0-9_\-]/g, '_');
  a.download = `Rekap_Penawaran_${safeTitle}_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
