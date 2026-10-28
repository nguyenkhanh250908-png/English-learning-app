import { VocabWord, QuizQuestion } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function cleanPunctuation(str: string): string {
  return str.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, '').trim();
}

function createOptions(
  answer: string,
  candidates: string[]
): { options: string[]; answerIndex: number } {
  const normalizedAnswer = answer.trim().toLocaleLowerCase();
  const distractors = shuffle(
    Array.from(new Set(
      candidates
        .map((candidate) => candidate.trim())
        .filter((candidate) => candidate && candidate.toLocaleLowerCase() !== normalizedAnswer)
    ))
  ).slice(0, 3);
  const options = shuffle([answer, ...distractors]);

  return { options, answerIndex: options.indexOf(answer) };
}

function blankOutWord(sentence: string, word: string): string {
  const start = sentence.toLocaleLowerCase().indexOf(word.toLocaleLowerCase());
  if (start < 0) return `In everyday English: "________" (${sentence})`;
  return `${sentence.slice(0, start)}________${sentence.slice(start + word.length)}`;
}

/**
 * Creates a varied test using eight different words from the selected category.
 */
export function compileCategoryMockTest(
  category: string,
  vocabulary: VocabWord[]
): QuizQuestion[] {
  const categoryWords = shuffle(vocabulary.filter((word) => word.category === category));
  if (categoryWords.length === 0) return [];

  const otherWords = vocabulary.filter((word) => word.category !== category);
  const candidateWords = [...categoryWords, ...shuffle(otherWords)];
  const questionFactories: Array<(word: VocabWord, index: number) => QuizQuestion> = [
    (word, index) => {
      const choice = createOptions(word.translation, candidateWords.map((item) => item.translation));
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'mcq',
        category,
        prompt: `What is the correct meaning of "${word.english}"?`,
        options: choice.options,
        answer: choice.answerIndex,
        explanation: `"${word.english}" means ${word.translation}. Example: "${word.exampleSentence}"`,
      };
    },
    (word, index) => {
      const choice = createOptions(word.english, candidateWords.map((item) => item.english));
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'listening',
        category,
        audioText: word.english,
        prompt: 'Listen carefully. Which word or phrase did you hear?',
        options: choice.options,
        answer: choice.answerIndex,
        explanation: `"${word.english}" (${word.phonetic}) means ${word.translation}.`,
      };
    },
    (word, index) => {
      const sentence = cleanPunctuation(word.exampleSentence);
      const words = sentence.split(/\s+/);
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'scramble',
        category,
        prompt: `Unscramble the words to express: "${word.exampleTranslation}"`,
        wordsToScramble: shuffle(words),
        answer: sentence,
        explanation: `Correct sentence: "${word.exampleSentence}" (${word.exampleTranslation}).`,
      };
    },
    (word, index) => {
      const choice = createOptions(word.english, candidateWords.map((item) => item.english));
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'mcq',
        category,
        prompt: `Choose the correct English word or phrase for: "${word.translation}"`,
        options: choice.options,
        answer: choice.answerIndex,
        explanation: `"${word.english}" corresponds to "${word.translation}". ${word.tip || ''}`,
      };
    },
    (word, index) => {
      const choice = createOptions(word.english, candidateWords.map((item) => item.english));
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'fill-blank',
        category,
        audioText: word.exampleSentence,
        prompt: `Complete the sentence: "${blankOutWord(word.exampleSentence, word.english)}"`,
        options: choice.options,
        answer: choice.answerIndex,
        explanation: `Full sentence: "${word.exampleSentence}" → ${word.exampleTranslation}`,
      };
    },
    (word, index) => {
      const choice = createOptions(word.english, candidateWords.map((item) => item.english));
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'listening',
        category,
        audioText: word.exampleSentence,
        prompt: 'Listen to the example sentence. Which vocabulary item does it use?',
        options: choice.options,
        answer: choice.answerIndex,
        explanation: `"${word.exampleSentence}" uses "${word.english}", which means ${word.translation}.`,
      };
    },
    (word, index) => {
      const choice = createOptions(word.partOfSpeech, [
        'noun',
        'verb',
        'adjective',
        'phrase',
        'adverb',
      ]);
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'mcq',
        category,
        prompt: `What part of speech is "${word.english}"?`,
        options: choice.options,
        answer: choice.answerIndex,
        explanation: `"${word.english}" is a ${word.partOfSpeech}.`,
      };
    },
    (word, index) => {
      const choice = createOptions(
        word.exampleTranslation,
        candidateWords.map((item) => item.exampleTranslation)
      );
      return {
        id: `mock_${category}_q${index + 1}`,
        type: 'mcq',
        category,
        prompt: `Choose the correct meaning of: "${word.exampleSentence}"`,
        options: choice.options,
        answer: choice.answerIndex,
        explanation: `"${word.exampleSentence}" means "${word.exampleTranslation}".`,
      };
    },
  ];

  const questionsToCreate = Math.min(8, categoryWords.length);
  return shuffle(questionFactories)
    .slice(0, questionsToCreate)
    .map((createQuestion, index) => createQuestion(categoryWords[index], index));
}
