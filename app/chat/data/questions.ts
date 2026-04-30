export type QuestionType = "text" | "choice";

export type QuestionChoice = {
  choiceId: number;
  label: string;
  value: string;
};

export type GuidedQuestion = {
  questionId: number;
  question: string;
  type: QuestionType;
  choices?: QuestionChoice[];
};

export const guidedQuestions: GuidedQuestion[] = [
  {
    questionId: 1,
    question: "Qu'est-ce qui vous intéresse à la FIM ?",
    type: "text",
  },
  {
    questionId: 2,
    question: "Combien de temps pensez-vous rester à la FIM ?",
    type: "choice",
    choices: [
      { choiceId: 1, label: "Moins d'1h", value: "less_than_1h" },
      { choiceId: 2, label: "2h", value: "2h" },
      { choiceId: 3, label: "2h et plus", value: "2h_or_more" },
      { choiceId: 4, label: "Toute la journée", value: "all_day" },
    ],
  },
  {
    questionId: 3,
    question: "Que souhaitez-vous faire maintenant ?",
    type: "choice",
    choices: [
      {
        choiceId: 5,
        label: "Commencer la visite des stands",
        value: "start_visit",
      },
      { choiceId: 6, label: "Voir d'autres stands", value: "explore_more" },
      { choiceId: 7, label: "Terminer la visite guidée", value: "end_guide" },
    ],
  },
];
