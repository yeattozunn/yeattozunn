# Günlük Parfüm Görseli → Instagram Otomasyonu

Her gün otomatik olarak:
1. OpenAI ile bir parfüm ürün görseli üretir,
2. Görseli `@splitcimcom` Instagram hesabında paylaşır.

GitHub Actions üzerinde çalışır (`.github/workflows/daily-perfume-post.yml`), her gün TR saatiyle 09:00'da otomatik tetiklenir. İstersen Actions sekmesinden manuel de ("Run workflow") çalıştırabilirsin.

## Kurulum: gerekli 4 anahtar

Repo → **Settings → Secrets and variables → Actions → New repository secret** yolundan aşağıdaki 4 secret'ı eklemen gerekiyor. Bunlar olmadan otomasyon çalışmaz.

### 1. `OPENAI_API_KEY`
- https://platform.openai.com/api-keys adresinden yeni bir key oluştur.
- Görsel üretimi için bakiye/kredi olması gerekir (OpenAI hesabına ödeme yöntemi eklenmeli).

### 2. `IMGBB_API_KEY`
- https://api.imgbb.com/ adresinden ücretsiz kayıt ol, "Get API key" ile anahtarını al.
- Bu, üretilen görseli Instagram'ın erişebileceği herkese açık bir linke çevirmek için kullanılıyor (Instagram Graph API görseli doğrudan dosya olarak değil, URL olarak istiyor).

### 3 & 4. `IG_USER_ID` ve `IG_ACCESS_TOKEN` (Instagram Graph API)

Bu kısım Meta tarafında, sana ait hesapla yapılması gereken tek seferlik bir kurulum:

1. **Instagram hesabını Business/Creator hesabına çevir** (zaten yapılmışsa atla) ve bir **Facebook Sayfası**na bağla.
   - Instagram uygulaması → Ayarlar → Hesap türü → Profesyonel hesaba geç.
2. https://developers.facebook.com/apps adresinden **yeni bir uygulama** oluştur (tür: "Business").
3. Uygulamaya **Instagram Graph API** ürününü ekle.
4. **Graph API Explorer** (https://developers.facebook.com/tools/explorer/) üzerinden:
   - Uygulamanı seç, kullanıcı olarak giriş yap.
   - `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement` izinlerini iste.
   - `/me/accounts` isteğiyle bağlı Facebook Sayfanın ID'sini bul.
   - `/{page-id}?fields=instagram_business_account` isteğiyle Instagram Business hesabının ID'sini al → bu senin **`IG_USER_ID`**'in.
5. Aldığın kısa ömürlü token'ı **uzun ömürlü token'a** çevir (60 gün geçerli):
   ```
   GET https://graph.facebook.com/v21.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={app-id}
     &client_secret={app-secret}
     &fb_exchange_token={kisa-omurlu-token}
   ```
   Dönen `access_token` değeri senin **`IG_ACCESS_TOKEN`**'ın.
6. Not: uzun ömürlü token 60 günde bir sona erer, süresi dolmadan yenileyip secret'ı güncellemen gerekir (ileride otomatikleştirilebilir).

## İçeriği özelleştirme

- `prompts.py` içindeki `PERFUME_PROMPTS` listesi görsellerin tarzını belirler — istediğin gibi ekleyip çıkarabilirsin.
- `CAPTION_TEMPLATES` listesi paylaşım açıklamalarını (caption) belirler.
- Script her gün, yılın gününe göre listede sırayla ilerler; caption ise rastgele seçilir.

## Manuel test

Yerelde denemek için:

```bash
cd automation
pip install -r requirements.txt
export OPENAI_API_KEY=...
export IMGBB_API_KEY=...
export IG_USER_ID=...
export IG_ACCESS_TOKEN=...
python generate_and_post.py
```
