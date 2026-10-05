import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Key, Eye, EyeOff, 
  Trash2, Edit3, Check, Copy, Search, Database, Code, 
  UserCheck, AlertCircle, X, RefreshCw, LogIn, CloudLightning
} from 'lucide-react';
import { 
  fetchUsersFromCloud, 
  saveUserToCloud, 
  deleteUserFromCloud 
} from '../utils/supabaseClient';

export type UserAuthorRole = 'Super Admin' | 'Estimator' | 'Admin' | 'Reviewer' | 'Viewer';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  password: string;
  authorRole: UserAuthorRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const USERS_STORAGE_KEY = 'industrial_tender_users_v2';

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-crv',
    username: 'CRV',
    fullName: 'Rovansyah Riza (CRV)',
    email: 'crv@tender.co.id',
    password: 'admin123',
    authorRole: 'Super Admin',
    isActive: true,
    createdAt: '2026-10-05',
    lastLogin: '2026-10-05'
  },
  {
    id: 'usr-0',
    username: 'superadmin',
    fullName: 'Master Super Administrator',
    email: 'superadmin@tender.co.id',
    password: 'MasterSuperAdmin2026!#',
    authorRole: 'Super Admin',
    isActive: true,
    createdAt: '2026-08-01',
    lastLogin: '2026-10-04'
  },
  {
    id: 'usr-1',
    username: 'ahmad_estimator',
    fullName: 'Ahmad Fauzi (Lead Estimator)',
    email: 'ahmad.fauzi@tender.co.id',
    password: 'EstimatorPass2026!',
    authorRole: 'Estimator',
    isActive: true,
    createdAt: '2026-09-15',
    lastLogin: '2026-10-04'
  },
  {
    id: 'usr-2',
    username: 'budi_lead',
    fullName: 'Budi Santoso',
    email: 'budi.santoso@tender.co.id',
    password: 'LeadReviewer#99',
    authorRole: 'Reviewer',
    isActive: true,
    createdAt: '2026-09-20',
    lastLogin: '2026-10-03'
  },
  {
    id: 'usr-3',
    username: 'siti_admin',
    fullName: 'Siti Rahmawati',
    email: 'siti.admin@tender.co.id',
    password: 'AdminSuperSec77!',
    authorRole: 'Admin',
    isActive: true,
    createdAt: '2026-08-10',
    lastLogin: '2026-10-04'
  },
  {
    id: 'usr-4',
    username: 'hendra_civil',
    fullName: 'Hendra Wijaya (Civil Estimator)',
    email: 'hendra.w@tender.co.id',
    password: 'CivilAuthor2026$',
    authorRole: 'Estimator',
    isActive: true,
    createdAt: '2026-09-28',
    lastLogin: '2026-10-02'
  },
  {
    id: 'usr-5',
    username: 'client_viewer',
    fullName: 'Client Partner Observer',
    email: 'observer@client.com',
    password: 'ViewOnlyPass123',
    authorRole: 'Viewer',
    isActive: true,
    createdAt: '2026-10-01',
    lastLogin: '2026-10-01'
  }
];

export const SQL_SCHEMA_SCRIPT = `-- ====================================================================
-- SCHEMA DATABASE TABEL USERS & ROLE PERMISSION
-- Kompatibel: PostgreSQL, Supabase, MySQL 8+, CockroachDB
-- ====================================================================

-- 1. Buat ENUM Role Pengguna (Termasuk Super Admin & Estimator)
CREATE TYPE user_author_role AS ENUM ('Super Admin', 'Estimator', 'Admin', 'Reviewer', 'Viewer');

-- 2. Buat Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Menyimpan hash bcrypt/argon2
    author_role user_author_role NOT NULL DEFAULT 'Estimator',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- 3. Index untuk pencarian cepat username dan email
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(author_role);

-- 4. Komentar Kolom untuk Dokumentasi Database
COMMENT ON TABLE users IS 'Tabel kredensial pengguna dan wewenang Super Admin, Estimator, Admin, Reviewer, Viewer';
COMMENT ON COLUMN users.password_hash IS 'Kata sandi terenkripsi (BCrypt / Argon2id)';
COMMENT ON COLUMN users.author_role IS 'Wewenang sistem: Super Admin (buka semua), Estimator (author & cloud connection), Admin, Reviewer, Viewer';

-- 5. Contoh Data Awal (Seed Data)
INSERT INTO users (username, full_name, email, password_hash, author_role, is_active)
VALUES 
    ('superadmin', 'Master Super Administrator', 'superadmin@tender.co.id', '$2a$12$z80yqVzH...superadmin_hash...', 'Super Admin', TRUE),
    ('ahmad_estimator', 'Ahmad Fauzi (Lead Estimator)', 'ahmad.fauzi@tender.co.id', '$2a$12$e80yqVzH...estimator_hash...', 'Estimator', TRUE),
    ('budi_lead', 'Budi Santoso', 'budi.santoso@tender.co.id', '$2a$12$K12x9vLa...reviewer_hash...', 'Reviewer', TRUE),
    ('siti_admin', 'Siti Rahmawati', 'siti.admin@tender.co.id', '$2a$12$W91sPqZo...admin_hash...', 'Admin', TRUE)
ON CONFLICT (username) DO NOTHING;
`;

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onSwitchUser?: (user: UserAccount) => void;
  onSelectActiveAuthor?: (authorName: string) => void;
  currentAuthor?: string;
  onOpenCloudModal?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  onSelectActiveAuthor,
  currentAuthor,
  onOpenCloudModal
}) => {
  // State users dari LocalStorage
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (err) {
        console.error("Gagal membaca users storage:", err);
      }
    }
    return DEFAULT_USERS;
  });

  // Tab aktif: 'table' | 'sql'
  const [activeTab, setActiveTab] = useState<'table' | 'sql'>('table');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Password visibility memory per row: { [userId]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Form Tambah / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserAuthorRole>('Estimator');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-Save ke LocalStorage
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Fetch data Users terbaru dari Cloud Supabase saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchUsersFromCloud().then(cloudUsers => {
      if (!isMounted) return;
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudUsers));
      }
    });
    return () => { isMounted = false; };
  }, [isOpen]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchQuery = 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === 'All' || user.authorRole === roleFilter;
      return matchQuery && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  if (!isOpen) return null;

  // Toggle Mask Password per Baris
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Salin Password ke Clipboard
  const handleCopyPassword = (userId: string, pass: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedId(userId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Salin SQL Schema
  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Buka Form Tambah User
  const handleOpenAddForm = () => {
    setEditingUserId(null);
    setFormUsername('');
    setFormFullName('');
    setFormEmail('');
    setFormPassword(generateRandomPassword());
    setFormRole('Estimator');
    setFormIsActive(true);
    setFormError(null);
    setFormShowPassword(true);
    setIsFormOpen(true);
  };

  // Buka Form Edit User
  const handleOpenEditForm = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormUsername(user.username);
    setFormFullName(user.fullName);
    setFormEmail(user.email);
    setFormPassword(user.password);
    setFormRole(user.authorRole);
    setFormIsActive(user.isActive);
    setFormError(null);
    setFormShowPassword(false);
    setIsFormOpen(true);
  };

  // Hapus User
  const handleDeleteUser = async (userId: string, username: string) => {
    if (confirm(`Yakin ingin menghapus user "${username}"? Data akan dihapus dari Cloud Supabase.`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      await deleteUserFromCloud(userId);
    }
  };

  // Reset ke Default Users
  const handleResetDefault = () => {
    if (confirm("Kembalikan daftar user ke preset default awal (termasuk Super Admin & Estimator)?")) {
      setUsers(DEFAULT_USERS);
    }
  };

  // Generator Password Acak Aman
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Submit Simpan User
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUsername = formUsername.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanUsername) {
      setFormError('Username tidak boleh kosong!');
      return;
    }

    if (!formFullName.trim()) {
      setFormError('Nama lengkap tidak boleh kosong!');
      return;
    }

    if (!formPassword.trim()) {
      setFormError('Password tidak boleh kosong!');
      return;
    }

    // Cek duplikasi username (kecuali user yang sedang diedit)
    const duplicate = users.find(u => u.username.toLowerCase() === cleanUsername && u.id !== editingUserId);
    if (duplicate) {
      setFormError(`Username "${cleanUsername}" sudah digunakan oleh user lain!`);
      return;
    }

    if (editingUserId) {
      // Update User
      const updatedUser: UserAccount = {
        id: editingUserId,
        username: cleanUsername,
        fullName: formFullName.trim(),
        email: formEmail.trim() || `${cleanUsername}@tender.co.id`,
        password: formPassword.trim(),
        authorRole: formRole,
        isActive: formIsActive,
        createdAt: users.find(u => u.id === editingUserId)?.createdAt || new Date().toISOString().split('T')[0]
      };
      setUsers(prev => prev.map(u => u.id === editingUserId ? updatedUser : u));
      saveUserToCloud(updatedUser);
    } else {
      // Tambah User Baru
      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        username: cleanUsername,
        fullName: formFullName.trim(),
        email: formEmail.trim() || `${cleanUsername}@tender.co.id`,
        password: formPassword.trim(),
        authorRole: formRole,
        isActive: formIsActive,
        createdAt: new Date().toISOString().split('T')[0],
        lastLogin: '-'
      };
      setUsers(prev => [newUser, ...prev]);
      saveUserToCloud(newUser);
    }

    setIsFormOpen(false);
  };

  const getRoleBadge = (role: UserAuthorRole) => {
    switch (role) {
      case 'Super Admin':
        return {
          bg: '#fdf4ff',
          text: '#86198f',
          border: '#f0abfc',
          label: '⚡ Super Admin (Bisa Buka Semua)',
          desc: 'Hak akses master tertinggi: bypass semua proteksi & kelola cloud connection'
        };
      case 'Estimator':
        return {
          bg: '#fef3c7',
          text: '#92400e',
          border: '#fde68a',
          label: '✍️ Estimator (Author & Cloud Sync)',
          desc: 'Author kalkulasi tender & memiliki hak akses eksklusif connection data cloud'
        };
      case 'Admin':
        return {
          bg: '#eff6ff',
          text: '#1e40af',
          border: '#bfdbfe',
          label: '👑 Admin',
          desc: 'Akses penuh sistem, master data & manajemen pengguna'
        };
      case 'Reviewer':
        return {
          bg: '#f3e8ff',
          text: '#6b21a8',
          border: '#e9d5ff',
          label: '🔍 Reviewer',
          desc: 'Pemeriksa penawaran & persetujuan margin tender'
        };
      case 'Viewer':
        return {
          bg: '#f1f5f9',
          text: '#475569',
          border: '#cbd5e1',
          label: '👁️ Viewer',
          desc: 'Hanya melihat BoQ & penawaran'
        };
    }
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
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '90vh',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
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
              <Users size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ffffff' }}>
                  Tabel Manajemen Pengguna & Hak Akses
                </h2>
                <span style={{ fontSize: '10px', background: '#38bdf8', color: '#0f172a', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  Super Admin Ready
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Role <strong>Super Admin</strong> dapat membuka semua modul, dan hak akses <strong>Connection Data Cloud</strong> dipegang oleh <strong>Estimator</strong>.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenCloudModal && (
              <button
                onClick={onOpenCloudModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#065f46',
                  color: '#6ee7b7',
                  border: '1px solid #059669',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                <CloudLightning size={14} />
                Koneksi Cloud
              </button>
            )}

            {/* Tab Selector */}
            <div style={{ display: 'flex', background: '#1e293b', borderRadius: '6px', padding: '3px', border: '1px solid #334155' }}>
              <button
                onClick={() => setActiveTab('table')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'table' ? '#2563eb' : 'transparent',
                  color: activeTab === 'table' ? '#ffffff' : '#94a3b8'
                }}
              >
                Tabel Pengguna ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('sql')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: activeTab === 'sql' ? '#2563eb' : 'transparent',
                  color: activeTab === 'sql' ? '#ffffff' : '#94a3b8'
                }}
              >
                <Code size={13} />
                Skrip SQL DDL
              </button>
            </div>

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
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ACTIVE USER SESSION BAR */}
        {currentUser && (
          <div style={{
            backgroundColor: currentUser.authorRole === 'Super Admin' ? '#fae8ff' : '#eff6ff',
            borderBottom: '1px solid #cbd5e1',
            padding: '8px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#475569' }}>Sesi Login Saat Ini:</span>
              <strong style={{ color: currentUser.authorRole === 'Super Admin' ? '#86198f' : '#1e40af' }}>
                {currentUser.fullName}
              </strong>
              <span style={{
                fontSize: '11px',
                padding: '1px 8px',
                borderRadius: '10px',
                fontWeight: 'bold',
                backgroundColor: currentUser.authorRole === 'Super Admin' ? '#86198f' : '#2563eb',
                color: '#ffffff'
              }}>
                {currentUser.authorRole}
              </span>
            </div>

            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {currentUser.authorRole === 'Super Admin' 
                ? '⚡ Memiliki akses penuh (bisa buka semua fitur & modul)' 
                : (currentUser.authorRole === 'Estimator' 
                  ? '✍️ Memegang hak akses resmi Connection Data Cloud' 
                  : 'Akses terbatas berdasarkan role')}
            </span>
          </div>
        )}

        {/* CONTENT TAB 1: TABEL USER */}
        {activeTab === 'table' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            
            {/* Toolbar Filter & Tambah */}
            <div style={{
              padding: '14px 24px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari username, nama, email..."
                    style={{
                      width: '100%',
                      padding: '7px 10px 7px 32px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Filter Role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
                  <span>Filter Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="All">Semua Role ({users.length})</option>
                    <option value="Super Admin">⚡ Super Admin</option>
                    <option value="Estimator">✍️ Estimator (Author)</option>
                    <option value="Admin">👑 Admin</option>
                    <option value="Reviewer">🔍 Reviewer</option>
                    <option value="Viewer">👁️ Viewer</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleResetDefault}
                  title="Reset user ke default"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 12px',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    color: '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} />
                  Reset Preset
                </button>

                <button
                  onClick={handleOpenAddForm}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <UserPlus size={15} />
                  + Tambah User Baru
                </button>
              </div>
            </div>

            {/* TABEL LIST USER */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '14px', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                    <th style={{ padding: '10px 12px', width: '40px' }}>No</th>
                    <th style={{ padding: '10px 12px' }}>Nama & Akun User</th>
                    <th style={{ padding: '10px 12px' }}>Email</th>
                    <th style={{ padding: '10px 12px', width: '220px' }}>Password</th>
                    <th style={{ padding: '10px 12px', width: '220px' }}>Role / Wewenang</th>
                    <th style={{ padding: '10px 12px', width: '85px' }}>Status</th>
                    <th style={{ padding: '10px 12px', width: '140px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada user yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, idx) => {
                      const isRevealed = !!visiblePasswords[user.id];
                      const badge = getRoleBadge(user.authorRole);
                      const isCurrentAuthor = currentAuthor && (currentAuthor.includes(user.fullName) || currentAuthor.includes(user.username));
                      const isCurrentSessionUser = currentUser?.id === user.id;

                      return (
                        <tr
                          key={user.id}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            backgroundColor: isCurrentSessionUser ? '#fdf4ff' : (isCurrentAuthor ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'))
                          }}
                        >
                          {/* No */}
                          <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                            {idx + 1}
                          </td>

                          {/* Nama & Username */}
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: user.authorRole === 'Super Admin' ? '#86198f' : (user.authorRole === 'Estimator' ? '#fbbf24' : '#38bdf8'),
                                color: '#ffffff',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {user.authorRole === 'Super Admin' ? '⚡' : user.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {user.fullName}
                                  {isCurrentSessionUser && (
                                    <span style={{ fontSize: '10px', background: '#86198f', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                                      Active Session
                                    </span>
                                  )}
                                  {isCurrentAuthor && !isCurrentSessionUser && (
                                    <span style={{ fontSize: '10px', background: '#2563eb', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                                      Tender Author
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td style={{ padding: '12px', color: '#475569', fontSize: '12px' }}>
                            {user.email}
                          </td>

                          {/* Kolom Password dengan Toggle Show/Hide & Copy */}
                          <td style={{ padding: '12px' }}>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '4px 8px'
                            }}>
                              <Key size={13} style={{ color: '#64748b' }} />
                              <span style={{
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                color: isRevealed ? '#0f172a' : '#64748b',
                                minWidth: '95px',
                                letterSpacing: isRevealed ? 'normal' : '2px',
                                fontWeight: isRevealed ? '600' : 'normal'
                              }}>
                                {isRevealed ? user.password : '••••••••••'}
                              </span>

                              <button
                                onClick={() => togglePasswordVisibility(user.id)}
                                title={isRevealed ? "Sembunyikan password" : "Tampilkan password"}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isRevealed ? '#2563eb' : '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex'
                                }}
                              >
                                {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>

                              <button
                                onClick={() => handleCopyPassword(user.id, user.password)}
                                title="Salin password"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: copiedId === user.id ? '#16a34a' : '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  display: 'flex'
                                }}
                              >
                                {copiedId === user.id ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </td>

                          {/* Kolom Role / Wewenang */}
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 9px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`
                            }}
                            title={badge.desc}
                            >
                              {badge.label}
                            </span>
                          </td>

                          {/* Status Aktif */}
                          <td style={{ padding: '12px' }}>
                            {user.isActive ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '11px', fontWeight: 'bold' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                                Aktif
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span>
                                Non-aktif
                              </span>
                            )}
                          </td>

                          {/* Aksi */}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                              
                              {/* Switch Active User Session */}
                              {onSwitchUser && (
                                <button
                                  onClick={() => onSwitchUser(user)}
                                  title={`Beralih login sebagai ${user.fullName} (${user.authorRole})`}
                                  style={{
                                    backgroundColor: isCurrentSessionUser ? '#86198f' : '#f8fafc',
                                    color: isCurrentSessionUser ? '#fff' : '#475569',
                                    border: isCurrentSessionUser ? '1px solid #86198f' : '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <LogIn size={13} />
                                </button>
                              )}

                              {/* Jadikan Author Tender */}
                              {onSelectActiveAuthor && (
                                <button
                                  onClick={() => onSelectActiveAuthor(user.fullName)}
                                  title={`Jadikan ${user.fullName} sebagai Author Tender aktif`}
                                  style={{
                                    backgroundColor: isCurrentAuthor ? '#22c55e' : '#f8fafc',
                                    color: isCurrentAuthor ? '#fff' : '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    padding: '4px 6px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                >
                                  <UserCheck size={13} />
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditForm(user)}
                                title="Edit user & password"
                                style={{
                                  backgroundColor: '#f8fafc',
                                  color: '#2563eb',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Edit3 size={13} />
                              </button>

                              <button
                                onClick={() => handleDeleteUser(user.id, user.username)}
                                title="Hapus user"
                                style={{
                                  backgroundColor: '#f8fafc',
                                  color: '#dc2626',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  padding: '4px 6px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div style={{
              padding: '12px 24px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#64748b'
            }}>
              <div>
                Total Pengguna: <strong style={{ color: '#0f172a' }}>{users.length} User</strong> | 
                Super Admin: <strong style={{ color: '#86198f' }}>{users.filter(u => u.authorRole === 'Super Admin').length}</strong> | 
                Estimator (Author): <strong style={{ color: '#b45309' }}>{users.filter(u => u.authorRole === 'Estimator').length}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px' }}>Koneksi Cloud dipegang oleh Estimator & Super Admin</span>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT TAB 2: SKRIP SQL DDL */}
        {activeTab === 'sql' && (
          <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', backgroundColor: '#0f172a', color: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={15} />
                  Skrip DDL Database SQL (PostgreSQL, Supabase, MySQL)
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Mencakup ENUM role (Super Admin, Estimator, Admin, Reviewer, Viewer) dan seed akun awal.
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
                {copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Semua SQL'}
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
              color: '#cbd5e1',
              overflowX: 'auto',
              whiteSpace: 'pre'
            }}>
              {SQL_SCHEMA_SCRIPT}
            </pre>
          </div>
        )}

      </div>

      {/* MODAL POPUP FORM TAMBAH / EDIT USER */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <form
            onSubmit={handleSaveUser}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Header Form */}
            <div style={{
              backgroundColor: '#1e293b',
              padding: '14px 20px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={17} style={{ color: '#fbbf24' }} />
                {editingUserId ? 'Edit Akun Pengguna & Wewenang' : 'Buat Akun Pengguna Baru'}
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body Form */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
              {formError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#b91c1c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi (Estimator)"
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Username:
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="ahmad_estimator"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Email:
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ahmad@tender.co.id"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Password Field dengan Generate Button & Show/Hide */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>
                    Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPassword(generateRandomPassword())}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                  >
                    🎲 Buat Password Acak
                  </button>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <input
                    type={formShowPassword ? 'text' : 'password'}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    style={{
                      width: '100%',
                      padding: '7px 36px 7px 10px',
                      border: '1.5px solid #2563eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontFamily: formShowPassword ? 'monospace' : 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormShowPassword(!formShowPassword)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex'
                    }}
                  >
                    {formShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Role Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>
                  Hak Akses & Peran (Role):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'Super Admin', label: '⚡ Super Admin', desc: 'Bisa buka semua & master override' },
                    { key: 'Estimator', label: '✍️ Estimator (Author)', desc: 'Kalkulasi tender & hak connection cloud' },
                    { key: 'Admin', label: '👑 Admin', desc: 'Akses penuh data & katalog' },
                    { key: 'Reviewer', label: '🔍 Reviewer', desc: 'Pemeriksa margin tender' },
                    { key: 'Viewer', label: '👁️ Viewer', desc: 'Hanya melihat data' }
                  ].map(r => {
                    const isSelected = formRole === r.key;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setFormRole(r.key as UserAuthorRole)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                          color: isSelected ? '#1e40af' : '#475569',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{r.label}</div>
                        <div style={{ fontSize: '10px', color: isSelected ? '#3b82f6' : '#94a3b8' }}>{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="userStatusCheckbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="userStatusCheckbox" style={{ fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  Akun Aktif (Bisa login & menggunakan wewenang role)
                </label>
              </div>
            </div>

            {/* Footer Form */}
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{
                  padding: '7px 14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{
                  padding: '7px 18px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
              >
                Simpan User
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

