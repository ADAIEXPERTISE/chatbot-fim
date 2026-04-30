"use client";

import { useEffect, useState } from "react";

type QuestionType = "text" | "choice" | "multi" | "scale" | "rating";

type QuestionChoice = {
  choiceId: number;
  label: string;
};

type SatisfactionQuestion = {
  questionId: number;
  question: string;
  type: QuestionType;
  dependsOnQuestionId?: number | null;
  dependsOnResponse?: string | null;
  choices?: QuestionChoice[];
};

type SurveyAnswer = {
  questionId: number;
  questionType: QuestionType;
  response: string;
  choiceId?: number;
  choiceIds?: number[];
};

export default function SatisfactionPage() {
  const [questions, setQuestions] = useState<SatisfactionQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<SatisfactionQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const getVisibleQuestions = (allQuestions: SatisfactionQuestion[], givenAnswers: SurveyAnswer[]): SatisfactionQuestion[] => {
    return allQuestions.filter((q) => {
      if (!q.dependsOnQuestionId || !q.dependsOnResponse) {
        return true;
      }
      const dependencyAnswer = givenAnswers.find((a) => a.questionId === q.dependsOnQuestionId);
      if (!dependencyAnswer) {
        return false;
      }
      // Normalize both strings for comparison (trim and lowercase)
      const normalizedResponse = dependencyAnswer.response?.trim().toLowerCase() || '';
      const normalizedDependent = q.dependsOnResponse.trim().toLowerCase();
      
      // Debug log
      if (q.dependsOnQuestionId) {
        console.log(`Question ${q.questionId}: checking if "${normalizedResponse}" === "${normalizedDependent}"`, normalizedResponse === normalizedDependent);
      }
      
      return normalizedResponse === normalizedDependent;
    });
  };

  const currentQuestion = filteredQuestions[currentQuestionIndex];
  const progress = filteredQuestions.length > 0 ? ((currentQuestionIndex + 1) / filteredQuestions.length) * 100 : 0;

  const handleTextAnswer = (text: string) => {
    if (!currentQuestion) return;
    const newAnswers = answers.filter((a) => a.questionId !== currentQuestion.questionId);
    newAnswers.push({
      questionId: currentQuestion.questionId,
      questionType: currentQuestion.type,
      response: text,
    });
    setAnswers(newAnswers);
    const newFiltered = getVisibleQuestions(questions, newAnswers);
    setFilteredQuestions(newFiltered);
    handleNext(newFiltered);
  };

  const handleChoiceAnswer = (choiceId: number, label: string) => {
    if (!currentQuestion) return;
    const newAnswers = answers.filter((a) => a.questionId !== currentQuestion.questionId);
    newAnswers.push({
      questionId: currentQuestion.questionId,
      questionType: currentQuestion.type,
      response: label,
      choiceId,
    });
    setAnswers(newAnswers);
    const newFiltered = getVisibleQuestions(questions, newAnswers);
    setFilteredQuestions(newFiltered);
    handleNext(newFiltered);
  };

  const handleMultiChoiceAnswer = (choiceIds: number[], labels: string[]) => {
    if (!currentQuestion) return;
    const newAnswers = answers.filter((a) => a.questionId !== currentQuestion.questionId);
    newAnswers.push({
      questionId: currentQuestion.questionId,
      questionType: currentQuestion.type,
      response: labels.join(', '),
      choiceIds,
    });
    setAnswers(newAnswers);
    const newFiltered = getVisibleQuestions(questions, newAnswers);
    setFilteredQuestions(newFiltered);
    handleNext(newFiltered);
  };

  const handleNext = (newFilteredQuestions?: SatisfactionQuestion[]) => {
    const questionsToUse = newFilteredQuestions || filteredQuestions;
    if (currentQuestionIndex < questionsToUse.length - 1) {
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

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/satisfaction");
        if (!response.ok) {
          throw new Error("Impossible de charger les questions de satisfaction.");
        }

        const data = await response.json();
        if (!data.success || !Array.isArray(data.questions)) {
          throw new Error("Format de question invalide reçu du serveur.");
        }

        setQuestions(data.questions);
        setFilteredQuestions(getVisibleQuestions(data.questions, []));
        setFetchError(null);
      } catch (error) {
        console.error("Erreur de chargement des questions :", error);
        setFetchError("Impossible de charger les questions de satisfaction pour le moment.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, []);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
          <div className="text-center text-gray-700 dark:text-gray-200">Chargement des questions...</div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-950 dark:to-zinc-900">
        <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Erreur</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{fetchError}</p>
          </div>
          <button
            onClick={handleGoBack}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

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
          Question {currentQuestionIndex + 1} sur {filteredQuestions.length}
        </div>

        {/* Question Card */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {currentQuestion?.question || "Aucune question disponible."}
          </h2>

          {!currentQuestion && (
            <p className="text-gray-600 dark:text-gray-400">Aucune question n'a été trouvée pour ce questionnaire.</p>
          )}

          {currentQuestion?.type === "text" && (
            <TextInput onSubmit={handleTextAnswer} />
          )}

          {currentQuestion?.type === "choice" && currentQuestion.choices && (
            <ChoiceInput
              choices={currentQuestion.choices}
              onChoose={(choiceId, label) => handleChoiceAnswer(choiceId, label)}
            />
          )}

          {currentQuestion?.type === "multi" && currentQuestion.choices && (
            <MultiChoiceInput
              choices={currentQuestion.choices}
              onSubmit={(choiceIds, labels) => handleMultiChoiceAnswer(choiceIds, labels)}
            />
          )}

          {currentQuestion?.type === "scale" && (
            <ScaleInput
              choices={currentQuestion.choices}
              onRate={(choiceId, label) => handleChoiceAnswer(choiceId, label)}
            />
          )}

          {currentQuestion?.type === "rating" && (
            <RatingInput onRate={(choiceId, label) => handleChoiceAnswer(choiceId, label)} />
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
  choices: QuestionChoice[];
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

function MultiChoiceInput({
  choices,
  onSubmit,
}: {
  choices: QuestionChoice[];
  onSubmit: (choiceIds: number[], labels: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleChoice = (choiceId: number) => {
    setSelectedIds((prev) =>
      prev.includes(choiceId)
        ? prev.filter((id) => id !== choiceId)
        : [...prev, choiceId]
    );
  };

  const handleSubmit = () => {
    const selectedLabels = choices
      .filter((choice) => selectedIds.includes(choice.choiceId))
      .map((choice) => choice.label);

    if (selectedIds.length > 0) {
      onSubmit(selectedIds, selectedLabels);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {choices.map((choice) => (
          <button
            key={choice.choiceId}
            type="button"
            onClick={() => toggleChoice(choice.choiceId)}
            className={`rounded-lg border-2 p-4 text-left font-medium transition ${
              selectedIds.includes(choice.choiceId)
                ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-900/20 dark:text-white'
                : 'border-gray-200 bg-white text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={selectedIds.length === 0}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Continuer
      </button>
    </div>
  );
}

function ScaleInput({
  choices,
  onRate,
}: {
  choices?: QuestionChoice[];
  onRate: (choiceId: number, label: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const scaleOptions = choices && choices.length > 0
    ? choices.map((choice) => ({ choiceId: choice.choiceId, label: choice.label }))
    : [1, 2, 3, 4, 5].map((value) => ({ choiceId: value, label: String(value) }));

  const handleSubmit = () => {
    const selectedOption = scaleOptions.find((option) => Number(option.label) === selected);
    if (selectedOption) {
      onRate(selectedOption.choiceId, selectedOption.label);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {scaleOptions.map((option) => (
          <label
            key={option.choiceId}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition ${
              selected === Number(option.label)
                ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-900/10 dark:text-white'
                : 'border-gray-200 bg-white text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'
            }`}
          >
            <input
              type="radio"
              name="scale"
              value={option.label}
              checked={selected === Number(option.label)}
              onChange={() => setSelected(Number(option.label))}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-lg font-medium">{option.label}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={selected === null}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Continuer
      </button>
      {selected !== null && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Vous avez choisi {selected} sur 5
        </p>
      )}
    </div>
  );
}

function RatingInput({
  choices,
  onRate,
}: {
  choices?: QuestionChoice[];
  onRate: (choiceId: number, label: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  if (choices && choices.length > 0) {
    return (
      <div className="grid gap-3">
        {choices.map((choice) => (
          <button
            key={choice.choiceId}
            type="button"
            onClick={() => {
              setSelected(choice.choiceId);
              onRate(choice.choiceId, choice.label);
            }}
            className={`rounded-lg border-2 p-4 text-left font-medium transition ${
              selected === choice.choiceId
                ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-500 dark:bg-blue-900/20 dark:text-white'
                : 'border-gray-200 bg-white text-gray-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white'
            }`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => {
              setSelected(star);
              onRate(star, String(star));
            }}
            className={`text-4xl transition ${
              selected && star <= selected ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {selected === null ? 'Cliquez sur une étoile' : `Vous avez sélectionné ${selected} étoile(s)`}
      </p>
    </div>
  );
}
