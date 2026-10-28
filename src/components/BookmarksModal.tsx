import React from 'react';
import { VocabWord, UserStats } from '../types';
import { translations, Language } from '../utils/i18n';
import {
  X,
  Volume2,
  Trash2,
  Bookmark,
  Layers,
  ArrowRight
} from 'lucide-react';
import { speakText, playPop } from '../utils/audio';

interface BookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  vocabulary: VocabWord[];
  stats: UserStats;
  lang?: Language;
  onToggleBookmark: (id: string) => void;
  onStudyBookmarks: () => void;
}

export const BookmarksModal: React.FC<BookmarksModalProps> = ({
  isOpen,
  onClose,
  vocabulary,
  stats,
  lang = 'vi',
  onToggleBookmark,
  onStudyBookmarks,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  const bookmarkedWords = vocabulary.filter((w) =>
    stats.bookmarkedWords.includes(w.id)
  );

  const handlePlayWord = (word: string) => {
    playPop();
    speakText(word, {
      rate: stats.voiceSpeed,
      accent: stats.voiceAccent,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950 flex items-center justify-center text-pink-500">
              <Bookmark className="w-5 h-5 fill-pink-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                {t.savedModalTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {bookmarkedWords.length} {t.savedModalSub}
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

        {/* Word list */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {bookmarkedWords.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <span className="text-3xl">🔖</span>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t.noSavedWords}
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {t.noSavedDesc}
              </p>
            </div>
          ) : (
            bookmarkedWords.map((word) => (
              <div
                key={word.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-indigo-300 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-base">
                      {word.english}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {word.phonetic}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {word.translation} &bull; <span className="text-indigo-500">{word.category}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handlePlayWord(word.english)}
                    className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      playPop();
                      onToggleBookmark(word.id);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition"
                    title="Xóa khỏi từ đã lưu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {bookmarkedWords.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
            <button
              onClick={() => {
                playPop();
                onClose();
                onStudyBookmarks();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition"
            >
              <Layers className="w-4 h-4" />
              <span>{t.btnPracticeSavedCards}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
