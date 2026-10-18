import { useParams, Link } from 'react-router-dom';
import {
  BookOpen, MessageSquare, Heart, ArrowLeft, GraduationCap, Sparkles, ChevronRight
} from 'lucide-react';
import { HADITH_CATEGORIES } from '../services/hadith';
import { useLang } from '../context/AppContext';
import BackButton from '../components/ui/BackButton';
import './Settings.css';
import './Explore.css';

const SITUATIONS = [
  { id: 'sad',     en: "I'm feeling sad",               ta: 'நான் கவலையாக உள்ளேன்',                 ar: 'أشعر بالحزن',              icon: '😔', mapTo: 'sabr' },
  { id: 'anger',   en: "I'm struggling with anger",     ta: 'எனக்கு கோபம் வருகிறது',                ar: 'அعاني من الغضب',           icon: '😠', mapTo: 'anger' },
  { id: 'repent',  en: "I want to repent",              ta: 'நான் பாவமன்னிப்பு தேட விரும்புகிறேன்', ar: 'أريد التوبة',              icon: '🤲', mapTo: 'tawbah' },
  { id: 'parents', en: "I need guidance about parents", ta: 'பெற்றோரை பற்றி வழிகாட்டுதல்',          ar: 'أحتاج توجيهاً عن الوالدين', icon: '👨‍👩‍👧‍👦', mapTo: 'parents' },
  { id: 'salah',   en: "I want to improve my Salah",    ta: 'தொழுகையை மேம்படுத்த',                  ar: 'أريد تحسين صلاتي',         icon: '🕌', mapTo: 'salah' },
  { id: 'iman',    en: "I want to increase my Iman",    ta: 'ஈமானை அதிகப்படுத்த',                   ar: 'أريد زيادة إيماني',        icon: '✨', mapTo: 'iman' },
  { id: 'tawheed', en: "I want to learn about Tawheed", ta: 'தவ்ஹீத் பற்றி அறிய',                   ar: 'أريد تعلم التوحيد',        icon: '☝️', mapTo: 'tawheed' },
];

export default function Explore() {
  const { topic } = useParams();
  const { t, lang } = useLang();

  const getSituationTitle = (sit) => {
    if (lang === 'ta') return sit.ta;
    if (lang === 'ar') return sit.ar;
    return sit.en;
  };

  /* ── Sub-view: Emotional & Spiritual Guidance Situations ── */
  if (topic === 'situations') {
    return (
      <main className="page-wrapper settings-page" id="main-content">
        <div className="settings-shell">
          <div className="settings-top-nav">
            <BackButton fallback="/explore" label="Back to Explore" />
          </div>

          <h1 className="settings-main-title">{t('findGuidance')}</h1>

          <div className="settings-group-wrap">
            <h2 className="settings-group-heading">{t('whatFeeling')}</h2>
            <div className="settings-card-group">
              {SITUATIONS.map(sit => (
                <Link
                  key={sit.id}
                  to={`/hadith/categories/${sit.mapTo}`}
                  className="settings-card-row"
                  id={`sit-${sit.id}`}
                >
                  <div className="explore-setting-row-left">
                    <span className="explore-situation-emoji" aria-hidden="true">{sit.icon}</span>
                    <span className="settings-row-label">{getSituationTitle(sit)}</span>
                  </div>
                  <ChevronRight size={19} className="settings-row-chevron" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ── Main Explore Topics View (Identical to Settings Page Design) ── */
  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Navigation */}
        <div className="settings-top-nav">
          <BackButton fallback="/" label={t('back')} />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">{t('exploreTopics')}</h1>

        {/* ── SECTION 1: Featured & Daily Guidance ── */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">
            {lang === 'ta' ? 'அத்தியாவசிய வழிகாட்டல்' : lang === 'ar' ? 'المحتوى المميز' : 'Daily & Guidance'}
          </h2>
          <div className="settings-card-group">
            {/* Daily Inspiration */}
            <Link to="/inspiration" className="settings-card-row" id="topic-inspiration">
              <div className="explore-setting-row-left">
                <span className="explore-setting-icon icon-emerald" aria-hidden="true">
                  <Sparkles size={17} />
                </span>
                <div className="settings-row-text-group">
                  <span className="settings-row-label">
                    {lang === 'ta' ? 'தினசரி வழிகாட்டல்' : lang === 'ar' ? 'الإلهام اليومي' : 'Daily Inspiration'}
                  </span>
                  <span className="settings-row-subtext">
                    {lang === 'ta' ? 'அன்றாட குர்ஆன், நபிமொழி, துஆ & போஸ்டர்' : 'Daily Quran verse, Hadith, Dua & posters'}
                  </span>
                </div>
              </div>
              <div className="settings-row-value-wrap">
                <span className="explore-setting-pill">{lang === 'ta' ? 'தினசரி' : 'Daily'}</span>
                <ChevronRight size={19} className="settings-row-chevron" />
              </div>
            </Link>

            {/* Find Guidance */}
            <Link to="/explore/situations" className="settings-card-row" id="topic-guidance">
              <div className="explore-setting-row-left">
                <span className="explore-setting-icon icon-rose" aria-hidden="true">
                  <Heart size={17} />
                </span>
                <div className="settings-row-text-group">
                  <span className="settings-row-label">{t('findGuidance')}</span>
                  <span className="settings-row-subtext">{t('whatFeeling')}</span>
                </div>
              </div>
              <ChevronRight size={19} className="settings-row-chevron" />
            </Link>
          </div>
        </div>

        {/* ── SECTION 2: Knowledge & Learning ── */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">
            {lang === 'ta' ? 'அறிவு & கல்வி' : lang === 'ar' ? 'القراءة والتعلم' : 'Knowledge & Learning'}
          </h2>
          <div className="settings-card-group">
            {/* Read Quran */}
            <Link to="/quran" className="settings-card-row" id="topic-quran">
              <div className="explore-setting-row-left">
                <span className="explore-setting-icon icon-teal" aria-hidden="true">
                  <BookOpen size={17} />
                </span>
                <div className="settings-row-text-group">
                  <span className="settings-row-label">{t('readQuran')}</span>
                  <span className="settings-row-subtext">{t('exploreBySurah')}</span>
                </div>
              </div>
              <ChevronRight size={19} className="settings-row-chevron" />
            </Link>

            {/* Read Hadith */}
            <Link to="/hadith" className="settings-card-row" id="topic-hadith">
              <div className="explore-setting-row-left">
                <span className="explore-setting-icon icon-purple" aria-hidden="true">
                  <MessageSquare size={17} />
                </span>
                <div className="settings-row-text-group">
                  <span className="settings-row-label">{t('readHadith')}</span>
                  <span className="settings-row-subtext">{t('authenticCollections')}</span>
                </div>
              </div>
              <ChevronRight size={19} className="settings-row-chevron" />
            </Link>

            {/* Islamic Lessons */}
            <Link to="/lessons" className="settings-card-row" id="topic-lessons">
              <div className="explore-setting-row-left">
                <span className="explore-setting-icon icon-blue" aria-hidden="true">
                  <GraduationCap size={17} />
                </span>
                <div className="settings-row-text-group">
                  <span className="settings-row-label">{t('islamicLessons')}</span>
                  <span className="settings-row-subtext">{t('lessonsDesc')}</span>
                </div>
              </div>
              <ChevronRight size={19} className="settings-row-chevron" />
            </Link>

            {/* Allah's Beautiful Names */}
            <Link to="/names-of-allah" className="settings-card-row" id="topic-names">
              <div className="explore-setting-row-left">
                <span className="explore-setting-icon icon-gold" aria-hidden="true">
                  <Sparkles size={17} />
                </span>
                <div className="settings-row-text-group">
                  <span className="settings-row-label">{t('allahNames')}</span>
                  <span className="settings-row-subtext">
                    {lang === 'ta' ? '99 திருப்பெயர்கள் மற்றும் ஆடியோ' : '99 Names with meanings & audio'}
                  </span>
                </div>
              </div>
              <ChevronRight size={19} className="settings-row-chevron" />
            </Link>
          </div>
        </div>

        {/* ── SECTION 3: All Topics (Hadith Subject Categories) ── */}
        <div className="settings-group-wrap">
          <div className="explore-category-header">
            <h2 className="settings-group-heading" style={{ margin: 0 }}>
              {t('allTopics')}
            </h2>
            <span className="settings-row-value">
              {HADITH_CATEGORIES.length} {lang === 'ta' ? 'தலைப்புகள்' : 'topics'}
            </span>
          </div>

          <div className="settings-card-group">
            {HADITH_CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                to={`/hadith/categories/${cat.id}`}
                className="settings-card-row"
                id={`cat-${cat.id}`}
              >
                <div className="explore-setting-row-left">
                  <span className="explore-cat-badge" aria-hidden="true">{cat.icon}</span>
                  <span className="settings-row-label">
                    {lang === 'ta' ? cat.tamil : lang === 'ar' ? (cat.arabic || cat.name) : cat.name}
                  </span>
                </div>
                <ChevronRight size={19} className="settings-row-chevron" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
