"use client";

import { useState } from "react";
import { satisfactionQuestions } from "@/app/chat/data/satisfactionQuestions";

type SurveyAnswer = {
  questionId: number;
  response: string;
  choiceId?: number;
};

export default function SatisfactionPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = satisfactionQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / satisfactionQuestions.length) * 100;

  const handleTextAnswer = (text: string) => {
    const newAnswers = answers.filter((a) => a.questionId !== currentQuestion.questionId);
    newAnswers.push({
      questionId: currentQuestion.questionId,
      response: text,
    });
    setAnswers(newAnswers);
    handleNext();
  };

  const handleChoiceAnswer = (choiceId: number, label: string) => {
    const newAnswers = answers.filter((a) => a.questionId !== currentQuestion.questionId);
    newAnswers.push({
      questionId: currentQuestion.questionId,
      response: label,
      choiceId,
    });
    setAnswers(newAnswers);
    handleNext();
  };

  const handleNext = () => {
    if (currentQuestionIndex < satisfactionQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
        }),
      });

      if (response.ok) {
        setIsCompleted(true);
      }
    } catch (error) {
      console.error("Error submitting survey:", error);
    }
  };

  const handleGoBack = () => {
    window.location.href = "/";
  };

  if (isCompleted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Merci !</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Votre questionnaire a été enregistré avec succès.
            </p>
          </div>
          <button
            onClick={handleGoBack}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition"
          >
            Retour au chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-950 dark:to-zinc-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Questionnaire de satisfaction
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Aidez-nous à améliorer votre expérience à la FIM
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 rounded-full h-2 bg-gray-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Counter */}
        <div className="mb-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          Question {currentQuestionIndex + 1} sur {satisfactionQuestions.length}
        </div>

        {/* Question Card */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion?.question}
          </h2>

          {currentQuestion?.type === "text" && (
            <TextInput onSubmit={handleTextAnswer} />
          )}

          {currentQuestion?.type === "choice" && currentQuestion.choices && (
            <ChoiceInput
              choices={currentQuestion.choices}
              onChoose={(choiceId, label) => handleChoiceAnswer(choiceId, label)}
            />
          )}

          {currentQuestion?.type === "rating" && (
            <RatingInput onRate={(label) => handleTextAnswer(label)} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Vos réponses restent confidentielles et servent uniquement à améliorer l'événement.
        </div>
      </div>
    </div>
  );
}

function TextInput({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText("");
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            handleSubmit();
          }
        }}
        placeholder="Écrivez votre réponse..."
        className="w-full rounded-lg border border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={4}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Continuer
      </button>
    </div>
  );
}

function ChoiceInput({
  choices,
  onChoose,
}: {
  choices: Array<{ choiceId: number; label: string; value: string }>;
  onChoose: (choiceId: number, label: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {choices.map((choice) => (
        <button
          key={choice.choiceId}
          onClick={() => onChoose(choice.choiceId, choice.label)}
          className="rounded-lg border-2 border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 text-left font-medium text-gray-900 dark:text-white hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-zinc-700 transition"
        >
          {choice.label}
        </button>
      ))}
    </div>
  );
}

function RatingInput({ onRate }: { onRate: (label: string) => void }) {
  const [rating, setRating] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => {
              setRating(star);
              onRate(String(star));
            }}
            className={`text-4xl transition ${
              star <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {rating === 0 ? "Cliquez sur une étoile" : `Vous avez sélectionné ${rating} étoile(s)`}
      </p>
    </div>
  );
}
