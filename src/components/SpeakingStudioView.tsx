import React, { useState, useEffect, useRef } from 'react';
import { UserStats } from '../types';
import {
  SPEAKING_PRACTICE_SENTENCES,
  shuffleSpeakingPracticeSentences,
} from '../data/speakingPractice';
import { translations, Language } from '../utils/i18n';
import {
  Mic,
  MicOff,
  Volume2,
  ArrowRight,
  Info,
  RotateCcw
} from 'lucide-react';
import {
  speakText,
  playPop,
  playSuccessChime,
  triggerCelebration
} from '../utils/audio';

interface SpeakingStudioViewProps {
  stats: UserStats;
  lang?: Language;
  onAddXP: (amount: number) => void;
}

export const SpeakingStudioView: React.FC<SpeakingStudioViewProps> = ({
  stats,
  lang = 'vi',
  onAddXP,
}) => {
  const t = translations[lang];

  const [sentences, setSentences] = useState(() => shuffleSpeakingPracticeSentences());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [wordMatches, setWordMatches] = useState<boolean[] | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const activeItem = sentences[currentIdx];
  const voiceSpeed = Number.isFinite(stats.voiceSpeed)
    ? Math.min(1.5, Math.max(0.75, stats.voiceSpeed))
    : 1;
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingAudioRef = useRef<HTMLAudioElement>(null);
  const discardRecordingRef = useRef(false);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        if (recorder.state === 'recording') recorder.stop();
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    };
  }, [recordingUrl]);

  // Check speech recognition support
  useEffect(() => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setRecognitionSupported(false);
    }
  }, []);

  const handlePlayTargetAudio = () => {
    playPop();
    speakText(activeItem.sentence, {
      rate: voiceSpeed,
      accent: stats.voiceAccent,
    });
  };

  const cleanText = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, '')
      .trim();
  };

  const evaluateSpeech = (spokenText: string) => {
    const targetWords = cleanText(activeItem.sentence).split(/\s+/).filter(Boolean);
    const spokenWords = cleanText(spokenText).split(/\s+/).filter(Boolean);
    const distances = Array.from({ length: targetWords.length + 1 }, () =>
      Array<number>(spokenWords.length + 1).fill(0)
    );

    for (let targetIndex = 0; targetIndex <= targetWords.length; targetIndex++) {
      distances[targetIndex][0] = targetIndex;
    }
    for (let spokenIndex = 0; spokenIndex <= spokenWords.length; spokenIndex++) {
      distances[0][spokenIndex] = spokenIndex;
    }
    for (let targetIndex = 1; targetIndex <= targetWords.length; targetIndex++) {
      for (let spokenIndex = 1; spokenIndex <= spokenWords.length; spokenIndex++) {
        const substitutionCost =
          targetWords[targetIndex - 1] === spokenWords[spokenIndex - 1] ? 0 : 1;
        distances[targetIndex][spokenIndex] = Math.min(
          distances[targetIndex - 1][spokenIndex] + 1,
          distances[targetIndex][spokenIndex - 1] + 1,
          distances[targetIndex - 1][spokenIndex - 1] + substitutionCost
        );
      }
    }

    const matchedWords = Array<boolean>(targetWords.length).fill(false);
    let targetIndex = targetWords.length;
    let spokenIndex = spokenWords.length;
    while (targetIndex > 0 || spokenIndex > 0) {
      if (
        targetIndex > 0 &&
        spokenIndex > 0 &&
        targetWords[targetIndex - 1] === spokenWords[spokenIndex - 1] &&
        distances[targetIndex][spokenIndex] === distances[targetIndex - 1][spokenIndex - 1]
      ) {
        matchedWords[targetIndex - 1] = true;
        targetIndex--;
        spokenIndex--;
      } else if (
        targetIndex > 0 &&
        spokenIndex > 0 &&
        distances[targetIndex][spokenIndex] === distances[targetIndex - 1][spokenIndex - 1] + 1
      ) {
        targetIndex--;
        spokenIndex--;
      } else if (
        targetIndex > 0 &&
        distances[targetIndex][spokenIndex] === distances[targetIndex - 1][spokenIndex] + 1
      ) {
        targetIndex--;
      } else {
        spokenIndex--;
      }
    }

    const matchCount = matchedWords.filter(Boolean).length;
    const calculatedScore = targetWords.length
      ? Math.round((matchCount / targetWords.length) * 100)
      : 0;
    setWordMatches(matchedWords);
    setScore(calculatedScore);

    if (calculatedScore >= 75) {
      triggerCelebration();
      onAddXP(20);
    } else {
      playSuccessChime();
      onAddXP(5);
    }
  };

  const handleToggleRecord = async () => {
    playPop();
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      const simulatedText = activeItem.sentence;
      setTranscript(simulatedText);
      evaluateSpeech(simulatedText);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = stats.voiceAccent || 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
        setTranscript('');
        setScore(null);
        setWordMatches(null);
      };

      recognition.onresult = (event: any) => {
        const spoken = event.results[0][0].transcript;
        setTranscript(spoken);
        evaluateSpeech(spoken);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setRecordingError(t.speakingRecognitionError);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (recorderRef.current?.state === 'recording') {
          recorderRef.current.stop();
        }
      };

      recognitionRef.current = recognition;
      setRecordingUrl(null);
      setRecordingError(null);
      discardRecordingRef.current = false;
      setTranscript('');
      setScore(null);
      setWordMatches(null);

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setRecordingError(t.recordingUnavailable);
        recognition.start();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordingStreamRef.current = stream;
        recordingChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordingChunksRef.current.push(event.data);
        };
        recorder.onstop = () => {
          if (!discardRecordingRef.current && recordingChunksRef.current.length > 0) {
            const recording = new Blob(recordingChunksRef.current, {
              ...(recorder.mimeType ? { type: recorder.mimeType } : {}),
            });
            setRecordingUrl(URL.createObjectURL(recording));
          }
          stream.getTracks().forEach((track) => track.stop());
          recordingStreamRef.current = null;
        };
        recorder.start();
      } catch (error: unknown) {
        console.warn('Could not capture pronunciation audio:', error);
        setRecordingError(t.recordingPermissionError);
      }

      recognition.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
      setRecordingError(t.speakingRecognitionError);
      setIsRecording(false);
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
  };

  const handleNext = () => {
    playPop();
    if (isRecording) {
      discardRecordingRef.current = true;
      recognitionRef.current?.abort();
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
    if (currentIdx === sentences.length - 1) {
      setSentences(shuffleSpeakingPracticeSentences(SPEAKING_PRACTICE_SENTENCES, sentences));
      setCurrentIdx(0);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
    setTranscript('');
    setScore(null);
    setWordMatches(null);
    setIsRecording(false);
    setRecordingUrl(null);
    setRecordingError(null);
  };

  const targetWords = activeItem.sentence.split(' ');

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.speakingTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t.speakingSubtitle}
        </p>
      </div>

      {/* Main Studio Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xl space-y-8">
        {/* Item Category & Counter */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            {activeItem.category}
          </span>
          <span className="text-xs font-bold text-slate-400">
            {t.sentenceCount} {currentIdx + 1} / {sentences.length}
          </span>
        </div>

        {/* Target Sentence Display with word highlight */}
        <div className="text-center space-y-3 my-4">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white leading-relaxed flex flex-wrap justify-center gap-2">
            {targetWords.map((word, wIdx) => {
              const isMatched = wordMatches?.[wIdx];

              return (
                <span
                  key={wIdx}
                  className={`transition-colors duration-300 ${
                    wordMatches !== null
                      ? isMatched
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : 'text-rose-500 dark:text-rose-400'
                      : ''
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>

          {score !== null && (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {t.targetSentenceIpa}
              </p>
              {activeItem.ipa ? (
                <p className="font-mono text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  {activeItem.ipa}
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.ipaUnavailable}</p>
              )}
            </div>
          )}

          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 italic">
            &rarr; {activeItem.translation}
          </p>
        </div>

        {/* Hear target pronunciation */}
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={handlePlayTargetAudio}
            aria-label={t.speakingListenTarget}
            title={t.speakingListenTarget}
            className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-200 transition border border-slate-200 dark:border-slate-700"
          >
            <Volume2 className="w-5 h-5 text-indigo-500" />
          </button>
        </div>

        {/* Recording Action Button (Big Circular Mic) */}
        <div className="text-center space-y-4 py-4">
          <div className="relative inline-block">
            {isRecording && (
              <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
            )}

            <button
              onClick={handleToggleRecord}
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all transform active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 shadow-rose-500/40'
                  : 'bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-indigo-600/30 hover:scale-105'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">
                {isRecording ? t.listeningMic : t.tapAndSpeak}
              </span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            {isRecording ? t.speakingActivePrompt : t.speakingInstruction}
          </p>

          {!recognitionSupported && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs">
              <Info className="w-3.5 h-3.5" />
              <span>Chế độ mô phỏng đánh giá phát âm tự động đang hoạt động.</span>
            </div>
          )}
          {recordingError && (
            <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
              {recordingError}
            </p>
          )}
        </div>

        {/* Evaluation Result Card */}
        {score !== null && (
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4 text-center animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                {t.accuracyTitle}
              </span>
            </div>

            <div className="text-4xl sm:text-5xl font-black text-indigo-600 dark:text-indigo-400">
              {score}%
            </div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {score >= 80 ? t.accExcellent : score >= 50 ? t.accGood : t.accTryAgain}
            </p>

            {transcript && (
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200">{t.heardLabel} </span>
                &quot;{transcript}&quot;
              </div>
            )}

            {score !== null && (
              <>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-500">● {t.correctWordsLabel}</span>
                  {' · '}
                  <span className="text-rose-500">● {t.incorrectWordsLabel}</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.speakingMatchNote}</p>
              </>
            )}

          </div>
        )}

        {recordingUrl && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (recordingAudioRef.current) {
                  recordingAudioRef.current.currentTime = 0;
                  void recordingAudioRef.current.play().catch((error: unknown) => {
                    console.warn('Could not replay pronunciation audio:', error);
                    setRecordingError(t.recordingPlaybackError);
                  });
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
            >
              <RotateCcw className="w-4 h-4" />
              {t.replayRecording}
            </button>
            <audio ref={recordingAudioRef} src={recordingUrl} className="hidden" />
          </div>
        )}

        {/* Next Sentence Button */}
        <div className="pt-2">
          <button
            onClick={handleNext}
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2"
          >
            <span>{currentIdx === sentences.length - 1 ? t.speakingPracticeAgain : t.btnNextSentence}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
