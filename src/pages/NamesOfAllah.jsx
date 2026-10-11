import { useMemo, useRef, useState } from 'react';
import { Pause, Play, Search, Sparkles, Square, Volume2 } from 'lucide-react';
import { NAMES_OF_ALLAH } from '../services/namesOfAllah';
import './NamesOfAllah.css';

export default function NamesOfAllah() {
  const [query, setQuery] = useState('');
  const [playingNumber, setPlayingNumber] = useState(null);
  const [playbackMode, setPlaybackMode] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [audioError, setAudioError] = useState('');
  const playbackRun = useRef(0);
  const queueIndex = useRef(0);

  const filteredNames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return NAMES_OF_ALLAH;
    return NAMES_OF_ALLAH.filter(({ arabic, transliteration, meaning, meaningTamil, number }) => (
      arabic.includes(query.trim()) ||
      transliteration.toLocaleLowerCase().includes(normalizedQuery) ||
      meaning.toLocaleLowerCase().includes(normalizedQuery) ||
      meaningTamil.includes(query.trim()) ||
      String(number) === normalizedQuery
    ));
  }, [query]);

  const stopPlayback = () => {
    playbackRun.current += 1;
    window.speechSynthesis.cancel();
    setPlayingNumber(null);
    setPlaybackMode(null);
    setIsPaused(false);
    setQueuePosition(0);
  };

  const speakName = (index, mode, run) => {
    if (run !== playbackRun.current) return;
    const name = NAMES_OF_ALLAH[index];
    if (!name) {
      setPlayingNumber(null);
      setPlaybackMode(null);
      setIsPaused(false);
      return;
    }

    queueIndex.current = index;
    setQueuePosition(index + 1);
    setPlayingNumber(name.number);
    setAudioError('');

    const utter = new SpeechSynthesisUtterance(name.arabic);
    utter.lang = 'ar-SA';
    utter.rate = 0.85;
    utter.pitch = 1;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) utter.voice = arabicVoice;

    utter.onend = () => {
      if (run !== playbackRun.current) return;
      if (mode === 'all' && queueIndex.current + 1 < NAMES_OF_ALLAH.length) {
        speakName(queueIndex.current + 1, mode, run);
      } else {
        setPlayingNumber(null);
        setPlaybackMode(null);
        setIsPaused(false);
      }
    };

    utter.onerror = (e) => {
      if (run !== playbackRun.current) return;
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      setAudioError('Audio could not play. Your device may not support Arabic speech.');
      setPlayingNumber(null);
      setPlaybackMode(null);
      setIsPaused(false);
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const playOne = name => {
    stopPlayback();
    const run = ++playbackRun.current;
    setPlaybackMode('single');
    speakName(name.number - 1, 'single', run);
  };

  const playAll = () => {
    stopPlayback();
    const run = ++playbackRun.current;
    setPlaybackMode('all');
    speakName(0, 'all', run);
  };

  const togglePause = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container names-page">
        <header className="names-header">
          <span className="names-header-icon" aria-hidden="true"><Sparkles size={25} /></span>
          <h1>Allah's Beautiful Names</h1>
          <p className="tamil-text">அல்லாஹ்வின் அழகிய திருநாமங்கள்</p>
          <p className="names-note">
            Commonly circulated list of 99 names; translations are brief explanations and may vary.
          </p>
        </header>

        <section className="names-audio-panel" aria-label="Arabic name audio">
          <div className="names-audio-row">
            <span className="names-audio-label"><Volume2 size={17} aria-hidden="true" /> Arabic audio</span>
            <div className="names-audio-controls">
              {playbackMode ? (
                <>
                  <button className="btn btn-secondary" onClick={togglePause}>
                    {isPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button className="btn btn-ghost" onClick={stopPlayback}>
                    <Square size={14} fill="currentColor" aria-hidden="true" />
                    Stop
                  </button>
                </>
              ) : (
                <button className="btn btn-primary names-play-all" onClick={playAll}>
                  <Play size={15} fill="currentColor" aria-hidden="true" />
                  Play all 99
                </button>
              )}
            </div>
          </div>
          <p className="names-audio-status" aria-live="polite">
            {playbackMode === 'all'
              ? `Playing ${queuePosition} of 99`
              : playbackMode === 'single' && playingNumber
                ? `Playing name ${playingNumber}`
                : 'Arabic voice \u00b7 works offline'}
          </p>
          {audioError && <p className="names-audio-error" role="alert">{audioError}</p>}
        </section>

        <label className="names-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search name or meaning..."
            aria-label="Search Allah's names"
          />
          <span>{filteredNames.length} / 99</span>
        </label>

        {filteredNames.length ? (
          <ol className="names-grid">
            {filteredNames.map(name => (
              <li className={`name-card card${playingNumber === name.number ? ' is-playing' : ''}`} key={name.number}>
                <span className="name-number">{String(name.number).padStart(2, '0')}</span>
                <p className="name-arabic arabic-text" lang="ar" dir="rtl">{name.arabic}</p>
                <h2>{name.transliteration}</h2>
                <p className="name-meaning tamil-text">{name.meaningTamil}</p>
                <p className="name-meaning-english">{name.meaning}</p>
                <button
                  className="name-play-button"
                  type="button"
                  onClick={() => playOne(name)}
                  aria-label={`Play ${name.transliteration} in Arabic`}
                >
                  <Volume2 size={15} aria-hidden="true" />
                  Listen
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="names-empty">No names match your search. Try another name or meaning.</p>
        )}

        <p className="names-reference">Quran 7:180 · Quran 17:110 · Quran 59:22-24</p>
      </div>
    </main>
  );
}
