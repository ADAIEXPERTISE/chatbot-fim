// "use client";

// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion"; // Pour l'effet de rotation/glissement
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// import { Label } from "@/components/ui/label";

// // Tes questions (tu peux les charger via une API plus tard)
// const QUIZ_QUESTIONS = [
//   {
//     id: "q1",
//     question: "Quelle est votre principale attente ?",
//     options: ["Automatisation", "Analyse de données", "Support client"],
//   },
//   {
//     id: "q2",
//     question: "Quel framework utilisez-vous ?",
//     options: ["Next.js", "React Native", "Vue.js"],
//   },
//   {
//     id: "q2",
//     question: "Quel framework utilisez-vous ?",
//     options: ["Next.js", "React Native", "Vue.js"],
//   },
//   {
//     id: "q2",
//     question: "Quel framework utilisez-vous ?",
//     options: ["Next.js", "React Native", "Vue.js"],
//   },
//   // Ajoute tes 5 questions ici...
// ];

// export default function QuizPage() {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [answers, setAnswers] = useState<Record<string, string>>({});

//   const isLastStep = currentStep === QUIZ_QUESTIONS.length - 1;
//   const progressValue = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

//   const handleNext = () => {
//     if (!isLastStep) setCurrentStep((prev) => prev + 1);
//     else console.log("Envoi des réponses :", answers);
//   };

//   const handlePrev = () => setCurrentStep((prev) => Math.max(0, prev - 1));

//   return (
//     <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
//       <div className="w-full max-w-xl space-y-8">
//         {/* Header & Progression */}
//         <div className="text-center space-y-4">
//           <span className="text-[11px] uppercase tracking-[0.2em] text-[#B8956A] font-bold">
//             Étape {currentStep + 1} sur {QUIZ_QUESTIONS.length}
//           </span>
//           <Progress
//             value={progressValue}
//             className="h-1 bg-[#E2DDD8] transition-all duration-500"
//           />
//         </div>

//         {/* Carte Question avec Animation */}
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={currentStep}
//             initial={{ opacity: 0, x: 20 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -20 }}
//             transition={{ duration: 0.3 }}
//           >
//             <Card className="border-none text-black overflow-hidden rounded-lg">
//               <CardHeader className="pt-10 pb-6 px-10">
//                 <CardTitle className="font-serif text-3xl font-light leading-tight">
//                   {QUIZ_QUESTIONS[currentStep].question}
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="px-10 pb-10 space-y-6">
//                 <RadioGroup
//                   onValueChange={(value) =>
//                     setAnswers({
//                       ...answers,
//                       [QUIZ_QUESTIONS[currentStep].id]: value,
//                     })
//                   }
//                   value={answers[QUIZ_QUESTIONS[currentStep].id]}
//                   className="space-y-3"
//                 >
//                   {QUIZ_QUESTIONS[currentStep].options.map((option) => (
//                     <div
//                       key={option}
//                       className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border  hover:border-[#B8956A]/50 border-[#B8956A]/50 hover:bg-[#B8956A]/50 transition-colors cursor-pointer"
//                     >
//                       <RadioGroupItem
//                         value={option}
//                         id={option}
//                         className="border-[#B8956A] text-[#B8956A]"
//                       />
//                       <Label
//                         htmlFor={option}
//                         className="flex-1 cursor-pointer font-light text-sm"
//                       >
//                         {option}
//                       </Label>
//                     </div>
//                   ))}
//                 </RadioGroup>

//                 {/* Navigation */}
//                 <div className="flex items-center justify-between pt-6">
//                   <Button
//                     variant="ghost"
//                     onClick={handlePrev}
//                     disabled={currentStep === 0}
//                     className="text-[#7A7570] hover:text-zinc-900 hover:bg-white/5  border-zinc-900"
//                   >
//                     Précédent
//                   </Button>

//                   <Button
//                     onClick={handleNext}
//                     className="bg-zinc-900 hover:bg-zinc-900 text-white font-medium px-8 rounded-lg transition-transform active:scale-95"
//                   >
//                     {isLastStep ? "Finaliser" : "Suivant"}
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </motion.div>
//         </AnimatePresence>

//         <p className="text-center text-[12px] text-[#B0ABA5]">
//           © FIM 2026 · Vos données sont traitées avec soin.
//         </p>
//       </div>
//     </main>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// ─── Types (logique collègue) ─────────────────────────────────────────────────

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

// ─── Helper : questions conditionnelles ──────────────────────────────────────

function getVisibleQuestions(
  all: SatisfactionQuestion[],
  answers: SurveyAnswer[],
): SatisfactionQuestion[] {
  return all.filter((q) => {
    if (!q.dependsOnQuestionId || !q.dependsOnResponse) return true;
    const dep = answers.find((a) => a.questionId === q.dependsOnQuestionId);
    if (!dep) return false;
    return (
      dep.response.trim().toLowerCase() ===
      q.dependsOnResponse.trim().toLowerCase()
    );
  });
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SatisfactionPage() {
  const [questions, setQuestions] = useState<SatisfactionQuestion[]>([]);
  const [filtered, setFiltered] = useState<SatisfactionQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
  const [direction, setDirection] = useState(1); // 1=suivant, -1=précédent
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const currentQuestion = filtered[currentStep];
  const isLastStep = currentStep === filtered.length - 1;
  const progressValue =
    filtered.length > 0 ? ((currentStep + 1) / filtered.length) * 100 : 0;

  // ── Fetch questions depuis l'API ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/satisfaction");
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!data.success || !Array.isArray(data.questions)) throw new Error();
        setQuestions(data.questions);
        setFiltered(getVisibleQuestions(data.questions, []));
      } catch {
        setFetchError("Impossible de charger les questions pour le moment.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Enregistre une réponse et avance ──────────────────────────────────────
  function pushAnswer(newAnswer: SurveyAnswer) {
    const newAnswers = [
      ...answers.filter((a) => a.questionId !== newAnswer.questionId),
      newAnswer,
    ];
    setAnswers(newAnswers);
    const newFiltered = getVisibleQuestions(questions, newAnswers);
    setFiltered(newFiltered);
    goNext(newFiltered);
  }

  function goNext(newFiltered?: SatisfactionQuestion[]) {
    const list = newFiltered ?? filtered;
    setDirection(1);
    if (currentStep < list.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      submitSurvey();
    }
  }

  function goPrev() {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }

  async function submitSurvey() {
    try {
      await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      setIsCompleted(true);
    } catch (err) {
      console.error("Erreur envoi :", err);
    }
  }

  // ── Variants animation (ton style, direction dynamique) ───────────────────
  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -24 : 24 }),
  };

  // ─── États spéciaux ───────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-xl space-y-8">
          <div className="text-center space-y-4">
            <div className="h-3 w-24 bg-[#E2DDD8] rounded-full mx-auto animate-pulse" />
            <Progress value={0} className="h-1 bg-[#E2DDD8]" />
          </div>
          <Card className="border-none overflow-hidden rounded-lg shadow-sm">
            <CardHeader className="pt-10 pb-6 px-10">
              <div className="h-8 w-3/4 bg-[#F2F0EF] rounded-lg animate-pulse" />
            </CardHeader>
            <CardContent className="px-10 pb-10 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-[#F2F0EF] rounded-xl animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <Card className="border-none rounded-lg shadow-sm max-w-md w-full">
          <CardContent className="pt-10 pb-10 px-10 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <span className="text-red-500 text-xl">!</span>
            </div>
            <p className="text-zinc-600 text-sm">{fetchError}</p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-zinc-900 text-white w-full rounded-lg"
            >
              Retour
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (isCompleted) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          <Card className="border-none rounded-lg shadow-sm">
            <CardContent className="pt-10 pb-10 px-10 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#F2F0EF] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#B8956A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-serif text-3xl font-light text-zinc-900">
                  Merci !
                </h2>
                <p className="mt-2 text-sm text-[#7A7570]">
                  Votre questionnaire a été enregistré avec succès.
                </p>
              </div>
              <Button
                onClick={() => (window.location.href = "/")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-8 rounded-lg transition-transform active:scale-95"
              >
                Retour au chat
              </Button>
            </CardContent>
          </Card>
          <p className="text-center text-[12px] text-[#B0ABA5] mt-6">
            © FIM 2026 · Vos données sont traitées avec soin.
          </p>
        </motion.div>
      </main>
    );
  }

  // ─── Formulaire principal — TON design ────────────────────────────────────

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-xl space-y-8">
        {/* Header & Progression */}
        <div className="text-center space-y-4">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#B8956A] font-bold">
            Étape {currentStep + 1} sur {filtered.length}
          </span>
          <div className="relative h-1 bg-[#E2DDD8] rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-[#B8956A] rounded-full"
              animate={{ width: `${progressValue}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Carte Question avec animation */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion?.questionId ?? currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none text-black overflow-hidden rounded-lg shadow-sm">
              <CardHeader className="pt-10 pb-6 px-10">
                <CardTitle className="font-serif text-3xl font-light leading-tight text-zinc-900">
                  {currentQuestion?.question}
                </CardTitle>
              </CardHeader>

              <CardContent className="px-10 pb-10 space-y-6">
                {/* ── text : textarea libre ── */}
                {currentQuestion?.type === "text" && (
                  <TextInput
                    onSubmit={(text) =>
                      pushAnswer({
                        questionId: currentQuestion.questionId,
                        questionType: "text",
                        response: text,
                      })
                    }
                    onPrev={goPrev}
                    showPrev={currentStep > 0}
                    isLast={isLastStep}
                  />
                )}

                {/* ── choice : radio ── */}
                {(currentQuestion?.type === "choice" ||
                  currentQuestion?.type === "scale") &&
                  currentQuestion.choices && (
                    <ChoiceInput
                      choices={currentQuestion.choices}
                      onChoose={(choiceId, label) =>
                        pushAnswer({
                          questionId: currentQuestion.questionId,
                          questionType: currentQuestion.type,
                          response: label,
                          choiceId,
                        })
                      }
                      onPrev={goPrev}
                      showPrev={currentStep > 0}
                    />
                  )}

                {/* ── multi : cases à cocher ── */}
                {currentQuestion?.type === "multi" &&
                  currentQuestion.choices && (
                    <MultiInput
                      choices={currentQuestion.choices}
                      onSubmit={(choiceIds, labels) =>
                        pushAnswer({
                          questionId: currentQuestion.questionId,
                          questionType: "multi",
                          response: labels.join(", "),
                          choiceIds,
                        })
                      }
                      onPrev={goPrev}
                      showPrev={currentStep > 0}
                      isLast={isLastStep}
                    />
                  )}

                {/* ── rating : étoiles ── */}
                {currentQuestion?.type === "scale" &&
                  !currentQuestion.choices && (
                    <RatingInput
                      onRate={(choiceId, label) =>
                        pushAnswer({
                          questionId: currentQuestion.questionId,
                          questionType: "rating",
                          response: label,
                          choiceId,
                        })
                      }
                      onPrev={goPrev}
                      showPrev={currentStep > 0}
                    />
                  )}

                {/* ── rating avec choices ── */}
                {currentQuestion?.type === "rating" &&
                  currentQuestion.choices && (
                    <ChoiceInput
                      choices={currentQuestion.choices}
                      onChoose={(choiceId, label) =>
                        pushAnswer({
                          questionId: currentQuestion.questionId,
                          questionType: "rating",
                          response: label,
                          choiceId,
                        })
                      }
                      onPrev={goPrev}
                      showPrev={currentStep > 0}
                    />
                  )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <p className="text-center text-[12px] text-[#B0ABA5]">
          © FIM 2026 · Vos données sont traitées avec soin.
        </p>
      </div>
    </main>
  );
}

// ─── Composants de saisie — TON style ────────────────────────────────────────

type NavProps = { onPrev: () => void; showPrev: boolean; isLast?: boolean };

// ── Textarea (réponse libre) ──────────────────────────────────────────────────
function TextInput({
  onSubmit,
  onPrev,
  showPrev,
  isLast,
}: { onSubmit: (t: string) => void } & NavProps) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Écrivez votre réponse…"
        rows={4}
        className="w-full rounded-xl border border-[#E2DDD8] bg-[#FDFAF7] p-4 text-sm text-zinc-900 placeholder:text-[#B0ABA5] focus:outline-none focus:ring-2 focus:ring-[#B8956A]/30 focus:border-[#B8956A] resize-none transition"
      />
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={!showPrev}
          className="text-[#7A7570] hover:text-zinc-900 disabled:opacity-0"
        >
          Précédent
        </Button>
        <Button
          onClick={() => {
            if (text.trim()) onSubmit(text.trim());
          }}
          disabled={!text.trim()}
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-8 rounded-lg transition-transform active:scale-95 disabled:opacity-40"
        >
          {isLast ? "Finaliser" : "Suivant"}
        </Button>
      </div>
    </div>
  );
}

// ── Radio (choice / scale) ────────────────────────────────────────────────────
function ChoiceInput({
  choices,
  onChoose,
  onPrev,
  showPrev,
}: {
  choices: QuestionChoice[];
  onChoose: (id: number, label: string) => void;
} & Omit<NavProps, "isLast">) {
  const [selected, setSelected] = useState<string>("");
  return (
    <div className="space-y-6">
      <RadioGroup
        value={selected}
        onValueChange={setSelected}
        className="space-y-3"
      >
        {choices.map((c) => (
          <div
            key={c.choiceId}
            onClick={() => setSelected(c.label)}
            className={`flex items-center space-x-3 p-4 rounded-xl border transition-colors cursor-pointer ${
              selected === c.label
                ? "border-[#B8956A] bg-[#B8956A]/10"
                : "border-[#E2DDD8] hover:border-[#B8956A]/50 hover:bg-[#B8956A]/5"
            }`}
          >
            <RadioGroupItem
              value={c.label}
              id={`${c.choiceId}`}
              className="border-[#B8956A] text-[#B8956A]"
            />
            <Label
              htmlFor={`${c.choiceId}`}
              className="flex-1 cursor-pointer font-light text-sm text-zinc-900"
            >
              {c.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={!showPrev}
          className="text-[#7A7570] hover:text-zinc-900 disabled:opacity-0"
        >
          Précédent
        </Button>
        <Button
          onClick={() => {
            const choice = choices.find((c) => c.label === selected);
            if (choice) onChoose(choice.choiceId, choice.label);
          }}
          disabled={!selected}
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-8 rounded-lg transition-transform active:scale-95 disabled:opacity-40"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

// ── Checkbox (multi) ──────────────────────────────────────────────────────────
function MultiInput({
  choices,
  onSubmit,
  onPrev,
  showPrev,
  isLast,
}: {
  choices: QuestionChoice[];
  onSubmit: (ids: number[], labels: string[]) => void;
} & NavProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggle = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {choices.map((c) => (
          <div
            key={c.choiceId}
            onClick={() => toggle(c.choiceId)}
            className={`flex items-center space-x-3 p-4 rounded-xl border transition-colors cursor-pointer ${
              selectedIds.includes(c.choiceId)
                ? "border-[#B8956A] bg-[#B8956A]/10"
                : "border-[#E2DDD8] hover:border-[#B8956A]/50 hover:bg-[#B8956A]/5"
            }`}
          >
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                selectedIds.includes(c.choiceId)
                  ? "border-[#B8956A] bg-[#B8956A]"
                  : "border-[#B8956A]/40"
              }`}
            >
              {selectedIds.includes(c.choiceId) && (
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span className="flex-1 font-light text-sm text-zinc-900">
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={!showPrev}
          className="text-[#7A7570] hover:text-zinc-900 disabled:opacity-0"
        >
          Précédent
        </Button>
        <Button
          onClick={() => {
            const labels = choices
              .filter((c) => selectedIds.includes(c.choiceId))
              .map((c) => c.label);
            if (selectedIds.length > 0) onSubmit(selectedIds, labels);
          }}
          disabled={selectedIds.length === 0}
          className="bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-8 rounded-lg transition-transform active:scale-95 disabled:opacity-40"
        >
          {isLast
            ? "Finaliser"
            : `Suivant${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`}
        </Button>
      </div>
    </div>
  );
}

// ── Étoiles (rating) ──────────────────────────────────────────────────────────
function RatingInput({
  onRate,
  onPrev,
  showPrev,
}: { onRate: (id: number, label: string) => void } & Omit<NavProps, "isLast">) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              setSelected(star);
              onRate(star, String(star));
            }}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <span
              className={`text-5xl transition-colors ${
                (hovered ?? selected ?? 0) >= star
                  ? "text-[#B8956A]"
                  : "text-[#E2DDD8]"
              }`}
            >
              ★
            </span>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-[#7A7570]">
        {selected
          ? `${selected} étoile${selected > 1 ? "s" : ""}`
          : "Sélectionnez une note"}
      </p>
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={!showPrev}
          className="text-[#7A7570] hover:text-zinc-900 disabled:opacity-0"
        >
          Précédent
        </Button>
      </div>
    </div>
  );
}
