import { GrammarLesson } from '../types';

type GrammarTestQuestion = GrammarLesson['quiz'][number];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function makeQuestion(
  question: string,
  correctOption: string,
  distractors: string[],
  explanation: string,
  explanationVi: string
): GrammarTestQuestion {
  const normalizedAnswer = correctOption.trim().toLocaleLowerCase();
  const uniqueDistractors = Array.from(new Set(
    distractors.filter((option) => option.trim().toLocaleLowerCase() !== normalizedAnswer)
  )).slice(0, 3);
  const options = shuffle([correctOption, ...uniqueDistractors]);

  return {
    question,
    options,
    answer: options.indexOf(correctOption),
    explanation,
    explanationVi,
  };
}

export function createGrammarMockTest(
  lesson: GrammarLesson,
  allLessons: GrammarLesson[]
): GrammarTestQuestion[] {
  const questions: GrammarTestQuestion[] = [...lesson.quiz];
  const requiredQuestions: GrammarTestQuestion[] = lesson.quiz.length ? [lesson.quiz[0]] : [];
  const otherRules = lesson.keyPoints.filter((point) => point.trim());
  const otherExamples = lesson.examples;
  const otherLessons = allLessons.filter((candidate) => candidate.id !== lesson.id);

  lesson.keyPoints.forEach((rule, index) => {
    const ruleQuestion = makeQuestion(
      `Which statement is rule ${index + 1} for "${lesson.title}"?`,
      rule,
      otherRules.filter((_, ruleIndex) => ruleIndex !== index),
      `Rule ${index + 1}: ${rule}`,
      `Quy tắc ${index + 1}: ${lesson.keyPointsVi[index] || rule}`
    );
    questions.push(ruleQuestion);
    requiredQuestions.push(ruleQuestion);
    questions.push(makeQuestion(
      `Which rule should you apply for "${lesson.title}"?`,
      rule,
      otherRules.filter((_, ruleIndex) => ruleIndex !== index),
      `Apply this rule: ${rule}`,
      `Áp dụng quy tắc này: ${lesson.keyPointsVi[index] || rule}`
    ));
  });

  lesson.examples.forEach((example) => {
    const exampleQuestion = makeQuestion(
      `Which English sentence matches this meaning: "${example.translation}"?`,
      example.english,
      otherExamples.map((item) => item.english),
      `"${example.english}" means "${example.translation}".`,
      `Câu "${example.english}" có nghĩa là "${example.translation}".`
    );
    questions.push(exampleQuestion);
    requiredQuestions.push(exampleQuestion);
    questions.push(makeQuestion(
      `What does this sentence mean: "${example.english}"?`,
      example.translation,
      otherExamples.map((item) => item.translation),
      `"${example.english}" means "${example.translation}".`,
      `Câu "${example.english}" có nghĩa là "${example.translation}".`
    ));
  });

  const formulaQuestion = makeQuestion(
    `Which formula is taught in "${lesson.title}"?`,
    lesson.formula,
    otherLessons.map((candidate) => candidate.formula),
    `The formula is: ${lesson.formula}`,
    `Công thức là: ${lesson.formula}`
  );
  questions.push(formulaQuestion);
  requiredQuestions.push(formulaQuestion);

  questions.push(makeQuestion(
    `Which explanation describes "${lesson.title}"?`,
    lesson.explanation,
    otherLessons.map((candidate) => candidate.explanation),
    lesson.explanation,
    lesson.explanationVi
  ));

  if (questions.length < 15 || requiredQuestions.length > 15) {
    throw new Error(`Grammar mock test for "${lesson.id}" cannot provide 15 questions with full concept coverage.`);
  }

  const requiredSet = new Set(requiredQuestions);
  const additionalQuestions = shuffle(questions.filter((question) => !requiredSet.has(question)))
    .slice(0, 15 - requiredQuestions.length);
  return shuffle([...requiredQuestions, ...additionalQuestions]);
}
