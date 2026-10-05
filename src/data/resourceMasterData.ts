// Master Database Resource Referensi (Tenaga Kerja & Peralatan)
// Digunakan untuk lookup master data tarif dengan rincian variabel (APD, Jamsostek, BBM, Maintenance)

export interface MasterManpower {
  id: string;
  role: string;
  category: string;           // Kategori dinamis (Piping, Welding, Electrical, Scaffolding, dll.)
  unit: string;
  basicSalary: number;        // Gaji Pokok Harian (IDR)
  ppeDaily: number;           // Alokasi APD / PPE (Coverall, Safety Shoes, Helm, Kacamata, Sarung Tangan)
  jamsostekDaily: number;     // BPJS Ketenagakerjaan (JKK, JKM, JHT) & Kesehatan
  mealsDaily: number;         // Uang Makan, Mess & Transport Lapangan
  otherAllowanceDaily: number;// Tunjangan Keahlian / Sertifikasi Migas
  totalRate: number;          // Total Biaya Mandays (IDR/hari)
  notes?: string;
}

export interface MasterEquipment {
  id: string;
  name: string;
  category: string;           // Kategori dinamis (Compressor, Welding, Heavy Crane, Tools, dll.)
  unit: string;
  baseRentalRate: number;     // Sewa Unit Dasar (Dry Rate IDR/hari)
  fuelType: 'Solar' | 'Bensin' | 'Listrik' | 'None';
  fuelLitersPerDay: number;   // Konsumsi BBM rata-rata (Liter/hari)
  fuelPricePerLiter: number;  // Harga BBM Solar Industri / Pertalite (IDR/Liter)
  bbmRate: number;            // Total Biaya Bahan Bakar per hari (IDR)
  maintenanceRate: number;    // Biaya Pelumas (Oli, Grease), Filter & Servis Rutin per hari (IDR)
  mobilizationDaily: number;  // Alokasi Mob/Demob per hari (IDR)
  totalRate: number;          // Total Sewa Harian Lengkap (Wet Rate IDR/hari)
  notes?: string;
}

export const MASTER_MANPOWER_DATABASE: MasterManpower[] = [
  {
    id: 'm-weld-6g',
    role: 'Welder 6G (GTAW / SMAW)',
    category: 'Welding',
    unit: 'org',
    basicSalary: 250000,
    ppeDaily: 30000,          // Welding hood, apron kulit, sarung tangan las, safety shoes
    jamsostekDaily: 25000,     // BPJS Ketenagakerjaan premi resiko tinggi
    mealsDaily: 35000,
    otherAllowanceDaily: 10000,// Tunjangan sertifikasi 6G Migas
    totalRate: 350000,
    notes: 'Sertifikat Migas / BNSP aktif, spesialis pipa boiler & pressure vessel'
  },
  {
    id: 'm-weld-3g4g',
    role: 'Welder 3G / 4G (SMAW Plate/Pipe)',
    category: 'Welding',
    unit: 'org',
    basicSalary: 200000,
    ppeDaily: 25000,
    jamsostekDaily: 20000,
    mealsDaily: 35000,
    otherAllowanceDaily: 0,
    totalRate: 280000,
    notes: 'Struktur baja, pipe rack, support & plate fabrication'
  },
  {
    id: 'm-pipe-fitter',
    role: 'Pipe Fitter (Senior / Lead)',
    category: 'Piping & Fabrication',
    unit: 'org',
    basicSalary: 180000,
    ppeDaily: 25000,
    jamsostekDaily: 20000,
    mealsDaily: 25000,
    otherAllowanceDaily: 0,
    totalRate: 250000,
    notes: 'Kemampuan membaca isometrik, alignment bevel, toleransi gap piping'
  },
  {
    id: 'm-fitter-helper',
    role: 'Fitter / Welder Helper',
    category: 'General Crew',
    unit: 'org',
    basicSalary: 120000,
    ppeDaily: 20000,
    jamsostekDaily: 15000,
    mealsDaily: 15000,
    otherAllowanceDaily: 0,
    totalRate: 170000,
    notes: 'Support potong, gerinda, pembersihan slag & handling material'
  },
  {
    id: 'm-blaster',
    role: 'Sandblaster / Garnet Blaster',
    category: 'Blasting & Painting',
    unit: 'org',
    basicSalary: 210000,
    ppeDaily: 35000,          // Blast helmet ber-filter, heavy duty blast suit
    jamsostekDaily: 25000,
    mealsDaily: 30000,
    otherAllowanceDaily: 0,
    totalRate: 300000,
    notes: 'Standar kebersihan Sa 2.5 & Sa 3.0 abrasive blasting'
  },
  {
    id: 'm-painter',
    role: 'Industrial Painter (Airless Spray)',
    category: 'Blasting & Painting',
    unit: 'org',
    basicSalary: 190000,
    ppeDaily: 25000,          // Respirator cat kimia, kacamata, coverall
    jamsostekDaily: 20000,
    mealsDaily: 25000,
    otherAllowanceDaily: 0,
    totalRate: 260000,
    notes: 'Aplikasi Epoxy Primer, Polyurethane, DFT check & wft check'
  },
  {
    id: 'm-ndt-lvl2',
    role: 'NDT Inspector Level II (UT / MT / PT)',
    category: 'NDT & Inspection',
    unit: 'org',
    basicSalary: 320000,
    ppeDaily: 25000,
    jamsostekDaily: 25000,
    mealsDaily: 40000,
    otherAllowanceDaily: 40000,// Tunjangan sertifikasi ASNT / B4T Level II
    totalRate: 450000,
    notes: 'ASNT Level II bersertifikat UT flaw detector, MPI, PT'
  },
  {
    id: 'm-hse-officer',
    role: 'HSE Officer / Safety Inspector',
    category: 'HSE & Supervision',
    unit: 'org',
    basicSalary: 260000,
    ppeDaily: 25000,
    jamsostekDaily: 25000,
    mealsDaily: 40000,
    otherAllowanceDaily: 30000,// AK3 Umum Kemnaker / BNSP Migas
    totalRate: 380000,
    notes: 'JSA, Toolbox meeting, permit to work (PTW), gas testing'
  },
  {
    id: 'm-medic-site',
    role: 'Site Medic / Paramedic (Hiperkes / BTCLS)',
    category: 'HSE & Supervision',
    unit: 'org',
    basicSalary: 280000,
    ppeDaily: 25000,
    jamsostekDaily: 25000,
    mealsDaily: 40000,
    otherAllowanceDaily: 30000, // STR, Sertifikasi Hiperkes & BTCLS
    totalRate: 400000,
    notes: 'Tenaga medis lapangan bersertifikat Hiperkes, STR aktif & tanggap darurat P3K Migas'
  },
  {
    id: 'm-supervisor',
    role: 'Site Supervisor Piping & Mechanical',
    category: 'HSE & Supervision',
    unit: 'org',
    basicSalary: 320000,
    ppeDaily: 25000,
    jamsostekDaily: 25000,
    mealsDaily: 45000,
    otherAllowanceDaily: 45000,
    totalRate: 460000,
    notes: 'Pengawasan progress lapangan, QA/QC koordinasi, daily report'
  },
  {
    id: 'm-scaffolder',
    role: 'Certified Scaffolder',
    category: 'Piping & Fabrication',
    unit: 'org',
    basicSalary: 180000,
    ppeDaily: 25000,          // Full body harness double lanyard, helm safety
    jamsostekDaily: 20000,
    mealsDaily: 25000,
    otherAllowanceDaily: 10000,
    totalRate: 260000,
    notes: 'Sertifikat Kemnaker Scaffolder, ereksi & dismantling perancah'
  },
  {
    id: 'm-rigger',
    role: 'Rigger / Pipe Handler',
    category: 'General Crew',
    unit: 'org',
    basicSalary: 150000,
    ppeDaily: 20000,
    jamsostekDaily: 15000,
    mealsDaily: 20000,
    otherAllowanceDaily: 5000,
    totalRate: 210000,
    notes: 'Sertifikat Rigger Migas, lifting plan, slinging & crane spotting'
  },
  {
    id: 'm-electrician',
    role: 'Electrician / Teknisi Listrik',
    category: 'Piping & Fabrication',
    unit: 'org',
    basicSalary: 180000,
    ppeDaily: 20000,
    jamsostekDaily: 20000,
    mealsDaily: 25000,
    otherAllowanceDaily: 15000,
    totalRate: 260000,
    notes: 'Instalasi panel genset, motor 3 phase, grounding & lighting'
  }
];

export const MASTER_EQUIPMENT_DATABASE: MasterEquipment[] = [
  {
    id: 'eq-comp-375',
    name: 'Air Compressor 375 CFM Diesel (Airman / Atlas Copco)',
    category: 'Compressor & Power',
    unit: 'unit',
    baseRentalRate: 400000,
    fuelType: 'Solar',
    fuelLitersPerDay: 20,       // 20 liter solar industri per hari operasi
    fuelPricePerLiter: 14500,   // Solar industri non-subsidi
    bbmRate: 290000,            // 20 * 14.500
    maintenanceRate: 60000,     // Oli kompresor, filter udara & pemisah
    mobilizationDaily: 0,
    totalRate: 750000,
    notes: 'Kapasitas 100-125 PSI, ideal untuk 1-2 nozzle blasting & airless'
  },
  {
    id: 'eq-weld-inverter-400',
    name: 'Mesin Las Inverter DC 400A (Miller / Lincoln)',
    category: 'Welding Machine',
    unit: 'unit',
    baseRentalRate: 70000,
    fuelType: 'Listrik',
    fuelLitersPerDay: 0,
    fuelPricePerLiter: 0,
    bbmRate: 0,
    maintenanceRate: 20000,     // Kabel las, stang massa & penjepit elektroda
    mobilizationDaily: 0,
    totalRate: 90000,
    notes: 'Tig HF & MMAW, duty cycle 60% @ 400 Ampere'
  },
  {
    id: 'eq-weld-diesel-400',
    name: 'Mesin Las Engine Diesel 400A (Lincoln Vantage / Miller Bobcat)',
    category: 'Welding Machine',
    unit: 'unit',
    baseRentalRate: 220000,
    fuelType: 'Solar',
    fuelLitersPerDay: 12,       // 12 liter solar per hari
    fuelPricePerLiter: 14500,
    bbmRate: 174000,            // 12 * 14.500
    maintenanceRate: 36000,     // Oli mesin diesel & filter
    mobilizationDaily: 0,
    totalRate: 430000,
    notes: 'Independen tanpa genset tambahan, cocok di lokasi remote'
  },
  {
    id: 'eq-genset-50kva',
    name: 'Genset Silent 50 kVA (Perkins / Cummins)',
    category: 'Compressor & Power',
    unit: 'unit',
    baseRentalRate: 250000,
    fuelType: 'Solar',
    fuelLitersPerDay: 18,
    fuelPricePerLiter: 14500,
    bbmRate: 261000,            // 18 * 14.500
    maintenanceRate: 49000,     // Servis oli genset & pendingin
    mobilizationDaily: 0,
    totalRate: 560000,
    notes: 'Kapasitas 40 kW continuous, mampu menopang 3-4 mesin las inverter'
  },
  {
    id: 'eq-genset-100kva',
    name: 'Genset Silent 100 kVA',
    category: 'Compressor & Power',
    unit: 'unit',
    baseRentalRate: 450000,
    fuelType: 'Solar',
    fuelLitersPerDay: 30,
    fuelPricePerLiter: 14500,
    bbmRate: 435000,            // 30 * 14.500
    maintenanceRate: 65000,
    mobilizationDaily: 0,
    totalRate: 950000,
    notes: 'Kapasitas 80 kW continuous untuk area camp & fabrication shop besar'
  },
  {
    id: 'eq-blast-pot-600',
    name: 'Blasting Pot 600 lbs + Blast Hose 20m + Nozzle Tungsten #6',
    category: 'Blasting & Coating',
    unit: 'unit',
    baseRentalRate: 100000,
    fuelType: 'None',
    fuelLitersPerDay: 0,
    fuelPricePerLiter: 0,
    bbmRate: 0,
    maintenanceRate: 30000,     // Aus nozzle tip, blast hose coupling & valve
    mobilizationDaily: 0,
    totalRate: 130000,
    notes: 'Deadman handle safety switch, moisture separator filter'
  },
  {
    id: 'eq-airless-68',
    name: 'Airless Spray Pump 68:1 (Graco King / Wagner)',
    category: 'Blasting & Coating',
    unit: 'unit',
    baseRentalRate: 120000,
    fuelType: 'None',
    fuelLitersPerDay: 0,
    fuelPricePerLiter: 0,
    bbmRate: 0,
    maintenanceRate: 30000,     // Tip spray RAC X, packing seal & TSL oil
    mobilizationDaily: 0,
    totalRate: 150000,
    notes: 'High pressure coating pump untuk aplikasi high solid epoxy & mastic'
  },
  {
    id: 'eq-crane-25t',
    name: 'Mobile Crane 25 Ton (Rough Terrain / Telescopic)',
    category: 'Lifting & Heavy',
    unit: 'unit',
    baseRentalRate: 1500000,
    fuelType: 'Solar',
    fuelLitersPerDay: 35,
    fuelPricePerLiter: 14500,
    bbmRate: 507500,
    maintenanceRate: 92500,     // Pelumas hidrolik, grease sling wire
    mobilizationDaily: 0,
    totalRate: 2100000,
    notes: 'Sertifikat SILO Disnaker aktif, load chart 25 Ton'
  },
  {
    id: 'eq-hp-jetting-10k',
    name: 'High Pressure Water Jetting Pump 10.000 PSI (Diesel Driven)',
    category: 'Tools & Fleet',
    unit: 'unit',
    baseRentalRate: 350000,
    fuelType: 'Solar',
    fuelLitersPerDay: 16,
    fuelPricePerLiter: 14500,
    bbmRate: 232000,
    maintenanceRate: 48000,     // Plunger packing, water filter & rotating nozzle
    mobilizationDaily: 0,
    totalRate: 630000,
    notes: 'Pembersihan scale & slime internal pipa OCTG tubular'
  },
  {
    id: 'eq-gerinda-4',
    name: 'Mesin Gerinda Tangan 4" & 5" (Makita / Bosch)',
    category: 'Tools & Fleet',
    unit: 'unit',
    baseRentalRate: 25000,
    fuelType: 'Listrik',
    fuelLitersPerDay: 0,
    fuelPricePerLiter: 0,
    bbmRate: 0,
    maintenanceRate: 5000,      // Carbon brush & bearing
    mobilizationDaily: 0,
    totalRate: 30000,
    notes: 'Kecepatan 11.000 RPM dengan safety guard'
  },
  {
    id: 'eq-ndt-ut-gauge',
    name: 'Ultrasonic Thickness Gauge & Flaw Detector (Olympus / Sonatest)',
    category: 'Testing & NDT',
    unit: 'unit',
    baseRentalRate: 160000,
    fuelType: 'None',
    fuelLitersPerDay: 0,
    fuelPricePerLiter: 0,
    bbmRate: 0,
    maintenanceRate: 20000,     // Kalibrasi step wedge, probe wear & couplant
    mobilizationDaily: 0,
    totalRate: 180000,
    notes: 'Kalibrasi lab terakreditasi KAN aktif'
  },
  {
    id: 'eq-pickup-4x4',
    name: 'Mobil Operasional Pick-up 4x4 Double Cabin (Hilux / Triton)',
    category: 'Tools & Fleet',
    unit: 'unit',
    baseRentalRate: 350000,
    fuelType: 'Solar',
    fuelLitersPerDay: 15,
    fuelPricePerLiter: 14500,
    bbmRate: 217500,
    maintenanceRate: 52500,     // Oli mesin, ban & servis berkala
    mobilizationDaily: 0,
    totalRate: 620000,
    notes: 'Dilengkapi rollbar, fire extinguisher & safety driving kit'
  }
];

// ==========================================
// 3. MASTER MATERIAL UTAMA & CONSUMABLES
// ==========================================

export interface MasterMaterialItem {
  id: string;
  name: string;
  category: string;           // Piping, Structure, Valves, Welding, Blasting, Paint, dll.
  type: 'material' | 'consumable';
  unit: string;
  standardRate: number;       // Harga Standar / Rekomendasi (IDR)
  priceLow: number;          // Rentang Harga Bawah (IDR)
  priceHigh: number;         // Rentang Harga Atas (IDR)
  specs?: string;             // Spesifikasi Teknis / Standar (ASTM/API/DIN)
  notes?: string;             // Catatan Sumber / Merk / Vendor
}

export const MASTER_MATERIAL_DATABASE: MasterMaterialItem[] = [
  {
    id: 'mat-pipe-cs-2',
    name: 'Pipa Seamless Carbon Steel ASTM A106 Gr. B 2" Sch 40',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'meter',
    standardRate: 155000,
    priceLow: 135000,
    priceHigh: 175000,
    specs: 'ASTM A106 Gr. B / API 5L Gr. B, OD 60.3mm, WT 3.91mm, c/w MTC',
    notes: 'Distributor Pipa Baja Jakarta/Surabaya (B2B)'
  },
  {
    id: 'mat-pipe-cs-3',
    name: 'Pipa Seamless Carbon Steel ASTM A106 Gr. B 3" Sch 40',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'meter',
    standardRate: 250000,
    priceLow: 220000,
    priceHigh: 280000,
    specs: 'ASTM A106 Gr. B OD 88.9mm, WT 5.49mm',
    notes: 'Supplier Pipa Migas Nasional'
  },
  {
    id: 'mat-pipe-cs-4',
    name: 'Pipa Seamless Carbon Steel ASTM A106 Gr. B 4" Sch 40',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'meter',
    standardRate: 350000,
    priceLow: 310000,
    priceHigh: 390000,
    specs: 'ASTM A106 Gr. B OD 114.3mm, WT 6.02mm',
    notes: 'Distributor Resmi Pipa Baja Cilegon'
  },
  {
    id: 'mat-pipe-cs-6',
    name: 'Pipa Seamless Carbon Steel ASTM A106 Gr. B 6" Sch 40',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'meter',
    standardRate: 610000,
    priceLow: 550000,
    priceHigh: 680000,
    specs: 'ASTM A106 Gr. B OD 168.3mm, WT 7.11mm',
    notes: 'Referensi Pasar Pipa EPC Migas'
  },
  {
    id: 'mat-pipe-cs-8',
    name: 'Pipa Seamless Carbon Steel ASTM A106 Gr. B 8" Sch 40',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'meter',
    standardRate: 920000,
    priceLow: 840000,
    priceHigh: 1050000,
    specs: 'ASTM A106 Gr. B OD 219.1mm, WT 8.18mm',
    notes: 'Supplier Pipa Migas & Industrial Plant'
  },
  {
    id: 'mat-pipe-ss-2',
    name: 'Pipa Stainless Steel 316L 2" Sch 40 Seamless',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'meter',
    standardRate: 480000,
    priceLow: 420000,
    priceHigh: 540000,
    specs: 'ASTM A312 TP316L Annealed & Pickled',
    notes: 'Importir Stainless Steel Specialist Glodok'
  },
  {
    id: 'mat-flange-wnrf-2',
    name: 'Flange Weld Neck WNRF 2" ANSI Class 150 Carbon Steel',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'pcs',
    standardRate: 165000,
    priceLow: 140000,
    priceHigh: 195000,
    specs: 'ASTM A105N, Raised Face, Sch 40 Bore',
    notes: 'Distributor Flange & Fitting Glodok/Surabaya'
  },
  {
    id: 'mat-flange-wnrf-4',
    name: 'Flange Weld Neck WNRF 4" ANSI Class 150 Carbon Steel',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'pcs',
    standardRate: 335000,
    priceLow: 290000,
    priceHigh: 380000,
    specs: 'ASTM A105N, Raised Face, Sch 40 Bore',
    notes: 'Supplier Flange Fitting EPC'
  },
  {
    id: 'mat-flange-wnrf-6',
    name: 'Flange Weld Neck WNRF 6" ANSI Class 150 Carbon Steel',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'pcs',
    standardRate: 520000,
    priceLow: 460000,
    priceHigh: 590000,
    specs: 'ASTM A105N, Raised Face, Sch 40 Bore',
    notes: 'Supplier Flange Migas Cilegon'
  },
  {
    id: 'mat-elbow-90-2',
    name: 'Elbow 90 Deg Long Radius (LR) 2" Sch 40 Carbon Steel',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'pcs',
    standardRate: 45000,
    priceLow: 35000,
    priceHigh: 55000,
    specs: 'ASTM A234 WPB Butt-weld Seamless',
    notes: 'Pabrikan Fitting Pipa Industri'
  },
  {
    id: 'mat-elbow-90-4',
    name: 'Elbow 90 Deg Long Radius (LR) 4" Sch 40 Carbon Steel',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'pcs',
    standardRate: 115000,
    priceLow: 95000,
    priceHigh: 140000,
    specs: 'ASTM A234 WPB Butt-weld Seamless',
    notes: 'Distributor Fitting Migas'
  },
  {
    id: 'mat-tee-equal-2',
    name: 'Tee Equal Butt-weld 2" Sch 40 ASTM A234 WPB',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'pcs',
    standardRate: 75000,
    priceLow: 60000,
    priceHigh: 90000,
    specs: 'ASTM A234 WPB Seamless Tee',
    notes: 'Fitting Piping Specialist'
  },
  {
    id: 'mat-plate-a36-10',
    name: 'Plat Baja ASTM A36 / SS400 Tebal 10mm',
    category: 'Steel Structure',
    type: 'material',
    unit: 'kg',
    standardRate: 15500,
    priceLow: 14000,
    priceHigh: 17500,
    specs: 'Krakatau Steel / Import Plat Kapal Grade A c/w Mill Certificate',
    notes: 'Pusat Baja Cilegon / Surabaya'
  },
  {
    id: 'mat-plate-a36-12',
    name: 'Plat Baja ASTM A36 / SS400 Tebal 12mm',
    category: 'Steel Structure',
    type: 'material',
    unit: 'kg',
    standardRate: 15500,
    priceLow: 14000,
    priceHigh: 17500,
    specs: 'Krakatau Steel / Gunung Raja Paksi',
    notes: 'Distributor Besi Baja Plat'
  },
  {
    id: 'mat-studbolt-58',
    name: 'Stud Bolt A193 B7 c/w 2 Heavy Hex Nut A194 2H 5/8" x 3.5"',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'set',
    standardRate: 35000,
    priceLow: 28000,
    priceHigh: 42000,
    specs: 'High Tensile B7/2H Black Finish / Fluoropolymer',
    notes: 'Fastener Specialist Migas'
  },
  {
    id: 'mat-swg-2-150',
    name: 'Spiral Wound Gasket (SWG) 2" ANSI 150# SS316/Graphite',
    category: 'Piping & Fabrication',
    type: 'material',
    unit: 'pcs',
    standardRate: 48000,
    priceLow: 38000,
    priceHigh: 60000,
    specs: 'Inner/Outer ring Carbon Steel, Winding SS316 with Flexible Graphite filler',
    notes: 'Klinger / Garlock Gasket Distributor'
  },
  {
    id: 'mat-valve-ball-2',
    name: 'Ball Valve 2" Flanged ANSI 150# Carbon Steel (WCB)',
    category: 'Valves & Flow',
    type: 'material',
    unit: 'unit',
    standardRate: 1700000,
    priceLow: 1450000,
    priceHigh: 1950000,
    specs: 'Body A216 WCB, Ball SS316, Fire Safe API 607, Lever Operated',
    notes: 'Distributor Valve KITZ / Arita / Pekos'
  },
  {
    id: 'mat-valve-gate-2',
    name: 'Gate Valve 2" Flanged ANSI 150# Carbon Steel (WCB)',
    category: 'Valves & Flow',
    type: 'material',
    unit: 'unit',
    standardRate: 1950000,
    priceLow: 1650000,
    priceHigh: 2300000,
    specs: 'Body A216 WCB, Trim 8 (13Cr/Stellite), OS&Y, Rising Stem API 600',
    notes: 'Distributor Valve Migas Glodok'
  }
];

export const MASTER_CONSUMABLE_DATABASE: MasterMaterialItem[] = [
  {
    id: 'cs-kawat-lb52',
    name: 'Kawat Las Kobelco LB-52 (AWS E7018) Dia 3.2mm',
    category: 'Welding Consumable',
    type: 'consumable',
    unit: 'kg',
    standardRate: 42000,
    priceLow: 38000,
    priceHigh: 48000,
    specs: 'Low Hydrogen, box 20kg (4x5kg), Kobe Steel Asli',
    notes: 'Distributor Resmi Kobelco / Monotaro'
  },
  {
    id: 'cs-kawat-lb52u',
    name: 'Kawat Las Kobelco LB-52U (Root Pass Pipe) Dia 2.6mm',
    category: 'Welding Consumable',
    type: 'consumable',
    unit: 'kg',
    standardRate: 55000,
    priceLow: 48000,
    priceHigh: 62000,
    specs: 'Khusus penetrasi akar pipa one side welding',
    notes: 'Supplier Kawat Las Migas'
  },
  {
    id: 'cs-kawat-tig-er70s',
    name: 'Kawat Las TIG Rod ER70S-6 Dia 2.4mm (Carbon Steel)',
    category: 'Welding Consumable',
    type: 'consumable',
    unit: 'kg',
    standardRate: 40000,
    priceLow: 35000,
    priceHigh: 48000,
    specs: 'Copper coated TIG rod panjang 1000mm',
    notes: 'Distributor Gas & Welding Supplies'
  },
  {
    id: 'cs-kawat-ss-308l',
    name: 'Kawat Las Stainless Steel AWS E308L-16 Dia 2.6mm (Nikko / Kobelco)',
    category: 'Welding Consumable',
    type: 'consumable',
    unit: 'kg',
    standardRate: 145000,
    priceLow: 130000,
    priceHigh: 170000,
    specs: 'Untuk pengelasan stainless steel TP304/304L & dissimilar',
    notes: 'Distributor Kawat Las Stainless'
  },
  {
    id: 'cs-argon-gas',
    name: 'Gas Argon High Purity (HP 99.99%) Tabung 6m3 (Isi Ulang)',
    category: 'Welding Consumable',
    type: 'consumable',
    unit: 'tabung',
    standardRate: 230000,
    priceLow: 190000,
    priceHigh: 270000,
    specs: 'Tekanan 150 bar, gas murni untuk GTAW/TIG',
    notes: 'Samator / Aneka Gas Industri'
  },
  {
    id: 'cs-oksigen-gas',
    name: 'Gas Oksigen Industri Tabung 6m3 (Isi Ulang Potong & Las)',
    category: 'Welding Consumable',
    type: 'consumable',
    unit: 'tabung',
    standardRate: 85000,
    priceLow: 70000,
    priceHigh: 105000,
    specs: 'Tekanan 150 bar untuk cutting torch & heating',
    notes: 'Samator Gas Depot'
  },
  {
    id: 'cs-batu-gerinda-4',
    name: 'Batu Gerinda Potong 4" x 1.2mm (Resibon / WD)',
    category: 'Grinding & Tools',
    type: 'consumable',
    unit: 'pcs',
    standardRate: 7000,
    priceLow: 5500,
    priceHigh: 8500,
    specs: 'Reinforced cutting wheel 105 x 1.2 x 16mm',
    notes: 'Pusat Alat Teknik / Monotaro'
  },
  {
    id: 'cs-batu-asah-4',
    name: 'Batu Gerinda Asah / Fleksibel 4" (Nippon Resibon)',
    category: 'Grinding & Tools',
    type: 'consumable',
    unit: 'pcs',
    standardRate: 13500,
    priceLow: 11000,
    priceHigh: 16000,
    specs: 'Grinding disc bevel 100 x 6 x 16mm',
    notes: 'Distributor Resibon Indonesia'
  },
  {
    id: 'cs-amplas-flap-4',
    name: 'Amplas Flap Disc 4" Grit 80 (Zirconia Flap Wheel)',
    category: 'Grinding & Tools',
    type: 'consumable',
    unit: 'pcs',
    standardRate: 12000,
    priceLow: 9500,
    priceHigh: 15000,
    specs: 'Finishing permukaan weld seam & bevel cleaning',
    notes: 'Pusat Abrasif Glodok'
  },
  {
    id: 'cs-garnet-blasting',
    name: 'Pasir Garnet Sandblasting Mesh 30/60 (GMA Australia / India)',
    category: 'Blasting & Coating',
    type: 'consumable',
    unit: 'kg',
    standardRate: 5500,
    priceLow: 4500,
    priceHigh: 6500,
    specs: 'Almandine mineral abrasive, kemasan sak 25kg (Rp 137.500/sak)',
    notes: 'Importir Abrasive Blasting Batam/Jakarta'
  },
  {
    id: 'cs-cat-epoxy-primer',
    name: 'Cat Epoxy Primer High Solid (Jotun Penguard / Hempel)',
    category: 'Blasting & Coating',
    type: 'consumable',
    unit: 'liter',
    standardRate: 145000,
    priceLow: 125000,
    priceHigh: 165000,
    specs: '2 Komponen Base + Hardener, daya sebar 8-10 m2/liter',
    notes: 'Distributor Resmi Jotun / Hempel Marine'
  },
  {
    id: 'cs-cat-polyurethane',
    name: 'Cat Polyurethane Topcoat Gloss (Jotun Hardtop AX)',
    category: 'Blasting & Coating',
    type: 'consumable',
    unit: 'liter',
    standardRate: 185000,
    priceLow: 160000,
    priceHigh: 210000,
    specs: 'UV Resistant & Weathering protection untuk offshore & plant',
    notes: 'Distributor Protective Coatings'
  },
  {
    id: 'cs-thinner-epoxy',
    name: 'Thinner Epoxy Pengencer Cat Industri (Jotun No. 17)',
    category: 'Blasting & Coating',
    type: 'consumable',
    unit: 'liter',
    standardRate: 38000,
    priceLow: 32000,
    priceHigh: 45000,
    specs: 'Slow evaporating solvent untuk spray & roll',
    notes: 'Toko Cat Industri & Marine'
  },
  {
    id: 'cs-solar-industri',
    name: 'BBM Solar Industri Non-Subsidi (HSD Pertamina)',
    category: 'Fuel & Oil',
    type: 'consumable',
    unit: 'liter',
    standardRate: 14500,
    priceLow: 13500,
    priceHigh: 16000,
    specs: 'Harga resmi Pertamina Patra Niaga Franco Depot',
    notes: 'Publikasi Resmi Pertamina Periode Berjalan'
  },
  {
    id: 'cs-majun',
    name: 'Kain Majun Putih Katun Jahit Bersih (Pembersih Pipa & Spool)',
    category: 'General Consumable',
    type: 'consumable',
    unit: 'kg',
    standardRate: 15000,
    priceLow: 12000,
    priceHigh: 18000,
    specs: 'Bahan katun daya serap tinggi tanpa kancing/ritsleting',
    notes: 'Supplier Perlengkapan Workshop'
  },
  {
    id: 'cs-wd40',
    name: 'Pelumas Penetran & Anti-Karat WD-40 Aerosol 412ml',
    category: 'General Consumable',
    type: 'consumable',
    unit: 'kaleng',
    standardRate: 65000,
    priceLow: 55000,
    priceHigh: 78000,
    specs: 'Penetrating oil untuk membuka baut karat & proteksi',
    notes: 'Pusat Alat Industri'
  }
];

