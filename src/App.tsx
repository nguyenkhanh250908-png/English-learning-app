import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LearningPathView } from './components/LearningPathView';
import { FlashcardView } from './components/FlashcardView';
import { DialogueView } from './components/DialogueView';
import { QuizArenaView } from './components/QuizArenaView';
import { GrammarStudioView } from './components/GrammarStudioView';
import { SpeakingStudioView } from './components/SpeakingStudioView';
import { WordMatchingGame } from './components/WordMatchingGame';
import { DictionaryView } from './components/DictionaryView';
import { BookmarksModal } from './components/BookmarksModal';
import { CategoryMockTestModal } from './components/CategoryMockTestModal';
import { AuthModal } from './components/AuthModal';
import { VOCABULARY_LIST, MODULES } from './data/learningData';
import { UserStats, UserProfile, CategoryTestResult } from './types';
import { translations, Language } from './utils/i18n';
import {
  getCurrentSession,
  setCurrentSession,
  logoutUser,
  loadUserStats,
  saveUserStats,
} from './utils/auth';
import { playStreakFanfare, triggerCelebration, playPop } from './utils/audio';

const DARK_MODE_KEY = 'lingualeap_dark_mode';
const LANG_STORAGE_KEY = 'lingualeap_ui_lang';

export function App() {
  // Main UI Language State: Vietnamese ('vi') as default primary language!
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    return (saved as Language) || 'vi';
  });

  const t = translations[lang];

  // Authentication & Current User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getCurrentSession();
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // User Stats state (loaded for the specific active user)
  const [stats, setStats] = useState<UserStats>(() => {
    const user = getCurrentSession();
    return loadUserStats(user ? user.id : 'guest_initial');
  });

  // Active view navigation
  const [activeTab, setActiveTab] = useState<string>('path');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);

  // Category Mock Test Modal state
  const [mockTestState, setMockTestState] = useState<{
    isOpen: boolean;
    category: string;
    icon?: string;
  }>({
    isOpen: false,
    category: 'Greetings',
    icon: '👋',
  });

  // Sync language selection to localStorage
  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  // Sync dark mode class with root html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(darkMode));
  }, [darkMode]);

  // When user switches or logs in, load their stats
  useEffect(() => {
    if (currentUser) {
      const userStats = loadUserStats(currentUser.id);
      setStats(userStats);
    }
  }, [currentUser?.id]);

  // Persist current user stats whenever they change
  useEffect(() => {
    if (currentUser && stats.userId === currentUser.id) {
      saveUserStats(currentUser.id, stats);
    }
  }, [stats, currentUser?.id]);

  // Check and increment streak if daily visit
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = stats.lastActiveDate === yesterday;

      setStats((prev) => ({
        ...prev,
        streak: isConsecutive ? prev.streak + 1 : 1,
        lastActiveDate: today,
        dailyGoalCurrent: 0,
      }));
    }
  }, []);

  const addXP = (amount: number) => {
    setStats((prev) => {
      const newXP = prev.xp + amount;
      const prevLevel = Math.floor(prev.xp / 100);
      const newLevel = Math.floor(newXP / 100);

      // Level Up celebratory chime
      if (newLevel > prevLevel) {
        setTimeout(() => {
          playStreakFanfare();
          triggerCelebration();
        }, 200);
      }

      return {
        ...prev,
        xp: newXP,
        dailyGoalCurrent: Math.min(prev.dailyGoalCurrent + 1, prev.dailyGoalTarget),
      };
    });
  };

  const toggleMastered = (wordId: string, mastered: boolean) => {
    setStats((prev) => {
      const isAlreadyMastered = prev.masteredWords.includes(wordId);
      const isAlreadyLearned = prev.learnedWords.includes(wordId);

      let newMastered = [...prev.masteredWords];
      let newLearned = isAlreadyLearned ? prev.learnedWords : [...prev.learnedWords, wordId];

      if (mastered && !isAlreadyMastered) {
        newMastered.push(wordId);
      } else if (!mastered && isAlreadyMastered) {
        newMastered = newMastered.filter((id) => id !== wordId);
      }

      return {
        ...prev,
        masteredWords: newMastered,
        learnedWords: newLearned,
        dailyGoalCurrent: Math.min(prev.dailyGoalCurrent + 1, prev.dailyGoalTarget),
      };
    });
  };

  const toggleBookmark = (wordId: string) => {
    setStats((prev) => {
      const isBookmarked = prev.bookmarkedWords.includes(wordId);
      const newBookmarks = isBookmarked
        ? prev.bookmarkedWords.filter((id) => id !== wordId)
        : [...prev.bookmarkedWords, wordId];
      return {
        ...prev,
        bookmarkedWords: newBookmarks,
      };
    });
  };

  const toggleLang = () => {
    playPop();
    setLang((prev) => (prev === 'vi' ? 'en' : 'vi'));
  };

  const setVoiceSpeed = (voiceSpeed: number) => {
    setStats((prev) => ({
      ...prev,
      voiceSpeed: Math.min(1.5, Math.max(0.75, voiceSpeed)),
    }));
  };

  const toggleAccent = () => {
    setStats((prev) => ({
      ...prev,
      voiceAccent: prev.voiceAccent === 'en-US' ? 'en-GB' : 'en-US',
    }));
  };

  const handleStudyBookmarks = () => {
    setSelectedCategory('All');
    setActiveTab('flashcards');
  };

  const handleOpenMockTest = (category: string, icon?: string) => {
    const matchedModule = MODULES.find((m) => m.category === category);
    setMockTestState({
      isOpen: true,
      category,
      icon: icon || matchedModule?.icon || '📝',
    });
  };

  const handleSaveCategoryTestResult = (result: CategoryTestResult) => {
    setStats((prev) => {
      const updatedTests = {
        ...(prev.categoryTests || {}),
        [result.category]: result,
      };

      return {
        ...prev,
        categoryTests: updatedTests,
        completedQuizzes: prev.completedQuizzes + 1,
      };
    });

    if (result.passed) {
      addXP(40);
    } else {
      addXP(10);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentSession(user);
    const loaded = loadUserStats(user.id);
    setStats(loaded);
  };

  const handleLogout = () => {
    playPop();
    logoutUser();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top sticky Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
        currentUser={currentUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        lang={lang}
        onToggleLang={toggleLang}
        onVoiceSpeedChange={setVoiceSpeed}
        onToggleAccent={toggleAccent}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'path' && (
          <LearningPathView
            stats={stats}
            vocabulary={VOCABULARY_LIST}
            lang={lang}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setActiveTab('flashcards');
            }}
            onNavigateTab={setActiveTab}
            onOpenMockTest={handleOpenMockTest}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardView
            vocabulary={VOCABULARY_LIST}
            stats={stats}
            lang={lang}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onToggleMastered={toggleMastered}
            onToggleBookmark={toggleBookmark}
            onAddXP={addXP}
            onOpenMockTest={handleOpenMockTest}
          />
        )}

        {activeTab === 'matching' && (
          <WordMatchingGame
            vocabulary={VOCABULARY_LIST}
            stats={stats}
            lang={lang}
            onAddXP={addXP}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'dialogue' && (
          <DialogueView stats={stats} lang={lang} onAddXP={addXP} />
        )}

        {activeTab === 'quiz' && (
          <QuizArenaView vocabulary={VOCABULARY_LIST} stats={stats} lang={lang} onAddXP={addXP} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'grammar' && (
          <GrammarStudioView stats={stats} lang={lang} onAddXP={addXP} />
        )}

        {activeTab === 'speaking' && (
          <SpeakingStudioView stats={stats} lang={lang} onAddXP={addXP} />
        )}

        {activeTab === 'dictionary' && (
          <DictionaryView vocabulary={VOCABULARY_LIST} lang={lang} />
        )}
      </main>

      {/* Auth Modal (Login / Register / Guest) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        currentUser={currentUser}
        lang={lang}
      />

      {/* Category Mock Test Evaluation Modal */}
      <CategoryMockTestModal
        isOpen={mockTestState.isOpen}
        onClose={() => setMockTestState((prev) => ({ ...prev, isOpen: false }))}
        category={mockTestState.category}
        categoryIcon={mockTestState.icon}
        vocabulary={VOCABULARY_LIST}
        stats={stats}
        lang={lang}
        onSaveResult={handleSaveCategoryTestResult}
        onStudyCategoryInFlashcards={(cat) => {
          setSelectedCategory(cat);
          setActiveTab('flashcards');
        }}
      />

      {/* Bookmarks Modal */}
      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        vocabulary={VOCABULARY_LIST}
        stats={stats}
        lang={lang}
        onToggleBookmark={toggleBookmark}
        onStudyBookmarks={handleStudyBookmarks}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <p>
          {t.footerText}
        </p>
      </footer>
    </div>
  );
}

export default App;
