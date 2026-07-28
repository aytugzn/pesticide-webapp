# DMR İlaçlama

DMR İlaçlama, public kurumsal siteyi ve local SEO içeriklerini yöneten Next.js tabanlı full-stack bir uygulamadır. Public sayfalar yayınlanmış bir veri snapshot'ından üretilir; bölgeler, haşereler, bölge–haşere kombinasyonları, ayarlar, görseller, yorumlar ve iletişim talepleri yetkilendirilmiş admin panelinden yönetilir.

## Temel Özellikler

- Bölge, haşere ve bölge–haşere kombinasyonları için dinamik SEO sayfaları
- Metadata, Open Graph, LocalBusiness/Service/Breadcrumb JSON-LD, sitemap ve robots üretimi
- Gemini ile bölge, haşere ve kombinasyon içeriği üretme/yeniden üretme
- GitHub Actions üzerinde çalışan, Firestore tabanlı toplu kombinasyon üretim işi
- Kombinasyonlar için arşivleme, geri yükleme, aktiflik ve filtreli toplu mutasyonlar
- Ayarlar, site görselleri ve yorumlar için taslak ile public yayın ayrımı
- Cloudinary tabanlı doğrulanmış görsel yükleme ve güvenli rollback/cleanup akışı
- İletişim taleplerini Firestore'a kaydetme, Telegram bildirimi ve admin mesaj yönetimi
- Firestore published snapshot, Redis last-known-good fallback ve granular Next.js cache tag'leri
- Admin genelinde en fazla dört görünür öğe ve FIFO bekleme kuyruğu kullanan toast sistemi

## Teknoloji Yığını

Sürümler `package.json` içindeki güncel bağımlılıklardan alınmıştır.

| Katman | Teknoloji |
| --- | --- |
| Framework | Next.js `16.2.9` App Router, Cache Components ve React Compiler |
| UI | React / React DOM `19.2.4`, Tailwind CSS `^4`, Lucide React `^1.21.0` |
| Dil | TypeScript `^5` |
| Veri ve kimlik | Firebase client `^12.15.0`, Firebase Admin `^14.0.0`, Firestore, Firebase Authentication |
| Validasyon ve güvenli HTML | Zod `^4.4.3`, sanitize-html `^2.17.5` |
| AI | `@google/generative-ai` `^0.24.1` |
| Redis ve rate limit | `@upstash/redis` `^1.38.0`, `@upstash/ratelimit` `^2.0.8` |
| İçerik ve carousel | Tiptap `^3.27.1`, Embla Carousel `^8.6.0` |
| Görsel ve bildirim entegrasyonları | Cloudinary HTTP API, Telegram Bot API, Google Places API |

## Uygulama Mimarisi

- `src/app`: App Router route'ları, layout'lar, metadata, sitemap, robots ve Telegram webhook endpoint'i.
- `src/features`: Domain bazlı Server Action, schema, veri erişimi ve UI bileşenleri.
- `src/lib`: Firebase Admin/Auth adaptörleri, Gemini, Redis snapshot, public aktivasyon, rate limit ve Telegram entegrasyonları.
- `src/components`: Ortak layout ve UI bileşenleri.
- `src/constants`: Route, metin ve UI sabitleri.
- `scripts`: GitHub Actions kombinasyon worker'ı ve Telegram webhook kurulum aracı.

Admin mutasyonları sunucuda çalışır, ilgili Zod şemalarıyla doğrulanır ve korunan akışlarda `requireAdmin` kontrolünden geçer. Client Firebase yapılandırması yalnızca `NEXT_PUBLIC_` değişkenlerini kullanır; Firebase Admin, Gemini, GitHub, Cloudinary, Redis ve Telegram sırları server-only modüllerde tutulur.

## Public Route Yapısı

| Route | İşlev |
| --- | --- |
| `/` | Ana sayfa, yayınlanmış görseller, hizmetler, yorumlar ve iletişim alanları |
| `/hizmetler` | Hizmet/haşere listesi |
| `/bolgeler` | Bölge listesi |
| `/hasere/[pestSlug]` | Haşere bazlı içerik sayfası |
| `/hasere/[pestSlug]/bolgeler` | Haşere için yayınlanmış bölge kombinasyonları |
| `/bolge/[regionSlug]` | Bölge bazlı içerik sayfası |
| `/bolge/[regionSlug]/hizmetler` | Bölge için yayınlanmış hizmet kombinasyonları |
| `/[regionSlug]/[pestSlug]` | Bölge–haşere kombinasyon landing page'i |
| `/iletisim` | İletişim formu ve iletişim bilgileri |
| `/hakkimizda` | Kurumsal içerik |
| `/izinler-sertifikalar` | İzin ve sertifika sayfası |
| `/gizlilik-politikasi` | Gizlilik politikası |
| `/kullanim-kosullari` | Kullanım koşulları |
| `/kvkk-aydinlatma-metni` | KVKK aydınlatma metni |
| `/sitemap.xml`, `/robots.txt` | Yayınlanmış route envanteri ve crawler kuralları |

Dinamik public route'lar yalnızca yayınlanmış snapshot içindeki aktif ve arşivlenmemiş kayıtları kullanır. Snapshot sağlayıcılarının tamamı kullanılamazsa sitemap ve dinamik route üretimi boş veri yayınlamak yerine kontrollü hata verir.

## Admin Panel

Admin route'ları Firebase session cookie ve izin verilen `ADMIN_EMAIL` ile korunur; tüm admin sayfaları `noindex` olarak işaretlenir.

| Route | İşlev |
| --- | --- |
| `/admin` | Bölge, haşere ve kombinasyon sayaçları ile sistem durumu |
| `/admin/regions` | Bölge oluşturma, AI içerik üretimi, düzenleme, aktiflik ve silme akışları |
| `/admin/pests` | Haşere oluşturma, AI içerik üretimi, düzenleme, aktiflik ve silme akışları |
| `/admin/combinations` | Tekil üretim/düzenleme, arşiv/geri yükleme, aktiflik, toplu mutasyon ve toplu AI üretimi |
| `/admin/messages` | İletişim taleplerini filtreleme, durum güncelleme ve süresi dolan kayıtları temizleme |
| `/admin/reviews` | Yorum taslağını oluşturma, sıralama, düzenleme ve silme |
| `/admin/service-reports` | Firestore'daki servis raporlarının salt okunur özeti |
| `/admin/site-images` | Hero, hizmet ve neden-biz görsellerinin taslak yönetimi ve Cloudinary yüklemeleri |
| `/admin/settings` | İletişim, sosyal bağlantı, Google Place ID ve carousel süre ayarları |

Sidebar'daki **Canlı Siteyi Güncelle** akışı ayar, site görseli ve yorum taslaklarını sürüm kontrollü olarak hazırlar; canonical published snapshot'ı günceller ve değişen domain'lere ait cache tag'lerini aktive eder.

Global admin toast sistemi stabil kimlikli bağımsız timer'lar kullanır. Aynı anda en fazla dört toast render edilir; fazlası FIFO kuyruğunda bekler ve timer/progress yalnızca toast görünür olduğunda başlar. Field-level validation mesajları ve kalıcı bağlam bildirimleri inline kalır.

## Veri, Cache ve Yayınlama Modeli

1. **Editable/canonical veri:** Admin tarafından yönetilen bölgeler, haşereler, kombinasyonlar, mesajlar ve taslak dokümanlar Firestore'da tutulur.
2. **Published veri:** Public site doğrudan editable koleksiyonlara dönmez; yetkili yayın akışı `system/publicSnapshot` dokümanındaki canonical public görünümü oluşturur.
3. **Sağlayıcı sırası:** Public çözümleyici önce Firestore published snapshot'ını okur. Geçerli snapshot alınamazsa Upstash Redis'teki `last-known-good` kopyaya düşer.
4. **Next.js cache:** Public projeksiyonlar `"use cache"`, `cacheLife("max")` ve domain bazlı `cacheTag` değerleriyle cache'lenir. Başarılı aktivasyon yalnızca değişen tag'leri `updateTag` ile geçersiz kılar.
5. **Normal save ve publish ayrımı:** Ayar, site görseli ve yorum kaydetme işlemleri taslak üretir; public görünüm **Canlı Siteyi Güncelle** sonrasında değişir. Toplu AI worker canonical kombinasyon kaydı oluşturur ancak public snapshot'ı kendiliğinden yayınlamaz. Aktiflik mutasyonları kontrollü published patch/aktivasyon dener ve yayınlama gerektiğinde admin'e bildirir.

Redis aktivasyonu veya cache invalidation başarısız olursa Firestore'daki commit geri alınmaz; pending aktivasyon bilgisi korunur ve sonraki yayın denemesinde tekrar değerlendirilebilir.

## Toplu Kombinasyon Worker'ı

Admin panelindeki toplu üretim akışı:

1. Eksik kombinasyonları hesaplar ve Firestore'da tek bir aktif job oluşturur.
2. GitHub REST API ile `.github/workflows/generate-combinations.yml` workflow'unu dispatch eder.
3. GitHub runner `npm ci` sonrasında `combinations:worker` scriptini çalıştırır.
4. Worker job'ı transaction içinde claim eder, öğeleri sırayla işler, heartbeat/ilerleme yazar ve sınırlı retry uygular.
5. Durdurma isteği queued işi kapatır veya çalışan worker'ın bir sonraki güvenli sınırda durmasını sağlar.

GitHub workflow concurrency grubu aynı anda birden fazla combination-generation run'ının çalışmasını engeller. Worker create-only/idempotent kontrollerle mevcut kaydın üzerine yazmaz ve secret ya da üretilmiş içeriği loglamaz.

## Kurulum

Gereksinimler:

- Node.js `>=22.0.0`
- npm ve repository'deki `package-lock.json`
- Kullanılacak özelliklere göre Firebase, Upstash, Gemini, GitHub, Cloudinary, Telegram ve Google Cloud yapılandırmaları

```bash
npm ci
```

Kök dizinde `.env.local` oluşturun. Repository'de `.env.example` bulunmadığı için değişken adlarını aşağıdaki tablolardan alın; gerçek secret veya service account içeriğini dokümana ya da Git'e eklemeyin.

Geliştirme sunucusu:

```bash
npm run dev
```

Production:

```bash
npm run build
npm run start
```

## Environment Variables

### Çekirdek Firebase ve admin yapılandırması

Aşağıdaki client değişkenlerinin tamamı `src/lib/firebase.ts` tarafından gerekli kabul edilir:

```text
NEXT_PUBLIC_FIRESTORE_API_KEY
NEXT_PUBLIC_FIRESTORE_AUTH_DOMAIN
NEXT_PUBLIC_FIRESTORE_PROJECT_ID
NEXT_PUBLIC_FIRESTORE_STORAGE_BUCKET
NEXT_PUBLIC_FIRESTORE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIRESTORE_APP_ID
NEXT_PUBLIC_FIRESTORE_MEASUREMENT_ID
```

Server-side Firestore, Authentication ve admin erişimi:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
ADMIN_EMAIL
```

### Production altyapısı

| Değişken | Kullanım |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Public last-known-good snapshot ve rate-limit Redis bağlantısı |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST kimlik bilgisi |
| `RATE_LIMIT_SECRET` | IP/telefon gibi rate-limit kimliklerini HMAC-SHA256 ile hash'leme |
| `NEXT_PUBLIC_SITE_URL` | Canonical metadata, sitemap ve mutlak URL tabanı; yoksa dictionary fallback'i kullanılır |

Upstash ve `RATE_LIMIT_SECRET` geliştirmede eksikse rate limit uyarı vererek bypass edilebilir; production'da iletişim ve login rate-limit akışları fail-closed davranır.

### Özellik bazlı yapılandırma

| Özellik | Değişkenler |
| --- | --- |
| Gemini | `GEMINI_API_KEYS` veya `GEMINI_API_KEY` |
| GitHub Actions dispatch | `GITHUB_ACTIONS_TOKEN`, `GITHUB_REPOSITORY`, `GITHUB_ACTIONS_REF`, `GITHUB_ACTIONS_WORKFLOW` |
| Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Telegram bildirimleri | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Telegram webhook | `TELEGRAM_WEBHOOK_SECRET`; origin için `TELEGRAM_WEBHOOK_ORIGIN` veya Vercel tarafından sağlanan `VERCEL_PROJECT_PRODUCTION_URL` |
| Vercel korumalı webhook | Opsiyonel `VERCEL_AUTOMATION_BYPASS_SECRET` |
| Google yorum istatistikleri | Yayınlanmış Google Place ID kullanılıyorsa `GOOGLE_PLACES_API_KEY` |
| Footer geliştirici bilgisi | Opsiyonel `NEXT_PUBLIC_DEVELOPER_NAME` |

`NODE_ENV`, `GITHUB_RUN_ID` ve `GITHUB_RUN_ATTEMPT` runtime/CI tarafından sağlanır; kullanıcı secret'ı değildir. GitHub Actions worker için Firebase Admin ve Gemini değerleri repository Actions secrets alanında ayrıca tanımlanmalıdır.

## Kullanılabilir Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Next.js geliştirme sunucusu |
| `npm run lint` | ESLint kontrolü |
| `npx tsc --noEmit` | TypeScript tip kontrolü |
| `npm run build` | Optimize production build |
| `npm run start` | Production sunucusu |
| `npm run combinations:worker -- --job-id <job-id>` | Belirli Firestore toplu üretim job'ını çalıştırır; normalde GitHub Actions çağırır |
| `npm run telegram:webhook:set -- --dry-run` | Production webhook endpoint ve secret eşleşmesini kayıt yapmadan doğrular |
| `npm run telegram:webhook:set` | Telegram webhook'unu kaydeder ve `getWebhookInfo` ile doğrular |

Commit öncesi önerilen kontrol seti:

```bash
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

## Güvenlik ve Dayanıklılık

- `/admin/:path*` istekleri proxy katmanında session cookie, token iptali ve email allowlist ile doğrulanır.
- Korunan Server Action'lar UI kontrolüne güvenmeden `requireAdmin` çağırır.
- Zod şemaları action input'larını, job belgelerini, provider yanıtlarını ve webhook payload'larını doğrular.
- Public rich text, izinli tag/attribute/scheme listesiyle `sanitize-html` üzerinden render edilir.
- İletişim ve admin login akışları Upstash sliding-window rate limit kullanır; ham IP/telefon yerine HMAC hash saklanır.
- İletişim formunda honeypot ve bekleyen talep limiti bulunur. Telegram başarısız olsa bile Firestore'a kaydedilmiş lead başarılı kabul edilir.
- Görsel yüklemede MIME, dosya boyutu ve dosya imzası doğrulanır; Cloudinary secret client bundle'a gönderilmez.
- Telegram webhook yalnızca doğru secret header'ı kabul eder ve callback verisini Zod ile sınırlar.
- Firestore toplu job transaction'ları ve GitHub concurrency duplicate worker/job riskini sınırlar.
- Public route'lar inactive veya archived kayıtları snapshot projeksiyonunda filtreler.

## Deployment ve Operasyon Notları

- Deployment ortamı Node.js 22 veya üzerini sağlamalıdır.
- `next/font/google` kullanıldığı için build sırasında Google Fonts erişimi gerekebilir.
- Statik parametreler ve sitemap published snapshot sağlayıcı zincirini kullanır; deployment sırasında geçerli Firestore snapshot veya Redis fallback erişimi bulunmalıdır.
- Firebase private key satır sonları environment değerinde escaped ise server başlangıcında normalize edilir.
- Telegram webhook origin'i yalnızca HTTPS production origin kabul eder; localhost, private hostname ve IP adresleri reddedilir.
- Deployment Protection kullanılıyorsa automation bypass secret yalnızca deployment platformunun secret alanında tutulmalıdır.
- GitHub fine-grained token yalnızca ilgili repository ve Actions read/write yetkisiyle sınırlandırılmalıdır.
- `.env`, `.env.local`, service account dosyaları, API anahtarları ve webhook secret'ları commit edilmemelidir.

## Proje Yapısı

```text
src/
  app/            App Router route'ları, metadata ve API endpoint'leri
  components/     Ortak layout ve UI bileşenleri
  constants/      Route, dictionary ve UI sabitleri
  features/       Domain bazlı action, schema, data ve bileşenler
  hooks/          Ortak client hook'ları
  lib/            Server entegrasyonları, auth, cache ve provider katmanı
  types/          Paylaşılan TypeScript tipleri
  utils/          Saf yardımcı fonksiyonlar
scripts/          Combination worker ve Telegram webhook aracı
.github/workflows GitHub Actions toplu üretim workflow'u
public/           Logo ve statik görseller
```
