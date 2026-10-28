import { QuizQuestion, VocabWord } from '../types';

const EXCLUDED_CATEGORIES = new Set(['kiem tra bai cu a Long', 'Machine Learning']);

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createOptions(answer: string, candidates: string[]): { options: string[]; answer: number } {
  const normalizedAnswer = answer.trim().toLocaleLowerCase();
  const distractors = shuffle(Array.from(new Set(
    candidates
      .map((candidate) => candidate.trim())
      .filter((candidate) => candidate && candidate.toLocaleLowerCase() !== normalizedAnswer)
  ))).slice(0, 3);
  const options = shuffle([answer, ...distractors]);

  return { options, answer: options.indexOf(answer) };
}

function cleanSentence(sentence: string): string {
  return sentence.replace(/[.,/#!$%^&*;:{}=\-_`~()?'"]/g, '').trim();
}

function makeQuestion(word: VocabWord, index: number, vocabulary: VocabWord[]): QuizQuestion {
  const otherWords = vocabulary.filter((candidate) => candidate.id !== word.id);
  const questionType = index % 4;
  const id = `arena_${word.id}_${index}`;

  if (questionType === 0) {
    const choice = createOptions(word.translation, otherWords.map((candidate) => candidate.translation));
    return {
      id,
      type: 'mcq',
      category: word.category,
      prompt: `What does "${word.english}" mean?`,
      options: choice.options,
      answer: choice.answer,
      explanation: `"${word.english}" means "${word.translation}".`,
    };
  }

  if (questionType === 1) {
    const choice = createOptions(word.english, otherWords.map((candidate) => candidate.english));
    return {
      id,
      type: 'listening',
      category: word.category,
      audioText: word.english,
      prompt: 'Listen to the audio. Which word or phrase did you hear?',
      options: choice.options,
      answer: choice.answer,
      explanation: `"${word.english}" means "${word.translation}".`,
    };
  }

  if (questionType === 2) {
    const sentence = cleanSentence(word.exampleSentence);
    return {
      id,
      type: 'scramble',
      category: word.category,
      prompt: `Unscramble the words to express: "${word.exampleTranslation}"`,
      wordsToScramble: shuffle(sentence.split(/\s+/)),
      answer: sentence,
      explanation: `Correct sentence: "${word.exampleSentence}" (${word.exampleTranslation}).`,
    };
  }

  const choice = createOptions(word.english, otherWords.map((candidate) => candidate.english));
  const wordIndex = word.exampleSentence.toLocaleLowerCase().indexOf(word.english.toLocaleLowerCase());
  const promptSentence = wordIndex >= 0
    ? `${word.exampleSentence.slice(0, wordIndex)}________${word.exampleSentence.slice(wordIndex + word.english.length)}`
    : `In everyday English, which word means "${word.translation}"?`;

  return {
    id,
    type: 'fill-blank',
    category: word.category,
    audioText: word.exampleSentence,
    prompt: `Complete the sentence: "${promptSentence}"`,
    options: choice.options,
    answer: choice.answer,
    explanation: `The correct answer is "${word.english}". ${word.exampleTranslation}`,
  };
}

export function compileQuizArena(vocabulary: VocabWord[]): QuizQuestion[] {
  const eligibleWords = vocabulary.filter((word) => !EXCLUDED_CATEGORIES.has(word.category));
  const categories = Array.from(new Set(eligibleWords.map((word) => word.category)));
  const questions = categories.flatMap((category, categoryIndex) => {
    const words = shuffle(eligibleWords.filter((word) => word.category === category));
    return words.slice(0, 2).map((word, wordIndex) =>
      makeQuestion(word, categoryIndex * 2 + wordIndex, eligibleWords)
    );
  });

  return shuffle(questions);
}
