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
  // Metadata Piping MTO & Engineering BoQ
  pipeClass?: string;
  size?: string;
  materialSpec?: string;
  inchDia?: number;
}

// Helper untuk standarisasi format ukuran pipa / komponen (misal: "0.75" -> "0.75\"", "1" -> "1\"")
export const formatSize = (s: string | number | undefined): string => {
  if (s === undefined || s === null) return '';
  const str = String(s).trim();
  if (!str) return '';
  // Jika sudah memiliki simbol atau satuan ukuran (", ', mm, cm, in, inch, dn, nps)
  if (/["'”]|(inch|in|mm|cm|dn|nps)$/i.test(str)) {
    return str;
  }
  // Jika angka desimal murni, bilangan bulat, atau pecahan (misal: "0.75", "1", "1.5", "2", "1/2", "3/4", "1 1/2")
  if (/^\d+(\.\d+)?$/.test(str) || /^\d+\/\d+$/.test(str) || /^\d+\s+\d+\/\d+$/.test(str)) {
    return `${str}"`;
  }
  return str;
};

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

  // Deteksi apakah r2 adalah baris data pertama atau sub-header kolom
  const nextRow = rows[headerIdx + 1] || [];
  const r2FilledCells = nextRow.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
  const r2HasNumbers = nextRow.some(c => typeof c === 'number' || (typeof c === 'string' && /^\d+$/.test(c.trim())));

  const subHeaderKeywords = ['A', 'B', 'QTY', 'UNIT', 'PRICE', 'RATE', 'IDR', 'RP', 'DAYS', 'TREATED', 'SATUAN', 'TOTAL', 'HARGA', 'JUMLAH', 'SPEC'];
  const r2HasHeaderKeywords = nextRow.some(c => subHeaderKeywords.includes(String(c).trim().toUpperCase()));

  // Sub-header ASLI hanya jika bukan angka dan (terisi >= 3 kolom atau ada keyword subheader tabel).
  // Baris dengan 1 atau 2 sel (seperti "PIPE" atau "CLASS - A2K") adalah Kategori / Bab, BUKAN subheader kolom!
  const r2IsSubHeader = !r2HasNumbers && (r2FilledCells.length >= 3 || r2HasHeaderKeywords);
  const startRow = r2IsSubHeader ? headerIdx + 2 : headerIdx + 1;

  const combinedHeaders: string[] = [];
  const maxCols = Math.max(r1.length, r2.length);
  for (let c = 0; c < maxCols; c++) {
    const h1 = r1[c] || '';
    const h2 = (r2IsSubHeader ? r2[c] : '') || '';
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
    return h === 'NO' || h === 'NO.' || h === 'ITEM' || h === 'ITEM NO' || h === 'ITEM NO.' || h.startsWith('NO');
  });

  // Kolom Piping MTO & Engineering Spool Spesifikasi:
  // 1. Kolom Pipe Class / Rating
  const colClass = combinedHeaders.findIndex(h => {
    return (
      h.includes('PIPE CLASS') ||
      h.includes('PIPING CLASS') ||
      h.includes('PRESSURE CLASS') ||
      h.includes('RATING') ||
      h === 'CLASS' ||
      h.startsWith('CLASS ') ||
      h.includes('SERVICE')
    );
  });

  // 2. Kolom Size / Diameter (kecualikan Inch Dia dan Size 2)
  const colSize = combinedHeaders.findIndex(h => {
    if (h.includes('INCH DIA') || h.includes('INCH. DIA') || h.includes('TOTAL INCH') || h.includes('DIA INCH') || h.includes('SIZE 2') || h.includes('SIZE2')) return false;
    return (
      h === 'SIZE' ||
      h.startsWith('SIZE ') ||
      h.startsWith('SIZE(') ||
      h.includes('SIZE (INCH)') ||
      h.includes('SIZE (IN)') ||
      h.includes('PIPE SIZE') ||
      h.includes('NOMINAL SIZE') ||
      h === 'NPS' ||
      h === 'DIA' ||
      h === 'DIAMETER' ||
      h === 'OD' ||
      h.includes('UKURAN') ||
      h.includes('DIMENSI') ||
      h.includes('DIMENSION')
    );
  });

  // 3. Kolom Size 2 (Reducing / Branch Size)
  const colSize2 = combinedHeaders.findIndex(h => {
    return (
      h.includes('SIZE 2') ||
      h.includes('SIZE2') ||
      h.includes('REDUCING SIZE') ||
      h.includes('BRANCH SIZE') ||
      h.includes('OUTLET SIZE')
    );
  });

  // 4. Kolom Material Specification
  const colMaterial = combinedHeaders.findIndex(h => {
    return (
      h.includes('MATERIAL DESCRIPTION') ||
      h.includes('MATERIAL SPEC') ||
      h.includes('MATERIAL SPECIFICATION') ||
      h.includes('SPECIFICATION') ||
      h.includes('SPESIFIKASI') ||
      h.includes('GRADE') ||
      h.includes('STANDAR') ||
      h.includes('STANDARD') ||
      (h.includes('MATERIAL') && !h.includes('EQUIPMENT'))
    );
  });

  // 5. Kolom Schedule / Wall Thickness
  const colSchedule = combinedHeaders.findIndex(h => {
    return (
      h === 'SCH' ||
      h === 'SCHEDULE' ||
      h.startsWith('SCH ') ||
      h.includes('SCHEDULE') ||
      h.includes('WALL THICKNESS') ||
      h.includes('THICKNESS') ||
      h === 'WT'
    );
  });

  // 6. Kolom Ends / Connection
  const colEnds = combinedHeaders.findIndex(h => {
    return (
      h === 'ENDS' ||
      h.includes('END PREP') ||
      h.includes('END PREPARATION') ||
      h.includes('CONNECTION') ||
      h.includes('FACING')
    );
  });

  // 7. Kolom Inch Dia / Joint Inch
  const colInchDia = combinedHeaders.findIndex(h => {
    return (
      h.includes('INCH. DIA') ||
      h.includes('INCH DIA') ||
      h.includes('INCH-DIA') ||
      h.includes('DIA INCH') ||
      h.includes('INCH DIAMETER') ||
      (h.includes('INCH') && (h.includes('DIA') || h.includes('DIAMETER'))) ||
      h.includes('TOTAL INCH DIA') ||
      h.includes('JOINT INCH') ||
      h.includes('INCH JOINT') ||
      h.trim() === 'INCH DIA.'
    );
  });

  // Kolom Deskripsi Utama (kecualikan jika ini kolom MATERIAL SPEC agar tidak tertukar)
  const colParentDesc = combinedHeaders.findIndex(h => {
    if (h.includes('MATERIAL') || h.includes('SPEC')) return false;
    return (
      h === 'DESCRIPTION' ||
      h.includes('ITEM DESCRIPTION') ||
      h.includes('COMMODITY') ||
      h.includes('URAIAN PEKERJAAN') ||
      h.includes('URAIAN') ||
      h.includes('NAMA BARANG') ||
      h.includes('NAMA ITEM') ||
      h.includes('DESCRIPTION')
    );
  });

  const colScope = combinedHeaders.findIndex((h, idx) => {
    if (idx === colParentDesc) return false;
    return h.includes('SCOPE OF WORK') || h.includes('SCOPE') || h.includes('ACTIVITY') || h.includes('EQUIPMENTS');
  });

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
  const colUnit = combinedHeaders.findIndex(h => h === 'UNIT' || h.startsWith('UNIT ') || h.includes('SATUAN') || h === 'UOM' || h.includes('MEASURE'));
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
  const isMtoModel = (colSize !== -1 || colClass !== -1 || colMaterial !== -1 || colInchDia !== -1) && !isDualDescModel;

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
    if (!isDualDescModel && !isMtoModel) {
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
        // Header tanpa nomor item (seperti "PIPE" atau "CLASS - A2K")
        const isClassSubSection = /^CLASS\s*[-:]?\s*/i.test(cleanDesc) || /^SUB\s*[-:]?\s*/i.test(cleanDesc);
        if (!currentParentDesc || (!isClassSubSection && cleanDesc.toUpperCase() !== currentParentDesc.toUpperCase())) {
          // Bab / Disiplin Utama (misal: "PIPE", "FLANGES", "VALVES")
          currentParentDesc = cleanDesc;
          currentSubHeader = '';
          childCounter = 1;
        } else {
          // Sub-Header / Klasifikasi (misal: "CLASS - A2K", "CLASS - A3A")
          currentSubHeader = cleanDesc;
        }
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

    const baseDesc = (rawScope || rawParentDesc).trim();

    // Ekstrak nilai metadata Piping MTO
    const rawClass = colClass !== -1 ? String(row[colClass] || '').trim() : '';
    const rawSize = colSize !== -1 ? String(row[colSize] || '').trim() : '';
    const rawSize2 = colSize2 !== -1 ? String(row[colSize2] || '').trim() : '';
    const rawMaterial = colMaterial !== -1 ? String(row[colMaterial] || '').trim() : '';
    const rawSchedule = colSchedule !== -1 ? String(row[colSchedule] || '').trim() : '';
    const rawEnds = colEnds !== -1 ? String(row[colEnds] || '').trim() : '';

    let inchDiaVal: number | undefined = undefined;
    if (colInchDia !== -1) {
      const rawIdVal = row[colInchDia];
      if (typeof rawIdVal === 'number' && !isNaN(rawIdVal)) {
        inchDiaVal = rawIdVal;
      } else if (rawIdVal) {
        const cleanNum = String(rawIdVal).trim().replace(/,/g, '');
        const parsed = parseFloat(cleanNum);
        if (!isNaN(parsed) && parsed > 0) inchDiaVal = parsed;
      }
    }

    let fullSize = formatSize(rawSize);
    if (rawSize2) {
      const formatted2 = formatSize(rawSize2);
      if (formatted2) {
        fullSize = fullSize ? `${fullSize} x ${formatted2}` : formatted2;
      }
    }

    let effectiveClass = rawClass;
    if (!effectiveClass && currentSubHeader) {
      const match = currentSubHeader.match(/CLASS\s*[-:]?\s*([A-Za-z0-9_#]+)/i);
      if (match) {
        effectiveClass = match[1];
      }
    }

    // C. PENGGABUNGAN TEKS ITEM & SCOPE SECARA PRESISI
    let finalItemNo: string;
    let finalDescription: string;
    let specPartToStore: string | undefined = undefined;

    if (isDualDescModel) {
      // Model Tubular OCTG: Menggabungkan Tipe Pipa + Scope Pekerjaan
      finalItemNo = rawNo ? rawNo : (currentParentNo ? `${currentParentNo}.${childCounter}` : `${childCounter}`);
      finalDescription = currentParentDesc && rawScope 
        ? `${currentParentDesc} - ${rawScope}` 
        : (currentParentDesc || rawScope);
      childCounter++;
    } else if (isMtoModel) {
      // Model Piping MTO & Engineering Spool BoQ
      finalItemNo = rawNo || (currentParentNo ? `${currentParentNo}.${childCounter}` : `${childCounter}`);
      if (!rawNo) childCounter++;

      const commodity = (baseDesc || currentSubHeader || currentParentDesc || 'ITEM').trim();
      const parts: string[] = [];

      // 1. Commodity + Size + Class
      let headPart = commodity;
      if (fullSize && !headPart.toLowerCase().includes(fullSize.toLowerCase())) {
        headPart = `${headPart} ${fullSize}`;
      }
      if (effectiveClass && !headPart.toUpperCase().includes(effectiveClass.toUpperCase())) {
        headPart = `${headPart} (${effectiveClass})`;
      }
      parts.push(headPart);

      // 2. Material Specification & Schedule & Ends
      let specPart = rawMaterial;
      if (rawSchedule) {
        const cleanSch = rawSchedule.toUpperCase().startsWith('SCH') ? rawSchedule : `SCH ${rawSchedule}`;
        if (!specPart.toUpperCase().includes(cleanSch.toUpperCase())) {
          specPart = specPart ? `${cleanSch}, ${specPart}` : cleanSch;
        }
      }
      if (rawEnds) {
        if (!specPart.toUpperCase().includes(rawEnds.toUpperCase())) {
          specPart = specPart ? `${specPart}, ${rawEnds}` : rawEnds;
        }
      }
      if (specPart) {
        parts.push(specPart);
        specPartToStore = specPart;
      }

      finalDescription = parts.join(' - ');

      // 3. Tambahkan tag Inch Dia jika tersedia
      if (inchDiaVal && inchDiaVal > 0) {
        finalDescription = `${finalDescription} [${inchDiaVal} In-Dia]`;
      }
    } else {
      // Model Standar / General Services
      finalItemNo = rawNo || (currentParentNo ? `${currentParentNo}.${childCounter}` : `${childCounter}`);
      if (!rawNo) childCounter++;

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
      isCategory: false,
      pipeClass: effectiveClass || undefined,
      size: fullSize || undefined,
      materialSpec: specPartToStore || rawMaterial || undefined,
      inchDia: inchDiaVal
    });
  }

  return parsedItems;
};