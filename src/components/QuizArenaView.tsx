import React, { useState } from 'react';
import { QuizQuestion, UserStats, VocabWord } from '../types';
import { translations, Language } from '../utils/i18n';
import { compileQuizArena } from '../utils/quizArenaCompiler';
import {
  Volume2,
  Heart,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import {
  speakText,
  playPop,
  playSuccessChime,
  playErrorBuzz,
  triggerCelebration
} from '../utils/audio';

const MAX_LIVES = 5;

interface QuizArenaViewProps {
  vocabulary: VocabWord[];
  stats: UserStats;
  lang?: Language;
  onAddXP: (amount: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const QuizArenaView: React.FC<QuizArenaViewProps> = ({
  vocabulary,
  stats,
  lang = 'vi',
  onAddXP,
  onNavigateTab,
}) => {
  const t = translations[lang];

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => compileQuizArena(vocabulary));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [scramblePicks, setScramblePicks] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [isCompleted, setIsCompleted] = useState(false);

  const question: QuizQuestion = questions[currentIdx] || questions[0];

  const handlePlayAudio = (text?: string) => {
    playPop();
    const toSpeak = text || question.audioText || question.prompt;
    speakText(toSpeak, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
    });
  };

  const handleSelectMCQ = (optionIndex: number) => {
    if (isAnswered) return;
    playPop();
    setSelectedOption(optionIndex);
  };

  const [isDraggingOverSlot, setIsDraggingOverSlot] = useState(false);
  const [draggedScrambleWord, setDraggedScrambleWord] = useState<string | null>(null);

  const handlePickScrambleWord = (word: string) => {
    if (isAnswered) return;
    playPop();
    setScramblePicks((prev) => [...prev, word]);
  };

  const handleRemoveScrambleWord = (wordIndex: number) => {
    if (isAnswered) return;
    playPop();
    setScramblePicks((prev) => prev.filter((_, idx) => idx !== wordIndex));
  };

  const handleScrambleDragStart = (e: React.DragEvent, word: string) => {
    if (isAnswered) return;
    playPop();
    setDraggedScrambleWord(word);
    e.dataTransfer.setData('text/plain', word);
  };

  const handleScrambleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverSlot(false);
    const word = e.dataTransfer.getData('text/plain') || draggedScrambleWord;
    if (word && !isAnswered) {
      handlePickScrambleWord(word);
    }
  };

  const handleCheckAnswer = () => {
    if (isAnswered) return;

    let correct = false;

    if (question.type === 'mcq' || question.type === 'listening' || question.type === 'fill-blank') {
      if (selectedOption === null) return;
      correct = selectedOption === question.answer;
    } else if (question.type === 'scramble') {
      const builtSentence = scramblePicks.join(' ').trim();
      correct = builtSentence.toLowerCase() === (question.answer as string).toLowerCase();
    }

    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      playSuccessChime();
      setScore((prev) => prev + 1);
      onAddXP(15);
    } else {
      playErrorBuzz();
      setLives((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    playPop();
    if (currentIdx < questions.length - 1 && lives > 0) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setScramblePicks([]);
      setIsAnswered(false);
      setIsCorrect(false);
    } else {
      setIsCompleted(true);
      triggerCelebration();
      onAddXP(30);
    }
  };

  const handleRestart = () => {
    playPop();
    setQuestions(compileQuizArena(vocabulary));
    setCurrentIdx(0);
    setSelectedOption(null);
    setScramblePicks([]);
    setIsAnswered(false);
    setIsCorrect(false);
    setScore(0);
    setLives(MAX_LIVES);
    setIsCompleted(false);
  };

  // Completion Screen
  if (isCompleted || lives === 0) {
    const accuracy = Math.round((score / questions.length) * 100);
    const passed = lives > 0 && accuracy >= 60;

    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-400 to-orange-500 mx-auto flex items-center justify-center text-5xl shadow-xl shadow-amber-500/25">
            {passed ? '🏆' : '💪'}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {passed ? t.quizPassedHeading : t.quizRetryHeading}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {passed ? t.quizPassedDesc : t.quizRetryDesc}
          </p>
        </div>

        {/* Score & Accuracy metrics */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-2">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t.labelScore}</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {score} / {questions.length}
            </p>
          </div>
          <div className="p-2 border-x border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t.labelAccuracy}</span>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {accuracy}%
            </p>
          </div>
          <div className="p-2">
            <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t.labelXpEarned}</span>
            <p className="text-2xl font-black text-amber-500 mt-0.5">
              +{score * 15 + (passed ? 30 : 10)} XP
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.btnPlayQuizAgain}</span>
          </button>
          <button
            onClick={() => onNavigateTab('flashcards')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            <span>{t.btnReviewFlashcards}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Calculate available scramble words
  const remainingScrambleWords = question.wordsToScramble
    ? question.wordsToScramble.filter((w, idx) => {
        const totalInPicks = scramblePicks.filter((item) => item === w).length;
        const countBeforeThisIdx = question.wordsToScramble!.slice(0, idx + 1).filter((item) => item === w).length;
        return countBeforeThisIdx > totalInPicks;
      })
    : [];

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      {/* Top Header: Progress bar & Hearts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {lang === 'vi' ? 'Câu hỏi' : 'Question'} {currentIdx + 1} / {questions.length}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              {question.category}
            </span>
          </div>

          {/* Hearts / Lives */}
          <div className="flex items-center gap-1.5" title="Số mạng còn lại">
            {Array.from({ length: MAX_LIVES }, (_, index) => index + 1).map((heart) => (
              <Heart
                key={heart}
                className={`w-5 h-5 transition-transform duration-300 ${
                  heart <= lives
                    ? 'text-rose-500 fill-rose-500 scale-100'
                    : 'text-slate-300 dark:text-slate-700 scale-90'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Prompt */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {question.prompt}
            </h3>

            {/* Audio Button for Question */}
            {question.audioText && (
              <button
                onClick={() => handlePlayAudio(question.audioText)}
                className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 shrink-0 shadow-sm transition active:scale-95"
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Visual indicator for Listening type */}
          {question.type === 'listening' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center gap-3">
              <button
                onClick={() => handlePlayAudio(question.audioText)}
                className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30 transition transform hover:scale-105 active:scale-95"
              >
                <Volume2 className="w-6 h-6" />
              </button>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">{t.tapSpeakerToHear}</p>
                <p>{t.tapSpeakerDesc}</p>
              </div>
            </div>
          )}
        </div>

        {/* Options for MCQ / Listening / Fill-in-the-blank */}
        {(question.type === 'mcq' || question.type === 'listening' || question.type === 'fill-blank') && question.options && (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOption = idx === question.answer;

              let style = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-indigo-400';

              if (isAnswered) {
                if (isCorrectOption) {
                  style = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                } else if (isSelected && !isCorrectOption) {
                  style = 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-800 dark:text-rose-200';
                }
              } else if (isSelected) {
                style = 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectMCQ(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between text-sm sm:text-base ${style}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Sentence Scramble Puzzle */}
        {question.type === 'scramble' && question.wordsToScramble && (
          <div className="space-y-6">
            {/* Answer construction box (Drop target) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingOverSlot(true);
              }}
              onDragLeave={() => setIsDraggingOverSlot(false)}
              onDrop={handleScrambleDrop}
              className={`min-h-[70px] p-4 rounded-2xl border-2 border-dashed flex flex-wrap gap-2 items-center transition-all ${
                isDraggingOverSlot
                  ? 'border-indigo-600 bg-indigo-100/50 dark:bg-indigo-900/40 ring-4 ring-indigo-400/20'
                  : 'border-indigo-300 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30'
              }`}
            >
              {scramblePicks.length === 0 ? (
                <span className="text-xs text-indigo-400 italic">
                  {lang === 'vi' ? 'Kéo thả hoặc nhấn vào các từ bên dưới để ghép thành câu...' : 'Drag & drop or tap words below to form sentence...'}
                </span>
              ) : (
                scramblePicks.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRemoveScrambleWord(idx)}
                    disabled={isAnswered}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-rose-600 transition"
                    title={lang === 'vi' ? 'Nhấn để gỡ từ' : 'Click to remove'}
                  >
                    {word}
                  </button>
                ))
              )}
            </div>

            {/* Available Word Tiles (Draggable) */}
            <div className="flex flex-wrap gap-2 justify-center">
              {remainingScrambleWords.map((word, idx) => (
                <button
                  key={idx}
                  draggable={!isAnswered}
                  onDragStart={(e) => handleScrambleDragStart(e, word)}
                  onClick={() => handlePickScrambleWord(word)}
                  disabled={isAnswered}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-sm hover:border-indigo-500 transition active:scale-95 cursor-grab active:cursor-grabbing"
                >
                  {word}
                </button>
              ))}
            </div>

            {scramblePicks.length > 0 && !isAnswered && (
              <div className="text-right">
                <button
                  onClick={() => setScramblePicks([])}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  {t.btnClearTiles}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Explanation Banner when answered */}
        {isAnswered && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 animate-in fade-in duration-300 ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'vi' ? 'Chính xác! (+15 XP)' : 'Spot on! (+15 XP)'}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>{lang === 'vi' ? 'Chưa đúng! Trừ 1 trái tim' : 'Not quite! -1 Heart'}</span>
                </>
              )}
            </div>
            <p className="leading-relaxed">{question.explanation}</p>
          </div>
        )}

        {/* Submit or Continue Button */}
        <div className="pt-2">
          {!isAnswered ? (
            <button
              onClick={handleCheckAnswer}
              disabled={
                (question.type !== 'scramble' && selectedOption === null) ||
                (question.type === 'scramble' && scramblePicks.length === 0)
              }
              className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition active:scale-98"
            >
              {t.btnCheckAnswer}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>{currentIdx < questions.length - 1 ? t.btnNextQuestion : t.btnViewResults}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
