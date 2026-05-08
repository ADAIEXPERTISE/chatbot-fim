export type QuestionType = "text" | "choice";

export type QuestionChoice = {
  choiceId: number;
  descritpion?:number
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
    question: "Qu'est-ce qui vous intéresse ?",
    type: "choice",
    choices: [
      { choiceId: 1, label: "Exposant", value: "exhibitor" },
      { choiceId: 2, label: "Sponsors", value: "sponsors" },
      { choiceId: 3, label: "Conférence", value: "Conférence" },
      { choiceId: 4, label: "Table ronde", value: "Table ronde" },
      { choiceId: 5, label: "Atelier", value: "Atelier" },
      { choiceId: 6, label: "Speed recruiting", value: "Speed recruiting" },
      { choiceId: 7, label: "Informations diverses", value: "Informations diverses" },
    ],
  },
];
