// ==================================================
// Language strings for Tamil, English, Arabic
// ==================================================
export const LANGUAGES = [
  { code: 'ta', label: 'தமிழ்', nativeName: 'Tamil', dir: 'ltr', flag: '🇮🇳' },
  { code: 'en', label: 'English', nativeName: 'English', dir: 'ltr', flag: '🌐' },
  { code: 'ar', label: 'عربي', nativeName: 'Arabic', dir: 'rtl', flag: '🕌' },
];

export const TRANSLATIONS = {
  ta: {
    // Navbar
    home: 'முகப்பு',
    quran: 'குர்ஆன்',
    hadith: 'ஹதீஸ்',
    dua: 'துஆ',
    dhikr: 'திக்ர்',
    explore: 'கண்டறி',
    qiraath: 'கிராத்',
    qibla: 'கிப்லா',
    nearbyMasjids: 'அருகிலுள்ள மசூதிகள்',
    library: 'நூலகம்',
    youtube: 'YouTube',
    about: 'பற்றி',
    search: 'தேடல்',
    more: 'மேலும்',
    morePages: 'மேலும் பக்கங்கள்',
    shareApp: 'பயன்பாட்டை பகிர்',
    settings: 'அமைப்புகள்',
    afterSalah: 'தொழுகைக்குப் பின்',
    inspiration: 'தினசரி வழிகாட்டல்',

    // Settings Page
    settingsTitle: 'அமைப்புகள்',
    settingsDesc: 'உங்கள் விருப்பங்களை தனிப்பயனாக்குங்கள்',
    appLanguage: 'பயன்பாட்டு மொழி',
    appLanguageDesc: 'இடைமுகத்தின் மொழியை மாற்றுங்கள்',
    theme: 'தீம்',
    themeLight: 'ஒளி',
    themeDark: 'இருள்',
    themeSystem: 'கணினி',
    themeDesc: 'தோற்றத்தை மாற்றுங்கள்',
    contentLang: 'உள்ளடக்க மொழி',
    contentLangDesc: 'ஹதீஸ் மற்றும் துஆ மொழியை தேர்வுசெய்யுங்கள்',
    quranRecitation: 'குர்ஆன் ஓதல்',
    quranRecitationDesc: 'குர்ஆன் இயக்கத்திற்கு விரும்பிய ஓதுபவரை தேர்ந்தெடுக்கவும்.',
    defaultReciter: 'இயல்புநிலை ஓதுபவர்',
    reciterNote: 'Bandar Baleela முழு சூராவை ஓதுகிறார். மற்ற ஓதுபவர்கள் வசனம் வசனமாக ஓதுகிறார்கள்.',
    yourActivity: 'உங்கள் செயல்பாடு',
    activityDesc: 'இந்த சாதனத்தில் சேமிக்கப்பட்ட வாசிப்பு வரலாறு.',
    savedActivity: 'சேமிக்கப்பட்ட செயல்பாடு',
    clearHistory: 'வரலாற்றை அழி',
    prefsSaved: 'உங்கள் விருப்பங்கள் இந்த சாதனத்தில் தானாக சேமிக்கப்படுகின்றன.',

    // General
    noData: 'தரவு இல்லை',
    loading: 'ஏற்றுகிறது...',
    error: 'பிழை ஏற்பட்டது',
    save: 'சேமி',
    share: 'பகிர்',
    copy: 'நகலெடு',
    bookmark: 'சேமி',
    back: 'திரும்பு',
    light: 'ஒளி',
    dark: 'இருள்',
    retry: 'மீண்டும் முயற்சி',
    delete: 'நீக்கு',
    remove: 'நீக்கு',
    cancel: 'ரத்து செய்',
    clear: 'அழி',

    // Home Page
    watchOnYouTube: 'YouTube-ல் பாருங்கள்',
    instagram: 'Instagram',
    features: 'அம்சங்கள்',
    channelStats: 'சேனல் புள்ளிவிவரங்கள்',
    liveFromYoutube: 'YouTube-லிருந்து நேரடி தரவு',
    visitChannel: 'சேனலை பார்வையிட',
    subscribers: 'சந்தாதாரர்கள்',
    totalViews: 'மொத்த பார்வைகள்',
    videos: 'வீடியோக்கள்',
    latestVideos: 'புதிய வீடியோக்கள்',
    noVideos: 'வீடியோக்கள் இல்லை',
    views: 'பார்வைகள்',
    heroDesc: 'Tamil முஸ்லிம்களுக்காக — குர்ஆன், ஹதீஸ், துஆ மற்றும் சுன்னாவை தெளிவாக விளக்கும் நம்பகமான இஸ்லாமிய அறிவு.',

    // Explore Page
    exploreTopics: 'தலைப்புகளை கண்டறியுங்கள்',
    exploreDesc: 'உங்கள் வாழ்க்கைக்கு தேவையான இஸ்லாமிய வழிகாட்டுதல்கள்',
    findGuidance: 'வழிகாட்டுதல் தேடுங்கள்',
    whatFeeling: 'நீங்கள் இப்போது எப்படி உணர்கிறீர்கள்?',
    readQuran: 'குர்ஆன் படியுங்கள்',
    exploreBySurah: 'சூராவால் கண்டறியுங்கள்',
    readHadith: 'ஹதீஸ் படியுங்கள்',
    authenticCollections: 'நம்பகமான தொகுப்புகள்',
    islamicLessons: 'இஸ்லாமிய பாடங்கள்',
    lessonsDesc: 'அகீதா, ஃபிக்ஹ், சீரா, மற்றும் அக்லாக்',
    allahNames: 'அல்லாஹ்வின் அழகிய திருநாமங்கள்',
    allTopics: 'அனைத்து தலைப்புகளும்',
    backToExplore: 'கண்டறி பக்கத்திற்கு திரும்பு',
    guidanceDesc: 'உணர்வு ரீதியான வழிகாட்டுதல்கள்',

    // Dua Page
    duaLibrary: 'துஆ நூலகம்',
    duaDesc: 'அன்றாட வாழ்க்கைக்கு தேவையான துஆக்கள்',
    duaSearch: 'தலைப்பு, பொருள் அல்லது தலைப்பால் துஆக்களை தேடுங்கள்...',
    all: 'அனைத்தும்',
    transliteration: 'ஒலிப்பெயர்ப்பு',
    meaning: 'பொருள்',
    note: 'குறிப்பு',
    noDuasFound: 'துஆக்கள் இல்லை',
    noDuasDesc: 'வேறு வார்த்தைகள் அல்லது வகைகளில் தேடுங்கள்.',
    loadingDuas: 'துஆக்கள் ஏற்றுகிறது...',
    repeat: 'மீண்டும்',
    searchBtn: 'தேடு',

    // Dhikr Page
    dhikrCounter: 'திக்ர் கவுண்டர்',
    dhikrDesc: 'திக்ர் கவுண்டர் — அல்லாஹ்வை நினைவுகூருதல்',
    afterSalahDhikr: 'தொழுகைக்கு பிறகு திக்ர்',
    sessionProgress: 'அமர்வு முன்னேற்றம்',
    completed: 'நிறைவு',
    mashallah: 'மாஷா அல்லாஹ்! அமர்வு முடிந்தது.',
    resetSession: 'அமர்வை மீட்டமை',
    loadingDhikr: 'திக்ர் ஏற்றுகிறது...',

    // Hadith Page
    hadithLibrary: 'ஹதீஸ் நூலகம்',
    hadithDesc: 'நம்பகமான ஹதீஸ் தொகுப்புகள்',
    searchHadith: 'ஹதீஸ்களை தேடுங்கள்...',
    allCollections: 'அனைத்து தொகுப்புகளும்',
    allCategories: 'அனைத்து வகைகளும்',
    loadingHadith: 'ஹதீஸ்கள் ஏற்றுகிறது...',
    noHadithFound: 'ஹதீஸ்கள் இல்லை',
    hadithReference: 'சான்று',
    grade: 'தரம்',
    narrator: 'அறிவிப்பாளர்',

    // Quran Page
    quranReader: 'குர்ஆன் வாசிப்பு',
    juzIndex: 'ஜுஸ் அட்டவணை',
    selectJuz: 'ஜுஸ் தேர்ந்தெடுக்கவும்',
    page: 'பக்கம்',
    backToJuz: 'ஜுஸ் அட்டவணைக்கு திரும்பு',

    // MushafJuzIndex
    juzStart: 'தொடக்கம்',
    pagesLabel: 'பக்கங்கள்',

    // Library Page
    yourLibrary: 'உங்கள் நூலகம்',
    libraryDesc: 'சேமிக்கப்பட்ட வசனங்கள், ஹதீஸ்கள் மற்றும் துஆக்கள்',
    noBookmarks: 'சேமிக்கப்பட்டவை இல்லை',
    noBookmarksDesc: 'வசனங்கள் அல்லது ஹதீஸ்களை சேமிக்க புக்மார்க் ஐகானை அழுத்துங்கள்.',

    // About Page
    aboutTitle: 'பற்றி',
    aboutDesc: 'Peace Be Upon Him பற்றி',

    // Qibla
    qiblaTitle: 'கிப்லா திசை',
    qiblaDesc: 'மக்காவை நோக்கிய திசை',

    // Nearby Masjids
    nearbyTitle: 'அருகிலுள்ள மசூதிகள்',
    nearbyDesc: 'உங்கள் அருகிலுள்ள மசூதிகளை கண்டறியுங்கள்',

    // After Salah
    afterSalahTitle: 'தொழுகைக்குப் பின் துஆக்கள்',
    afterSalahDesc: 'தொழுகைக்கு பிறகு படிக்கும் திக்ர் மற்றும் துஆக்கள்',

    // Qiraath
    qiraathTitle: 'குர்ஆன் ஓதல்',
    qiraathDesc: 'மிகவும் பிரசித்தமான ஓதுபவர்கள்',
    listenNow: 'இப்போது கேளுங்கள்',
    selectReciter: 'ஓதுபவரை தேர்ந்தெடுக்கவும்',
  },

  en: {
    // Navbar
    home: 'Home',
    quran: 'Quran',
    hadith: 'Hadith',
    dua: 'Dua',
    dhikr: 'Dhikr',
    explore: 'Explore',
    qiraath: 'Qiraath',
    library: 'Library',
    youtube: 'YouTube',
    about: 'About',
    search: 'Search',
    more: 'More',
    morePages: 'More Pages',
    shareApp: 'Share App',
    qibla: 'Qibla',
    nearbyMasjids: 'Nearby Masjids',
    settings: 'Settings',
    afterSalah: 'After Salah',
    inspiration: 'Daily Inspiration',

    // Settings Page
    settingsTitle: 'Settings',
    settingsDesc: 'Customize your preferences',
    appLanguage: 'App Language',
    appLanguageDesc: 'Change the interface language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    themeDesc: 'Change the appearance',
    contentLang: 'Content Language',
    contentLangDesc: 'Choose Hadith and Dua language',
    quranRecitation: 'Quran Recitation',
    quranRecitationDesc: 'Choose your preferred reciter for Quran playback.',
    defaultReciter: 'Default reciter',
    reciterNote: 'Bandar Baleela is available as a full-Surah recitation. Other reciters play ayah by ayah.',
    yourActivity: 'Your Activity',
    activityDesc: 'Reading history saved on this device.',
    savedActivity: 'saved activity',
    clearHistory: 'Clear history',
    prefsSaved: 'Your preferences are automatically saved on this device.',

    // General
    noData: 'No data found',
    loading: 'Loading...',
    error: 'An error occurred',
    save: 'Save',
    share: 'Share',
    copy: 'Copy',
    bookmark: 'Bookmark',
    back: 'Back',
    light: 'Light',
    dark: 'Dark',
    retry: 'Retry',
    delete: 'Delete',
    remove: 'Remove',
    cancel: 'Cancel',
    clear: 'Clear',

    // Home Page
    watchOnYouTube: 'Watch on YouTube',
    instagram: 'Instagram',
    features: 'Features',
    channelStats: 'Channel Statistics',
    liveFromYoutube: 'Live data from YouTube',
    visitChannel: 'Visit Channel',
    subscribers: 'Subscribers',
    totalViews: 'Total Views',
    videos: 'Videos',
    latestVideos: 'Latest Videos',
    noVideos: 'No videos available',
    views: 'views',
    heroDesc: 'Authentic Islamic knowledge in Tamil — Quran, Hadith, Dua and Sunnah explained clearly for Tamil-speaking Muslims.',

    // Explore Page
    exploreTopics: 'Explore Topics',
    exploreDesc: 'Islamic guidance for your daily life',
    findGuidance: 'Find Guidance',
    whatFeeling: 'What are you feeling right now?',
    readQuran: 'Read Quran',
    exploreBySurah: 'Explore by Surah',
    readHadith: 'Read Hadith',
    authenticCollections: 'Authentic Collections',
    islamicLessons: 'Islamic Lessons',
    lessonsDesc: 'Aqidah, Fiqh, Seerah, and Akhlaq',
    allahNames: "Allah's Beautiful Names",
    allTopics: 'All Topics',
    backToExplore: 'Back to Explore',
    guidanceDesc: 'Emotional and spiritual guidance',

    // Dua Page
    duaLibrary: 'Dua Library',
    duaDesc: 'Essential duas for daily life',
    duaSearch: 'Search duas by title, meaning, or topic...',
    all: 'All',
    transliteration: 'Transliteration',
    meaning: 'Meaning',
    note: 'Note',
    noDuasFound: 'No duas found',
    noDuasDesc: 'Try searching with different words or categories.',
    loadingDuas: 'Loading duas...',
    repeat: 'Repeat',
    searchBtn: 'Search',

    // Dhikr Page
    dhikrCounter: 'Dhikr Counter',
    dhikrDesc: 'Dhikr counter — remembrance of Allah',
    afterSalahDhikr: 'After Salah Dhikr',
    sessionProgress: 'Session Progress',
    completed: 'completed',
    mashallah: 'Mashallah! Session completed.',
    resetSession: 'Reset Session',
    loadingDhikr: 'Loading dhikr...',

    // Hadith Page
    hadithLibrary: 'Hadith Library',
    hadithDesc: 'Authentic hadith collections',
    searchHadith: 'Search hadiths...',
    allCollections: 'All Collections',
    allCategories: 'All Categories',
    loadingHadith: 'Loading hadiths...',
    noHadithFound: 'No hadiths found',
    hadithReference: 'Reference',
    grade: 'Grade',
    narrator: 'Narrator',

    // Quran Page
    quranReader: 'Quran Reader',
    juzIndex: 'Juz Index',
    selectJuz: 'Select a Juz',
    page: 'Page',
    backToJuz: 'Back to Juz Index',

    // MushafJuzIndex
    juzStart: 'Starts at',
    pagesLabel: 'pages',

    // Library Page
    yourLibrary: 'Your Library',
    libraryDesc: 'Saved verses, hadiths, and duas',
    noBookmarks: 'Nothing saved yet',
    noBookmarksDesc: 'Tap the bookmark icon on any verse or hadith to save it here.',

    // About Page
    aboutTitle: 'About',
    aboutDesc: 'About Peace Be Upon Him',

    // Qibla
    qiblaTitle: 'Qibla Direction',
    qiblaDesc: 'Direction toward Makkah',

    // Nearby Masjids
    nearbyTitle: 'Nearby Masjids',
    nearbyDesc: 'Find masjids near your location',

    // After Salah
    afterSalahTitle: 'After Salah Duas',
    afterSalahDesc: 'Dhikr and duas to recite after prayer',

    // Qiraath
    qiraathTitle: 'Quran Recitation',
    qiraathDesc: 'Most renowned reciters',
    listenNow: 'Listen Now',
    selectReciter: 'Select Reciter',
  },

  ar: {
    // Navbar
    home: 'الرئيسية',
    quran: 'القرآن',
    hadith: 'الحديث',
    dua: 'الدعاء',
    dhikr: 'الذكر',
    explore: 'استكشف',
    library: 'المكتبة',
    youtube: 'يوتيوب',
    about: 'عن التطبيق',
    search: 'بحث',
    more: 'المزيد',
    morePages: 'صفحات أخرى',
    shareApp: 'مشاركة التطبيق',
    qibla: 'القبلة',
    nearbyMasjids: 'المساجد القريبة',
    settings: 'الإعدادات',
    afterSalah: 'بعد الصلاة',
    qiraath: 'القراءات',
    inspiration: 'الإلهام اليومي',

    // Settings Page
    settingsTitle: 'الإعدادات',
    settingsDesc: 'تخصيص تفضيلاتك',
    appLanguage: 'لغة التطبيق',
    appLanguageDesc: 'تغيير لغة الواجهة',
    theme: 'المظهر',
    themeLight: 'فاتح',
    themeDark: 'داكن',
    themeSystem: 'النظام',
    themeDesc: 'تغيير مظهر التطبيق',
    contentLang: 'لغة المحتوى',
    contentLangDesc: 'اختر لغة الأحاديث والأدعية',
    quranRecitation: 'تلاوة القرآن',
    quranRecitationDesc: 'اختر قارئك المفضل لتشغيل القرآن.',
    defaultReciter: 'القارئ الافتراضي',
    reciterNote: 'بندر بليلة متاح لتلاوة السورة كاملة. القراء الآخرون يقرأون آية بآية.',
    yourActivity: 'نشاطك',
    activityDesc: 'سجل القراءة المحفوظ على هذا الجهاز.',
    savedActivity: 'نشاط محفوظ',
    clearHistory: 'مسح السجل',
    prefsSaved: 'تم حفظ تفضيلاتك تلقائياً في هذا الجهاز.',

    // General
    noData: 'لا توجد بيانات',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    save: 'حفظ',
    share: 'مشاركة',
    copy: 'نسخ',
    bookmark: 'حفظ',
    back: 'رجوع',
    light: 'فاتح',
    dark: 'داكن',
    retry: 'إعادة المحاولة',
    delete: 'حذف',
    remove: 'إزالة',
    cancel: 'إلغاء',
    clear: 'مسح',

    // Home Page
    watchOnYouTube: 'شاهد على يوتيوب',
    instagram: 'إنستغرام',
    features: 'الميزات',
    channelStats: 'إحصائيات القناة',
    liveFromYoutube: 'بيانات مباشرة من يوتيوب',
    visitChannel: 'زيارة القناة',
    subscribers: 'المشتركون',
    totalViews: 'إجمالي المشاهدات',
    videos: 'الفيديوهات',
    latestVideos: 'أحدث الفيديوهات',
    noVideos: 'لا توجد فيديوهات',
    views: 'مشاهدة',
    heroDesc: 'معرفة إسلامية أصيلة باللغة التاميلية — القرآن والحديث والدعاء والسنة موضحة بوضوح للمسلمين الناطقين بالتاميلية.',

    // Explore Page
    exploreTopics: 'استكشف الموضوعات',
    exploreDesc: 'إرشادات إسلامية لحياتك اليومية',
    findGuidance: 'ابحث عن الإرشاد',
    whatFeeling: 'كيف تشعر الآن؟',
    readQuran: 'اقرأ القرآن',
    exploreBySurah: 'استكشف بالسور',
    readHadith: 'اقرأ الحديث',
    authenticCollections: 'المجموعات الصحيحة',
    islamicLessons: 'الدروس الإسلامية',
    lessonsDesc: 'العقيدة والفقه والسيرة والأخلاق',
    allahNames: 'أسماء الله الحسنى',
    allTopics: 'جميع الموضوعات',
    backToExplore: 'العودة إلى الاستكشاف',
    guidanceDesc: 'إرشاد عاطفي وروحي',

    // Dua Page
    duaLibrary: 'مكتبة الأدعية',
    duaDesc: 'أدعية أساسية للحياة اليومية',
    duaSearch: 'ابحث عن الأدعية بالعنوان أو المعنى أو الموضوع...',
    all: 'الكل',
    transliteration: 'النطق',
    meaning: 'المعنى',
    note: 'ملاحظة',
    noDuasFound: 'لا توجد أدعية',
    noDuasDesc: 'حاول البحث بكلمات أو فئات مختلفة.',
    loadingDuas: 'جاري تحميل الأدعية...',
    repeat: 'تكرار',
    searchBtn: 'بحث',

    // Dhikr Page
    dhikrCounter: 'عداد الذكر',
    dhikrDesc: 'عداد الذكر — ذكر الله',
    afterSalahDhikr: 'ذكر بعد الصلاة',
    sessionProgress: 'تقدم الجلسة',
    completed: 'مكتمل',
    mashallah: 'ما شاء الله! اكتملت الجلسة.',
    resetSession: 'إعادة تعيين الجلسة',
    loadingDhikr: 'جاري تحميل الأذكار...',

    // Hadith Page
    hadithLibrary: 'مكتبة الأحاديث',
    hadithDesc: 'مجموعات الأحاديث الصحيحة',
    searchHadith: 'ابحث عن الأحاديث...',
    allCollections: 'جميع المجموعات',
    allCategories: 'جميع الفئات',
    loadingHadith: 'جاري تحميل الأحاديث...',
    noHadithFound: 'لا توجد أحاديث',
    hadithReference: 'المرجع',
    grade: 'الدرجة',
    narrator: 'الراوي',

    // Quran Page
    quranReader: 'قارئ القرآن',
    juzIndex: 'فهرس الأجزاء',
    selectJuz: 'اختر جزءاً',
    page: 'صفحة',
    backToJuz: 'العودة إلى فهرس الأجزاء',

    // MushafJuzIndex
    juzStart: 'يبدأ من',
    pagesLabel: 'صفحات',

    // Library Page
    yourLibrary: 'مكتبتك',
    libraryDesc: 'الآيات والأحاديث والأدعية المحفوظة',
    noBookmarks: 'لا يوجد محفوظات',
    noBookmarksDesc: 'اضغط على أيقونة الحفظ على أي آية أو حديث لحفظه هنا.',

    // About Page
    aboutTitle: 'عن التطبيق',
    aboutDesc: 'عن Peace Be Upon Him',

    // Qibla
    qiblaTitle: 'اتجاه القبلة',
    qiblaDesc: 'الاتجاه نحو مكة المكرمة',

    // Nearby Masjids
    nearbyTitle: 'المساجد القريبة',
    nearbyDesc: 'ابحث عن المساجد بالقرب منك',

    // After Salah
    afterSalahTitle: 'أدعية ما بعد الصلاة',
    afterSalahDesc: 'الأذكار والأدعية التي تُقرأ بعد الصلاة',

    // Qiraath
    qiraathTitle: 'تلاوة القرآن',
    qiraathDesc: 'أشهر القراء',
    listenNow: 'استمع الآن',
    selectReciter: 'اختر القارئ',
  },
};
