-- ====================================================================
-- SCHEMA DATABASE TABEL OVERHEAD (INDIRECT COST) & COMMERCIAL BID SUMMARY
-- Target Database: PostgreSQL / Supabase / CockroachDB
-- Relasi: Terhubung ke tabel tender_projects
-- Hak Akses: ESTIMATOR (Author) & SUPER ADMIN (Full Control)
-- ====================================================================

-- 1. Buat ENUM Kategori Overhead
CREATE TYPE overhead_category_enum AS ENUM (
    'Manajemen & Pengawasan',
    'Fasilitas & Utilitas Lapangan',
    'HSE & Keselamatan Kerja',
    'Mobilisasi & Akomodasi',
    'Asuransi, Legal & Jaminan',
    'Testing & Inspeksi Pihak Ketiga',
    'Head Office Support (G&A)'
);

-- 2. Tabel Rincian Item Overhead (Indirect Cost) Proyek
CREATE TABLE IF NOT EXISTS tender_overheads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id VARCHAR(50) NOT NULL REFERENCES tender_projects(id) ON DELETE CASCADE,
    category overhead_category_enum NOT NULL DEFAULT 'Manajemen & Pengawasan',
    name VARCHAR(255) NOT NULL,
    qty NUMERIC(14, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(30) NOT NULL DEFAULT 'Bulan',
    unit_rate NUMERIC(16, 2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(16, 2) GENERATED ALWAYS AS (qty * unit_rate) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk performa query
CREATE INDEX idx_overhead_tender_id ON tender_overheads(tender_id);
CREATE INDEX idx_overhead_category ON tender_overheads(category);

-- 3. Tabel Konfigurasi Rekapitulasi Komersial (Markup, Margin & Pajak)
CREATE TABLE IF NOT EXISTS tender_commercial_configs (
    tender_id VARCHAR(50) PRIMARY KEY REFERENCES tender_projects(id) ON DELETE CASCADE,
    contingency_percent NUMERIC(5, 2) NOT NULL DEFAULT 3.00,  -- Cadangan Risiko Kontinjensi
    profit_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.00, -- Margin Keuntungan Perusahaan
    tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 11.00,        -- PPN (11% atau 12%)
    include_tax_in_bid BOOLEAN NOT NULL DEFAULT TRUE,        -- Sertakan PPN pada penawaran resmi
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE tender_overheads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_commercial_configs ENABLE ROW LEVEL SECURITY;

-- 5. Kebijakan RLS: Super Admin (Bisa Akses Semua)
CREATE POLICY "super_admin_manage_overhead"
ON tender_overheads FOR ALL TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'Super Admin' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role = 'Super Admin')
);

CREATE POLICY "super_admin_manage_commercial"
ON tender_commercial_configs FOR ALL TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'Super Admin' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role = 'Super Admin')
);

-- 6. Kebijakan RLS: Estimator (CRUD Overhead & Margin Penawaran)
CREATE POLICY "estimator_manage_overhead"
ON tender_overheads FOR ALL TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'Estimator' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role = 'Estimator')
);

CREATE POLICY "estimator_manage_commercial"
ON tender_commercial_configs FOR ALL TO authenticated
USING (
    (auth.jwt() ->> 'role') = 'Estimator' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role = 'Estimator')
);

-- 7. Kebijakan RLS: Viewer & Reviewer (Read Only / SELECT Saja)
CREATE POLICY "viewer_reviewer_read_overhead"
ON tender_overheads FOR SELECT TO authenticated
USING (TRUE);

CREATE POLICY "viewer_reviewer_read_commercial"
ON tender_commercial_configs FOR SELECT TO authenticated
USING (TRUE);
