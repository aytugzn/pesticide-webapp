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
   NEXT_PUBLIC_FIRESTORE_API_KEY=
   NEXT_PUBLIC_FIRESTORE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIRESTORE_PROJECT_ID=
   NEXT_PUBLIC_FIRESTORE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIRESTORE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIRESTORE_APP_ID=
   NEXT_PUBLIC_FIRESTORE_MEASUREMENT_ID=
   FIREBASE_PROJECT_ID=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_PRIVATE_KEY=
   ADMIN_EMAIL=
   # SESSION_COOKIE_SECRET= (Kullanılmıyor)
   GEMINI_API_KEY=
   GEMINI_API_KEYS=
   RATE_LIMIT_SECRET= # İletişim formu gibi endpoint'lerde CSRF/rate-limit check için kullanılır
   UPSTASH_REDIS_REST_URL= # Local dev'de boş bırakın. Prod'da zorunludur (https://... ile başlamalı).
   UPSTASH_REDIS_REST_TOKEN= # Local dev'de boş bırakın. Prod'da zorunludur.
   TELEGRAM_BOT_TOKEN=
   TELEGRAM_CHAT_ID=
   TELEGRAM_WEBHOOK_SECRET=
   TELEGRAM_WEBHOOK_ORIGIN= # Server-only sabit HTTPS webhook origin'i (opsiyonel; Vercel production URL fallback'i vardır)
   VERCEL_AUTOMATION_BYPASS_SECRET= # Yalnızca webhook hedefi Vercel Deployment Protection arkasındaysa
   GOOGLE_PLACES_API_KEY=
   # GOOGLE_PLACE_ID= (Kullanılmıyor)
   NEXT_PUBLIC_SITE_URL=
   NEXT_PUBLIC_DEVELOPER_NAME=
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
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
- **Google Fonts:** Proje `next/font/google` kullandığı için build (derleme) sırasında dış ağa (Google sunucularına) erişim gerektirir. Kapalı CI/CD ortamlarında veya internet erişimi kısıtlı deployment platformlarında build hata verebilir. Deploy ortamının dış ağa açık olduğundan emin olun.
- Firebase tarafındaki Firestore kotaları ve Google Cloud budget limitleri canlı sistemde sürekli takip edilmelidir.

### Telegram Webhook Kaydı

Telegram webhook'u bot seviyesinde tek seferlik bir deployment ayarıdır; iletişim formu veya mesaj gönderme akışı içinde yeniden kaydedilmez. Kayıt scripti origin'i önce server-only `TELEGRAM_WEBHOOK_ORIGIN`, ardından Vercel system environment variable'ı `VERCEL_PROJECT_PRODUCTION_URL` üzerinden çözer. İki değer de yoksa localhost veya tahminî domain kullanmadan kontrollü biçimde durur. Mevcut sabit production alias'ı `https://pesticide-webapp.vercel.app` adresidir; webhook origin'i canonical site URL'sinden bağımsızdır ve bu işlem için `NEXT_PUBLIC_SITE_URL` değiştirilmez.

Endpoint ve production secret eşleşmesini Firestore'a dokunmayan payload ile doğrulamak için:

```bash
npm run telegram:webhook:set -- --dry-run
```

Probe başarılı olduktan sonra webhook'u kaydetmek ve `getWebhookInfo` ile doğrulamak için:

```bash
npm run telegram:webhook:set
```

Generated deployment URL'si Vercel Authentication arkasındaysa Project Settings → Deployment Protection → Protection Bypass for Automation üzerinden oluşturulan `VERCEL_AUTOMATION_BYPASS_SECRET` kullanılabilir. Script bu değeri URL-safe query parametresi olarak ekler ve terminal çıktısında maskeler. Sabit production alias'ı doğrudan erişilebiliyorsa bypass gerekli değildir.

Webhook origin'i veya secret değiştiğinde komut yeniden çalıştırılır. İleride custom domaine geçildiğinde yalnızca `TELEGRAM_WEBHOOK_ORIGIN` yeni HTTPS origin'i gösterecek şekilde güncellenir; iletişim formu, canonical metadata ve route path'i değişmez. Token ve secret değerleri repoya, terminal komutuna veya ekran görüntüsüne yazılmamalıdır.
