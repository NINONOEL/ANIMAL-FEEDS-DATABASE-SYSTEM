import { useMemo, useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import * as XLSX from 'xlsx';
import { PROVINCES, MUNICIPALITIES, NATURE_OF_BUSINESS_TYPES } from '../../data/constants';
import { C } from '../../data/colors';
import Modal from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

const COLLECTION_KEYS = NATURE_OF_BUSINESS_TYPES.map(n => n.key);

const EMPTY = {
  nameOfEstablishment: '',
  brgy: '',
  municipality: '',
  province: '',
  sex: '',
  registrationNumber: '',
  manufacturer: 0,
  feedIngredientsMfr: 0,
  feedRetailer: 0,
  feedDistributor: 0,
  feedDealer: 0,
  feedImporter: 0,
  feedSupplier: 0,
  feedIndentor: 0,
  feedExporter: 0,
  orNumber: '',
  orDate: '',
  fee: '',
  // Status flags from Excel (New/Renew/Updated/Expired columns)
  regNew: 0,
  regRenew: 0,
  ltoUpdated: 0,
  ltoExpired: 0,
  registration: '',
  lto: '',
  validity: '',
  remarks: '',
};

const REQUIRED_FIELDS = ['nameOfEstablishment', 'province', 'municipality', 'brgy', 'registration', 'lto'];

function compactKey(s) {
  return String(s ?? '')
    .toLowerCase()
    .trim()
    .replace(/[\s._-]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '');
}

function formatYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function excelSerialToDate(serial) {
  const n = Number(serial);
  if (!Number.isFinite(n)) return null;
  // Excel serial date: days since 1899-12-30.
  const epoch = Date.UTC(1899, 11, 30);
  const ms = Math.floor(n) * 86400000;
  const date = new Date(epoch + ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDateInput(value) {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) return formatYMD(value);

  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = excelSerialToDate(value);
    return d ? formatYMD(d) : '';
  }

  const s = String(value).trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // dd/mm/yyyy
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yy = m[3];
    return `${yy}-${mm}-${dd}`;
  }

  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) return '';
  return formatYMD(parsed);
}

function toNumber(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim().replace(/,/g, '');
  // Strip currency symbols and other non-numeric chars (keep - and .)
  const cleaned = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toNullableMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim().replace(/,/g, '');
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeRegistration(value) {
  const s = String(value ?? '').toLowerCase().trim();
  if (!s) return '';
  if (s.includes('renew')) return 'renew';
  if (s.includes('new')) return 'new';
  return '';
}

function normalizeLto(value) {
  const s = String(value ?? '').toLowerCase().trim();
  if (!s) return '';
  if (s.includes('updated')) return 'updated';
  if (s.includes('expired')) return 'expired';
  return '';
}

function normalizeSex(value) {
  const s = String(value ?? '').trim().toLowerCase();
  if (!s) return '';
  if (s === 'male' || s === 'm') return 'Male';
  if (s === 'female' || s === 'f') return 'Female';
  // Keep original string if user typed something uncommon but still useful.
  return String(value ?? '').trim();
}

function parseAddressLine(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  // Remove common template labels if the Excel cell contains them.
  let cleaned = raw
    .replace(/barangay\s*[:\-]/gi, '')
    .replace(/municipality\s*[:\-]/gi, '')
    .replace(/province\s*[:\-]/gi, '');

  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Split into tokens (supports comma, dash, or slash separated address parts)
  const parts = cleaned
    .split(/,|;|\||\s-\s| - |\s\/\s|\n|\r/g)
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const lowerParts = parts.map(p => p.toLowerCase());
  const lowerProvinces = PROVINCES.map(p => p.toLowerCase());

  // 1) Detect province (exact match first, then inclusion match)
  let province = '';
  let provinceIdx = -1;
  for (let i = 0; i < parts.length; i++) {
    const tokenLower = lowerParts[i];
    const directIdx = lowerProvinces.findIndex(p => p === tokenLower);
    if (directIdx !== -1) {
      province = PROVINCES[directIdx];
      provinceIdx = i;
      break;
    }
    const included = PROVINCES.find((prov, idx) => tokenLower.includes(lowerProvinces[idx]) || lowerProvinces[idx].includes(tokenLower));
    if (included) {
      province = included;
      provinceIdx = i;
      break;
    }
  }

  // 2) Detect municipality (only if province is known)
  let municipality = '';
  let municipalityIdx = -1;
  if (province) {
    const munis = (MUNICIPALITIES[province] || []).filter(Boolean);
    const munisLower = munis.map(m => m.toLowerCase());
    let best = null;
    for (let i = 0; i < parts.length; i++) {
      const tokenLower = lowerParts[i];
      for (let j = 0; j < munisLower.length; j++) {
        const muniLower = munisLower[j];
        const match = tokenLower === muniLower || tokenLower.includes(muniLower) || muniLower.includes(tokenLower);
        if (!match) continue;
        if (!best || muniLower.length > best.len) best = { idx: j, len: muniLower.length, tokenIdx: i };
      }
    }
    if (best) {
      municipality = munis[best.idx];
      municipalityIdx = best.tokenIdx;
    }
  }

  // 3) Determine brgy (best-effort)
  // Common pattern: brgy, municipality, province
  const provinceTokenLower = province ? province.toLowerCase() : null;
  const municipalityTokenLower = municipality ? municipality.toLowerCase() : null;

  if (parts.length >= 3 && provinceIdx !== -1) {
    const before = parts.slice(0, provinceIdx);
    if (municipalityIdx !== -1 && municipalityIdx > 0) {
      // Typical pattern: <street/desc>, <barangay>, <municipality>, <province>
      const brgy = parts[municipalityIdx - 1] || '';
      return { brgy: brgy || '', municipality: municipality || '', province: province || '' };
    }
    // Fallback: best-effort (take first token before province as brgy)
    const brgy = before[0] || '';
    const mun = before[before.length - 1] || '';
    return { brgy, municipality: mun, province };
  }

  // Fallback: first unused token becomes brgy
  const used = new Set();
  if (provinceTokenLower) used.add(lowerParts.findIndex(t => t.includes(provinceTokenLower) || provinceTokenLower.includes(t)));
  if (municipalityTokenLower) used.add(lowerParts.findIndex(t => t.includes(municipalityTokenLower) || municipalityTokenLower.includes(t)));
  const brgyIdx = parts.findIndex((_, i) => !used.has(i) && parts[i]);
  const brgy = brgyIdx !== -1 ? parts[brgyIdx] : parts[0];

  return { brgy: brgy || '', municipality: municipality || '', province: province || '' };
}

const KEY_ALIASES = (() => {
  const map = {};

  const alias = (excelHeader, key) => { map[compactKey(excelHeader)] = key; };

  alias('Name of Establishment', 'nameOfEstablishment');
  alias('nameofestablishment', 'nameOfEstablishment');
  alias('nameOfEstablishment', 'nameOfEstablishment');

  // Template-specific header names
  alias('COMPLETE ADDRESS', 'addressLine');
  alias('Complete Address', 'addressLine');

  alias('Province', 'province');
  alias('Municipality', 'municipality');
  alias('Barangay', 'brgy');
  alias('Brgy', 'brgy');

  // Some Excel templates use one combined address column.
  alias('Municipality / Province / Barangay', 'addressLine');
  alias('Municipality/Province/Barangay', 'addressLine');
  alias('Municipality - Province - Barangay', 'addressLine');
  alias('Barangay / Municipality / Province', 'addressLine');
  alias('Barangay/Municipality/Province', 'addressLine');
  alias('Province / Municipality / Barangay', 'addressLine');
  alias('Municipality / Barangay / Province', 'addressLine');
  alias('Municipality / Province / Barangay / Sex', 'addressLine');
  alias('Address', 'addressLine');
  alias('Complete Address', 'addressLine');

  alias('Sex', 'sex');

  alias('Registration Number', 'registrationNumber');
  alias('Reg. Number', 'registrationNumber');
  alias('Reg Number', 'registrationNumber');
  alias('Regno', 'registrationNumber');

  // OR / dates
  alias('OR Number', 'orNumber');
  alias('Or Number', 'orNumber');
  alias('orNumber', 'orNumber');
  alias('OR Date', 'orDate');
  alias('Or Date', 'orDate');
  alias('orDate', 'orDate');
  alias('Validity', 'validity');
  alias('Remarks', 'remarks');
  alias('Fee', 'fee');

  // status
  alias('Registration', 'registration');
  alias('Registration Status', 'registration');
  alias('LTO', 'lto');
  alias('LTO Status', 'lto');

  // Split status columns (New/Renew and Updated/Expired)
  alias('New', 'regNew');
  alias('Renew', 'regRenew');
  alias('Updated', 'ltoUpdated');
  alias('Expired', 'ltoExpired');

  // nature of business
  alias('Manufacturer', 'manufacturer');
  alias('Feed Ingredients Manufacturer', 'feedIngredientsMfr');
  alias('Feed Ingredients Mfr.', 'feedIngredientsMfr');
  alias('Feed Retailer', 'feedRetailer');
  alias('Feed Distributor', 'feedDistributor');
  alias('Feed Dealer', 'feedDealer');
  alias('Feed Importer', 'feedImporter');
  alias('Feed Supplier', 'feedSupplier');
  alias('Feed Indentor', 'feedIndentor');
  alias('Feed Exporter', 'feedExporter');

  // Masterlist abbreviations:
  // R=Retailer, D=Distributor, DL=Dealer, IM=Importer, M=Manufacturer, S=Supplier, EX=Exporter, IN=Indentor, ING. M=Ingredients Manufacturer
  alias('R', 'feedRetailer');
  alias('D', 'feedDistributor');
  alias('DL', 'feedDealer');
  alias('IM', 'feedImporter');
  alias('M', 'manufacturer');
  alias('S', 'feedSupplier');
  alias('EX', 'feedExporter');
  alias('IN', 'feedIndentor');
  alias('ING. M', 'feedIngredientsMfr');
  alias('ING M', 'feedIngredientsMfr');
  alias('ING.M', 'feedIngredientsMfr');

  // Direct key match fallback (camelCase)
  for (const k of ['nameOfEstablishment', 'brgy', 'municipality', 'province', 'sex', 'registrationNumber',
    'manufacturer', 'feedIngredientsMfr', 'feedRetailer', 'feedDistributor', 'feedDealer',
    'feedImporter', 'feedSupplier', 'feedIndentor', 'feedExporter',
    'orNumber', 'orDate', 'fee', 'registration', 'lto', 'validity', 'remarks']) {
    map[compactKey(k)] = k;
  }

  return map;
})();

function buildHeaderToFieldMap(headers) {
  const headerToField = {};
  headers.forEach(h => {
    const ck = compactKey(h);
    let field = KEY_ALIASES[ck];

    // Fallback: tolerate headers with extra text (e.g. "Registration (New/Renew)").
    if (!field) {
      for (const [aliasKey, aliasField] of Object.entries(KEY_ALIASES)) {
        if (ck === aliasKey || ck.startsWith(aliasKey) || ck.includes(aliasKey)) {
          field = aliasField;
          break;
        }
      }
    }

    if (field) headerToField[h] = field;
  });
  return headerToField;
}

function validateRecord(record) {
  const missing = REQUIRED_FIELDS.filter(k => {
    const v = record[k];
    return v == null || String(v).trim() === '';
  });
  return { ok: missing.length === 0, missing };
}

function normalizeRowToRecord(row, headerToField) {
  const record = { ...EMPTY };

  for (const [excelHeader, rawValue] of Object.entries(row)) {
    const fieldKey = headerToField[excelHeader];
    if (!fieldKey) continue;

    if (COLLECTION_KEYS.includes(fieldKey)) {
      record[fieldKey] = toNumber(rawValue);
      continue;
    }

    if (fieldKey === 'regNew' || fieldKey === 'regRenew' || fieldKey === 'ltoUpdated' || fieldKey === 'ltoExpired') {
      record[fieldKey] = toNumber(rawValue);
      continue;
    }

    if (fieldKey === 'fee') {
      const m = toNullableMoney(rawValue);
      record.fee = m == null ? null : m;
      continue;
    }

    if (fieldKey === 'orDate' || fieldKey === 'validity') {
      record[fieldKey] = normalizeDateInput(rawValue);
      continue;
    }

    if (fieldKey === 'registration') {
      record.registration = normalizeRegistration(rawValue);
      continue;
    }

    if (fieldKey === 'lto') {
      record.lto = normalizeLto(rawValue);
      continue;
    }

    if (fieldKey === 'sex') {
      record.sex = normalizeSex(rawValue);
      continue;
    }

    if (fieldKey === 'addressLine') {
      const parsed = parseAddressLine(rawValue);
      if (parsed) {
        record.province = parsed.province || '';
        record.municipality = parsed.municipality || '';
        record.brgy = parsed.brgy || '';
      }
      continue;
    }

    // default: strings
    if (rawValue == null) continue;
    record[fieldKey] = typeof rawValue === 'number' ? String(rawValue) : String(rawValue).trim();
  }

  // cleanup trim on required string fields
  for (const k of ['nameOfEstablishment', 'brgy', 'municipality', 'province', 'registrationNumber', 'orNumber', 'remarks']) {
    if (record[k] != null) record[k] = String(record[k]).trim();
  }

  // keep Firestore schema consistent with RecordForm behavior
  if (record.fee === '') record.fee = null;

  // Derive app-required enums from split status columns.
  const derivedRegistration =
    record.regNew > 0 ? 'new'
      : record.regRenew > 0 ? 'renew'
        : '';
  const derivedLto =
    record.ltoUpdated > 0 ? 'updated'
      : record.ltoExpired > 0 ? 'expired'
        : '';

  // Don't overwrite if user already provided textual values via mapped headers.
  if (!record.registration) record.registration = derivedRegistration;
  if (!record.lto) record.lto = derivedLto;

  return record;
}

function parseTSVToAoa(text) {
  const normalized = String(text ?? '').replace(/\r/g, '');
  // Keep empty lines as rows so column alignment stays predictable.
  const lines = normalized.split('\n');
  return lines.map(line => line.split('\t'));
}

function parseAoATable(aoa) {
  if (!aoa || aoa.length === 0) {
    throw new Error('No rows found in input.');
  }

  const maxScan = Math.min(30, aoa.length);
  let bestHeaderIdx = -1;
  let bestScore = -1;

  for (let i = 0; i < maxScan; i++) {
    const row = aoa[i] || [];
    const headers = row.map(c => String(c ?? '').trim()).filter(Boolean);
    if (headers.length === 0) continue;

    const headerToField = buildHeaderToFieldMap(headers);
    const mappedFields = new Set(Object.values(headerToField));
    const hasAddressLine = mappedFields.has('addressLine');

    const requiredFound = REQUIRED_FIELDS.reduce((acc, k) => {
      if (k === 'province' || k === 'municipality' || k === 'brgy') {
        return acc + (hasAddressLine || mappedFields.has(k) ? 1 : 0);
      }
      if (k === 'registration') {
        const ok = mappedFields.has('registration') || mappedFields.has('regNew') || mappedFields.has('regRenew');
        return acc + (ok ? 1 : 0);
      }
      if (k === 'lto') {
        const ok = mappedFields.has('lto') || mappedFields.has('ltoUpdated') || mappedFields.has('ltoExpired');
        return acc + (ok ? 1 : 0);
      }
      return acc + (mappedFields.has(k) ? 1 : 0);
    }, 0);

    if (requiredFound > bestScore) {
      bestScore = requiredFound;
      bestHeaderIdx = i;
    }

    if (requiredFound === REQUIRED_FIELDS.length) break;
  }

  const headerRowIdx = bestHeaderIdx >= 0 ? bestHeaderIdx : 0;

  // Find status header row (New/Renew + Updated/Expired).
  let statusHeaderIdx = -1;
  let bestStatusScore = 0;
  {
    const scanStart = headerRowIdx;
    const scanEnd = Math.min(aoa.length, headerRowIdx + 12);
    for (let i = scanStart; i < scanEnd; i++) {
      const cells = (aoa[i] || []).map(c => String(c ?? '').trim()).filter(Boolean);
      if (cells.length === 0) continue;
      const statusMap = buildHeaderToFieldMap(cells);
      const mapped = new Set(Object.values(statusMap));
      const score =
        (mapped.has('regNew') ? 1 : 0) +
        (mapped.has('regRenew') ? 1 : 0) +
        (mapped.has('ltoUpdated') ? 1 : 0) +
        (mapped.has('ltoExpired') ? 1 : 0);
      if (score > bestStatusScore) {
        bestStatusScore = score;
        statusHeaderIdx = i;
      }
      if (bestStatusScore >= 4) break;
    }
  }

  const headerRow = (aoa[headerRowIdx] || []).map(c => String(c ?? '').trim());
  const statusRow = statusHeaderIdx >= 0 ? (aoa[statusHeaderIdx] || []).map(c => String(c ?? '').trim()) : [];

  const maxCols = Math.max(headerRow.length, statusRow.length);
  const headerCellsForMapping = Array.from(new Set([...headerRow, ...statusRow].filter(h => h)));
  const headerToField = buildHeaderToFieldMap(headerCellsForMapping);

  if (Object.keys(headerToField).length === 0) {
    throw new Error('Could not detect headers. Ensure headers include Name of Establishment, COMPLETE ADDRESS, New/Renew, Updated/Expired.');
  }

  const mergedHeaders = Array.from({ length: maxCols }, (_, c) => {
    const h1 = headerRow[c] || '';
    const h2 = statusRow[c] || '';
    if (h1 && headerToField[h1]) return h1;
    if (h2 && headerToField[h2]) return h2;
    return h1 || h2 || '';
  });

  const normalized = [];
  const bad = [];

  const dataStartRow = Math.max(headerRowIdx, statusHeaderIdx >= 0 ? statusHeaderIdx : headerRowIdx) + 1;

  for (let r = dataStartRow; r < aoa.length; r++) {
    const row = aoa[r] || [];
    const anyValue = row.some(v => String(v ?? '').trim() !== '');
    if (!anyValue) continue;

    const rowObj = {};
    for (let c = 0; c < mergedHeaders.length; c++) {
      const header = mergedHeaders[c];
      if (!header) continue;
      rowObj[header] = row[c] ?? '';
    }

    const rec = normalizeRowToRecord(rowObj, headerToField);
    const v = validateRecord(rec);
    if (!v.ok) {
      bad.push({ row: r + 1, reason: `Missing: ${v.missing.join(', ')}` });
      // Still import partial rows so nothing gets lost.
      // We store validation notes in Firestore for traceability.
      rec.importErrors = v.missing;
      rec.importStatus = 'partial';
    }

    normalized.push(rec);
  }

  return {
    normalized,
    bad,
    rowsPreview: normalized.slice(0, 5).map(n => ({
      nameOfEstablishment: n.nameOfEstablishment,
      province: n.province,
      municipality: n.municipality,
      brgy: n.brgy,
      registration: n.registration,
      lto: n.lto,
    })),
  };
}

export default function BulkImportModal({ isOpen, onClose, bulkImportRecords }) {
  const { addToast } = useToast();

  const [fileName, setFileName] = useState('');
  const [rowsPreview, setRowsPreview] = useState([]);
  const [importable, setImportable] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ imported: 0, total: 0 });
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // reset when opened so user can import another file easily
    setFileName('');
    setRowsPreview([]);
    setImportable([]);
    setSkipped([]);
    setParsing(false);
    setImporting(false);
    setProgress({ imported: 0, total: 0 });
  }, [isOpen]);

  const expectedHeaderHints = useMemo(() => ([
    'Name of Establishment',
    'COMPLETE ADDRESS (auto-split to province/municipality/barangay)',
    'New / Renew (Registration status)',
    'Updated / Expired (LTO status)',
  ]), []);

  async function handleFile(file) {
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    setRowsPreview([]);
    setImportable([]);
    setSkipped([]);
    setProgress({ imported: 0, total: 0 });

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Read as array-of-arrays so we can detect the real header row.
      // (If your Excel has a title row on top, the first row won't be headers.)
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const { normalized, bad, rowsPreview } = parseAoATable(aoa);

      setRowsPreview(rowsPreview);
      setImportable(normalized);
      setSkipped(bad);

      if (normalized.length === 0) {
        addToast('No rows found from your Excel/paste after parsing.', 'error');
      } else {
        addToast(`Imported ${normalized.length} records (${bad.length} with issues).`, 'success');
      }
    } catch (err) {
      addToast(err?.message ? `Import failed: ${err.message}` : 'Import failed.', 'error');
    } finally {
      setParsing(false);
    }
  }

  function handlePasteParse() {
    if (!pasteText.trim()) {
      addToast('Paste some records first.', 'error');
      return;
    }
    setFileName('Pasted Records');
    setParsing(true);
    setRowsPreview([]);
    setImportable([]);
    setSkipped([]);
    setProgress({ imported: 0, total: 0 });

    try {
      const aoa = parseTSVToAoa(pasteText);
      const { normalized, bad, rowsPreview } = parseAoATable(aoa);
      setRowsPreview(rowsPreview);
      setImportable(normalized);
      setSkipped(bad);

      if (normalized.length === 0) {
        addToast('No rows found from your pasted text after parsing.', 'error');
      } else {
        addToast(`Imported ${normalized.length} records (${bad.length} with issues).`, 'success');
      }
    } catch (err) {
      addToast(err?.message ? `Parse failed: ${err.message}` : 'Parse failed.', 'error');
    } finally {
      setParsing(false);
    }
  }

  async function handleImport() {
    if (importing) return;
    if (!importable.length) {
      addToast('Nothing to import yet. Upload and parse an Excel file first.', 'error');
      return;
    }

    setImporting(true);
    setProgress({ imported: 0, total: importable.length });
    try {
      const result = await bulkImportRecords(importable, {
        onProgress: ({ imported, total }) => setProgress({ imported, total }),
      });
      addToast(`Bulk import complete: ${result?.imported ?? importable.length} records added.`, 'success');
      onClose();
    } catch (err) {
      addToast(err?.message ? `Bulk import failed: ${err.message}` : 'Bulk import failed.', 'error');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import (Excel)"
      subtitle="Upload an .xlsx/.xls file. First row should contain headers."
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-xl p-4" style={{ border: `1.5px solid ${C.p3}`, background: C.white }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.p1 }}>
                Excel file
              </p>
              <p className="text-sm font-medium mt-1" style={{ color: C.text }}>
                {fileName || 'No file selected'}
              </p>
            </div>
            <label
              className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer shadow-md flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${C.p1}, ${C.deep})` }}
            >
              <Icon icon="mdi:upload" className="text-lg" />
              Choose file
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={parsing || importing}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="mt-3 text-xs" style={{ color: C.p2 }}>
            Required columns: {expectedHeaderHints.join(', ')}.
          </div>

        {/* Paste support */}
        <div className="rounded-xl p-4" style={{ border: `1.5px solid ${C.p3}`, background: C.white }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.p1 }}>OR Paste copied table (TSV)</p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Copy from Excel (including the header row), then paste here. Tab-separated values are supported."
            rows={8}
            className="w-full mt-2 text-sm rounded-lg px-3 py-2"
            style={{ border: `1px solid ${C.p3}`, background: C.bg, color: C.text, outline: 'none', resize: 'vertical' }}
            disabled={parsing || importing}
          />
          <div className="flex justify-end gap-3 mt-3">
            <button
              type="button"
              onClick={handlePasteParse}
              disabled={parsing || importing}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: `1px solid ${C.p3}`, color: C.p1, background: C.white }}
            >
              Parse Paste
            </button>
          </div>
        </div>

          {(parsing || importing) && (
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold" style={{ color: C.p1 }}>
              <Icon icon="mdi:loading" className="animate-spin" />
              {importing ? `Importing... ${progress.imported}/${progress.total}` : 'Parsing Excel...'}
            </div>
          )}
        </div>

        {importable.length > 0 && (
          <div className="rounded-xl p-4" style={{ border: `1.5px solid ${C.p3}`, background: C.bg }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold" style={{ color: C.text }}>Ready to import</p>
              <p className="text-xs font-semibold" style={{ color: C.p2 }}>
                Valid: {importable.length} • Skipped: {skipped.length}
              </p>
            </div>
            {progress.total > 0 && (
              <div className="mt-3">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: `${C.p1}22` }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress.total ? (progress.imported / progress.total) * 100 : 0}%`,
                      background: `linear-gradient(90deg, ${C.p1}, ${C.deep})`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {skipped.length > 0 && (
          <div className="rounded-xl p-4" style={{ border: `1.5px solid ${C.p3}`, background: C.white }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.p1 }}>
              Skipped rows
            </p>
            <div className="mt-2 space-y-1">
              {skipped.slice(0, 6).map((s, idx) => (
                <div key={idx} className="text-xs" style={{ color: C.p2 }}>
                  Row {s.row ?? '—'}: {s.reason}
                </div>
              ))}
              {skipped.length > 6 && (
                <div className="text-xs" style={{ color: C.p3 }}>
                  +{skipped.length - 6} more
                </div>
              )}
            </div>
          </div>
        )}

        {rowsPreview.length > 0 && (
          <div className="rounded-xl p-4" style={{ border: `1.5px solid ${C.p3}`, background: C.white }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: C.p1 }}>
              Preview (raw)
            </p>
            <div className="mt-2 text-xs" style={{ color: C.p2 }}>
              {Object.keys(rowsPreview[0] || {}).slice(0, 6).join(', ')}
              {Object.keys(rowsPreview[0] || {}).length > 6 ? '...' : ''}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2" style={{ borderTop: `1.5px solid ${C.p3}` }}>
          <button
            type="button"
            onClick={onClose}
            disabled={parsing || importing}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ border: `1px solid ${C.p3}`, color: C.p1, background: C.white }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={parsing || importing || importable.length === 0}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg,${C.p1},${C.deep})` }}
          >
            {importing ? (
              <>
                <Icon icon="mdi:loading" className="animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Icon icon="mdi:database-import" /> Import {importable.length || ''}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

