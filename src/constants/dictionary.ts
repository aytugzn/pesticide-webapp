import { deepFreeze } from "../utils/deep-freeze";

const navbarDict = {
  logo: {
    alt: "DMR İlaçlama Logo",
    title: "DMR İlaçlama - Profesyonel Çözümler",
  },
  links: {
    services: "Hizmetlerimiz",
    about: "Hakkımızda",
    contact: "İletişim",
  },
  columns: {
    pests: "HAŞERE TÜRÜNE GÖRE",
    regions: "HİZMET BÖLGELERİ",
  },
  emptyStates: {
    pests: "Kayıtlı haşere bulunamadı.",
    regions: "Kayıtlı bölge bulunamadı.",
  },
  mobileMenu: {
    title: "Menü",
    openAria: "Menüyü Aç",
    closeAria: "Kapat",
    navAria: "Mobil Menü Bağlantıları",
  },
};

const authDict = {
  login: {
    title: "Yönetim Paneli",
    subtitle: "Devam etmek için yetkili hesabınızla giriş yapın.",
    button: "Google ile Giriş Yap",
    loadingButton: "Giriş yapılıyor...",
    error: "Giriş yapılamadı. Lütfen tekrar deneyin.",
    page: {
      badge: "Yönetim Paneli",
      brand: "DMR İlaçlama",
      tagline: "Dezenfeksiyon & Çevre Sağlığı Hizmetleri",
      copyright: "© {year} DMR İlaçlama. Tüm hakları saklıdır.",
      metadataTitle: "Giriş | DMR İlaçlama",
    }
  }
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
  phone: {
    callNow: "Hemen Ara",
    callMeBack: "Biz Sizi Arayalım",
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
    avatarTitleSuffix: "Müşteri Değerlendirmesi",
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
};

const metaDict = {
  default: {
    title: "İzmir Profesyonel Böcek & Haşere İlaçlama | DMR",
    description: "İzmir'de Sağlık Bakanlığı onaylı ruhsatlı ilaçlar ile profesyonel böcek ve haşere ilaçlama. Eviniz ve iş yeriniz için garantili çözümler. Hemen arayın!",
    keywords: ["böcek ilaçlama", "izmir böcek ilaçlama", "haşere ilaçlama", "fare ilaçlama", "pire ilaçlama", "apartman ilaçlama", "dmr ilaçlama", "profesyonel ilaçlama"],
    author: "DMR İlaçlama",
    publisher: "DMR İlaçlama",
    alt: "DMR İlaçlama",
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  og: {
    image: {
      fallback: "/og-image.png",
      width: 1200,
      height: 630,
    }
  }
};

const geminiDict = {
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
  buttons: {
    retry: "Tekrar Dene",
    home: "Ana Sayfaya Dön",
  }
};

const systemErrorsDict = {
  env: {
    firebaseClient: "CRITICAL ERROR: Firebase client environment variables are missing!",
    firebaseAdmin: "CRITICAL ERROR: Firebase Admin .env variables are missing!",
    gemini: "CRITICAL ERROR: GEMINI_API_KEY environment variable is missing.",
    googlePlaces: "CRITICAL ERROR: GOOGLE_PLACES_API_KEY environment variable is missing.",
  },
  api: {
    googlePlacesFailed: "Google Places API request failed",
    googlePlacesNoData: "Google Places API warning: No valid data found in response",
    jsonParseFailed: "Failed to extract JSON from AI response. Raw text: ",
  },
  logs: {
    homeDataFetch: "Error occurred while fetching home page data",
    login: "Error occurred during login process",
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
