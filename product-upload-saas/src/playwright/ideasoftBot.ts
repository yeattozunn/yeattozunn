import { Browser, chromium, Page } from 'playwright';
import { generateFreshTotp } from './totp';
import { generateProductSeoContent } from '../ai/gemini';
import { findProductImageUrl } from '../ai/imageSearch';
import { ProductRow } from '../sheets/googleSheets';

// NOTE: the selectors below (#login-username, #product-name, etc.) are
// placeholders. Replace them with the real IdeaSoft admin panel selectors
// from the original single-tenant bot once that codebase is available —
// this file only carries over the multi-tenant flow/session structure.

export interface IdeasoftSession {
  browser: Browser;
  page: Page;
}

export interface Credentials {
  storeUrl: string;
  username: string;
  password: string;
  totpSecret: string | null;
}

/**
 * Logs into a customer's IdeaSoft admin panel. Each job gets its own
 * browser instance so one tenant's session can never leak into another's
 * (no shared global page/browser as the single-tenant bot used).
 */
export async function login(credentials: Credentials): Promise<IdeasoftSession> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${credentials.storeUrl}/admin`);
  await page.fill('#login-username', credentials.username);
  await page.fill('#login-password', credentials.password);
  await page.click('#login-submit');

  const totpInput = page.locator('#login-totp-code');
  if (await totpInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    if (!credentials.totpSecret) {
      await browser.close();
      throw new Error('IdeaSoft 2FA istiyor ama TOTP secret tanımlı değil.');
    }
    const code = await generateFreshTotp(credentials.totpSecret);
    await totpInput.fill(code);
    await page.click('#login-totp-submit');
  }

  await page.waitForSelector('#admin-dashboard', { timeout: 15000 });
  return { browser, page };
}

export async function logout(session: IdeasoftSession): Promise<void> {
  await session.browser.close();
}

/**
 * Enters a single product into IdeaSoft: base fields from the sheet,
 * AI-generated description/SEO from Gemini, and a product image found
 * via Google Custom Search.
 */
export async function createProduct(session: IdeasoftSession, row: ProductRow): Promise<void> {
  const { page } = session;

  const seo = await generateProductSeoContent({
    productName: row.productName,
    brand: row.brand,
    category: row.category,
  });

  const imageUrl = await findProductImageUrl(`${row.brand} ${row.productName}`).catch(() => null);

  const storeOrigin = new URL(page.url()).origin;
  await page.goto(`${storeOrigin}/admin/urun/ekle`);
  await page.fill('#product-name', row.productName);
  await page.fill('#product-brand', row.brand);
  await page.fill('#product-price', row.price);
  await page.fill('#product-stock', row.stock);
  await page.fill('#product-category', row.category);
  await page.fill('#product-description', seo.description);
  await page.fill('#product-seo-title', seo.seoTitle);
  await page.fill('#product-seo-description', seo.seoDescription);

  if (imageUrl) {
    await page.fill('#product-image-url', imageUrl);
  }

  await page.click('#product-save');
  await page.waitForSelector('.toast-success', { timeout: 15000 });
}
