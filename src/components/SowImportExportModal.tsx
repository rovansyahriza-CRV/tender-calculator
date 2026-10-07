import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Check,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import type { BaseTreatmentTemplate } from '../data/treatmentCatalog';
import { 
  downloadSowTemplate, 
  exportSowCatalogExcel, 
  parseSowExcel, 
  type ParsedSowResult 
} from '../utils/sowExcelManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentCatalog: BaseTreatmentTemplate[];
  existingCategories: string[];
  onImportComplete: (importedItems: BaseTreatmentTemplate[], mode: 'append' | 'replace', newCategories: string[]) => void;
}

export const SowImportExportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentCatalog,
  existingCategories,
  onImportComplete
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  
  // Import state
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedSowResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Export state
  const [exportCategoryFilter, setExportCategoryFilter] = useState<string>('Semua');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsParsing(true);
    setImportError('');
    setParsedData(null);

    try {
      const result = await parseSowExcel(file);
      if (result.items.length === 0) {
        setImportError('File Excel tidak memiliki baris SOW yang valid. Pastikan format kolom sesuai template.');
      } else {
        setParsedData(result);
      }
    } catch (err: any) {
      console.error('Error membaca file Excel SOW:', err);
      setImportError(err.message || 'Gagal memproses file Excel. Pastikan format file .xlsx valid.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleExecuteImport = () => {
    if (!parsedData || parsedData.items.length === 0) return;

    // Detect new categories not in existing categories
    const existingLower = new Set(existingCategories.map(c => c.toLowerCase()));
    const newlyDiscoveredCategories = parsedData.categories.filter(c => !existingLower.has(c.toLowerCase()));

    onImportComplete(parsedData.items, importMode, newlyDiscoveredCategories);
    
    // Reset state & close
    setParsedData(null);
    setSelectedFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const handleExport = () => {
    exportSowCatalogExcel(currentCatalog, exportCategoryFilter);
  };

  const newCategoriesDetected = parsedData 
    ? parsedData.categories.filter(c => !existingCategories.map(ec => ec.toLowerCase()).includes(c.toLowerCase()))
    : [];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100000,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden',
        border: '1px solid #cbd5e1'
      }}>
        {/* Modal Header */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #f59e0b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: '#f59e0b',
              color: '#0f172a',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>
                Import & Export SOW Base Treatment (Excel)
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Setup Kategori & SOW secara massal lewat spreadsheet Excel (.xlsx)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
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

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'import' ? '3px solid #f59e0b' : '3px solid transparent',
              color: activeTab === 'import' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'import' ? 'bold' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Upload size={16} color={activeTab === 'import' ? '#f59e0b' : '#64748b'} />
            📥 Import SOW dari Excel
          </button>
          <button
            onClick={() => setActiveTab('export')}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'export' ? '3px solid #f59e0b' : '3px solid transparent',
              color: activeTab === 'export' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'export' ? 'bold' : '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={16} color={activeTab === 'export' ? '#f59e0b' : '#64748b'} />
            📤 Export SOW ke Excel
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          {activeTab === 'import' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Step Flow Card */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>
                    💡 Urutan Kerja Praktis:
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      1. Susun Kategori & SOW di Excel
                    </span>
                    <span>➔</span>
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      2. Import (Opsi Tambah / Ganti)
                    </span>
                    <span>➔</span>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      3. Input Detail Resources Regular
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadSowTemplate}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <Download size={14} />
                  Download Template SOW (.xlsx)
                </button>
              </div>

              {/* Mode Selection (Add vs Replace) */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '14px 18px'
              }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                  Pilih Opsi Metode Import:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Option: Append */}
                  <div 
                    onClick={() => setImportMode('append')}
                    style={{
                      border: importMode === 'append' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      backgroundColor: importMode === 'append' ? '#f0fdf4' : '#ffffff',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="importMode" 
                      checked={importMode === 'append'} 
                      onChange={() => setImportMode('append')}
                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#10b981' }} 
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PlusCircle size={15} />
                        Tambahkan ke Katalog (Add / Append)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', lineHeight: '1.4' }}>
                        Pertahankan template yang sudah ada. Menambahkan SOW baru dari Excel (jika nama & kategori sudah ada, datanya diperbarui).
                      </div>
                    </div>
                  </div>

                  {/* Option: Replace */}
                  <div 
                    onClick={() => setImportMode('replace')}
                    style={{
                      border: importMode === 'replace' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                      backgroundColor: importMode === 'replace' ? '#fef2f2' : '#ffffff',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="importMode" 
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')}
                      style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#ef4444' }} 
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={15} />
                        Ganti Semua Template (Replace)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', lineHeight: '1.4' }}>
                        Ganti seluruh template kustom dengan baris baru dari Excel ini. Master preset bawaan tetap aman.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                    <Upload size={22} />
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    {selectedFileName ? `File Terpilih: ${selectedFileName}` : 'Klik untuk Memilih File Excel SOW (.xlsx)'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Mendukung file Excel format Microsoft Excel (.xlsx / .xls)
                  </div>
                </div>
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div style={{ padding: '12px', textAlign: 'center', color: '#0369a1', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <RefreshCw size={16} className="animate-spin" />
                  Membaca dan memverifikasi data Excel SOW...
                </div>
              )}

              {/* Import Error Banner */}
              {importError && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: '#991b1b',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={18} color="#dc2626" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedData && parsedData.items.length > 0 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Summary Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} color="#10b981" />
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
                        {parsedData.items.length} Baris SOW Berhasil Dibaca
                      </span>
                      <span style={{ fontSize: '11px', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>
                        {parsedData.categories.length} Kategori
                      </span>
                    </div>

                    {newCategoriesDetected.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '600' }}>
                          ✨ Kategori Baru Terdeteksi:
                        </span>
                        {newCategoriesDetected.map(nc => (
                          <span key={nc} style={{ fontSize: '10px', background: '#bae6fd', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            {nc}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Scrollable Preview Table */}
                  <div style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#0f172a', color: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                          <th style={{ padding: '8px 10px', width: '30px' }}>#</th>
                          <th style={{ padding: '8px 10px', width: '150px' }}>Kategori</th>
                          <th style={{ padding: '8px 10px' }}>Deskripsi SOW</th>
                          <th style={{ padding: '8px 10px', width: '90px' }}>Output/Hari</th>
                          <th style={{ padding: '8px 10px', width: '70px' }}>Satuan</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Tarif Kru</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Tarif Alat</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Tarif Cons.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.items.map((item, idx) => (
                          <tr 
                            key={item.id} 
                            style={{ 
                              borderBottom: '1px solid #f1f5f9',
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' 
                            }}
                          >
                            <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{idx + 1}</td>
                            <td style={{ padding: '6px 10px' }}>
                              <span style={{
                                backgroundColor: '#f1f5f9',
                                color: '#334155',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: '600'
                              }}>
                                {item.category}
                              </span>
                            </td>
                            <td style={{ padding: '6px 10px', fontWeight: '600', color: '#1e293b' }}>
                              {item.description}
                            </td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0369a1' }}>
                              {item.defaultOutputPerDay}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#475569' }}>
                              {item.unit}
                            </td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#475569' }}>
                              {item.crewDailyRate > 0 ? `Rp ${item.crewDailyRate.toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#475569' }}>
                              {item.equipmentDailyRate > 0 ? `Rp ${item.equipmentDailyRate.toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#475569' }}>
                              {item.consumableUnitRate > 0 ? `Rp ${item.consumableUnitRate.toLocaleString('id-ID')}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    * Catatan: Resource spesifik (daftar kru, mesin, material, consumable) dapat disesuaikan mendalam dengan mengklik tombol <strong>⚙️ Edit Detail Resources</strong> pada masing-masing kartu SOW setelah di-import.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EXPORT TAB */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>
                  Filter Kategori yang Ingin Diexport:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <select
                    value={exportCategoryFilter}
                    onChange={(e) => setExportCategoryFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      minWidth: '220px',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <option value="Semua">Semua Kategori ({currentCatalog.length} SOW)</option>
                    {existingCategories.filter(c => c !== 'Semua').map(cat => {
                      const count = currentCatalog.filter(c => c.category.toLowerCase() === cat.toLowerCase()).length;
                      return (
                        <option key={cat} value={cat}>
                          {cat} ({count} SOW)
                        </option>
                      );
                    })}
                  </select>

                  <button
                    onClick={handleExport}
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '9px 18px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Download size={16} />
                    Download File Excel SOW (.xlsx)
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  File yang diexport memiliki format kolom yang sama dengan template import, sehingga dapat Anda gunakan sebagai acuan pengeditan offline di Microsoft Excel.
                </div>
              </div>

              {/* Catalog Snapshot Table */}
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px 20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px' }}>
                  Daftar SOW Aktif ({exportCategoryFilter === 'Semua' ? currentCatalog.length : currentCatalog.filter(c => c.category.toLowerCase() === exportCategoryFilter.toLowerCase()).length} item):
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', color: '#f8fafc', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '8px 10px', width: '30px' }}>#</th>
                        <th style={{ padding: '8px 10px', width: '160px' }}>Kategori</th>
                        <th style={{ padding: '8px 10px' }}>Deskripsi SOW</th>
                        <th style={{ padding: '8px 10px', width: '90px' }}>Output/Hari</th>
                        <th style={{ padding: '8px 10px', width: '70px' }}>Satuan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(exportCategoryFilter === 'Semua' ? currentCatalog : currentCatalog.filter(c => c.category.toLowerCase() === exportCategoryFilter.toLowerCase())).map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 10px' }}>
                            <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: '6px 10px', fontWeight: '600', color: '#1e293b' }}>
                            {item.description}
                          </td>
                          <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#0369a1' }}>
                            {item.defaultOutputPerDay}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#475569' }}>
                            {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Tutup
          </button>

          {activeTab === 'import' && (
            <button
              type="button"
              disabled={!parsedData || parsedData.items.length === 0}
              onClick={handleExecuteImport}
              style={{
                padding: '9px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: !parsedData || parsedData.items.length === 0 ? '#94a3b8' : (importMode === 'replace' ? '#dc2626' : '#10b981'),
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: !parsedData || parsedData.items.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Check size={16} />
              {importMode === 'replace' 
                ? `Ganti Semua & Import ${parsedData?.items.length || 0} SOW`
                : `Tambahkan ${parsedData?.items.length || 0} SOW ke Katalog`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
