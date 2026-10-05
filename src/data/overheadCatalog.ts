// ====================================================================
// KATALOG DATABASE MASTER INDIRECT COST / OVERHEAD (OH)
// Standar Industri: Oil & Gas, Mining, Petrochemical, EPC & Maintenance
// ====================================================================

export type OverheadCategory = 
  | 'Manajemen & Pengawasan'
  | 'Fasilitas & Utilitas Lapangan'
  | 'HSE & Keselamatan Kerja'
  | 'Mobilisasi & Akomodasi'
  | 'Asuransi, Legal & Jaminan'
  | 'Testing & Inspeksi Pihak Ketiga'
  | 'Head Office Support (G&A)';

export interface OverheadTemplateItem {
  id: string;
  category: OverheadCategory;
  name: string;
  defaultUnit: string;
  defaultQty: number;
  benchmarkRate: number; // IDR
  description: string;
  isPopular?: boolean;
}

export const OVERHEAD_CATEGORIES: OverheadCategory[] = [
  'Manajemen & Pengawasan',
  'Fasilitas & Utilitas Lapangan',
  'HSE & Keselamatan Kerja',
  'Mobilisasi & Akomodasi',
  'Asuransi, Legal & Jaminan',
  'Testing & Inspeksi Pihak Ketiga',
  'Head Office Support (G&A)'
];

export const BASE_OVERHEAD_CATALOG: OverheadTemplateItem[] = [
  // 1. MANAJEMEN & PENGAWASAN
  {
    id: 'oh-mg-01',
    category: 'Manajemen & Pengawasan',
    name: 'Project Manager (PM) Site Supervision',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 35000000,
    description: 'Pimpinan proyek penanggung jawab penuh jadwal, mutu, dan anggaran lapangan',
    isPopular: true
  },
  {
    id: 'oh-mg-02',
    category: 'Manajemen & Pengawasan',
    name: 'Site Coordinator / Field Engineer',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 22000000,
    description: 'Koordinator eksekusi teknis dan koordinasi antar disiplin di area kerja'
  },
  {
    id: 'oh-mg-03',
    category: 'Manajemen & Pengawasan',
    name: 'QA/QC Inspector & Document Controller',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 18000000,
    description: 'Inspeksi kualitas kerja, verifikasi material report, dan kompilasi handover dossier'
  },
  {
    id: 'oh-mg-04',
    category: 'Manajemen & Pengawasan',
    name: 'Site Administrator & Timekeeper',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 10000000,
    description: 'Pencatatan timesheet kru, administrasi gudang, dan laporan harian proyek'
  },

  // 2. FASILITAS & UTILITAS LAPANGAN
  {
    id: 'oh-fc-01',
    category: 'Fasilitas & Utilitas Lapangan',
    name: 'Sewa Container Direksi Keet (Office 20ft Full AC)',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 7500000,
    description: 'Kantor lapangan ber-AC lengkap meja rapat, whiteboard, dan instalasi listrik',
    isPopular: true
  },
  {
    id: 'oh-fc-02',
    category: 'Fasilitas & Utilitas Lapangan',
    name: 'Genset Penerangan & Kantor Lapangan 25 kVA (inc. BBM)',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 16500000,
    description: 'Suplai daya listrik mandiri untuk operasional direksi keet, charging alat, dan lampu kerja'
  },
  {
    id: 'oh-fc-03',
    category: 'Fasilitas & Utilitas Lapangan',
    name: 'Internet Starlink / 4G Router & Komunikasi Radio HT',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 3500000,
    description: 'Koneksi data online untuk pelaporan progress real-time dan radio komunikasi HT frekuensi aman'
  },
  {
    id: 'oh-fc-04',
    category: 'Fasilitas & Utilitas Lapangan',
    name: 'Penyediaan Air Bersih & Sanitasi Portable Toilet',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 4500000,
    description: 'Suplai tangki air tawar dan sewa toilet portable untuk kru lapangan'
  },

  // 3. HSE & KESELAMATAN KERJA
  {
    id: 'oh-hs-01',
    category: 'HSE & Keselamatan Kerja',
    name: 'HSE Officer Certified Migas / Kemnaker',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 20000000,
    description: 'Petugas K3 bersertifikat penuh yang mengawasi JSA, Toolbox Meeting, dan Permit to Work (PTW)',
    isPopular: true
  },
  {
    id: 'oh-hs-02',
    category: 'HSE & Keselamatan Kerja',
    name: 'Medical Check-Up (MCU) & Drug Test Kru',
    defaultUnit: 'Org',
    defaultQty: 10,
    benchmarkRate: 1250000,
    description: 'Pemeriksaan kesehatan pra-kerja wajib standar migas/tambang dan screening bebas narkoba'
  },
  {
    id: 'oh-hs-03',
    category: 'HSE & Keselamatan Kerja',
    name: 'Safety Induction, Badging & SIO Personil',
    defaultUnit: 'Paket',
    defaultQty: 1,
    benchmarkRate: 6000000,
    description: 'Pengurusan badge akses fasilitas klien dan Surat Izin Operasi (SIO) operator'
  },
  {
    id: 'oh-hs-04',
    category: 'HSE & Keselamatan Kerja',
    name: 'Alat Pemadam Api (APAR), Spill Kit & Rambu K3',
    defaultUnit: 'Paket',
    defaultQty: 1,
    benchmarkRate: 8500000,
    description: 'Perangkat tanggap darurat tumpahan kimia/BBM, APAR powder 6kg, dan safety signage standar'
  },

  // 4. MOBILISASI & AKOMODASI
  {
    id: 'oh-mb-01',
    category: 'Mobilisasi & Akomodasi',
    name: 'Tiket Penerbangan & Perjalanan Kru (PP)',
    defaultUnit: 'Trip',
    defaultQty: 5,
    benchmarkRate: 3500000,
    description: 'Mobilisasi tiket pesawat kru spesialis dari homebase ke lokasi terdekat proyek',
    isPopular: true
  },
  {
    id: 'oh-mb-02',
    category: 'Mobilisasi & Akomodasi',
    name: 'Sewa Rumah Mess / Basecamp Lapangan',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 12000000,
    description: 'Akomodasi tempat tinggal kru non-lokal, termasuk kasur, utilitas, dan kebersihan'
  },
  {
    id: 'oh-mb-03',
    category: 'Mobilisasi & Akomodasi',
    name: 'Sewa Mobil Operasional 4WD Double Cabin (inc. Driver)',
    defaultUnit: 'Bulan',
    defaultQty: 1,
    benchmarkRate: 21000000,
    description: 'Kendaraan operasional tangguh untuk mobilisasi kru dan logistik harian di medan industri'
  },
  {
    id: 'oh-mb-04',
    category: 'Mobilisasi & Akomodasi',
    name: 'Kargo & Ekspedisi Pengiriman Alat/Material Lapangan',
    defaultUnit: 'Lump Sum',
    defaultQty: 1,
    benchmarkRate: 15000000,
    description: 'Truk fuso / tronton pengangkutan alat berat dan peralatan pendukung dari workshop ke site'
  },

  // 5. ASURANSI, LEGAL & JAMINAN
  {
    id: 'oh-lg-01',
    category: 'Asuransi, Legal & Jaminan',
    name: 'Contractor All Risk (CAR) & Third Party Liability Insurance',
    defaultUnit: 'Paket',
    defaultQty: 1,
    benchmarkRate: 25000000,
    description: 'Asuransi kerugian proyek konstruksi dan tanggung gugat pihak ketiga selama masa kerja',
    isPopular: true
  },
  {
    id: 'oh-lg-02',
    category: 'Asuransi, Legal & Jaminan',
    name: 'Bank Guarantee - Jaminan Pelaksanaan (Performance Bond 5%)',
    defaultUnit: 'Paket',
    defaultQty: 1,
    benchmarkRate: 8500000,
    description: 'Biaya provisi dan administrasi penerbitan garansi bank pelaksanaan tender'
  },
  {
    id: 'oh-lg-03',
    category: 'Asuransi, Legal & Jaminan',
    name: 'Bank Guarantee - Jaminan Pemeliharaan (Maintenance Bond 5%)',
    defaultUnit: 'Paket',
    defaultQty: 1,
    benchmarkRate: 6000000,
    description: 'Biaya provisi penerbitan jaminan masa garansi/pemeliharaan pekerjaan tender'
  },

  // 6. TESTING & INSPEKSI PIHAK KETIGA
  {
    id: 'oh-ts-01',
    category: 'Testing & Inspeksi Pihak Ketiga',
    name: 'Sertifikasi Disnaker / Migas Peralatan Kerja',
    defaultUnit: 'Paket',
    defaultQty: 1,
    benchmarkRate: 14000000,
    description: 'Uji riksa laik pakai alat bantu (crane, kompresor, genset) oleh PJK3 resmi'
  },
  {
    id: 'oh-ts-02',
    category: 'Testing & Inspeksi Pihak Ketiga',
    name: 'Independent NDT / Third Party Inspection Agency',
    defaultUnit: 'Hari',
    defaultQty: 3,
    benchmarkRate: 4500000,
    description: 'Jasa inspektur pihak ketiga independen untuk verifikasi uji tanpa rusak (UT, MPI, RT)'
  },

  // 7. HEAD OFFICE SUPPORT (G&A)
  {
    id: 'oh-ho-01',
    category: 'Head Office Support (G&A)',
    name: 'Head Office Engineering & Tender Preparation Support',
    defaultUnit: 'Lump Sum',
    defaultQty: 1,
    benchmarkRate: 15000000,
    description: 'Dukungan tim kalkulator kantor pusat, review legal tender, dan penyusunan dokumen penawaran'
  },
  {
    id: 'oh-ho-02',
    category: 'Head Office Support (G&A)',
    name: 'Software License, Cloud Data & Printing Drawings',
    defaultUnit: 'Lump Sum',
    defaultQty: 1,
    benchmarkRate: 5000000,
    description: 'Pencetakan dokumen teknis skala A1/A3, lisensi CAD, dan infrastruktur cloud proyek'
  }
];
