# Video üretim kuralları

Bu repo, Higgsfield API ile üretilen AI videoları içeriyor. Kullanıcıyla Türkçe konuş.

## Para ve onay
- Kredi harcayan hiçbir şeyi (görsel ya da video üretimi) kullanıcının açık onayı olmadan yapma. Önce ne üreteceğini ve kaç dolar tutacağını söyle, "tamam" bekle.
- Kullanıcı bir bütçe verirse (ör. "en fazla 0,60 $") onu aşma.
- Görselleri kullanıcı kendisi üretir (Nano Banana). Sen sadece prompt yazarsın; kullanıcı istemeden görsel üretme.
- Kredi harcamayan işler (kurgu, geçiş, gren, müzik, kırpma) ücretsizdir, ama yine de önce söyle.
- API anahtarı repoya asla commit edilmez.

## Model ve fiyat (Higgsfield API, indirimli fiyatlar değişebilir)
- Varsayılan: Kling 3.0 Standard image-to-video, sessiz (`kling-video/v3.0/std/image-to-video`, ~0,042 $/s). Multi-shot ve `last_image_url` destekliyor.
- En ucuz: Wan 3.0 Prime 480p (~0,027 $/s), ama kamera hareketi Kling kadar iyi değil.
- Fiyatı üretmeden önce `POST /estimate/<endpoint>` ile kontrol et.

## Görsel tarzı (AI gibi durmasın)
Görsel promptlarının sonuna bu stil cümlesi eklenir (dönem/yer sahneye göre değişir):
```
still frame from a low-budget 1990s historical TV series, shot on worn 16mm film, flat daylight, slightly overexposed, muted washed-out colors, soft focus, visible film grain and dust, off-center imperfect framing, crowded background with extras, worn and dirty costumes, ordinary faces with wrinkles, sweat and bad teeth, motion blur on moving people, not cinematic, not polished, horizontal 4:3.
```
- "golden hour", "cinematic", dramatik ışık huzmesi, kahramanca poz gibi ifadeler kullanma; görüntüyü fazla AI gösteriyor.
- AI görünümünü artıran diğer şeyler: kameraya poz veren / ürünü kameraya gösteren karakter, herkesin kameraya bakması, bulanık arka plan (bokeh), parlayan neon ekranlar, kusursuz kostüm. Bunun yerine: kimse kameraya bakmıyor, ürün doğal kullanılıyor, her şey odakta (deep focus), ekranlar soluk.
- Gerçek ürünler kullan: MacBook, iPhone, AirPods, Coca-Cola, Trendyol Go vb.

## Video kuralları (kullanıcının istekleri)
- İnsan ve hayvan hareketleri doğal olsun: gerçekçi ağırlık, duraksamalar, morph yok.
- Mimikler küçük ve doğal olsun: "kaşını hafifçe kaldırıyor", "gözlerini kısıyor", "iç çekiyor", "hafifçe sırıtıyor". Abartılı ifadeler (çılgınca gülme, avaz avaz bağırma) yazma. Tepki planlarını yakın çek.
- Kamera hep sabit kalmasın; doğal el kamerası hareketi, açı değiştirme, zoom in / zoom out.
- Etraftaki olaylar kamerayı etkilesin (ör. ağır bir adım ya da çarpma anında kamera titrer).
- Uygunsa aynı anı farklı açıdan göster: Kling multi-shot, sahne başı 3 saniye = 2 s geniş plan + 1 s ikinci açı.
- **İkinci açı tercihen ürün detay planı (insert) olsun:** ekran, kutu, logo, para, kutunun açılması gibi şakayı "satan" yakın plan.
- **Tepki planları ekle:** bazı sahnelerin ikinci açısı olayı izleyen birinin şaşkın yüzü olsun.
- Kurguda sahneler arası geçişler: whip-pan (hblur), kısa beyaz flaş, zoom; müzik referans videodan.
