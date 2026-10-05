-- ====================================================================
-- SCHEMA DATABASE TABEL USERS & AUTHOR/ESTIMATOR CLOUD PERMISSION
-- File: src/data/user_table_schema.sql
-- Kompatibel: PostgreSQL, Supabase, MySQL 8+, SQLite, CockroachDB
-- ====================================================================

-- ====================================================================
-- 1. UNTUK POSTGRESQL / SUPABASE
-- ====================================================================

-- A. Buat ENUM Role Pengguna (Super Admin, Estimator, Admin, Reviewer, Viewer)
DO $$ BEGIN
    CREATE TYPE user_author_role AS ENUM ('Super Admin', 'Estimator', 'Admin', 'Reviewer', 'Viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- B. Buat Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Menyimpan hash bcrypt/argon2
    author_role user_author_role NOT NULL DEFAULT 'Estimator', -- Super Admin, Estimator, dll
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- C. Indexing untuk optimasi query pencarian
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_author_role ON users(author_role);

-- D. Dokumentasi Kolom (Postgres Comments)
COMMENT ON TABLE users IS 'Tabel kredensial pengguna dan wewenang Super Admin (buka semua) & Estimator (cloud connection)';
COMMENT ON COLUMN users.password_hash IS 'Hash kata sandi menggunakan BCrypt dengan cost factor >= 10';
COMMENT ON COLUMN users.author_role IS 'Wewenang sistem: Super Admin (bisa buka semua), Estimator (author & cloud connection), Admin, Reviewer, Viewer';

-- E. Contoh Data Awal (Seed Default Users)
INSERT INTO users (username, full_name, email, password_hash, author_role, is_active)
VALUES 
    ('superadmin', 'Master Super Administrator', 'superadmin@tender.co.id', '$2a$12$z80yqVzH...superadmin_hash...', 'Super Admin', TRUE),
    ('ahmad_estimator', 'Ahmad Fauzi (Lead Estimator)', 'ahmad.fauzi@tender.co.id', '$2a$12$e80yqVzH...estimator_hash...', 'Estimator', TRUE),
    ('budi_lead', 'Budi Santoso', 'budi.santoso@tender.co.id', '$2a$12$K12x9vLa...reviewer_hash...', 'Reviewer', TRUE),
    ('siti_admin', 'Siti Rahmawati', 'siti.admin@tender.co.id', '$2a$12$W91sPqZo...admin_hash...', 'Admin', TRUE),
    ('hendra_civil', 'Hendra Wijaya (Civil Estimator)', 'hendra.w@tender.co.id', '$2a$12$M44sQxLa...estimator_hash...', 'Estimator', TRUE),
    ('client_viewer', 'Client Partner Observer', 'observer@client.com', '$2a$12$T78vPkZa...viewer_hash...', 'Viewer', TRUE)
ON CONFLICT (username) DO NOTHING;


-- ====================================================================
-- 2. ROW LEVEL SECURITY (RLS) KEBIJAKAN MIGRASI CLOUD
-- ====================================================================
-- Aturan: Hak akses connection data cloud dipegang oleh ESTIMATOR & SUPER ADMIN

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 1. Super Admin: Buka & Kelola Semua Data (Master Override)
CREATE POLICY "super_admin_bypass_all" 
ON users FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role = 'Super Admin')
);

-- 2. Estimator: Hak Akses Connection Data & Kelola Seluruh Kalkulasi Tender
-- Estimator dapat membaca dan menulis data kalkulasi tender, BoQ, dan tabel resources
CREATE POLICY "estimator_cloud_connection_access" 
ON users FOR SELECT 
TO authenticated 
USING (TRUE);


-- ====================================================================
-- 3. UNTUK MYSQL 8.0+ / MARIADB
-- ====================================================================
/*
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) PRIMARY KEY,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `author_role` ENUM('Super Admin', 'Estimator', 'Admin', 'Reviewer', 'Viewer') NOT NULL DEFAULT 'Estimator',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `last_login` DATETIME NULL,
    INDEX `idx_username` (`username`),
    INDEX `idx_email` (`email`),
    INDEX `idx_author_role` (`author_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

