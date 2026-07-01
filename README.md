# DMR İlaçlama Web Platformu

## Hakkında

Bu proje, DMR İlaçlama için özel olarak geliştirilmiş kurumsal bir web platformudur. Next.js 16 tabanlı, gelişmiş SEO optimizasyon yapısı ve AI destekli içerik üretim akışıyla tasarlanmıştır. İçerisinde, hizmet bölgeleri ve haşere türlerine göre otomatik veya manuel kombinasyon içerikleri (sayfaları) üretebilen gelişmiş bir admin paneli barındırır.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **Firebase / Firebase Admin** (Auth, Firestore Veritabanı)
- **Gemini API** (Yapay zeka ile dinamik SEO içerik üretimi)
- **Zod** (Şema validasyonları)
- **sanitize-html** (Güvenli HTML render işlemleri)
- **Tailwind CSS v4**

## Kurulum ve Çalıştırma

Projenin yerelde çalıştırılması için aşağıdaki adımları izleyin:

1. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

2. `.env.local` dosyasını ana dizinde oluşturun ve gerekli ortam değişkenlerini ekleyin:

   ```env
   # Genel Ayarlar
   NEXT_PUBLIC_SITE_URL=""
   GOOGLE_PLACES_API_KEY=""

   # Firebase İstemci Yapılandırması
   NEXT_PUBLIC_FIRESTORE_API_KEY=""
   NEXT_PUBLIC_FIRESTORE_AUTH_DOMAIN=""
   NEXT_PUBLIC_FIRESTORE_PROJECT_ID=""
   NEXT_PUBLIC_FIRESTORE_STORAGE_BUCKET=""
   NEXT_PUBLIC_FIRESTORE_MESSAGING_SENDER_ID=""
   NEXT_PUBLIC_FIRESTORE_APP_ID=""
   NEXT_PUBLIC_FIRESTORE_MEASUREMENT_ID=""

   # Firebase Admin Yapılandırması
   FIREBASE_PROJECT_ID=""
   FIREBASE_CLIENT_EMAIL=""
   FIREBASE_PRIVATE_KEY=""

   # Gemini API
   GEMINI_API_KEY=""

   # Admin ve Diğer Ayarlar
   ADMIN_EMAIL=""
   TELEGRAM_BOT_TOKEN=""
   TELEGRAM_CHAT_ID=""
   TELEGRAM_WEBHOOK_SECRET=""
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
   _Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek siteyi görüntüleyebilirsiniz._

## Kontrol Komutları (Test ve Doğrulama)

Kodu commit'lemeden veya canlı ortama (production) almadan önce proje standartlarını kontrol etmek için aşağıdaki komutları kullanın:

```bash
# Linter kontrolü
npm run lint

# TypeScript derleme kontrolü (emit yapmadan)
npx tsc --noEmit

# Production build kontrolü
npm run build

# Git whitespace ve conflict kontrolü
git diff --check
```

## Deployment Notları

- **Minimum Gereksinim:** Node.js **22.0.0+** sürümü gereklidir.
- Sunucu ortamında (Vercel vb.) `.env.local` dosyasındaki tüm çevresel değişkenlerin (`Environment Variables`) eksiksiz tanımlanması zorunludur.
- Deployment öncesinde `npm run lint`, `npx tsc --noEmit` ve `npm run build` komutlarının hatasız geçtiğinden kesinlikle emin olunmalıdır.

## ⚠️ Güvenlik ve Gizlilik

- Hiçbir koşulda `.env.local` dosyası veya içerisindeki bilgiler GitHub / Git repolarına **commit edilmemelidir**. (`.gitignore` dosyasında `.env*` kuralı ile tüm çevre değişkeni dosyaları korunmaktadır.)
- `FIREBASE_PRIVATE_KEY` ve `GEMINI_API_KEY` gibi anahtarlar kritik derecede gizlidir ve istemci (client) tarafına kesinlikle sızdırılmamalıdır (`NEXT_PUBLIC_` prefixi kullanılmamalıdır).
- `ADMIN_EMAIL` ortam değişkeni, Firebase Auth ile giriş yapan kullanıcıların admin paneline erişimini **Next.js Middleware (Proxy) seviyesinde sınırlandırmak** için kullanılmaktadır. Sadece bu e-posta adresine sahip olan kimlik doğrulamaları geçerli kabul edilir.
