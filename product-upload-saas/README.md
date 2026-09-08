# IdeaSoft Ürün Yükleme SaaS

Google Sheets → IdeaSoft ürün girişi, Gemini ile açıklama/SEO üretimi ve
Google Custom Search ile görsel bulma. Aylık abonelikli, çoklu müşteri
(multi-tenant) mimari.

## Önemli not: mevcut bot kod tabanı

Bu görev, Splitcim için çalışan tek-tenant Excel/Playwright botunun
incelenip yeniden kullanılabilir kısımlarının bu SaaS'a taşınmasını
istiyordu. **`yeattozunn/yeattozunn` reposunda o botun koduna
rastlanmadı** — repo sadece bir freelancer tanıtım sayfası (`index.html`)
içeriyor. Bu yüzden aşağıdaki tüm modüller **sıfırdan**, görev
açıklamasındaki akışa göre yazıldı; "hangi kısım yeniden kullanılabilir"
analizi yerine, o botun tipik olarak neye sahip olacağına dayanan bir
**mimari eşleme** aşağıda:

| Eski (tek-tenant, muhtemel) | Yeni (multi-tenant) | Durum |
| --- | --- | --- |
| Sabit kodlanmış IdeaSoft URL/kullanıcı/şifre | `ideasoft_credentials` tablosu, AES-256-GCM şifreli, job başına DB'den çekilip decrypt edilir | Yeniden yazıldı — `src/db/repositories.ts`, `src/crypto/encryption.ts` |
| Excel dosyası okuma | Google Sheets API (`spreadsheets.values.get`) | Yeniden yazıldı — `src/sheets/googleSheets.ts` |
| Playwright login akışı (kullanıcı adı/şifre) | Aynı akış + otomatik TOTP kod üretimi (`otplib`), her job için taze bir browser/session | **Kısmen yeniden kullanılabilir olurdu** — asıl IdeaSoft admin panel selector'ları (`#login-username` vb.) placeholder; gerçek bot koduna erişildiğinde bu selector'lar birebir taşınabilir. Bkz. `src/playwright/ideasoftBot.ts` içindeki NOT. |
| Playwright ürün giriş formu doldurma | Aynı mantık, DB'den gelen `customer_id`'ye göre parametrize | Aynı not — selector'lar placeholder, mimari (fonksiyon imzaları, sıra) hazır |
| Gemini API çağrısı (açıklama/SEO) | Aynı çağrı, tenant'tan bağımsız (API key ortak) | Muhtemelen **doğrudan yeniden kullanılabilir** — `src/ai/gemini.ts` aynı prompt yapısına göre yazıldı, gerçek prompt/parsing mantığı eski koddan kopyalanabilir |
| Google Custom Search görsel bulma | Aynı, 900x900 beyaz arka plan tercihi eklendi | Muhtemelen **doğrudan yeniden kullanılabilir** — `src/ai/imageSearch.ts` |
| Tek çalıştırma / script | BullMQ job queue + worker, webhook ile tetiklenir | Yeniden yazıldı — `src/queue/`, `src/api/routes/uploadTrigger.ts` |

**Sonraki adım:** gerçek Splitcim bot reposu/kodu paylaşıldığında,
`src/playwright/ideasoftBot.ts` içindeki placeholder selector'lar ve
`src/ai/gemini.ts` / `src/ai/imageSearch.ts` içindeki prompt/parsing
detayları gerçek koddan taşınarak bu iskelet tamamlanabilir.

## Mimari

```
Google Sheets (müşteri)
   │  "Şimdi Yükle" (Apps Script menüsü)
   ▼
POST /api/upload-trigger  (sheet_id + webhook_token)
   │  token doğrula, abonelik kontrol et
   ▼
BullMQ (Redis) job kuyruğu
   │
   ▼
Worker: DB'den credentials çek → decrypt → IdeaSoft'a login (TOTP dahil)
   → Sheets API'den işlenmemiş satırları oku
   → her satır için: Gemini (açıklama/SEO) + Custom Search (görsel) → IdeaSoft'a gir
   → Sheets'e durum yaz (✅/❌) + özet banner
```

## Kurulum

```bash
cd product-upload-saas
npm install
cp .env.example .env
# .env içini doldur: DATABASE_URL, REDIS_URL, CREDENTIALS_ENCRYPTION_KEY
# (openssl rand -hex 32 ile üret), GOOGLE_SERVICE_ACCOUNT_KEY_FILE, GEMINI_API_KEY,
# GOOGLE_CUSTOM_SEARCH_API_KEY, GOOGLE_CUSTOM_SEARCH_ENGINE_ID

psql "$DATABASE_URL" -f migrations/1700000000000_init.sql

npm run dev:api      # webhook API
npm run dev:worker   # BullMQ worker (Playwright)
npm run admin        # bekleyen ödemeleri onaylama CLI'ı
```

Google Sheets API için bir servis hesabı (service account) oluşturup her
müşteri sheet'ini o hesapla paylaşmak (Editor) gerekir; Apps Script
tarafı ise müşterinin kendi Google hesabı altında çalışır ve sadece
webhook'a POST atar (Sheets API erişimi Apps Script'te gerekmez).

## Müşteri onboarding akışı

1. `customers` tablosuna satır ekle, benzersiz `payment_reference_code`
   (örn. `SPL-4A7K9`) ile birlikte `subscriptions` satırı oluştur
   (`payment_status = 'pending'`).
2. Müşteriden IdeaSoft mağaza bilgilerini al, `encrypt()` ile şifreleyip
   `ideasoft_credentials` tablosuna yaz (plaintext hiçbir yerde saklanmaz).
3. Şablon Google Sheets'i kopyala, servis hesabıyla paylaş, benzersiz bir
   `webhook_token` üret ve `customer_sheets` tablosuna kaydet.
4. `apps-script/Code.gs`'i müşterinin sheet'ine ekle, script property'lerini
   (`WEBHOOK_URL`, `WEBHOOK_TOKEN`) doldur.
5. Müşteri IBAN'a referans koduyla ödeme yaptığında, admin CLI (`npm run
   admin`) ile ödemeyi onayla → `expires_at` 1 ay ileri atılır, bot aktif olur.

## Güvenlik notları

- Kredentiyaller AES-256-GCM ile şifreli (`src/crypto/encryption.ts`),
  sadece worker job çalışırken decrypt edilir; API sürecinde asla decrypt
  edilmez.
- Webhook her istekte `sheet_id + webhook_token` çiftini DB'de doğrular;
  eşleşmezse 403 döner (hangi tarafın yanlış olduğunu belirtmez).
- Abonelik kontrolü iki kez yapılır: webhook'ta (erken red, 402) ve worker
  job çalışmaya başlarken (kuyrukta beklerken süre dolmuş olabilir).
- TOTP üretimi 30 saniyelik pencereyi dikkate alır; kodun süresi son 5
  saniyedeyse bir sonraki pencereyi bekler (`src/playwright/totp.ts`).
