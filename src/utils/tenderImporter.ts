import * as XLSX from 'xlsx';

export interface ImportedBoQRow {
  id: string;
  sheetName: string;
  rawLineId: string; // Unique Key / Line ID dari raw Excel (untuk XLOOKUP / VLOOKUP)
  itemNo: string;
  description: string;
  reqPerDay?: number;
  durationDays?: number;
  qty: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  isCategory: boolean;
}

export const readExcelSheets = async (file: File): Promise<{ sheetNames: string[]; workbook: XLSX.WorkBook }> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  return { sheetNames: workbook.SheetNames, workbook };
};

export const parseSheetData = (workbook: XLSX.WorkBook, sheetName: string): ImportedBoQRow[] => {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (rows.length === 0) return [];

  // 1. CARI BARIS HEADER (Anchor: baris yang memuat 'NO', 'NO.', atau 'ITEM')
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const isAnchor = rows[i].some(cell => {
      const clean = String(cell).trim().toUpperCase();
      return clean === 'NO' || clean === 'NO.' || clean === 'ITEM' || clean.startsWith('NO.');
    });
    if (isAnchor) {
      headerRowIdx = i;
      break;
    }
  }

  const headerIdx = headerRowIdx !== -1 ? headerRowIdx : 0;
  const r1 = (rows[headerIdx] || []).map(c => String(c).trim().toUpperCase());
  const r2 = (rows[headerIdx + 1] || []).map(c => String(c).trim().toUpperCase());

  // Deteksi apakah r2 adalah baris data pertama atau sub-header
  const r2IsData = rows[headerIdx + 1] && rows[headerIdx + 1].some(c => typeof c === 'number' || (typeof c === 'string' && /^\d+$/.test(c.trim())));
  const combinedHeaders: string[] = [];
  const maxCols = Math.max(r1.length, r2.length);
  for (let c = 0; c < maxCols; c++) {
    const h1 = r1[c] || '';
    const h2 = (!r2IsData ? r2[c] : '') || '';
    combinedHeaders.push(`${h1} ${h2}`.trim());
  }

  // 2. DETEKSI INDEKS KOLOM
  // Deteksi Kolom Khusus Unique ID / Line ID (LINE ID, UNIQUE ID, ITEM CODE, TAG, dll.)
  const colUnique = combinedHeaders.findIndex(h => {
    const clean = h.trim();
    return (
      clean === 'LINE ID' || clean === 'LINE NO' || clean === 'LINE_ID' || clean === 'LINE_NO' || clean === 'LINE #' ||
      clean === 'UNIQUE ID' || clean === 'UNIQUE NO' || clean === 'UNIQUE_ID' || clean === 'UNIQUE_NO' || clean === 'KEY' ||
      clean === 'ITEM CODE' || clean === 'ITEM_CODE' || clean === 'ITEM ID' || clean === 'KODE ITEM' || clean === 'KODE' ||
      clean === 'TAG NO' || clean === 'TAG #' || clean === 'TAG' ||
      clean === 'ROW ID' || clean === 'ROW_ID' || clean === 'ID'
    );
  });

  const colNo = combinedHeaders.findIndex((h, idx) => {
    if (idx === colUnique) return false;
    return h === 'NO' || h === 'NO.' || h === 'ITEM' || h.startsWith('NO');
  });
  const colParentDesc = combinedHeaders.findIndex(h => h.includes('DESCRIPTION') || h.includes('URAIAN PEKERJAAN') || h.includes('NAMA BARANG'));
  const colScope = combinedHeaders.findIndex(h => h.includes('SCOPE OF WORK') || h.includes('SCOPE') || h.includes('ACTIVITY') || h.includes('EQUIPMENTS'));

  // Deteksi Kolom Volume (HANYA kuantitas fisik, cegah kolom Total IDR / Total Cost)
  let colQty = combinedHeaders.findIndex(h => {
    const isCost = h.includes('IDR') || h.includes('RP') || h.includes('COST') || h.includes('PRICE') || h.includes('CHARGE') || h.includes('SUB TOTAL');
    if (isCost) return false;
    return (
      h.includes('EST. NUMBER') || 
      h.includes('VOLUME TOTAL') || 
      h.includes('QTY') || 
      h.includes('QUANTITY') || 
      (h.includes('NUMBER') && h.includes('TREATED')) ||
      h.trim() === 'A' ||
      h.endsWith(' A')
    );
  });

  if (colQty === -1) {
    colQty = combinedHeaders.findIndex(h => {
      const isCost = h.includes('IDR') || h.includes('RP') || h.includes('COST') || h.includes('PRICE') || h.includes('CHARGE') || h.includes('SUB TOTAL') || h.includes('DAYS');
      return !isCost && (h.includes('VOLUME') || h.includes('JUMLAH'));
    });
  }

  const colReq = combinedHeaders.findIndex(h => h.includes('REQ/DAY') || h.includes('REQ'));
  const colDays = combinedHeaders.findIndex(h => h.includes('VOLUME (DAYS)') || h.includes('DAYS'));
  const colUnit = combinedHeaders.findIndex(h => h === 'UNIT' || h.includes('SATUAN') || h === 'UOM');
  const colPrice = combinedHeaders.findIndex(h => (h.includes('SERVICE CHARGE') || h.includes('UNIT PRICE') || h.includes('HARGA SATUAN') || h.trim() === 'B') && !h.includes('SUB TOTAL'));

  let defaultExtractedUnit = 'Unit';
  if (colPrice !== -1) {
    const priceHeaderText = combinedHeaders[colPrice];
    if (priceHeaderText.includes('/')) {
      const unitPart = priceHeaderText.split('/')[1]?.split(' ')[0]?.trim();
      if (unitPart) defaultExtractedUnit = unitPart;
    }
  }

  const isDualDescModel = colParentDesc !== -1 && colScope !== -1 && colParentDesc !== colScope;
  const startRow = r2IsData ? headerIdx + 1 : headerIdx + 2;

  let currentParentNo = '';
  let currentParentDesc = '';
  let currentSubHeader = '';
  let childCounter = 1;
  const parsedItems: ImportedBoQRow[] = [];

  // 3. ITERASI DATA MULAI DARI BARIS DI BAWAH HEADER
  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawNo = String(row[colNo !== -1 ? colNo : 0] || '').trim();
    const rawUniqueVal = colUnique !== -1 ? String(row[colUnique] || '').trim() : '';
    const rawQty = colQty !== -1 ? row[colQty] : '';
    const qtyVal = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty).replace(/,/g, '')) || 0;
    const priceVal = colPrice !== -1 ? parseFloat(String(row[colPrice] || 0).replace(/,/g, '')) || 0 : 0;
    const explicitUnit = colUnit !== -1 ? String(row[colUnit] || '').trim() : '';

    const rawParentDesc = colParentDesc !== -1 ? String(row[colParentDesc] || '').trim() : '';
    let rawScope = colScope !== -1 ? String(row[colScope] || '').trim() : '';

    // Jika format tunggal (seperti POMA / Standar), cari teks deskripsi di rentang kolom antara No dan kolom numerik pertama
    if (!isDualDescModel) {
      if (!rawScope && !rawParentDesc) {
        const firstNumCol = [colReq, colDays, colQty, colPrice].filter(c => c !== -1).sort((a, b) => a - b)[0] || row.length;
        for (let c = (colNo !== -1 ? colNo + 1 : 1); c < firstNumCol; c++) {
          const val = String(row[c] || '').trim();
          if (val) {
            rawScope = val;
            break;
          }
        }
      }
    }

    // Lewati baris kosong total, baris Sub Total / Total, dan baris pengulangan header tabel
    const anyText = `${rawNo} ${rawParentDesc} ${rawScope}`.toUpperCase();
    const fullRowUpper = row.map(c => String(c).trim().toUpperCase()).join(' ');

    const isRepeatedHeader = (
      (rawNo.toUpperCase() === 'NO' || rawNo.toUpperCase() === 'NO.' || rawNo.toUpperCase() === 'ITEM') &&
      (fullRowUpper.includes('DESCRIPTION') || fullRowUpper.includes('SCOPE') || fullRowUpper.includes('URAIAN') || fullRowUpper.includes('SERVICE CHARGE') || fullRowUpper.includes('NUMBER'))
    );

    if (
      anyText.includes('SUB TOTAL') || 
      anyText.includes('TOTAL') || 
      (!rawNo && !rawParentDesc && !rawScope) ||
      isRepeatedHeader
    ) {
      continue;
    }

    // A. DETEKSI HEADER BAB / KATEGORI
    const fullRowText = row.map(c => String(c).trim()).filter(Boolean).join(' ');
    const isCategoryHeader = qtyVal === 0 && (
      !explicitUnit ||
      /^[0-9]+(\.[0-9]+)*\s+[A-Za-z]/.test(fullRowText) ||
      /^[A-Z](\.[0-9]+)*\s+[A-Za-z]/.test(fullRowText) ||
      (rawNo && !rawParentDesc && !rawScope)
    );

    if (isCategoryHeader) {
      const catDesc = (rawScope || rawParentDesc || fullRowText).trim();
      let cleanNo = rawNo;
      let cleanDesc = catDesc;

      // Ekstrak kode bab jika tergabung dalam teks (misal "H. BEAM" -> No: "H.", Desc: "BEAM")
      const prefixMatch = catDesc.match(/^([A-Z]\.?|[0-9]+(\.[0-9]+)*)\s+(.+)$/);
      if (prefixMatch) {
        if (!cleanNo || cleanNo === catDesc) {
          cleanNo = prefixMatch[1].endsWith('.') ? prefixMatch[1] : `${prefixMatch[1]}.`;
          cleanDesc = prefixMatch[3];
        }
      }

      if (cleanNo) {
        // Bab Utama bernomor (seperti: "B.2 Steel Light Structure Works c/w material", "H. BEAM")
        currentParentNo = cleanNo;
        currentParentDesc = cleanDesc;
        currentSubHeader = ''; // Reset sub-header saat bab utama berganti
        childCounter = 1;
      } else {
        // Sub-Header atau kelompok pekerjaan (seperti: "Install Anchor bolt (Material A307)")
        currentSubHeader = cleanDesc;
      }

      parsedItems.push({
        id: `cat-${sheetName}-${r}`,
        sheetName,
        rawLineId: rawUniqueVal || cleanNo || `CAT-R${r + 1}`,
        itemNo: cleanNo || '',
        description: cleanDesc,
        qty: 0,
        unit: '',
        unitPrice: 0,
        totalCost: 0,
        isCategory: true
      });
      continue;
    }

    // B. LOGIKA FORWARD-FILL (Jika ada nomor / deskripsi induk baru, perbarui memori)
    if (rawNo) {
      // Cek apakah ada perpindahan bab/section besar
      const majorPart = rawNo.split('.')[0];
      const prevMajorPart = currentParentNo ? currentParentNo.split('.')[0] : '';
      if (majorPart && prevMajorPart && majorPart !== prevMajorPart) {
        currentSubHeader = '';
      }
      currentParentNo = rawNo;
      childCounter = 1;
    }
    if (rawParentDesc) {
      currentParentDesc = rawParentDesc;
    }

    // C. PENGGABUNGAN TEKS ITEM & SCOPE SECARA PRESISI
    let finalItemNo: string;
    let finalDescription: string;

    if (isDualDescModel) {
      // Model Tubular OCTG: Menggabungkan Tipe Pipa + Scope Pekerjaan
      finalItemNo = rawNo ? rawNo : (currentParentNo ? `${currentParentNo}.${childCounter}` : `${childCounter}`);
      finalDescription = currentParentDesc && rawScope 
        ? `${currentParentDesc} - ${rawScope}` 
        : (currentParentDesc || rawScope);
      childCounter++;
    } else {
      // Model Standar / General Services
      finalItemNo = rawNo || (currentParentNo ? `${currentParentNo}.${childCounter}` : `${childCounter}`);
      if (!rawNo) childCounter++;

      const baseDesc = (rawScope || rawParentDesc).trim();
      finalDescription = baseDesc;

      // Smart Context Inheritance:
      // Jika berada di bawah sub-header grup (misal: "Install Anchor bolt (Material A307)")
      if (currentSubHeader) {
        const lowerBase = baseDesc.toLowerCase();
        const lowerSub = currentSubHeader.toLowerCase();

        // Indikator bahwa deskripsi ini merupakan spesifikasi subordinat teknis:
        // Diawali dengan: size, tipe, type, dia, ø, dimensi, dimension, tebal, thick, grade, sch, rating, class, atau angka ukuran (10 mm, 2", dll.)
        const isSubordinate = /^(size|tipe|type|dia|diam|ø|dimensi|dimension|tebal|thick|grade|sch|class|rating|\d+["'\w\s/]*(\*|x|-|<|>|mm|cm|m|inch|in|"))/i.test(baseDesc);

        // Jika subordinat dan teks sub-header belum terkandung di dalamnya, sambungkan agar konteksnya jelas:
        if (isSubordinate && !lowerBase.includes(lowerSub.slice(0, Math.min(10, lowerSub.length)))) {
          finalDescription = `${currentSubHeader} - ${baseDesc}`;
        }
      }
    }

    const finalUnit = explicitUnit || (qtyVal > 0 ? defaultExtractedUnit : 'Lot');

    const determinedLineId = rawUniqueVal || finalItemNo || `R${r + 1}`;

    parsedItems.push({
      id: `${sheetName}-${determinedLineId || r}`,
      sheetName,
      rawLineId: determinedLineId,
      itemNo: finalItemNo,
      description: finalDescription,
      qty: qtyVal,
      unit: finalUnit,
      unitPrice: priceVal,
      totalCost: qtyVal * priceVal,
      isCategory: false
    });
  }

  return parsedItems;
};