# AI Destekli Local SEO Yönetim Platformu

## A) Kısa Açıklama

Bu proje, Next.js 16 kullanılarak geliştirilmiş, full-stack bir local SEO ve içerik yönetim platformudur.
Sistem, admin panel üzerinden yönetilebilen bölge, hizmet/haşere ve bunların özel kombinasyonlarına ait sayfalar ile dinamik landing page'ler oluşturulmasına olanak tanır.
Yapay zeka (Gemini API) destekli içerik üretimi ve yeniden oluşturma akışlarına sahip olan bu platform, dinamik SEO sayfaları, sitemap otomasyonu, structured data (JSON-LD) desteği ve Next.js'in modern cache invalidation mantığı ile donatılmıştır. Veritabanı ve kimlik doğrulama katmanlarında Firebase Auth, Firestore ve Firebase Admin SDK kullanılmaktadır.

## B) Öne Çıkan Özellikler

- **Dinamik SEO Sayfaları:** Bölge ve hizmet/haşere bazlı hedeflenmiş açılış sayfaları.
- **Kombinasyon Üretimi:** Bölge + hizmet kombinasyonlarından yüksek dönüşümlü lokal SEO landing page'leri üretimi.
- **Admin Panel Akışları:** İçeriklerin create, edit, update ve archive akışlarının tek merkezden güvenli yönetimi.
- **AI Destekli İçerik Üretimi:** Tekil sayfa veya kombinasyonlar için akıllı ve SEO uyumlu içerik üretimi / yeniden oluşturma.
- **Bulk Content Generation Job Sistemi:** Çoklu kombinasyonları arka planda kuyruğa alarak üreten otomasyon.
- **Gelişmiş Job Kontrolü:** Cross-tab job state senkronizasyonu, işlemi durdurma (stop) ve quota handling mekanizmaları.
- **Gemini Çoklu Key ve Fallback:** Gemini API kotalarını aşmamak için multi-key fallback ve quota handling stratejisi.
- **Soft Archive:** Verileri kalıcı silmek (hard delete) yerine güvenli soft archive mantığı.
- **Defensive Public Checks:** Public sayfalarda inactive ve archived kayıtların görünmesini engelleyen güvenli mimari.
- **Sitemap ve Metadata Yönetimi:** Hata durumlarında boş sitemap üretmeyen, dinamik ve güvenli sitemap/metadata yapısı.
- **Firebase Auth Koruması:** Admin erişimlerinin güvenliği.
- **Firestore + Server Actions:** Veri yönetiminin modern Server Actions ile sunucu tarafında yapılması.
- **Validasyon ve Güvenlik:** Girdiler için Zod validation ve zengin metinler için sanitize-html ile XSS koruması.
- **Next.js 16 Standartları:** Yeni cacheComponents, cacheTag ve updateTag yaklaşımlarının tam uyumlu kullanımı.

## C) Tech Stack

- **Next.js 16 App Router**
- **React**
- **TypeScript**
- **Tailwind CSS v4**
- **Firebase Auth**
- **Firestore**
- **Firebase Admin SDK**
- **Gemini API**
- **Zod**
- **sanitize-html**
- **Lucide React**

## D) Mimari Notlar

- **Server-First Yapı:** Mimari öncelikli olarak sunucu tarafında çalışacak şekilde dizayn edilmiştir.
- **Server Actions:** Tüm admin ve veritabanı mutasyonları Server Actions üzerinden yürütülür.
- **Client/Server Sınırı:** Client component'lerde server-only importları bulunmaz.
- **Authorization:** Tüm admin işlemleri `requireAdmin` helper'ı ile sunucu tarafında korunur.
- **Public Segment Güvenliği:** Public sayfalar inactive veya archived statüsündeki kayıtları hiçbir koşulda göstermez.
- **Cache Yönetimi:** Mutasyonlardan sonra veriyi tazelemek için `updateTag` kullanılır; `revalidatePath` veya `revalidateTag` kullanımından kaçınılmıştır.
- **AI İşlem Onayı:** Yapay zeka çıktıları Firestore'a otomatik kaydedilmez, her zaman admin onayı (submit) gerektirir.
- **Create Flow:** Yeni kayıt oluşturma işlemleri `docRef.create` kullanılarak create-only (üzerine yazmama) prensibiyle çalışır.
- **Edit Flow:** Düzenlemeler ayrı update action'ları üzerinden ilerler.
- **Archive Flow:** Veri kaybını önlemek için hard delete yerine soft archive yaklaşımı uygulanır.

## E) Kurulum

Projenin yerel ortamda çalıştırılması için aşağıdaki komutları kullanın:

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Ortam değişkenlerini yapılandırın:
   Ana dizinde `.env.local` dosyası oluşturun ve aşağıdaki değişkenleri gerekli değerlerle doldurun:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY=
   ADMIN_EMAIL=
   SESSION_COOKIE_SECRET=
   GEMINI_API_KEY=
   GEMINI_API_KEYS=
   RATE_LIMIT_SECRET=
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=
   TELEGRAM_BOT_TOKEN=
   TELEGRAM_CHAT_ID=
   GOOGLE_PLACES_API_KEY=
   GOOGLE_PLACE_ID=
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## F) Kontrol Komutları

Geliştirme süresince ve commit öncesi kalite kontrolü için aşağıdaki komutları kullanabilirsiniz:

```bash
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

**Build Notu:** Firestore free-tier kotası doluysa, build sırasında public statik sayfaların verisi çekilemediği için süreç `RESOURCE_EXHAUSTED` hatasıyla başarısız olabilir. Bu durumda kod sağlığını ölçmek için `lint` ve `typecheck` (tsc) sonuçları ayrı değerlendirilmelidir.

## G) Güvenlik Notları

- `.env` ve `.env.local` dosyaları kesinlikle git repolarına commit edilmemelidir.
- `FIREBASE_PRIVATE_KEY` ve `GEMINI_API_KEY` (veya `GEMINI_API_KEYS`) gibi sırlar client tarafına asla sızmamalıdır.
- `NEXT_PUBLIC_` öneki (prefix) sadece gerçekten public Firebase client yapılandırmaları için kullanılmalıdır.
- Admin işlemleri sadece UI tarafında değil, backend'de server side (`requireAdmin` vb.) olarak da mutlaka doğrulanır.
- Firestore Admin SDK, sistem düzeyinde yetkilere sahip olduğu için tüm action'larda ekstra auth guard katmanı gereklidir.

## H) Deployment Notları

- **Ortam:** Node.js 22+ sürümü gereklidir.
- Çevresel değişkenler (Environment variables) deployment platformunda (örn. Vercel) eksiksiz olarak tanımlanmalıdır.
- Firebase, Firestore ve Auth servisleri üretim ortamına göre doğru yapılandırılmalıdır.
- Production ortamına çıkmadan önce `lint`, `typecheck` ve `build` komutları başarıyla çalıştırılmalıdır.
- Firebase tarafındaki Firestore kotaları ve Google Cloud budget limitleri canlı sistemde sürekli takip edilmelidir.
