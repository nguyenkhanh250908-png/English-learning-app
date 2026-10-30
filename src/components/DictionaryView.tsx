import React, { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { VocabWord } from '../types';
import { Language, translations } from '../utils/i18n';

interface DictionaryViewProps {
  vocabulary: VocabWord[];
  lang: Language;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({ vocabulary, lang }) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const uniqueVocabulary = useMemo(() => {
    const seenWords = new Set<string>();

    return vocabulary.filter((word) => {
      const normalizedWord = `${word.category}:${word.english.trim().replace(/\s+/g, ' ').toLocaleLowerCase()}`;
      if (seenWords.has(normalizedWord)) return false;
      seenWords.add(normalizedWord);
      return true;
    });
  }, [vocabulary]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(uniqueVocabulary.map((word) => word.category))).sort()],
    [uniqueVocabulary],
  );

  const filteredWords = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return uniqueVocabulary.filter((word) => {
      const matchesCategory = selectedCategory === 'All' || word.category === selectedCategory;
      const matchesQuery =
        !query ||
        word.english.toLocaleLowerCase().includes(query) ||
        word.translation.toLocaleLowerCase().includes(query) ||
        word.category.toLocaleLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [uniqueVocabulary, searchQuery, selectedCategory]);

  return (
    <section className="max-w-5xl mx-auto py-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.dictionaryTitle}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.dictionaryDescription}</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">{t.dictionarySearch}</span>
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t.dictionarySearch}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label>
          <span className="sr-only">{t.dictionaryTopic}</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full sm:w-56 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'All' ? t.dictionaryAllTopics : category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t.dictionaryResultCount.replace('{count}', String(filteredWords.length))}
      </p>

      {filteredWords.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredWords.map((word) => {
            const lookupUrl = new URL(
              `/search/english/?q=${encodeURIComponent(word.english)}`,
              'https://www.oxfordlearnersdictionaries.com',
            );

            return (
              <article
                key={word.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{word.english}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {word.phonetic} · {word.partOfSpeech}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
                    {word.category}
                  </span>
                </div>

                <p className="font-semibold text-slate-700 dark:text-slate-200">{word.translation}</p>

                <a
                  href={lookupUrl.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t.dictionaryLookupOxford}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          {t.dictionaryNoResults}
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">{t.dictionarySourceNote}</p>
    </section>
  );
};
