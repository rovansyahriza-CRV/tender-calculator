import * as XLSX from 'xlsx';
import type { BaseTreatmentTemplate } from '../data/treatmentCatalog';

// ==========================================
// 1. DOWNLOAD TEMPLATE EXCEL UNTUK SOW & KATEGORI
// ==========================================

export function downloadSowTemplate(): void {
  const sampleData = [
    {
      'Kategori': 'Piping & Mechanical',
      'Deskripsi SOW': 'Fit-up 2" Dia Sch 40 Carbon Steel',
      'Output / Hari': 18,
      'Satuan': 'Joint',
      'Tarif Kru (Rp/Hari)': 420000,
      'Tarif Alat (Rp/Hari)': 50000,
      'Tarif Material (Rp/Satuan)': 0,
      'Tarif Consumable (Rp/Satuan)': 12000,
      'Catatan Teknis': '1 Fitter + 1 Helper + gerinda & bevel check'
    },
    {
      'Kategori': 'Piping & Mechanical',
      'Deskripsi SOW': 'Welding GTAW + SMAW Pipa 4" Sch 40 CS',
      'Output / Hari': 6,
      'Satuan': 'Joint',
      'Tarif Kru (Rp/Hari)': 550000,
      'Tarif Alat (Rp/Hari)': 95000,
      'Tarif Material (Rp/Satuan)': 0,
      'Tarif Consumable (Rp/Satuan)': 35000,
      'Catatan Teknis': '1 Welder 6G + 1 Helper + Mesin Las DC 400A + Argon HP'
    },
    {
      'Kategori': 'Tubular OCTG',
      'Deskripsi SOW': 'Bucking Unit Torque Makeup Casing 9-5/8"',
      'Output / Hari': 35,
      'Satuan': 'Joint',
      'Tarif Kru (Rp/Hari)': 650000,
      'Tarif Alat (Rp/Hari)': 1250000,
      'Tarif Material (Rp/Satuan)': 0,
      'Tarif Consumable (Rp/Satuan)': 28000,
      'Catatan Teknis': 'Operator Bucking Unit + Calibrated Load Cell + Thread Compound'
    },
    {
      'Kategori': 'Blasting & Painting',
      'Deskripsi SOW': 'Sandblasting SA 2.5 Garnet Mesh 30/60',
      'Output / Hari': 60,
      'Satuan': 'm2',
      'Tarif Kru (Rp/Hari)': 450000,
      'Tarif Alat (Rp/Hari)': 750000,
      'Tarif Material (Rp/Satuan)': 0,
      'Tarif Consumable (Rp/Satuan)': 18000,
      'Catatan Teknis': 'Compressor 375 CFM + Blasting Pot + Pasir Garnet GMA'
    },
    {
      'Kategori': 'Civil & Structure',
      'Deskripsi SOW': 'Ereksi Struktur Baja WF / Beam',
      'Output / Hari': 2.5,
      'Satuan': 'Ton',
      'Tarif Kru (Rp/Hari)': 600000,
      'Tarif Alat (Rp/Hari)': 1800000,
      'Tarif Material (Rp/Satuan)': 0,
      'Tarif Consumable (Rp/Satuan)': 45000,
      'Catatan Teknis': 'Rigger + Fitter + Mobile Crane 25T + Tali sling & shackle'
    },
    {
      'Kategori': 'Electrical & Instrument',
      'Deskripsi SOW': 'Penarikan Kabel Power NYFGBY 4x16mm2',
      'Output / Hari': 120,
      'Satuan': 'Mtr',
      'Tarif Kru (Rp/Hari)': 480000,
      'Tarif Alat (Rp/Hari)': 60000,
      'Tarif Material (Rp/Satuan)': 0,
      'Tarif Consumable (Rp/Satuan)': 8000,
      'Catatan Teknis': 'Teknisi Listrik + Helper + Cable Roller & Pulling Grip'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 24 }, // Kategori
    { wch: 45 }, // Deskripsi SOW
    { wch: 14 }, // Output / Hari
    { wch: 10 }, // Satuan
    { wch: 22 }, // Tarif Kru
    { wch: 22 }, // Tarif Alat
    { wch: 24 }, // Tarif Material
    { wch: 26 }, // Tarif Consumable
    { wch: 55 }  // Catatan Teknis
  ];

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

  const exportData = filtered.map(item => ({
    'Kategori': item.category,
    'Deskripsi SOW': item.description,
    'Output / Hari': item.defaultOutputPerDay,
    'Satuan': item.unit,
    'Tarif Kru (Rp/Hari)': item.crewDailyRate,
    'Tarif Alat (Rp/Hari)': item.equipmentDailyRate,
    'Tarif Material (Rp/Satuan)': item.materialUnitRate || 0,
    'Tarif Consumable (Rp/Satuan)': item.consumableUnitRate,
    'Catatan Teknis': item.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);

  ws['!cols'] = [
    { wch: 24 },
    { wch: 45 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 },
    { wch: 26 },
    { wch: 55 }
  ];

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

