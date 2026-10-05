import React, { useState, useMemo } from 'react';
import { 
  Building, Plus, Trash2, X, Calculator, 
  Layers, Search, Clock, RotateCcw, TrendingUp
} from 'lucide-react';
import { 
  BASE_OVERHEAD_CATALOG, 
  OVERHEAD_CATEGORIES,
  type OverheadCategory,
  type OverheadTemplateItem 
} from '../data/overheadCatalog';

export interface OverheadItem {
  id: string;
  category: OverheadCategory;
  name: string;
  qty: number;
  unit: string;
  unitRate: number;
  notes?: string;
}

export interface CommercialSummaryConfig {
  contingencyPercent: number; // e.g. 3% (Kontinjensi / Risiko)
  profitMarginPercent: number; // e.g. 10% (Margin Keuntungan)
  taxPercent: number; // e.g. 11% (PPN)
  includeTaxInBid: boolean; // toggle tampilkan penawaran dengan PPN
  projectDurationMonths?: number; // Default durasi proyek (Bulan)
}

// Helper untuk mendeteksi apakah satuan bertipe durasi bulanan
export const isMonthlyUnit = (unit: string): boolean => {
  const u = (unit || '').trim().toLowerCase();
  return u === 'bulan' || u === 'bln' || u === 'month' || u === 'months' || u === 'orang-bulan' || u === 'orang/bulan' || u === 'ob';
};

interface OverheadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderTitle: string;
  tenderClient: string;
  totalDirectCost: number;
  overheadItems: OverheadItem[];
  onUpdateOverheadItems: (items: OverheadItem[]) => void;
  commercialConfig: CommercialSummaryConfig;
  onUpdateCommercialConfig: (config: CommercialSummaryConfig) => void;
  canEdit: boolean;
}

export const OverheadModal: React.FC<OverheadModalProps> = ({
  isOpen,
  onClose,
  tenderTitle,
  tenderClient,
  totalDirectCost,
  overheadItems = [],
  onUpdateOverheadItems,
  commercialConfig,
  onUpdateCommercialConfig,
  canEdit
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'summary'>('items');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [isCatalogDrawerOpen, setIsCatalogDrawerOpen] = useState(false);

  // Search & Filter di Drawer Katalog
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('All');

  // Default Durasi Proyek (Bulan) dari header konfigurasi
  const defaultMonths = Math.max(1, commercialConfig.projectDurationMonths || 1);

  // Form Custom Item Modal
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState<OverheadCategory>('Manajemen & Pengawasan');
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState<number>(defaultMonths);
  const [customUnit, setCustomUnit] = useState('Bulan');
  const [customRate, setCustomRate] = useState<number>(0);
  const [customNotes, setCustomNotes] = useState('');

  // Identifikasi item bulanan
  const monthlyItems = useMemo(() => {
    return overheadItems.filter(item => isMonthlyUnit(item.unit));
  }, [overheadItems]);

  const monthlyCount = monthlyItems.length;

  const customMonthlyCount = useMemo(() => {
    return monthlyItems.filter(item => item.qty !== defaultMonths).length;
  }, [monthlyItems, defaultMonths]);

  // Perhitungan Keuangan Dinamis
  const totalIndirectCost = useMemo(() => {
    return overheadItems.reduce((sum, item) => sum + (item.qty * item.unitRate), 0);
  }, [overheadItems]);

  const financialCalculations = useMemo(() => {
    const direct = totalDirectCost;
    const indirect = totalIndirectCost;
    const baseCogs = direct + indirect; // Total Pokok Biaya (HPP)

    const contingencyAmt = baseCogs * ((commercialConfig.contingencyPercent || 0) / 100);
    const subtotalWithContingency = baseCogs + contingencyAmt;

    const profitMarginAmt = subtotalWithContingency * ((commercialConfig.profitMarginPercent || 0) / 100);
    const bidBeforeTax = subtotalWithContingency + profitMarginAmt;

    const taxAmt = commercialConfig.includeTaxInBid 
      ? bidBeforeTax * ((commercialConfig.taxPercent || 0) / 100) 
      : 0;

    const grandTotalBid = bidBeforeTax + taxAmt;

    const indirectRatio = baseCogs > 0 ? (indirect / baseCogs) * 100 : 0;
    const directRatio = baseCogs > 0 ? (direct / baseCogs) * 100 : 0;

    return {
      direct,
      indirect,
      baseCogs,
      contingencyAmt,
      subtotalWithContingency,
      profitMarginAmt,
      bidBeforeTax,
      taxAmt,
      grandTotalBid,
      directRatio,
      indirectRatio
    };
  }, [totalDirectCost, totalIndirectCost, commercialConfig]);

  // Filtered Catalog Items berdasarkan search dan kategori
  const filteredCatalogTemplates = useMemo(() => {
    return BASE_OVERHEAD_CATALOG.filter(item => {
      if (catalogCategoryFilter !== 'All' && item.category !== catalogCategoryFilter) {
        return false;
      }
      if (!catalogSearchQuery.trim()) return true;
      const query = catalogSearchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.defaultUnit.toLowerCase().includes(query)
      );
    });
  }, [catalogCategoryFilter, catalogSearchQuery]);

  if (!isOpen) return null;

  // Filtered Items Tabel
  const filteredItems = overheadItems.filter(item => {
    if (selectedCategoryFilter === 'All') return true;
    return item.category === selectedCategoryFilter;
  });

  // Handler: Update Default Bulan Proyek di Header
  const handleDefaultMonthsChange = (newMonths: number) => {
    if (!canEdit) return;
    const valid = Math.max(1, newMonths);
    onUpdateCommercialConfig({
      ...commercialConfig,
      projectDurationMonths: valid
    });
  };

  // Handler: Samakan seluruh item bulanan ke default durasi proyek
  const handleSyncAllMonthlyItems = () => {
    if (!canEdit) return;
    const updated = overheadItems.map(item => {
      if (isMonthlyUnit(item.unit)) {
        return {
          ...item,
          qty: defaultMonths
        };
      }
      return item;
    });
    onUpdateOverheadItems(updated);
  };

  // Handler: Kembalikan 1 item spesifik ke default durasi proyek
  const handleResetItemToDefaultDuration = (itemId: string) => {
    if (!canEdit) return;
    const updated = overheadItems.map(item => {
      if (item.id === itemId && isMonthlyUnit(item.unit)) {
        return {
          ...item,
          qty: defaultMonths
        };
      }
      return item;
    });
    onUpdateOverheadItems(updated);
  };

  // Handler: Tambah item dari Katalog Master (otomatis pakai default durasi jika unit bulanan)
  const handleAddFromCatalog = (template: OverheadTemplateItem) => {
    const isMonthly = isMonthlyUnit(template.defaultUnit);
    const initialQty = isMonthly ? defaultMonths : template.defaultQty;
    const newItem: OverheadItem = {
      id: `oh-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category: template.category,
      name: template.name,
      qty: initialQty,
      unit: template.defaultUnit,
      unitRate: template.benchmarkRate,
      notes: template.description
    };
    onUpdateOverheadItems([...overheadItems, newItem]);
  };

  // Handler: Terapkan template paket lengkap industri standar (1-klik)
  const handleApplyDefaultIndustrialPackage = () => {
    const popularTemplates = BASE_OVERHEAD_CATALOG.filter(t => t.isPopular);
    const newItems: OverheadItem[] = popularTemplates.map((t, idx) => {
      const isMonthly = isMonthlyUnit(t.defaultUnit);
      return {
        id: `oh-pkg-${Date.now()}-${idx}`,
        category: t.category,
        name: t.name,
        qty: isMonthly ? defaultMonths : t.defaultQty,
        unit: t.defaultUnit,
        unitRate: t.benchmarkRate,
        notes: t.description
      };
    });

    onUpdateOverheadItems([...overheadItems, ...newItems]);
    setIsCatalogDrawerOpen(false);
  };

  // Handler: Buka modal custom item baru
  const handleOpenCustomItemModal = () => {
    setCustomCategory('Manajemen & Pengawasan');
    setCustomName('');
    setCustomUnit('Bulan');
    setCustomQty(defaultMonths);
    setCustomRate(0);
    setCustomNotes('');
    setIsCustomFormOpen(true);
  };

  // Handler: Submit Custom Item
  const handleSaveCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newItem: OverheadItem = {
      id: `oh-custom-${Date.now()}`,
      category: customCategory,
      name: customName.trim(),
      qty: customQty,
      unit: customUnit.trim() || 'LS',
      unitRate: customRate,
      notes: customNotes.trim()
    };

    onUpdateOverheadItems([...overheadItems, newItem]);
    setIsCustomFormOpen(false);
  };

  // Handler: Update Qty / Rate inline
  const handleUpdateItemValue = (id: string, field: 'qty' | 'unitRate' | 'notes', val: number | string) => {
    if (!canEdit) return;
    onUpdateOverheadItems(overheadItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    }));
  };

  // Handler: Hapus item
  const handleDeleteItem = (id: string) => {
    if (!canEdit) return;
    onUpdateOverheadItems(overheadItems.filter(item => item.id !== id));
  };

  const getCategoryBadgeColor = (cat: OverheadCategory) => {
    switch (cat) {
      case 'Manajemen & Pengawasan': return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
      case 'Fasilitas & Utilitas Lapangan': return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' };
      case 'HSE & Keselamatan Kerja': return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
      case 'Mobilisasi & Akomodasi': return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
      case 'Asuransi, Legal & Jaminan': return { bg: '#fdf4ff', text: '#86198f', border: '#f0abfc' };
      case 'Testing & Inspeksi Pihak Ketiga': return { bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' };
      case 'Head Office Support (G&A)': return { bg: '#f8fafc', text: '#334155', border: '#cbd5e1' };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.78)',
      backdropFilter: 'blur(5px)',
      zIndex: 99998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '1080px',
        maxHeight: '92vh',
        borderRadius: '14px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        textAlign: 'left'
      }}>
        {/* HEADER MODAL */}
        <div style={{
          backgroundColor: '#0f172a',
          padding: '16px 24px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #3b82f6',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              backgroundColor: '#1e293b',
              padding: '9px',
              borderRadius: '8px',
              color: '#38bdf8',
              display: 'flex',
              flexShrink: 0
            }}>
              <Building size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                  Indirect Cost (Overhead / OH) & Rekapitulasi Komersial
                </h2>
                <span style={{ fontSize: '11px', backgroundColor: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                  Proyek: {tenderTitle}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Klien: {tenderClient} • Manajemen biaya tidak langsung, fasilitas site, K3L, asuransi, markup margin & PPN
              </p>
            </div>
          </div>

          {/* Right Header Area: Default Durasi Bulan Proyek & Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            {/* Control Durasi Proyek Default */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#1e293b',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}>
              <Clock size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Default Durasi Proyek
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    disabled={!canEdit}
                    value={defaultMonths}
                    onChange={(e) => handleDefaultMonthsChange(parseInt(e.target.value) || 1)}
                    style={{
                      width: '45px',
                      backgroundColor: '#0f172a',
                      color: '#fbbf24',
                      border: '1px solid #475569',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 'bold' }}>Bulan</span>
                  
                  {canEdit && (
                    <button
                      onClick={handleSyncAllMonthlyItems}
                      title={`Terapkan durasi ${defaultMonths} bulan ini ke seluruh ${monthlyCount} item bulanan`}
                      disabled={monthlyCount === 0}
                      style={{
                        marginLeft: '4px',
                        backgroundColor: monthlyCount > 0 ? '#2563eb' : '#334155',
                        color: monthlyCount > 0 ? '#ffffff' : '#64748b',
                        border: 'none',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: monthlyCount > 0 ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <RotateCcw size={11} />
                      Set Semua ({monthlyCount})
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              title="Tutup Modal"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('items')}
            style={{
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: activeTab === 'items' ? 'bold' : '500',
              color: activeTab === 'items' ? '#2563eb' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'items' ? '2px solid #2563eb' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Layers size={16} />
            Rincian Item Overhead ({overheadItems.length})
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            style={{
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: activeTab === 'summary' ? 'bold' : '500',
              color: activeTab === 'summary' ? '#2563eb' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'summary' ? '2px solid #2563eb' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Calculator size={16} />
            Rekapitulasi Harga Penawaran (Bid Summary)
          </button>
        </div>

        {/* CONTENT BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          
          {/* TAB 1: RINCIAN ITEM OVERHEAD */}
          {activeTab === 'items' && (
            <div>
              {/* Ringkasan Overhead Card (4 Kolom Terpadu) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '12px',
                marginBottom: '18px'
              }}>
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Total Direct Cost (BoQ)
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace', marginTop: '4px' }}>
                    Rp {totalDirectCost.toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '12px 16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Total Indirect Cost (Overhead)
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1d4ed8', fontFamily: 'monospace', marginTop: '4px' }}>
                    Rp {totalIndirectCost.toLocaleString('id-ID')}
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px'
                }}>
                  <div style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Rasio Overhead terhadap Direct
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#15803d', fontFamily: 'monospace', marginTop: '4px' }}>
                    {totalDirectCost > 0 ? ((totalIndirectCost / totalDirectCost) * 100).toFixed(1) : 0}%
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: '10px',
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#854d0e', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      Durasi Default Proyek
                    </div>
                    <Clock size={14} style={{ color: '#ca8a04' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#a16207', fontFamily: 'monospace' }}>
                      {defaultMonths} Bulan
                    </span>
                    <span style={{ fontSize: '11px', color: '#854d0e' }}>
                      ({monthlyCount} item bulanan)
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#713f12', marginTop: '4px' }}>
                    {customMonthlyCount > 0 ? (
                      <span style={{ color: '#c2410c', fontWeight: 'bold' }}>
                        ⚠️ {customMonthlyCount} item durasi khusus
                      </span>
                    ) : (
                      <span style={{ color: '#15803d', fontWeight: '600' }}>
                        ✓ Semua item sesuai default
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar & Filter */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '14px'
              }}>
                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSelectedCategoryFilter('All')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: selectedCategoryFilter === 'All' ? 'bold' : 'normal',
                      backgroundColor: selectedCategoryFilter === 'All' ? '#0f172a' : '#f1f5f9',
                      color: selectedCategoryFilter === 'All' ? '#fff' : '#475569',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Semua ({overheadItems.length})
                  </button>
                  {OVERHEAD_CATEGORIES.map(cat => {
                    const count = overheadItems.filter(i => i.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: selectedCategoryFilter === cat ? 'bold' : 'normal',
                          backgroundColor: selectedCategoryFilter === cat ? '#2563eb' : '#f1f5f9',
                          color: selectedCategoryFilter === cat ? '#fff' : '#475569',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {cat} {count > 0 ? `(${count})` : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Tombol Tambah */}
                {canEdit && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setIsCatalogDrawerOpen(true)}
                      style={{
                        backgroundColor: '#0f172a',
                        color: '#fbbf24',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} />
                      Katalog Master OH
                    </button>
                    <button
                      onClick={handleOpenCustomItemModal}
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '7px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} />
                      + Item Kustom
                    </button>
                  </div>
                )}
              </div>

              {/* Tabel Item Overhead */}
              {filteredItems.length === 0 ? (
                <div style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  backgroundColor: '#f8fafc'
                }}>
                  <Building size={40} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                  <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#1e293b' }}>
                    Belum Ada Item Overhead di Proyek Ini
                  </h4>
                  <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#64748b' }}>
                    Panggil item overhead standar industri (PM, Direksi Keet, K3, Mess, Asuransi CAR) atau tambahkan item kustom.
                  </p>
                  {canEdit && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <button
                        onClick={handleApplyDefaultIndustrialPackage}
                        style={{
                          backgroundColor: '#059669',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        ⚡ Pasang Paket Standar Migas/EPC (1-Klik)
                      </button>
                      <button
                        onClick={() => setIsCatalogDrawerOpen(true)}
                        style={{
                          backgroundColor: '#0f172a',
                          color: '#fbbf24',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Buka Katalog Lengkap
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  overflowX: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', width: '40px' }}>No</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', width: '160px' }}>Kategori</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left' }}>Deskripsi Item Overhead</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', width: '105px' }}>Qty</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '70px' }}>Satuan</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', width: '130px' }}>Tarif Satuan (Rp)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', width: '140px' }}>Subtotal (Rp)</th>
                        {canEdit && <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => {
                        const subtotal = item.qty * item.unitRate;
                        const badge = getCategoryBadgeColor(item.category);
                        const isMonthly = isMonthlyUnit(item.unit);
                        const isCustomDuration = isMonthly && item.qty !== defaultMonths;

                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 12px', color: '#64748b' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.border}`,
                                whiteSpace: 'nowrap'
                              }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</div>
                              {item.notes && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  {item.notes}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                              {isMonthly ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {canEdit ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={item.qty}
                                        onChange={(e) => handleUpdateItemValue(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                        style={{
                                          width: '52px',
                                          padding: '3px 6px',
                                          borderRadius: '4px',
                                          border: isCustomDuration ? '1.5px solid #f59e0b' : '1px solid #cbd5e1',
                                          backgroundColor: isCustomDuration ? '#fffbeb' : '#ffffff',
                                          textAlign: 'right',
                                          fontFamily: 'monospace',
                                          fontSize: '12px',
                                          fontWeight: 'bold',
                                          color: isCustomDuration ? '#b45309' : '#0f172a'
                                        }}
                                      />
                                    ) : (
                                      <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.qty}</span>
                                    )}
                                    {canEdit && isCustomDuration && (
                                      <button
                                        onClick={() => handleResetItemToDefaultDuration(item.id)}
                                        title={`Kembalikan durasi ke default proyek (${defaultMonths} Bulan)`}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#b45309',
                                          cursor: 'pointer',
                                          padding: '1px',
                                          display: 'inline-flex'
                                        }}
                                      >
                                        <RotateCcw size={12} />
                                      </button>
                                    )}
                                  </div>
                                  {isCustomDuration ? (
                                    <span style={{
                                      fontSize: '9px',
                                      color: '#b45309',
                                      backgroundColor: '#fef3c7',
                                      border: '1px solid #fde68a',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                      fontWeight: 'bold',
                                      whiteSpace: 'nowrap'
                                    }} title={`Durasi khusus berbeda dari default proyek (${defaultMonths} Bulan)`}>
                                      Khusus ({item.qty} Bln)
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '9px',
                                      color: '#2563eb',
                                      backgroundColor: '#eff6ff',
                                      border: '1px solid #bfdbfe',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                      fontWeight: 'bold',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      Default ({defaultMonths} Bln)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                canEdit ? (
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={item.qty}
                                    onChange={(e) => handleUpdateItemValue(item.id, 'qty', parseFloat(e.target.value) || 0)}
                                    style={{
                                      width: '52px',
                                      padding: '3px 6px',
                                      borderRadius: '4px',
                                      border: '1px solid #cbd5e1',
                                      textAlign: 'right',
                                      fontFamily: 'monospace',
                                      fontSize: '12px',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{item.qty}</span>
                                )
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                              {item.unit}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              {canEdit ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={item.unitRate}
                                  onChange={(e) => handleUpdateItemValue(item.id, 'unitRate', parseFloat(e.target.value) || 0)}
                                  style={{
                                    width: '110px',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    textAlign: 'right',
                                    fontFamily: 'monospace',
                                    fontSize: '12px'
                                  }}
                                />
                              ) : (
                                <span style={{ fontFamily: 'monospace' }}>Rp {item.unitRate.toLocaleString('id-ID')}</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#0f172a' }}>
                              Rp {subtotal.toLocaleString('id-ID')}
                            </td>
                            {canEdit && (
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  title="Hapus Item Overhead"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'inline-flex'
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Subtotal Footer */}
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#f8fafc',
                    borderTop: '2px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 'bold'
                  }}>
                    <span style={{ color: '#64748b' }}>Total Terhitung ({filteredItems.length} item)</span>
                    <span style={{ fontSize: '15px', color: '#1d4ed8', fontFamily: 'monospace' }}>
                      Rp {filteredItems.reduce((s, i) => s + (i.qty * i.unitRate), 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REKAPITULASI KOMERSIAL & BID PRICE */}
          {activeTab === 'summary' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '20px',
                alignItems: 'start'
              }}>
                {/* Kolom Kiri: Tabel Waterfall Kalkulasi */}
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calculator size={18} style={{ color: '#2563eb' }} />
                    Komponen Struktur Harga Penawaran Tender
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* 1. Direct Cost */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>1. Total Direct Cost (Biaya Langsung)</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Tenaga Kerja, Peralatan, Material Utama & Consumables</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
                        Rp {financialCalculations.direct.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* 2. Indirect Cost */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#eff6ff', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1d4ed8' }}>2. Total Indirect Cost (Overhead / OH)</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>PM, Site Office, K3L, Mess, Akomodasi, Mobilisasi & Asuransi</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#1d4ed8' }}>
                        Rp {financialCalculations.indirect.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* 3. Base COGS Subtotal */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', borderLeft: '4px solid #64748b' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        Total Base Cost (HPP / Biaya Pokok) [1 + 2]
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>
                        Rp {financialCalculations.baseCogs.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* 4. Kontinjensi */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#fffbeb', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#92400e' }}>
                          3. Cadangan Kontinjensi & Risiko ({commercialConfig.contingencyPercent}%)
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Buffer fluktuasi cuaca, harga material, & risiko lapangan</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#b45309' }}>
                        Rp {Math.round(financialCalculations.contingencyAmt).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* 5. Margin Keuntungan */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#15803d' }}>
                          4. Target Profit Margin / Keuntungan ({commercialConfig.profitMarginPercent}%)
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Laba bersih operasional perusahaan</div>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#15803d' }}>
                        Rp {Math.round(financialCalculations.profitMarginAmt).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* 6. Penawaran Sebelum Pajak */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', borderTop: '2px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        Harga Penawaran Sebelum Pajak (Excl. PPN)
                      </div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>
                        Rp {Math.round(financialCalculations.bidBeforeTax).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* 7. PPN */}
                    {commercialConfig.includeTaxInBid && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#faf5ff', borderRadius: '6px' }}>
                        <div style={{ fontWeight: '600', color: '#7e22ce' }}>
                          Pajak Pertambahan Nilai (PPN {commercialConfig.taxPercent}%)
                        </div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', color: '#7e22ce' }}>
                          Rp {Math.round(financialCalculations.taxAmt).toLocaleString('id-ID')}
                        </div>
                      </div>
                    )}

                    {/* 8. GRAND TOTAL RESMI PENAWARAN */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      borderRadius: '8px',
                      borderLeft: '5px solid #f59e0b',
                      marginTop: '6px'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          Grand Total Penawaran Tender Resmi
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                          {commercialConfig.includeTaxInBid ? 'Sudah Termasuk PPN' : 'Belum Termasuk PPN'}
                        </div>
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#fbbf24', fontFamily: 'monospace' }}>
                        Rp {Math.round(financialCalculations.grandTotalBid).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Pengaturan Parameter Margin & Visual Proporsi */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Card Setting Parameter */}
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 'bold', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={16} style={{ color: '#16a34a' }} />
                      Parameter Margin & Pajak Tender
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Kontinjensi */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#334155' }}>Cadangan Kontinjensi / Risiko:</span>
                          <span style={{ fontWeight: 'bold', color: '#b45309' }}>{commercialConfig.contingencyPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          step="0.5"
                          disabled={!canEdit}
                          value={commercialConfig.contingencyPercent}
                          onChange={(e) => onUpdateCommercialConfig({ ...commercialConfig, contingencyPercent: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                        />
                      </div>

                      {/* Profit Margin */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600', color: '#334155' }}>Target Margin Keuntungan:</span>
                          <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{commercialConfig.profitMarginPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="30"
                          step="0.5"
                          disabled={!canEdit}
                          value={commercialConfig.profitMarginPercent}
                          onChange={(e) => onUpdateCommercialConfig({ ...commercialConfig, profitMarginPercent: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                        />
                      </div>

                      {/* Pajak PPN */}
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              disabled={!canEdit}
                              checked={commercialConfig.includeTaxInBid}
                              onChange={(e) => onUpdateCommercialConfig({ ...commercialConfig, includeTaxInBid: e.target.checked })}
                            />
                            Sertakan PPN dalam Grand Total
                          </label>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>Tarif:</span>
                            <select
                              disabled={!canEdit || !commercialConfig.includeTaxInBid}
                              value={commercialConfig.taxPercent}
                              onChange={(e) => onUpdateCommercialConfig({ ...commercialConfig, taxPercent: parseFloat(e.target.value) || 11 })}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              <option value="11">11% (Standar)</option>
                              <option value="12">12% (UU HPP)</option>
                              <option value="0">0% (Bebas PPN)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Proporsi Biaya */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px'
                  }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
                      Proporsi Biaya Pokok (HPP)
                    </h4>
                    
                    {/* Visual Bar */}
                    <div style={{ height: '14px', borderRadius: '7px', overflow: 'hidden', display: 'flex', marginBottom: '8px' }}>
                      <div style={{ width: `${financialCalculations.directRatio}%`, backgroundColor: '#3b82f6' }} title={`Direct Cost: ${financialCalculations.directRatio.toFixed(1)}%`} />
                      <div style={{ width: `${financialCalculations.indirectRatio}%`, backgroundColor: '#f59e0b' }} title={`Indirect Cost: ${financialCalculations.indirectRatio.toFixed(1)}%`} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#2563eb', fontWeight: 'bold' }}>
                        Direct: {financialCalculations.directRatio.toFixed(1)}%
                      </span>
                      <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                        Overhead: {financialCalculations.indirectRatio.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

        </div>

        {/* MODAL / DRAWER KATALOG MASTER OH */}
        {isCatalogDrawerOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 999999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '540px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 25px rgba(0,0,0,0.2)',
              textAlign: 'left'
            }}>
              <div style={{
                backgroundColor: '#0f172a',
                padding: '16px 20px',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #334155'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Katalog Master Overhead (OH)</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>Pilih item untuk dimasukkan ke kalkulasi tender</p>
                </div>
                <button
                  onClick={() => setIsCatalogDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* SEARCH FILTER & KATEGORI DI KATALOG */}
              <div style={{
                padding: '14px 18px',
                backgroundColor: '#f8fafc',
                borderBottom: '1px solid #e2e8f0'
              }}>
                {/* Search Bar Input */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Cari item overhead... (cth: PM, genset, keet, APD, mobilisasi)"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 34px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  {catalogSearchQuery && (
                    <button
                      onClick={() => setCatalogSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Pills Kategori */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                  <button
                    onClick={() => setCatalogCategoryFilter('All')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: catalogCategoryFilter === 'All' ? 'bold' : 'normal',
                      backgroundColor: catalogCategoryFilter === 'All' ? '#0f172a' : '#ffffff',
                      color: catalogCategoryFilter === 'All' ? '#ffffff' : '#475569',
                      border: '1px solid #cbd5e1',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Semua ({BASE_OVERHEAD_CATALOG.length})
                  </button>
                  {OVERHEAD_CATEGORIES.map(cat => {
                    const count = BASE_OVERHEAD_CATALOG.filter(c => c.category === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCatalogCategoryFilter(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: catalogCategoryFilter === cat ? 'bold' : 'normal',
                          backgroundColor: catalogCategoryFilter === cat ? '#2563eb' : '#ffffff',
                          color: catalogCategoryFilter === cat ? '#ffffff' : '#475569',
                          border: catalogCategoryFilter === cat ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {cat} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Indikator Default Durasi Proyek */}
                <div style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: '#2563eb' }} />
                    <span>Item bulanan otomatis diset: <strong>{defaultMonths} Bulan</strong></span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold' }}>Sesuai Header</span>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                {filteredCatalogTemplates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Search size={32} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Item Tidak Ditemukan</div>
                    <div style={{ fontSize: '11px', marginTop: '4px' }}>
                      Tidak ada item overhead yang cocok dengan pencarian "{catalogSearchQuery}"
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {filteredCatalogTemplates.map((item) => {
                      const isAlreadyAdded = overheadItems.some(i => i.name === item.name);
                      const badge = getCategoryBadgeColor(item.category);
                      const isMonthly = isMonthlyUnit(item.defaultUnit);
                      const previewEstTotal = isMonthly ? item.benchmarkRate * defaultMonths : item.benchmarkRate * item.defaultQty;

                      return (
                        <div
                          key={item.id}
                          style={{
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 'bold',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              backgroundColor: badge.bg,
                              color: badge.text,
                              border: `1px solid ${badge.border}`
                            }}>
                              {item.category}
                            </span>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {item.description}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>
                                Rp {item.benchmarkRate.toLocaleString('id-ID')} / {item.defaultUnit}
                              </span>
                              {isMonthly && (
                                <span style={{
                                  fontSize: '11px',
                                  color: '#1e40af',
                                  backgroundColor: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontWeight: '600'
                                }}>
                                  Est: Rp {previewEstTotal.toLocaleString('id-ID')} ({defaultMonths} Bln)
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddFromCatalog(item)}
                            disabled={!canEdit}
                            style={{
                              backgroundColor: isAlreadyAdded ? '#e2e8f0' : '#2563eb',
                              color: isAlreadyAdded ? '#64748b' : '#ffffff',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              cursor: canEdit ? 'pointer' : 'not-allowed',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isAlreadyAdded ? '+ Tambah Lagi' : '+ Masukkan'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL FORM CUSTOM ITEM OH */}
        {isCustomFormOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <form onSubmit={handleSaveCustomItem} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '20px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              textAlign: 'left'
            }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                Tambah Item Overhead Kustom
              </h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Kategori Overhead
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as OverheadCategory)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  {OVERHEAD_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Nama Item / Deskripsi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sewa Generator Kantor 30 kVA"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Kuantitas (Qty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={customQty}
                    onChange={(e) => setCustomQty(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bulan / LS / Paket"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Tarif Satuan (IDR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="Rp 0"
                  value={customRate}
                  onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan spesifikasi teknis"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCustomFormOpen(false)}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Simpan Item
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
