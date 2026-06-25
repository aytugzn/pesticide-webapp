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
    viewAllPests: "Tüm Hizmetleri Gör",
    viewAllRegions: "Tüm Bölgeleri Gör",
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
  whyUs: {
    title: "Nasıl Çalışırız?",
    titlePrefix: "Farkımız ",
    titleHighlight: "ve Kalitemiz",
    description: "İzmir genelinde müşteri memnuniyeti odaklı çalışıyor, sorunu geçici değil kalıcı olarak çözüyoruz.",
    steps: [
      {
        title: "Ücretsiz Keşif & Analiz",
        description: "Mekanı inceliyor, böcek veya kemirgen türünü tespit ederek en doğru müdahale yöntemini belirliyoruz.",
      },
      {
        title: "Sağlık Bakanlığı Onaylı İlaçlar",
        description: "İnsan ve evcil hayvan sağlığına zarar vermeyen, kokusuz ve çevre dostu biyosidal ürünler kullanıyoruz.",
      },
      {
        title: "Garantili ve Kesin Çözüm",
        description: "Sadece var olanları değil, yuvaları da hedef alarak %100 kalıcı koruma sağlıyoruz.",
      },
      {
        title: "7/24 Kesintisiz Destek",
        description: "Uygulama sonrası da sizi yalnız bırakmıyor, her türlü sorunuz için hızlı destek veriyoruz.",
      }
    ]
  },
  contact: {
    title: "BİZ SİZİ ARAYALIM",
    titlePrefix: "Ücretsiz",
    titleHighlight: "Keşif ve Danışma",
    description: "Aşağıdaki formu doldurun, uzman ekibimiz en kısa sürede size dönüş yapıp sorununuzu çözsün.",
    form: {
      name: "Adınız Soyadınız",
      namePlaceholder: "Örn: Ahmet Demir",
      phone: "Telefon Numaranız",
      phonePlaceholder: "0555 555 55 55",
      service: "Hangi Hizmetle İlgileniyorsunuz?",
      servicePlaceholder: "Lütfen seçiniz",
      region: "Bulunduğunuz Bölge",
      regionPlaceholder: "Lütfen seçiniz",
      other: "Diğer (Listede Yok)",
      otherValue: "Diğer",
      optionalText: "(İsteğe Bağlı)",
      submit: "Hemen Aranma Talebi Oluştur",
      submitting: "Gönderiliyor...",
      success: "Talebiniz başarıyla alındı! En kısa sürede aranacaksınız.",
      error: "Bir hata oluştu, lütfen daha sonra tekrar deneyin veya bizi arayın."
    },
    validation: {
      nameRequired: "Lütfen adınızı ve soyadınızı girin.",
      nameMin: "Adınız en az 2 karakter olmalıdır.",
      nameMax: "Adınız çok uzun, lütfen kontrol edin.",
      nameInvalid: "Geçerli bir isim giriniz.",
      phoneRequired: "Lütfen telefon numaranızı girin.",
      phoneRegex: "Lütfen geçerli bir telefon numarası girin (Sadece rakam, boşluk ve + işareti).",
      phoneInvalid: "Lütfen telefon numaranızı eksiksiz (10 veya 11 hane) giriniz.",
      invalidFormat: "Lütfen formdaki hataları düzeltin.",
      rateLimit: "Çok fazla istek gönderdiniz. Lütfen 1 dakika sonra tekrar deneyin.",
    },
    telegram: {
      template: "🔔 YENİ ARANMA TALEBİ 🔔\n=====================\n👤 Ad Soyad: {name}\n📞 Telefon: {phone}\n🛠️ Hizmet: {service}\n📍 Bölge: {region}\n=====================",
      notSpecified: "Belirtilmedi"
    }
  },
};

const footerDict = {
  brand: "DMR İlaçlama",
  description: "İzmir genelinde Sağlık Bakanlığı onaylı, profesyonel ve garantili böcek, haşere ve kemirgen ilaçlama hizmetleri sunuyoruz.",
  sections: {
    corporate: "Kurumsal",
    services: "Hizmetlerimiz",
    regions: "Hizmet Bölgeleri",
    contact: "İletişim",
  },
  links: {
    about: "Hakkımızda",
    services: "Tüm Hizmetler",
    contact: "İletişim",
    certificates: "İzinler & Sertifikalar",
    privacy: "Gizlilik Politikası",
    terms: "Kullanım Koşulları",
    kvkk: "KVKK Aydınlatma Metni",
  },
  contact: {
    address: "İzmir, Karabağlar — 9073. Sk. 15A, 35160",
    email: "info@dmrilaclama.com",
    addressAria: "Adresimiz",
    emailAria: "Bize E-posta Gönderin",
    phoneAria: "Bizi Arayın",
  },
  developer: {
    title: "Tarafından Geliştirildi",
    name: "Aytuğ Uzun"
  }

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
    telegram: "CRITICAL ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.",
  },
  api: {
    googlePlacesFailed: "Google Places API request failed",
    googlePlacesNoData: "Google Places API warning: No valid data found in response",
    jsonParseFailed: "Failed to extract JSON from AI response. Raw text: ",
    telegramFailed: "Telegram API Error",
  },
  logs: {
    homeDataFetch: "Error occurred while fetching home page data",
    login: "Error occurred during login process",
    sessionCreation: "Error occurred while creating session",
    globalDataFetch: "Error occurred while fetching global data",
    layoutSettingsFetch: "Error occurred while fetching layout settings",
    telegramSend: "Error occurred while sending telegram message",
    telegramConfig: "System configuration error (Logged)",
    tokenVerification: "Token verification error",
    cronJobFailed: "Cron job execution failed",
  },
  telegramReturns: {
    missingConfig: "Missing Telegram configuration",
    apiFailed: "Telegram API request failed",
    networkError: "Network error sending Telegram message",
  }
};

const cronDict = {
  responses: {
    unauthorized: "Unauthorized request",
    settingsNotFound: "Settings not found in database",
    success: "Google Places stats updated successfully via cron.",
    noUpdateNeeded: "No update needed. Time threshold has not passed yet.",
    internalError: "Internal Server Error",
  }
};

const globalDict = {
  copyright: "© {year} DMR İlaçlama. Tüm hakları saklıdır.",
};

export const DICTIONARY = deepFreeze({
  global: globalDict,
  navbar: navbarDict,
  footer: footerDict,
  auth: authDict,
  home: homeDict,
  meta: metaDict,
  gemini: geminiDict,
  social: socialDict,
  admin: adminDict,
  globalError: globalErrorDict,
  systemErrors: systemErrorsDict,
  cron: cronDict,
} as const);
