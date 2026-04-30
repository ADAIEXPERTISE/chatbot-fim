"use client";

import { SatisfactionQuestion } from "../data/satisfactionQuestions";

type SurveyAnswer = {
  questionId: number;
  response: string;
};

type SurveyPlaceholderProps = {
  questions: SatisfactionQuestion[];
  answers: SurveyAnswer[];
  currentQuestionIndex: number;
};

export default function SurveyPlaceholder({
  questions,
  answers,
  currentQuestionIndex,
}: SurveyPlaceholderProps) {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white/80 p-4 shadow-sm dark:bg-zinc-950 dark:border-zinc-700">
      <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-100">
        Questionnaire de satisfaction (interface provisoire)
      </div>
      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
        <div>
          <span className="font-medium text-gray-800 dark:text-gray-100">Question actuelle :</span>
          <div>{questions[currentQuestionIndex]?.question || "Aucune question"}</div>
        </div>
        <div>
          <span className="font-medium text-gray-800 dark:text-gray-100">Réponses enregistrées :</span>
          <ul className="list-disc pl-5">
            {answers.map((answer) => (
              <li key={`${answer.questionId}-${answer.response}`}>
                Q{answer.questionId}: {answer.response}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
