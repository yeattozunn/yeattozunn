# Video üretim kuralları

Bu repo, Higgsfield API ile üretilen AI videoları içeriyor. Kullanıcıyla Türkçe konuş.

## Hedef kitle
- Videolar **dünya çapında** izlenecek. Türkiye'ye özgü şeyler kullanma (çay bardağı, simit, Yemeksepeti, Türk dizisi, Türkçe yazı). Diyalogsuz, her kültürün anlayacağı görsel şakalar ve global markalar (McDonald's, Apple, IKEA, Coca-Cola).

## Para ve onay
- Kredi harcayan hiçbir şeyi (görsel ya da video üretimi) kullanıcının açık onayı olmadan yapma. Önce ne üreteceğini ve kaç dolar tutacağını söyle, "tamam" bekle.
- Kullanıcı bir bütçe verirse (ör. "en fazla 0,60 $") onu aşma.
- Görselleri kullanıcı kendisi üretir (Nano Banana). Sen sadece prompt yazarsın; kullanıcı istemeden görsel üretme.
- Kredi harcamayan işler (kurgu, geçiş, gren, müzik, kırpma) ücretsizdir, ama yine de önce söyle.
- API anahtarı repoya asla commit edilmez.

## Model ve fiyat (Higgsfield API, indirimli fiyatlar değişebilir)
- Kling 4.0 (`kling-video/v4.0/image-to-video` ve `kling-video/v4.0/text-to-video`): 720p ~0,079 $/s, 1080p ~0,118 $/s (24.10.2026, %50 indirimle; 480p yok); ses açık da aynı fiyat. `video-edit` ve `reference-to-video` giriş videosuyla 720p ~0,047 $/s (panelde "from 0,047" yazan bu), giriş videosu olmadan ~0,079 $/s. Video 3–30 s. İlk testte (text-to-video) `multi_prompt` planlarını yok saydı, zırh yerine kimono, hikâye yok; Kling 3.0'dan kötü çıktı. Multi-shot hikâyeler için Kling 3.0 kullan. 27.10.2026: indirim %30'a düştü (720p ~0,11 $/s); image-to-video'da sahneyi tek akış olarak yazınca (iş → ses → kafa çevirme → yakın plan) çok iyi çıktı ("Statta yapılan işler").
- Kling 3.0 Standard (`kling-video/v3.0/std/image-to-video`, `.../text-to-video`): ~0,071 $/s (indirim %15'e düştü). Multi-shot ve `last_image_url` destekliyor.
- En ucuz: Wan 3.0 Prime 480p (~0,027 $/s), ama kamera hareketi Kling kadar iyi değil.
- Genjutsu Light hareket aktarımı (`higgsfield/genjutsu-light/motion-transfer/v1.0`): 480p 0,05 $/s, 720p 0,10 $/s; ücret = çıktı süresi + giriş videosu süresi (panel indirimiyle 480p ~0,025 $/s). Kullanıcı 480p istiyor (720p yapma). Ağız net olsun diye: karakter görselinde yüz önden ve net, ağız kapalı/nötr; promptta "natural mouth and lip movement exactly matching the reference, sharp clear lips, no blur or warping around the mouth"; referans videoyu ekran kaydı yerine orijinal dosya olarak iste; birden fazla görsel verilebilir (ör. arabasız / kartlı / arabalı).
- Fiyatı üretmeden önce `POST /estimate/<endpoint>` ile kontrol et (estimate bilinmeyen parametreleri yok sayar, özellik desteğini göstermez).
- Görsel modelleri (Nano Banana, Grok) kişi/karakter sahnelerinde çoğu zaman "AI" duruyor; Kling text-to-video (görselsiz) çok daha gerçekçi çıktı (samuray 7-Eleven testi). Önce bunu öner.

## Görsel tarzı (AI gibi durmasın)
**Kullanıcıya verdiğin her görsel promptu baştan doğal ve gerçekçi yazılmalı.** Aşağıdaki kuralların hepsi her promptta uygulanır; kullanıcının "AI duruyor" demesini bekleme. Prompt "Candid still from a low-budget 1990s ... TV series" ile başlar ("behind-the-scenes" yazma, kadraja kameraman ve mikrofon giriyor); kimse kameraya bakmaz, ürün doğal kullanılır, karakter işine odaklıdır, her şey odaktadır.

Görsel promptlarının sonuna bu stil cümlesi eklenir (dönem/yer sahneye göre değişir):
```
still frame from a low-budget 1990s historical TV series, shot on worn 16mm film, flat daylight, slightly overexposed, muted washed-out colors, soft focus, visible film grain and dust, off-center imperfect framing, crowded background with extras, worn and dirty costumes, ordinary faces with wrinkles, sweat and bad teeth, motion blur on moving people, not cinematic, not polished, horizontal 4:3.
```
- "golden hour", "cinematic", dramatik ışık huzmesi, kahramanca poz gibi ifadeler kullanma; görüntüyü fazla AI gösteriyor.
- AI görünümünü artıran diğer şeyler: kameraya poz veren / ürünü kameraya gösteren karakter, herkesin kameraya bakması, bulanık arka plan (bokeh), parlayan neon ekranlar, kusursuz kostüm. Bunun yerine: kimse kameraya bakmıyor, ürün doğal kullanılıyor, her şey odakta (deep focus), ekranlar soluk.
- **Plastik AI dokusu kesinlikle olmasın** (kullanıcı bundan nefret ediyor). Her görsel promptuna ekle: "real skin texture with visible pores, blemishes and uneven skin tone, real worn materials, no airbrushed, waxy or plastic-looking skin or surfaces". Her video promptuna ekle: "keep real skin pores and film grain, no smoothing, no plastic or waxy look". Kurguda her videoya gren ekle; Kling'in yakın planlarda pürüzsüzleştirdiği yüzleri gren bastırır.
- Renkler canlı olmasın: "heavily desaturated, faded low-contrast color, muddy grey-brown palette" gibi ifadeler mutlaka olsun.
- Görselde hiçbir yazı olmasın: "screenshot", "TV documentary", "VHS", "REC" gibi kelimeler kullanma (model ekrana başlık, REC ve tarih yazıyor). Her promptun sonuna "no text, no captions, no timestamp, no watermark" ekle.
- Promptlar kısa ve sade olsun; uzun kural listeleri yerine 3-4 net cümle.
- Ürünleri tam model adıyla ve tanınır detayıyla yaz (ör. "a real Apple iPhone 15 Pro in natural titanium, triple camera bump visible"); "old iPhone" gibi belirsiz ifadeler eski tuşlu telefona dönüşüyor.
- Gerçek ürünler kullan: MacBook, iPhone, AirPods, Coca-Cola, Trendyol Go vb.

## İkinci tarz: "Simli Gece" (Kırmızı Montlu Adam serisi)
Kullanıcının çok beğendiği tarz (telefon kulübesi görseli). Parlama neon/hale DEĞİL, simli kırağı ve yıldız parlamaları. Arka plan "dolu" istense bile çok öğe yazma: flaş sadece önü aydınlatır, arka plandaki öğeler karanlıkta ve siste yarı görünür siluetler olmalı; aksi halde görüntü dijital resim / oyun posterine dönüşüyor. Promptta "real photograph, not digital art, not an illustration" yaz. Ünlü tarihi sahneler bu tarzla çalışmıyor; sade, ıssız, gece mekânları kullan. Referansları birebir kopyalama, yeni sahneler yaz.
```
Grainy early-2000s flash photo at night, [SAHNE], a lone man [EYLEM], his puffy jacket made entirely of glittering red frost crystals and tiny red sparkles catching the flash, [ZEMİN] dusted with violet glitter, four-point star glints in the air. Deep navy shadows, lavender-violet highlights, the red jacket as the only bright color, centered simple composition, soft vignette, low-resolution digital camera look, real textures, no smooth neon glow, horizontal 4:3. No text, no watermark.
```

## Instagram'da en çok tutan: "Bir Mumyanın Bir Günü" (`mumyanin_bir_gunu_v2.mp4`)
Kullanıcının en çok izlenen videosu. Formül: tanınır tek karakter (mumya) + antik dünyada sıradan modern hayat + gerçek ürünler + 90'lar düşük bütçeli dizi görseli + sahne başı 3 s iki açılı Kling + hızlı kesmeler ve geçişler. Yeni fikir istendiğinde önce bu serinin devamını öner.

## Referans başarı: Oakley v3 (`oakley_simli_gece_v3.mp4`)
Kullanıcının "budur" dediği formül. Yeni montaj videolarında bunu uygula:
- Kullanıcının ürettiği 5 görsel (Simli Gece tarzı), her biri ayrı Kling 3.0 Standard multi-shot, 3 s = 2 s dinamik ana plan (hızlı push-in, etrafında dönme, takip, el kamerası sarsıntısı) + 1 s farklı açıdan yakın plan (logo/ürün detayı). Asla "very slow" kamera yazma.
- Kurgu: fadewhite 0.25 s, hblur 0.35 s, zoomin 0.4 s geçişler; gren; sabit tarih damgası ("OCT 26 '03" turuncu mono); sonda kararma. 5 klip ~0,63 $.
- Görsellerdeki gömülü yazıları üretimden önce sil, kurguda sabit olarak geri ekle.

## Üçüncü tarz: kırmızı-siyah silüet edit (`bandit_kirmizi_v2.mp4`, kullanıcı "olmuş" dedi)
- Wan 3.0 Prime text-to-video 480p, 2 s'lik siyah-beyaz yüksek kontrastlı silüet klipleri (~0,027 $/s, 6 klip ~0,33 $). Renk ve tarz kurguda verilir.
- Kurgu: düşük çözünürlüğe indir + sert eşik (curves) ile düz grafik şekiller, kırmızıya boya, sadece en parlak yerler (gözler, ay) beyaz; gren, vinyet, film titremesi, vuruşta beyaz flaş. Aynı klipten zoom'la ikinci plan çıkar. Temiz Wan görüntüsü tek başına "AI duruyor"; grafik filtre şart.
- Asıl istenen "hafif çizgi film" versiyonu (`samuray_kirmizi_anime.mp4`, referans asenavfx "Bandit"): Wan text-to-video'ya doğrudan "2D anime illustration style animation, flat cel shading, solid blood-red background, pure black silhouettes, only the eyes glow bright white" yaz; görsel gerekmez, 7 klip × 2 s = 0,385 $. Kurgu: referansın kesme noktaları (~0,3–1 s), her kesmede zoom-punch (zoompan), sarsıntı, beyaz/siyah tek kare flaş, bir vuruşta renk patlaması, titreme, gren; son planda namlu/kılıç kameraya.

## Video kuralları (kullanıcının istekleri)
- İnsan ve hayvan hareketleri doğal olsun: gerçekçi ağırlık, duraksamalar, morph yok.
- Mimikler küçük ve doğal olsun: "kaşını hafifçe kaldırıyor", "gözlerini kısıyor", "iç çekiyor", "hafifçe sırıtıyor". Abartılı ifadeler (çılgınca gülme, avaz avaz bağırma) yazma. Tepki planlarını yakın çek.
- Kamera hep sabit kalmasın; doğal el kamerası hareketi, açı değiştirme, zoom in / zoom out.
- Etraftaki olaylar kamerayı etkilesin (ör. ağır bir adım ya da çarpma anında kamera titrer).
- **Kullanıcının favori yöntemi:** tek görsel + Kling 3.0 Standard multi-shot, 10-12 saniye, 4 plan (geniş → ürün detayı → tepki → geri çekilen final). ~0,42-0,50 $. Yeni fikirlerde önce bunu öner.
- Uygunsa aynı anı farklı açıdan göster: Kling multi-shot, sahne başı 3 saniye = 2 s geniş plan + 1 s ikinci açı.
- **İkinci açı tercihen ürün detay planı (insert) olsun:** ekran, kutu, logo, para, kutunun açılması gibi şakayı "satan" yakın plan.
- **Tepki planları ekle:** bazı sahnelerin ikinci açısı olayı izleyen birinin şaşkın yüzü olsun.
- Kurguda sahneler arası geçişler: whip-pan (hblur), kısa beyaz flaş, zoom; müzik referans videodan.
