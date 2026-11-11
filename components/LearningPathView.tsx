import React from 'react';
import { MODULES } from '../data/learningData';
import { UserStats, VocabWord } from '../types';
import { translations, Language } from '../utils/i18n';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Target,
  Trophy,
  BookOpen,
  Volume2,
  Play,
  Award,
  ClipboardCheck,
  Puzzle
} from 'lucide-react';
import { playPop } from '../utils/audio';

interface LearningPathViewProps {
  stats: UserStats;
  vocabulary: VocabWord[];
  lang?: Language;
  onSelectCategory: (category: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenMockTest: (category: string, icon?: string) => void;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  stats,
  vocabulary,
  lang = 'vi',
  onSelectCategory,
  onNavigateTab,
  onOpenMockTest,
}) => {
  const t = translations[lang];

  const masteredCount = stats.masteredWords.length;
  const totalWords = vocabulary.length;
  const overallPercentage = Math.round((masteredCount / Math.max(totalWords, 1)) * 100);

  // Daily goal calculation
  const dailyGoalPercent = Math.min(
    Math.round((stats.dailyGoalCurrent / stats.dailyGoalTarget) * 100),
    100
  );

  // Count passed tests
  const completedTestsCount = Object.values(stats.categoryTests || {}).filter((t) => t.passed).length;

  return (
    <div className="space-y-10 py-6">
      {/* Hero Banner with Daily Motivation */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full bg-pink-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.heroBadge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {t.heroTitle1} <br />
              <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-indigo-200 bg-clip-text text-transparent">
                {t.heroTitle2}
              </span>
            </h1>

            <p className="text-indigo-100/90 text-sm sm:text-base max-w-2xl leading-relaxed">
              {t.heroDesc}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  playPop();
                  onNavigateTab('flashcards');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-900 font-bold text-sm shadow-lg shadow-white/10 hover:bg-indigo-50 transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Play className="w-4 h-4 fill-indigo-900" />
                {t.btnStartFlashcards}
              </button>

              <button
                onClick={() => {
                  playPop();
                  onNavigateTab('dialogue');
                }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-sm border border-indigo-500/40 backdrop-blur-md transition transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{t.btnTryDialogues}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="lg:col-span-4 bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/15 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-200 font-semibold text-sm">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>{t.todayGoal}</span>
              </div>
              <span className="text-xs font-bold text-amber-300">
                {stats.dailyGoalCurrent} / {stats.dailyGoalTarget} {lang === 'vi' ? 'từ' : 'words'}
              </span>
            </div>

            {/* Goal Progress bar */}
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/20">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">{t.wordsMastered}</p>
                <p className="text-2xl font-black text-white mt-0.5">{masteredCount}</p>
                <p className="text-[10px] text-indigo-300">{lang === 'vi' ? `trên tổng ${totalWords}` : `of ${totalWords} total`}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-3 text-center">
                <p className="text-[11px] text-indigo-200 uppercase font-bold tracking-wider">{t.testsPassed}</p>
                <p className="text-2xl font-black text-amber-300 mt-0.5">{completedTestsCount} / {MODULES.length}</p>
                <p className="text-[10px] text-indigo-300">{lang === 'vi' ? 'Bài thi đã đạt' : 'Module Mock Tests'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Roadmap Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t.curriculumTitle}
            </h2>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {MODULES.length} {lang === 'vi' ? 'Chủ đề (A1 - B2)' : 'Modules (A1 - B2)'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {t.curriculumSubtitle}
          </p>
        </div>

        {/* Action quick links */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('matching')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-semibold text-xs transition"
          >
            <Puzzle className="w-3.5 h-3.5" />
            <span>{t.tabMatching}</span>
          </button>
          <button
            onClick={() => onNavigateTab('quiz')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold text-xs transition"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{t.btnPracticeArena}</span>
          </button>
          <button
            onClick={() => onNavigateTab('grammar')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold text-xs transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.btnGrammarRules}</span>
          </button>
        </div>
      </div>

      {/* Modules Grid / Path Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {MODULES.map((module, index) => {
          // Words in this category
          const categoryWords = vocabulary.filter((w) => w.category === module.category);
          const catMastered = categoryWords.filter((w) => stats.masteredWords.includes(w.id)).length;
          const isComplete = categoryWords.length > 0 && catMastered >= categoryWords.length;
          const progressPercent = Math.round((catMastered / Math.max(categoryWords.length, 1)) * 100);

          // Test status
          const testResult = stats.categoryTests?.[module.category];
          const displayTitle = lang === 'vi' ? module.titleVi : module.title;
          const displayDesc = lang === 'vi' ? module.descriptionVi : module.description;

          return (
            <div
              key={module.id}
              className="group relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Header with module step number & level */}
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {testResult?.passed && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {testResult.percentage}%
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                      Level {module.level}
                    </span>
                  </div>
                </div>

                {/* Module Icon & Title */}
                <div className="flex items-start gap-3.5 my-2">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${module.color} flex items-center justify-center text-2xl shadow-md shrink-0 text-white`}>
                    {module.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {displayTitle}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {categoryWords.length} {t.wordsCount}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {displayDesc}
                </p>
              </div>

              {/* Progress & Quick Action */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : null}
                    {isComplete ? t.moduleMastered : t.moduleMastery}
                  </span>
                  <span className={isComplete ? 'text-emerald-500 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                    {catMastered} / {categoryWords.length} {lang === 'vi' ? 'từ' : 'words'}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isComplete
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Action Buttons: Practice Words & Take Mock Test */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      playPop();
                      onSelectCategory(module.category);
                      onNavigateTab('flashcards');
                    }}
                    className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
                  >
                    <span>{t.btnPractice}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => {
                      playPop();
                      onOpenMockTest(module.category, module.icon);
                    }}
                    className={`flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition shadow-sm ${
                      testResult?.passed
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : isComplete
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100'
                    }`}
                    title={`${t.btnMockTest} ${displayTitle}`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>{testResult?.passed ? t.btnRetakeTest : t.btnMockTest}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Beginner Study Tips Bar */}
      <div className="rounded-3xl border border-indigo-100 dark:border-indigo-950 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <span>{t.goldenRuleTitle}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {t.goldenRuleHeading}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl">
              {t.goldenRuleDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('speaking')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>{t.tabSpeaking}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
