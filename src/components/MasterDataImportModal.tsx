import React, { useState } from 'react';
import { 
  downloadManpowerTemplate, 
  downloadEquipmentTemplate, 
  downloadMaterialTemplate,
  downloadConsumableTemplate,
  parseManpowerExcel, 
  parseEquipmentExcel,
  parseMaterialExcel,
  parseConsumableExcel
} from '../utils/masterDataManager';
import type { MasterManpower, MasterEquipment, MasterMaterialItem } from '../data/resourceMasterData';
import { X, Upload, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  type: 'manpower' | 'equipment' | 'material' | 'consumable';
  onClose: () => void;
  onImportSuccess: (items: (MasterManpower | MasterEquipment | MasterMaterialItem)[], mode: 'append' | 'replace') => void;
  onExportCurrent?: () => void;
}

export const MasterDataImportModal: React.FC<Props> = ({
  isOpen,
  type,
  onClose,
  onImportSuccess,
  onExportCurrent
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [previewManpower, setPreviewManpower] = useState<MasterManpower[]>([]);
  const [previewEquipment, setPreviewEquipment] = useState<MasterEquipment[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<MasterMaterialItem[]>([]);
  const [previewConsumable, setPreviewConsumable] = useState<MasterMaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const typeTitle = {
    manpower: 'Tenaga Kerja',
    equipment: 'Peralatan & Mesin',
    material: 'Material Utama',
    consumable: 'Bahan & Consumables'
  }[type];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (type === 'manpower') {
        const parsed = await parseManpowerExcel(selected);
        if (parsed.length === 0) {
          setErrorMsg('Tidak ditemukan baris data yang valid di file Excel ini. Pastikan ada kolom nama/jabatan.');
        }
        setPreviewManpower(parsed);
      } else if (type === 'equipment') {
        const parsed = await parseEquipmentExcel(selected);
        if (parsed.length === 0) {
          setErrorMsg('Tidak ditemukan baris data yang valid di file Excel ini. Pastikan ada kolom nama alat/mesin.');
        }
        setPreviewEquipment(parsed);
      } else if (type === 'material') {
        const parsed = await parseMaterialExcel(selected);
        if (parsed.length === 0) {
          setErrorMsg('Tidak ditemukan baris data yang valid di file Excel ini. Pastikan ada kolom nama material.');
        }
        setPreviewMaterial(parsed);
      } else {
        const parsed = await parseConsumableExcel(selected);
        if (parsed.length === 0) {
          setErrorMsg('Tidak ditemukan baris data yang valid di file Excel ini. Pastikan ada kolom nama bahan/consumable.');
        }
        setPreviewConsumable(parsed);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Format tidak didukung';
      setErrorMsg(`Gagal membaca file Excel: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (type === 'manpower') {
      downloadManpowerTemplate();
    } else if (type === 'equipment') {
      downloadEquipmentTemplate();
    } else if (type === 'material') {
      downloadMaterialTemplate();
    } else {
      downloadConsumableTemplate();
    }
  };

  const getItemsToImport = (): (MasterManpower | MasterEquipment | MasterMaterialItem)[] => {
    switch (type) {
      case 'manpower': return previewManpower;
      case 'equipment': return previewEquipment;
      case 'material': return previewMaterial;
      case 'consumable': return previewConsumable;
    }
  };

  const handleConfirm = () => {
    const items = getItemsToImport();
    if (items.length === 0) return;
    onImportSuccess(items, importMode);
    onClose();
  };

  const totalPreview = {
    manpower: previewManpower.length,
    equipment: previewEquipment.length,
    material: previewMaterial.length,
    consumable: previewConsumable.length
  }[type];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(3px)',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
        fontFamily: 'Segoe UI, Tahoma, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>
              Import Excel Master {typeTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
          
          {/* Step 1: Download Template / Export Current Notice */}
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <strong style={{ fontSize: '12px', color: '#1e40af', display: 'block' }}>
                Format Kolom Excel Baku (.xlsx)
              </strong>
              <span style={{ fontSize: '11px', color: '#3b82f6' }}>
                Download format baku, edit / tambah data di Excel, lalu upload kembali ke sini.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                title="Download template Excel kosong dengan nama kolom baku"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  backgroundColor: '#ffffff',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Download size={13} />
                <span>Template Kosong</span>
              </button>
              {onExportCurrent && (
                <button
                  type="button"
                  onClick={onExportCurrent}
                  title="Export seluruh data master saat ini ke file Excel untuk diedit ulang"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Download size={13} />
                  <span>Export Data Saat Ini</span>
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Upload File Box */}
          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#ffffff',
            marginBottom: '16px'
          }}>
            <Upload size={28} color="#64748b" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
              {file ? file.name : 'Pilih atau Drag & Drop file Excel'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
              Mendukung format .xlsx, .xls
            </div>
            <label style={{
              display: 'inline-block',
              padding: '6px 16px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Telusuri File
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 3: Choose Mode (Append vs Replace) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
              Pilih Metode Penyimpanan Master:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div 
                onClick={() => setImportMode('append')}
                style={{
                  border: importMode === 'append' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: importMode === 'append' ? '#eff6ff' : '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'append'} 
                    onChange={() => setImportMode('append')} 
                  />
                  <strong style={{ fontSize: '12px', color: '#1e40af' }}>Gabungkan (Append / Add)</strong>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  Menambahkan data baru dari Excel ke dalam master tanpa menghapus data yang sudah ada.
                </p>
              </div>

              <div 
                onClick={() => setImportMode('replace')}
                style={{
                  border: importMode === 'replace' ? '2px solid #ef4444' : '1px solid #cbd5e1',
                  background: importMode === 'replace' ? '#fef2f2' : '#ffffff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <input 
                    type="radio" 
                    name="importMode" 
                    checked={importMode === 'replace'} 
                    onChange={() => setImportMode('replace')} 
                  />
                  <strong style={{ fontSize: '12px', color: '#991b1b' }}>Timpa Semua (Replace / Overwrite)</strong>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                  Menghapus seluruh master data saat ini dan menggantinya murni dengan data dari Excel ini.
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Preview Table */}
          {totalPreview > 0 && (
            <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                  Pratinjau Data Terbaca ({totalPreview} baris):
                </span>
                <span style={{ fontSize: '10px', color: '#059669', fontWeight: 'bold' }}>
                  ✓ Siap di-import
                </span>
              </div>
              
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1', color: '#64748b' }}>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Nama Item / Posisi</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Kategori</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center', width: '60px' }}>Satuan</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right' }}>Tarif / Harga Standar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {type === 'manpower' && previewManpower.slice(0, 10).map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: '600', color: '#0f172a' }}>{m.role}</td>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{m.category}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>{m.unit}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e40af' }}>
                          Rp {m.totalRate.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}

                    {type === 'equipment' && previewEquipment.slice(0, 10).map((e, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: '600', color: '#0f172a' }}>{e.name}</td>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{e.category}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>{e.unit}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#b45309' }}>
                          Rp {e.totalRate.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}

                    {type === 'material' && previewMaterial.slice(0, 10).map((m, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: '600', color: '#0f172a' }}>{m.name}</td>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{m.category}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>{m.unit}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#047857' }}>
                          Rp {m.standardRate.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}

                    {type === 'consumable' && previewConsumable.slice(0, 10).map((c, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: '600', color: '#0f172a' }}>{c.name}</td>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>{c.category}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: '#64748b' }}>{c.unit}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', color: '#7c3aed' }}>
                          Rp {c.standardRate.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPreview > 10 && (
                <div style={{ padding: '6px 10px', background: '#f8fafc', fontSize: '10px', color: '#64748b', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
                  ... dan {totalPreview - 10} baris lainnya
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              backgroundColor: '#e2e8f0',
              color: '#334155',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Batal
          </button>
          <button
            type="button"
            disabled={totalPreview === 0 || isLoading}
            onClick={handleConfirm}
            style={{
              padding: '6px 18px',
              backgroundColor: totalPreview === 0 ? '#94a3b8' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: totalPreview === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Konfirmasi & Simpan ke Master ({totalPreview} Item)
          </button>
        </div>

      </div>
    </div>
  );
};
