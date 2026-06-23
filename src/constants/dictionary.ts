import { deepFreeze } from "../utils/deep-freeze";

const navbarDict = {
  logoAlt: "DMR İlaçlama Logo",
  services: "Hizmetlerimiz",
  about: "Hakkımızda",
  contact: "İletişim",
  pestsCol: "HAŞERE TÜRÜNE GÖRE",
  regionsCol: "HİZMET BÖLGELERİ",
  emptyPests: "Kayıtlı haşere bulunamadı.",
  emptyRegions: "Kayıtlı bölge bulunamadı.",
  callNow: "Hemen Ara",
  callMeBack: "Biz Sizi Arayalım",
  mobileMenuAria: "Menüyü Aç",
};

const authDict = {
  loginTitle: "Yönetim Paneli",
  loginSubtitle: "Devam etmek için yetkili hesabınızla giriş yapın.",
  loginButton: "Google ile Giriş Yap",
  loadingButton: "Giriş yapılıyor...",
  genericError: "Giriş yapılamadı. Lütfen tekrar deneyin.",
};

const socialDict = {
  instagram: {
    url: "https://instagram.com/dmrilaclama",
    aria: "Instagram hesabımızı ziyaret edin",
  },
  facebook: {
    url: "https://facebook.com/dmrilaclama",
    aria: "Facebook sayfamızı ziyaret edin",
  },
  whatsapp: {
    text: "WhatsApp",
    aria: "WhatsApp ile İletişime Geç",
  },
};

const homeDict = {
  hero: {
    tagline: "Profesyonel İlaçlama ve Dezenfeksiyon Hizmetleri",
    titleLine1: "Bir Adım Önde,",
    titleLine2: "Güvenle Adım Atın",
    description1: "İşletmenizi veya evinizi zararlı böceklerden ve haşerelerden",
    description2: "korumak için profesyonel ve garantili çözümler sunuyoruz.",
    description3: "Zararlıların kabusunuz olmasına izin vermeyin. Hemen bizimle iletişime geçin.",
    desktopCall: "Ara — Ücretsiz Keşif",
  },
  googleStats: {
    businessName: "DMR İLAÇLAMA",
    businessCategory: "İzmir Profesyonel İlaçlama Firması",
    rating: "5.0",
    reviewCount: "244",
    reviewsText: "Google Yorumu",
    verifiedBadgeAria: "Doğrulanmış İşletme",
  },
  googleReviews: {
    title: "Müşterilerimiz Ne Diyor?",
    description: "Google Haritalar üzerinden işletmemize yapılan gerçek ve doğrulanmış müşteri yorumları.",
    viewAllButton: "Tüm Yorumları Google'da Gör",
    ariaStars: "5 yıldızlı müşteri memnuniyeti",
    ariaRating: "yıldızlı değerlendirme",
  },
  services: {
    title: "Hizmetlerimiz",
    titlePrefix: "Garantili ",
    titleHighlight: "Çözümler",
    description: "İzmir genelinde sunduğumuz profesyonel ve garantili böcek, haşere ve kemirgen ilaçlama hizmetleri.",
    viewDetails: "İncele",
    defaultPestDesc: "Sağlık Bakanlığı onaylı ve garantili yöntemlerle, alanınıza özel profesyonel ilaçlama çözümleri sunuyoruz.",
    viewAllServices: "Tüm Hizmetlerimizi Görüntüle",
    viewAllServicesDesc: "Haşere ve kemirgen türlerine yönelik sunduğumuz diğer tüm profesyonel hizmetleri inceleyin.",
    pestTitleSuffix: "İlaçlama",
  },
  stickyActions: {
    callNow: "Hemen Ara",
  },
};

const metaDict = {
  title: "DMR İlaçlama | Profesyonel Böcek & Haşere İlaçlama",
  description: "İzmir'de Sağlık Bakanlığı onaylı ruhsatlı ilaçlar ile profesyonel böcek ve haşere ilaçlama. Eviniz ve iş yeriniz için garantili çözümler. Hemen arayın!",
  defaultAlt: "DMR İlaçlama",
  locale: "tr_TR",
  type: "website",
  twitterCard: "summary_large_image",
  ogImageFallback: "/og-image.png",
  ogImageWidth: 1200,
  ogImageHeight: 630,
};

const geminiDict = {
  errors: {
    missingApiKey: "GEMINI_API_KEY ortam değişkeni bulunamadı.",
  },
  model: "gemini-2.0-flash",
  outputLanguage: "Turkish",
  jsonFormat: '{ "title": "...", "h1": "...", "metaDesc": "...", "content": "...", "faq": [{"question": "...", "answer": "..."}] }',
};

const adminDict = {
  dashboard: {
    title: "DMR İlaçlama",
    subtitle: "Yönetim Paneli",
    navAria: "Admin navigasyon",
    menu: {
      regions: "Bölgeler",
      pests: "Haşereler",
      combinations: "Kombinasyonlar",
      reports: "Raporlar",
      messages: "Mesajlar",
      reviews: "Yorumlar",
      settings: "Ayarlar",
    }
  },
  reviews: {
    title: "Müşteri Yorumları",
    addFirst: "İlk Yorumu Ekle",
    addReview: "Yeni Yorum Ekle",
    customerName: "Müşteri İsmi",
    reviewText: "Yorum Metni",
    moveUp: "Yukarı Taşı",
    moveDown: "Aşağı Taşı",
    delete: "Sil",
    save: "Değişiklikleri Kaydet",
    saving: "Kaydediliyor...",
    cancel: "İptal",
  }
};

const globalErrorDict = {
  title: "Bir Şeyler Ters Gitti",
  description: "Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin veya daha sonra tekrar ziyaret edin.",
  retryButton: "Tekrar Dene",
  backToHome: "Ana Sayfaya Dön",
};

const systemErrorsDict = {
  firebaseClientEnvMissing: "CRITICAL ERROR: Firebase client environment variables are missing!",
  firebaseAdminEnvMissing: "CRITICAL ERROR: Firebase Admin .env variables are missing!",
  geminiApiKeyMissing: "CRITICAL ERROR: GEMINI_API_KEY environment variable is missing.",
  googlePlacesApiMissing: "CRITICAL ERROR: GOOGLE_PLACES_API_KEY environment variable is missing.",
  googlePlacesApiFailed: "Google Places API request failed",
  googlePlacesApiNoData: "Google Places API warning: No valid data found in response",
  logs: {
    homeDataFetch: "Error occurred while fetching home page data",
    loginError: "Error occurred during login process",
    sessionCreation: "Error occurred while creating session",
    navbarDataFetch: "Error occurred while fetching navbar data",
    layoutSettingsFetch: "Error occurred while fetching layout settings",
  }
};

export const DICTIONARY = deepFreeze({
  navbar: navbarDict,
  auth: authDict,
  home: homeDict,
  meta: metaDict,
  gemini: geminiDict,
  social: socialDict,
  admin: adminDict,
  globalError: globalErrorDict,
  systemErrors: systemErrorsDict,
} as const);
