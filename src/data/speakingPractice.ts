import { VOCABULARY_LIST } from './learningData';

export interface SpeakingPracticeItem {
  id: string;
  sentence: string;
  translation: string;
  ipa?: string;
  category: string;
}

const EXTRA_PRACTICE_SENTENCES: SpeakingPracticeItem[] = [
  {
    id: 'extra-greeting',
    sentence: 'Hello, it is very nice to meet you.',
    translation: 'Xin chào, rất vui được gặp bạn.',
    ipa: '/həˈloʊ, ɪt ɪz ˈveri naɪs tuː miːt juː/',
    category: 'Greetings',
  },
  {
    id: 'extra-ordering',
    sentence: 'Could I have a hot coffee, please?',
    translation: 'Cho tôi xin một cốc cà phê nóng, làm ơn?',
    ipa: '/kʊd aɪ hæv ə hɑːt ˈkɔːfi, pliːz/',
    category: 'Food & Drink',
  },
  {
    id: 'extra-directions',
    sentence: 'Excuse me, where is the train station?',
    translation: 'Xin lỗi, nhà ga xe lửa ở đâu vậy?',
    ipa: '/ɪkˈskjuːz miː, wer ɪz ðə treɪn ˈsteɪʃn/',
    category: 'Travel',
  },
  {
    id: 'extra-study',
    sentence: 'I am learning English step by step.',
    translation: 'Tôi đang từng bước học tiếng Anh.',
    ipa: '/aɪ æm ˈlɜːrnɪŋ ˈɪŋɡlɪʃ step baɪ step/',
    category: 'Work & Study',
  },
  {
    id: 'extra-shopping',
    sentence: 'What time does the supermarket open?',
    translation: 'Mấy giờ thì siêu thị mở cửa?',
    ipa: '/wɑːt taɪm dʌz ðə ˈsuːpərmɑːrkɪt ˈoʊpən/',
    category: 'Numbers',
  },
  {
    id: 'extra-polite',
    sentence: 'Thank you so much for your help today.',
    translation: 'Cảm ơn bạn rất nhiều vì sự giúp đỡ hôm nay.',
    ipa: '/θæŋk juː soʊ mʌtʃ fɔːr jʊər help təˈdeɪ/',
    category: 'Survival',
  },
];

export const SPEAKING_PRACTICE_SENTENCES: SpeakingPracticeItem[] = [
  ...EXTRA_PRACTICE_SENTENCES,
  ...VOCABULARY_LIST.map((word) => ({
    id: `vocabulary-${word.id}`,
    sentence: word.exampleSentence,
    translation: word.exampleTranslation,
    category: word.category,
  })),
];

export function shuffleSpeakingPracticeSentences(
  sentences: SpeakingPracticeItem[] = SPEAKING_PRACTICE_SENTENCES,
  previousOrder?: SpeakingPracticeItem[]
): SpeakingPracticeItem[] {
  const shuffled = [...sentences];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  if (
    previousOrder &&
    shuffled.every((sentence, index) => sentence.id === previousOrder[index]?.id)
  ) {
    shuffled.push(shuffled.shift()!);
  }

  return shuffled;
}
