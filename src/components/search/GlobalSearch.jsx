import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, MessageSquare, Heart, Compass, Users, Loader } from 'lucide-react';
import { useSearch } from '../../context/AppContext';
import { searchQuran } from '../../services/quran';
import { fetchDuasData, searchDuas } from '../../services/dua';
import './GlobalSearch.css';

const QUICK_LINKS = [
  { label: 'Al-Fatiha', to: '/quran/1', type: 'Quran', icon: BookOpen },
  { label: 'Sahih al-Bukhari', to: '/hadith/bukhari', type: 'Collection', icon: MessageSquare },
  { label: 'Morning Adhkar', to: '/dua?category=morning', type: 'Dua', icon: Heart },
  { label: 'Parents', to: '/explore/parents', type: 'Topic', icon: Users },
  { label: 'Youth & Iman', to: '/explore/youth', type: 'Topic', icon: Compass },
];

export default function GlobalSearch() {
  const { isOpen, close } = useSearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ quran: [], duas: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const [allDuas, setAllDuas] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ quran: [], duas: [] });
      setTimeout(() => inputRef.current?.focus(), 50);
      
      // Lazily fetch duas for search
      if (!allDuas) {
        fetchDuasData().then(data => setAllDuas(data.duas || [])).catch(() => setAllDuas([]));
      }
    }
  }, [isOpen, allDuas]);

  const doSearch = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults({ quran: [], duas: [] }); return; }
    setLoading(true);
    try {
      const duaSearchResults = allDuas ? searchDuas(allDuas, q) : [];
      const [quranRes, duaRes] = await Promise.allSettled([
        searchQuran(q),
        Promise.resolve({ results: duaSearchResults }),
      ]);
      setResults({
        quran: quranRes.status === 'fulfilled' ? (quranRes.value.results || []).slice(0, 5) : [],
        duas: duaRes.status === 'fulfilled' ? (duaRes.value.results || []).slice(0, 3) : [],
      });
    } finally {
      setLoading(false);
    }
  }, [allDuas]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(timerRef.current);
  }, [query, doSearch]);

  const go = (to) => { navigate(to); close(); };
  const hasResults = results.quran.length > 0 || results.duas.length > 0;
  // Global search modal is disabled in favor of inline navbar search
  return null;
}
