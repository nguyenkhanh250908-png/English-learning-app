import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Zap,
  Volume2,
  Sun,
  Moon,
  Compass,
  Layers,
  MessageSquare,
  Sparkles,
  BookOpen,
  Mic,
  Bookmark,
  User,
  LogOut,
  ChevronDown,
  UserPlus,
  Languages,
  Puzzle,
  Library
} from 'lucide-react';
import { UserStats, UserProfile } from '../types';
import { translations, Language } from '../utils/i18n';
import { playPop } from '../utils/audio';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: UserStats;
  currentUser: UserProfile | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  lang: Language;
  onToggleLang: () => void;
  onVoiceSpeedChange: (speed: number) => void;
  onToggleAccent: () => void;
  onOpenBookmarks: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  stats,
  currentUser,
  darkMode,
  setDarkMode,
  lang,
  onToggleLang,
  onVoiceSpeedChange,
  onToggleAccent,
  onOpenBookmarks,
  onOpenAuth,
  onLogout,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [featuresExpanded, setFeaturesExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const featuresMenuRef = useRef<HTMLDivElement>(null);

  const t = translations[lang];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (featuresMenuRef.current && !featuresMenuRef.current.contains(e.target as Node)) {
        setFeaturesExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  // Calculate Level tier based on XP
  const level = Math.floor(stats.xp / 100) + 1;
  const levelTitle =
    level === 1
      ? 'Khởi đầu (A1)'
      : level === 2
      ? 'Sơ cấp (A2)'
      : level === 3
      ? 'Trung cấp (B1)'
      : level === 4
      ? 'Trung cao cấp (B2)'
      : 'Thành thạo (C1+)';

  const navItems = [
    { id: 'path', label: t.tabRoadmap, shortLabel: t.tabRoadmap, icon: Compass },
    { id: 'flashcards', label: t.tabFlashcards, shortLabel: lang === 'vi' ? 'Thẻ từ' : 'Cards', icon: Layers },
    { id: 'matching', label: lang === 'vi' ? 'Ghép từ' : 'Match Pairs', shortLabel: lang === 'vi' ? 'Ghép từ' : 'Match', icon: Puzzle },
    { id: 'dialogue', label: t.tabDialogue, shortLabel: t.tabDialogue, icon: MessageSquare },
    { id: 'quiz', label: lang === 'vi' ? 'Đấu trường Quiz' : 'Quiz Arena', shortLabel: 'Quiz', icon: Sparkles },
    { id: 'grammar', label: t.tabGrammar, shortLabel: t.tabGrammar, icon: BookOpen },
    { id: 'speaking', label: lang === 'vi' ? 'Luyện phát âm' : 'Speaking', shortLabel: lang === 'vi' ? 'Phát âm' : 'Speaking', icon: Mic },
    { id: 'dictionary', label: t.tabDictionary, shortLabel: t.tabDictionary, icon: Library },
  ];

  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 gap-3">
          {/* Left: Logo & Features Bar */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
              onClick={() => setActiveTab('path')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                    {t.appTitle}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {t.beginnerBadge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden 2xl:block">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Desktop Navigation - Click to Extend / Click again to Close Features Bar */}
            <div
              ref={featuresMenuRef}
              className="hidden lg:block relative z-30"
            >
              {/* Collapsed Pill Button */}
              <button
                type="button"
                onClick={() => {
                  playPop();
                  setFeaturesExpanded((prev) => !prev);
                }}
                aria-expanded={featuresExpanded}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border transition-all duration-200 text-xs font-bold shadow-sm ${
                  featuresExpanded
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/25 ring-2 ring-indigo-500/20'
                    : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-750'
                }`}
                title={lang === 'vi' ? 'Nhấn để mở / đóng thanh tính năng' : 'Click to open / close feature bar'}
              >
                <ActiveIcon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${featuresExpanded ? 'scale-110 text-white' : 'text-indigo-500'}`} />
                <span className="font-bold tracking-tight whitespace-nowrap">{activeItem.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider whitespace-nowrap ${
                  featuresExpanded
                    ? 'bg-indigo-700 text-indigo-100'
                    : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50'
                }`}>
                  {lang === 'vi' ? 'Tính năng' : 'Features'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${
                    featuresExpanded ? 'rotate-180 text-white' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Extended Features Bar */}
              {featuresExpanded && (
                <div
                  className="absolute top-full pt-2 left-0 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                >
                  <nav className="flex items-center gap-1.5 p-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-indigo-500/15 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            playPop();
                            setActiveTab(item.id);
                            setFeaturesExpanded(false);
                          }}
                          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-500 dark:text-indigo-400'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}
            </div>
          </div>

          {/* Right Controls & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto z-10 shrink-0">
            {/* Daily Streak */}
            <div
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold shrink-0"
              title="Chuỗi ngày học liên tục"
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce shrink-0" />
              <span>{stats.streak} <span className="hidden sm:inline">{t.days}</span></span>
            </div>

            {/* XP & Level Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold shrink-0"
              title={`${stats.xp} XP - Cấp ${level}: ${levelTitle}`}
            >
              <Zap className="w-4 h-4 text-indigo-500 fill-indigo-500 shrink-0" />
              <span>{stats.xp} XP</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-200/60 dark:bg-indigo-800/60 hidden 2xl:inline">
                Lv.{level}
              </span>
            </div>

            {/* Bookmark Drawer Trigger */}
            <button
              onClick={onOpenBookmarks}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              title={t.savedWords}
            >
              <Bookmark className="w-4 h-4 shrink-0" />
              {stats.bookmarkedWords.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center pointer-events-none shrink-0">
                  {stats.bookmarkedWords.length}
                </span>
              )}
            </button>

            {/* Select a speech playback speed */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <Volume2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <label htmlFor="speech-speed" className="sr-only">{t.speechSpeed}</label>
              <input
                id="speech-speed"
                type="range"
                min="0.75"
                max="1.5"
                step="0.25"
                value={stats.voiceSpeed}
                onChange={(event) => onVoiceSpeedChange(Number(event.target.value))}
                aria-label={t.speechSpeed}
                aria-valuetext={`${stats.voiceSpeed.toFixed(2)}x`}
                title={t.speechSpeedControlHint}
                className="w-16 sm:w-20 accent-indigo-600 cursor-pointer"
              />
              <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {Number(stats.voiceSpeed.toFixed(2))}x
              </span>
            </div>

            {/* Language Switcher: VN (Default) vs EN */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition shrink-0"
              title="Đổi ngôn ngữ giao diện (Tiếng Việt / English)"
            >
              <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{lang === 'vi' ? '🇻🇳 VIE' : '🇬🇧 ENG'}</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
              title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* User Profile & Authentication Pill */}
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => {
                    playPop();
                    setProfileDropdownOpen(!profileDropdownOpen);
                  }}
                  className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
                  title={t.myProfile}
                >
                  <span className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-sm shadow-sm">
                    {currentUser.avatar || '🚀'}
                  </span>
                  <span className="hidden md:inline max-w-[90px] truncate text-slate-800 dark:text-slate-100">
                    {currentUser.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-xl flex items-center justify-center">
                        {currentUser.avatar || '🚀'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{t.targetLevel}:</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          Level {currentUser.targetLevel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{t.supportLang}:</span>
                        <span className="font-semibold">{currentUser.nativeLanguage}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{t.totalXp}:</span>
                        <span className="font-bold text-amber-500">{stats.xp} XP</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAuth();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t.switchAccount}</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.logOut}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  playPop();
                  onOpenAuth();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.logIn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-100 dark:border-slate-800 no-scrollbar justify-start sm:justify-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
