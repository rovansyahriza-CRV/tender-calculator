import React, { useState, useEffect, useMemo } from 'react';
import { ImportExcelModal } from './components/ImportExcelModal';
import { TreatmentCatalogDrawer } from './components/TreatmentCatalogDrawer';
import { ResourceBreakdownModal } from './components/ResourceBreakdownModal';
import { UserManagementModal, DEFAULT_USERS } from './components/UserManagementModal';
import type { UserAccount } from './components/UserManagementModal';
import { CloudConnectionModal } from './components/CloudConnectionModal';
import { LoginModal } from './components/LoginModal';
import { OverheadModal } from './components/OverheadModal';
import type { OverheadItem, CommercialSummaryConfig } from './components/OverheadModal';
import type { ImportedBoQRow } from './utils/tenderImporter';
import { exportTenderToExcel } from './utils/tenderExporter';
import { syncTreatmentResourcesToMaster } from './utils/masterDataManager';
import { 
  fetchTendersFromCloud, 
  saveTenderToCloud, 
  deleteTenderFromCloud 
} from './utils/supabaseClient';
import { 
  FileUp, Trash2, FolderPlus, Briefcase, ChevronDown, ChevronRight, 
  Save, Download, Plus, Wrench, Sliders, CheckCircle, Users, CloudLightning,
  ShieldCheck, Eye, LogOut, Lock, Building, Search, X, Filter, LogIn, FileSpreadsheet
} from 'lucide-react';
import fusionFourLogo from './assets/logo-fusion-four.png';

export interface ResourceDetailItem {
  id: string;
  name: string;           // Nama pekerja / spesifikasi alat / nama material
  qty: number;            // Kuantitas (org, unit, kg, dll)
  unit: string;           // Satuan (org, unit, kg, can, set, liter)
  rate: number;           // Biaya satuan total (IDR)

  // Variabel Turunan Tenaga Kerja (Manpower variables)
  basicSalary?: number;       // Gaji pokok harian (Rp)
  ppeDaily?: number;          // APD / PPE harian (helm, sepatu, wearpack, dll) (Rp)
  jamsostekDaily?: number;    // BPJS Ketenagakerjaan / Jamsostek & Kesehatan (Rp)
  mealsDaily?: number;        // Uang makan & akomodasi / mess harian (Rp)
  otherAllowanceDaily?: number; // Tunjangan keahlian / insentif / sertifikasi (Rp)

  // Variabel Turunan Peralatan (Equipment variables)
  baseRentalRate?: number;    // Sewa unit dasar harian (Dry rate) (Rp)
  fuelType?: string;          // Jenis BBM ('Solar' | 'Bensin' | 'Listrik' | 'None')
  fuelLitersPerDay?: number;  // Konsumsi BBM liter/hari
  fuelPricePerLiter?: number; // Harga BBM per liter (Rp)
  bbmRate?: number;           // Total biaya BBM harian (Rp)
  maintenanceRate?: number;   // Oli, pelumas, sparepart harian (Rp)
  mobilizationDaily?: number; // Amortisasi mob/demob harian (Rp)
}

export interface TreatmentItem {
  id: string;
  category: string;
  description: string;
  qty: number;
  unit: string;
  outputPerDay: number;
  crewDailyRate: number;
  equipmentDailyRate: number;
  materialUnitRate?: number;
  consumableUnitRate: number;
  // Turunan detail breakdown resources:
  manpowerList?: ResourceDetailItem[];
  equipmentList?: ResourceDetailItem[];
  materialList?: ResourceDetailItem[];
  consumableList?: ResourceDetailItem[];
}

export interface BoQItem {
  id: string;
  rawLineId?: string; // Unique Key / Line ID dari Excel untuk lookup akurat
  itemNo: string;
  description: string;
  qty: number;
  unit: string;
  outputPerDay?: number; // Target output harian (pembagi daily spread untuk menentukan unit price)
  treatments: TreatmentItem[];
  isCategory?: boolean;
  // Metadata Piping MTO & Engineering BoQ
  pipeClass?: string;
  size?: string;
  materialSpec?: string;
  inchDia?: number;
}

export interface TenderProject {
  id: string;
  tenderNo?: string;
  title: string;
  client: string;
  author?: string;
  createdAt: string;
  boqList: BoQItem[];
  overheadItems?: OverheadItem[];
  commercialConfig?: CommercialSummaryConfig;
}

const STORAGE_KEY = 'industrial_tender_estimator_data';

export const EMPTY_TENDER: TenderProject = {
  id: '',
  title: 'Belum Ada Tender Terbuka',
  client: '-',
  author: 'Belum Dipilih',
  createdAt: '',
  boqList: []
};

export default function App() {
  // Cloud Database Sync Status
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string>('');

  // 1. Inisialisasi dari LocalStorage (Auto-Load)
  const [tenders, setTenders] = useState<TenderProject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Gagal membaca storage lokal:", err);
      }
    }
    return [
      {
        id: 'tender-poma-01',
        tenderNo: 'TDR-POMA-001',
        title: 'POMA GENERAL SERVICES',
        client: 'POMA Operations',
        author: 'Ahmad Fauzi (Estimator)',
        createdAt: '2026-10-03',
        boqList: []
      }
    ];
  });

  // Default Tender Aktif: Kosong string ('') saat login / logout hingga user memilih tender
  const [activeTenderId, setActiveTenderId] = useState<string>('');

  // Modal State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isNewTenderModalOpen, setIsNewTenderModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isOverheadModalOpen, setIsOverheadModalOpen] = useState(false);
  const [newTenderTitle, setNewTenderTitle] = useState('');
  const [newTenderClient, setNewTenderClient] = useState('');
  const [newTenderAuthor, setNewTenderAuthor] = useState('');

  // Active Session User (Default: null jika log out / belum ada sesi)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('industrial_tender_active_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Gagal membaca session user:", e);
      }
    }
    return null; // Tidak ada sesi = belum login
  });

  // Modal Login Otomatis saat Buka Aplikasi (jika belum ada sesi tersimpan)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(() => {
    return !localStorage.getItem('industrial_tender_active_session_user');
  });

  // Search & Filter BoQ List
  const [boqSearchQuery, setBoqSearchQuery] = useState('');
  const [boqCategoryFilter, setBoqCategoryFilter] = useState('All');

  const handleLogout = () => {
    localStorage.removeItem('industrial_tender_active_session_user');
    setCurrentUser(null);
    setActiveTenderId(''); // Default tender kosong saat logout
    setIsLoginModalOpen(true);
    setBoqSearchQuery('');
    setBoqCategoryFilter('All');
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('industrial_tender_active_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('industrial_tender_active_session_user');
    }
  }, [currentUser]);

  // Accordion State
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Drawer Base Treatment State
  const [targetBoqForDrawer, setTargetBoqForDrawer] = useState<BoQItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal Breakdown Detail Resources State
  const [activeTreatmentForModal, setActiveTreatmentForModal] = useState<{ boqId: string; treatment: TreatmentItem; boqQty: number; boqUnit: string; boqOutputPerDay?: number } | null>(null);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);

  // Notification Banner for Resource Synchronization
  const [syncNotification, setSyncNotification] = useState<{ message: string; count: number } | null>(null);

  useEffect(() => {
    if (syncNotification) {
      const timer = setTimeout(() => setSyncNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [syncNotification]);

  // 2. Inisialisasi Sinkronisasi Cloud Supabase saat Pertama Kali Mount
  useEffect(() => {
    let isMounted = true;
    const initCloudTenders = async () => {
      setCloudStatus('syncing');
      try {
        const cloudData = await fetchTendersFromCloud();
        if (!isMounted) return;

        if (cloudData && cloudData.length > 0) {
          setTenders(cloudData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
          setCloudStatus('connected');
          setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        } else if (cloudData && cloudData.length === 0) {
          // Cloud Supabase kosong, upload tender yang tersimpan di lokal agar tidak hilang
          const localSaved = localStorage.getItem(STORAGE_KEY);
          const initialToUpload: TenderProject[] = localSaved ? JSON.parse(localSaved) : tenders;
          if (initialToUpload && initialToUpload.length > 0) {
            for (const t of initialToUpload) {
              await saveTenderToCloud(t);
            }
          }
          setCloudStatus('connected');
          setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setCloudStatus('offline');
        }
      } catch (err) {
        console.warn('Supabase initial fetch offline fallback:', err);
        if (isMounted) setCloudStatus('offline');
      }
    };

    initCloudTenders();
    return () => { isMounted = false; };
  }, []);

  // 3. Auto-Save Setiap Kali State `tenders` Berubah (Lokal & Supabase Cloud)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tenders));

    // Debounced Cloud Auto-Sync untuk active tender
    if (activeTender && activeTender.id) {
      setCloudStatus('syncing');
      const timer = setTimeout(async () => {
        try {
          const success = await saveTenderToCloud(activeTender);
          if (success) {
            setCloudStatus('connected');
            setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
          } else {
            setCloudStatus('offline');
          }
        } catch {
          setCloudStatus('offline');
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [tenders, activeTenderId]);

  // Active Tender: JIKA LOG OUT / BELUM LOGIN / BELUM PILIH TENDER, DEFAULT TENDER KOSONG
  const activeTender: TenderProject = (currentUser && activeTenderId)
    ? (tenders.find(t => t.id === activeTenderId) || EMPTY_TENDER)
    : EMPTY_TENDER;

  const toggleAccordion = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenTreatmentDrawer = (boq: BoQItem) => {
    setTargetBoqForDrawer(boq);
    setIsDrawerOpen(true);
  };

  const handleOpenTreatmentBreakdownModal = (boqId: string, treatment: TreatmentItem, boqQty: number, boqUnit: string, boqOutputPerDay: number = 1) => {
    setActiveTreatmentForModal({ boqId, treatment, boqQty, boqUnit, boqOutputPerDay });
    setIsTreatmentModalOpen(true);
  };

  const handleSaveTreatmentBreakdown = (
    updated: TreatmentItem,
    syncOptions?: { syncToAllItems: boolean; syncToMaster: boolean }
  ) => {
    if (!activeTreatmentForModal) return;

    let affectedTreatmentsCount = 0;
    const affectedResourceNames: string[] = [];

    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            return {
              ...b,
              treatments: b.treatments.map(tr => {
                // 1. Treatment yang sedang diedit langsung diperbarui
                if (tr.id === updated.id) {
                  return updated;
                }

                // 2. Jika opsi sinkronisasi aktif, cari dan update seluruh resource sejenis di treatment lain
                if (syncOptions?.syncToAllItems) {
                  let isTrModified = false;

                  // Sync Tenaga Kerja (Manpower)
                  let newManpower = tr.manpowerList;
                  if (newManpower && updated.manpowerList) {
                    newManpower = newManpower.map(m => {
                      const match = updated.manpowerList?.find(u => u.name.trim().toLowerCase() === m.name.trim().toLowerCase());
                      if (match) {
                        isTrModified = true;
                        if (!affectedResourceNames.includes(m.name)) affectedResourceNames.push(m.name);
                        return {
                          ...m,
                          rate: match.rate,
                          basicSalary: match.basicSalary,
                          ppeDaily: match.ppeDaily,
                          jamsostekDaily: match.jamsostekDaily,
                          mealsDaily: match.mealsDaily,
                          otherAllowanceDaily: match.otherAllowanceDaily
                        };
                      }
                      return m;
                    });
                  }

                  // Sync Peralatan (Equipment)
                  let newEquipment = tr.equipmentList;
                  if (newEquipment && updated.equipmentList) {
                    newEquipment = newEquipment.map(e => {
                      const match = updated.equipmentList?.find(u => u.name.trim().toLowerCase() === e.name.trim().toLowerCase());
                      if (match) {
                        isTrModified = true;
                        if (!affectedResourceNames.includes(e.name)) affectedResourceNames.push(e.name);
                        return {
                          ...e,
                          rate: match.rate,
                          baseRentalRate: match.baseRentalRate,
                          fuelType: match.fuelType,
                          fuelLitersPerDay: match.fuelLitersPerDay,
                          fuelPricePerLiter: match.fuelPricePerLiter,
                          bbmRate: match.bbmRate,
                          maintenanceRate: match.maintenanceRate,
                          mobilizationDaily: match.mobilizationDaily
                        };
                      }
                      return e;
                    });
                  }

                  // Sync Material Utama
                  let newMaterial = tr.materialList;
                  if (newMaterial && updated.materialList) {
                    newMaterial = newMaterial.map(mat => {
                      const match = updated.materialList?.find(u => u.name.trim().toLowerCase() === mat.name.trim().toLowerCase());
                      if (match) {
                        isTrModified = true;
                        if (!affectedResourceNames.includes(mat.name)) affectedResourceNames.push(mat.name);
                        return {
                          ...mat,
                          rate: match.rate,
                          unit: match.unit || mat.unit
                        };
                      }
                      return mat;
                    });
                  }

                  // Sync Bahan & Consumables
                  let newConsumable = tr.consumableList;
                  if (newConsumable && updated.consumableList) {
                    newConsumable = newConsumable.map(cs => {
                      const match = updated.consumableList?.find(u => u.name.trim().toLowerCase() === cs.name.trim().toLowerCase());
                      if (match) {
                        isTrModified = true;
                        if (!affectedResourceNames.includes(cs.name)) affectedResourceNames.push(cs.name);
                        return {
                          ...cs,
                          rate: match.rate,
                          unit: match.unit || cs.unit
                        };
                      }
                      return cs;
                    });
                  }

                  // Jika ada komponen yang terupdate pada treatment ini, hitung ulang summary tarifnya
                  if (isTrModified) {
                    affectedTreatmentsCount++;
                    const crewDailyRate = (newManpower || []).reduce((acc, m) => acc + (m.qty * m.rate), 0);
                    const equipmentDailyRate = (newEquipment || []).reduce((acc, e) => acc + (e.qty * e.rate), 0);
                    const materialUnitRate = (newMaterial || []).reduce((acc, mat) => acc + (mat.qty * mat.rate), 0);
                    const consumableUnitRate = (newConsumable || []).reduce((acc, cs) => acc + (cs.qty * cs.rate), 0);

                    return {
                      ...tr,
                      manpowerList: newManpower,
                      equipmentList: newEquipment,
                      materialList: newMaterial,
                      consumableList: newConsumable,
                      crewDailyRate,
                      equipmentDailyRate,
                      materialUnitRate,
                      consumableUnitRate
                    };
                  }
                }

                return tr;
              })
            };
          })
        };
      }
      return t;
    }));

    // Sinkronisasi otomatis ke Master Database jika opsi aktif
    if (syncOptions?.syncToMaster) {
      syncTreatmentResourcesToMaster(
        updated.manpowerList,
        updated.equipmentList,
        updated.materialList,
        updated.consumableList
      );
    }

    if (affectedTreatmentsCount > 0) {
      setSyncNotification({
        message: `Berhasil menyinkronkan tarif [${affectedResourceNames.slice(0, 3).join(', ')}${affectedResourceNames.length > 3 ? ` +${affectedResourceNames.length - 3} lainnya` : ''}] ke ${affectedTreatmentsCount} item pekerjaan lain di proyek "${activeTender.title}"!`,
        count: affectedTreatmentsCount
      });
    }

    setIsTreatmentModalOpen(false);
    setActiveTreatmentForModal(null);
  };

  const handleAddTreatment = (boqId: string, treatment: TreatmentItem) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            if (b.id === boqId) {
              const defaultProd = (treatment.outputPerDay && treatment.outputPerDay > 0) ? treatment.outputPerDay : 1;
              const newTreatment: TreatmentItem = {
                ...treatment,
                qty: (treatment.qty !== undefined && treatment.qty > 0) ? treatment.qty : defaultProd,
                unit: treatment.unit || b.unit || 'Unit',
                outputPerDay: defaultProd
              };
              return {
                ...b,
                outputPerDay: (b.outputPerDay && b.outputPerDay > 0) ? b.outputPerDay : 1,
                treatments: [...b.treatments, newTreatment]
              };
            }
            return b;
          })
        };
      }
      return t;
    }));

    setTargetBoqForDrawer(prev => {
      if (prev && prev.id === boqId) {
        const defaultProd = (treatment.outputPerDay && treatment.outputPerDay > 0) ? treatment.outputPerDay : 1;
        const newTreatment: TreatmentItem = {
          ...treatment,
          qty: (treatment.qty !== undefined && treatment.qty > 0) ? treatment.qty : defaultProd,
          unit: treatment.unit || prev.unit || 'Unit',
          outputPerDay: defaultProd
        };
        return {
          ...prev,
          outputPerDay: (prev.outputPerDay && prev.outputPerDay > 0) ? prev.outputPerDay : 1,
          treatments: [...prev.treatments, newTreatment]
        };
      }
      return prev;
    });
  };

  const handleBatchAddTreatment = (boqIds: string[], baseTreatment: TreatmentItem) => {
    if (!activeTenderId || boqIds.length === 0) return;
    const defaultProd = (baseTreatment.outputPerDay && baseTreatment.outputPerDay > 0) ? baseTreatment.outputPerDay : 1;

    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            if (boqIds.includes(b.id)) {
              const newTreatment: TreatmentItem = {
                ...baseTreatment,
                id: `treat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                qty: (baseTreatment.qty !== undefined && baseTreatment.qty > 0) ? baseTreatment.qty : defaultProd,
                unit: baseTreatment.unit || b.unit || 'Unit',
                outputPerDay: defaultProd
              };
              return {
                ...b,
                outputPerDay: (b.outputPerDay && b.outputPerDay > 0) ? b.outputPerDay : 1,
                treatments: [...b.treatments, newTreatment]
              };
            }
            return b;
          })
        };
      }
      return t;
    }));

    setSyncNotification({
      message: `Berhasil memetakan treatment "${baseTreatment.description}" ke ${boqIds.length} item BoQ pekerjaan!`,
      count: boqIds.length
    });
  };

  const handleUpdateBoqOutputPerDay = (boqId: string, newOutput: number) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            if (b.id === boqId) {
              return {
                ...b,
                outputPerDay: Math.max(0.01, newOutput)
              };
            }
            return b;
          })
        };
      }
      return t;
    }));
  };

  const handleUpdateTreatmentQty = (boqId: string, treatmentId: string, newQty: number) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            if (b.id === boqId) {
              return {
                ...b,
                treatments: b.treatments.map(tr => {
                  if (tr.id === treatmentId) {
                    return {
                      ...tr,
                      qty: Math.max(0, newQty)
                    };
                  }
                  return tr;
                })
              };
            }
            return b;
          })
        };
      }
      return t;
    }));
  };

  const handleUpdateTreatmentUnit = (boqId: string, treatmentId: string, newUnit: string) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            if (b.id === boqId) {
              return {
                ...b,
                treatments: b.treatments.map(tr => {
                  if (tr.id === treatmentId) {
                    return {
                      ...tr,
                      unit: newUnit
                    };
                  }
                  return tr;
                })
              };
            }
            return b;
          })
        };
      }
      return t;
    }));
  };

  const handleUpdateBoqQty = (boqId: string, newQty: number) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            if (b.id === boqId) {
              return {
                ...b,
                qty: Math.max(0, newQty)
              };
            }
            return b;
          })
        };
      }
      return t;
    }));
  };

  const handleDeleteTreatment = (boqId: string, treatmentId: string) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.map(b => {
            if (b.id === boqId) {
              return {
                ...b,
                treatments: b.treatments.filter(tr => tr.id !== treatmentId)
              };
            }
            return b;
          })
        };
      }
      return t;
    }));

    setTargetBoqForDrawer(prev => {
      if (prev && prev.id === boqId) {
        return {
          ...prev,
          treatments: prev.treatments.filter(tr => tr.id !== treatmentId)
        };
      }
      return prev;
    });
  };


  const handleCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenderTitle.trim()) return;

    const newProject: TenderProject = {
      id: `tender-${Date.now()}`,
      tenderNo: `TDR-${Date.now().toString().slice(-6)}`,
      title: newTenderTitle.trim(),
      client: newTenderClient.trim() || 'Internal Client',
      author: newTenderAuthor.trim() || (currentUser ? `${currentUser.fullName} (${currentUser.authorRole})` : 'CRV'),
      createdAt: new Date().toISOString().split('T')[0],
      boqList: []
    };

    setTenders(prev => [newProject, ...prev]);
    setActiveTenderId(newProject.id);
    setNewTenderTitle('');
    setNewTenderClient('');
    setNewTenderAuthor('');
    setIsNewTenderModalOpen(false);

    // Langsung simpan tender baru ke Cloud Database
    setCloudStatus('syncing');
    const ok = await saveTenderToCloud(newProject);
    if (ok) {
      setCloudStatus('connected');
      setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const handleDeleteTender = async (tenderId: string) => {
    const target = tenders.find(t => t.id === tenderId);
    const tenderTitle = target?.title || 'ini';
    if (!window.confirm(`Yakin ingin menghapus proyek tender "${tenderTitle}"?\nData proyek ini akan dihapus permanen dari Cloud Database Supabase & browser.`)) {
      return;
    }

    setTenders(prev => prev.filter(t => t.id !== tenderId));
    if (activeTenderId === tenderId) {
      setActiveTenderId('');
    }

    setCloudStatus('syncing');
    const ok = await deleteTenderFromCloud(tenderId);
    if (ok) {
      setCloudStatus('connected');
      setLastCloudSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    }
  };

  const handleSelectActiveAuthor = (authorName: string) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          author: authorName
        };
      }
      return t;
    }));
  };

  const handleUpdateOverheadItems = (items: OverheadItem[]) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          overheadItems: items
        };
      }
      return t;
    }));
  };

  const handleUpdateCommercialConfig = (config: CommercialSummaryConfig) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          commercialConfig: config
        };
      }
      return t;
    }));
  };

  const handleDeleteBoqItem = (boqId: string) => {
    setTenders(prev => prev.map(t => {
      if (t.id === activeTenderId) {
        return {
          ...t,
          boqList: t.boqList.filter(b => b.id !== boqId)
        };
      }
      return t;
    }));
  };

  const handleImportSuccess = (importedRows: ImportedBoQRow[], mode: 'replace' | 'append' = 'replace') => {
    const newItems: BoQItem[] = importedRows
      .filter(row => row.isCategory || row.qty > 0)
      .map((row, idx) => ({
        id: `imp-${Date.now()}-${idx}`,
        rawLineId: row.rawLineId || row.itemNo || `R${idx + 1}`,
        itemNo: row.itemNo || '',
        description: row.description,
        qty: row.qty,
        unit: row.unit || (row.isCategory ? '' : 'Unit'),
        outputPerDay: (row.reqPerDay && row.reqPerDay > 0) ? row.reqPerDay : 1,
        treatments: [],
        isCategory: row.isCategory,
        pipeClass: row.pipeClass,
        size: row.size,
        materialSpec: row.materialSpec,
        inchDia: row.inchDia
      }));

    if (!activeTenderId) {
      const newId = `tender-${Date.now()}`;
      const newProject: TenderProject = {
        id: newId,
        tenderNo: `TDR-${Date.now().toString().slice(-6)}`,
        title: `Tender Hasil Import BoQ (${new Date().toISOString().split('T')[0]})`,
        client: 'Internal Client',
        author: currentUser ? `${currentUser.fullName} (${currentUser.authorRole})` : 'Estimator',
        createdAt: new Date().toISOString().split('T')[0],
        boqList: newItems
      };
      setTenders(prev => [newProject, ...prev]);
      setActiveTenderId(newId);
      saveTenderToCloud(newProject);
    } else {
      setTenders(prev => prev.map(t => {
        if (t.id === activeTenderId) {
          return {
            ...t,
            boqList: mode === 'replace' ? newItems : [...t.boqList, ...newItems]
          };
        }
        return t;
      }));
    }

    if (newItems.length > 0) {
      const firstWorkItem = newItems.find(item => !item.isCategory);
      if (firstWorkItem) {
        setOpenItems(prev => ({ ...prev, [firstWorkItem.id]: true }));
      }
    }
  };

  // Export File Backup JSON
  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(tenders, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tender_Backup_${activeTender.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // Kalkulasi Total BoQ:
  // 1. Total Daily Spread = sum(semua treatment daily rate)
  // 2. Total Direct = sum(semua treatment total biaya = tr.qty * (tr.dailySpread / tr.outputPerDay))
  // 3. Unit Price = Total Direct / BoQ Qty
  // 4. Durasi Header = BoQ Qty / BoQ Output per Day
  const getTreatmentCosts = (tr: TreatmentItem) => {
    const dailySpread = (tr.crewDailyRate || 0) + (tr.equipmentDailyRate || 0) + (tr.materialUnitRate || 0) + (tr.consumableUnitRate || 0);
    const outputRate = (tr.outputPerDay && tr.outputPerDay > 0) ? tr.outputPerDay : 1;
    const effectiveQty = (tr.qty !== undefined && tr.qty !== null && tr.qty > 0) ? tr.qty : outputRate;
    const unitRate = dailySpread / outputRate;
    const totalCost = effectiveQty * unitRate;
    const durationDays = effectiveQty / outputRate;
    return { dailySpread, outputRate, effectiveQty, unitRate, totalCost, durationDays };
  };

  const getBoqTotals = (boq: BoQItem) => {
    const totalDailyRate = boq.treatments.reduce((sum, t) => {
      return sum + ((t.crewDailyRate || 0) + (t.equipmentDailyRate || 0) + (t.materialUnitRate || 0) + (t.consumableUnitRate || 0));
    }, 0);

    const totalDirect = boq.treatments.reduce((sum, t) => {
      const { totalCost } = getTreatmentCosts(t);
      return sum + totalCost;
    }, 0);

    const output = (boq.outputPerDay && boq.outputPerDay > 0) ? boq.outputPerDay : 1;
    const unitPrice = (boq.qty && boq.qty > 0) ? (totalDirect / boq.qty) : totalDirect;
    const durationDays = (boq.qty > 0 && output > 0) ? (boq.qty / output) : 0;
    return { totalDirect, unitPrice, totalDailyRate, outputPerDay: output, durationDays };
  };

  const currentGrandTotal = activeTender.boqList.reduce((sum, b) => sum + getBoqTotals(b).totalDirect, 0);

  // Overhead (Indirect Cost) & Commercial Financials
  const currentOverheadItems: OverheadItem[] = activeTender.overheadItems || [];
  const currentCommercialConfig: CommercialSummaryConfig = activeTender.commercialConfig || {
    contingencyPercent: 3,
    profitMarginPercent: 10,
    taxPercent: 11,
    includeTaxInBid: true,
    projectDurationMonths: 1
  };
  const currentTotalIndirectCost = currentOverheadItems.reduce((s, i) => s + (i.qty * i.unitRate), 0);

  // Export Rekapitulasi Penawaran ke File Excel (.xlsx) dengan Unique Key untuk VLOOKUP / XLOOKUP
  const handleExportExcel = () => {
    if (!currentUser || !activeTenderId || activeTender.boqList.length === 0) return;
    exportTenderToExcel({
      tender: activeTender,
      commercialConfig: currentCommercialConfig,
      grandTotalDirect: currentGrandTotal,
      totalIndirectCost: currentTotalIndirectCost,
      calculateBoqTotals: getBoqTotals
    });
  };

  // Matriks Hak Akses Berdasarkan Role Pengguna
  const isSuperAdmin = currentUser?.authorRole === 'Super Admin';
  const isEstimator = currentUser?.authorRole === 'Estimator';
  const isAdmin = currentUser?.authorRole === 'Admin';
  const isReviewer = currentUser?.authorRole === 'Reviewer';
  const isViewer = currentUser?.authorRole === 'Viewer';

  const canConfigureCloud = !!currentUser && (isSuperAdmin || isEstimator); // Estimator & Super Admin hold cloud connection
  const canManageUsers = !!currentUser && (isSuperAdmin || isAdmin);
  const canCreateTender = !!currentUser && (isSuperAdmin || isEstimator || isAdmin);
  const canImportExcel = !!currentUser && (isSuperAdmin || isEstimator || isAdmin);
  const canDeleteBoq = !!currentUser && (isSuperAdmin || isEstimator); // Reviewer & Viewer cannot delete
  const canEditTreatments = !!currentUser && (isSuperAdmin || isEstimator || isAdmin); // Viewer cannot add/edit
  const isReadOnly = !currentUser || isViewer;

  // Daftar Kategori / Bab unik untuk Filter
  const uniqueBoqCategories = useMemo<string[]>(() => {
    if (!currentUser || !activeTender) return [];
    const categories: string[] = [];
    activeTender.boqList.forEach(item => {
      if (item.isCategory && item.description) {
        const catName = item.itemNo ? `${item.itemNo} - ${item.description}` : item.description;
        if (!categories.includes(catName)) {
          categories.push(catName);
        }
      }
    });
    return categories;
  }, [activeTender, currentUser]);

  // List BoQ yang terfilter berdasarkan Bab dan Search Query
  const filteredBoqList = useMemo<BoQItem[]>(() => {
    if (!currentUser) return [];
    let list = activeTender.boqList;

    // Filter Bab / Kategori
    if (boqCategoryFilter !== 'All') {
      let isCapturing = false;
      const filteredByCat: BoQItem[] = [];
      for (const item of list) {
        if (item.isCategory) {
          const catName = item.itemNo ? `${item.itemNo} - ${item.description}` : item.description;
          isCapturing = (catName === boqCategoryFilter);
          if (isCapturing) filteredByCat.push(item);
        } else if (isCapturing) {
          filteredByCat.push(item);
        }
      }
      list = filteredByCat;
    }

    // Filter Teks Pencarian
    if (boqSearchQuery.trim()) {
      const q = boqSearchQuery.toLowerCase().trim();
      list = list.filter(item => {
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const noMatch = (item.itemNo || '').toLowerCase().includes(q);
        const unitMatch = (item.unit || '').toLowerCase().includes(q);
        const sizeMatch = (item.size || '').toLowerCase().includes(q);
        const classMatch = (item.pipeClass || '').toLowerCase().includes(q);
        const matMatch = (item.materialSpec || '').toLowerCase().includes(q);
        const treatmentMatch = item.treatments?.some(t => 
          (t.category || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          t.manpowerList?.some(m => m.name.toLowerCase().includes(q)) ||
          t.equipmentList?.some(e => e.name.toLowerCase().includes(q)) ||
          t.materialList?.some(mat => mat.name.toLowerCase().includes(q)) ||
          t.consumableList?.some(c => c.name.toLowerCase().includes(q))
        );
        return descMatch || noMatch || unitMatch || sizeMatch || classMatch || matMatch || treatmentMatch;
      });
    }

    return list;
  }, [activeTender, boqSearchQuery, boqCategoryFilter, currentUser]);

  const handleExpandAll = () => {
    const allOpen: Record<string, boolean> = {};
    activeTender.boqList.forEach(b => {
      allOpen[b.id] = true;
    });
    setOpenItems(allOpen);
  };

  const handleCollapseAll = () => {
    setOpenItems({});
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Segoe UI, Tahoma, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', color: '#1e293b', textAlign: 'left' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* 1. TOP HEADER & TENDER SWITCHER */}
        <div style={{ 
          background: '#0f172a', 
          color: '#ffffff', 
          padding: '16px 20px', 
          borderRadius: '12px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px', 
          marginBottom: '16px', 
          borderBottom: '4px solid #f59e0b', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
        }}>
          {/* SISI KIRI: BRANDING & TENDER SWITCHER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: '1 1 auto', minWidth: '320px' }}>
            {/* Fusion Four Company Logo (Top Left) */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <img 
                src={fusionFourLogo} 
                alt="Fusion Four" 
                title="Fusion Four"
                style={{ 
                  height: '46px', 
                  width: 'auto', 
                  display: 'block',
                  filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.95)) drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }} 
              />
            </div>
            <div style={{ borderLeft: '1px solid #334155', paddingLeft: '14px' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', color: '#fbbf24' }}>Smart Estimator Engine</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>Proyek Tender:</span>
                <select
                  value={activeTenderId}
                  onChange={(e) => setActiveTenderId(e.target.value)}
                  disabled={!currentUser}
                  style={{ 
                    background: '#1e293b', 
                    color: currentUser ? (activeTenderId ? '#fbbf24' : '#94a3b8') : '#94a3b8', 
                    border: activeTenderId ? '1px solid #f59e0b' : '1px solid #334155', 
                    borderRadius: '6px', 
                    padding: '4px 10px', 
                    fontSize: '12px', 
                    fontWeight: 'bold', 
                    cursor: currentUser ? 'pointer' : 'not-allowed', 
                    width: '210px', 
                    textOverflow: 'ellipsis',
                    boxSizing: 'border-box'
                  }}
                >
                  {currentUser ? (
                    <>
                      <option value="">-- Pilih Proyek Tender --</option>
                      {tenders.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.client})
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="">(Silakan Login Terlebih Dahulu)</option>
                  )}
                </select>
                {currentUser && activeTenderId && (
                  <button
                    type="button"
                    onClick={() => setActiveTenderId('')}
                    title="Tutup proyek tender aktif (kembali ke default kosong)"
                    style={{
                      background: 'none',
                      border: '1px solid #475569',
                      color: '#94a3b8',
                      borderRadius: '5px',
                      padding: '3px 7px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <X size={12} />
                    Tutup
                  </button>
                )}
                {currentUser && activeTenderId && canCreateTender && (
                  <button
                    type="button"
                    onClick={() => handleDeleteTender(activeTenderId)}
                    title="Hapus proyek tender aktif dari Cloud Supabase & browser"
                    style={{
                      background: 'none',
                      border: '1px solid #7f1d1d',
                      color: '#f87171',
                      borderRadius: '5px',
                      padding: '3px 7px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <Trash2 size={11} />
                    Hapus
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                  <Save size={11} style={{ color: currentUser ? '#10b981' : '#64748b' }} />
                  <span style={{ fontSize: '11px', color: currentUser ? '#10b981' : '#64748b', whiteSpace: 'nowrap' }}>
                    {currentUser ? 'Auto-Saved' : 'Sesi Terkunci'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SISI KANAN: TOMBOL AKSI CEPAT */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '0 1 auto' }}>
            {/* Cloud Connection Button */}
            <button
              onClick={() => setIsCloudModalOpen(true)}
              title={canConfigureCloud 
                ? `Koneksi Supabase Cloud: ${cloudStatus === 'connected' ? `Tersambung (Terakhir sync: ${lastCloudSyncTime || 'Baru saja'})` : cloudStatus === 'syncing' ? 'Sedang sinkronisasi data...' : 'Offline'}`
                : "Koneksi Cloud (Akses dibatasi untuk Estimator & Super Admin)"}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '7px', 
                backgroundColor: canConfigureCloud ? '#064e3b' : '#1e293b', 
                color: canConfigureCloud ? '#6ee7b7' : '#94a3b8', 
                border: canConfigureCloud ? '1px solid #059669' : '1px solid #334155', 
                padding: '9px 12px', 
                borderRadius: '8px', 
                fontWeight: '600', 
                cursor: 'pointer', 
                fontSize: '13px' 
              }}
            >
              <CloudLightning size={15} />
              <span>
                {cloudStatus === 'connected' 
                  ? 'Cloud Synced' 
                  : cloudStatus === 'syncing' 
                    ? 'Syncing...' 
                    : 'Cloud Offline'}
              </span>
              <span 
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: cloudStatus === 'connected' ? '#10b981' : cloudStatus === 'syncing' ? '#f59e0b' : '#ef4444',
                  display: 'inline-block',
                  boxShadow: cloudStatus === 'connected' ? '0 0 6px #10b981' : undefined
                }} 
              />
              {!canConfigureCloud && <Lock size={12} style={{ color: '#f59e0b' }} />}
            </button>

            {canManageUsers && (
              <button
                onClick={() => setIsUserModalOpen(true)}
                title="Kelola User & Hak Akses"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', padding: '9px 10px', borderRadius: '8px', cursor: 'pointer' }}
              >
                <Users size={16} />
              </button>
            )}

            <button
              onClick={handleExportBackup}
              title="Backup JSON — Download data cadangan mentah ke komputer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', padding: '9px 10px', borderRadius: '8px', cursor: 'pointer' }}
            >
              <Download size={16} />
            </button>

            <button
              onClick={handleExportExcel}
              disabled={!currentUser || !activeTenderId || activeTender.boqList.length === 0}
              title={currentUser && activeTenderId && activeTender.boqList.length > 0 
                ? "Export Rekapitulasi Penawaran ke Excel (.xlsx) dengan Kunci Line ID untuk Lookup" 
                : "Pilih tender yang memiliki item BoQ untuk export Excel"}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: (currentUser && activeTenderId && activeTender.boqList.length > 0) ? '#065f46' : '#1e293b',
                color: (currentUser && activeTenderId && activeTender.boqList.length > 0) ? '#6ee7b7' : '#64748b',
                border: '1px solid ' + ((currentUser && activeTenderId && activeTender.boqList.length > 0) ? '#059669' : '#334155'),
                padding: '9px 14px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: (currentUser && activeTenderId && activeTender.boqList.length > 0) ? 'pointer' : 'not-allowed',
                fontSize: '13px'
              }}
            >
              <FileSpreadsheet size={16} />
              Export Excel
            </button>

            {/* Tombol Setup Base Treatment & Input Mapping */}
            <button
              onClick={() => {
                setTargetBoqForDrawer(null); // Mode Master Setup Bebas
                setIsDrawerOpen(true);
              }}
              title="Setup Master Base Treatment & Input Mapping — Konfigurasi preset template atau petakan treatment ke baris item BoQ"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f59e0b',
                color: '#0f172a',
                border: '1px solid #d97706',
                padding: '9px 14px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)'
              }}
            >
              <Wrench size={15} />
              Setup Base Treatment
            </button>

            {canCreateTender ? (
              <button
                onClick={() => setIsNewTenderModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#334155', color: '#fff', border: '1px solid #475569', padding: '9px 14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                <FolderPlus size={16} />
                Tender Baru
              </button>
            ) : null}

            {canImportExcel ? (
              <button
                onClick={() => setIsImportOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
              >
                <FileUp size={16} />
                Import Excel BoQ
              </button>
            ) : (
              <div 
                title="Akses Dibatasi: Import Excel hanya untuk Super Admin, Estimator, dan Admin"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1e293b', color: '#64748b', border: '1px solid #334155', padding: '9px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'not-allowed', opacity: 0.7 }}
              >
                <Lock size={14} />
                Import Dibatasi
              </div>
            )}
          </div>
        </div>

        {/* 2. INFO BAR PROYEK AKTIF */}
        <div style={{ background: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', fontSize: '13px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} style={{ color: activeTenderId ? '#2563eb' : '#94a3b8' }} />
              {activeTenderId ? (
                <>
                  <span style={{ fontWeight: 'bold', color: '#0f172a' }}>{activeTender.title}</span>
                  <span style={{ color: '#64748b' }}>• Klien: {activeTender.client}</span>
                </>
              ) : (
                <span style={{ fontWeight: '600', color: '#64748b', fontStyle: 'italic' }}>
                  (Belum Ada Tender Terbuka)
                </span>
              )}
            </div>

            {/* User / Author Tunggal Terpadu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser ? (
                <>
                  <div 
                    onClick={() => setIsLoginModalOpen(true)}
                    title="Klik untuk ganti user atau login dengan akun lain"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: isSuperAdmin ? '#fdf4ff' : isEstimator ? '#fef3c7' : isAdmin ? '#e0f2fe' : isReviewer ? '#ede9fe' : '#f1f5f9',
                      color: isSuperAdmin ? '#86198f' : isEstimator ? '#92400e' : isAdmin ? '#0369a1' : isReviewer ? '#6d28d9' : '#475569',
                      border: isSuperAdmin ? '1px solid #f0abfc' : isEstimator ? '1px solid #fde68a' : isAdmin ? '1px solid #bae6fd' : isReviewer ? '1px solid #ddd6fe' : '1px solid #e2e8f0',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: isSuperAdmin ? '#c026d3' : isEstimator ? '#d97706' : isAdmin ? '#0284c7' : isReviewer ? '#7c3aed' : '#64748b',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {isSuperAdmin ? '⚡' : currentUser.fullName.charAt(0)}
                    </div>
                    <span>
                      Author: <strong>{currentUser.fullName}</strong>
                      <span style={{ 
                        marginLeft: '6px', 
                        fontSize: '10px', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        backgroundColor: isSuperAdmin ? '#fae8ff' : isEstimator ? '#fef9c3' : isAdmin ? '#f0f9ff' : isReviewer ? '#f5f3ff' : '#ffffff',
                        border: '1px solid currentColor'
                      }}>
                        {currentUser.authorRole}
                      </span>
                    </span>
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 'bold', marginLeft: '4px' }}>
                      (Ganti / Login)
                    </span>
                  </div>

                  {/* Tombol Logout Cepat */}
                  <button
                    onClick={handleLogout}
                    title="Keluar dari sesi akun saat ini"
                    style={{
                      background: 'none',
                      border: '1px solid #cbd5e1',
                      color: '#64748b',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px'
                    }}
                  >
                    <LogOut size={12} />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#0f172a',
                    color: '#fbbf24',
                    border: '1px solid #f59e0b',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <LogIn size={13} />
                  Login Akun
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ color: '#64748b' }}>
              Scope: <strong style={{ color: '#0f172a' }}>{activeTender.boqList.filter(b => !b.isCategory).length} Item</strong>
              {activeTender.boqList.some(b => b.isCategory) && (
                <span style={{ marginLeft: '4px', fontSize: '11px', color: '#64748b' }}>
                  ({activeTender.boqList.filter(b => b.isCategory).length} Bab)
                </span>
              )}
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Direct:</span>
              <span style={{ fontWeight: '800', color: '#059669', fontSize: '13px', fontFamily: 'monospace' }}>
                Rp {currentGrandTotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>Overhead (OH):</span>
              <span style={{ fontWeight: '800', color: '#2563eb', fontSize: '13px', fontFamily: 'monospace' }}>
                Rp {currentTotalIndirectCost.toLocaleString('id-ID')}
              </span>
            </div>
            {currentCommercialConfig.projectDurationMonths && (
              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Durasi:</span>
                <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '13px' }}>
                  {currentCommercialConfig.projectDurationMonths} Bln
                </span>
              </div>
            )}
            <button
              onClick={() => {
                if (!currentUser) {
                  setIsLoginModalOpen(true);
                  return;
                }
                if (!activeTenderId) return;
                setIsOverheadModalOpen(true);
              }}
              disabled={!currentUser || !activeTenderId}
              title={!currentUser ? "Silakan login terlebih dahulu" : !activeTenderId ? "Silakan pilih proyek tender terlebih dahulu" : "Buka rincian Indirect Cost (Overhead) dan Rekapitulasi Harga Penawaran Tender"}
              style={{
                backgroundColor: (currentUser && activeTenderId) ? '#1e3a8a' : '#475569',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: (currentUser && activeTenderId) ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Building size={14} />
              Overhead & Rekap
            </button>
          </div>
        </div>

        {/* BANNER NOTIFIKASI HAK AKSES PER ROLE */}
        {isViewer && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#92400e',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Eye size={18} style={{ color: '#d97706', flexShrink: 0 }} />
              <div>
                <strong>Mode Hanya Baca (Viewer):</strong> Anda login sebagai peninjau tamu. Anda dapat memeriksa seluruh rincian kalkulasi dan formula BoQ, namun aksi ubah angka, hapus item, dan import Excel dinonaktifkan.
              </div>
            </div>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                backgroundColor: '#d97706',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                marginLeft: '12px'
              }}
            >
              🔑 Login Akun Lain
            </button>
          </div>
        )}

        {isReviewer && (
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px 18px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#1e40af',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
              <div>
                <strong>Mode Reviewer:</strong> Anda memiliki akses audit dan verifikasi tender. Seluruh breakdown dapat diperiksa, namun tombol penghapusan item dinonaktifkan demi integritas data proyek.
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8', whiteSpace: 'nowrap', marginLeft: '12px', background: '#dbeafe', padding: '3px 8px', borderRadius: '4px' }}>
              ✓ Mode Audit Aktif
            </span>
          </div>
        )}

        {/* 3. DAFTAR ITEM BOQ ATAU SESI KOSONG LOGOUT */}
        {!currentUser ? (
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '56px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
            marginTop: '8px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#475569'
            }}>
              <Lock size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>
              Sesi Logout — Data Tender Kosong & Terkunci
            </h3>
            <p style={{ margin: '0 auto 20px', fontSize: '13px', color: '#64748b', maxWidth: '480px', lineHeight: 1.5 }}>
              Seluruh data item BoQ, kalkulasi direct cost, dan breakdown resources dirahasiakan saat logout. Silakan login akun untuk membuka tender aktif.
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                backgroundColor: '#0f172a',
                color: '#fbbf24',
                border: '1px solid #f59e0b',
                padding: '9px 22px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <LogIn size={15} />
              Login Akun untuk Membuka Tender
            </button>
          </div>
        ) : !activeTenderId || activeTender.id === '' ? (
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '56px 20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
            marginTop: '8px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '28px',
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#2563eb'
            }}>
              <Briefcase size={28} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>
              Default Tender Kosong — Belum Ada Tender Terbuka
            </h3>
            <p style={{ margin: '0 auto 22px', fontSize: '13px', color: '#64748b', maxWidth: '520px', lineHeight: 1.6 }}>
              Saat Anda login, aplikasi berada dalam kondisi default kosong. Silakan pilih tender dari daftar di bawah, buat folder tender baru, atau import BoQ dari file Excel.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {tenders.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>Buka Proyek:</span>
                  <select
                    value={activeTenderId}
                    onChange={(e) => setActiveTenderId(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#fff',
                      color: '#0f172a',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">-- Pilih Tender ({tenders.length} tersedia) --</option>
                    {tenders.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.client})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {canCreateTender && (
                <button
                  onClick={() => setIsNewTenderModalOpen(true)}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FolderPlus size={14} />
                  Buat Tender Baru
                </button>
              )}

              {canImportExcel && (
                <button
                  onClick={() => setIsImportOpen(true)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileUp size={14} />
                  Import Excel BoQ
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* BoQ SEARCH & CATEGORY FILTER TOOLBAR */}
            {activeTender.boqList.length > 0 && (
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                position: 'sticky',
                top: '12px',
                zIndex: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
                  {/* Search Input Box */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={boqSearchQuery}
                      onChange={(e) => setBoqSearchQuery(e.target.value)}
                      placeholder="Cari kode BoQ (mis. 1.1), uraian pekerjaan, satuan, alat, material..."
                      style={{
                        width: '100%',
                        padding: '7px 30px 7px 32px',
                        fontSize: '12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {boqSearchQuery && (
                      <button
                        onClick={() => setBoqSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#94a3b8',
                          padding: 0,
                          display: 'flex'
                        }}
                        title="Hapus pencarian"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Category / Chapter Select */}
                  {uniqueBoqCategories.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <Filter size={14} style={{ color: '#64748b' }} />
                      <select
                        value={boqCategoryFilter}
                        onChange={(e) => setBoqCategoryFilter(e.target.value)}
                        style={{
                          padding: '7px 10px',
                          fontSize: '12px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          backgroundColor: '#f8fafc',
                          color: '#334155',
                          outline: 'none',
                          cursor: 'pointer',
                          maxWidth: '220px'
                        }}
                      >
                        <option value="All">Semua Bab ({uniqueBoqCategories.length})</option>
                        {uniqueBoqCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Right Action Buttons & Counter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                    Menampilkan <strong style={{ color: '#0f172a' }}>{filteredBoqList.filter(b => !b.isCategory).length}</strong> dari {activeTender.boqList.filter(b => !b.isCategory).length} Item
                  </span>

                  {(boqSearchQuery || boqCategoryFilter !== 'All') && (
                    <button
                      onClick={() => {
                        setBoqSearchQuery('');
                        setBoqCategoryFilter('All');
                      }}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '5px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#475569',
                        fontWeight: '600'
                      }}
                    >
                      Reset Filter
                    </button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', borderLeft: '1px solid #e2e8f0', paddingLeft: '8px' }}>
                    <button
                      onClick={handleExpandAll}
                      title="Buka semua kartu breakdown BoQ"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '5px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#1e293b'
                      }}
                    >
                      Buka Semua
                    </button>
                    <button
                      onClick={handleCollapseAll}
                      title="Tutup semua kartu breakdown BoQ"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '5px',
                        padding: '5px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      Tutup Semua
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Empty BoQ List Or Empty Filter Results */}
            {activeTender.boqList.length === 0 ? (
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '48px 20px', textAlign: 'center', background: '#fff' }}>
                <FileUp size={48} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>Belum Ada Item BoQ di Tender Ini</h3>
                <p style={{ margin: '6px 0 16px', fontSize: '13px', color: '#64748b' }}>Klik tombol "Import Excel BoQ" di atas untuk memasukkan sheet tender</p>
                {canImportExcel && (
                  <button
                    onClick={() => setIsImportOpen(true)}
                    style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Mulai Import Excel
                  </button>
                )}
              </div>
            ) : filteredBoqList.length === 0 ? (
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '36px 20px', textAlign: 'center', background: '#fff' }}>
                <Search size={36} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Tidak Ada Item BoQ yang Sesuai</h4>
                <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#64748b' }}>
                  Tidak ditemukan item BoQ untuk kata kunci "<strong>{boqSearchQuery}</strong>" {boqCategoryFilter !== 'All' ? `pada bab "${boqCategoryFilter}"` : ''}.
                </p>
                <button
                  onClick={() => {
                    setBoqSearchQuery('');
                    setBoqCategoryFilter('All');
                  }}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  Reset Pencarian & Tampilkan Semua
                </button>
              </div>
            ) : (
              <div 
                className="boq-scroll-container"
                style={{
                  maxHeight: 'calc(100vh - 280px)',
                  minHeight: '380px',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  paddingRight: '6px',
                  paddingBottom: '32px'
                }}
              >
                {filteredBoqList.map((boq, index) => {
            // A. BANNER HEADER BAB / KATEGORI
            if (boq.isCategory) {
              const isMajorChapter = !!boq.itemNo && boq.itemNo !== '-';
              return (
                <div
                  key={boq.id}
                  style={{
                    margin: isMajorChapter ? (index === 0 ? '4px 0 12px 0' : '26px 0 12px 0') : (index === 0 ? '4px 0 10px 0' : '18px 0 10px 0'),
                    padding: isMajorChapter ? '12px 18px' : '10px 16px',
                    backgroundColor: isMajorChapter ? '#0f172a' : '#1e293b',
                    color: '#ffffff',
                    borderRadius: '8px',
                    borderLeft: isMajorChapter ? '6px solid #f59e0b' : '4px solid #38bdf8',
                    boxShadow: isMajorChapter ? '0 4px 6px -1px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {boq.itemNo ? (
                      <span style={{
                        backgroundColor: isMajorChapter ? '#f59e0b' : '#38bdf8',
                        color: '#0f172a',
                        padding: '3px 10px',
                        borderRadius: '5px',
                        fontWeight: 'bold',
                        fontSize: isMajorChapter ? '13px' : '12px',
                        fontFamily: 'monospace',
                        flexShrink: 0
                      }}>
                        {boq.itemNo}
                      </span>
                    ) : (
                      <span style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        SUB-PEKERJAAN
                      </span>
                    )}
                    <span style={{
                      fontSize: isMajorChapter ? '14px' : '13px',
                      fontWeight: 'bold',
                      color: isMajorChapter ? '#ffffff' : '#f1f5f9',
                      letterSpacing: isMajorChapter ? '0.3px' : 'normal'
                    }}>
                      {boq.description}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <span style={{
                      fontSize: '10px',
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      fontWeight: '700'
                    }}>
                      {isMajorChapter ? 'BAB UTAMA' : 'SEKSI'}
                    </span>
                    {canDeleteBoq && (
                      <button
                        onClick={() => handleDeleteBoqItem(boq.id)}
                        title="Hapus Header Bab"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            // B. KARTU BOQ ITEM PEKERJAAN (Memiliki Volume & Treatment)
            const { totalDirect, unitPrice, totalDailyRate, outputPerDay: effectiveBoqOutput, durationDays } = getBoqTotals(boq);
            const isOpen = !!openItems[boq.id];

            return (
              <div key={boq.id} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Header BoQ Klien (Kuning Rata Kiri - Format 2 Baris Rapih) */}
                <div style={{ backgroundColor: '#fde047', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '8px', userSelect: 'none' }}>
                  {/* Baris 1: Deskripsi & Identitas Scope Lengkap (Full Width) */}
                  <div 
                    onClick={() => toggleAccordion(boq.id)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#0f172a', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                  >
                    <span style={{ flexShrink: 0, display: 'flex', marginTop: '2px' }}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <span style={{ background: '#0f172a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', flexShrink: 0, fontWeight: 'bold' }}>
                      {boq.itemNo}
                    </span>
                    {boq.rawLineId && boq.rawLineId !== boq.itemNo && (
                      <span 
                        title={`Line ID / Unique Key Excel: ${boq.rawLineId} (Kunci XLOOKUP/VLOOKUP)`}
                        style={{ background: '#1e3a8a', color: '#93c5fd', border: '1px solid #3b82f6', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', flexShrink: 0 }}
                      >
                        ID: {boq.rawLineId}
                      </span>
                    )}
                    <div style={{ textAlign: 'left', lineHeight: '1.4', flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px', wordBreak: 'break-word' }}>{boq.description}</span>
                      {(boq.size || boq.pipeClass || (boq.inchDia && boq.inchDia > 0)) && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {boq.size && (
                            <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #bfdbfe' }}>
                              📏 Size: {boq.size}
                            </span>
                          )}
                          {boq.pipeClass && (
                            <span style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #fde68a' }}>
                              🏷️ Class: {boq.pipeClass}
                            </span>
                          )}
                          {boq.inchDia && boq.inchDia > 0 && (
                            <span style={{ fontSize: '10px', background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #a7f3d0' }}>
                              ⚡ {boq.inchDia} In-Dia
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Baris 2: Parameter Operasional & Kalkulasi Harga */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#0f172a', flexWrap: 'wrap', paddingLeft: '26px' }}>
                    {/* Qty Input */}
                    <div 
                      title={`Volume BoQ: ${boq.qty} ${boq.unit}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px' }}
                    >
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>Qty:</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={boq.qty}
                        disabled={isReadOnly}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleUpdateBoqQty(boq.id, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '60px',
                          padding: '2px 4px',
                          fontSize: '11px',
                          textAlign: 'right',
                          border: '1px solid #cbd5e1',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          color: '#0f172a',
                          backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff'
                        }}
                      />
                      <span style={{ fontSize: '11px', color: '#334155', fontWeight: 'bold' }}>{boq.unit}</span>
                    </div>

                    {/* Output per Day Input */}
                    <div 
                      title={`Target Output Harian: Nilai target output harian (default: 1) untuk mengestimasi durasi pengerjaan. Dapat diedit sesuai kapasitas proyek.`}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ffffff', border: '2px solid #f59e0b', padding: '2px 8px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(245, 158, 11, 0.2)' }}
                    >
                      <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 'bold' }}>⚡ Output/Hari:</span>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={boq.outputPerDay !== undefined && boq.outputPerDay > 0 ? boq.outputPerDay : 1}
                        placeholder="1"
                        disabled={isReadOnly}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handleUpdateBoqOutputPerDay(boq.id, isNaN(val) ? 1 : val);
                        }}
                        style={{
                          width: '55px',
                          padding: '2px 4px',
                          fontSize: '11px',
                          textAlign: 'right',
                          border: '1px solid #f59e0b',
                          borderRadius: '3px',
                          fontWeight: 'bold',
                          color: '#b45309',
                          backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff'
                        }}
                      />
                      <span style={{ fontSize: '10px', color: '#b45309', fontWeight: 'bold' }}>{boq.unit}/hr</span>
                    </div>

                    {/* Durasi Badge */}
                    <span 
                      title={`Estimasi durasi pengerjaan: ${boq.qty} ${boq.unit} ÷ ${effectiveBoqOutput} ${boq.unit}/hari = ${durationDays.toFixed(2)} hari`}
                      style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      ⏱️ {durationDays.toFixed(1)} Hari
                    </span>

                    {/* Daily Spread Badge */}
                    {totalDailyRate > 0 && (
                      <span 
                        title={`Total Daily Spread: Rp ${Math.round(totalDailyRate).toLocaleString('id-ID')} / Hari`}
                        style={{ background: '#0f172a', color: '#93c5fd', border: '1px solid #1e3a8a', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace' }}
                      >
                        Rp {Math.round(totalDailyRate).toLocaleString('id-ID')} / Hari
                      </span>
                    )}

                    {/* Unit Price Badge */}
                    <span 
                      title={`Harga Satuan: Total Biaya Langsung Rp ${Math.round(totalDirect).toLocaleString('id-ID')} ÷ ${boq.qty} ${boq.unit} = Rp ${Math.round(unitPrice).toLocaleString('id-ID')} / ${boq.unit}`}
                      style={{ background: '#0f172a', color: '#fde047', padding: '3px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      Rp {Math.round(unitPrice).toLocaleString('id-ID')} / {boq.unit}
                    </span>

                    {/* Total Price Badge */}
                    <span 
                      title={`Total Biaya: ${boq.qty} ${boq.unit} × Rp ${Math.round(unitPrice).toLocaleString('id-ID')}`}
                      style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '13px', color: '#0f172a' }}
                    >
                      Total: Rp {Math.round(totalDirect).toLocaleString('id-ID')}
                    </span>

                    {canDeleteBoq && (
                      <button
                        onClick={() => handleDeleteBoqItem(boq.id)}
                        title="Hapus baris item ini"
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px', display: 'flex' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Grid Base Treatment */}
                {isOpen && (
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '12px', textAlign: 'left' }}>
                    {boq.treatments.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                        <div style={{ display: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '50%', color: '#64748b' }}>
                            <Wrench size={24} />
                          </div>
                        </div>
                        <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                          Belum ada Base Treatment yang dipanggil pada item ini.
                        </div>
                        <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#64748b' }}>
                          Gunakan Base Treatment Catalog untuk memanggil analisa kru mandays, alat kerja, material, dan konsumabel harian.
                        </p>
                        {canEditTreatments ? (
                          <button 
                            onClick={() => handleOpenTreatmentDrawer(boq)}
                            style={{ 
                              background: '#0f172a', 
                              color: '#fbbf24', 
                              border: 'none', 
                              padding: '8px 18px', 
                              borderRadius: '6px', 
                              fontSize: '12px', 
                              cursor: 'pointer', 
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            <Plus size={15} />
                            Panggil Base Treatment
                          </button>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} /> Mode Hanya Baca: Penambahan treatment dinonaktifkan
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Header Atas Sub-Grid */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Wrench size={14} style={{ color: '#2563eb' }} />
                            Rincian Analisa Base Treatment ({boq.treatments.length} komponen aktif)
                          </div>
                          {canEditTreatments && (
                            <button
                              onClick={() => handleOpenTreatmentDrawer(boq)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#0f172a',
                                color: '#fbbf24',
                                border: 'none',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={13} />
                              Panggil Treatment Lain
                            </button>
                          )}
                        </div>

                        {/* Tabel Detail Treatment (Model Daily Spread Harian dengan Qty & Unit SOW) */}
                        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                                <th style={{ padding: '8px 10px', textAlign: 'left' }}>Kategori & Deskripsi Treatment</th>
                                <th style={{ padding: '8px 8px', textAlign: 'center', width: '85px' }}>Qty</th>
                                <th style={{ padding: '8px 8px', textAlign: 'center', width: '75px' }}>Unit</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: '95px' }}>Kru (Rp/Hari)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: '95px' }}>Alat (Rp/Hari)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: '95px' }}>Material (Rp/Hari)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: '95px' }}>Consumables (Rp/Hari)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Daily Spread (Rp/Hari)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: '110px' }}>Biaya / Satuan</th>
                                <th style={{ padding: '8px 10px', textAlign: 'right', width: '120px' }}>Total Biaya (Rp)</th>
                                <th style={{ padding: '8px 10px', textAlign: 'center', width: '55px' }}>Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {boq.treatments.map((tr) => {
                                const { dailySpread, outputRate, effectiveQty, unitRate: trUnitCost, totalCost: treatmentTotal, durationDays: trDuration } = getTreatmentCosts(tr);
                                const displayUnit = tr.unit || boq.unit || 'Unit';

                                return (
                                  <tr key={tr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 10px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#1d4ed8', background: '#eff6ff', padding: '1px 6px', borderRadius: '3px', border: '1px solid #bfdbfe' }}>
                                          {tr.category}
                                        </span>
                                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{tr.description}</span>
                                      </div>
                                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenTreatmentBreakdownModal(boq.id, tr, boq.qty, boq.unit, effectiveBoqOutput)}
                                          title="Buka rincian turunan kru, alat, material, dan consumables"
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '2px 7px',
                                            fontSize: '10px',
                                            fontWeight: '600',
                                            color: '#b45309',
                                            background: '#fffbeb',
                                            border: '1px solid #fde68a',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                          }}
                                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef3c7'; }}
                                          onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; }}
                                        >
                                          <Sliders size={11} />
                                          <span>Turunan Resources: {(tr.manpowerList?.length || 0)} Kru • {(tr.equipmentList?.length || 0)} Alat • {(tr.materialList?.length || 0)} Mat • {(tr.consumableList?.length || 0)} Cons</span>
                                        </button>
                                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                                          ⚡ Target Prod: <strong>{outputRate}</strong> {displayUnit}/hr (⏱️ {trDuration.toFixed(2)} hr)
                                        </span>
                                      </div>
                                    </td>

                                    {/* Kolom Qty SOW (Default ikut target produksi per hari, editable, auto update Total Biaya) */}
                                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                      <input
                                        type="number"
                                        min="0.01"
                                        step="any"
                                        value={tr.qty !== undefined && tr.qty !== null && tr.qty > 0 ? tr.qty : outputRate}
                                        disabled={isReadOnly}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value);
                                          handleUpdateTreatmentQty(boq.id, tr.id, isNaN(val) ? 0 : val);
                                        }}
                                        title={`Qty SOW (Default: ${outputRate} ${displayUnit} mengikuti target produksi per hari). Durasi: ${(effectiveQty / outputRate).toFixed(2)} hari kerja`}
                                        style={{
                                          width: '70px',
                                          padding: '3px 6px',
                                          fontSize: '11px',
                                          textAlign: 'right',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          fontWeight: 'bold',
                                          color: '#0f172a',
                                          backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff',
                                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)'
                                        }}
                                      />
                                    </td>

                                    {/* Kolom Satuan / Unit SOW (Editable) */}
                                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                      <input
                                        type="text"
                                        value={displayUnit}
                                        disabled={isReadOnly}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleUpdateTreatmentUnit(boq.id, tr.id, e.target.value)}
                                        title="Satuan unit pekerjaan SOW"
                                        style={{
                                          width: '58px',
                                          padding: '3px 6px',
                                          fontSize: '11px',
                                          textAlign: 'center',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          fontWeight: '600',
                                          color: '#334155',
                                          backgroundColor: isReadOnly ? '#f8fafc' : '#ffffff'
                                        }}
                                      />
                                    </td>

                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                                      Rp {tr.crewDailyRate.toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                                      Rp {tr.equipmentDailyRate.toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#047857' }}>
                                      Rp {(tr.materialUnitRate || 0).toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#7c3aed' }}>
                                      Rp {tr.consumableUnitRate.toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a', background: '#f8fafc' }}>
                                      Rp {Math.round(dailySpread).toLocaleString('id-ID')}
                                    </td>
                                    <td 
                                      style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#2563eb' }}
                                      title={`Tarif Satuan SOW: Rp ${Math.round(dailySpread).toLocaleString('id-ID')} ÷ ${outputRate} ${displayUnit}/hari = Rp ${Math.round(trUnitCost).toLocaleString('id-ID')}`}
                                    >
                                      Rp {Math.round(trUnitCost).toLocaleString('id-ID')}
                                    </td>
                                    <td 
                                      style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857' }}
                                      title={`Total Biaya SOW: ${effectiveQty} ${displayUnit} × Rp ${Math.round(trUnitCost).toLocaleString('id-ID')} = Rp ${Math.round(treatmentTotal).toLocaleString('id-ID')}`}
                                    >
                                      Rp {Math.round(treatmentTotal).toLocaleString('id-ID')}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenTreatmentBreakdownModal(boq.id, tr, boq.qty, boq.unit, effectiveBoqOutput)}
                                          title={isReadOnly ? "Lihat rincian turunan resources" : "Edit detail turunan resources (Kru, Alat, Material, Consumables)"}
                                          style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', padding: '2px' }}
                                        >
                                          <Sliders size={14} />
                                        </button>
                                        {canDeleteBoq && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteTreatment(boq.id, tr.id)}
                                            title="Hapus treatment ini"
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Sub-Footer Ringkasan Komponen */}
                          <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ fontSize: '11px', color: '#475569' }}>
                              💡 <strong style={{ color: '#0f172a' }}>Kalkulasi SOW:</strong>{' '}
                              <span>
                                Total SOW Biaya Langsung: <strong style={{ color: '#047857' }}>Rp {Math.round(totalDirect).toLocaleString('id-ID')}</strong> ÷ Volume BoQ <strong style={{ color: '#0f172a' }}>{boq.qty.toLocaleString('id-ID')} {boq.unit}</strong> = <strong style={{ color: '#2563eb' }}>Rp {Math.round(unitPrice).toLocaleString('id-ID')} / {boq.unit}</strong>
                              </span>
                              <span style={{ marginLeft: '8px', color: '#64748b' }}>
                                (Total Daily Spread: Rp {Math.round(totalDailyRate).toLocaleString('id-ID')}/Hari | Header Output: {effectiveBoqOutput} {boq.unit}/Hari | Estimasi Durasi: <strong>{durationDays.toFixed(2)} Hari</strong>)
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                              <span>
                                Total Daily Spread: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>Rp {Math.round(totalDailyRate).toLocaleString('id-ID')}/Hari</strong>
                              </span>
                              <span style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '12px' }}>
                                Unit Price BoQ: <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>Rp {Math.round(unitPrice).toLocaleString('id-ID')} / {boq.unit}</strong>
                              </span>
                              <span style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '12px' }}>
                                Total Biaya BoQ: <strong style={{ color: '#047857', fontFamily: 'monospace' }}>Rp {Math.round(totalDirect).toLocaleString('id-ID')}</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. MODAL BUAT TENDER BARU */}
      {isNewTenderModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handleCreateTender} style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', fontFamily: 'Segoe UI, Tahoma, sans-serif', textAlign: 'left' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>Buat Folder Tender Baru</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>Kelompokkan BoQ berdasarkan paket tender proyek</p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Nama / Judul Tender</label>
              <input
                type="text"
                required
                placeholder="Contoh: WORKSHOP PIPING FABRICATION"
                value={newTenderTitle}
                onChange={(e) => setNewTenderTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Klien / Pemberi Kerja</label>
              <input
                type="text"
                placeholder="Contoh: PT Medco E&P / Pertamina"
                value={newTenderClient}
                onChange={(e) => setNewTenderClient(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Author / Penanggung Jawab Estimator</label>
              <input
                type="text"
                placeholder="Contoh: Ahmad Fauzi (Estimator)"
                value={newTenderAuthor}
                onChange={(e) => setNewTenderAuthor(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsNewTenderModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Simpan & Buka
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4A. MODAL LOGIN PENGGUNA & AUTH */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTenderId(''); // Default tender kosong saat login sesuai permintaan user
          handleSelectActiveAuthor(`${user.fullName} (${user.authorRole})`);
        }}
      />

      {/* 4A-2. MODAL OVERHEAD (INDIRECT COST) & REKAPITULASI KOMERSIAL */}
      <OverheadModal
        isOpen={isOverheadModalOpen}
        onClose={() => setIsOverheadModalOpen(false)}
        tenderTitle={activeTender.title}
        tenderClient={activeTender.client}
        totalDirectCost={currentGrandTotal}
        overheadItems={currentOverheadItems}
        onUpdateOverheadItems={handleUpdateOverheadItems}
        commercialConfig={currentCommercialConfig}
        onUpdateCommercialConfig={handleUpdateCommercialConfig}
        canEdit={!isReadOnly}
      />

      {/* 4B. MODAL TABEL MANAJEMEN PENGGUNA & AUTHOR */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        currentUser={currentUser}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          handleSelectActiveAuthor(`${user.fullName} (${user.authorRole})`);
        }}
        onSelectActiveAuthor={handleSelectActiveAuthor}
        currentAuthor={activeTender.author}
        onOpenCloudModal={() => {
          setIsUserModalOpen(false);
          setIsCloudModalOpen(true);
        }}
      />

      {/* 4C. MODAL KONEKSI CLOUD DATA */}
      <CloudConnectionModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentUser={currentUser}
        onSwitchToAuthorizedRole={(role) => {
          const match = DEFAULT_USERS.find(u => u.authorRole === role);
          if (match) {
            setCurrentUser(match);
            handleSelectActiveAuthor(`${match.fullName} (${match.authorRole})`);
          }
        }}
      />

      {/* 5. MODAL IMPORT EXCEL */}
      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportConfirm={handleImportSuccess}
      />

      {/* 6. DRAWER KATALOG BASE TREATMENT */}
      <TreatmentCatalogDrawer
        isOpen={isDrawerOpen}
        boqItem={targetBoqForDrawer}
        allBoqItems={activeTender?.boqList || []}
        onClose={() => {
          setIsDrawerOpen(false);
          setTargetBoqForDrawer(null);
        }}
        onAddTreatment={handleAddTreatment}
        onBatchAddTreatment={handleBatchAddTreatment}
      />

      {/* 7. MODAL EDIT DETAIL TURUNAN RESOURCES */}
      {isTreatmentModalOpen && activeTreatmentForModal && (
        <ResourceBreakdownModal
          key={`${activeTreatmentForModal.boqId}-${activeTreatmentForModal.treatment.id}`}
          isOpen={isTreatmentModalOpen}
          treatment={activeTreatmentForModal.treatment}
          boqQty={activeTreatmentForModal.boqQty}
          boqUnit={activeTreatmentForModal.boqUnit}
          boqOutputPerDay={activeTreatmentForModal.boqOutputPerDay || 1}
          allBoqItems={activeTender?.boqList || []}
          onClose={() => {
            setIsTreatmentModalOpen(false);
            setActiveTreatmentForModal(null);
          }}
          onSave={handleSaveTreatmentBreakdown}
        />
      )}

      {/* 8. NOTIFIKASI SINKRONISASI RESOURCE PROYEK */}
      {syncNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999999,
          background: '#0f172a',
          color: '#ffffff',
          border: '1px solid #10b981',
          borderLeft: '5px solid #10b981',
          padding: '12px 18px',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '450px',
          fontSize: '12px'
        }}>
          <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: '#6ee7b7', marginBottom: '2px' }}>Sinkronisasi Berhasil</div>
            <div style={{ color: '#cbd5e1' }}>{syncNotification.message}</div>
          </div>
          <button
            onClick={() => setSyncNotification(null)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}