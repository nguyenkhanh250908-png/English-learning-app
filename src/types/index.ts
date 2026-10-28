export type Difficulty = 'A1' | 'A2' | 'B1' | 'B2';

export interface VocabWord {
  id: string;
  english: string;
  phonetic: string;
  translation: string;
  category: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'phrase' | 'adverb';
  exampleSentence: string;
  exampleTranslation: string;
  tip?: string;
  mastered?: boolean;
  bookmarked?: boolean;
}

export interface DialogueLine {
  id: string;
  speaker: 'A' | 'B';
  speakerName: string;
  text: string;
  translation: string;
  avatar: string;
}

export interface DialogueScenario {
  id: string;
  title: string;
  description: string;
  level: Difficulty;
  category: string;
  icon: string;
  speakerA: { name: string; role: string; avatar: string };
  speakerB: { name: string; role: string; avatar: string };
  lines: DialogueLine[];
}

export interface GrammarExample {
  english: string;
  translation: string;
  note?: string;
}

export interface GrammarLesson {
  id: string;
  title: string;
  subtitle: string;
  level: Difficulty;
  formula: string;
  explanation: string;
  explanationVi: string;
  keyPoints: string[];
  keyPointsVi: string[];
  examples: GrammarExample[];
  quiz: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
    explanationVi: string;
  }[];
}

export type QuizType = 'mcq' | 'listening' | 'scramble' | 'fill-blank';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  prompt: string;
  category: string;
  audioText?: string;
  options?: string[];
  answer: string | number;
  wordsToScramble?: string[];
  explanation: string;
  hint?: string;
}

export interface CategoryTestResult {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  nativeLanguage: string;
  targetLevel: Difficulty;
  createdAt: string;
  isGuest?: boolean;
}

export interface UserStats {
  userId?: string;
  xp: number;
  streak: number;
  lastActiveDate: string;
  learnedWords: string[];
  masteredWords: string[];
  bookmarkedWords: string[];
  dailyGoalTarget: number;
  dailyGoalCurrent: number;
  completedQuizzes: number;
  voiceSpeed: number;
  voiceAccent: 'en-US' | 'en-GB';
  categoryTests?: Record<string, CategoryTestResult>;
}
