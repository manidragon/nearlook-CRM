import fs from 'fs';
import path from 'path';

export interface PersistentCRMStore {
  staffList: any[];
  leadsList: any[];
  quotationsList: any[];
  clientsList: any[];
  projectsList: any[];
  tasksList: any[];
  invoicesList: any[];
  expensesList: any[];
  vendorsList: any[];
  agencyServicesList: any[];
  credentialsVault: any[];
  workCalendar: any;
  attendanceList: any[];
  receiptsList: any[];
  socialMediaTasksList: any[];
  dailyReportsList: any[];
  itInventoryList: any[];
  chartOfAccountsList: any[];
  journalVouchersList: any[];
  appointmentsList: any[];
  whatsAppLogs: any[];
  recycleBinList: any[];
  leaveApplicationsList?: any[];
  financialApprovalsList?: any[];
  clientDocumentsList?: any[];
}

const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data');
const DATA_DIR = process.env.DATA_DIR || DEFAULT_DATA_DIR;
const DB_FILE = path.join(DATA_DIR, 'crm_store.json');

/**
 * Ensures the data directory exists
 */
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[Storage] Error ensuring data directory exists:', err);
  }
}

/**
 * Loads persistent store from disk if present. Returns null if file does not exist yet.
 */
export function loadStoreFromDisk(): PersistentCRMStore | null {
  try {
    ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      // If DB_FILE does not exist in DATA_DIR (e.g. freshly mounted volume), check if seed data exists in default data dir
      const fallbackFile = path.join(DEFAULT_DATA_DIR, 'crm_store.json');
      if (fallbackFile !== DB_FILE && fs.existsSync(fallbackFile)) {
        try {
          fs.copyFileSync(fallbackFile, DB_FILE);
          console.log('[Storage] Initialized persistent storage from default template:', DB_FILE);
        } catch (copyErr) {
          console.error('[Storage] Error copying fallback seed data:', copyErr);
        }
      }
    }
    if (!fs.existsSync(DB_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    if (!raw || !raw.trim()) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed as PersistentCRMStore;
  } catch (err) {
    console.error('[Storage] Failed to read database from disk, falling back to default:', err);
    return null;
  }
}

/**
 * Atomically writes store to disk to prevent partial or corrupted writes.
 */
export function saveStoreToDisk(store: PersistentCRMStore): boolean {
  try {
    ensureDataDir();
    const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`;
    const payload = JSON.stringify(store, null, 2);
    fs.writeFileSync(tempFile, payload, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('[Storage] CRITICAL: Failed to write database to disk:', err);
    return false;
  }
}
