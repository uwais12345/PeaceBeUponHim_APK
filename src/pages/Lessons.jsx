import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight, AlertCircle, Info, Sparkles } from 'lucide-react';
import { getLesson, getLessonsBySubject, getLessonSubject, LESSON_SUBJECTS } from '../services/lessons';
import BackButton from '../components/ui/BackButton';
import { useLang } from '../context/AppContext';
import './Settings.css';
import './Lessons.css';

function LessonDetail({ subject, lesson }) {
  const { lang } = useLang();

  return (
    <div className="lessons-detail-container">
      {/* Detail Inset Card */}
      <div className="settings-group-wrap">
        <div className="settings-card-group lessons-detail-card">
          {/* Kicker & Meta */}
          <div className="lessons-detail-meta-bar">
            <span className="lessons-detail-kicker">
              <span className="lessons-kicker-icon">{subject.icon}</span>
              <span>{subject.title}</span>
            </span>
            {lesson.references && lesson.references.length > 0 && (
              <span className="lessons-ref-pill">
                {lesson.references.length} {lang === 'ta' ? 'சான்றுகள்' : 'Refs'}
              </span>
            )}
          </div>

          <h2 className="lessons-detail-tamil-title tamil-text">{lesson.tamil}</h2>

          {/* Structured Note Sections */}
          <div className="lessons-sections-stack">
            {lesson.sections.map((section, idx) => (
              <div className="lessons-section-item" key={section.title || idx}>
                <h3 className="lessons-section-en-title">{section.title}</h3>
                <p className="lessons-section-en-body">{section.english}</p>
                <div className="lessons-section-tamil-wrap">
                  <h4 className="lessons-section-ta-title tamil-text">{section.titleTamil}</h4>
                  <p className="lessons-section-ta-body tamil-text">{section.tamil}</p>
                </div>
              </div>
            ))}
          </div>

          {/* References */}
          {lesson.references && lesson.references.length > 0 && (
            <div className="lessons-references-footer" aria-label="References">
              <h4 className="lessons-references-heading">
                {lang === 'ta' ? 'சான்றுகள் & ஆதாரங்கள்' : 'References & Sources'}
              </h4>
              <ul className="lessons-references-list">
                {lesson.references.map((reference) => (
                  <li key={reference}>{reference}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* iOS-Style Subtle Disclaimer Callout */}
      <div className="lessons-disclaimer-callout">
        <Info size={16} className="lessons-disclaimer-icon" />
        <div className="lessons-disclaimer-text">
          <strong>{lang === 'ta' ? 'அறிமுகக் குறிப்புகள் மட்டுமே' : 'Introduction Only'}</strong>
          <span>
            {lang === 'ta'
              ? 'இவை அடிப்படைக் குறிப்புகள் மட்டுமே; முழுமையான பாடத்திட்டம் அல்ல. விரிவான மார்க்கத் தீர்ப்புகளுக்கு மார்க்க அறிஞர்களை அணுகவும்.'
              : 'These notes are introductory summaries, not a complete scholarly syllabus or formal ruling. Consult a qualified scholar for personal matters.'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Lessons() {
  const { subjectId, lessonId } = useParams();
  const subject = subjectId ? getLessonSubject(subjectId) : null;
  const lesson = subject && lessonId ? getLesson(subject.id, lessonId) : null;
  const { lang } = useLang();

  // If a specific lesson was requested but not found
  if (lessonId && (!subject || !lesson)) {
    return (
      <main className="page-wrapper settings-page" id="main-content">
        <div className="settings-shell">
          <div className="settings-top-nav">
            <BackButton fallback="/lessons" label="Lessons" />
          </div>
          <div className="settings-group-wrap">
            <div className="settings-card-group lessons-empty-group">
              <AlertCircle size={32} className="lessons-empty-icon" />
              <p className="lessons-empty-title">
                {lang === 'ta' ? 'பாடம் கிடைக்கவில்லை' : 'Lesson Not Found'}
              </p>
              <Link to="/lessons" className="lessons-btn-pill">
                {lang === 'ta' ? 'அனைத்துப் பாடங்கள்' : 'Browse Lessons'}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Navigation */}
        <div className="settings-top-nav">
          {lesson ? (
            <BackButton fallback={`/lessons/${subject.id}`} label={subject.title} />
          ) : subject ? (
            <BackButton fallback="/lessons" label={lang === 'ta' ? 'பாடப் பிரிவுகள்' : 'All Subjects'} />
          ) : (
            <BackButton fallback="/explore" label={lang === 'ta' ? 'வழிகாட்டல்' : 'Explore'} />
          )}
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">
          {lesson ? lesson.title : subject ? subject.title : lang === 'ta' ? 'இஸ்லாமிய பாடங்கள்' : 'Islamic Lessons'}
        </h1>

        {/* ── Sub-view 1: Lesson Detail ── */}
        {lesson ? (
          <LessonDetail subject={subject} lesson={lesson} />
        ) : subject ? (
          /* ── Sub-view 2: Lessons within a Subject ── */
          <>
            {/* Subject Overview Card */}
            <div className="settings-group-wrap">
              <div className="settings-card-group lessons-overview-card">
                <div className="lessons-overview-top">
                  <span className="lessons-overview-icon" aria-hidden="true">{subject.icon}</span>
                  <div className="lessons-overview-meta">
                    <span className="lessons-overview-ta-title tamil-text">{subject.tamil}</span>
                    <span className="lessons-overview-count-pill">
                      {getLessonsBySubject(subject.id).length} {lang === 'ta' ? 'பாடங்கள்' : 'Lessons'}
                    </span>
                  </div>
                </div>
                <p className="lessons-overview-desc">{subject.description}</p>
              </div>
            </div>

            {/* List of Lessons (Inset Card Group) */}
            <div className="settings-group-wrap">
              <h2 className="settings-group-heading">
                {lang === 'ta' ? 'பாட வரிசை' : 'Curriculum Lessons'}
              </h2>
              <div className="settings-card-group">
                {getLessonsBySubject(subject.id).map((item, index) => (
                  <Link
                    key={item.id}
                    to={`/lessons/${subject.id}/${item.id}`}
                    className="settings-card-row lessons-card-row"
                  >
                    <div className="lessons-row-content">
                      <span className="lessons-num-badge">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="settings-row-text-group">
                        <span className="settings-row-label">{item.title}</span>
                        <span className="settings-row-subtext tamil-text">{item.tamil}</span>
                        {item.references && item.references.length > 0 && (
                          <span className="lessons-row-citation">
                            {item.references.join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={19} className="settings-row-chevron" />
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ── Sub-view 3: Main Subjects Index ── */
          <>
            {/* Introductory Pill Banner */}
            <div className="settings-group-wrap">
              <div className="settings-card-group lessons-intro-card">
                <div className="lessons-intro-icon-wrap">
                  <Sparkles size={20} className="lessons-intro-icon" />
                </div>
                <div className="lessons-intro-text">
                  <strong>{lang === 'ta' ? 'அடிப்படை இஸ்லாமிய அறிமுகப் பாடங்கள்' : 'Foundational Islamic Studies'}</strong>
                  <p className="tamil-text">
                    {lang === 'ta'
                      ? 'அகீதா, தொழுகை, பண்புகள் மற்றும் வரலாற்று பாடங்களை எளிய முறையில் தமிழிலும் ஆங்கிலத்திலும் கற்கவும்.'
                      : 'Essential introductory lessons in Aqeedah, Salah, character, and history in Tamil & English.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Subjects Inset Card Group */}
            <div className="settings-group-wrap">
              <h2 className="settings-group-heading">
                {lang === 'ta' ? 'பாடப் பிரிவுகள்' : 'Lesson Subjects'}
              </h2>
              <div className="settings-card-group">
                {LESSON_SUBJECTS.map((item) => {
                  const count = getLessonsBySubject(item.id).length;
                  return (
                    <Link
                      key={item.id}
                      to={`/lessons/${item.id}`}
                      className="settings-card-row lessons-card-row"
                    >
                      <div className="lessons-row-content">
                        <span className="lessons-subject-icon-squircle" aria-hidden="true">
                          {item.icon}
                        </span>
                        <div className="settings-row-text-group">
                          <span className="settings-row-label">{item.title}</span>
                          <span className="settings-row-subtext tamil-text">
                            {item.tamil} · {item.description}
                          </span>
                        </div>
                      </div>
                      <div className="settings-row-value-wrap">
                        <span className="lessons-count-tag">
                          {count} {lang === 'ta' ? 'பாடங்கள்' : 'lessons'}
                        </span>
                        <ChevronRight size={19} className="settings-row-chevron" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
