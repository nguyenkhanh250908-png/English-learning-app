import React, { useState, useEffect } from 'react';
import { VocabWord, QuizQuestion, UserStats, CategoryTestResult } from '../types';
import { compileCategoryMockTest } from '../utils/mockTestCompiler';
import { translations, Language } from '../utils/i18n';
import {
  X,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Award,
  Layers,
  ClipboardCheck
} from 'lucide-react';
import {
  speakText,
  playPop,
  playSuccessChime,
  playErrorBuzz,
  triggerCelebration,
  playStreakFanfare
} from '../utils/audio';

interface CategoryMockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  categoryIcon?: string;
  vocabulary: VocabWord[];
  stats: UserStats;
  lang?: Language;
  onSaveResult: (result: CategoryTestResult) => void;
  onStudyCategoryInFlashcards: (category: string) => void;
}

export const CategoryMockTestModal: React.FC<CategoryMockTestModalProps> = ({
  isOpen,
  onClose,
  category,
  categoryIcon = '📝',
  vocabulary,
  stats,
  lang = 'vi',
  onSaveResult,
  onStudyCategoryInFlashcards,
}) => {
  const t = translations[lang];

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [scramblePicks, setScramblePicks] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hasUsedRetry, setHasUsedRetry] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [missedQuestions, setMissedQuestions] = useState<QuizQuestion[]>([]);
  const [isDraggingOverSlot, setIsDraggingOverSlot] = useState(false);
  const [draggedScrambleWord, setDraggedScrambleWord] = useState<string | null>(null);
  const [draggedScramblePickIndex, setDraggedScramblePickIndex] = useState<number | null>(null);

  // Category labels in Vietnamese
  const getCategoryLabel = (cat: string) => {
    if (lang !== 'vi') return cat;
    switch (cat) {
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

  // Compile mock test when modal opens or category changes
  useEffect(() => {
    if (isOpen && category) {
      const generated = compileCategoryMockTest(category, vocabulary);
      setQuestions(generated);
      setCurrentIdx(0);
      setSelectedOption(null);
      setScramblePicks([]);
      setIsAnswered(false);
      setHasUsedRetry(false);
      setIsCorrect(false);
      setScore(0);
      setIsFinished(false);
      setMissedQuestions([]);
    }
  }, [isOpen, category, vocabulary]);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  const handlePlayAudio = (text?: string) => {
    playPop();
    const toSpeak = text || currentQ.audioText || currentQ.prompt;
    speakText(toSpeak, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
    });
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    playPop();
    setSelectedOption(idx);
  };

  const handlePickScrambleWord = (word: string) => {
    if (isAnswered) return;
    playPop();
    setScramblePicks((prev) => [...prev, word]);
  };

  const handleRemoveScrambleWord = (idx: number) => {
    if (isAnswered) return;
    playPop();
    setScramblePicks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleScrambleDragStart = (e: React.DragEvent, word: string) => {
    if (isAnswered) return;
    playPop();
    setDraggedScrambleWord(word);
    setDraggedScramblePickIndex(null);
    e.dataTransfer.setData('text/plain', word);
  };

  const handleScramblePickDragStart = (e: React.DragEvent, index: number) => {
    if (isAnswered) return;
    playPop();
    setDraggedScramblePickIndex(index);
    setDraggedScrambleWord(null);
    e.dataTransfer.setData('application/x-scramble-pick-index', String(index));
  };

  const handleScrambleDropAt = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOverSlot(false);

    const sourceIndexValue = e.dataTransfer.getData('application/x-scramble-pick-index');
    const sourceIndex = sourceIndexValue === ''
      ? draggedScramblePickIndex
      : Number(sourceIndexValue);

    if (sourceIndex !== null && Number.isInteger(sourceIndex)) {
      setScramblePicks((prev) => {
        if (sourceIndex < 0 || sourceIndex >= prev.length) return prev;
        const reordered = [...prev];
        const [word] = reordered.splice(sourceIndex, 1);
        const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
        reordered.splice(Math.max(0, Math.min(insertionIndex, reordered.length)), 0, word);
        return reordered;
      });
      setDraggedScramblePickIndex(null);
      return;
    }

    const word = e.dataTransfer.getData('text/plain') || draggedScrambleWord;
    if (word && !isAnswered) {
      setScramblePicks((prev) => {
        const updated = [...prev];
        updated.splice(Math.max(0, Math.min(targetIndex, updated.length)), 0, word);
        return updated;
      });
    }
    setDraggedScrambleWord(null);
  };

  const handleScrambleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOverSlot(false);
    const sourceIndexValue = e.dataTransfer.getData('application/x-scramble-pick-index');
    const sourceIndex = sourceIndexValue === ''
      ? draggedScramblePickIndex
      : Number(sourceIndexValue);

    if (sourceIndex !== null && Number.isInteger(sourceIndex)) {
      setScramblePicks((prev) => {
        if (sourceIndex < 0 || sourceIndex >= prev.length) return prev;
        const reordered = [...prev];
        const [word] = reordered.splice(sourceIndex, 1);
        reordered.push(word);
        return reordered;
      });
      setDraggedScramblePickIndex(null);
      return;
    }

    const word = e.dataTransfer.getData('text/plain') || draggedScrambleWord;
    if (word && !isAnswered) {
      handlePickScrambleWord(word);
    }
    setDraggedScrambleWord(null);
  };

  const handleCheckAnswer = () => {
    if (isAnswered) return;

    let correct = false;
    if (currentQ.type === 'scramble') {
      const built = scramblePicks.join(' ').trim().toLowerCase();
      const target = (currentQ.answer as string).trim().toLowerCase();
      correct = built === target;
    } else {
      correct = selectedOption === currentQ.answer;
    }

    setIsCorrect(correct);

    if (correct) {
      setIsAnswered(true);
      playSuccessChime();
      setScore((prev) => prev + 1);
    } else {
      playErrorBuzz();
      if (!hasUsedRetry) {
        setHasUsedRetry(true);
        setSelectedOption(null);
        setScramblePicks([]);
        return;
      }
      setIsAnswered(true);
      setMissedQuestions((prev) => [...prev, currentQ]);
    }
  };

  const handleNext = () => {
    playPop();
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setScramblePicks([]);
      setIsAnswered(false);
      setHasUsedRetry(false);
      setIsCorrect(false);
    } else {
      const finalScore = isCorrect ? score : score;
      const percentage = Math.round((finalScore / questions.length) * 100);
      const passed = percentage >= 60;

      const result: CategoryTestResult = {
        category,
        score: finalScore,
        maxScore: questions.length,
        percentage,
        passed,
        completedAt: new Date().toISOString(),
      };

      onSaveResult(result);
      setIsFinished(true);

      if (passed) {
        setTimeout(() => {
          playStreakFanfare();
          triggerCelebration();
        }, 150);
      }
    }
  };

  const handleRestart = () => {
    playPop();
    const generated = compileCategoryMockTest(category, vocabulary);
    setQuestions(generated);
    setCurrentIdx(0);
    setSelectedOption(null);
    setScramblePicks([]);
    setIsAnswered(false);
    setHasUsedRetry(false);
    setIsCorrect(false);
    setScore(0);
    setIsFinished(false);
    setMissedQuestions([]);
  };

  const remainingScrambleWords = currentQ.wordsToScramble
    ? currentQ.wordsToScramble.filter((w, idx) => {
        const totalInPicks = scramblePicks.filter((item) => item === w).length;
        const countBeforeThisIdx = currentQ.wordsToScramble!.slice(0, idx + 1).filter((item) => item === w).length;
        return countBeforeThisIdx > totalInPicks;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-600/30">
              {categoryIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                  {t.mockTestHeading}: {getCategoryLabel(category)}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {lang === 'vi' ? 'Đánh giá' : 'Evaluation'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.mockTestSub}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playPop();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {!isFinished ? (
            <>
              {/* Stepper & Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">
                    {lang === 'vi' ? 'Câu' : 'Question'} {currentIdx + 1} / {questions.length}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {lang === 'vi' ? 'Đã đúng' : 'Score'}: {score}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                    {currentQ.prompt}
                  </h4>
                  {currentQ.audioText && (
                    <button
                      onClick={() => handlePlayAudio(currentQ.audioText)}
                      className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 shrink-0 shadow-sm transition"
                      title="Nghe phát âm"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Listening Prompt Banner */}
                {currentQ.type === 'listening' && (
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center gap-3">
                    <button
                      onClick={() => handlePlayAudio(currentQ.audioText)}
                      className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md transition transform hover:scale-105"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <p className="font-bold text-slate-900 dark:text-white">{t.tapSpeakerToHear}</p>
                      <p>{t.tapSpeakerDesc}</p>
                    </div>
                  </div>
                )}

                {/* Multiple Choice Options */}
                {currentQ.type !== 'scramble' && currentQ.options && (
                  <div className="space-y-2.5">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrectOpt = idx === currentQ.answer;

                      let style = 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-indigo-400';

                      if (isAnswered) {
                        if (isCorrectOpt) {
                          style = 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold';
                        } else if (isSelected && !isCorrectOpt) {
                          style = 'bg-rose-50 dark:bg-rose-950/80 border-rose-500 text-rose-800 dark:text-rose-200';
                        }
                      } else if (isSelected) {
                        style = 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectOption(idx)}
                          disabled={isAnswered}
                          className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-sm sm:text-base ${style}`}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrectOpt && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}
                          {isAnswered && isSelected && !isCorrectOpt && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Sentence Scramble Puzzle */}
                {currentQ.type === 'scramble' && currentQ.wordsToScramble && (
                  <div className="space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingOverSlot(true);
                      }}
                      onDragLeave={() => setIsDraggingOverSlot(false)}
                      onDrop={handleScrambleDrop}
                      className={`min-h-[64px] p-4 rounded-2xl border-2 border-dashed flex flex-wrap gap-2 items-center transition-all ${
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
                            draggable={!isAnswered}
                            onDragStart={(e) => handleScramblePickDragStart(e, idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleScrambleDropAt(e, idx)}
                            disabled={isAnswered}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-sm hover:bg-rose-600 transition"
                            title={lang === 'vi' ? 'Kéo để sắp xếp lại, nhấn để gỡ từ' : 'Drag to reorder, click to remove'}
                          >
                            {word}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {remainingScrambleWords.map((word, idx) => (
                        <button
                          key={idx}
                          draggable={!isAnswered}
                          onDragStart={(e) => handleScrambleDragStart(e, word)}
                          onClick={() => handlePickScrambleWord(word)}
                          disabled={isAnswered}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-sm hover:border-indigo-500 transition active:scale-95 cursor-grab active:cursor-grabbing"
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

                {/* Feedback Explanation */}
                {(isAnswered || hasUsedRetry) && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 animate-in fade-in duration-300 ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>{t.correctFeedback}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>{t.incorrectFeedback}</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed">
                      {hasUsedRetry && !isAnswered
                        ? t.mockTestRetryPrompt
                        : currentQ.explanation}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3">
                {!isAnswered ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={
                      (currentQ.type !== 'scramble' && selectedOption === null) ||
                      (currentQ.type === 'scramble' && scramblePicks.length === 0)
                    }
                    className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition"
                  >
                    {hasUsedRetry ? t.btnTryAgain : t.btnCheckAnswer}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <span>
                      {currentIdx < questions.length - 1 ? t.btnNextQuestion : t.btnViewReport}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            /* EVALUATION DIAGNOSTIC REPORT */
            <div className="space-y-6 text-center py-2 animate-in fade-in">
              <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white">
                {score / questions.length >= 0.8 ? '🏆' : score / questions.length >= 0.6 ? '⭐' : '📖'}
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                  {t.reportTitle}
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {score / questions.length >= 0.8
                    ? t.reportOutstanding
                    : score / questions.length >= 0.6
                    ? t.reportPassed
                    : t.reportNeedReview}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {score / questions.length >= 0.6
                    ? t.reportPassedDesc
                    : t.reportFailDesc}
                </p>
              </div>

              {/* Stats Card */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                <div className="p-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.labelScore}</span>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {score} / {questions.length}
                  </p>
                </div>
                <div className="p-2 border-x border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.labelAccuracy}</span>
                  <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {Math.round((score / questions.length) * 100)}%
                  </p>
                </div>
                <div className="p-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.labelCertification}</span>
                  <p className={`text-base sm:text-lg font-bold mt-1 ${score / questions.length >= 0.6 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {score / questions.length >= 0.6 ? t.certifiedPass : t.certifiedProgress}
                  </p>
                </div>
              </div>

              {/* Missed Questions Diagnostic */}
              {missedQuestions.length > 0 && (
                <div className="text-left space-y-2.5 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t.reviewQuestionsTitle} ({missedQuestions.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {missedQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs space-y-1"
                      >
                        <p className="font-bold text-rose-900 dark:text-rose-200">
                          {q.prompt}
                        </p>
                        <p className="text-rose-700 dark:text-rose-300">
                          &rarr; {q.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.btnRetakeMockTest}</span>
                </button>

                <button
                  onClick={() => {
                    playPop();
                    onClose();
                    onStudyCategoryInFlashcards(category);
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950 transition border border-slate-200 dark:border-slate-700"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.btnReviewInFlashcards}</span>
                </button>

                <button
                  onClick={() => {
                    playPop();
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
                >
                  <span>{t.btnContinueCurriculum}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
