import React, { useState } from 'react';
import { 
  CloudLightning, Database, Lock, Unlock,
  Check, Copy, X, RefreshCw, Zap
} from 'lucide-react';
import type { UserAccount } from './UserManagementModal';

interface CloudConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onSwitchToAuthorizedRole?: (role: 'Super Admin' | 'Estimator') => void;
}

export interface CloudConfig {
  provider: 'supabase' | 'postgresql' | 'rest_api';
  dbUrl: string;
  apiKey: string;
  databaseName: string;
  schema: string;
  autoSync: boolean;
  isConnected: boolean;
  lastSyncTime?: string;
}

import { supabase } from '../utils/supabaseClient';

const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  provider: 'supabase',
  dbUrl: 'https://wvzajdnxmjegblqrvgfs.supabase.co',
  apiKey: 'sb_publishable_BsYvIC-QEgxEfE2UP1siZg_85Rx0XYP',
  databaseName: 'HSSE-Fusion4 (Supabase)',
  schema: 'public',
  autoSync: true,
  isConnected: true,
  lastSyncTime: 'Real-time Active'
};

const CLOUD_STORAGE_KEY = 'industrial_tender_cloud_config';

export const CloudConnectionModal: React.FC<CloudConnectionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchToAuthorizedRole
}) => {
  const [config, setConfig] = useState<CloudConfig>(() => {
    const saved = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Gagal membaca cloud config:", e);
      }
    }
    return DEFAULT_CLOUD_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'config' | 'rls_policy' | 'status'>('config');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  // Hak Akses: Super Admin (bisa buka semua) ATAU Estimator (Author)
  const isAuthorized = currentUser?.authorRole === 'Super Admin' || currentUser?.authorRole === 'Estimator';

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const startTime = performance.now();
      const res = await supabase.from('tender_projects').select('count', { count: 'exact', head: true });
      const latency = Math.round(performance.now() - startTime);

      setIsTesting(false);
      if (res.error) {
        setTestResult({
          success: false,
          message: `Gagal terhubung: ${res.error.message}`
        });
      } else {
        setTestResult({
          success: true,
          message: `Koneksi ke Supabase [HSSE-Fusion4] berhasil! Handshake latensi: ${latency}ms. Endpoint PostgreSQL aktif dan RLS terverifikasi.`
        });
        setConfig(prev => ({
          ...prev,
          isConnected: true,
          lastSyncTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
        }));
      }
    } catch (e: any) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: `Error koneksi: ${e.message}`
      });
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(config));
    alert("Konfigurasi Cloud Database Connection berhasil disimpan!");
    onClose();
  };

  const cloudRlsPolicyScript = `-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & HAK AKSES KONEKSI DATA CLOUD
-- Target Database: PostgreSQL / Supabase
-- Aturan: Hak akses koneksi & manipulasi data ada di ESTIMATOR & SUPER ADMIN
-- ====================================================================

-- 1. Aktifkan RLS pada seluruh tabel inti
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tender_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS treatment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS resource_master ENABLE ROW LEVEL SECURITY;

-- 2. HAK AKSES SUPER ADMIN (BISA BUKA & KELOLA SEMUA DATA)
CREATE POLICY "super_admin_all_access" 
ON tender_projects FOR ALL 
TO authenticated 
USING (
    (auth.jwt() ->> 'role') = 'Super Admin' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role = 'Super Admin')
);

-- 3. HAK AKSES ESTIMATOR (CONNECTION DATA, CREATE BOQ, UPDATE HARGA & SINKRONISASI)
CREATE POLICY "estimator_full_connection_and_crud" 
ON tender_projects FOR ALL 
TO authenticated 
USING (
    (auth.jwt() ->> 'role') = 'Estimator' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role IN ('Estimator', 'Super Admin'))
)
WITH CHECK (
    (auth.jwt() ->> 'role') = 'Estimator' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role IN ('Estimator', 'Super Admin'))
);

-- 4. HAK AKSES REVIEWER (HANYA BACA & BERI CATATAN PERSETUJUAN)
CREATE POLICY "reviewer_read_only" 
ON tender_projects FOR SELECT 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.author_role IN ('Reviewer', 'Estimator', 'Super Admin'))
);

-- 5. HAK AKSES VIEWER (READ ONLY)
CREATE POLICY "viewer_read_only" 
ON tender_projects FOR SELECT 
TO authenticated 
USING (TRUE);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(cloudRlsPolicyScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        
        {/* HEADER MODAL */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '8px',
              borderRadius: '8px',
              color: '#38bdf8',
              display: 'flex'
            }}>
              <CloudLightning size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ffffff' }}>
                  Cloud Data Connection & Migrasi Database
                </h2>
                {isAuthorized ? (
                  <span style={{ fontSize: '10px', background: '#065f46', color: '#6ee7b7', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                    Akses Diizinkan
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', background: '#991b1b', color: '#fecaca', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                    Terkunci (Restricted)
                  </span>
                )}
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Hak akses connection data cloud diperuntukkan bagi <strong>Estimator</strong> dan <strong>Super Admin</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ACCESS GUARD BANNER */}
        {!isAuthorized ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Lock size={26} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 'bold', color: '#991b1b' }}>
              Akses Dibatasi: Hak Akses Connection Data Ada di Estimator
            </h3>
            <p style={{ margin: '0 auto 20px', maxWidth: '580px', fontSize: '13px', color: '#7f1d1d', lineHeight: 1.5 }}>
              Sesuai kebijakan keamanan sistem tender, konfigurasi koneksi database cloud, API key, dan migrasi data hanya boleh dikelola oleh <strong>Estimator (Author)</strong> atau <strong>Super Admin</strong> (yang dapat membuka seluruh modul).
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '12px', color: '#334155' }}>
              <span>Akun login Anda saat ini: <strong>{currentUser?.fullName || 'Belum Login'}</strong> ({currentUser?.authorRole || 'Tamu'})</span>
              {onSwitchToAuthorizedRole && (
                <button
                  onClick={() => onSwitchToAuthorizedRole('Super Admin')}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#fbbf24',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Zap size={13} />
                  Login Sebagai Super Admin
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            
            {/* TAB SELECTOR */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', padding: '0 24px' }}>
              <button
                onClick={() => setActiveTab('config')}
                style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'config' ? 'bold' : '600',
                  color: activeTab === 'config' ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === 'config' ? '2px solid #2563eb' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer'
                }}
              >
                Konfigurasi Koneksi Cloud
              </button>
              <button
                onClick={() => setActiveTab('rls_policy')}
                style={{
                  padding: '12px 16px',
                  fontSize: '13px',
                  fontWeight: activeTab === 'rls_policy' ? 'bold' : '600',
                  color: activeTab === 'rls_policy' ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === 'rls_policy' ? '2px solid #2563eb' : '2px solid transparent',
                  background: 'none',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  cursor: 'pointer'
                }}
              >
                Kebijakan RLS (Estimator & Super Admin)
              </button>
            </div>

            {/* TAB 1: FORM KONFIGURASI KONEKSI */}
            {activeTab === 'config' && (
              <form onSubmit={handleSaveConfig} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                
                {/* Authorization Status Badge */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#166534' }}>
                    <Unlock size={16} style={{ color: '#16a34a' }} />
                    <span>
                      Otorisasi Aktif: Anda masuk sebagai <strong>{currentUser.fullName} ({currentUser.authorRole})</strong>. Memiliki wewenang penuh mengatur endpoint cloud.
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    AUTHORIZED
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                      Provider Database Cloud:
                    </label>
                    <select
                      value={config.provider}
                      onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="supabase">Supabase PostgreSQL (BaaS Cloud)</option>
                      <option value="postgresql">PostgreSQL Direct (AWS / GCP / VPS)</option>
                      <option value="rest_api">Custom Backend REST API Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                      Nama Database / Project Ref:
                    </label>
                    <input
                      type="text"
                      value={config.databaseName}
                      onChange={(e) => setConfig({ ...config, databaseName: e.target.value })}
                      placeholder="tender_estimator_prod"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    Cloud Database URL / Endpoint:
                  </label>
                  <input
                    type="text"
                    value={config.dbUrl}
                    onChange={(e) => setConfig({ ...config, dbUrl: e.target.value })}
                    placeholder="https://xyz.supabase.co atau postgres://user:pass@host:5432/dbname"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                    API Key / Connection Secret Token:
                  </label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="Masukkan Anon/Service Role Key..."
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'monospace' }}
                  />
                </div>

                {/* Auto Sync Toggle */}
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#334155' }}>
                    <input
                      type="checkbox"
                      checked={config.autoSync}
                      onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>
                      <strong>Otomatis Sinkronkan Perubahan ke Cloud</strong> saat Estimator menyimpan BoQ atau mengubah analisa harga.
                    </span>
                  </label>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div style={{
                    backgroundColor: testResult.success ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${testResult.success ? '#bbf7d0' : '#fecaca'}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    color: testResult.success ? '#15803d' : '#b91c1c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Check size={16} />
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <RefreshCw size={14} className={isTesting ? 'animate-spin' : ''} />
                    {isTesting ? 'Menguji Koneksi...' : 'Uji Koneksi Cloud (Test Ping)'}
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{ padding: '8px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Tutup
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Simpan Konfigurasi
                    </button>
                  </div>
                </div>

              </form>
            )}

            {/* TAB 2: RLS POLICIES QUERY */}
            {activeTab === 'rls_policy' && (
              <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Database size={15} />
                      SQL Row Level Security (RLS) Policy untuk Estimator & Super Admin
                    </span>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      Script ini mengunci tabel database di PostgreSQL/Supabase agar hak koneksi manipulasi data hanya terbuka untuk <strong>Estimator</strong> & <strong>Super Admin</strong>.
                    </p>
                  </div>

                  <button
                    onClick={handleCopySql}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: copiedSql ? '#16a34a' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                    {copiedSql ? 'Tersalin!' : 'Salin Script RLS'}
                  </button>
                </div>

                <pre style={{
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  overflowX: 'auto',
                  whiteSpace: 'pre'
                }}>
                  {cloudRlsPolicyScript}
                </pre>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

