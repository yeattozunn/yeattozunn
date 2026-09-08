// Thin wrapper around the Gemini API for generating product descriptions
// and SEO fields. Kept isolated so the worker doesn't care which model or
// SDK version is behind it.

export interface ProductSeoContent {
  description: string;
  seoTitle: string;
  seoDescription: string;
}

interface GenerateInput {
  productName: string;
  brand: string;
  category: string;
}

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function generateProductSeoContent(input: GenerateInput): Promise<ProductSeoContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const prompt = `Ürün: ${input.productName}\nMarka: ${input.brand}\nKategori: ${input.category}\n\n` +
    'Bu ürün için Türkçe, e-ticaret için uygun bir ürün açıklaması, bir SEO başlığı ve bir SEO ' +
    'meta açıklaması üret. Yanıtı şu JSON formatında ver: ' +
    '{"description": "...", "seoTitle": "...", "seoDescription": "..."}';

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini API returned no content');

  return JSON.parse(text) as ProductSeoContent;
}
