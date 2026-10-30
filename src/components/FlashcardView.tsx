import React, { useState, useEffect, useMemo } from 'react';
import { VocabWord, UserStats } from '../types';
import { translations, Language } from '../utils/i18n';
import {
  Volume2,
  Bookmark,
  CheckCircle2,
  RotateCw,
  Search,
  Play,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Info,
  ClipboardCheck,
  Trophy,
  Award,
  Sparkles
} from 'lucide-react';
import { speakText, playPop, playSuccessChime } from '../utils/audio';

const normalizeWord = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

interface FlashcardViewProps {
  vocabulary: VocabWord[];
  stats: UserStats;
  lang?: Language;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onToggleMastered: (id: string, mastered: boolean) => void;
  onToggleBookmark: (id: string) => void;
  onAddXP: (amount: number) => void;
  onOpenMockTest: (category: string) => void;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  vocabulary,
  stats,
  lang = 'vi',
  selectedCategory,
  onSelectCategory,
  onToggleMastered,
  onToggleBookmark,
  onAddXP,
  onOpenMockTest,
}) => {
  const t = translations[lang];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledWordIds, setShuffledWordIds] = useState<string[] | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [isTypedAnswerCorrect, setIsTypedAnswerCorrect] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unmastered' | 'mastered' | 'bookmarked'>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(vocabulary.map((w) => w.category)))];

  // Category labels in Vietnamese
  const getCategoryLabel = (cat: string) => {
    if (lang !== 'vi') return cat;
    switch (cat) {
      case 'All': return 'Tất cả';
      case 'Greetings': return 'Lời chào';
      case 'Food & Drink': return 'Ăn uống & Cà phê';
      case 'Routine': return 'Thói quen';
      case 'Travel': return 'Du lịch & Chỉ đường';
      case 'Family': return 'Gia đình';
      case 'Numbers': return 'Số đếm & Giờ';
      case 'Work & Study': return 'Công việc & Học tập';
      case 'Survival': return 'Khẩn cấp';
      case 'Machine Learning': return 'Học máy';
      default: return cat;
    }
  };

  // Cross-reference mastery and bookmarks by English word
  const masteredWordKeys = useMemo(() => {
    const masteredIds = new Set(stats.masteredWords);
    const keys = new Set<string>();
    for (const w of vocabulary) {
      if (masteredIds.has(w.id)) {
        keys.add(normalizeWord(w.english));
      }
    }
    return keys;
  }, [stats.masteredWords, vocabulary]);
  
  const bookmarkedWordKeys = useMemo(() => {
    const bookmarkedIds = new Set(stats.bookmarkedWords);
    const keys = new Set<string>();
    for (const w of vocabulary) {
      if (bookmarkedIds.has(w.id)) {
        keys.add(normalizeWord(w.english));
      }
    }
    return keys;
  }, [stats.bookmarkedWords, vocabulary]);
  
  // Filter words and deduplicate so each unique word appears only 1 time
  const filteredWords = useMemo(() => {
    const seenWords = new Set<string>();
    
    return vocabulary.filter((word) => {
      // Category match
      const matchesCat = selectedCategory === 'All' || word.category === selectedCategory;
      if (!matchesCat) return false;

      // Search query match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        word.english.toLowerCase().includes(query) ||
        word.translation.toLowerCase().includes(query);
      if (!matchesSearch) return false;

      // Status filter match
      const wordKey = normalizeWord(word.english);
      const isMastered = stats.masteredWords.includes(word.id) || masteredWordKeys.has(wordKey);
      const isBookmarked = stats.bookmarkedWords.includes(word.id) || bookmarkedWordKeys.has(wordKey);
      let matchesStatus = true;
      
      if (filterType === 'mastered') matchesStatus = isMastered;
      if (filterType === 'unmastered') matchesStatus = !isMastered;
      if (filterType === 'bookmarked') matchesStatus = isBookmarked;
      if (!matchesStatus) return false;
      
      // Ensure each word appears only 1 time in the flashcards
      if (seenWords.has(wordKey)) return false;
      seenWords.add(wordKey);
      
      return true;
    });
  }, [
    vocabulary,
    selectedCategory,
    searchQuery,
    filterType,
    stats.masteredWords,
    stats.bookmarkedWords,
    masteredWordKeys,
    bookmarkedWordKeys,
  ]);

  const wordOrder = new Map(shuffledWordIds?.map((id, index) => [id, index]));
  const orderedWords = shuffledWordIds
    ? [...filteredWords].sort(
        (a, b) => (wordOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (wordOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      )
    : filteredWords;

  // Safe index
  const activeWord = orderedWords[currentIndex] || orderedWords[0];

  const isCurrentWordMastered = activeWord
    ? stats.masteredWords.includes(activeWord.id) || masteredWordKeys.has(normalizeWord(activeWord.english))
    : false;
  const isCurrentWordBookmarked = activeWord
    ? stats.bookmarkedWords.includes(activeWord.id) || bookmarkedWordKeys.has(normalizeWord(activeWord.english))
    : false;

  
  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
    setShuffledWordIds(null);
    setIsFlipped(false);
    setTypedAnswer('');
    setHasCheckedAnswer(false);
    setIsTypedAnswerCorrect(false);
  }, [selectedCategory, filterType, searchQuery]);

  // Keyboard navigation: Space to flip, Arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (hasCheckedAnswer) setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, orderedWords.length, hasCheckedAnswer]);

  const handleNext = () => {
    playPop();
    setIsFlipped(false);
    setTypedAnswer('');
    setHasCheckedAnswer(false);
    setIsTypedAnswerCorrect(false);
    if (orderedWords.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % orderedWords.length);
    }
  };

  const handlePrev = () => {
    playPop();
    setIsFlipped(false);
    setTypedAnswer('');
    setHasCheckedAnswer(false);
    setIsTypedAnswerCorrect(false);
    if (orderedWords.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + orderedWords.length) % orderedWords.length);
    }
  };

  const handleShuffle = () => {
    playPop();
    if (orderedWords.length > 1) {
      const shuffledWords = [...orderedWords];
      for (let index = shuffledWords.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffledWords[index], shuffledWords[swapIndex]] = [shuffledWords[swapIndex], shuffledWords[index]];
      }
      if (shuffledWords.every((word, index) => word.id === orderedWords[index].id)) {
        shuffledWords.push(shuffledWords.shift()!);
      }
      setIsFlipped(false);
      setTypedAnswer('');
      setHasCheckedAnswer(false);
      setIsTypedAnswerCorrect(false);
      setShuffledWordIds(shuffledWords.map((word) => word.id));
      setCurrentIndex(0);
    }
  };

  const handleCheckTypedAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeWord || hasCheckedAnswer || !typedAnswer.trim()) return;
    const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const normalizedAnswer = normalize(typedAnswer);
    const expectedAnswer = normalize(activeWord.english);
    const answerWords: string[] = expectedAnswer.match(/[a-z0-9]+(?:['’][a-z0-9]+)*/g) ?? [];
    const typedWords: string[] = normalizedAnswer.match(/[a-z0-9]+(?:['’][a-z0-9]+)*/g) ?? [];
    const correct =
      normalizedAnswer === expectedAnswer ||
      (typedWords.length === 1 && answerWords.includes(typedWords[0]));
    setIsTypedAnswerCorrect(correct);
    setHasCheckedAnswer(true);
    if (correct) {
      playSuccessChime();
      if (!isCurrentWordMastered) {
        onToggleMastered(activeWord.id, true);
      }
    } else {
      playPop();
    }
  };

  const handlePlayWord = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeWord) return;
    setIsPlayingAudio(true);
    speakText(activeWord.english, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
      onEnd: () => setIsPlayingAudio(false),
    });
  };

  const handlePlaySentence = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeWord) return;
    speakText(activeWord.exampleSentence, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
    });
  };

  const handleMarkMastered = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeWord) return;
    const isCurrentlyMastered = isCurrentWordMastered;
    onToggleMastered(activeWord.id, !isCurrentlyMastered);

    if (!isCurrentlyMastered) {
      playSuccessChime();
      onAddXP(10);
      setTimeout(() => {
        handleNext();
      }, 300);
    } else {
      playPop();
    }
  };

  const isLastCard = orderedWords.length > 0 && currentIndex === orderedWords.length - 1;
  const targetCategoryForTest = selectedCategory !== 'All' ? selectedCategory : activeWord?.category || 'Greetings';
  const categoryTestResult = stats.categoryTests?.[targetCategoryForTest];

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto">
      {/* Category Pills & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shrink-0">
            {(['all', 'unmastered', 'mastered', 'bookmarked'] as const).map((type) => {
              const label =
                type === 'all'
                  ? t.filterAll
                  : type === 'unmastered'
                  ? t.filterLearning
                  : type === 'mastered'
                  ? t.filterMastered
                  : t.filterSaved;
              return (
                <button
                  key={type}
                  onClick={() => {
                    playPop();
                    setFilterType(type);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    filterType === type
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  playPop();
                  onSelectCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mock Test Evaluation Ribbon */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {t.ribbonTitle} {getCategoryLabel(targetCategoryForTest)}
              </span>
              {categoryTestResult?.passed && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {t.certifiedPass} ({categoryTestResult.percentage}%)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.ribbonDesc}
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenMockTest(targetCategoryForTest)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          <span>{categoryTestResult?.passed ? t.btnRetakeTest : t.btnTakeMockTest}</span>
        </button>
      </div>

      {orderedWords.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-8 space-y-3">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{t.noWordsFound}</h3>
          <p className="text-xs text-slate-500">{t.noWordsDesc}</p>
          <button
            onClick={() => {
              setSearchQuery('');
              onSelectCategory('All');
              setFilterType('all');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            {t.btnResetFilters}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card Meta & Control bar */}
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t.cardCount} {currentIndex + 1} {t.of} {orderedWords.length}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {getCategoryLabel(activeWord.category)}
                </span>
              </div>
            </div>
              
            <div className="flex items-center gap-2">
              {/* Autoplay Slideshow */}
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                title={t.autoplayUnavailable}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t.btnAutoplay}</span>
              </button>

              {/* Shuffle button */}
              <button
                onClick={handleShuffle}
                className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t.btnShuffleCards}
                title={t.btnShuffleCards}
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Flip Card Container */}
          <div
            onClick={() => {
              if (!hasCheckedAnswer) return;
              playPop();
              setIsFlipped(!isFlipped);
            }}
            className="perspective-1000 cursor-pointer w-full min-h-[380px] sm:min-h-[420px]"
          >
            <div
              className={`relative w-full h-full min-h-[380px] sm:min-h-[420px] transition-transform duration-500 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* FRONT SIDE */}
              <div className="absolute inset-0 backface-hidden w-full h-full rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-xl flex flex-col justify-between">
                {/* Top card bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {activeWord.partOfSpeech}
                    </span>
                    {isCurrentWordMastered && (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t.filterMastered}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playPop();
                      onToggleBookmark(activeWord.id);
                    }}
                    className={`p-2 rounded-xl transition ${
                      isCurrentWordBookmarked
                        ? 'text-pink-500 bg-pink-50 dark:bg-pink-950/50'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Lưu từ này để ôn sau"
                  >
                    <Bookmark
                      className={`w-5 h-5 ${
                      isCurrentWordBookmarked ? 'fill-pink-500' : ''  
                      }`}
                    />
                  </button>
                </div>

                {/* Center Word & IPA */}
                <div className="text-center my-auto space-y-4">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      {t.vietnameseMeaning}
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 mt-2">
                      {activeWord.translation}
                    </h2>
                  </div>

                  {!hasCheckedAnswer ? (
                    <form
                      onSubmit={handleCheckTypedAnswer}
                      onClick={(event) => event.stopPropagation()}
                      className="max-w-md mx-auto space-y-3 pt-2"
                    >
                      <input
                        autoFocus
                        autoComplete="off"
                        spellCheck={false}
                        aria-label={t.typeEnglishAnswer}
                        placeholder={t.typeEnglishAnswer}
                        value={typedAnswer}
                        onChange={(event) => setTypedAnswer(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-center text-base font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={!typedAnswer.trim()}
                        className="w-full px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition"
                      >
                        {t.btnCheckVocabAnswer}
                      </button>
                    </form>
                  ) : (
                    <div
                      className={`max-w-md mx-auto p-4 rounded-2xl border space-y-2 ${
                        isTypedAnswerCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                      }`}
                    >
                      <p className="font-bold">
                        {isTypedAnswerCorrect ? t.correctVocabAnswer : t.incorrectVocabAnswer}
                      </p>
                      <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {activeWord.english}
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-mono text-sm">{activeWord.phonetic}</span>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePlayWord();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                        >
                          <Volume2 className="w-4 h-4" />
                          {t.btnListen}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom flip hint */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>
                      {hasCheckedAnswer ? t.flipHint : t.submitAnswerToReveal}
                    </span>
                  </span>
                  <span className="text-[11px] font-medium hidden sm:inline">
                    {t.speechSpeed}: {stats.voiceSpeed.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* BACK SIDE */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-3xl border border-indigo-200 dark:border-indigo-950 bg-gradient-to-b from-white to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20 p-8 sm:p-10 shadow-xl flex flex-col justify-between">
                {/* Top header on back */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {t.vietnameseMeaning} & Ngữ cảnh
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFlipped(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Back content: Meaning and Example sentence */}
                <div className="space-y-5 my-auto">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {activeWord.english}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-sm">
                        {activeWord.phonetic}
                      </span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handlePlayWord();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{t.btnListen}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                      {t.vietnameseMeaning}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                      {activeWord.translation}
                    </h3>
                  </div>

                  {/* Example Sentence with Audio */}
                  <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                        &quot;{activeWord.exampleSentence}&quot;
                      </p>
                      <button
                        onClick={handlePlaySentence}
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 shrink-0"
                        title="Nghe phát âm cả câu mẫu"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      &rarr; {activeWord.exampleTranslation}
                    </p>
                  </div>

                  {/* Helpful Tip */}
                  {activeWord.tip && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                      <Info className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <p>
                        <span className="font-bold">{t.tipLabel} </span>
                        {activeWord.tip}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom mastery buttons on back */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMastered(activeWord.id, false);
                      handleNext();
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    {t.btnStillLearning}
                  </button>

                  <button
                    onClick={handleMarkMastered}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.btnGotIt}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* End of Category Evaluation Banner */}
          {isLastCard && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t.lastCardNotice}</span>
              </div>
              <button
                onClick={() => onOpenMockTest(targetCategoryForTest)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition shrink-0"
              >
                {t.btnCompileTestNow}
              </button>
            </div>
          )}

          {/* Navigation Controls: Prev, Flip, Next */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t.btnPrev}</span>
            </button>

            <button
              onClick={() => {
                if (!hasCheckedAnswer) return;
                playPop();
                setIsFlipped(!isFlipped);
              }}
              disabled={!hasCheckedAnswer}
              className="px-5 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {t.btnFlip}
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
            >
              <span>{t.btnNext}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
