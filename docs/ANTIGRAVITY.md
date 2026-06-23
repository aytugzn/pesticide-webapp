# DMR İlaçlama — Antigravity Context

> Bu dosya Antigravity'nin projeyi anlaması için yazılmıştır.
> Projenin mimarisini, kararlarını ve yapılacakları içerir.

---

## Proje Özeti

**Müşteri:** DMR İlaçlama Dezenfeksiyon Çevre Sağlığı Hizmetleri (İzmir)  
**Amaç:** Mevcut siteyi baştan, SEO odaklı ve dinamik olarak yeniden inşa etmek  
**Stack:** Next.js 16 · TypeScript · Firebase Firestore/Auth · Tailwind CSS v4  
**AI İçerik:** Gemini 2.0 Flash API (Google AI Studio — ücretsiz tier)  
**SEO Katmanı:** Antigravity (bu dosyayı okuyan)

---

## Klasör Yapısı

```
src/
├── app/
│   ├── layout.tsx                          # Global provider'lar
│   ├── global-error.tsx
│   ├── not-found.tsx
│   ├── (main)/                             # Ziyaretçi tarafı
│   │   ├── layout.tsx                      # Navbar + Footer
│   │   ├── page.tsx                        # Ana sayfa
│   │   └── [bolge-slug]/[hasere-slug]/     # Kombinasyon sayfaları
│   │       └── page.tsx
│   └── (admin)/                            # Admin paneli
│       ├── layout.tsx                      # Sidebar + Topbar
│       ├── dashboard/page.tsx
│       ├── bolgeler/page.tsx
│       ├── hasereler/page.tsx
│       ├── kombinasyonlar/page.tsx
│       ├── raporlar/page.tsx
│       ├── mesajlar/page.tsx
│       ├── referanslar/page.tsx
│       └── ayarlar/page.tsx
│
├── features/
│   ├── auth/
│   │   ├── actions.ts
│   │   ├── components/LoginForm.tsx
│   │   └── types.ts
│   ├── combinations/                       # Projenin kalbi
│   │   ├── actions.ts                      # Firestore CRUD + updateTag
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── schemas.ts
│   │   └── types.ts
│   ├── reports/                            # QR ilaçlama raporu
│   │   ├── actions.ts
│   │   ├── components/
│   │   └── types.ts
│   ├── regions/
│   ├── pests/
│   ├── references/
│   └── contact/
│
├── components/
│   ├── ui/                                 # Button, Input, Modal vb.
│   └── layouts/                            # Navbar, Sidebar vb.
│
├── lib/
│   ├── firebase.ts                         # Client SDK
│   ├── firebase-admin.ts                   # Server SDK
│   ├── gemini.ts                           # Gemini client + prompt şablonu
│   └── exceptions.ts
│
└── utils/
    └── format-date.ts
```

---

## Routing Mimarisi

### Dinamik Sayfalar (3 tip)

```
/bolge/[bolge-slug]               → "bornova ilaçlama" aramaları
/hasere/[hasere-slug]             → "karınca ilaçlama" aramaları
/[bolge-slug]/[hasere-slug]       → "bornova karınca ilaçlama" ← EN DEĞERLİ
```

### Neden kombinasyon en değerli?
- "bornova ilaçlama" → yüksek rekabet
- "bornova karınca ilaçlama" → düşük rekabet, yüksek satın alma niyeti
- 10 haşere × 15 ilçe = 150 unique sayfa, her biri ayrı indexlenir

### QR Rapor
```
/rapor/[uuid]     → Public, auth gerektirmez, noindex
```

---

## Cache Stratejisi

ISR yok. `use cache` + `updateTag` kullanılıyor.

```typescript
// Sayfa tarafı
export default async function Page({ params }) {
  "use cache";
  cacheTag(`kombinasyon-${params["bolge-slug"]}-${params["hasere-slug"]}`);
  const data = await getKombinasyon(...);
  return <></>;
}

// Action tarafı — admin kaydettiğinde
export async function kombinasyonKaydet(data: KombinasyonData) {
  "use server";
  await adminDb.collection("kombinasyon").doc(...).set(data);
  updateTag(`kombinasyon-${data.bolge}-${data.hasere}`);
}
```

**Neden bu strateji?**
- Build anında statik üretim → Firestore'a ziyaretçi isteği yok
- Admin değişiklik yapınca sadece o sayfa anında güncellenir
- Firestore kotası neredeyse hiç tüketilmez

---

## Firebase Veri Yapısı

```
firestore/
│
├── regions/
│   └── {slug}/
│       ├── name: "Bornova"
│       ├── slug: "bornova"
│       ├── description: "yoğun apartman bölgesi, eski binalar, nemli iklim"
│       └── isActive: true
│
├── pests/
│   └── {slug}/
│       ├── name: "Karınca"
│       ├── slug: "karinca-ilaclama"
│       ├── description: "yaz aylarında pik yapar, mutfak/nem kaynaklarından gelir"
│       ├── imageUrl: "url"
│       └── isActive: true
│
├── combinations/
│   └── {bolge}_{hasere}/               # örn: "bornova_karinca-ilaclama"
│       ├── region: "bornova"
│       ├── pest: "karinca-ilaclama"
│       ├── title: "Bornova Karınca İlaçlama | DMR İlaçlama"
│       ├── h1: "Bornova'da Karınca İlaçlama Hizmeti"
│       ├── metaDesc: "..."
│       ├── ogGorsel: "url"
│
├── rapor/
│   └── {uuid}/
│       ├── customerName: string
│       ├── address: string
│       ├── issueDate: timestamp
│       └── [NOT: Hangi alanların (kullanılan ilaçlar, garanti vb.) kesin olarak ekleneceği müşteriyle (DMR İlaçlama) görüşülecek]
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
│       └── aktif: false       # admin onaylayana kadar
│
└── ayarlar/
    └── genel/
        ├── telefon, adres, calismaSaatleri
        ├── ruhsatNo, defaultOgGorsel
        └── googleAnalyticsId
```

---

## Gemini AI İçerik Üretimi

### lib/gemini.ts

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export function buildCombinationPrompt(
  bolge: { ad: string; ozellikler: string },
  hasere: { ad: string; ozellikler: string }
): string {
  return `
Sen bir SEO içerik yazarısın. Türkçe yaz.

Şirket: DMR İlaçlama, İzmir merkezli profesyonel ilaçlama firması.

Bölge: ${bolge.ad}
Bölge özellikleri: ${bolge.ozellikler}

Haşere: ${hasere.ad}
Haşere özellikleri: ${hasere.ozellikler}

Üret:
- title: max 60 karakter
- h1: max 70 karakter, doğal ve çekici
- metaDesc: max 160 karakter, CTA içersin
- icerik: 300-400 kelime, bölge ve haşere özelliklerini doğal entegre et, template hissi verme
- faq: 3 adet soru-cevap

Sadece JSON döndür, başka hiçbir şey yazma.
Format: { title, h1, metaDesc, icerik, faq: [{soru, cevap}] }
  `.trim();
}
```

### Neden token sorunu yok?
Diğer 149 sayfayı context'e almıyoruz. Bölge + haşere `ozellikler` alanları farklı olduğu için prompt'tan çıkan içerik doğası gereği unique oluyor.

### Admin panelde akış
```
1. Bölge seç
2. Haşere seç
3. "AI ile Oluştur" → Gemini API çağrılır
4. Önizle
5. Beğenmezse "Tekrar Üret"
6. Düzenle (inline edit)
7. Kaydet → Firestore'a yazar + updateTag
```

---

## Auth Sistemi

**Yöntem:** Google OAuth (Firebase Auth)  
**Neden:** Tek admin, şifre yok, Google'ın 2FA'sı otomatik, brute-force riski yok  
**Whitelist:** `.env.local` → `ADMIN_EMAIL`

### Akış
```
Google butonu
→ signInWithPopup (client)
→ idToken alınır
→ createSession(idToken) server action
→ adminAuth.verifyIdToken → email whitelist kontrolü
→ adminAuth.createSessionCookie (7 gün, httpOnly)
→ /admin/dashboard'a yönlendirme
```

### proxy.ts (Next.js 16)
```typescript
// middleware.ts → proxy.ts oldu (Next.js 16)
// export function middleware → export function proxy
// Node.js runtime'da çalışır (Edge değil)
// firebase-admin doğrudan kullanılabilir
```

---

## SEO Görevleri (Antigravity)

### generateMetadata — her kombinasyon sayfası
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await getKombinasyon(params["bolge-slug"], params["hasere-slug"]);
  return {
    title: data.title,                    // admin + AI'dan
    description: data.metaDesc,           // admin + AI'dan
    openGraph: {
      title: data.title,
      description: data.metaDesc,
      images: [data.ogGorsel],
      locale: "tr_TR",
    },
    alternates: {
      canonical: `https://dmrilaclama.com/${params["bolge-slug"]}/${params["hasere-slug"]}`,
    },
  };
}
```

### noindex gereken sayfalar
```
/rapor/[uuid]     → Dijital ilaçlama sertifikası (QR ile erişilir), indexlenmesin
/admin/*          → proxy.ts'de zaten korumalı
```

### sitemap.ts
```typescript
// Aktif kombinasyon + bölge + haşere URL'lerini içerir
// kombinasyonlar priority: 0.9 (en değerli sayfalar)
// /rapor/* hiç eklenmez
```

### Schema.org JSON-LD (her kombinasyon sayfası)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "LocalBusiness", "name": "DMR İlaçlama", "areaServed": "[bölge]" },
    { "@type": "Service", "name": "[haşere] İlaçlama", "areaServed": "[bölge]" },
    { "@type": "FAQPage", "mainEntity": "[faq array]" }
  ]
}
```

---

## Tasarım Sistemi

**Tailwind v4** — CSS-first config, `tailwind.config.js` yok.  
Token'lar `globals.css`'de CSS custom property olarak tanımlı, `@theme inline` ile Tailwind'e register ediliyor.

### Kullanım
```tsx
className="bg-brand-surface text-text-primary border-brand-border"
className="text-brand-primary hover:bg-brand-primary-light"
className="bg-error-bg border-error-border text-error-text"
```

### Dark mode
`prefers-color-scheme: dark` ile otomatik — manuel toggle yok.

---

## Ortam Değişkenleri

```bash
# Firebase Client (public)
NEXT_PUBLIC_FIRESTORE_API_KEY
NEXT_PUBLIC_FIRESTORE_AUTH_DOMAIN
NEXT_PUBLIC_FIRESTORE_PROJECT_ID
NEXT_PUBLIC_FIRESTORE_STORAGE_BUCKET
NEXT_PUBLIC_FIRESTORE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIRESTORE_APP_ID
NEXT_PUBLIC_FIRESTORE_MEASUREMENT_ID

# Firebase Admin (server only)
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY

# Auth
ADMIN_EMAIL                    # whitelist'teki tek admin emaili

# AI
GEMINI_API_KEY                 # Google AI Studio — ücretsiz tier
```

---

## Yapılacaklar (MVP Sırası)

- [x] lib/firebase.ts
- [x] lib/firebase-admin.ts
- [x] features/auth/actions.ts
- [x] features/auth/components/LoginForm.tsx
- [x] proxy.ts
- [ ] lib/gemini.ts
- [ ] features/regions/ (bölge CRUD)
- [ ] features/pests/ (haşere CRUD)
- [ ] features/combinations/ (AI içerik üretimi)
- [ ] app/(main)/[bolge-slug]/[hasere-slug]/page.tsx
- [ ] app/sitemap.ts
- [ ] app/robots.ts
- [ ] features/reports/ (Dijital İlaçlama Sertifikası ve QR Kod Üretimi)

---

*Proje: DMR İlaçlama Web Sitesi*
*Haziran 2026*

---

## Cloudinary — Ana Sayfa Carousel

> **Durum:** Henüz implement edilmedi, ilerleyen aşamada yapılacak.

- Resimler Cloudinary'de saklanır (Firebase Storage kullanılmaz)
- Firestore'da sadece Cloudinary URL'leri + sıra + aktif/pasif metadata tutulur
- Admin panelden upload, sıralama, aktif/pasif yönetimi
- `next/image` + Cloudinary loader → otomatik WebP, lazy load, CDN
- Sadece ana sayfada carousel olacak

**Env değişkenleri (sonra eklenecek):**
```bash
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```