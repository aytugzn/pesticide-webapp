# DMR İlaçlama — Proje & SEO Brief

> **Stack:** Next.js 14+ · TypeScript · Firebase Firestore / Auth  
> **AI İçerik:** Gemini 2.0 Flash API (Google AI Studio — ücretsiz tier)  
> **SEO Katmanı:** Antigravity  
> **Proje Tipi:** Müşteri projesi + portföy

---

## 1. Şirket Bilgileri

| Alan | Değer |
|------|-------|
| Şirket Adı | DMR İlaçlama Dezenfeksiyon Çevre Sağlığı Hizmetleri |
| Konum | İzmir, Karabağlar — 9073. Sk. 15A, 35160 |
| Hizmet Bölgesi | İzmir ve çevre iller |
| E-posta | info@dmrilaclama.com |
| Telefon | [DOLDUR] |
| Çalışma Saatleri | [DOLDUR] |
| Ruhsat No | [DOLDUR] |

---

## 2. Site Haritası

### Statik Sayfalar
```
/                          → Ana Sayfa
/hakkimizda                → Şirket, sertifikalar, ekip
/hizmetler                 → Tüm hizmetlerin özet listesi
/iletisim                  → Form + harita + bilgiler
/izinler-sertifikalar      → Sağlık Bakanlığı onayı
/rapor/[uuid]              → Müşteri ilaçlama raporu (QR ile açılır)
/sitemap.xml               → Antigravity üretir
/robots.txt                → Antigravity yönetir
```

### Dinamik Sayfalar
```
/bolge/[bolge-slug]                      → "bornova ilaçlama"
/hasere/[hasere-slug]                    → "karınca ilaçlama"
/[bolge-slug]/[hasere-slug]              → "bornova karınca ilaçlama" ← EN DEĞERLİ
```

> **Neden kombinasyon en değerli?**
> "bornova ilaçlama" → yüksek rekabet
> "bornova karınca ilaçlama" → düşük rekabet, yüksek satın alma niyeti
> 10 haşere × 15 ilçe = 150 unique sayfa, her biri ayrı indexlenir

---

## 3. Admin Panel

Tek admin, Firebase Auth ile giriş yapar.

### 3.1 Ekranlar

```
/admin                     → Dashboard (özet istatistikler)
/admin/bolgeler            → Bölge listesi, ekle/sil/aktif-pasif
/admin/hasereler           → Haşere listesi, ekle/sil/aktif-pasif
/admin/kombinasyonlar      → İçerik üretimi ve yönetimi ← KRİTİK
/admin/raporlar            → İlaçlama raporu oluştur, QR indir
/admin/mesajlar            → İletişim formu gelen kutusı
/admin/referanslar         → Müşteri yorumları yönetimi
/admin/ayarlar             → Genel site ayarları
```

---

### 3.2 Bölge & Haşere Yönetimi

**Bölge kaydı:**
```
Ad:              Bornova
Slug:            bornova (otomatik üretilir)
Özellikler:      "yoğun apartman bölgesi, eski binalar, nemli iklim"
                 ↑ AI prompt'ta kullanılır, unique içerik için kritik
Aktif:           true/false
```

**Haşere kaydı:**
```
Ad:              Karınca
Slug:            karinca-ilaclama (otomatik)
Özellikler:      "yaz aylarında pik yapar, mutfak/nem kaynaklarından gelir"
                 ↑ AI prompt'ta kullanılır
Görsel:          [upload]
Aktif:           true/false
```

---

### 3.3 Kombinasyon Sayfası — AI İçerik Üretimi

Bu ekran admin panelin kalbi. Akış:

```
1. Admin bölge seçer       → Bornova
2. Admin haşere seçer      → Karınca
3. "AI ile Oluştur" butonu
4. Gemini API çağrılır:
   - Bornova özellikleri context'e girer
   - Karınca özellikleri context'e girer
   - Title, H1, description, içerik, FAQ üretilir
5. Admin önizler
6. Beğenmezse → "Tekrar Üret"
7. Düzenlemek isterse → inline edit
8. "Kaydet" → Firebase'e yazar, sayfa yayına girer
```

**Gemini'ye gidecek prompt şablonu:**
```
Sen bir SEO içerik yazarısın. Türkçe yaz.

Şirket: DMR İlaçlama, İzmir merkezli profesyonel ilaçlama firması.

B�lge: {bolge.ad}
B�lge özellikleri: {bolge.ozellikler}

Haşere: {hasere.ad}
Haşere özellikleri: {hasere.ozellikler}

Üret:
- title: max 60 karakter, "{bolge} {hasere} İlaçlama | DMR İlaçlama" formatında
- h1: max 70 karakter, doğal ve çekici
- metaDesc: max 160 karakter, CTA içersin
- content: 300-400 kelime, bölge ve haşere özelliklerini doğal entegre et,
  template hissi verme, o bölgeye özgü detaylar kullan
- faq: 3 question-answer pairs

Sadece JSON döndür, başka hiçbir şey yazma.
Format: { "title", "h1", "metaDesc", "content", "faq": [{"question", "answer"}] }
```

> **Neden token sorunu yok?**
> Diğer 149 sayfayı context'e almıyoruz.
> Bölge + haşere özellikleri farklı olduğu için
> prompt'tan çıkan içerik doğası gereği unique oluyor.

---

### 3.4 İlaçlama Raporu & QR Sistemi

Admin yeni ilaçlama kaydı oluşturur → sistem UUID üretir → `/rapor/{uuid}` endpoint'i aktif olur → admin QR kod indirir → müşteriye verir.

**Rapor kaydı alanları:**
```
Müşteri Adı:           [DOLDUR — müşteriyle görüşülecek]
Adres:                 [DOLDUR]
İlaçlama Tarihi:       [DOLDUR]
Haşere Tipi:           [DOLDUR]
Kullanılan İlaç:       [DOLDUR]
Teknisyen:             [DOLDUR]
Garanti Süresi:        [DOLDUR]
Sonraki İlaçlama:      [DOLDUR]
Ruhsat No:             [DOLDUR]
Ek Notlar:             [DOLDUR]
```

**UUID endpoint:**
```typescript
// app/rapor/[uuid]/page.tsx
// Public sayfa — auth gerektirmez
// noindex meta tag'i var (Google'da çıkmasın)
// Müşteri QR okutunca bu sayfa açılır
```

---

### 3.5 Diğer Admin Ekranları

**Mesajlar** (`/admin/mesajlar`)
- İletişim formundan gelen mesajlar listelenir
- Okundu/okunmadı durumu
- Firestore realtime listener ile anlık güncellenir

**Referanslar** (`/admin/referanslar`)
- Müşteri adı, yorum, puan (1-5), tarih
- Aktif/pasif toggle (onaylanmadan sitede çıkmaz)
- Ana sayfada ve hizmet sayfalarında gösterilir

**Ayarlar** (`/admin/ayarlar`)
- Telefon numarası
- Adres
- Çalışma saatleri
- Ruhsat numarası
- Default OG görseli
- Google Analytics ID
- Google Search Console verification kodu

---

## 4. Firebase Veri Yapısı

```
firestore/
│
├── bolge/
│   └── {slug}/
│       ├── ad: "Bornova"
│       ├── slug: "bornova"
│       ├── ozellikler: "yoğun apartman..."   ← AI prompt için
│       └── aktif: true
│
├── hasere/
│   └── {slug}/
│       ├── ad: "Karınca"
│       ├── slug: "karinca-ilaclama"
│       ├── ozellikler: "yaz aylarında pik..."  ← AI prompt için
│       ├── gorsel: "url"
│       └── aktif: true
│
├── kombinasyon/
│   └── {bolge}_{hasere}/                      ← örn: "bornova_karinca-ilaclama"
│       ├── bolge: "bornova"
│       ├── hasere: "karinca-ilaclama"
│       ├── title: "Bornova Karınca İlaçlama | DMR İlaçlama"
│       ├── h1: "Bornova'da Karınca İlaçlama Hizmeti"
│       ├── metaDesc: "..."
│       ├── content: "..."
│       ├── faq: [{question, answer}]
│       ├── ogImage: "url"
│       └── aktif: true
│
├── rapor/
│   └── {uuid}/
│       ├── musteriAdi: "..."
│       ├── adres: "..."
│       ├── tarih: timestamp
│       ├── hasere: "..."
│       ├── ilac: "..."
│       ├── teknisyen: "..."
│       └── [DOLDUR — müşteriyle görüşülecek diğer alanlar]
│
├── mesajlar/
│   └── {id}/
│       ├── ad, email, telefon, mesaj
│       ├── tarih: timestamp
│       └── okundu: false
│
├── referanslar/
│   └── {id}/
│       ├── musteriAdi, yorum, puan
│       ├── tarih: timestamp
│       └── aktif: false   ← admin onaylayana kadar
│
└── ayarlar/
    └── genel/
        ├── telefon, adres, calisma saatleri
        ├── ruhsatNo, defaultOgGorsel
        └── googleAnalyticsId
```

---

## 5. Antigravity — SEO Görevleri

> Antigravity bu dosyayı okuyarak projenin yapısını anlar.

### Üretecek Dosyalar
```
app/sitemap.ts      → aktif kombinasyon + bölge + haşere URL'leri
app/robots.ts       → /admin disallow, sitemap URL
```

### Her Sayfada Yöneteceği Şeyler
```
generateMetadata    → Firestore'dan çekilen title/desc/og
JSON-LD Schema      → LocalBusiness + Service + FAQPage
Canonical URL       → her sayfada doğru set edilmeli
noindex             → /rapor/[uuid] ve /admin/* sayfaları
```

### sitemap.ts Mantığı
```typescript
export default async function sitemap() {
  return [
    { url: "/", priority: 1.0 },
    { url: "/hizmetler", priority: 0.9 },
    { url: "/iletisim", priority: 0.7 },
    ...aktifBolgeler.map(b => ({ url: `/bolge/${b.slug}`, priority: 0.8 })),
    ...aktifHasereler.map(h => ({ url: `/hasere/${h.slug}`, priority: 0.8 })),
    ...aktifKombinasyonlar.map(k => ({
      url: `/${k.bolge}/${k.hasere}`,
      priority: 0.9,           // en değerli sayfalar
      changeFrequency: "monthly"
    })),
  ];
}
```

---

## 6. Teknik Kontrol Listesi

- [ ] `next/image` kullanılıyor
- [ ] `generateStaticParams` ile kombinasyonlar build'de üretiliyor
- [ ] `/rapor/*` ve `/admin/*` → `noindex`
- [ ] Canonical URL her sayfada doğru
- [ ] Google Search Console bağlandı
- [ ] Sitemap submit edildi
- [ ] Google My Business güncellendi
- [ ] PageSpeed: LCP < 2.5s hedefi

---

## 7. Müşteriden Alınacak Bilgiler

- [ ] Telefon numarası
- [ ] Çalışma saatleri
- [ ] Hizmet verilen ilçelerin tam listesi
- [ ] Sağlık Bakanlığı ruhsat numarası
- [ ] Fotoğraflar (ekip, araçlar, iş görselleri)
- [ ] İlaçlama raporunda ne bilgilerin olduğu (QR sistem için)
- [ ] Fiyat bilgisi sitede gösterilecek mi?

---

*Stack: Next.js 14 · TypeScript · Firebase · Gemini API*
*SEO: Antigravity*
*Haziran 2026*