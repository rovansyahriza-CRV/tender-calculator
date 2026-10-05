import type { ResourceDetailItem } from '../App';

export interface BaseTreatmentTemplate {
  id: string;
  category: string;
  description: string;
  unit: string;
  defaultOutputPerDay: number;
  crewDailyRate: number;
  equipmentDailyRate: number;
  materialUnitRate?: number;
  consumableUnitRate: number;
  notes?: string;
  manpowerList: ResourceDetailItem[];
  equipmentList: ResourceDetailItem[];
  materialList?: ResourceDetailItem[];
  consumableList: ResourceDetailItem[];
}

export const TREATMENT_CATEGORIES = [
  'Semua',
  'Piping & Mechanical',
  'Tubular OCTG',
  'Blasting & Painting',
  'NDT Testing',
  'HVAC & Maintenance',
  'Crew Mandays'
] as const;

export const BASE_TREATMENT_CATALOG: BaseTreatmentTemplate[] = [
  // 1. PIPING & MECHANICAL FABRICATION
  {
    id: 'pipe-fit-2',
    category: 'Piping & Mechanical',
    description: 'Fit-up 2" Dia Sch 40 Carbon Steel',
    unit: 'Joint',
    defaultOutputPerDay: 18.0,
    crewDailyRate: 420000,
    equipmentDailyRate: 50000,
    consumableUnitRate: 12000,
    notes: '1 Fitter + 1 Helper + gerinda & bevel check',
    manpowerList: [
      { id: 'mp-1', name: 'Pipe Fitter', qty: 1, unit: 'org', rate: 250000 },
      { id: 'mp-2', name: 'Fitter Helper', qty: 1, unit: 'org', rate: 170000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Mesin Gerinda Tangan 4"', qty: 1, unit: 'unit', rate: 30000 },
      { id: 'eq-2', name: 'Alat Ukur / Bevel Gauge & Clamp', qty: 1, unit: 'set', rate: 20000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Batu Gerinda Potong 4"', qty: 1, unit: 'pcs', rate: 7000 },
      { id: 'cs-2', name: 'Batu Kapur / Marker Putih', qty: 1, unit: 'pcs', rate: 5000 }
    ]
  },
  {
    id: 'pipe-fit-6',
    category: 'Piping & Mechanical',
    description: 'Fit-up 6" Dia Sch 40 Carbon Steel',
    unit: 'Joint',
    defaultOutputPerDay: 10.0,
    crewDailyRate: 420000,
    equipmentDailyRate: 50000,
    consumableUnitRate: 12000,
    notes: '1 Fitter + 1 Helper + level clamp',
    manpowerList: [
      { id: 'mp-1', name: 'Pipe Fitter', qty: 1, unit: 'org', rate: 250000 },
      { id: 'mp-2', name: 'Fitter Helper', qty: 1, unit: 'org', rate: 170000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Mesin Gerinda Tangan 4"', qty: 1, unit: 'unit', rate: 30000 },
      { id: 'eq-2', name: 'Pipe Level Clamp & Chain', qty: 1, unit: 'set', rate: 20000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Batu Gerinda Potong 4"', qty: 1, unit: 'pcs', rate: 7000 },
      { id: 'cs-2', name: 'Kawat Las Tack Weld E7018', qty: 0.1, unit: 'kg', rate: 50000 }
    ]
  },
  {
    id: 'pipe-fit-10',
    category: 'Piping & Mechanical',
    description: 'Fit-up 10" Dia Sch 40 Carbon Steel',
    unit: 'Joint',
    defaultOutputPerDay: 6.0,
    crewDailyRate: 450000,
    equipmentDailyRate: 75000,
    consumableUnitRate: 18000,
    notes: '1 Fitter + 2 Helper + chain block 2T',
    manpowerList: [
      { id: 'mp-1', name: 'Pipe Fitter Lead', qty: 1, unit: 'org', rate: 280000 },
      { id: 'mp-2', name: 'Fitter Helper', qty: 1, unit: 'org', rate: 170000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Mesin Gerinda Tangan 5"', qty: 1, unit: 'unit', rate: 45000 },
      { id: 'eq-2', name: 'Chain Block 2 Ton', qty: 1, unit: 'unit', rate: 30000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Batu Gerinda Potong & Asah', qty: 1.5, unit: 'pcs', rate: 8000 },
      { id: 'cs-2', name: 'Kawat Las Tack Weld', qty: 0.15, unit: 'kg', rate: 40000 }
    ]
  },
  {
    id: 'pipe-weld-2',
    category: 'Piping & Mechanical',
    description: 'Welding 2" Dia Sch 40 Carbon Steel (GTAW/SMAW)',
    unit: 'Joint',
    defaultOutputPerDay: 8.0,
    crewDailyRate: 520000,
    equipmentDailyRate: 120000,
    consumableUnitRate: 45000,
    notes: '1 Welder 6G + 1 Welder Helper',
    manpowerList: [
      { id: 'mp-1', name: 'Welder 6G Carbon Steel', qty: 1, unit: 'org', rate: 350000 },
      { id: 'mp-2', name: 'Welder Helper', qty: 1, unit: 'org', rate: 170000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Mesin Las Inverter Miller 400A', qty: 1, unit: 'unit', rate: 90000 },
      { id: 'eq-2', name: 'Oven Pemanas Elektroda (Quiver)', qty: 1, unit: 'unit', rate: 30000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Kawat Las LB-52 / E7018', qty: 0.8, unit: 'kg', rate: 40000 },
      { id: 'cs-2', name: 'Batu Gerinda Asah 4"', qty: 1, unit: 'pcs', rate: 13000 }
    ]
  },
  {
    id: 'pipe-weld-6',
    category: 'Piping & Mechanical',
    description: 'Welding 6" Dia Sch 40 Carbon Steel (GTAW/SMAW)',
    unit: 'Joint',
    defaultOutputPerDay: 3.0,
    crewDailyRate: 520000,
    equipmentDailyRate: 120000,
    consumableUnitRate: 45000,
    notes: '1 Welder 6G + 1 Welder Helper + mesin las Miller',
    manpowerList: [
      { id: 'mp-1', name: 'Welder 6G Carbon Steel', qty: 1, unit: 'org', rate: 350000 },
      { id: 'mp-2', name: 'Welder Helper', qty: 1, unit: 'org', rate: 170000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Mesin Las Inverter Miller 400A', qty: 1, unit: 'unit', rate: 90000 },
      { id: 'eq-2', name: 'Oven Pemanas Elektroda', qty: 1, unit: 'unit', rate: 30000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Kawat Las E7016 / E7018', qty: 1.5, unit: 'kg', rate: 22000 },
      { id: 'cs-2', name: 'Batu Gerinda Sikat Kawat', qty: 1, unit: 'pcs', rate: 12000 }
    ]
  },
  {
    id: 'pipe-weld-ss-2',
    category: 'Piping & Mechanical',
    description: 'Welding Stainless Steel 316L 2" Sch 10/40 (GTAW Full Tig)',
    unit: 'Joint',
    defaultOutputPerDay: 4.0,
    crewDailyRate: 650000,
    equipmentDailyRate: 150000,
    consumableUnitRate: 95000,
    notes: 'Welder Khusus SS + Gas Argon Purging',
    manpowerList: [
      { id: 'mp-1', name: 'Welder GTAW Stainless Steel Specialist', qty: 1, unit: 'org', rate: 450000 },
      { id: 'mp-2', name: 'Welder Helper SS', qty: 1, unit: 'org', rate: 200000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Mesin Las TIG High Frequency', qty: 1, unit: 'unit', rate: 110000 },
      { id: 'eq-2', name: 'Purging Dam Kit & Flowmeter', qty: 1, unit: 'set', rate: 40000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'TIG Rod ER-316L', qty: 0.5, unit: 'kg', rate: 90000 },
      { id: 'cs-2', name: 'Gas Argon Murni (HP)', qty: 1, unit: 'tabung vol', rate: 50000 }
    ]
  },
  {
    id: 'pipe-hydro',
    category: 'Piping & Mechanical',
    description: 'Hydrotest Package & Pressurization Spool (s/d 150 bar)',
    unit: 'Lot',
    defaultOutputPerDay: 0.5,
    crewDailyRate: 600000,
    equipmentDailyRate: 400000,
    consumableUnitRate: 250000,
    notes: 'Hydrotest pump 500 bar + test manifold + chart recorder',
    manpowerList: [
      { id: 'mp-1', name: 'Hydrotest Technician', qty: 1, unit: 'org', rate: 380000 },
      { id: 'mp-2', name: 'Testing Helper', qty: 1, unit: 'org', rate: 220000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'High Pressure Hydrotest Pump 500 Bar', qty: 1, unit: 'unit', rate: 250000 },
      { id: 'eq-2', name: 'Barton Chart Recorder & Test Manifold', qty: 1, unit: 'set', rate: 150000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Air Uji Bersih & Inhibitor Karat', qty: 1, unit: 'lot', rate: 180000 },
      { id: 'cs-2', name: 'Kertas Chart & Tinta Recorder + Gasket', qty: 1, unit: 'set', rate: 70000 }
    ]
  },

  // 2. TUBULAR & OCTG MAINTENANCE
  {
    id: 'octg-ext-clean',
    category: 'Tubular OCTG',
    description: 'Macaroni / Tubing External Cleaning & OD Buffing',
    unit: 'Joint',
    defaultOutputPerDay: 120.0,
    crewDailyRate: 380000,
    equipmentDailyRate: 180000,
    consumableUnitRate: 15000,
    notes: 'Rotary wire brush + cleaning agent',
    manpowerList: [
      { id: 'mp-1', name: 'Cleaning Operator', qty: 1, unit: 'org', rate: 220000 },
      { id: 'mp-2', name: 'Rigger / Pipe Handler', qty: 1, unit: 'org', rate: 160000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Pneumatic Wire Brush Cleaner Machine', qty: 1, unit: 'unit', rate: 120000 },
      { id: 'eq-2', name: 'Pipe Support Rack Roller', qty: 1, unit: 'set', rate: 60000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Circular Wire Wheel Brush 6"', qty: 0.1, unit: 'pcs', rate: 80000 },
      { id: 'cs-2', name: 'Industrial Degreaser Solvent', qty: 0.2, unit: 'liter', rate: 35000 }
    ]
  },
  {
    id: 'octg-int-clean',
    category: 'Tubular OCTG',
    description: 'Tubing Internal Cleaning (High Pressure Water Jetting 10k psi)',
    unit: 'Joint',
    defaultOutputPerDay: 90.0,
    crewDailyRate: 420000,
    equipmentDailyRate: 280000,
    consumableUnitRate: 22000,
    notes: 'HP Jetting unit + lance nozzle',
    manpowerList: [
      { id: 'mp-1', name: 'HP Jetting Operator', qty: 1, unit: 'org', rate: 250000 },
      { id: 'mp-2', name: 'Lance Guide Helper', qty: 1, unit: 'org', rate: 170000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'High Pressure Water Jetting Pump 10.000 PSI', qty: 1, unit: 'unit', rate: 200000 },
      { id: 'eq-2', name: 'Flexible High Pressure Lance Hose & Nozzle', qty: 1, unit: 'set', rate: 80000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Nozzle Tungsten Tip Wear', qty: 0.05, unit: 'pcs', rate: 240000 },
      { id: 'cs-2', name: 'Internal De-scaling Chemical Flushed', qty: 0.5, unit: 'liter', rate: 20000 }
    ]
  },
  {
    id: 'octg-full-blast',
    category: 'Tubular OCTG',
    description: 'Full Scope Blasting Sa 2.5 (External & Internal Tubular)',
    unit: 'Joint',
    defaultOutputPerDay: 45.0,
    crewDailyRate: 500000,
    equipmentDailyRate: 650000,
    consumableUnitRate: 65000,
    notes: 'Kompresor 375 CFM + garnet abrasive',
    manpowerList: [
      { id: 'mp-1', name: 'Tubular Blaster Lead', qty: 1, unit: 'org', rate: 300000 },
      { id: 'mp-2', name: 'Pot Tender & Helper', qty: 1, unit: 'org', rate: 200000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Air Compressor 375 CFM Diesel', qty: 1, unit: 'unit', rate: 450000 },
      { id: 'eq-2', name: 'Internal Pipe Blasting Tool (Hollo-Blast)', qty: 1, unit: 'set', rate: 200000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Pasir Garnet Mesh 30/60', qty: 8, unit: 'kg', rate: 6500 },
      { id: 'cs-2', name: 'BBM Solar Industri Genset/Kompresor', qty: 1, unit: 'liter', rate: 13000 }
    ]
  },

  // 3. BLASTING & PAINTING
  {
    id: 'bp-blast-sa25',
    category: 'Blasting & Painting',
    description: 'Grit Blasting Sa 2.5 (Plat, Struktur, & Spool Piping)',
    unit: 'm2',
    defaultOutputPerDay: 25.0,
    crewDailyRate: 570000,
    equipmentDailyRate: 1940000,
    consumableUnitRate: 157500,
    notes: 'Kru Blaster, Kompresor 750 CFM, Garnet mesh 30/60',
    manpowerList: [
      { id: 'mp-1', name: 'Blaster Bersertifikat', qty: 1, unit: 'org', rate: 320000 },
      { id: 'mp-2', name: 'Pot Tender / Helper Blasting', qty: 1, unit: 'org', rate: 250000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Kompresor Udara 750 CFM Portable', qty: 1, unit: 'unit', rate: 1500000 },
      { id: 'eq-2', name: 'Blast Pot 600 lbs + Air Dryer + Nozzle Venturi', qty: 1, unit: 'set', rate: 440000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Pasir Garnet Australia 30/60', qty: 22, unit: 'kg', rate: 6500 },
      { id: 'cs-2', name: 'BBM Solar Industri Alat Blasting', qty: 1, unit: 'liter', rate: 14500 }
    ]
  },
  {
    id: 'bp-paint-3coat',
    category: 'Blasting & Painting',
    description: 'Painting 3 Layers (Inorganic Zinc + Epoxy High Build + Polyurethane)',
    unit: 'm2',
    defaultOutputPerDay: 20.0,
    crewDailyRate: 400000,
    equipmentDailyRate: 220000,
    consumableUnitRate: 45000,
    notes: 'Airless spray pump + DFT Gauge test',
    manpowerList: [
      { id: 'mp-1', name: 'Spray Painter Bersertifikat', qty: 1, unit: 'org', rate: 230000 },
      { id: 'mp-2', name: 'Painter Helper / Mixer', qty: 1, unit: 'org', rate: 170000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Airless Spray Pump Graco 45:1', qty: 1, unit: 'unit', rate: 180000 },
      { id: 'eq-2', name: 'Elcometer DFT Gauge & Sling Hygrometer', qty: 1, unit: 'set', rate: 40000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Cat Epoxy Primer + Intermediate + Polyurethane', qty: 0.6, unit: 'liter', rate: 65000 },
      { id: 'cs-2', name: 'Thinner Epoxy & Masking Tape', qty: 0.2, unit: 'liter', rate: 30000 }
    ]
  },

  // 4. NDT (NON-DESTRUCTIVE TESTING)
  {
    id: 'ndt-mt-pt',
    category: 'NDT Testing',
    description: 'Magnetic Particle (MT) / Liquid Penetrant Testing (PT)',
    unit: 'Dia. Inch',
    defaultOutputPerDay: 48.0,
    crewDailyRate: 620000,
    equipmentDailyRate: 50000,
    consumableUnitRate: 8000,
    notes: 'NDT Inspector Level II + aerosol cleaner/penetrant/developer',
    manpowerList: [
      { id: 'mp-1', name: 'NDT Inspector Level II (ASNT-TC-1A)', qty: 1, unit: 'org', rate: 420000 },
      { id: 'mp-2', name: 'NDT Assistant', qty: 1, unit: 'org', rate: 200000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'AC/DC Magnetic Yoke Unit Parker', qty: 1, unit: 'unit', rate: 35000 },
      { id: 'eq-2', name: 'Lux Meter & Pie Gauge Test', qty: 1, unit: 'set', rate: 15000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Magnaflux Spray Cleaner & White Contrast', qty: 0.05, unit: 'can', rate: 85000 },
      { id: 'cs-2', name: 'Black Magnetic Ink Aerosol', qty: 0.05, unit: 'can', rate: 75000 }
    ]
  },

  // 5. HVAC & MAINTENANCE GEDUNG
  {
    id: 'hvac-ac-clean-1pk',
    category: 'HVAC & Maintenance',
    description: 'AC Routine Cleaning & Freon Top-up (1/2 - 1 PK)',
    unit: 'Unit',
    defaultOutputPerDay: 6.0,
    crewDailyRate: 350000,
    equipmentDailyRate: 50000,
    consumableUnitRate: 35000,
    notes: 'Teknisi AC + steam washer + R32/R410 gas',
    manpowerList: [
      { id: 'mp-1', name: 'Teknisi HVAC / AC', qty: 1, unit: 'org', rate: 220000 },
      { id: 'mp-2', name: 'Helper Teknisi', qty: 1, unit: 'org', rate: 130000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Steam Jet Washer Cleaning AC', qty: 1, unit: 'unit', rate: 35000 },
      { id: 'eq-2', name: 'Terpal Cuci AC + Tangga Lipat Aluminium', qty: 1, unit: 'set', rate: 15000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'Gas Refrigerant Freon R32 / R410A', qty: 0.2, unit: 'kg', rate: 120000 },
      { id: 'cs-2', name: 'Coil Cleaner Chemical & Desinfektan', qty: 0.25, unit: 'liter', rate: 44000 }
    ]
  },

  // 6. CREW MANDAYS & OPERASIONAL LAPANGAN
  {
    id: 'crew-transport-4wd',
    category: 'Crew Mandays',
    description: 'Land Transportation 4WD c/w Driver & Fuel',
    unit: 'unit days',
    defaultOutputPerDay: 1.0,
    crewDailyRate: 250000,
    equipmentDailyRate: 850000,
    consumableUnitRate: 150000,
    notes: 'Sewa mobil kabin tertutup 4WD + BBM operasional harian',
    manpowerList: [
      { id: 'mp-1', name: 'Dedicated Driver (Defensive Driving Certified)', qty: 1, unit: 'org', rate: 250000 }
    ],
    equipmentList: [
      { id: 'eq-1', name: 'Toyota Hilux / Triton 4WD Double Cabin c/w Rollbar', qty: 1, unit: 'unit', rate: 850000 }
    ],
    consumableList: [
      { id: 'cs-1', name: 'BBM Dexlite / Pertamina Dex Operasional', qty: 10, unit: 'liter', rate: 15000 }
    ]
  }
];
