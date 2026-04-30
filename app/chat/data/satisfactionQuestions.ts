export type QuestionType = "text" | "choice" | "rating";

export type QuestionChoice = {
  choiceId: number;
  label: string;
  value: string;
};

export type SatisfactionQuestion = {
  questionId: number;
  question: string;
  type: QuestionType;
  choices?: QuestionChoice[];
};

export const satisfactionQuestions: SatisfactionQuestion[] = [
  {
    questionId: 101,
    question: "Quel est votre tranche d'âge ?",
    type: "choice",
    choices: [
      { choiceId: 1011, label: "-18", value: "under_18" },
      { choiceId: 1012, label: "18-25", value: "18_25" },
      { choiceId: 1013, label: "26-35", value: "26_35" },
      { choiceId: 1014, label: "36-50", value: "36_50" },
      { choiceId: 1015, label: "50+", value: "50_plus" },
    ],
  },
  {
    questionId: 102,
    question: "Quel est votre statut ?",
    type: "choice",
    choices: [
      { choiceId: 1021, label: "Étudiant", value: "student" },
      { choiceId: 1022, label: "Salarié", value: "employee" },
      { choiceId: 1023, label: "Entrepreneur", value: "entrepreneur" },
      { choiceId: 1024, label: "Autre", value: "other" },
    ],
  },
  {
    questionId: 103,
    question: "Est-ce votre première visite à la Foire Internationale de Madagascar ?",
    type: "choice",
    choices: [
      { choiceId: 1031, label: "Oui", value: "yes" },
      { choiceId: 1032, label: "Non", value: "no" },
    ],
  },
  {
    questionId: 104,
    question: "Pourquoi êtes-vous venu ?",
    type: "text",
  },
  {
    questionId: 105,
    question: "Notez l'organisation générale de l'événement (1 = très insatisfait, 5 = très satisfait)",
    type: "choice",
    choices: [
      { choiceId: 1051, label: "1", value: "1" },
      { choiceId: 1052, label: "2", value: "2" },
      { choiceId: 1053, label: "3", value: "3" },
      { choiceId: 1054, label: "4", value: "4" },
      { choiceId: 1055, label: "5", value: "5" },
    ],
  },
  {
    questionId: 106,
    question: "Avez-vous trouvé ce que vous cherchiez ?",
    type: "choice",
    choices: [
      { choiceId: 1061, label: "Oui", value: "yes" },
      { choiceId: 1062, label: "Partiellement", value: "partially" },
      { choiceId: 1063, label: "Non", value: "no" },
    ],
  },
  {
    questionId: 107,
    question: "Comment avez-vous entendu parler de l'événement ?",
    type: "choice",
    choices: [
      { choiceId: 1071, label: "Réseaux sociaux", value: "social_media" },
      { choiceId: 1072, label: "Affiches", value: "posters" },
      { choiceId: 1073, label: "Université", value: "university" },
      { choiceId: 1074, label: "Bouche-à-oreille", value: "word_of_mouth" },
      { choiceId: 1075, label: "Autre", value: "other" },
    ],
  },
  {
    questionId: 108,
    question: "Qu'avez-vous le plus apprécié ?",
    type: "text",
  },
  {
    questionId: 109,
    question: "Qu'est-ce qui pourrait être amélioré ?",
    type: "text",
  },
  {
    questionId: 110,
    question: "Reviendrez-vous l'année prochaine ?",
    type: "choice",
    choices: [
      { choiceId: 1101, label: "Oui", value: "yes" },
      { choiceId: 1102, label: "Non", value: "no" },
      { choiceId: 1103, label: "Peut-être", value: "maybe" },
    ],
  },
  {
    questionId: 111,
    question: "Recommanderiez-vous cet événement ?",
    type: "choice",
    choices: [
      { choiceId: 1111, label: "Oui", value: "yes" },
      { choiceId: 1112, label: "Non", value: "no" },
    ],
  },
];
