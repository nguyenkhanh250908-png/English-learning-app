import React, { useState } from 'react';
import { GRAMMAR_LESSONS } from '../data/learningData';
import { GrammarLesson, UserStats } from '../types';
import { translations, Language } from '../utils/i18n';
import { createGrammarMockTest } from '../utils/grammarMockTest';
import {
  BookOpen,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Lightbulb
} from 'lucide-react';
import {
  speakText,
  playPop,
  playSuccessChime,
  playErrorBuzz
} from '../utils/audio';

interface GrammarStudioViewProps {
  stats: UserStats;
  lang?: Language;
  onAddXP: (amount: number) => void;
}

export const GrammarStudioView: React.FC<GrammarStudioViewProps> = ({
  stats,
  lang = 'vi',
  onAddXP,
}) => {
  const t = translations[lang];

  const [activeLessonId, setActiveLessonId] = useState<string>(GRAMMAR_LESSONS[0].id);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submittedQuizzes, setSubmittedQuizzes] = useState<Record<number, boolean>>({});
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizDeferred, setIsQuizDeferred] = useState(false);

  const lesson: GrammarLesson =
    GRAMMAR_LESSONS.find((l) => l.id === activeLessonId) || GRAMMAR_LESSONS[0];
  const [mockTestQuestions, setMockTestQuestions] = useState(
    () => createGrammarMockTest(lesson, GRAMMAR_LESSONS)
  );

  const handlePlaySentence = (text: string) => {
    playPop();
    speakText(text, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
    });
  };

  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    if (submittedQuizzes[qIdx]) return;
    playPop();
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleCheckQuizAnswer = (qIdx: number, correctAnswer: number) => {
    const userAns = selectedAnswers[qIdx];
    if (userAns === undefined) return;

    setSubmittedQuizzes((prev) => ({ ...prev, [qIdx]: true }));

    if (userAns === correctAnswer) {
      playSuccessChime();
      onAddXP(10);
    } else {
      playErrorBuzz();
    }
  };

  const startQuiz = () => {
    setMockTestQuestions(createGrammarMockTest(lesson, GRAMMAR_LESSONS));
    setSelectedAnswers({});
    setSubmittedQuizzes({});
    setIsQuizDeferred(false);
    setIsQuizStarted(true);
  };

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.grammarTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.grammarSubtitle}
        </p>
      </div>

      {/* Main Grid: Sidebar selection + Detailed Lesson Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Lesson Navigation */}
        <div className="lg:col-span-4 space-y-2">
          {GRAMMAR_LESSONS.map((item) => {
            const isSelected = item.id === activeLessonId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playPop();
                  setActiveLessonId(item.id);
                  setMockTestQuestions(createGrammarMockTest(item, GRAMMAR_LESSONS));
                  setSelectedAnswers({});
                  setSubmittedQuizzes({});
                  setIsQuizStarted(false);
                  setIsQuizDeferred(false);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {item.level}
                    </span>
                    <h4 className="font-bold text-sm leading-snug">{item.title}</h4>
                  </div>
                  <p className={`text-xs line-clamp-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Lesson Detail Card */}
        <div className="lg:col-span-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-8">
          {/* Title & Level Tag */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.essentialRuleBadge} &bull; Level {lesson.level}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {lesson.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {lang === 'vi' ? lesson.explanationVi : lesson.explanation}
            </p>
          </div>

          {/* Golden Formula Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-pink-500/10 border border-amber-300/60 dark:border-amber-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>{t.formulaBlueprint}</span>
            </div>
            <p className="font-mono font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              {lesson.formula}
            </p>
          </div>

          {/* Key Rule Points */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.keyRulesTitle}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(lang === 'vi' ? lesson.keyPointsVi : lesson.keyPoints).map((point, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-world Examples with Audio */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t.examplesTitle}
            </h4>
            <div className="space-y-2.5">
              {lesson.examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-start justify-between gap-3 hover:border-indigo-300 transition"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      &quot;{ex.english}&quot;
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      &rarr; {ex.translation}
                    </p>
                    {ex.note && (
                      <span className="inline-block text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md mt-1">
                        Ghi chú: {ex.note}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handlePlaySentence(ex.english)}
                    className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 shrink-0"
                    title="Nghe câu ví dụ này"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {!isQuizStarted ? (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              {isQuizDeferred ? (
                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t.grammarKeepLearning}
                  </p>
                  <button
                    onClick={() => {
                      playPop();
                      startQuiz();
                    }}
                    className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                  >
                    {t.grammarStartQuiz}
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 text-center">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {t.grammarReadyToTest}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        playPop();
                        startQuiz();
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
                    >
                      {t.grammarStartQuiz}
                    </button>
                    <button
                      onClick={() => {
                        playPop();
                        setIsQuizDeferred(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
                    >
                      {t.grammarNotNow}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
          /* Interactive Check Mini-Quiz */
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {t.miniQuizTitle} ({mockTestQuestions.length} {t.questionCount})
              </h4>
            </div>

            <button
              onClick={() => {
                playPop();
                setIsQuizStarted(false);
                setIsQuizDeferred(true);
              }}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t.grammarReviewLesson}
            </button>

            {mockTestQuestions.map((q, qIdx) => {
              const selectedOpt = selectedAnswers[qIdx];
              const isChecked = submittedQuizzes[qIdx];
              const isCorrect = selectedOpt === q.answer;

              return (
                <div
                  key={qIdx}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-4"
                >
                  <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                    {qIdx + 1}. {q.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOpt === optIdx;
                      const isOptionCorrect = optIdx === q.answer;

                      let btnStyle = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                      if (isChecked) {
                        if (isOptionCorrect) {
                          btnStyle = 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                        } else if (isOptionSelected && !isOptionCorrect) {
                          btnStyle = 'bg-rose-50 dark:bg-rose-950 border-rose-500 text-rose-800 dark:text-rose-300';
                        }
                      } else if (isOptionSelected) {
                        btnStyle = 'bg-indigo-50 dark:bg-indigo-950 border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold';
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                          disabled={isChecked}
                          className={`p-3 rounded-xl border text-xs text-left font-medium transition ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}

                    {mockTestQuestions.every((_, qIdx) => submittedQuizzes[qIdx]) && (
                      <button
                        onClick={() => {
                          playPop();
                          startQuiz();
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
                      >
                        {t.grammarRetakeQuiz}
                      </button>
                    )}
                  </div>

                  {!isChecked ? (
                    <button
                      onClick={() => handleCheckQuizAnswer(qIdx, q.answer)}
                      disabled={selectedOpt === undefined}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs shadow-sm transition"
                    >
                      {t.btnCheckQuiz}
                    </button>
                  ) : (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-800 dark:text-rose-300'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      )}
                      <div>
                        <p className="font-bold">{isCorrect ? t.correctBadge : t.incorrectBadge}</p>
                        <p>{lang === 'vi' ? q.explanationVi : q.explanation}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
};
