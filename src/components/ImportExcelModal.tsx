import React, { useState } from 'react';
import { readExcelSheets, parseSheetData, type ImportedBoQRow } from '../utils/tenderImporter';
import { Upload, Check, X, RefreshCw, Copy, HelpCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirm: (items: ImportedBoQRow[], mode: 'replace' | 'append') => void;
}

export const ImportExcelModal: React.FC<Props> = ({ isOpen, onClose, onImportConfirm }) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [previewData, setPreviewData] = useState<ImportedBoQRow[]>([]);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [showFormulaGuide, setShowFormulaGuide] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const formulaEn = '=IF(AND(ISNUMBER(F7), ISERR(SEARCH("total", E7&D7))), COUNT(A$6:A6)+1, "")';
  const formulaId = '=IF(AND(ISNUMBER(F7); ISERR(SEARCH("total"; E7&D7))); COUNT(A$6:A6)+1; "")';

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleReset = () => {
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    setPreviewData([]);
  };



  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { sheetNames: names, workbook: wb } = await readExcelSheets(file);
    setWorkbook(wb);
    setSheetNames(names);

    const defaultSheet = names.find(n => n.trim() === 'P1') || names[0];
    setSelectedSheet(defaultSheet);

    const parsed = parseSheetData(wb, defaultSheet);
    setPreviewData(parsed);
  };

  const handleSheetChange = (sheet: string) => {
    setSelectedSheet(sheet);
    if (workbook) {
      const parsed = parseSheetData(workbook, sheet);
      setPreviewData(parsed);
    }
  };

  const handleConfirm = () => {
    onImportConfirm(previewData, importMode);
    handleReset();
    onClose();
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(3px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '920px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', fontFamily: 'Segoe UI, Tahoma, sans-serif', fontSize: '13px' }}>
        
        {/* Header Modal */}
        <div style={{ background: '#0f172a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Import Dokumen Tender Excel</h2>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>Mendukung format multi-sheet (P1, P2, P3, BoQ Konsultan)</p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Isi Modal */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {!workbook ? (
            <div>
              <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '36px 20px', textAlign: 'center', background: '#f8fafc' }}>
                <Upload size={40} style={{ color: '#64748b', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', marginBottom: '4px' }}>Pilih File Excel Tender (.xlsx / .xls)</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '16px' }}>Format tabel, spasi kosong, dan subtotal akan diproses otomatis</div>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ cursor: 'pointer' }} />
              </div>

              {/* Panduan & Salin Formula ID Otomatis */}
              <div style={{ marginTop: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HelpCircle size={18} style={{ color: '#2563eb' }} />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                        Formula Excel Penomoran ID (Auto-Skip Subtotal & Header Bab)
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Untuk generate nomor 1, 2, 3... di file mentah klien tanpa menandai baris Subtotal atau Header.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFormulaGuide(!showFormulaGuide)}
                    style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#2563eb', fontWeight: 'bold' }}
                  >
                    {showFormulaGuide ? 'Sembunyikan ▲' : 'Lihat & Salin Formula ▼'}
                  </button>
                </div>

                {showFormulaGuide && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '12px' }}>
                    <p style={{ margin: '0 0 10px', color: '#334155' }}>
                      Sisipkan kolom baru di paling kiri (Kolom A), lalu paste rumus ini di baris pertama data (misal <code>A7</code>) dan seret (drag) ke bawah:
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', color: '#38bdf8', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', overflowX: 'auto' }}>
                        <span style={{ marginRight: '10px' }}>{formulaEn}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formulaEn, 'en')}
                          style={{ flexShrink: 0, background: copiedType === 'en' ? '#059669' : '#334155', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copiedType === 'en' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedType === 'en' ? 'Tersalin!' : 'Salin (Koma ,)'}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1e293b', color: '#fbbf24', padding: '8px 12px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', overflowX: 'auto' }}>
                        <span style={{ marginRight: '10px' }}>{formulaId}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(formulaId, 'id')}
                          style={{ flexShrink: 0, background: copiedType === 'id' ? '#059669' : '#475569', border: 'none', color: '#fff', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copiedType === 'id' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedType === 'id' ? 'Tersalin!' : 'Salin (Titik Koma ;)'}
                        </button>
                      </div>
                    </div>

                    <div style={{ color: '#64748b', fontSize: '11px', lineHeight: '1.4' }}>
                      💡 <strong>F7</strong>: Kolom Volume (harus angka) | <strong>E7 & D7</strong>: Kolom Uraian & No Item | <strong>A$6:A6</strong>: Baris di atasnya untuk hitung urutan dinamis.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Baris Selector Sheet & Tombol Ganti File */}
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>Pilih Sheet Target:</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {sheetNames.map(name => (
                      <button
                        key={name}
                        onClick={() => handleSheetChange(name)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          cursor: 'pointer',
                          fontWeight: selectedSheet === name ? 'bold' : 'normal',
                          background: selectedSheet === name ? '#0f172a' : '#fff',
                          color: selectedSheet === name ? '#fbbf24' : '#334155'
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tombol Ganti File Excel */}
                <button
                  onClick={handleReset}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer', fontWeight: '600' }}
                >
                  <RefreshCw size={14} />
                  Ganti File Excel
                </button>
              </div>

              {/* Info Baris & Line ID */}
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                <span>Jumlah Data: <strong>{previewData.length} baris</strong> ({previewData.filter(p => !p.isCategory).length} item pekerjaan)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowFormulaGuide(!showFormulaGuide)}
                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <HelpCircle size={12} />
                    Formula ID ({showFormulaGuide ? 'Tutup' : 'Lihat'})
                  </button>
                  <span style={{ color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0', fontWeight: '500' }}>
                    ✓ Line ID / Unique Key terpetakan otomatis
                  </span>
                </div>
              </div>

              {showFormulaGuide && (
                <div style={{ marginBottom: '12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '10px 12px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong>Formula Excel Penomoran ID (Auto-Skip Subtotal & Header):</strong>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formulaEn, 'en')}
                        style={{ background: copiedType === 'en' ? '#059669' : '#0f172a', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        {copiedType === 'en' ? 'Tersalin! ✓' : 'Salin Excel EN (Koma ,)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(formulaId, 'id')}
                        style={{ background: copiedType === 'id' ? '#059669' : '#1e293b', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                      >
                        {copiedType === 'id' ? 'Tersalin! ✓' : 'Salin Excel ID (Titik Koma ;)'}
                      </button>
                    </div>
                  </div>
                  <code style={{ display: 'block', background: '#0f172a', color: '#38bdf8', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', overflowX: 'auto' }}>
                    {formulaEn}
                  </code>
                </div>
              )}

              {/* Tabel Preview */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, borderBottom: '2px solid #cbd5e1', textAlign: 'left', zIndex: 1 }}>
                    <tr>
                      <th style={{ padding: '8px 10px', width: '100px' }}>Line ID / No</th>
                      <th style={{ padding: '8px 10px' }}>Activity & Equipments / Uraian</th>
                      <th style={{ padding: '8px 10px', width: '90px', textAlign: 'right' }}>Total Vol</th>
                      <th style={{ padding: '8px 10px', width: '80px', textAlign: 'center' }}>Unit</th>
                      <th style={{ padding: '8px 10px', width: '110px' }}>Tipe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, idx) => (
                      <tr 
                        key={idx} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          background: item.isCategory ? (item.itemNo ? '#0f172a' : '#1e293b') : '#fff',
                          color: item.isCategory ? '#fff' : '#1e293b',
                          fontWeight: item.isCategory ? 'bold' : 'normal'
                        }}
                      >
                        <td style={{ padding: '6px 10px', fontFamily: 'monospace' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ 
                              fontWeight: 'bold', 
                              color: item.isCategory ? '#fbbf24' : '#2563eb',
                              fontSize: '11px' 
                            }}>
                              {item.rawLineId || item.itemNo || '-'}
                            </span>
                            {item.itemNo && item.rawLineId && item.itemNo !== item.rawLineId && (
                              <span style={{ fontSize: '10px', color: item.isCategory ? '#94a3b8' : '#64748b' }}>
                                No: {item.itemNo}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '6px 10px' }}>
                          {item.isCategory ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                background: item.itemNo ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)', 
                                color: item.itemNo ? '#fbbf24' : '#38bdf8',
                                fontWeight: 'bold'
                              }}>
                                {item.itemNo ? 'BAB UTAMA' : 'SUB-SEKSI'}
                              </span>
                              <span>{item.description}</span>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.description}</div>
                              {(item.size || item.pipeClass || (item.inchDia && item.inchDia > 0)) && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {item.size && (
                                    <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #bae6fd' }}>
                                      📏 Size: {item.size}
                                    </span>
                                  )}
                                  {item.pipeClass && (
                                    <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #fde68a' }}>
                                      🏷️ Class: {item.pipeClass}
                                    </span>
                                  )}
                                  {item.inchDia && item.inchDia > 0 && (
                                    <span style={{ fontSize: '10px', background: '#ecfdf5', color: '#047857', padding: '1px 6px', borderRadius: '3px', fontWeight: 'bold', border: '1px solid #a7f3d0' }}>
                                      ⚡ {item.inchDia} In-Dia
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace' }}>
                          {item.isCategory ? '-' : item.qty.toLocaleString('id-ID')}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', color: item.isCategory ? '#94a3b8' : '#64748b' }}>
                          {item.isCategory ? '-' : item.unit}
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: '11px', color: item.isCategory ? (item.itemNo ? '#fbbf24' : '#38bdf8') : '#047857' }}>
                          {item.isCategory ? (item.itemNo ? 'Header Bab' : 'Sub-Seksi') : 'BoQ Item'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {workbook ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>Mode Import:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#1e293b' }}>
                <input 
                  type="radio" 
                  name="importMode" 
                  value="replace" 
                  checked={importMode === 'replace'} 
                  onChange={() => setImportMode('replace')} 
                />
                <strong>Ganti Seluruh BoQ (Replace)</strong>
                <span style={{ color: '#059669', fontSize: '11px', fontWeight: 'bold' }}>(Rekomendasi)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#1e293b' }}>
                <input 
                  type="radio" 
                  name="importMode" 
                  value="append" 
                  checked={importMode === 'append'} 
                  onChange={() => setImportMode('append')} 
                />
                <span>Tambahkan ke Bawah (Append)</span>
              </label>
            </div>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={handleClose} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>
              Batal
            </button>
            <button 
              onClick={handleConfirm}
              disabled={previewData.length === 0}
              style={{ 
                padding: '8px 18px', 
                borderRadius: '6px', 
                border: 'none', 
                background: previewData.length === 0 ? '#94a3b8' : '#059669', 
                color: '#fff', 
                cursor: previewData.length === 0 ? 'not-allowed' : 'pointer', 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Check size={16} />
              Terapkan {previewData.filter(p => !p.isCategory).length} Item ({previewData.filter(p => p.isCategory).length} Kategori)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};