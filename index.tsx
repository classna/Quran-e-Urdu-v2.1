/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---
interface Surah {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
}

interface Juz {
    number: number;
    startSurahName: string;
    startSurahNameArabic: string;
    surah: number;
    ayah: number;
}

interface Verse {
    number: number;
    numberInSurah: number;
    text: string;
    englishTranslation: string;
    urduTranslation: string;
    surah: Surah;
}

interface Bookmark {
    id: string;
    surahName: string;
    surahNumber: number;
    surahEnglishName: string;
    verseNumber: number;
    verseData: Verse;
}

interface LastRead {
    surah?: Surah;
    verseNumberInSurah: number;
    surahNumber?: number; // for backward compatibility with old data in localStorage
}

// --- ICONS (unchanged) ---
const PlayIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z"/></svg>);
const PauseIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M5.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75A.75.75 0 0 0 7.25 3h-1.5ZM12.75 3a.75.75 0 0 0-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5Z"/></svg>);
const LoadingSpinnerIcon = () => (<div className="w-8 h-8 border-4 border-gray-300 border-t-[var(--color-primary)] rounded-full animate-spin"></div>);
const BookmarkIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/></svg>);
const BookmarkFilledIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.5 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/></svg>);
const HomeIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"/><path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75-.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"/></svg>);
const SearchIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>);
const SettingsIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const ChevronLeftIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>);
const HeadphonesIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" /></svg>);
const BookIcon = ({ className = "w-6 h-6" }) => (<svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" /></svg>);


// --- UTILITIES ---
const toEasternArabicNumerals = (num) => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(digit => arabicNumerals[parseInt(digit, 10)] || '').join('');
};

const AyahEndSymbol = ({ number }) => (
  <span className="ayah-symbol font-semibold inline-flex items-center justify-center w-8 h-8 rounded-full mx-2 text-sm">
    {toEasternArabicNumerals(number)}
  </span>
);

// --- SETTINGS DATA ---
const JUZ_START_WORDS = [
  "الٓمٓ", "سَيَقُولُ ٱلسُّفَهَآءُ", "تِلْكَ ٱلرُّسُلُ", "لَن تَنَالُوا۟ ٱلْبِرَّ", "وَٱلْمُحْصَنَٰتُ",
  "لَّا يُحِبُّ ٱللَّهُ", "وَإِذَا سَمِعُوا۟", "وَلَوْ أَنَّنَا", "قَالَ ٱلْمَلَأُ", "وَٱعْلَمُوٓا۟",
  "يَعْتَذِرُونَ", "وَمَا مِن دَآبَّةٍ", "وَمَآ أُبَرِّئُ نَفْسِىٓ", "رُّبَمَا", "سُبْحَٰنَ ٱلَّذِىٓ",
  "قَالَ أَلَمْ", "ٱقْتَرَبَ لِلNَّاسِ", "قَدْ أَفْلَحَ", "وَقَالَ ٱلَّذِينَ", "أَمَّنْ خَلَقَ",
  "ٱتْلُ مَآ أُوحِىَ", "وَمَن يَقْنُتْ", "وَمَا لِىَ", "فَمَن أَظْلَمُ", "إِلَيْهِ يُرَدُّ",
  "حمٓ", "قَالَ فَمَا خَطْبُكُمْ", "قَدْ سَمِعَ ٱللَّهُ", "تَبَٰרَكَ ٱلَّذِى", "عَمَّ يَتَسَآءَلُونَ"
];

const VERIFIED_JUZ_STARTS = [
    { surah: 1, ayah: 1 },   // Juz 1
    { surah: 2, ayah: 142 }, // Juz 2
    { surah: 2, ayah: 253 }, // Juz 3
    { surah: 3, ayah: 93 },  // Juz 4
    { surah: 4, ayah: 24 },  // Juz 5
    { surah: 4, ayah: 148 }, // Juz 6
    { surah: 5, ayah: 82 },  // Juz 7
    { surah: 6, ayah: 111 }, // Juz 8
    { surah: 7, ayah: 88 },  // Juz 9
    { surah: 8, ayah: 41 },  // Juz 10
    { surah: 9, ayah: 93 },  // Juz 11
    { surah: 11, ayah: 6 },  // Juz 12
    { surah: 12, ayah: 53 }, // Juz 13
    { surah: 15, ayah: 1 },  // Juz 14
    { surah: 17, ayah: 1 },  // Juz 15
    { surah: 18, ayah: 75 }, // Juz 16
    { surah: 21, ayah: 1 },  // Juz 17
    { surah: 23, ayah: 1 },  // Juz 18
    { surah: 25, ayah: 21 }, // Juz 19
    { surah: 27, ayah: 56 }, // Juz 20
    { surah: 29, ayah: 46 }, // Juz 21
    { surah: 33, ayah: 31 }, // Juz 22
    { surah: 36, ayah: 28 }, // Juz 23
    { surah: 39, ayah: 32 }, // Juz 24
    { surah: 41, ayah: 47 }, // Juz 25
    { surah: 46, ayah: 1 },  // Juz 26
    { surah: 51, ayah: 31 }, // Juz 27
    { surah: 58, ayah: 1 },  // Juz 28
    { surah: 67, ayah: 1 },  // Juz 29
    { surah: 78, ayah: 1 }   // Juz 30
];

const QARIS = [{ id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' }, { id: 'ar.hudhaify', name: 'Ali Al-Hudhaify' }, { id: 'ar.mahermuaiqly', name: 'Maher Al Muaqily' }];
const THEMES = [{ id: 'serenity', name: 'Serenity' }, { id: 'sunrise', name: 'Sunrise' }, { id: 'majestic', name: 'Majestic' }, { id: 'sepia', name: 'Sepia' }, { id: 'olive', name: 'Olive' }, { id: 'midnight', name: 'Midnight' }];
const ARABIC_FONTS = [
    { id: 'kfgqpc-v2', name: 'KFGQPC V2 (Uthmani)' },
    { id: 'amiri', name: 'Amiri' },
    { id: 'lateef', name: 'Lateef' },
    { id: 'noto-naskh', name: 'Noto Naskh Arabic' },
    { id: 'scheherazade', name: 'Scheherazade New' },
];
const TRANSLATION_FONTS = [
    { id: 'inter', name: 'Inter', lang: 'english' },
    { id: 'roboto', name: 'Roboto', lang: 'english' },
    { id: 'lato', name: 'Lato', lang: 'english' },
    { id: 'poppins', name: 'Poppins', lang: 'english' },
    { id: 'noto-nastaliq', name: 'Noto Nastaliq', lang: 'urdu' },
    { id: 'gulzar', name: 'Gulzar', lang: 'urdu' },
];
const TRANSLATION_AUDIO_OPTIONS = [
    { id: 'none', name: 'Off' },
    { id: 'en.walk', name: 'English (Ibrahim Walk)' },
    { id: 'ur.khan', name: 'Urdu (Farhat Hashmi)' },
];

const DEFAULT_SETTINGS = {
    theme: 'olive',
    translationLanguage: 'urdu',
    qari: 'ar.alafasy',
    translationAudio: 'ur.khan',
    translationFont: 'gulzar',
    arabicFont: 'lateef',
    arabicFontSize: 30,
    translationFontSize: 15,
    arabicLineHeight: 1.5,
    translationLineHeight: 2.3,
};

// --- HOOKS ---
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error("Error reading from localStorage", error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage", error);
    }
  }, [key, state]);

  return [state, setState];
};

// --- REDESIGNED COMPONENTS ---

const SegmentedControl = ({ options, activeOption, onOptionClick }) => {
  const activeIndex = options.findIndex(opt => opt.id === activeOption);
  return (
    <div className="segmented-control-container">
      <div 
        className="segmented-control-indicator"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {options.map(option => (
        <button 
          key={option.id}
          onClick={() => onOptionClick(option.id)}
          className={`segmented-control-button ${activeOption === option.id ? 'active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const Header = ({ title, onBack, icon, children }) => (
  <header className="app-header sticky top-0 z-40 h-16 flex items-center justify-between px-4">
    <div className="flex items-center space-x-2">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 mr-2 rounded-full hover:bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)]">
          <ChevronLeftIcon className="w-6 h-6 text-[var(--color-text-secondary)]"/>
        </button>
      )}
      {icon}
      <h1 className="text-xl font-bold font-poppins truncate">{title}</h1>
    </div>
    {children}
  </header>
);

const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
    { id: 'bookmarks', icon: BookmarkIcon, label: 'Bookmarks' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 h-20 z-40">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-item flex flex-col items-center space-y-1 transition-colors duration-200 ${activeTab === item.id ? 'active' : 'text-[var(--color-text-secondary)]'}`}
          >
            <item.icon className="w-7 h-7" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

const VerseCard = ({ verse, settings, onPlay, onBookmark, isBookmarked, isPlaying, isLoading, isHighlighted, isFirstVerse, isTranslationPlaying }) => {
    const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    let verseText = verse.text;

    if (isFirstVerse && verseText.startsWith(bismillah)) {
        verseText = verseText.substring(bismillah.length).trim();
    }

    return (
      <div className={`p-4 rounded-2xl transition-all duration-300 ${isHighlighted ? 'bg-[color-mix(in_srgb,_var(--color-primary)_8%,_transparent)] ring-2 ring-[var(--color-primary)]' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold text-sm themed-gradient-text">
            {verse.surah.englishName} {verse.numberInSurah}
          </span>
          <div className="flex items-center space-x-2">
            <button onClick={onBookmark} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              {isBookmarked ? <BookmarkFilledIcon className="w-5 h-5 text-[var(--color-primary)]" /> : <BookmarkIcon className="w-5 h-5" />}
            </button>
            <button onClick={onPlay} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
              {isLoading ? <LoadingSpinnerIcon /> : isPlaying ? <PauseIcon className="w-5 h-5 text-[var(--color-primary)]" /> : <PlayIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <p dir="rtl" className={`text-right text-[var(--color-text-primary)] font-${settings.arabicFont} arabic-text mb-4`}>
          {verseText.replace(/[\u06dd\u0660-\u0669\s]+$/, '')}
          <AyahEndSymbol number={verse.numberInSurah} />
        </p>
        <div className={`translation-sub-card mt-4 p-4 rounded-xl transition-all duration-300 ${isTranslationPlaying ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
             <p className={`text-[var(--color-text-secondary)] font-${settings.translationFont} translation-text text-right`}>
              {settings.translationLanguage === 'urdu' ? verse.urduTranslation : verse.englishTranslation}
            </p>
        </div>
      </div>
    );
};


const AudioMiniPlayer = ({ surah, status, onTogglePlay, onNavigate }) => (
  <div className="fixed bottom-20 left-0 right-0 z-30 p-4 animate-slideInUp" onClick={onNavigate}>
    <div className="card flex items-center p-3 space-x-3 cursor-pointer">
      <div className="w-12 h-12 themed-gradient rounded-xl flex items-center justify-center text-white flex-shrink-0">
        <HeadphonesIcon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate font-poppins">{surah.englishName}</p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {status === 'playing' ? 'Playing...' : 'Paused'}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
        className="w-12 h-12 rounded-full flex items-center justify-center bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] text-[var(--color-primary)]"
      >
        {status === 'playing' ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6 ml-0.5" />}
      </button>
    </div>
  </div>
);

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="card max-w-sm w-full p-6 text-center animate-scaleIn">
        <h3 className="text-xl font-bold font-poppins mb-2">{title}</h3>
        <p className="text-[var(--color-text-secondary)] mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="w-full text-center p-3 rounded-lg font-semibold bg-gray-500/10 text-[var(--color-text-secondary)] hover:bg-gray-500/20 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full text-center p-3 rounded-lg font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors duration-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};


// --- SCREENS ---
const HomeScreen = ({ surahs, juzs, settings, onSurahSelect, onJuzSelect, onPlaySurah, playbackState, lastRead, onContinueReading, homeView }) => {
  return (
    <div className="p-4 space-y-6">
      {lastRead && lastRead.surah && (
        <div onClick={onContinueReading} className="card p-6 themed-gradient text-white relative overflow-hidden cursor-pointer animate-scaleIn">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full"></div>
          <div className="relative z-10">
            <p className="font-semibold text-sm opacity-80 mb-1">CONTINUE READING</p>
            <h3 className="text-2xl font-bold font-poppins">{lastRead.surah.englishName}</h3>
            <p className="opacity-90">Verse {lastRead.verseNumberInSurah}</p>
          </div>
        </div>
      )}

      <div>
        {homeView === 'surahs' ? (
          <div className="space-y-3">
            {surahs.map((surah, index) => (
              <div key={surah.number} className="card p-4 flex items-center space-x-4 animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] rounded-full font-bold themed-gradient-text">
                  {surah.number}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSurahSelect(surah)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold font-poppins truncate">{surah.englishName}</h4>
                      <p className="text-sm text-[var(--color-text-secondary)]">{surah.englishNameTranslation}</p>
                    </div>
                    <p className={`font-${settings.arabicFont} text-xl`}>{surah.name}</p>
                  </div>
                </div>
                <button onClick={() => onPlaySurah(surah)} className="p-2 rounded-full hover:bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                  {playbackState.surahNumber === surah.number && playbackState.status === 'playing' ? <PauseIcon /> : <PlayIcon />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
              {juzs.map((juz, index) => (
                  <div key={juz.number} onClick={() => onJuzSelect(juz)} className="card p-4 flex items-center space-x-4 cursor-pointer animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)] rounded-full font-bold themed-gradient-text">
                          {juz.number}
                      </div>
                      <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                              <div>
                                  <h4 className={`font-${settings.arabicFont} text-2xl font-bold mb-1`}>{JUZ_START_WORDS[juz.number - 1]}</h4>
                                  <p className="text-sm text-[var(--color-text-secondary)] font-poppins">Juz' {juz.number}</p>
                              </div>
                              <p className={`font-${settings.arabicFont} text-xl text-[var(--color-text-secondary)]`}>{juz.startSurahNameArabic}</p>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SurahScreen = ({ surah, verses, settings, onPlayVerse, onBookmark, bookmarks, playbackState, verseRefs, scrollToVerse, onScrollComplete, loading }) => {
    useEffect(() => {
        if (scrollToVerse && verses.length > 0 && !loading) {
            const verseData = verses.find(v => v.number === scrollToVerse);
            if (verseData && verseRefs.current[verseData.number]) {
                setTimeout(() => {
                    verseRefs.current[verseData.number]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    onScrollComplete();
                }, 100); 
            }
        }
    }, [scrollToVerse, verses, verseRefs, onScrollComplete, loading]);

    return (
        <div className="p-4 space-y-4">
            <div className="card p-6 text-center themed-gradient text-white space-y-2 animate-scaleIn">
                <h2 className="text-3xl font-bold font-poppins">{surah.englishName}</h2>
                <p className={`text-4xl font-${settings.arabicFont}`}>{surah.name}</p>
            
                <p className="opacity-90">{surah.englishNameTranslation}</p>
                <div className="flex justify-center space-x-4 pt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{surah.revelationType}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">{surah.numberOfAyahs} Verses</span>
                </div>
                 {surah.number !== 1 && surah.number !== 9 && (
                    <p className="bismillah-text-card pt-2">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center pt-20"><LoadingSpinnerIcon/></div>
            ) : (
                <div className="space-y-4">
                    {verses.map((verse, index) => (
                        <div key={verse.number} ref={el => { verseRefs.current[verse.number] = el; }} className="animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                            <VerseCard
                                verse={verse}
                                settings={settings}
                                onPlay={() => onPlayVerse(verse)}
                                onBookmark={() => onBookmark(verse)}
                                isBookmarked={bookmarks.some(b => b.id === `${verse.surah.number}-${verse.numberInSurah}`)}
                                isPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.status === 'playing'}
                                isLoading={playbackState.loadingVerse === verse.number}
                                isHighlighted={playbackState.status !== 'stopped' && playbackState.currentVerseGlobal === verse.number}
                                isFirstVerse={index === 0 && surah.number !== 1 && surah.number !== 9}
                                isTranslationPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.stage === 'translation' && playbackState.status === 'playing'}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const JuzScreen = ({ juz, verses, settings, onPlayVerse, onBookmark, bookmarks, playbackState, verseRefs, loading, scrollToVerse, onScrollComplete }) => {
    useEffect(() => {
        if (scrollToVerse && verses.length > 0 && !loading) {
            const verseData = verses.find(v => v.number === scrollToVerse);
            if (verseData && verseRefs.current[verseData.number]) {
                setTimeout(() => {
                    verseRefs.current[verseData.number]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                    });
                    onScrollComplete();
                }, 100);
            }
        }
    }, [scrollToVerse, verses, verseRefs, onScrollComplete, loading]);
    
    return (
        <div className="p-4 space-y-4">
            <div className="card p-6 text-center themed-gradient text-white space-y-2 animate-scaleIn">
                <h2 className="text-3xl font-bold font-poppins">Juz' {juz.number}</h2>
                <p className={`text-4xl font-${settings.arabicFont}`}>{JUZ_START_WORDS[juz.number - 1]}</p>
                {!loading && verses.length > 0 && (
                     <p className="opacity-90">
                        {verses[0].surah.englishName}{verses[0].surah.number !== verses[verses.length-1].surah.number ? ` to ${verses[verses.length-1].surah.englishName}` : ''}
                    </p>
                )}
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center pt-20"><LoadingSpinnerIcon/></div>
            ) : (
                <div className="space-y-4">
                    {verses.map((verse, index) => (
                        <div key={verse.number} ref={el => { verseRefs.current[verse.number] = el; }} className="animate-slideInUp" style={{ animationDelay: `${index * 0.02}s` }}>
                            {
                                verse.numberInSurah === 1 && index > 0 && verse.surah.number !== 9 && (
                                    <p className="bismillah-text-card text-center text-2xl my-4 themed-gradient-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                )
                            }
                            <VerseCard
                                verse={verse}
                                settings={settings}
                                onPlay={() => onPlayVerse(verse)}
                                onBookmark={() => onBookmark(verse)}
                                isBookmarked={bookmarks.some(b => b.id === `${verse.surah.number}-${verse.numberInSurah}`)}
                                isPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.status === 'playing'}
                                isLoading={playbackState.loadingVerse === verse.number}
                                isHighlighted={playbackState.status !== 'stopped' && playbackState.currentVerseGlobal === verse.number}
                                isFirstVerse={verse.numberInSurah === 1 && verse.surah.number !== 1 && verse.surah.number !== 9}
                                isTranslationPlaying={playbackState.currentVerseGlobal === verse.number && playbackState.stage === 'translation' && playbackState.status === 'playing'}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const BookmarksScreen = ({ bookmarks, onBookmarkSelect, settings }) => (
  <div className="p-4">
    <h2 className="text-2xl font-bold font-poppins mb-4">Bookmarks</h2>
    {bookmarks.length > 0 ? (
      <div className="space-y-3">
        {bookmarks.map((bookmark, index) => (
          <div key={bookmark.id} onClick={() => onBookmarkSelect(bookmark)} className="card p-4 cursor-pointer animate-slideInUp" style={{ animationDelay: `${index * 0.03}s` }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold font-poppins">{bookmark.surahEnglishName}</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Verse {bookmark.verseNumber}</p>
              </div>
              <p className={`font-${settings.arabicFont} text-xl`}>{bookmark.surahName}</p>
            </div>
            <p className={`mt-3 text-[var(--color-text-secondary)] font-${settings.translationFont} translation-text line-clamp-2 text-right`}>
              {settings.translationLanguage === 'urdu' ? bookmark.verseData.urduTranslation : bookmark.verseData.englishTranslation}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-20">
        <BookmarkIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
        <h3 className="text-xl font-bold font-poppins">No Bookmarks Yet</h3>
        <p className="text-[var(--color-text-secondary)] mt-1">Tap the bookmark icon on a verse to save it.</p>
      </div>
    )}
  </div>
);

const SearchScreen = () => (
    <div className="p-4">
        <h2 className="text-2xl font-bold font-poppins mb-4">Search</h2>
        <div className="relative">
          <input 
            type="text"
            placeholder="Search for a Surah or verse..."
            className="w-full p-4 pl-12 pr-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />
          </div>
        </div>
        <div className="text-center py-20">
            <SearchIcon className="w-12 h-12 mx-auto text-[var(--color-text-secondary)] mb-4" />
            <h3 className="text-xl font-bold font-poppins">Search Coming Soon</h3>
            <p className="text-[var(--color-text-secondary)] mt-1">This feature is currently under development.</p>
        </div>
    </div>
);

const SettingsPreviewCard = ({ settings }) => (
  <div className="p-4 mb-4 bg-[color-mix(in_srgb,var(--color-bg-card)_50%,var(--color-bg-main))] rounded-xl">
    <div style={{
      '--arabic-font-size': `${settings.arabicFontSize}px`,
      '--translation-font-size': `${settings.translationFontSize}px`,
      '--arabic-line-height': settings.arabicLineHeight,
      '--translation-line-height': settings.translationLineHeight,
    } as React.CSSProperties}>
      <p dir="rtl" className={`text-right text-[var(--color-text-primary)] font-${settings.arabicFont} arabic-text mb-4 transition-all duration-200`}>
        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        <AyahEndSymbol number={1} />
      </p>
      <p className={`text-[var(--color-text-secondary)] font-${settings.translationFont} translation-text transition-all duration-200 text-right`}>
        {settings.translationLanguage === 'urdu' ? 'شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے' : 'In the name of Allah, the Entirely Merciful, the Especially Merciful.'}
      </p>
    </div>
  </div>
);

const SettingsScreen = ({ settings, onSettingChange, onReset }) => {
  const availableTranslationFonts = useMemo(() => TRANSLATION_FONTS.filter(f => f.lang === settings.translationLanguage), [settings.translationLanguage]);
  
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4 card p-6">
        <h3 className="text-lg font-bold font-poppins">Theme</h3>
        <div className="grid grid-cols-3 gap-4">
          {THEMES.map(theme => (
            <div key={theme.id} className="text-center">
              <button
                onClick={() => onSettingChange('theme', theme.id)}
                className={`w-12 h-12 rounded-full mx-auto transition-all duration-200 ${settings.theme === theme.id ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-card)] ring-[var(--color-primary)]' : ''}`}
                data-theme={theme.id}
              >
                <div className="w-full h-full rounded-full themed-gradient"></div>
              </button>
              <span className="text-sm mt-2 block">{theme.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4 card p-6">
        <h3 className="text-lg font-bold font-poppins">Appearance</h3>
        <SettingsPreviewCard settings={settings} />
        <div className="flex justify-between items-center">
          <label>Translation Language</label>
          <div className="flex rounded-lg p-1 bg-[color-mix(in_srgb,_var(--color-primary)_10%,_transparent)]">
            <button onClick={() => onSettingChange('translationLanguage', 'english')} className={`px-4 py-1 rounded-md text-sm font-semibold ${settings.translationLanguage === 'english' ? 'bg-[var(--color-primary)] text-white' : ''}`}>English</button>
            <button onClick={() => onSettingChange('translationLanguage', 'urdu')} className={`px-4 py-1 rounded-md text-sm font-semibold ${settings.translationLanguage === 'urdu' ? 'bg-[var(--color-primary)] text-white' : ''}`}>Urdu</button>
          </div>
        </div>
         <div>
          <label className="block mb-2">Arabic Font</label>
          <select value={settings.arabicFont} onChange={e => onSettingChange('arabicFont', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {ARABIC_FONTS.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-2">Translation Font</label>
          <select value={settings.translationFont} onChange={e => onSettingChange('translationFont', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {availableTranslationFonts.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-2">Arabic Font Size: {settings.arabicFontSize}px</label>
          <input type="range" min="20" max="50" value={settings.arabicFontSize} onChange={e => onSettingChange('arabicFontSize', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.arabicFontSize - 20) / 30) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.arabicFontSize - 20) / 30) * 100}%)` }}/>
        </div>
         <div>
          <label className="block mb-2">Translation Font Size: {settings.translationFontSize}px</label>
          <input type="range" min="12" max="24" value={settings.translationFontSize} onChange={e => onSettingChange('translationFontSize', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.translationFontSize - 12) / 12) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.translationFontSize - 12) / 12) * 100}%)` }}/>
        </div>
        <div>
          <label className="block mb-2">Arabic Line Height: {settings.arabicLineHeight}</label>
          <input type="range" min="1.5" max="4" step="0.1" value={settings.arabicLineHeight} onChange={e => onSettingChange('arabicLineHeight', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.arabicLineHeight - 1.5) / 2.5) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.arabicLineHeight - 1.5) / 2.5) * 100}%)` }}/>
        </div>
        <div>
          <label className="block mb-2">Translation Line Height: {settings.translationLineHeight}</label>
          <input type="range" min="1.4" max="4" step="0.1" value={settings.translationLineHeight} onChange={e => onSettingChange('translationLineHeight', +e.target.value)} className="w-full h-2 bg-[color-mix(in_srgb,_var(--color-primary)_20%,_transparent)] rounded-lg appearance-none cursor-pointer slider" style={{ background: `linear-gradient(to right, var(--color-primary) ${((settings.translationLineHeight - 1.4) / 2.6) * 100}%, color-mix(in srgb, var(--color-primary) 20%, transparent) ${((settings.translationLineHeight - 1.4) / 2.6) * 100}%)` }}/>
        </div>
      </div>
      <div className="space-y-4 card p-6">
        <h3 className="text-lg font-bold font-poppins">Audio</h3>
        <div>
          <label className="block mb-2">Qari (Reciter)</label>
          <select value={settings.qari} onChange={e => onSettingChange('qari', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {QARIS.map(qari => <option key={qari.id} value={qari.id}>{qari.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-2">Translation Audio</label>
          <select value={settings.translationAudio} onChange={e => onSettingChange('translationAudio', e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-bg-main)] border border-[var(--color-border)]">
            {TRANSLATION_AUDIO_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>
      </div>
      <div className="card p-6">
        <button
          onClick={onReset}
          className="w-full text-center p-3 rounded-lg font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors duration-200"
        >
          Reset Settings
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const QuranApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [homeView, setHomeView] = useState('surahs');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<Juz | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [juzs, setJuzs] = useState<Juz[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollToVerse, setScrollToVerse] = useState<number | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  
  const [settings, setSettings] = usePersistentState('quranAppSettings', DEFAULT_SETTINGS);

  const [bookmarks, setBookmarks] = usePersistentState<Bookmark[]>('quranAppBookmarks', []);
  const [lastRead, setLastRead] = usePersistentState<LastRead | null>('quranAppLastRead', null);

  const [playbackState, setPlaybackState] = useState({
    surahNumber: null,
    currentVerseIndex: 0,
    currentVerseGlobal: null,
    status: 'stopped', // playing, paused, stopped
    loadingVerse: null,
    stage: 'arabic', // 'arabic' or 'translation'
  });
  const [playbackContext, setPlaybackContext] = useState<{ type: 'surah' | 'juz', data: Surah | Juz } | null>(null);

  const audioRef = useRef < HTMLAudioElement | null > (null);
  const verseRefs = useRef < Record < number, HTMLDivElement | null >> ({});
  const preloadedUrlsRef = useRef(new Set());
  const handleSettingChange = useCallback((key, value) => setSettings(p => ({ ...p, [key]: value })), [setSettings]);

  const handleConfirmReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setShowResetConfirmModal(false);
  };

  // --- Effects ---
  useEffect(() => {
    const loadInitialData = async () => {
        setLoading(true);

        // 1. Try loading from cache
        try {
          const cachedSurahs = localStorage.getItem('quranAppSurahs');
          if (cachedSurahs) {
            const parsedSurahs = JSON.parse(cachedSurahs);
            if (Array.isArray(parsedSurahs) && parsedSurahs.length > 0) {
                setSurahs(parsedSurahs);
                const juzArray = VERIFIED_JUZ_STARTS.map((start, index) => {
                  const surahInfo = parsedSurahs.find(s => s.number === start.surah);
                  return {
                    number: index + 1,
                    surah: start.surah,
                    ayah: start.ayah,
                    startSurahName: surahInfo ? surahInfo.englishName : '',
                    startSurahNameArabic: surahInfo ? surahInfo.name : '',
                  };
                });
                setJuzs(juzArray);
                setLoading(false);
                return; // Data loaded from cache, we're done.
            }
          }
        } catch (e) {
            console.warn("Failed to load surahs from cache, fetching from network.", e);
            localStorage.removeItem('quranAppSurahs');
        }

        // 2. If cache fails or is empty, fetch from network
        try {
          const surahRes = await fetch('https://api.alquran.cloud/v1/surah');
          const surahData = await surahRes.json();

          if (surahData.code === 200) {
            const fetchedSurahs = surahData.data;
            setSurahs(fetchedSurahs);
            
            try {
              localStorage.setItem('quranAppSurahs', JSON.stringify(fetchedSurahs));
            } catch (e) {
              console.error("Could not cache surah data", e);
            }
            
            const juzArray = VERIFIED_JUZ_STARTS.map((start, index) => {
              const surahInfo = fetchedSurahs.find(s => s.number === start.surah);
              return {
                number: index + 1,
                surah: start.surah,
                ayah: start.ayah,
                startSurahName: surahInfo ? surahInfo.englishName : '',
                startSurahNameArabic: surahInfo ? surahInfo.name : '',
              };
            });
            
            setJuzs(juzArray);
          }
        } catch (e) {
          console.error("Failed to fetch initial surah data:", e);
        } finally {
          setLoading(false);
        }
    };

    loadInitialData();
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  // Migration for old Urdu audio setting
  useEffect(() => {
    if (settings.translationAudio === 'ur.jalandhry' || settings.translationAudio === 'ur.shamshadalkhan') {
        handleSettingChange('translationAudio', 'ur.khan');
    }
  }, [handleSettingChange, settings.translationAudio]);

  useEffect(() => {
    // If user has audio on, sync it with the text language
    if (settings.translationAudio !== 'none') {
        if (settings.translationLanguage === 'english' && settings.translationAudio !== 'en.walk') {
            handleSettingChange('translationAudio', 'en.walk');
        } else if (settings.translationLanguage === 'urdu' && settings.translationAudio !== 'ur.khan') {
            handleSettingChange('translationAudio', 'ur.khan');
        }
    }
  }, [settings.translationLanguage, settings.translationAudio, handleSettingChange]);

  useEffect(() => {
    document.documentElement.style.setProperty('--arabic-font-size', `${settings.arabicFontSize}px`);
    document.documentElement.style.setProperty('--translation-font-size', `${settings.translationFontSize}px`);
    document.documentElement.style.setProperty('--arabic-line-height', `${settings.arabicLineHeight}`);
    document.documentElement.style.setProperty('--translation-line-height', `${settings.translationLineHeight}`);
  }, [settings.arabicFontSize, settings.translationFontSize, settings.arabicLineHeight, settings.translationLineHeight]);

  useEffect(() => {
    const relevantFont = TRANSLATION_FONTS.find(f => f.lang === settings.translationLanguage && f.id === settings.translationFont);
    if (!relevantFont) {
        const defaultFont = TRANSLATION_FONTS.find(f => f.lang === settings.translationLanguage);
        if (defaultFont) handleSettingChange('translationFont', defaultFont.id);
    }
  }, [settings.translationLanguage, settings.translationFont, handleSettingChange]);
  
  // --- Data Loading ---
   const surahStartVerseMap = useMemo(() => {
    if (surahs.length === 0) return {};
    const map = {};
    let currentVerse = 1;
    const sortedSurahs = [...surahs].sort((a, b) => a.number - b.number);
    for (const surah of sortedSurahs) {
      map[surah.number] = currentVerse;
      currentVerse += surah.numberOfAyahs;
    }
    return map;
  }, [surahs]);

  const juzBoundaries = useMemo(() => {
    if (surahs.length === 0) return [];
    const surahAyahCounts = surahs.reduce((acc, s) => ({ ...acc, [s.number]: s.numberOfAyahs }), {});
    
    return VERIFIED_JUZ_STARTS.map((start, index) => {
      let end;
      if (index === VERIFIED_JUZ_STARTS.length - 1) {
        end = { surah: 114, ayah: 6 };
      } else {
        const nextStart = VERIFIED_JUZ_STARTS[index + 1];
        if (nextStart.ayah === 1) {
          const prevSurahNumber = nextStart.surah - 1;
          end = { surah: prevSurahNumber, ayah: surahAyahCounts[prevSurahNumber] };
        } else {
          end = { surah: nextStart.surah, ayah: nextStart.ayah - 1 };
        }
      }
      return { start, end };
    });
  }, [surahs]);

  const loadVerses = useCallback(async ({ surah, juz }: { surah?: Surah, juz?: Juz }) => {
    setLoading(true);
    setVerses([]);
    verseRefs.current = {};
    preloadedUrlsRef.current.clear();

    const fetchFromAlquranCloud = async () => {
      const type = surah ? 'surah' : 'juz';
      const number = surah ? surah.number : juz!.number;
      
      const [arabicRes, englishRes, urduRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/${type}/${number}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/${type}/${number}/en.asad`),
        fetch(`https://api.alquran.cloud/v1/${type}/${number}/ur.jalandhry`)
      ]);
      const [arabic, english, urdu] = await Promise.all([arabicRes.json(), englishRes.json(), urduRes.json()]);

      if (arabic.code !== 200) throw new Error('Alquran.cloud API failed');
      
      const combined = arabic.data.ayahs.map((v, i) => ({ 
          ...v, 
          englishTranslation: english.data.ayahs[i]?.text || '', 
          urduTranslation: urdu.data.ayahs[i]?.text || '',
          ...(surah && { surah })
      }));
      return combined;
    };

    const fetchFromQuranCom = async () => {
        const fetchSurah = async (surahNumber) => {
            const [arabicRes, englishRes, urduRes] = await Promise.all([
                fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahNumber}`).then(res => res.json()),
                fetch(`https://api.quran.com/api/v4/quran/translations/21?chapter_number=${surahNumber}`).then(res => res.json()), // en.asad
                fetch(`https://api.quran.com/api/v4/quran/translations/85?chapter_number=${surahNumber}`).then(res => res.json()), // ur.jalandhry
            ]);

            const surahData = surahs.find(s => s.number === surahNumber);
            if (!surahData) throw new Error(`Surah data for ${surahNumber} not found`);

            const startVerse = surahStartVerseMap[surahNumber];
            return arabicRes.verses.map((v, i) => ({
                number: startVerse + i,
                numberInSurah: v.id,
                text: v.text_uthmani,
                englishTranslation: englishRes.translations[i]?.text || '',
                urduTranslation: urduRes.translations[i]?.text || '',
                surah: surahData,
            }));
        };

        if (surah) {
            return await fetchSurah(surah.number);
        }

        if (juz) {
            const boundary = juzBoundaries[juz.number - 1];
            if (!boundary) throw new Error("Juz boundary not found");
            const { start, end } = boundary;
            let allJuzVerses = [];

            for (let sNum = start.surah; sNum <= end.surah; sNum++) {
                const surahData = surahs.find(s => s.number === sNum);
                const surahVerses = await fetchSurah(sNum);
                
                const startAyah = (sNum === start.surah) ? start.ayah : 1;
                const endAyah = (sNum === end.surah) ? end.ayah : surahData.numberOfAyahs;

                const filteredVerses = surahVerses.filter(v => 
                    v.numberInSurah >= startAyah && v.numberInSurah <= endAyah
                );
                allJuzVerses.push(...filteredVerses);
            }
            return allJuzVerses;
        }
        
        throw new Error("Invalid parameters for fetchFromQuranCom");
    };
    
    try {
        const verseData = await fetchFromAlquranCloud();
        setVerses(verseData);
        return verseData;
    } catch (e) {
        console.error("Primary verse provider failed, trying fallback.", e);
        try {
            const verseData = await fetchFromQuranCom();
            setVerses(verseData);
            return verseData;
        } catch (e2) {
            console.error("All verse providers failed.", e2);
            return null;
        }
    } finally {
        setLoading(false);
    }
  }, [surahs, surahStartVerseMap, juzBoundaries]);


  // --- Audio Logic ---
  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
    }
    setPlaybackState({ surahNumber: null, currentVerseIndex: 0, currentVerseGlobal: null, status: 'stopped', loadingVerse: null, stage: 'arabic' });
    setPlaybackContext(null);
    preloadedUrlsRef.current.clear();
  }, []);
  
  useEffect(() => {
    const verseToPlay = verses[playbackState.currentVerseIndex];

    if (playbackState.status !== 'playing' || !verseToPlay) {
        if (audioRef.current && !audioRef.current.paused && audioRef.current.src) {
             try {
                audioRef.current.pause();
             } catch(e) {
                console.warn("Could not pause audio:", e)
             }
        }
        return;
    }
     // --- PRE-LOADING LOGIC ---
    const preloadUrls = [];
    const PRELOAD_COUNT = 3; 

    if (playbackState.stage === 'arabic' && settings.translationAudio !== 'none') {
        const translationUrl = `https://cdn.alquran.cloud/media/audio/ayah/${settings.translationAudio}/${verseToPlay.number}`;
        preloadUrls.push(translationUrl);
    }

    for (let i = 1; i <= PRELOAD_COUNT; i++) {
        const nextVerse = verses[playbackState.currentVerseIndex + i];
        if (!nextVerse) break;

        const arabicUrl = `https://cdn.alquran.cloud/media/audio/ayah/${settings.qari}/${nextVerse.number}`;
        preloadUrls.push(arabicUrl);

        if (settings.translationAudio !== 'none') {
            const translationUrl = `https://cdn.alquran.cloud/media/audio/ayah/${settings.translationAudio}/${nextVerse.number}`;
            preloadUrls.push(translationUrl);
        }
    }
    
    preloadUrls.forEach(url => {
        if (!preloadedUrlsRef.current.has(url)) {
            const audio = new Audio();
            audio.src = url;
            preloadedUrlsRef.current.add(url);
        }
    });
     // --- END PRE-LOADING ---

    const isTranslationStage = playbackState.stage === 'translation' && settings.translationAudio !== 'none';
    const audioIdentifier = isTranslationStage ? settings.translationAudio : settings.qari;
    const audioSrc = `https://cdn.alquran.cloud/media/audio/ayah/${audioIdentifier}/${verseToPlay.number}`;

    const playAudio = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        } else {
            audioRef.current.pause();
        }
        
        audioRef.current.src = audioSrc;
        setPlaybackState(prev => ({ ...prev, loadingVerse: verseToPlay.number, currentVerseGlobal: verseToPlay.number }));
        
        const currentSurah = surahs.find(s => s.number === verseToPlay.surah.number)
        if (currentSurah) {
            setLastRead({ surah: currentSurah, verseNumberInSurah: verseToPlay.numberInSurah });
        }

        audioRef.current.oncanplaythrough = () => {
            setPlaybackState(prev => ({ ...prev, loadingVerse: null }));
        };
        
        const advancePlayback = () => {
             if (playbackState.stage === 'arabic' && settings.translationAudio !== 'none') {
                setPlaybackState(prev => ({ ...prev, stage: 'translation' }));
            } else {
                const nextVerseIndex = playbackState.currentVerseIndex + 1;
                if (nextVerseIndex < verses.length) {
                    const nextVerse = verses[nextVerseIndex];
                    setPlaybackState(prev => ({ 
                        ...prev, 
                        currentVerseIndex: nextVerseIndex, 
                        stage: 'arabic',
                        surahNumber: nextVerse.surah.number,
                        currentVerseGlobal: nextVerse.number,
                    }));
                } else {
                    stopPlayback();
                }
            }
        };

        audioRef.current.onended = advancePlayback;
        
        audioRef.current.onerror = () => {
            console.error(`Failed to load audio for verse ${verseToPlay.number}, skipping.`);
            advancePlayback();
        };

        audioRef.current.play().catch(e => {
            if (e.name !== 'AbortError') console.error("Audio play failed:", e);
        });
    };

    if (audioRef.current?.src.endsWith(`${audioIdentifier}/${verseToPlay.number}`)) {
        if (audioRef.current.paused) {
            audioRef.current.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Audio play failed:", e);
            });
        }
    } else {
        playAudio();
    }
    
    verseRefs.current[verseToPlay.number]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  }, [playbackState.status, playbackState.currentVerseIndex, playbackState.stage, verses, settings.qari, settings.translationAudio, surahs, stopPlayback, setLastRead]);


  // --- Handlers ---
  
  const handleSurahSelect = (surah: Surah, options: { isNavigation?: boolean } = {}) => {
    if (!options.isNavigation) {
        stopPlayback();
        loadVerses({ surah });
    }
    setSelectedSurah(surah);
    setSelectedJuz(null);
    setActiveTab('surah');
  };
  
  const handleJuzSelect = (juz: Juz, options: { isNavigation?: boolean } = {}) => {
    if (!options.isNavigation) {
        stopPlayback();
        loadVerses({ juz });
    }
    setSelectedJuz(juz);
    setSelectedSurah(null);
    setActiveTab('juz');
  };

  const handleScrollComplete = useCallback(() => setScrollToVerse(null), []);

  const handlePlaySurah = async (surah) => {
    if (playbackState.surahNumber === surah.number && playbackContext?.type === 'surah' && (playbackContext.data as Surah).number === surah.number) {
        setPlaybackState(p => ({ ...p, status: p.status === 'playing' ? 'paused' : 'playing' }));
        return;
    }

    stopPlayback();
    setPlaybackContext({ type: 'surah', data: surah });
    
    const targetVerses = (verses.length > 0 && verses[0].surah.number === surah.number) 
        ? verses 
        : await loadVerses({ surah });
    
    if (targetVerses && targetVerses.length > 0) {
        setPlaybackState({ surahNumber: surah.number, currentVerseIndex: 0, status: 'playing', loadingVerse: null, currentVerseGlobal: targetVerses[0].number, stage: 'arabic' });
    }
  };

  const handlePlaySingleVerse = (verse: Verse) => {
    const verseIndex = verses.findIndex(v => v.number === verse.number);
    if (verseIndex === -1) return;
    
    if (playbackState.currentVerseGlobal === verse.number) {
        // Toggle play/pause for the currently selected verse
        setPlaybackState(p => ({...p, status: p.status === 'playing' ? 'paused' : 'playing' }));
    } else {
        // Set context before playing a new verse
        if(activeTab === 'surah' && selectedSurah) {
            setPlaybackContext({ type: 'surah', data: selectedSurah });
        } else if (activeTab === 'juz' && selectedJuz) {
            setPlaybackContext({ type: 'juz', data: selectedJuz });
        }
        
        setPlaybackState({
            surahNumber: verse.surah.number,
            currentVerseIndex: verseIndex,
            status: 'playing',
            loadingVerse: null,
            currentVerseGlobal: verse.number,
            stage: 'arabic'
        });
    }
  };
  
  const toggleBookmark = (verse: Verse) => {
    const id = `${verse.surah.number}-${verse.numberInSurah}`;
    setBookmarks(prev => 
      prev.some(b => b.id === id) 
      ? prev.filter(b => b.id !== id) 
      : [...prev, { id, surahName: verse.surah.name, surahNumber: verse.surah.number, surahEnglishName: verse.surah.englishName, verseNumber: verse.numberInSurah, verseData: verse }]
    );
  };
  
  const handleBookmarkSelect = (bookmark: Bookmark) => {
    const surah = surahs.find(s => s.number === bookmark.surahNumber);
    if (surah) {
        handleSurahSelect(surah);
        setScrollToVerse(bookmark.verseData.number);
    }
  };

  const handleContinueReading = () => {
      if (lastReadWithData && lastReadWithData.surah) {
          handleSurahSelect(lastReadWithData.surah);
          const surahNum = lastReadWithData.surah.number;
          if(surahStartVerseMap[surahNum]){
            const globalVerseNum = surahStartVerseMap[surahNum] + lastReadWithData.verseNumberInSurah - 1;
            setScrollToVerse(globalVerseNum);
          }
      }
  };

  const handleNavigateToPlayer = () => {
    if (!playbackContext || !playbackState.currentVerseGlobal) return;

    if (playbackContext.type === 'surah') {
        handleSurahSelect(playbackContext.data as Surah, { isNavigation: true });
    } else if (playbackContext.type === 'juz') {
        handleJuzSelect(playbackContext.data as Juz, { isNavigation: true });
    }
    
    setScrollToVerse(playbackState.currentVerseGlobal);
  };

  const lastReadWithData = useMemo(() => {
      if (!lastRead) return null;
      const surahData = surahs.find(s => s.number === (lastRead.surah?.number || lastRead.surahNumber));
      return surahData ? { ...lastRead, surah: surahData } : lastRead;
  }, [lastRead, surahs]);

  const playingSurah = playbackState.currentVerseGlobal ? surahs.find(s => s.number === playbackState.surahNumber) : null;

  const isPlayerUiVisible = useMemo(() => {
    if (!playingSurah || playbackState.status === 'stopped' || activeTab === 'settings') {
        return false;
    }
    if (playbackContext?.type === 'surah' && activeTab === 'surah' && selectedSurah?.number === (playbackContext.data as Surah).number) {
        return false;
    }
    if (playbackContext?.type === 'juz' && activeTab === 'juz' && selectedJuz?.number === (playbackContext.data as Juz).number) {
        return false;
    }
    return true;
  }, [activeTab, selectedSurah, selectedJuz, playingSurah, playbackState.status, playbackContext]);

  // --- Render Logic ---
  const renderContent = () => {
    if (loading && surahs.length === 0) return <div className="flex justify-center items-center h-screen"><LoadingSpinnerIcon/></div>;

    switch (activeTab) {
      case 'home': return <HomeScreen homeView={homeView} surahs={surahs} juzs={juzs} settings={settings} onSurahSelect={handleSurahSelect} onJuzSelect={handleJuzSelect} onPlaySurah={handlePlaySurah} playbackState={playbackState} lastRead={lastReadWithData} onContinueReading={handleContinueReading} />;
      case 'surah': return selectedSurah ? <SurahScreen loading={loading} surah={selectedSurah} verses={verses} settings={settings} onPlayVerse={handlePlaySingleVerse} onBookmark={toggleBookmark} bookmarks={bookmarks} playbackState={playbackState} verseRefs={verseRefs} scrollToVerse={scrollToVerse} onScrollComplete={handleScrollComplete} /> : null;
      case 'juz': return selectedJuz ? <JuzScreen loading={loading} juz={selectedJuz} verses={verses} settings={settings} onPlayVerse={handlePlaySingleVerse} onBookmark={toggleBookmark} bookmarks={bookmarks} playbackState={playbackState} verseRefs={verseRefs} scrollToVerse={scrollToVerse} onScrollComplete={handleScrollComplete} /> : null;
      case 'bookmarks': return <BookmarksScreen bookmarks={bookmarks} onBookmarkSelect={handleBookmarkSelect} settings={settings} />;
      case 'search': return <SearchScreen />;
      case 'settings': return <SettingsScreen settings={settings} onSettingChange={handleSettingChange} onReset={() => setShowResetConfirmModal(true)} />;
      default: return <HomeScreen homeView={homeView} surahs={surahs} juzs={juzs} settings={settings} onSurahSelect={handleSurahSelect} onJuzSelect={handleJuzSelect} onPlaySurah={handlePlaySurah} playbackState={playbackState} lastRead={lastReadWithData} onContinueReading={handleContinueReading} />;
    }
  };

  const getHeaderTitle = () => {
    if (activeTab === 'home') return 'Quran-e-Urdu';
    if (activeTab === 'settings') return 'Settings';
    if (activeTab === 'surah' && selectedSurah) return selectedSurah.englishName;
    if (activeTab === 'juz' && selectedJuz) return `Juz' ${selectedJuz.number}`;
    return 'Quran-e-Urdu';
  };
  
  return (
    <div className="app-container min-h-screen" data-theme={settings.theme}>
      <Header
        title={getHeaderTitle()}
        onBack={(activeTab === 'surah' || activeTab === 'juz') ? () => setActiveTab('home') : null}
        icon={activeTab === 'home' ? <BookIcon className="w-7 h-7 text-[var(--color-primary)]" /> : null}
      >
        {activeTab === 'home' && (
            <SegmentedControl 
                options={[{id: 'surahs', label: 'Surahs'}, {id: 'juz', label: "Juz'"}]}
                activeOption={homeView}
                onOptionClick={setHomeView}
            />
        )}
      </Header>
      <main className="pb-24">
        {renderContent()}
      </main>
      {isPlayerUiVisible &&
        <AudioMiniPlayer
          surah={playingSurah}
          status={playbackState.status}
          onTogglePlay={() => setPlaybackState(p => ({...p, status: p.status === 'playing' ? 'paused' : 'playing' }))}
          onNavigate={handleNavigateToPlayer}
        />
      }
       <ConfirmationModal
        isOpen={showResetConfirmModal}
        title="Reset Settings?"
        message="Are you sure you want to reset all settings to their default values? This action cannot be undone."
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirmModal(false)}
      />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<QuranApp />);