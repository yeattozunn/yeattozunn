// Finds a product image via Google Custom Search, preferring square
// (900x900-ish) white-background product shots.

const SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';

export async function findProductImageUrl(query: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
  if (!apiKey || !engineId) throw new Error('Google Custom Search credentials are not set');

  const params = new URLSearchParams({
    key: apiKey,
    cx: engineId,
    q: `${query} beyaz arka plan`,
    searchType: 'image',
    imgSize: 'large',
    num: '5',
  });

  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Custom Search API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as any;
  const items: Array<{ link: string; image?: { width: number; height: number } }> = data.items ?? [];
  if (items.length === 0) return null;

  // Prefer a near-square image (product shots on white background tend to
  // be square-ish); otherwise fall back to the first result.
  const squarish = items.find((item) => {
    const w = item.image?.width ?? 0;
    const h = item.image?.height ?? 0;
    if (!w || !h) return false;
    const ratio = w / h;
    return ratio > 0.85 && ratio < 1.15 && w >= 600;
  });

  return (squarish ?? items[0]).link;
}
