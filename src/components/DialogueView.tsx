import React, { useState, useEffect, useRef } from 'react';
import { DIALOGUES } from '../data/learningData';
import { DialogueScenario, UserStats } from '../types';
import { translations, Language } from '../utils/i18n';
import {
  Play,
  Pause,
  Volume2,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { speakText, playPop, triggerCelebration } from '../utils/audio';

interface DialogueViewProps {
  stats: UserStats;
  lang?: Language;
  onAddXP: (amount: number) => void;
}

export const DialogueView: React.FC<DialogueViewProps> = ({ stats, lang = 'vi', onAddXP }) => {
  const t = translations[lang];

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(DIALOGUES[0].id);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [showTranslations, setShowTranslations] = useState<boolean>(true);
  const [roleplayMode, setRoleplayMode] = useState<boolean>(false); // Learner plays speaker B
  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  const scenario: DialogueScenario =
    DIALOGUES.find((d) => d.id === selectedScenarioId) || DIALOGUES[0];

  const timerRef = useRef<any>(null);

  // Stop auto playback when changing scenario
  useEffect(() => {
    setActiveLineIndex(0);
    setIsPlayingAll(false);
    setHasCompleted(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [selectedScenarioId]);

  // Handle Play Full Conversation automatically
  useEffect(() => {
    if (!isPlayingAll) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const currentLine = scenario.lines[activeLineIndex];
    if (!currentLine) {
      setIsPlayingAll(false);
      setHasCompleted(true);
      triggerCelebration();
      onAddXP(20);
      return;
    }

    // Roleplay mode pause on user turn
    if (roleplayMode && currentLine.speaker === 'B') {
      setIsPlayingAll(false);
      return;
    }

    // Speak line
    const pitch = currentLine.speaker === 'A' ? 1.0 : 1.15;
    speakText(currentLine.text, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
      pitch,
      onEnd: () => {
        if (isPlayingAll) {
          timerRef.current = setTimeout(() => {
            if (activeLineIndex < scenario.lines.length - 1) {
              setActiveLineIndex((prev) => prev + 1);
            } else {
              setIsPlayingAll(false);
              setHasCompleted(true);
              triggerCelebration();
              onAddXP(20);
            }
          }, 1200);
        }
      },
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlayingAll, activeLineIndex, scenario, roleplayMode, stats.voiceSpeed, stats.voiceAccent]);

  const handlePlaySingleLine = (text: string, speaker: 'A' | 'B', index: number) => {
    playPop();
    setActiveLineIndex(index);
    const pitch = speaker === 'A' ? 1.0 : 1.15;
    speakText(text, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
      pitch,
    });
  };

  const handleStartAll = () => {
    playPop();
    setHasCompleted(false);
    setActiveLineIndex(0);
    setIsPlayingAll(true);
  };

  const handleStopAll = () => {
    playPop();
    setIsPlayingAll(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const handleNextRoleplayTurn = () => {
    playPop();
    if (activeLineIndex < scenario.lines.length - 1) {
      const nextIdx = activeLineIndex + 1;
      setActiveLineIndex(nextIdx);

      // Speak next line automatically if it's Character A
      const nextLine = scenario.lines[nextIdx];
      if (nextLine.speaker === 'A') {
        speakText(nextLine.text, {
          rate: stats.voiceSpeed,
          accent: stats.voiceAccent,
          pitch: 1.0,
        });
      }
    } else {
      setHasCompleted(true);
      triggerCelebration();
      onAddXP(25);
    }
  };

  const getScenarioTitle = (id: string, defTitle: string) => {
    if (lang !== 'vi') return defTitle;
    switch (id) {
      case 'cafe': return 'Gọi đồ tại Quán Cà phê';
      case 'meeting_friend': return 'Làm quen bạn mới';
      case 'directions': return 'Hỏi đường tới Ga tàu';
      case 'hotel_checkin': return 'Nhận phòng Khách sạn';
      default: return defTitle;
    }
  };

  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto">
      {/* Scenario Selection Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t.dialogueTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.dialogueSubtitle}
            </p>
          </div>

          {/* Mode Switcher: Listen vs Roleplay */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              onClick={() => {
                playPop();
                setRoleplayMode(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                !roleplayMode
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.modeListen}
            </button>
            <button
              onClick={() => {
                playPop();
                setRoleplayMode(true);
                setIsPlayingAll(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                roleplayMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.modeRoleplay}
            </button>
          </div>
        </div>

        {/* Scenarios Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {DIALOGUES.map((item) => {
            const isSelected = item.id === selectedScenarioId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playPop();
                  setSelectedScenarioId(item.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{getScenarioTitle(item.id, item.title)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10">
                  {item.level}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Conversation Container */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden flex flex-col">
        {/* Scenario Banner / Characters Info */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-2xl flex items-center justify-center shrink-0">
              {scenario.icon}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                {getScenarioTitle(scenario.id, scenario.title)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {scenario.speakerA.name} &bull; {scenario.speakerB.name}
              </p>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            {/* Toggle Translation */}
            <button
              onClick={() => {
                playPop();
                setShowTranslations(!showTranslations);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition"
              title="Ẩn hoặc hiện bản dịch tiếng Việt"
            >
              {showTranslations ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showTranslations ? t.btnHideMeaning : t.btnShowMeaning}</span>
            </button>

            {/* Play all / pause */}
            {!roleplayMode && (
              <button
                onClick={isPlayingAll ? handleStopAll : handleStartAll}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  isPlayingAll
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isPlayingAll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlayingAll ? t.btnStop : t.btnPlayAll}</span>
              </button>
            )}
          </div>
        </div>

        {/* Roleplay prompt banner if in roleplay mode */}
        {roleplayMode && (
          <div className="px-6 py-3 bg-indigo-50/80 dark:bg-indigo-950/50 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200 font-semibold">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t.roleplayPrompt} <span className="font-extrabold">{scenario.speakerB.name}</span>. {t.roleplayTip}</span>
            </span>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              {lang === 'vi' ? 'Câu' : 'Line'} {activeLineIndex + 1} / {scenario.lines.length}
            </span>
          </div>
        )}

        {/* Message Thread (Chat Bubbles) */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[500px] overflow-y-auto">
          {scenario.lines.map((line, idx) => {
            const isSpeakerA = line.speaker === 'A';
            const isActive = idx === activeLineIndex;
            const isUserTurn = roleplayMode && !isSpeakerA && isActive;

            return (
              <div
                key={line.id}
                className={`flex gap-3.5 ${isSpeakerA ? 'justify-start' : 'justify-end'}`}
              >
                {/* Speaker A Avatar */}
                {isSpeakerA && (
                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-lg shrink-0 shadow-sm border border-indigo-200 dark:border-indigo-800">
                    {line.avatar}
                  </div>
                )}

                {/* Bubble Container */}
                <div
                  className={`max-w-md sm:max-w-lg rounded-3xl p-4 sm:p-5 transition-all duration-300 ${
                    isSpeakerA
                      ? isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/70 border-2 border-indigo-500 shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60'
                      : isUserTurn
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/70 border-2 border-emerald-500 shadow-lg'
                      : isActive
                      ? 'bg-violet-600 text-white shadow-md'
                      : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <span
                      className={`text-xs font-bold ${
                        isSpeakerA
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : isActive && !isUserTurn
                          ? 'text-indigo-100'
                          : isUserTurn
                          ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
                          : 'text-indigo-200'
                      }`}
                    >
                      {line.speakerName}
                    </span>

                    {/* Audio Play button on bubble */}
                    <button
                      onClick={() => handlePlaySingleLine(line.text, line.speaker, idx)}
                      className={`p-1.5 rounded-lg transition ${
                        isSpeakerA
                          ? 'text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700'
                          : isUserTurn
                          ? 'text-emerald-700 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      title="Nghe câu này"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* English Line */}
                  <p
                    className={`text-sm sm:text-base font-semibold leading-relaxed ${
                      isSpeakerA
                        ? 'text-slate-800 dark:text-slate-100'
                        : isUserTurn
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-white'
                    }`}
                  >
                    {line.text}
                  </p>

                  {/* Translation Subtitle */}
                  {showTranslations && (
                    <p
                      className={`text-xs mt-2 pt-2 border-t font-normal leading-relaxed ${
                        isSpeakerA
                          ? 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          : isUserTurn
                          ? 'text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'text-indigo-100/80 border-white/20'
                      }`}
                    >
                      &rarr; {line.translation}
                    </p>
                  )}
                </div>

                {/* Speaker B Avatar */}
                {!isSpeakerA && (
                  <div className="w-9 h-9 rounded-2xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-lg shrink-0 shadow-sm border border-violet-200 dark:border-violet-800">
                    {line.avatar}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Roleplay Control */}
        {roleplayMode && (
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {t.roleplayTip}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const currentLine = scenario.lines[activeLineIndex];
                  if (currentLine) {
                    handlePlaySingleLine(currentLine.text, currentLine.speaker, activeLineIndex);
                  }
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.btnHearMyLine}</span>
              </button>

              <button
                onClick={handleNextRoleplayTurn}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
              >
                <span>
                  {activeLineIndex < scenario.lines.length - 1 ? t.btnNextTurn : t.btnFinishDialogue}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Completion Celebration Card */}
        {hasCompleted && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4" />
              {t.dialogueCompletedNotice}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
