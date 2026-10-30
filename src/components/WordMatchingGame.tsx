import React, { useState, useEffect } from 'react';
import { VocabWord, UserStats } from '../types';
import { translations, Language } from '../utils/i18n';
import {
  GripVertical,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight
} from 'lucide-react';
import {
  speakText,
  playPop,
  playSuccessChime,
  playErrorBuzz,
  triggerCelebration,
  playStreakFanfare
} from '../utils/audio';

interface WordMatchingGameProps {
  vocabulary: VocabWord[];
  stats: UserStats;
  lang?: Language;
  onAddXP: (amount: number) => void;
  onNavigateTab: (tab: string) => void;
}

interface MatchPair {
  id: string;
  english: string;
  phonetic: string;
  translation: string;
  category: string;
}

export const WordMatchingGame: React.FC<WordMatchingGameProps> = ({
  vocabulary,
  stats,
  lang = 'vi',
  onAddXP,
  onNavigateTab,
}) => {
  const t = translations[lang];

  const categories = ['All', ...Array.from(new Set(vocabulary.map((w) => w.category)))];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // 5 pairs for the round
  const [pairs, setPairs] = useState<MatchPair[]>([]);
  // Shuffled right-side definition slots
  const [slots, setSlots] = useState<MatchPair[]>([]);
  // Track placed slotId -> wordId and pairs confirmed correct by the user
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [correctMatches, setCorrectMatches] = useState<Record<string, string>>({});
  const [hasCheckedPlacements, setHasCheckedPlacements] = useState(false);
  // Dragging state
  const [draggedWordId, setDraggedWordId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  // Click-to-match fallback state
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Setup round
  const setupRound = (cat: string) => {
    const pool = cat === 'All' ? vocabulary : vocabulary.filter((w) => w.category === cat);
    if (pool.length === 0) return;

    // Pick 5 random words
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffledPool.slice(0, 5).map((w) => ({
      id: w.id,
      english: w.english,
      phonetic: w.phonetic,
      translation: w.translation,
      category: w.category,
    }));

    setPairs(selected);
    // Shuffle slots on the right
    setSlots([...selected].sort(() => 0.5 - Math.random()));
    setPlacements({});
    setCorrectMatches({});
    setHasCheckedPlacements(false);
    setDraggedWordId(null);
    setDragOverSlotId(null);
    setSelectedWordId(null);
    setIsCompleted(false);
  };

  useEffect(() => {
    setupRound(selectedCategory);
  }, [selectedCategory, vocabulary]);

  const handlePlayWord = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    playPop();
    speakText(word, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, wordId: string) => {
    playPop();
    setDraggedWordId(wordId);
    e.dataTransfer.setData('text/plain', wordId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedWordId(null);
    setDragOverSlotId(null);
  };

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleDragLeave = (slotId: string) => {
    if (dragOverSlotId === slotId) {
      setDragOverSlotId(null);
    }
  };

  const placeWord = (wordId: string, slotId: string) => {
    if (correctMatches[slotId] || Object.values(correctMatches).includes(wordId)) return;
    const updatedPlacements = Object.fromEntries(
      Object.entries(placements).filter(([placedSlotId, placedWordId]) =>
        placedSlotId !== slotId && placedWordId !== wordId && !correctMatches[placedSlotId],
      ),
    );
    setPlacements({ ...updatedPlacements, [slotId]: wordId });
    setHasCheckedPlacements(false);
    setDraggedWordId(null);
    setDragOverSlotId(null);
    setSelectedWordId(null);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const droppedWordId = e.dataTransfer.getData('text/plain') || draggedWordId;
    if (droppedWordId) {
      placeWord(droppedWordId, slotId);
    }
  };

  // Click-to-pair fallback
  const handleClickWord = (wordId: string) => {
    if (Object.values(correctMatches).includes(wordId)) return;
    playPop();
    if (selectedWordId === wordId) {
      setSelectedWordId(null);
    } else {
      setSelectedWordId(wordId);
    }
  };

  const handleClickSlot = (slotId: string) => {
    if (correctMatches[slotId]) return;
    if (selectedWordId) {
      placeWord(selectedWordId, slotId);
    }
  };

  const handleCheckPlacements = () => {
    const newlyCorrectMatches = Object.fromEntries(
      Object.entries(placements).filter(([slotId, wordId]) => slotId === wordId),
    );
    const newlyCorrectCount = Object.keys(newlyCorrectMatches).filter(
      (slotId) => !correctMatches[slotId],
    ).length;
    const updatedCorrectMatches = { ...correctMatches, ...newlyCorrectMatches };

    setCorrectMatches(updatedCorrectMatches);
    setHasCheckedPlacements(true);
    if (newlyCorrectCount > 0) {
      playSuccessChime();
      onAddXP(newlyCorrectCount * 5);
    } else {
      playErrorBuzz();
    }

    if (Object.keys(updatedCorrectMatches).length === pairs.length) {
      setIsCompleted(true);
      setTimeout(() => {
        playStreakFanfare();
        triggerCelebration();
        onAddXP(25);
      }, 300);
    }
  };

  const matchedCount = Object.keys(correctMatches).length;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t.matchingTitle}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              Drag & Drop
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.matchingSubtitle}
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playPop();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {cat === 'All' ? (lang === 'vi' ? 'Tất cả' : 'All') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Progress & Quick Stats */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t.matchingInstruction}</span>
        </span>
        <span className="text-indigo-600 dark:text-indigo-400">
          {t.matchedCountLabel}: {matchedCount} / {pairs.length}
        </span>
      </div>

      {/* Main Drag and Drop Playground */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: English Draggable Tiles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            <span>Tiếng Anh (Kéo từ này)</span>
            <span>Nghe phát âm</span>
          </div>

          <div className="space-y-3">
            {pairs.map((item) => {
              const isMatched = Object.values(correctMatches).includes(item.id);
              const isSelected = selectedWordId === item.id;
              const isDragging = draggedWordId === item.id;

              return (
                <div
                  key={item.id}
                  draggable={!isMatched}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleClickWord(item.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between select-none ${
                    isMatched
                      ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/60 opacity-40 cursor-not-allowed'
                      : isDragging
                      ? 'opacity-40 border-indigo-400 scale-95 shadow-inner'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-md ring-2 ring-indigo-400 cursor-grab active:cursor-grabbing'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className={`w-4 h-4 shrink-0 ${isMatched ? 'text-slate-300' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-extrabold text-base text-slate-900 dark:text-white">
                        {item.english}
                      </p>
                      <p className="text-xs font-mono text-slate-400">
                        {item.phonetic}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handlePlayWord(e, item.english)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Vietnamese Target Drop Slots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            <span>Nghĩa tiếng Việt (Thả vào đây)</span>
            <span>Trạng thái</span>
          </div>

          <div className="space-y-3">
            {slots.map((slot) => {
              const matchedWordId = placements[slot.id];
              const isMatched = !!correctMatches[slot.id];
              const isIncorrect = hasCheckedPlacements && !!matchedWordId && !isMatched;
              const matchedWord = pairs.find((p) => p.id === matchedWordId);
              const isHovered = dragOverSlotId === slot.id;

              return (
                <div
                  key={slot.id}
                  onDragOver={(e) => handleDragOver(e, slot.id)}
                  onDragLeave={() => handleDragLeave(slot.id)}
                  onDrop={(e) => handleDrop(e, slot.id)}
                  onClick={() => handleClickSlot(slot.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between min-h-[72px] ${
                    isMatched
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 shadow-sm'
                      : isIncorrect
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 shadow-sm'
                      : isHovered
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-600 border-dashed ring-4 ring-indigo-400/30 scale-102'
                      : selectedWordId
                      ? 'bg-white dark:bg-slate-900 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-500 cursor-pointer shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400">
                      Nghĩa tương ứng:
                    </span>
                    <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                      {slot.translation}
                    </p>

                   {matchedWord && (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold mt-1 ${
                        isIncorrect
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-emerald-700 dark:text-emerald-300'
                      }`}>
                        &rarr; {matchedWord.english} ({matchedWord.phonetic})
                      </span>
                    )}
                  </div>

                  <div className="shrink-0">
                    {isMatched ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-in zoom-in" />
                    ) : isIncorrect ? (
                      <XCircle className="w-6 h-6 text-rose-500 animate-in zoom-in" />
                    ) : isHovered ? (
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
                        Thả tại đây
                      </span>
                    ) : selectedWordId ? (
                      <span className="text-xs text-indigo-500 font-semibold">
                        Nhấn để ghép
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Ô trống
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!isCompleted && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              playPop();
              handleCheckPlacements();
            }}
            disabled={Object.keys(placements).length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.btnCheckAnswer}</span>
          </button>
        </div>
      )}
      
      {/* Completion Modal / Card */}
      {isCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/70 dark:via-teal-950/60 dark:to-indigo-950/70 border border-emerald-300 dark:border-emerald-800 text-center space-y-4 shadow-xl animate-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-emerald-500/30">
            🏆
          </div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {t.matchingSuccessHeading}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {t.matchingSuccessDesc}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                playPop();
                setupRound(selectedCategory);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.btnPlayAgain}</span>
            </button>

            <button
              onClick={() => onNavigateTab('quiz')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>{t.tabQuiz}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
