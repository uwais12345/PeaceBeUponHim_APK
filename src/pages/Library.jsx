import { Link } from 'react-router-dom';
import { Library as LibraryIcon, Bookmark, Trash2, ExternalLink } from 'lucide-react';
import { useBookmarks } from '../context/AppContext';
import { useLang } from '../context/AppContext';
import BackButton from '../components/ui/BackButton';

export default function Library() {
  const { bookmarks, remove } = useBookmarks();
  const { t } = useLang();

  const quranBookmarks = bookmarks.filter(b => b.type === 'ayah');
  const mushafBookmarks = bookmarks.filter(b => b.type === 'quran_mushaf');
  const hadithBookmarks = bookmarks.filter(b => b.type === 'hadith');
  const duaBookmarks = bookmarks.filter(b => b.type === 'dua');
  const reciterBookmarks = bookmarks.filter(b => b.type === 'qiraath_reciter');

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="app-top-nav">
          <BackButton fallback="/" label={t('back')} />
        </div>
        <div className="page-header text-center" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--color-primary-subtle)', borderRadius: '50%', marginBottom: '16px', color: 'var(--color-primary)' }}>
            <LibraryIcon size={32} />
          </div>
          <h1 className="page-title">{t('yourLibrary')}</h1>
          <p className="page-description" style={{ color: 'var(--color-text-secondary)' }}>
            {t('libraryDesc')}
          </p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <Bookmark size={40} className="empty-state-icon" />
            <p className="empty-state-title">{t('noBookmarks')}</p>
            <p className="empty-state-desc">{t('noBookmarksDesc')}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <Link to="/quran" className="btn btn-secondary btn-sm">{t('quran')}</Link>
              <Link to="/hadith" className="btn btn-secondary btn-sm">{t('hadith')}</Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* Quran */}
            {quranBookmarks.length > 0 && (
              <section>
                <h2 className="section-title" style={{ marginBottom: '1rem' }}>{t('quran')} ({quranBookmarks.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {quranBookmarks.map(b => (
                    <div key={b.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>{b.title}</h3>
                        <p 
                          style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}
                          dangerouslySetInnerHTML={{ __html: b.subtitle }}
                        />
                        <Link to={b.href} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                          {t('quran')} <ExternalLink size={14} />
                        </Link>
                      </div>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => remove(b.type, b.id)} aria-label={t('delete')} title={t('delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hadith */}
            {hadithBookmarks.length > 0 && (
              <section>
                <h2 className="section-title" style={{ marginBottom: '1rem' }}>{t('hadith')} ({hadithBookmarks.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hadithBookmarks.map(b => (
                    <div key={b.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{b.title}</h3>
                        <p 
                          className="arabic-text notranslate" 
                          dir="rtl" 
                          translate="no" 
                          style={{ fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: '1rem' }}
                          dangerouslySetInnerHTML={{ __html: b.subtitle }}
                        />
                        <Link to={b.href} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                          {t('hadith')} <ExternalLink size={14} />
                        </Link>
                      </div>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => remove(b.type, b.id)} aria-label={t('delete')} title={t('delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Dua */}
            {duaBookmarks.length > 0 && (
              <section>
                <h2 className="section-title" style={{ marginBottom: '1rem' }}>{t('dua')} ({duaBookmarks.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {duaBookmarks.map(b => (
                    <div key={b.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-gold)', marginBottom: '0.5rem' }}>{b.title}</h3>
                        <p 
                          className="tamil-text" 
                          style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}
                          dangerouslySetInnerHTML={{ __html: b.subtitle }}
                        />
                        <Link to={b.href} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                          {t('dua')} <ExternalLink size={14} />
                        </Link>
                      </div>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => remove(b.type, b.id)} aria-label={t('delete')} title={t('delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mushaf Pages */}
            {mushafBookmarks.length > 0 && (
              <section>
                <h2 className="section-title" style={{ marginBottom: '1rem' }}>Mushaf Pages • முஸஹஃப் ({mushafBookmarks.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {mushafBookmarks.map(b => (
                    <div key={b.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.3rem' }}>{b.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.8rem' }}>
                          {b.subtitle}
                        </p>
                        <Link to={b.url || b.href} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                          Open Page <ExternalLink size={14} />
                        </Link>
                      </div>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => remove(b.type, b.id)} aria-label={t('delete')} title={t('delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Qiraath Reciters */}
            {reciterBookmarks.length > 0 && (
              <section>
                <h2 className="section-title" style={{ marginBottom: '1rem' }}>Reciters • காரிகள் ({reciterBookmarks.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reciterBookmarks.map(b => (
                    <div key={b.id} className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.3rem' }}>{b.title}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.8rem' }}>
                          {b.subtitle}
                        </p>
                        <Link to={b.href || b.url} className="btn btn-ghost btn-sm" style={{ padding: 0 }}>
                          Listen <ExternalLink size={14} />
                        </Link>
                      </div>
                      <button type="button" className="btn-icon btn-icon-danger" onClick={() => remove(b.type, b.id)} aria-label={t('delete')} title={t('delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
