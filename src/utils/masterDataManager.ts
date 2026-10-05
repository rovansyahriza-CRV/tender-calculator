import * as XLSX from 'xlsx';
import { 
  MASTER_MANPOWER_DATABASE, 
  MASTER_EQUIPMENT_DATABASE, 
  MASTER_MATERIAL_DATABASE,
  MASTER_CONSUMABLE_DATABASE,
  type MasterManpower, 
  type MasterEquipment,
  type MasterMaterialItem
} from '../data/resourceMasterData';

const MANPOWER_STORAGE_KEY = 'industrial_master_manpower_data';
const EQUIPMENT_STORAGE_KEY = 'industrial_master_equipment_data';
const MATERIAL_STORAGE_KEY = 'industrial_master_material_data';
const CONSUMABLE_STORAGE_KEY = 'industrial_master_consumable_data';

// ==========================================
// 1. LOCAL STORAGE HELPERS
// ==========================================

export function loadMasterManpower(): MasterManpower[] {
  const saved = localStorage.getItem(MANPOWER_STORAGE_KEY);
  if (saved) {
    try {
      const parsed: MasterManpower[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Gabungkan item default baru jika belum tersimpan di localStorage pengguna
        const missing = MASTER_MANPOWER_DATABASE.filter(def => !parsed.some(p => p.id === def.id || p.role.toLowerCase() === def.role.toLowerCase()));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(MANPOWER_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Gagal memuat master manpower dari storage:', e);
    }
  }
  return [...MASTER_MANPOWER_DATABASE];
}

export function saveMasterManpower(data: MasterManpower[]): void {
  localStorage.setItem(MANPOWER_STORAGE_KEY, JSON.stringify(data));
}

export function resetMasterManpower(): MasterManpower[] {
  localStorage.removeItem(MANPOWER_STORAGE_KEY);
  return [...MASTER_MANPOWER_DATABASE];
}

export function loadMasterEquipment(): MasterEquipment[] {
  const saved = localStorage.getItem(EQUIPMENT_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Gagal memuat master equipment dari storage:', e);
    }
  }
  return [...MASTER_EQUIPMENT_DATABASE];
}

export function saveMasterEquipment(data: MasterEquipment[]): void {
  localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(data));
}

export function resetMasterEquipment(): MasterEquipment[] {
  localStorage.removeItem(EQUIPMENT_STORAGE_KEY);
  return [...MASTER_EQUIPMENT_DATABASE];
}

export function loadMasterMaterial(): MasterMaterialItem[] {
  const saved = localStorage.getItem(MATERIAL_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Gagal memuat master material dari storage:', e);
    }
  }
  return [...MASTER_MATERIAL_DATABASE];
}

export function saveMasterMaterial(data: MasterMaterialItem[]): void {
  localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(data));
}

export function resetMasterMaterial(): MasterMaterialItem[] {
  localStorage.removeItem(MATERIAL_STORAGE_KEY);
  return [...MASTER_MATERIAL_DATABASE];
}

export function loadMasterConsumable(): MasterMaterialItem[] {
  const saved = localStorage.getItem(CONSUMABLE_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Gagal memuat master consumable dari storage:', e);
    }
  }
  return [...MASTER_CONSUMABLE_DATABASE];
}

export function saveMasterConsumable(data: MasterMaterialItem[]): void {
  localStorage.setItem(CONSUMABLE_STORAGE_KEY, JSON.stringify(data));
}

export function resetMasterConsumable(): MasterMaterialItem[] {
  localStorage.removeItem(CONSUMABLE_STORAGE_KEY);
  return [...MASTER_CONSUMABLE_DATABASE];
}

// ==========================================
// 2. EXCEL TEMPLATE DOWNLOADS
// ==========================================

export function downloadManpowerTemplate(): void {
  const sampleData = [
    {
      'Jabatan / Posisi': 'Welder 6G (GTAW / SMAW)',
      'Kategori': 'Welding',
      'Gaji Pokok (Rp/Hr)': 250000,
      'APD / PPE (Rp/Hr)': 30000,
      'BPJS / Jamsostek (Rp/Hr)': 25000,
      'Uang Makan & Mess (Rp/Hr)': 35000,
      'Tunjangan Lain (Rp/Hr)': 10000,
      'Catatan / Syarat': 'Migas / BNSP aktif, spesialis pressure vessel'
    },
    {
      'Jabatan / Posisi': 'Pipe Fitter Senior',
      'Kategori': 'Piping & Fabrication',
      'Gaji Pokok (Rp/Hr)': 180000,
      'APD / PPE (Rp/Hr)': 25000,
      'BPJS / Jamsostek (Rp/Hr)': 20000,
      'Uang Makan & Mess (Rp/Hr)': 25000,
      'Tunjangan Lain (Rp/Hr)': 0,
      'Catatan / Syarat': 'Bisa baca isometrik & alignment spool'
    },
    {
      'Jabatan / Posisi': 'Fitter Helper',
      'Kategori': 'General Crew',
      'Gaji Pokok (Rp/Hr)': 120000,
      'APD / PPE (Rp/Hr)': 20000,
      'BPJS / Jamsostek (Rp/Hr)': 15000,
      'Uang Makan & Mess (Rp/Hr)': 15000,
      'Tunjangan Lain (Rp/Hr)': 0,
      'Catatan / Syarat': 'Support gerinda & material handling'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Tenaga Kerja');
  XLSX.writeFile(wb, 'Template_Master_Tenaga_Kerja.xlsx');
}

export function downloadEquipmentTemplate(): void {
  const sampleData = [
    {
      'Nama Alat / Mesin': 'Air Compressor 375 CFM Diesel (Airman)',
      'Kategori': 'Compressor & Power',
      'Sewa Pokok Dry (Rp/Hr)': 400000,
      'Jenis BBM (Solar/Bensin/Listrik/None)': 'Solar',
      'Konsumsi BBM (Liter/Hr)': 20,
      'Harga BBM / Liter (Rp)': 14500,
      'Pelumas & Servis (Rp/Hr)': 60000,
      'Mob Demob Harian (Rp/Hr)': 0,
      'Catatan / Spek': '100-125 PSI untuk 2 nozzle blasting'
    },
    {
      'Nama Alat / Mesin': 'Mesin Las Inverter DC 400A (Miller)',
      'Kategori': 'Welding Machine',
      'Sewa Pokok Dry (Rp/Hr)': 70000,
      'Jenis BBM (Solar/Bensin/Listrik/None)': 'Listrik',
      'Konsumsi BBM (Liter/Hr)': 0,
      'Harga BBM / Liter (Rp)': 0,
      'Pelumas & Servis (Rp/Hr)': 20000,
      'Mob Demob Harian (Rp/Hr)': 0,
      'Catatan / Spek': 'Duty cycle 60% @ 400 Ampere'
    },
    {
      'Nama Alat / Mesin': 'Genset Silent 50 kVA (Cummins)',
      'Kategori': 'Compressor & Power',
      'Sewa Pokok Dry (Rp/Hr)': 250000,
      'Jenis BBM (Solar/Bensin/Listrik/None)': 'Solar',
      'Konsumsi BBM (Liter/Hr)': 18,
      'Harga BBM / Liter (Rp)': 14500,
      'Pelumas & Servis (Rp/Hr)': 49000,
      'Mob Demob Harian (Rp/Hr)': 0,
      'Catatan / Spek': 'Kapasitas 40 kW continuous'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Peralatan');
  XLSX.writeFile(wb, 'Template_Master_Peralatan.xlsx');
}

export function downloadMaterialTemplate(): void {
  const sampleData = [
    {
      'Nama Material Utama': 'Pipa Seamless Carbon Steel ASTM A106 Gr. B 2" Sch 40',
      'Kategori': 'Piping & Fabrication',
      'Satuan': 'meter',
      'Harga Standar (Rp)': 155000,
      'Harga Bawah (Rp)': 135000,
      'Harga Atas (Rp)': 175000,
      'Spesifikasi Teknis': 'ASTM A106 Gr. B OD 60.3mm WT 3.91mm c/w Mill Cert',
      'Catatan / Vendor': 'Distributor Pipa Baja Cilegon'
    },
    {
      'Nama Material Utama': 'Flange Weld Neck WNRF 2" ANSI 150# Carbon Steel',
      'Kategori': 'Piping & Fabrication',
      'Satuan': 'pcs',
      'Harga Standar (Rp)': 165000,
      'Harga Bawah (Rp)': 140000,
      'Harga Atas (Rp)': 195000,
      'Spesifikasi Teknis': 'ASTM A105N Raised Face Sch 40',
      'Catatan / Vendor': 'Supplier Flange Glodok'
    },
    {
      'Nama Material Utama': 'Plat Baja ASTM A36 Tebal 10mm',
      'Kategori': 'Steel Structure',
      'Satuan': 'kg',
      'Harga Standar (Rp)': 15500,
      'Harga Bawah (Rp)': 14000,
      'Harga Atas (Rp)': 17500,
      'Spesifikasi Teknis': 'Krakatau Steel / SS400',
      'Catatan / Vendor': 'Pusat Baja Surabaya'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Material Utama');
  XLSX.writeFile(wb, 'Template_Master_Material_Utama.xlsx');
}

export function downloadConsumableTemplate(): void {
  const sampleData = [
    {
      'Nama Bahan / Consumable': 'Kawat Las Kobelco LB-52 (AWS E7018) Dia 3.2mm',
      'Kategori': 'Welding Consumable',
      'Satuan': 'kg',
      'Harga Standar (Rp)': 42000,
      'Harga Bawah (Rp)': 38000,
      'Harga Atas (Rp)': 48000,
      'Spesifikasi Teknis': 'Low Hydrogen AWS A5.1 E7018 Box 20kg',
      'Catatan / Vendor': 'Distributor Resmi Kobelco / Monotaro'
    },
    {
      'Nama Bahan / Consumable': 'Gas Argon High Purity (HP 99.99%) Tabung 6m3',
      'Kategori': 'Welding Consumable',
      'Satuan': 'tabung',
      'Harga Standar (Rp)': 230000,
      'Harga Bawah (Rp)': 190000,
      'Harga Atas (Rp)': 270000,
      'Spesifikasi Teknis': 'Kemurnian 99.99% tekanan 150 bar',
      'Catatan / Vendor': 'Samator Gas Depot'
    },
    {
      'Nama Bahan / Consumable': 'Pasir Garnet Sandblasting Mesh 30/60 GMA',
      'Kategori': 'Blasting & Coating',
      'Satuan': 'kg',
      'Harga Standar (Rp)': 5500,
      'Harga Bawah (Rp)': 4500,
      'Harga Atas (Rp)': 6500,
      'Spesifikasi Teknis': 'Almandine mineral abrasive sak 25kg',
      'Catatan / Vendor': 'Importir Garnet Batam'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Consumables');
  XLSX.writeFile(wb, 'Template_Master_Consumables.xlsx');
}

// ==========================================
// 3. EXPORT CURRENT MASTER BACKUP
// ==========================================

export function exportManpowerToExcel(items: MasterManpower[]): void {
  const exportData = items.map(m => ({
    'Jabatan / Posisi': m.role,
    'Kategori': m.category,
    'Gaji Pokok (Rp/Hr)': m.basicSalary,
    'APD / PPE (Rp/Hr)': m.ppeDaily,
    'BPJS / Jamsostek (Rp/Hr)': m.jamsostekDaily,
    'Uang Makan & Mess (Rp/Hr)': m.mealsDaily,
    'Tunjangan Lain (Rp/Hr)': m.otherAllowanceDaily,
    'Total Mandays (Rp/Hr)': m.totalRate,
    'Catatan / Syarat': m.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Tenaga Kerja');
  XLSX.writeFile(wb, 'Master_Tenaga_Kerja_Format_Baku.xlsx');
}

export function exportEquipmentToExcel(items: MasterEquipment[]): void {
  const exportData = items.map(e => ({
    'Nama Alat / Mesin': e.name,
    'Kategori': e.category,
    'Sewa Pokok Dry (Rp/Hr)': e.baseRentalRate,
    'Jenis BBM': e.fuelType,
    'Konsumsi BBM (Liter/Hr)': e.fuelLitersPerDay,
    'Harga BBM / Liter (Rp)': e.fuelPricePerLiter,
    'Total BBM (Rp/Hr)': e.bbmRate,
    'Pelumas & Servis (Rp/Hr)': e.maintenanceRate,
    'Mob Demob Harian (Rp/Hr)': e.mobilizationDaily,
    'Total Sewa Wet (Rp/Hr)': e.totalRate,
    'Catatan / Spek': e.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Peralatan');
  XLSX.writeFile(wb, 'Master_Peralatan_Format_Baku.xlsx');
}

export function exportMaterialToExcel(items: MasterMaterialItem[]): void {
  const exportData = items.map(m => ({
    'Nama Material Utama': m.name,
    'Kategori': m.category,
    'Satuan': m.unit,
    'Harga Standar (Rp)': m.standardRate,
    'Harga Bawah (Rp)': m.priceLow,
    'Harga Atas (Rp)': m.priceHigh,
    'Spesifikasi Teknis': m.specs || '',
    'Catatan / Vendor': m.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Material Utama');
  XLSX.writeFile(wb, 'Master_Material_Utama_Format_Baku.xlsx');
}

export function exportConsumableToExcel(items: MasterMaterialItem[]): void {
  const exportData = items.map(c => ({
    'Nama Bahan / Consumable': c.name,
    'Kategori': c.category,
    'Satuan': c.unit,
    'Harga Standar (Rp)': c.standardRate,
    'Harga Bawah (Rp)': c.priceLow,
    'Harga Atas (Rp)': c.priceHigh,
    'Spesifikasi Teknis': c.specs || '',
    'Catatan / Vendor': c.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Consumables');
  XLSX.writeFile(wb, 'Master_Consumables_Format_Baku.xlsx');
}

// ==========================================
// 4. PARSE UPLOADED EXCEL (FUZZY HEADERS)
// ==========================================

export async function parseManpowerExcel(file: File): Promise<MasterManpower[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

  const results: MasterManpower[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    
    // Fuzzy matching headers
    let role = '';
    let category: MasterManpower['category'] = 'Piping & Fabrication';
    let basicSalary = 0;
    let ppeDaily = 0;
    let jamsostekDaily = 0;
    let mealsDaily = 0;
    let otherAllowanceDaily = 0;
    let notes = '';

    for (const [key, val] of Object.entries(row)) {
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const strVal = String(val ?? '').trim();
      const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, '')) || 0;

      if (k.includes('jabatan') || k.includes('posisi') || k.includes('role') || k.includes('pekerja')) {
        role = strVal;
      } else if (k.includes('kategori') || k.includes('category')) {
        category = strVal || 'General Crew';
      } else if (k.includes('pokok') || k.includes('basic') || k.includes('gaji') || k.includes('upah')) {
        basicSalary = numVal;
      } else if (k.includes('apd') || k.includes('ppe')) {
        ppeDaily = numVal;
      } else if (k.includes('bpjs') || k.includes('jamsostek') || k.includes('asuransi')) {
        jamsostekDaily = numVal;
      } else if (k.includes('makan') || k.includes('mess') || k.includes('meal')) {
        mealsDaily = numVal;
      } else if (k.includes('tunjangan') || k.includes('allowance')) {
        otherAllowanceDaily = numVal;
      } else if (k.includes('catatan') || k.includes('syarat') || k.includes('note') || k.includes('ket')) {
        notes = strVal;
      }
    }

    if (role) {
      const total = basicSalary + ppeDaily + jamsostekDaily + mealsDaily + otherAllowanceDaily;
      results.push({
        id: `m-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        role,
        category,
        unit: 'org',
        basicSalary,
        ppeDaily,
        jamsostekDaily,
        mealsDaily,
        otherAllowanceDaily,
        totalRate: total > 0 ? total : 200000,
        notes: notes || undefined
      });
    }
  }

  return results;
}

export async function parseEquipmentExcel(file: File): Promise<MasterEquipment[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

  const results: MasterEquipment[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    let name = '';
    let category: MasterEquipment['category'] = 'Compressor & Power';
    let baseRentalRate = 0;
    let fuelType: MasterEquipment['fuelType'] = 'Solar';
    let fuelLitersPerDay = 0;
    let fuelPricePerLiter = 14500;
    let maintenanceRate = 0;
    let mobilizationDaily = 0;
    let notes = '';

    for (const [key, val] of Object.entries(row)) {
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const strVal = String(val ?? '').trim();
      const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, '')) || 0;

      if (k.includes('nama') || k.includes('alat') || k.includes('mesin') || k.includes('equipment')) {
        name = strVal;
      } else if (k.includes('kategori') || k.includes('category')) {
        category = strVal || 'Compressor & Power';
      } else if (k.includes('pokok') || k.includes('dry') || k.includes('sewa') || k.includes('base')) {
        baseRentalRate = numVal;
      } else if (k.includes('jenisbbm') || k.includes('fueltype') || (k.includes('bbm') && !k.includes('total') && !k.includes('konsumsi'))) {
        const bbmLow = strVal.toLowerCase();
        if (bbmLow.includes('bensin') || bbmLow.includes('pertalite')) fuelType = 'Bensin';
        else if (bbmLow.includes('listrik')) fuelType = 'Listrik';
        else if (bbmLow.includes('none') || bbmLow.includes('tanpa')) fuelType = 'None';
        else fuelType = 'Solar';
      } else if (k.includes('liter') || k.includes('konsumsi')) {
        fuelLitersPerDay = numVal;
      } else if (k.includes('hargabbm') || k.includes('hargasolar')) {
        if (numVal > 0) fuelPricePerLiter = numVal;
      } else if (k.includes('pelumas') || k.includes('maintenance') || k.includes('servis')) {
        maintenanceRate = numVal;
      } else if (k.includes('mob') || k.includes('demob') || k.includes('mobilisasi')) {
        mobilizationDaily = numVal;
      } else if (k.includes('catatan') || k.includes('spek') || k.includes('note') || k.includes('ket')) {
        notes = strVal;
      }
    }

    if (name) {
      const bbmRate = fuelType === 'None' || fuelType === 'Listrik' ? 0 : Math.round(fuelLitersPerDay * fuelPricePerLiter);
      const total = baseRentalRate + bbmRate + maintenanceRate + mobilizationDaily;
      results.push({
        id: `eq-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        unit: 'unit',
        baseRentalRate,
        fuelType,
        fuelLitersPerDay,
        fuelPricePerLiter,
        bbmRate,
        maintenanceRate,
        mobilizationDaily,
        totalRate: total > 0 ? total : 250000,
        notes: notes || undefined
      });
    }
  }

  return results;
}

export async function parseMaterialExcel(file: File): Promise<MasterMaterialItem[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

  const results: MasterMaterialItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    let name = '';
    let category = 'Piping & Fabrication';
    let unit = 'unit';
    let standardRate = 0;
    let priceLow = 0;
    let priceHigh = 0;
    let specs = '';
    let notes = '';

    for (const [key, val] of Object.entries(row)) {
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const strVal = String(val ?? '').trim();
      const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, '')) || 0;

      if (k.includes('nama') || k.includes('material') || k.includes('deskripsi') || k.includes('item')) {
        name = strVal;
      } else if (k.includes('kategori') || k.includes('category')) {
        category = strVal || 'Piping & Fabrication';
      } else if (k.includes('satuan') || k.includes('unit')) {
        unit = strVal || 'unit';
      } else if (k.includes('standar') || (k.includes('harga') && !k.includes('bawah') && !k.includes('atas') && !k.includes('min') && !k.includes('max'))) {
        standardRate = numVal;
      } else if (k.includes('bawah') || k.includes('min') || k.includes('low')) {
        priceLow = numVal;
      } else if (k.includes('atas') || k.includes('max') || k.includes('high')) {
        priceHigh = numVal;
      } else if (k.includes('spek') || k.includes('spesifikasi') || k.includes('dimensi')) {
        specs = strVal;
      } else if (k.includes('catatan') || k.includes('vendor') || k.includes('supplier') || k.includes('note')) {
        notes = strVal;
      }
    }

    if (name) {
      const std = standardRate > 0 ? standardRate : (priceLow + priceHigh) / 2 || 100000;
      const low = priceLow > 0 ? priceLow : Math.round(std * 0.88);
      const high = priceHigh > 0 ? priceHigh : Math.round(std * 1.20);

      results.push({
        id: `mat-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        type: 'material',
        unit: unit || 'unit',
        standardRate: std,
        priceLow: low,
        priceHigh: high,
        specs: specs || undefined,
        notes: notes || undefined
      });
    }
  }

  return results;
}

export async function parseConsumableExcel(file: File): Promise<MasterMaterialItem[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws);

  const results: MasterMaterialItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    let name = '';
    let category = 'Welding Consumable';
    let unit = 'pcs';
    let standardRate = 0;
    let priceLow = 0;
    let priceHigh = 0;
    let specs = '';
    let notes = '';

    for (const [key, val] of Object.entries(row)) {
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const strVal = String(val ?? '').trim();
      const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, '')) || 0;

      if (k.includes('nama') || k.includes('bahan') || k.includes('consumable') || k.includes('item')) {
        name = strVal;
      } else if (k.includes('kategori') || k.includes('category')) {
        category = strVal || 'Welding Consumable';
      } else if (k.includes('satuan') || k.includes('unit')) {
        unit = strVal || 'pcs';
      } else if (k.includes('standar') || (k.includes('harga') && !k.includes('bawah') && !k.includes('atas') && !k.includes('min') && !k.includes('max'))) {
        standardRate = numVal;
      } else if (k.includes('bawah') || k.includes('min') || k.includes('low')) {
        priceLow = numVal;
      } else if (k.includes('atas') || k.includes('max') || k.includes('high')) {
        priceHigh = numVal;
      } else if (k.includes('spek') || k.includes('spesifikasi')) {
        specs = strVal;
      } else if (k.includes('catatan') || k.includes('vendor') || k.includes('supplier') || k.includes('note')) {
        notes = strVal;
      }
    }

    if (name) {
      const std = standardRate > 0 ? standardRate : (priceLow + priceHigh) / 2 || 25000;
      const low = priceLow > 0 ? priceLow : Math.round(std * 0.88);
      const high = priceHigh > 0 ? priceHigh : Math.round(std * 1.20);

      results.push({
        id: `cs-imp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        type: 'consumable',
        unit: unit || 'pcs',
        standardRate: std,
        priceLow: low,
        priceHigh: high,
        specs: specs || undefined,
        notes: notes || undefined
      });
    }
  }

  return results;
}

// ==========================================
// 6. SYNC TREATMENT RESOURCES TO MASTER DATABASE
// ==========================================

export function syncTreatmentResourcesToMaster(
  manpowerList?: { name: string; rate: number; basicSalary?: number; ppeDaily?: number; jamsostekDaily?: number; mealsDaily?: number; otherAllowanceDaily?: number }[],
  equipmentList?: { name: string; rate: number; baseRentalRate?: number; fuelType?: string; fuelLitersPerDay?: number; fuelPricePerLiter?: number; bbmRate?: number; maintenanceRate?: number; mobilizationDaily?: number }[],
  materialList?: { name: string; rate: number; unit?: string }[],
  consumableList?: { name: string; rate: number; unit?: string }[]
): void {
  // 1. Manpower
  if (manpowerList && manpowerList.length > 0) {
    const list = loadMasterManpower();
    let changed = false;
    const updated = list.map(m => {
      const match = manpowerList.find(u => u.name.trim().toLowerCase() === m.role.trim().toLowerCase());
      if (match && match.rate > 0) {
        changed = true;
        return {
          ...m,
          basicSalary: match.basicSalary ?? m.basicSalary,
          ppeDaily: match.ppeDaily ?? m.ppeDaily,
          jamsostekDaily: match.jamsostekDaily ?? m.jamsostekDaily,
          mealsDaily: match.mealsDaily ?? m.mealsDaily,
          otherAllowanceDaily: match.otherAllowanceDaily ?? m.otherAllowanceDaily,
          totalRate: match.rate
        };
      }
      return m;
    });
    if (changed) saveMasterManpower(updated);
  }

  // 2. Equipment
  if (equipmentList && equipmentList.length > 0) {
    const list = loadMasterEquipment();
    let changed = false;
    const updated = list.map(e => {
      const match = equipmentList.find(u => u.name.trim().toLowerCase() === e.name.trim().toLowerCase());
      if (match && match.rate > 0) {
        changed = true;
        return {
          ...e,
          baseRentalRate: match.baseRentalRate ?? e.baseRentalRate,
          fuelType: (match.fuelType as 'Solar' | 'Bensin' | 'Listrik' | 'None') ?? e.fuelType,
          fuelLitersPerDay: match.fuelLitersPerDay ?? e.fuelLitersPerDay,
          fuelPricePerLiter: match.fuelPricePerLiter ?? e.fuelPricePerLiter,
          bbmRate: match.bbmRate ?? e.bbmRate,
          maintenanceRate: match.maintenanceRate ?? e.maintenanceRate,
          mobilizationDaily: match.mobilizationDaily ?? e.mobilizationDaily,
          totalRate: match.rate
        };
      }
      return e;
    });
    if (changed) saveMasterEquipment(updated);
  }

  // 3. Material
  if (materialList && materialList.length > 0) {
    const list = loadMasterMaterial();
    let changed = false;
    const updated = list.map(mat => {
      const match = materialList.find(u => u.name.trim().toLowerCase() === mat.name.trim().toLowerCase());
      if (match && match.rate > 0) {
        changed = true;
        return {
          ...mat,
          standardRate: match.rate,
          unit: match.unit || mat.unit
        };
      }
      return mat;
    });
    if (changed) saveMasterMaterial(updated);
  }

  // 4. Consumables
  if (consumableList && consumableList.length > 0) {
    const list = loadMasterConsumable();
    let changed = false;
    const updated = list.map(cs => {
      const match = consumableList.find(u => u.name.trim().toLowerCase() === cs.name.trim().toLowerCase());
      if (match && match.rate > 0) {
        changed = true;
        return {
          ...cs,
          standardRate: match.rate,
          unit: match.unit || cs.unit
        };
      }
      return cs;
    });
    if (changed) saveMasterConsumable(updated);
  }
}
