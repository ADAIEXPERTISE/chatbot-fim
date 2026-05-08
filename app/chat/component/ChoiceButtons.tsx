"use client";

type ChoiceOption = {
  choiceId: number;
  label: string;
  horaire?: string;
  description?: string;
  type?:string;
  value: string;
};

type ChoiceButtonsProps = {
  choices: ChoiceOption[];
  onChoose: (choice: ChoiceOption) => void;
};

export default function ChoiceButtons({
  choices,
  onChoose,
}: ChoiceButtonsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 p-1 sm:grid-cols-2">
      {choices.map((choice) => (
        <button
          key={choice.choiceId}
          type="button"
          onClick={() => onChoose(choice)}
          className={` flex flex-col gap-1 rounded-lg border border-gray-200 bg-zinc-900 px-4 py-3 text-sm font-medium text-white ${choice.type == "Conférence" || choice.type == "Atelier" ? "text-left" : "text-center"} hover:text-zinc-800 shadow-sm transition hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-100`}
        >
          <span className={`${choice.type == "Conférence" || choice.type == "Atelier" ? 'font-bold ' :'' }`}>{choice.label}</span>
          {choice.description && <span>{choice.description}</span>}
          {choice.horaire && <span className="">{choice.horaire}</span>}
        </button>
      ))}
    </div>
  );
}
