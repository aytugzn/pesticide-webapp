import { deepFreeze } from "../utils/deep-freeze";

const navbarDict = {
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
    viewAllPestsDesc:
      "İzmir genelinde sunduğumuz tüm ilaçlama ve dezenfeksiyon hizmetlerini birlikte inceleyin.",
    viewAllRegionsDesc:
      "DMR İlaçlama'nın İzmir'de hizmet verdiği tüm aktif bölgeleri tek listede görüntüleyin.",
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
    },
  },
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
    description: "İşletmenizi veya evinizi zararlı böceklerden ve haşerelerden korumak için profesyonel ve garantili çözümler sunuyoruz.",
    descriptionCta:
      "Zararlıların kabusunuz olmasına izin vermeyin. Hemen bizimle iletişime geçin.",
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
    description:
      "Google Haritalar üzerinden işletmemize yapılan gerçek ve doğrulanmış müşteri yorumları.",
    viewAllButton: "Tüm Yorumları Google'da Gör",
    ariaStars: "5 yıldızlı müşteri memnuniyeti",
    ariaRating: "yıldızlı değerlendirme",
    avatarTitleSuffix: "Müşteri Değerlendirmesi",
  },
  services: {
    title: "Hizmetlerimiz",
    titlePrefix: "Garantili ",
    titleHighlight: "Çözümler",
    description:
      "İzmir genelinde sunduğumuz profesyonel ve garantili böcek, haşere ve kemirgen ilaçlama hizmetleri.",
    viewDetails: "İncele",
    defaultPestDesc:
      "Sağlık Bakanlığı onaylı ve garantili yöntemlerle, alanınıza özel profesyonel ilaçlama çözümleri sunuyoruz.",
    viewAllServices: "Tüm Hizmetlerimizi Görüntüle",
    viewAllServicesDesc:
      "Haşere ve kemirgen türlerine yönelik sunduğumuz diğer tüm profesyonel hizmetleri inceleyin.",
    pestTitleSuffix: "İlaçlama",
  },
  whyUs: {
    title: "Nasıl Çalışırız?",
    titlePrefix: "Farkımız ",
    titleHighlight: "ve Kalitemiz",
    description:
      "İzmir genelinde keşiften uygulama sonrasına kadar şeffaf, güvenli ve takip edilebilir bir süreç yürütüyoruz.",
    steps: [
      {
        title: "Ücretsiz Keşif & Analiz",
        description:
          "Mekanı inceliyor, böcek veya kemirgen türünü tespit ederek en doğru müdahale yöntemini belirliyoruz.",
      },
      {
        title: "Sağlık Bakanlığı Onaylı İlaçlar",
        description:
          "İnsan ve evcil hayvan sağlığına zarar vermeyen, kokusuz ve çevre dostu biyosidal ürünler kullanıyoruz.",
      },
      {
        title: "Garantili ve Kesin Çözüm",
        description:
          "Sadece var olanları değil, yuvaları da hedef alarak %100 kalıcı koruma sağlıyoruz.",
      },
      {
        title: "7/24 Kesintisiz Destek",
        description:
          "Uygulama sonrası da sizi yalnız bırakmıyor, her türlü sorunuz için hızlı destek veriyoruz.",
      },
    ],
  },
  contact: {
    title: "BİZ SİZİ ARAYALIM",
    titlePrefix: "Ücretsiz",
    titleHighlight: "Keşif ve Danışma",
    description:
      "Formu doldurabilir, bizi doğrudan arayabilir veya WhatsApp üzerinden hızlıca ulaşabilirsiniz. Uzman ekibimiz ihtiyacınıza göre en uygun yönlendirmeyi yapar.",
    channels: {
      title: "Tüm iletişim kanallarımız",
      description:
        "Acil durum, keşif talebi veya hizmet bilgisi için size en uygun kanaldan DMR İlaçlama ekibine ulaşın.",
      phoneTitle: "Telefon",
      phoneDesc: "Hızlı bilgi ve randevu için doğrudan arayın.",
      whatsappTitle: "WhatsApp",
      whatsappDesc: "Fotoğraf, konum veya kısa not ile talebinizi iletin.",
      emailTitle: "E-posta",
      emailDesc: "Kurumsal talepler ve detaylı bilgi için yazın.",
      addressTitle: "Adres",
      addressDesc: "İzmir merkezli ekibimiz bölgelere planlı servis sağlar.",
      hoursTitle: "Çalışma Saatleri",
      hoursDesc: "Uygun servis zamanı için güncel saatleri kontrol edin.",
      instagramTitle: "Instagram",
      instagramDesc: "Güncel paylaşımlar ve duyurular için takip edin.",
      facebookTitle: "Facebook",
      facebookDesc: "Sosyal medya üzerinden de bizimle iletişimde kalın.",
      processTitle: "Talep sonrası süreç",
      processDescription:
        "Form gönderildikten sonra ekibimiz ihtiyacı netleştirir ve size en uygun servis planını oluşturur.",
      processSteps: [
        {
          title: "Talebiniz alınır",
          description:
            "İletişim bilgileriniz, seçtiğiniz hizmet ve bölge bilgisi ekibimize ulaşır.",
        },
        {
          title: "İhtiyaç netleşir",
          description:
            "Alan, haşere türü ve aciliyet durumuna göre kısa bir ön değerlendirme yapılır.",
        },
        {
          title: "Servis planlanır",
          description:
            "Size uygun zaman aralığı belirlenir ve uygulama süreci için dönüş sağlanır.",
        },
      ],
    },
    form: {
      name: "Adınız Soyadınız",
      namePlaceholder: "Örn: Ahmet Demir",
      phone: "Telefon Numaranız",
      phonePlaceholder: "0 (555) 555 55 55",
      phoneHint: "(11 Hane)",
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
      error:
        "Bir hata oluştu, lütfen daha sonra tekrar deneyin veya bizi arayın.",
    },
    validation: {
      nameRequired: "Lütfen adınızı ve soyadınızı girin.",
      nameMin: "Adınız en az 2 karakter olmalıdır.",
      nameMax: "Adınız çok uzun, lütfen kontrol edin.",
      nameInvalid: "Geçerli bir isim giriniz.",
      phoneRequired: "Lütfen telefon numaranızı girin.",
      phoneRegex:
        "Lütfen geçerli bir telefon numarası girin (Sadece rakam, boşluk ve + işareti).",
      phoneInvalid:
        "Lütfen telefon numaranızı eksiksiz (10 veya 11 hane) giriniz.",
      invalidFormat: "Lütfen formdaki hataları düzeltin.",
      rateLimit:
        "Çok fazla istek gönderdiniz. Lütfen 1 dakika sonra tekrar deneyin.",
    },

    contactRequest: {
      pendingLimitReached: "Aktif iletişim talepleriniz işlenme aşamasında. Lütfen bekleyin.",
    },
  },
};

const footerDict = {
  brand: "DMR İlaçlama",
  description:
    "İzmir genelinde Sağlık Bakanlığı onaylı, profesyonel ve garantili böcek, haşere ve kemirgen ilaçlama hizmetleri sunuyoruz.",
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
  },
};

const metaDict = {
  default: {
    title: "İzmir Profesyonel Böcek & Haşere İlaçlama | DMR",
    description:
      "İzmir'de Sağlık Bakanlığı onaylı ruhsatlı ilaçlar ile profesyonel böcek ve haşere ilaçlama. Eviniz ve iş yeriniz için garantili çözümler. Hemen arayın!",
    keywords: [
      "böcek ilaçlama",
      "izmir böcek ilaçlama",
      "haşere ilaçlama",
      "fare ilaçlama",
      "pire ilaçlama",
      "apartman ilaçlama",
      "dmr ilaçlama",
      "profesyonel ilaçlama",
    ],
    author: "DMR İlaçlama",
    publisher: "DMR İlaçlama",
    alt: "DMR İlaçlama",
    locale: "tr_TR",
    type: "website",
  },
  regions: {
    title: "Hizmet Bölgeleri",
    description: "İzmir genelinde profesyonel ilaçlama hizmeti sunduğumuz aktif bölgeleri, mahalle dokusu ve ihtiyaç yoğunluğuna göre inceleyin.",
  },
  services: {
    title: "Hizmetler",
    description: "İzmir genelinde ev, apartman, işletme ve açık alanlarda uyguladığımız profesyonel böcek, haşere, kemirgen ve dezenfeksiyon çözümlerini inceleyin.",
  },
  about: {
    title: "Hakkımızda",
    description: "İzmir genelinde müşteri memnuniyeti odaklı çalışıyor, sorunu geçici değil kalıcı olarak çözüyoruz.",
  },
  contact: {
    title: "İletişim",
    description: "DMR İlaçlama ile telefon, WhatsApp, e-posta veya iletişim formu üzerinden hızlıca görüşün.",
  },
  privacy: {
    title: "Gizlilik Politikası",
    description: "DMR İlaçlama Gizlilik Politikası",
  },
  terms: {
    title: "Kullanım Koşulları",
    description: "DMR İlaçlama Kullanım Koşulları",
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    description: "DMR İlaçlama KVKK Aydınlatma Metni",
  },
  certificates: {
    title: "İzinler ve Sertifikalar",
    description: "DMR İlaçlama ruhsat, izin ve profesyonel hizmet standartları.",
  },
  twitter: {
    card: "summary_large_image",
  },
  og: {
    image: {
      fallback: "/og-image.jpg",
      width: 1200,
      height: 630,
      type: "image/jpeg",
    },
  },
};

const pagesDict = {
  regions: {
    heading: "Hizmet Bölgeleri",
    eyebrow: "Hizmet Bölgeleri",
    headerDesc: "İzmir'in farklı ilçe ve mahalle yapılarında karşılaşılan haşere riskleri değişir. DMR İlaçlama, her bölgenin bina yoğunluğu, iklim etkisi ve kullanım alışkanlıklarını dikkate alarak güvenli, planlı ve kalıcı ilaçlama hizmeti sunar.",
    regionTitleSuffix: " İlaçlama",
    regionDescSuffix: " bölgesinde profesyonel ilaçlama hizmetleri için yerel koşullara uygun keşif, uygulama ve takip süreci planlanır.",
    cardDescriptionTemplate:
      "{region} ve çevresinde ev, apartman, site ve işletmeler için hızlı keşif, güvenli uygulama ve işlem sonrası bilgilendirme desteği sağlıyoruz.",
    cardDescriptionFallback:
      "{region} için yerel koşullara uygun, güvenli ve planlı ilaçlama hizmeti sunuyoruz.",
    pestTitleSuffix: " İlaçlama",
  },
  services: {
    heading: "Hizmetler",
    eyebrow: "Hizmetlerimiz",
    headerDesc: "Böcek, haşere, kemirgen ve dezenfeksiyon ihtiyaçlarında doğru tür tespiti, güvenli ürün seçimi ve alanınıza uygun uygulama planı kritik önem taşır. DMR İlaçlama, İzmir genelinde yaşam ve çalışma alanlarına özel profesyonel çözümler sunar.",
    defaultPestDesc: "Sağlık Bakanlığı onaylı ürünler ve alanınıza uygun yöntemlerle, haşere kaynağını hedefleyen güvenli ve profesyonel ilaçlama çözümleri sunuyoruz.",
    cardDescriptionTemplate:
      "{service} için yaşam ve çalışma alanınıza uygun keşif, güvenli ürün seçimi ve doğru uygulama planı oluşturuyoruz.",
    cardDescriptionFallback:
      "Haşere türüne ve alanın kullanımına göre güvenli, planlı ve takip edilebilir ilaçlama hizmeti sunuyoruz.",
    pestTitleSuffix: "İlaçlama",
  },
  about: {
    heading: "Hakkımızda",
    eyebrow: "Hakkımızda",
    headerDesc: "DMR İlaçlama, İzmir'de ev, apartman, site ve işletmeler için güvenli, planlı ve takip edilebilir ilaçlama hizmeti sunar. Amacımız yalnızca uygulama yapmak değil, doğru tespit ve doğru yönlendirme ile müşterinin içini rahatlatmaktır.",
  },
  contact: {
    heading: "İletişim",
    eyebrow: "Bize Ulaşın",
    headerDesc: "Keşif, randevu, fiyat bilgisi veya acil yönlendirme için telefon, WhatsApp, e-posta ve iletişim formu üzerinden bize ulaşabilirsiniz.",
  },
  privacy: {
    heading: "Gizlilik Politikası",
    content: "İletişim formları ve dijital kanallar üzerinden paylaştığınız bilgiler, hizmet talebinizi yanıtlamak ve sizinle iletişime geçmek amacıyla işlenir.",
  },
  terms: {
    heading: "Kullanım Koşulları",
    content: "Bu web sitesindeki bilgiler genel bilgilendirme amaçlıdır. Hizmet kapsamı, uygulama koşulları ve fiyatlandırma keşif sonrasında netleştirilir.",
  },
  kvkk: {
    heading: "KVKK Aydınlatma Metni",
    content: "Talep formları aracılığıyla iletilen ad, telefon, hizmet ve bölge bilgileri; geri dönüş sağlamak, hizmet sürecini planlamak ve kayıt tutmak amacıyla işlenir.",
  },
  certificates: {
    heading: "İzinler ve Sertifikalar",
    eyebrow: "İzinler & Sertifikalar",
    headerDesc: "Ruhsatlı, kontrollü ve profesyonel ilaçlama hizmet standartlarımız.",
    certifiedProductsTitle: "Yetkili ve kayıtlı hizmet",
    operationStandardsParagraph: "DMR İlaçlama; hizmetlerinde onaylı ürünler, kayıtlı uygulama süreçleri ve müşteri güvenliğini merkeze alan operasyon standartlarıyla çalışır. Detaylı belge ve ruhsat bilgileri için bizimle iletişime geçebilirsiniz.",
  },
};

const telegramDict = {
  template:
    "🔔 YENİ ARANMA TALEBİ 🔔\n=====================\n👤 Ad Soyad: {name}\n📞 Telefon: {phone}\n🛠️ Hizmet: {service}\n📍 Bölge: {region}\n=====================",
  notSpecified: "Belirtilmedi",
  callButton: "📞 Hemen Ara",
  resolveButton: "✅ Arandı / Kapat",
  resolvedMessage: "✅ Bu talep işlenmiştir. Müşteri arandı.",
  dbErrorMessage: "⚠️ Müşteri arandı ancak veritabanından bilgi güncellenemedi. Lütfen işlemi admin sayfasından kontrol edin.",
  dbErrorAlert: "Veritabanı hatası! Lütfen admin paneline bakın.",
};

const geminiDict = {
  model: "gemini-3.5-flash",
  outputLanguage: "Turkish",
  jsonFormat:
    '{ "title": "...", "description": "...", "h1": "...", "metaDesc": "...", "content": "...", "faq": [{"question": "...", "answer": "..."}] }',
  promptExamples: {
    duration: "30-45 minutes",
    generalAnswer:
      "Süre, alanın büyüklüğüne ve istilanın durumuna göre değişiklik gösterir. Detaylı bilgi için uzmanlarımızla iletişime geçebilirsiniz.",
    aboutCompanyHeading: "Neden",
  },
};

const sharedSeoEntityAdminDict = {
  formSlug: "URL Slug",
  formDesc: "Kısa Açıklama",
  isActive: "Yayında",
  saving: "Kaydediliyor...",
  save: "Kaydet",
  errorRequired: "İsim ve slug zorunludur.",
  errorAiBusy: "Yapay zeka sunucuları şu an yoğun (503). Lütfen birkaç saniye bekleyip tekrar deneyin.",
  errorAiGen: "İçerik üretilirken bir hata oluştu.",
  errorAiVal: "Üretilen içerik doğrulanamadı. Lütfen tekrar deneyin.",
  errorQuotaExceeded: "AI kullanım limiti dolduğu için içerik üretilemedi. Daha sonra tekrar deneyin.",
  errorDefault: "Beklenmeyen bir hata oluştu.",
  generateBtn: "Yapay Zeka ile İçerik Üret",
  generatingBtn: "Üretiliyor...",
  regenerateBtn: "AI ile Yeniden Oluştur",
  regeneratingBtn: "Oluşturuluyor...",
  regenerateSuccess: "AI içeriği başarıyla yenilendi, kaydetmeden önce kontrol edebilirsiniz.",
  titleLabel: "Arama Motoru Başlığı (SEO Title)",
  h1Label: "Sayfa Ana Başlığı (H1)",
  metaLabel: "Arama Sonucu Açıklaması (Meta)",
  contentLabel: "Sayfa İçeriği",
  successGen: "Yapay zeka içeriği başarıyla oluşturuldu.",
  errorGen: "İçerik üretilemedi.",
  successSave: "Başarıyla kaydedildi. (Değişikliklerin canlıya yansıması için Global Güncelleme butonunu kullanın)",
  errorSave: "Kaydedilemedi.",
  updateSuccess: "Başarıyla güncellendi. (Değişikliklerin canlıya yansıması için Global Güncelleme butonunu kullanın)",
  updateError: "Güncellenirken bir hata oluştu.",
} as const;

const sharedSeoEntityTableDict = {
  slug: "Slug",
  status: "Durum",
  actions: "İşlemler",
  active: "Aktif",
  passive: "Pasif",
} as const;

const adminDict = {
  ownerShortcut: "DMR",
  preview: {
    button: "Önizle",
    title: "Önizleme",
    description: "Sayfanın canlıda nasıl görüneceğini test ediyorsunuz.",
    close: "Kapat",
  },
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
    },
    stats: {
      totalRegions: "Toplam Bölge",
      totalPests: "Toplam Haşere",
      totalCombinations: "Oluşturulan Sayfa",
      systemStatus: "Sistem Durumu",
      active: "Sistem Aktif",
    },
    logout: "Çıkış Yap",
    backToSite: "Siteye Dön",
    sidebarToggle: "Menüyü Aç/Kapat",
  },
  regions: {
    ...sharedSeoEntityAdminDict,
    title: "Bölgeler Yönetimi",
    description:
      "İzmir ilçelerini ve hizmet bölgelerini buradan yönetebilirsiniz.",
    addRegion: "Yeni Bölge Ekle",
    editRegion: "Bölge Düzenle",
    formName: "Bölge Adı",
    formNamePlaceholder: "Örn: Bornova",
    formSlugPlaceholder: "Otomatik oluşturulur",
    add: "Ekle",
    update: "Güncelle",
    cancel: "İptal",
    delete: "Sil",
    deleteConfirm: "Bu bölge kalıcı olarak silinecektir. Bu işlem geri alınamaz.",
    deleteSuccess: "Bölge başarıyla silindi.",
    empty: "Kayıtlı bölge bulunamadı.",
    errorDuplicate: "Bu bölge zaten kullanımda. Lütfen farklı bir isim girin.",
    deleteError: "Silinirken hata oluştu.",
    deleteInUseError: "Bu bölgeye bağlı kombinasyonlar olduğu için silinemez.",
    viewPublicPage: "Canlı sayfayı aç",
    generatorTitle: "Yeni Bölge Ekle / Düzenle",
    table: {
      ...sharedSeoEntityTableDict,
      name: "Bölge Adı",
    },
  },
  pests: {
    ...sharedSeoEntityAdminDict,
    title: "Haşereler Yönetimi",
    description: "İlaçlama yapılan haşere türlerini buradan yönetebilirsiniz.",
    addPest: "Yeni Haşere Ekle",
    editPest: "Haşere Düzenle",
    formName: "Haşere Adı",
    formNamePlaceholder: "Örn: Hamamböceği",
    formSlugPlaceholder: "Otomatik oluşturulur (-ilaclama eklenir)",
    formImage: "Resim URL (Opsiyonel)",
    empty: "Kayıtlı haşere bulunamadı.",
    errorDuplicate: "Bu haşere zaten kullanımda. Lütfen farklı bir isim girin.",
    delete: "Sil",
    deleteConfirm: "Bu haşere kalıcı olarak silinecektir. Bu işlem geri alınamaz.",
    deleteSuccess: "Haşere başarıyla silindi.",
    deleteError: "Silinirken hata oluştu.",
    deleteInUseError: "Bu haşereye bağlı kombinasyonlar olduğu için silinemez.",
    viewPublicPage: "Canlı sayfayı aç",
    generatorTitle: "Yeni Haşere Ekle / Düzenle",
    table: {
      ...sharedSeoEntityTableDict,
      name: "Haşere Adı",
    },
  },
  combinations: {
    title: "Kombinasyonlar (Yapay Zeka)",
    description:
      "Bölge ve haşere eşleşmelerine özel SEO odaklı içerikleri Gemini AI ile üretip yönetin.",
    edit: "Düzenle",
    editTitle: "Kombinasyon Düzenle",
    update: "Güncelle",
    updateSuccess: "Kombinasyon başarıyla güncellendi.",
    updateError: "Kombinasyon güncellenirken bir hata oluştu.",
    generatorTitle: "Yeni İçerik Üret veya Düzenle",
    selectRegion: "Bölge Seçin",
    selectRegionEmpty: "-- Bölge Seç --",
    selectPest: "Haşere Seçin",
    selectPestEmpty: "-- Haşere Seç --",
    generateBtn: "Yapay Zeka ile İçerik Üret",
    generatingBtn: "Yapay Zeka İçeriği Üretiyor...",
    editorTitle: "İçerik Editörü",
    formTitle: "Title (Tarayıcı Başlığı)",
    formH1: "H1 (Sayfa Ana Başlığı)",
    formMeta: "Meta Description (Arama Motoru Açıklaması)",
    formContent: "Sayfa İçeriği",
    faqTitle: "Sıkça Sorulan Sorular (SSS)",
    faqQ: "Soru",
    faqA: "Cevap",
    previewMissingH1: "H1 girilmedi.",
    missingFaqQuestion: "Soru {n}",
    missingFaqAnswer: "Cevap girilmedi.",
    isActive: "Sayfayı Yayına Al (Aktif)",
    saveBtn: "İçeriği Kaydet",
    savingBtn: "Kaydediliyor...",
    tableTitle: "Üretilmiş Kombinasyonlar",
    tableEmpty: "Henüz üretilmiş kombinasyon bulunamadı.",
    tableEmptyArchived: "Arşivlenmiş kombinasyon bulunamadı.",
    tableViewLabel: "Kombinasyon görünümü",
    filterNormal: "Normal / Tümü",
    filterArchived: "Arşiv",
    loadMore: "Daha Fazla Yükle",
    errorAlreadyExists: "Bu kombinasyon zaten mevcut. Düzenlemek için tablodaki ilgili kaydı kullanın.",
    errorArchivedExists: "Bu kombinasyon arşivde. Tekrar oluşturmak yerine arşivden çıkarın.",
    errorRequired: "Lütfen bir bölge ve bir haşere seçin.",
    successGen:
      "İçerik başarıyla üretildi! Aşağıdan düzenleyip kaydedebilirsiniz.",
    successSave: "Kombinasyon başarıyla kaydedildi.",
    errorSave: "Kombinasyon kaydedilirken bir hata oluştu.",
    successLoad: "Mevcut içerik yüklendi.",
    draftRestored: "Kaydedilmemiş taslağınız otomatik olarak geri yüklendi.",
    errorDefault: "Bir hata oluştu. Lütfen tekrar deneyin.",
    archive: "Arşivle",
    archiveConfirm: "Bu kombinasyon tamamen silinmeyecek, arşivlenerek yayından kaldırılacaktır. Yapay zeka bu kombinasyonu tekrar üretmeyecektir.",
    restore: "Arşivden çıkar",
    restoring: "Arşivden çıkarılıyor...",
    restoreSuccess: "Kombinasyon arşivden çıkarıldı ve pasif olarak kaydedildi.",
    restoreError: "Kombinasyon arşivden çıkarılırken bir hata oluştu.",
    restoreRelatedMissingError: "Bağlı haşere veya bölge artık bulunamadığı için kombinasyon arşivden çıkarılamaz.",
    previewBtn: "Önizleme",
    previewModalTitle: "Canlı Önizleme Modu",
    previewModalDesc: "Bu ekran içeriğin canlı sitede nasıl görüneceğini simüle eder.",
    previewModalClose: "Önizlemeyi Kapat",
    tooltipGenerate: "Bölge ve böcek seçerek AI ile SEO içeriği üretir",
    tooltipRegenerate: "İçeriği sıfırlayıp baştan yeni içerik üretir",
    tooltipPreview: "Sayfada nasıl görüneceğini test edin",
    tooltipSave: "Değişiklikleri veritabanına kaydeder ve yayına alır",
    regenerateWithAi: "AI ile Yeniden Oluştur",
    regeneratingWithAi: "Oluşturuluyor...",
    regenerateSuccess: "AI içeriği başarıyla yenilendi, kaydetmeden önce kontrol edebilirsiniz.",
    regenerateError: "AI ile içerik üretilirken bir hata oluştu.",
    regenerateQuotaError: "AI kullanım limiti dolduğu için içerik üretilemedi.",
    errorProviderUnavailable: "AI sunucuları şu an yoğun. Lütfen biraz sonra tekrar deneyin.",
    toast: {
      successTitle: "Başarılı",
      infoTitle: "Bilgilendirme",
      warningTitle: "Uyarı",
      errorTitle: "Hata",
    },
    regenerateHelper: "AI çıktısı kaydedilmeden önce kontrol edilebilir.",
    bulkGenerate: {
      title: "Toplu İçerik Üretimi",
      description: "Eksik kombinasyonları Gemini AI ile otomatik üretir ve aktif olarak kaydeder. İçerikleri admin listesinden kontrol edebilirsiniz.",
      missingCount: "{count} eksik kombinasyon bulundu.",
      calculateRequired: "Eksikleri hesaplamak için başlatın.",
      noMissing: "Tüm kombinasyonlar mevcut. Yeni bölge veya haşere eklendiğinde burada görünür.",
      startBtn: "Tüm Eksikleri Üret",
      stopBtn: "Durdur",
      stoppingBtn: "Durduruluyor...",
      running: "Üretiliyor... ({done}/{total})",
      stoppingStatus: "Durduruluyor... ({done}/{total})",
      doneAll: "Tüm kombinasyonlar başarıyla üretildi!",
      draftNote: "Aktif olarak kaydedildi.",
      partialDone: "{done}/{total} kombinasyon üretildi.",
      statusPending: "Bekliyor",
      statusGenerating: "Üretiliyor...",
      statusDone: "Tamamlandı",
      statusError: "Hata",
      statusStale: "Askıda Kaldı",
      statusAborted: "Durduruldu",
      startToast: "Toplu içerik üretimi başlatıldı.",
      itemErrorToast: "Toplu üretim sırasında bir kombinasyon üretilemedi. İşlem kalan kayıtlarla devam ediyor.",
      errorAlreadyRunning: "İşlem zaten başka bir sekmede veya cihazda çalışıyor.",
      errorQuotaExceeded: "AI kullanım limiti doldu. Daha sonra tekrar deneyin veya Gemini kota ayarlarınızı kontrol edin.",
      errorProviderUnavailable: "AI sunucuları şu an yoğun olduğu için toplu üretim durduruldu. Lütfen biraz sonra tekrar deneyin.",
    },
    bulkMutation: {
      title: "Toplu İşlem",
      description: "Bölge veya haşere filtresine göre mevcut kombinasyonları pasifleştirin, arşivleyin, arşivden çıkarın ya da silin.",
      badge: "Kombinasyonlar",
      regionLabel: "Bölge filtresi",
      pestLabel: "Haşere filtresi",
      operationLabel: "İşlem tipi",
      regionPlaceholder: "Tüm bölgeler",
      pestPlaceholder: "Tüm haşereler",
      operations: {
        deactivate: "Pasifleştir",
        archive: "Arşivle",
        restore: "Arşivden çıkar",
        delete: "Sil",
      },
      operationDescriptions: {
        deactivate: "Kayıtlar admin listesinde kalır, ancak public sayfa ve sitemap'ten çıkar.",
        archive: "Kayıtlar normal listeden ve public görünümden kaldırılır, ancak Firestore'da saklanır.",
        restore: "Yalnızca seçili filtredeki arşivlenmiş kayıtlar pasif olarak arşivden çıkarılır.",
        delete: "Kayıtlar kalıcı olarak silinir. Bu işlem geri alınamaz.",
      },
      scopeNone: "İşlem için en az bir bölge veya haşere filtresi seçin.",
      scopeRegion: "{region} bölgesine bağlı tüm kombinasyonlar hedeflenecek.",
      scopePest: "{pest} haşeresine bağlı tüm kombinasyonlar hedeflenecek.",
      scopeRegionPest: "{region} bölgesi ve {pest} haşeresi eşleşmesi hedeflenecek.",
      openConfirm: "İşlemi Onayla",
      confirmTitle: "Toplu işlemi onayla",
      confirmTitles: {
        deactivate: "Pasifleştirmeyi Onayla",
        archive: "Arşivlemeyi Onayla",
        restore: "Arşivden Çıkarmayı Onayla",
        delete: "Silmeyi Onayla",
      },
      confirmDescription: "{scope} Seçilen işlem: {operation}.",
      confirmButton: "Onayla ve Uygula",
      processing: "İşleniyor...",
      deleteWarning: "Silme işlemi kalıcıdır ve yalnızca kombinasyon kayıtlarını siler.",
      optionsLoading: "Kombinasyon seçenekleri yükleniyor...",
      optionsError: "Kombinasyon seçenekleri yüklenemedi.",
      noOptions: "Kombinasyon kaydı bulunan seçenek yok.",
      success: "{count} kombinasyon işlendi.",
      restoreSuccess: "{count} kombinasyon arşivden çıkarıldı ve pasif olarak kaydedildi.",
      restorePartial: "Bazı kombinasyonlar bağlı haşere veya bölge eksik/pasif olduğu için arşivden çıkarılamadı.",
      restoreNoneEligible: "Seçilen filtrede arşivden çıkarılabilecek uygun kombinasyon bulunamadı.",
      errorNoFilter: "Lütfen en az bir bölge veya haşere filtresi seçin.",
      errorNoMatch: "Seçilen filtrelere uygun kombinasyon bulunamadı.",
      errorDefault: "Toplu işlem sırasında bir hata oluştu.",
    },
    table: {
      region: "Bölge",
      pest: "Haşere",
      status: "Durum",
      actions: "İşlemler",
      active: "Aktif",
      passive: "Pasif",
      archived: "Arşiv",
      view: "Görüntüle",
    },
  },
  tinymce: {
    bold: "Kalın",
    italic: "İtalik",
    heading2: "H2 Başlık",
    heading3: "H3 Başlık",
    bulletList: "Madde İşaretli Liste",
    orderedList: "Numaralı Liste",
    undo: "Geri Al",
    redo: "İleri Al",
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
    empty: "Kayıtlı yorum bulunamadı.",
    description: "Ana sayfada gösterilen müşteri yorumlarını takip edin.",
    table: {
      customer: "Müşteri",
      rating: "Puan",
      comment: "Yorum",
    },
  },
  reports: {
    title: "Servis Raporları",
    description: "Servis raporlarını ve saha kayıtlarını buradan takip edin.",
    empty: "Kayıtlı servis raporu bulunamadı.",
    table: {
      customer: "Müşteri",
      service: "Hizmet",
      region: "Bölge",
      status: "Durum",
    },
  },
  messages: {
    title: "Gelen Mesajlar",
    description: "Son iletişim ve aranma taleplerini buradan takip edin.",
    empty: "Kayıtlı mesaj bulunamadı.",
    table: {
      name: "Ad Soyad",
      phone: "Telefon",
      service: "Hizmet",
      region: "Bölge",
      status: "Durum",
    },
  },
  settings: {
    title: "Ayarlar",
    description: "Site genelinde kullanılan temel iletişim ve marka ayarlarını kontrol edin.",
    empty: "Ayar bulunamadı.",
    revalidateBtn: "Canlı Siteyi Güncelle",
    revalidating: "Güncelleniyor...",
    revalidateSuccess: "Site başarıyla güncellendi.",
    revalidateError: "Güncelleme başarısız.",
    table: {
      field: "Alan",
      value: "Değer",
      phone: "Telefon",
      email: "E-posta",
      address: "Adres",
      workingHours: "Çalışma saatleri",
    },
  },
};

const globalErrorDict = {
  title: "Bir Şeyler Ters Gitti",
  description:
    "Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin veya daha sonra tekrar ziyaret edin.",
  buttons: {
    retry: "Tekrar Dene",
    home: "Ana Sayfaya Dön",
  },
};

const systemErrorsDict = {
  env: {
    firebaseClient:
      "CRITICAL ERROR: Firebase client environment variables are missing!",
    firebaseAdmin: "CRITICAL ERROR: Firebase Admin .env variables are missing!",
    gemini: "CRITICAL ERROR: GEMINI_API_KEY environment variable is missing.",
    googlePlaces:
      "CRITICAL ERROR: GOOGLE_PLACES_API_KEY environment variable is missing.",
    telegram:
      "CRITICAL ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing.",
  },
  api: {
    googlePlacesFailed: "Google Places API request failed",
    googlePlacesNoData:
      "Google Places API warning: No valid data found in response",
    jsonParseFailed: "Failed to extract JSON from AI response. Raw text: ",
    telegramFailed: "Telegram API Error",
  },
  telegramReturns: {
    missingConfig: "Missing Telegram configuration",
    apiFailed: "Telegram API request failed",
    networkError: "Network error sending Telegram message",
  },
  auth: {
    unauthorized: "Yetkisiz işlem. Lütfen tekrar giriş yapın.",
  },
};

const cronDict = {
  responses: {
    unauthorized: "Unauthorized request",
    settingsNotFound: "Settings not found in database",
    success: "Google Places stats updated successfully via cron.",
    noUpdateNeeded: "No update needed. Time threshold has not passed yet.",
    internalError: "Internal Server Error",
  },
};

const globalDict = {
  home: "Ana Sayfa",
  copyright: "© {year} DMR İlaçlama. Tüm hakları saklıdır.",
  city: "İzmir",
  brand: "DMR İlaçlama",
  siteUrl: "https://dmrilaclama.com",
  breadcrumb: "Sayfa Yolu",
  overview: "Genel Bakış",
  faqTitle: "Sıkça Sorulan Sorular",
  loading: "Yükleniyor...",
  logo: {
    alt: "DMR İlaçlama Logo",
    title: "DMR İlaçlama - Profesyonel Çözümler",
  },
  ui: {
    closeAria: "Kapat",
    drawerTitle: "Menü",
    cancel: "İptal",
    save: "Kaydet",
  },
  cta: {
    titlePrefix: "Ücretsiz",
    titleHighlight: "Keşif ve Danışma",
    description: "Sorununuzu anlatın; ekibimiz alanınıza, bölgenize ve ihtiyacınıza göre en doğru yönlendirmeyi yapsın.",
    buttonText: "İletişim",
  },
  contact: {
    address: "İzmir, Karabağlar — 9073. Sk. 15A, 35160",
  },
};

export const DICTIONARY = deepFreeze({
  global: globalDict,
  navbar: navbarDict,
  footer: footerDict,
  auth: authDict,
  home: homeDict,
  meta: metaDict,
  pages: pagesDict,
  telegram: telegramDict,
  gemini: geminiDict,
  social: socialDict,
  admin: adminDict,
  globalError: globalErrorDict,
  systemErrors: systemErrorsDict,
  cron: cronDict,
} as const);
