import { google, sheets_v4 } from 'googleapis';

// Sheet layout (per the customer template):
//   Row 1        -> summary banner ("Son işlem: ... — N ürün işlendi.")
//   Row 2        -> column headers: Ürün Adı | Marka | Fiyat | Stok | Kategori | Durum
//   Row 3+       -> product data
const SUMMARY_ROW = 1;
const HEADER_ROW = 2;
const DATA_START_ROW = 3;
const DATA_TAB = 'Sheet1';

const COLUMNS = {
  productName: 0, // A
  brand: 1, // B
  price: 2, // C
  stock: 3, // D
  category: 4, // E
  status: 5, // F
} as const;

export interface ProductRow {
  rowNumber: number; // 1-indexed absolute row in the sheet
  productName: string;
  brand: string;
  price: string;
  stock: string;
  category: string;
}

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  cachedClient = google.sheets({ version: 'v4', auth: auth as any });
  return cachedClient;
}

/**
 * Reads all data rows whose "Durum" column is empty, i.e. not yet
 * processed by a previous run.
 */
export async function readUnprocessedRows(sheetId: string): Promise<ProductRow[]> {
  const sheets = getClient();
  const range = `${DATA_TAB}!A${DATA_START_ROW}:F`;
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range });
  const values = response.data.values ?? [];

  const rows: ProductRow[] = [];
  values.forEach((row, index) => {
    const status = row[COLUMNS.status] ?? '';
    const productName = row[COLUMNS.productName] ?? '';
    if (status.trim() !== '' || productName.trim() === '') return;

    rows.push({
      rowNumber: DATA_START_ROW + index,
      productName,
      brand: row[COLUMNS.brand] ?? '',
      price: row[COLUMNS.price] ?? '',
      stock: row[COLUMNS.stock] ?? '',
      category: row[COLUMNS.category] ?? '',
    });
  });
  return rows;
}

export async function writeRowStatus(sheetId: string, rowNumber: number, statusText: string): Promise<void> {
  const sheets = getClient();
  const column = String.fromCharCode('A'.charCodeAt(0) + COLUMNS.status);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${DATA_TAB}!${column}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[statusText]] },
  });
}

export async function writeSummaryBanner(sheetId: string, processedCount: number, totalCount: number): Promise<void> {
  const sheets = getClient();
  const timestamp = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
  const text = `Son işlem: ${timestamp} — ${processedCount}/${totalCount} ürün işlendi.`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${DATA_TAB}!A${SUMMARY_ROW}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[text]] },
  });
}

export function statusUploaded(): string {
  return '✅ Yüklendi';
}

export function statusError(reason: string): string {
  return `❌ Hata: ${reason}`;
}
