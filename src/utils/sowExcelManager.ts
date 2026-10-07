import * as XLSX from 'xlsx-js-style';
import type { BaseTreatmentTemplate } from '../data/treatmentCatalog';

// ==========================================
// 0. STYLING DEFINITIONS (NAVY HEADER & NUMBER FORMATTING)
// ==========================================

const BORDER_THIN = {
  top: { style: 'thin', color: { rgb: 'D9D9D9' } },
  bottom: { style: 'thin', color: { rgb: 'D9D9D9' } },
  left: { style: 'thin', color: { rgb: 'D9D9D9' } },
  right: { style: 'thin', color: { rgb: 'D9D9D9' } }
};

const BORDER_HEADER = {
  top: { style: 'thin', color: { rgb: '001A4E' } },
  bottom: { style: 'medium', color: { rgb: '001A4E' } },
  left: { style: 'thin', color: { rgb: '001A4E' } },
  right: { style: 'thin', color: { rgb: '001A4E' } }
};

const HEADER_STYLE = {
  fill: { fgColor: { rgb: '002060' } }, // Deep Navy Blue as requested
  font: { name: 'Aptos', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_HEADER
};

const TEXT_LEFT_STYLE = {
  font: { name: 'Aptos', sz: 10 },
  alignment: { horizontal: 'left', vertical: 'center' },
  border: BORDER_THIN
};

const TEXT_CENTER_STYLE = {
  font: { name: 'Aptos', sz: 10 },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: BORDER_THIN
};

const OUTPUT_NUM_STYLE = {
  font: { name: 'Aptos', sz: 10 },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0.00',
  border: BORDER_THIN
};

// Accounting / Currency style: displays 420,000.00 and turns 0 into "-"
const ACCOUNTING_STYLE = {
  font: { name: 'Aptos', sz: 10 },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '_(* #,##0.00_);_(* (#,##0.00);_(* "-"??_);_(@_)',
  border: BORDER_THIN
};

const COLUMN_HEADERS = [
  'Kategori',
  'Deskripsi SOW',
  'Output /\nHari',
  'Satuan',
  'Tarif Kru\n(Rp/Hari)',
  'Tarif Alat\n(Rp/Hari)',
  'Tarif Material\n(Rp/Satuan)',
  'Tarif Consumable\n(Rp/Satuan)',
  'Catatan Teknis'
];

const COLUMN_WIDTHS = [
  { wch: 22 }, // A: Kategori
  { wch: 48 }, // B: Deskripsi SOW
  { wch: 14 }, // C: Output / Hari
  { wch: 12 }, // D: Satuan
  { wch: 18 }, // E: Tarif Kru (Rp/Hari)
  { wch: 18 }, // F: Tarif Alat (Rp/Hari)
  { wch: 18 }, // G: Tarif Material (Rp/Satuan)
  { wch: 20 }, // H: Tarif Consumable (Rp/Satuan)
  { wch: 55 }  // I: Catatan Teknis
];

function buildStyledSowSheet(rows: (string | number)[][]): XLSX.WorkSheet {
  const aoa = [COLUMN_HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // 1. Style Header Row (Row 0)
  for (let c = 0; c < COLUMN_HEADERS.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) {
      ws[cellRef].s = HEADER_STYLE;
    }
  }

  // 2. Style Data Rows (Row 1 .. N)
  for (let r = 1; r <= rows.length; r++) {
    // Col 0: Kategori
    const cellA = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws[cellA]) ws[cellA].s = TEXT_LEFT_STYLE;

    // Col 1: Deskripsi SOW
    const cellB = XLSX.utils.encode_cell({ r, c: 1 });
    if (ws[cellB]) ws[cellB].s = TEXT_LEFT_STYLE;

    // Col 2: Output / Hari (formatted number #,##0.00)
    const cellC = XLSX.utils.encode_cell({ r, c: 2 });
    if (ws[cellC]) {
      ws[cellC].t = 'n';
      ws[cellC].s = OUTPUT_NUM_STYLE;
    }

    // Col 3: Satuan
    const cellD = XLSX.utils.encode_cell({ r, c: 3 });
    if (ws[cellD]) ws[cellD].s = TEXT_CENTER_STYLE;

    // Col 4: Tarif Kru (Accounting format: 420,000.00 or -)
    const cellE = XLSX.utils.encode_cell({ r, c: 4 });
    if (ws[cellE]) {
      ws[cellE].t = 'n';
      ws[cellE].s = ACCOUNTING_STYLE;
    }

    // Col 5: Tarif Alat
    const cellF = XLSX.utils.encode_cell({ r, c: 5 });
    if (ws[cellF]) {
      ws[cellF].t = 'n';
      ws[cellF].s = ACCOUNTING_STYLE;
    }

    // Col 6: Tarif Material
    const cellG = XLSX.utils.encode_cell({ r, c: 6 });
    if (ws[cellG]) {
      ws[cellG].t = 'n';
      ws[cellG].s = ACCOUNTING_STYLE;
    }

    // Col 7: Tarif Consumable
    const cellH = XLSX.utils.encode_cell({ r, c: 7 });
    if (ws[cellH]) {
      ws[cellH].t = 'n';
      ws[cellH].s = ACCOUNTING_STYLE;
    }

    // Col 8: Catatan Teknis
    const cellI = XLSX.utils.encode_cell({ r, c: 8 });
    if (ws[cellI]) ws[cellI].s = TEXT_LEFT_STYLE;
  }

  ws['!cols'] = COLUMN_WIDTHS;
  ws['!rows'] = [
    { hpt: 32 }, // Header row height (accommodates 2 lines)
    ...rows.map(() => ({ hpt: 20 })) // Comfortable row heights
  ];

  return ws;
}

// ==========================================
// 1. DOWNLOAD TEMPLATE EXCEL UNTUK SOW & KATEGORI
// ==========================================

export function downloadSowTemplate(): void {
  const sampleData: (string | number)[][] = [
    ['Piping & Mechanical', 'Fit-up 2" Dia Sch 40 Carbon Steel', 18, 'Joint', 420000, 50000, 0, 12000, '1 Fitter + 1 Helper + gerinda & bevel check'],
    ['Piping & Mechanical', 'Fit-up 6" Dia Sch 40 Carbon Steel', 10, 'Joint', 420000, 50000, 0, 12000, '1 Fitter + 1 Helper + level clamp'],
    ['Piping & Mechanical', 'Fit-up 10" Dia Sch 40 Carbon Steel', 6, 'Joint', 450000, 75000, 0, 18000, '1 Fitter + 2 Helper + chain block 2T'],
    ['Piping & Mechanical', 'Welding 2" Dia Sch 40 Carbon Steel (GTAW/SMAW)', 8, 'Joint', 520000, 120000, 0, 45000, '1 Welder 6G + 1 Welder Helper'],
    ['Piping & Mechanical', 'Welding 6" Dia Sch 40 Carbon Steel (GTAW/SMAW)', 3, 'Joint', 520000, 120000, 0, 45000, '1 Welder 6G + 1 Welder Helper + mesin las DC 400A'],
    ['Piping & Mechanical', 'Welding Stainless Steel 316L 2" Sch 10/40 (GTAW Full Tig)', 4, 'Joint', 650000, 150000, 0, 95000, 'Welder Khusus SS + Gas Argon Purging'],
    ['Piping & Mechanical', 'Hydrotest Package & Pressurization Spool (s/d 150 bar)', 0.5, 'Lot', 600000, 400000, 0, 250000, 'Hydrotest pump 500 bar + test manifold'],
    ['Tubular OCTG', 'Macaroni / Tubing External Cleaning & OD Buffing', 120, 'Joint', 380000, 180000, 0, 15000, 'Rotary wire brush + cleaning agent'],
    ['Tubular OCTG', 'Tubing Internal Cleaning (High Pressure Water Jetting 10k psi)', 90, 'Joint', 420000, 280000, 0, 22000, 'HP Jetting unit + lance nozzle'],
    ['Tubular OCTG', 'Full Scope Blasting Sa 2.5 (External & Internal Tubular)', 45, 'Joint', 500000, 650000, 0, 65000, 'Kompresor 375 CFM + garnet abrasive'],
    ['Blasting & Painting', 'Grit Blasting Sa 2.5 (Plat, Struktur, & Spool Piping)', 25, 'm2', 570000, 1840000, 0, 157500, 'Kru Blaster, Kompresor 750 CFM, Garnet GMA'],
    ['Blasting & Painting', 'Painting 3 Layers (Inorganic Zinc + Epoxy High Build + Polyurethane)', 20, 'm2', 400000, 220000, 0, 45000, 'Airless spray pump + DFT Gauge test'],
    ['NDT Testing', 'Magnetic Particle (MT) / Liquid Penetrant Testing (PT)', 48, 'Dia. Inch', 620000, 50000, 0, 8000, 'NDT Inspector Level II + aerosol cleaner/contrast'],
    ['HVAC & Maintenance', 'AC Routine Cleaning & Freon Top-up (1/2 - 1 PK)', 6, 'Unit', 350000, 50000, 0, 35000, 'Teknisi AC + steam washer + R32/R410 gas'],
    ['Crew Mandays', 'Land Transportation 4WD c/w Driver & Fuel', 1, 'unit days', 250000, 850000, 0, 150000, 'Sewa mobil kabin tertutup 4WD + BBM operasional']
  ];

  const ws = buildStyledSowSheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template SOW');
  XLSX.writeFile(wb, 'Template_Katalog_SOW_Treatment.xlsx');
}

// ==========================================
// 2. EXPORT SOW CATALOG KE EXCEL
// ==========================================

export function exportSowCatalogExcel(catalog: BaseTreatmentTemplate[], categoryFilter?: string): void {
  const filtered = categoryFilter && categoryFilter !== 'Semua'
    ? catalog.filter(c => c.category.toLowerCase() === categoryFilter.toLowerCase())
    : catalog;

  const rows: (string | number)[][] = filtered.map(item => [
    item.category,
    item.description,
    item.defaultOutputPerDay,
    item.unit,
    item.crewDailyRate,
    item.equipmentDailyRate,
    item.materialUnitRate || 0,
    item.consumableUnitRate,
    item.notes || ''
  ]);

  const ws = buildStyledSowSheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Katalog SOW');
  
  const cleanCatName = categoryFilter && categoryFilter !== 'Semua' ? `_${categoryFilter.replace(/[^a-zA-Z0-9]/g, '_')}` : '';
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Katalog_SOW_Treatment${cleanCatName}_${dateStr}.xlsx`);
}

// ==========================================
// 3. PARSE SOW EXCEL FILE
// ==========================================

export interface ParsedSowResult {
  items: BaseTreatmentTemplate[];
  categories: string[];
  warnings: string[];
}

export async function parseSowExcel(file: File): Promise<ParsedSowResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

  const results: BaseTreatmentTemplate[] = [];
  const foundCategories = new Set<string>();
  const warnings: string[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    let category = '';
    let description = '';
    let outputPerDay = 1;
    let unit = 'Lot';
    let crewDailyRate = 0;
    let equipmentDailyRate = 0;
    let materialUnitRate = 0;
    let consumableUnitRate = 0;
    let notes = '';

    for (const [key, val] of Object.entries(row)) {
      // Remove spaces, punctuation, linebreaks for robust matching
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const strVal = String(val ?? '').trim();
      const normalizedVal = strVal.replace(',', '.');
      const numVal = parseFloat(normalizedVal.replace(/[^0-9.-]/g, '')) || 0;

      // Matching Kategori
      if (k.includes('kategori') || k.includes('category') || k.includes('grup') || k.includes('bidang')) {
        category = strVal;
      }
      // Matching Deskripsi SOW
      else if (
        k.includes('sow') || 
        k.includes('deskripsi') || 
        k.includes('scope') || 
        k.includes('pekerjaan') || 
        k.includes('treatment') || 
        k.includes('uraian') || 
        k.includes('nama')
      ) {
        description = strVal;
      }
      // Matching Output / Hari
      else if (
        k.includes('output') || 
        k.includes('produktivitas') || 
        k.includes('kapasitas') || 
        k.includes('target') || 
        k.includes('perhari') || 
        k.includes('daily')
      ) {
        outputPerDay = numVal > 0 ? numVal : 1;
      }
      // Matching Satuan
      else if (k.includes('satuan') || k.includes('unit') || k.includes('uom')) {
        unit = strVal || 'Lot';
      }
      // Matching Tarif Kru
      else if (k.includes('kru') || k.includes('crew') || k.includes('manpower') || k.includes('upah') || k.includes('pekerja')) {
        crewDailyRate = numVal;
      }
      // Matching Tarif Alat
      else if (k.includes('alat') || k.includes('equipment') || k.includes('mesin') || k.includes('sewa')) {
        equipmentDailyRate = numVal;
      }
      // Matching Tarif Material
      else if (k.includes('material') || k.includes('bahan')) {
        materialUnitRate = numVal;
      }
      // Matching Tarif Consumable
      else if (k.includes('consumable') || k.includes('habispakai') || k.includes('konsumsi')) {
        consumableUnitRate = numVal;
      }
      // Matching Catatan
      else if (k.includes('catatan') || k.includes('note') || k.includes('ket') || k.includes('spek')) {
        notes = strVal;
      }
    }

    if (!description) {
      // Baris kosong atau tidak ada deskripsi
      continue;
    }

    const finalCategory = category || 'General Scope';
    foundCategories.add(finalCategory);

    // Siapkan initial resource breakdown jika rate diisi di Excel
    const manpowerList = crewDailyRate > 0 ? [{
      id: `mp-imp-${i}-1`,
      name: `Kru Tim: ${description.slice(0, 30)}`,
      qty: 1,
      unit: 'org',
      rate: crewDailyRate,
      basicSalary: crewDailyRate
    }] : [];

    const equipmentList = equipmentDailyRate > 0 ? [{
      id: `eq-imp-${i}-1`,
      name: `Peralatan Kerja: ${description.slice(0, 30)}`,
      qty: 1,
      unit: 'unit',
      rate: equipmentDailyRate,
      baseRentalRate: equipmentDailyRate
    }] : [];

    const materialList = materialUnitRate > 0 ? [{
      id: `mat-imp-${i}-1`,
      name: `Material Utama: ${description.slice(0, 30)}`,
      qty: 1,
      unit: unit || 'Unit',
      rate: materialUnitRate
    }] : [];

    const consumableList = consumableUnitRate > 0 ? [{
      id: `cs-imp-${i}-1`,
      name: `Consumable: ${description.slice(0, 30)}`,
      qty: 1,
      unit: unit || 'Unit',
      rate: consumableUnitRate
    }] : [];

    results.push({
      id: `tpl-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      category: finalCategory,
      description,
      unit: unit || 'Lot',
      defaultOutputPerDay: outputPerDay > 0 ? outputPerDay : 1,
      crewDailyRate,
      equipmentDailyRate,
      materialUnitRate,
      consumableUnitRate,
      notes: notes || undefined,
      manpowerList,
      equipmentList,
      materialList,
      consumableList
    });
  }

  if (results.length === 0) {
    warnings.push('Tidak ditemukan data SOW valid pada file Excel. Pastikan nama kolom berisi "Kategori", "Deskripsi SOW", dan "Satuan".');
  }

  return {
    items: results,
    categories: Array.from(foundCategories),
    warnings
  };
}
