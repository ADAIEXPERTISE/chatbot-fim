"use client";

import { useEffect, useRef, useState } from "react";
import InputChatbox from "./chat/component/InputChatbox";
import HeaderChatBox from "./chat/component/HeaderChatbox";
import TypingBubble from "./chat/component/TypingBubble";
import ChoiceButtons from "./chat/component/ChoiceButtons";
import RecommendationBubble from "./chat/component/RecommendationBubble";
import { guidedQuestions, QuestionChoice } from "./chat/data/questions";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
};

type Stand = {
  standCode: string;
  exhibitorId: number;
  exhibitorName?: string;
  posX: number;
  posY: number;
  status: string;
};

type Answer = {
  questionId: number;
  response: string;
  choiceId?: number;
  value?: string;
};

type AgentCardProps = {
  id: string | number;
  name: string;
  description: string;
  imageUrl: string | "";
  color: string | "blue-500";
};

export default function ChatBox() {
  // prends les identifiants de robot
  const [currentAI, setCurrentAI] = useState<AgentCardProps | null>({
    id: 475,
    name: "Wally FIM",
    description:
      "Tri intelligent des e‑mails, synthèse des réunions, préparation des réponses, priorisation des actions, agenda augmenté.",
    imageUrl: "/image/848c342a56e7854dec45b9349c21dfe5.gif",
    color: "shadow-green-500",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isGuided, setIsGuided] = useState(true);
  const [recommendations, setRecommendations] = useState<Stand[]>([]);

  const currentQuestion = guidedQuestions[currentQuestionIndex];

  const goToSatisfactionSurvey = () => {
    // Rediriger vers la page de satisfaction
    window.location.href = "/satisfaction";
  };

  const isEndOfVisitMessage = (message: string) => {
    const normalized = message.toLowerCase();
    return [
      "fini",
      "terminé",
      "terminée",
      "j'ai fini",
      "j'ai terminé",
      "c'est fini",
      "fin de visite",
      "j'ai terminé la visite",
      "j'ai fini la visite",
    ].some((term) => normalized.includes(term));
  };

  // prends en charge les messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Salut ! Je suis Wally FIM. Je vais commencer par quelques questions pour mieux connaître vos centres d'intérêt.",
      sender: "bot",
    },
    {
      id: 2,
      text: guidedQuestions[0].question,
      sender: "bot",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 50);

    return () => clearTimeout(timeout);
  }, [messages]);

  const handleSendMessage = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;

    if (!isGuided && isEndOfVisitMessage(text)) {
      const userMsg: Message = {
        id: Date.now(),
        text,
        sender: "user",
      };
      setMessages((prev) => [...prev, userMsg]);
      
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "Merci de votre visite ! Nous vous redirigeons vers le questionnaire de satisfaction.",
            sender: "bot",
          },
        ]);
      }, 300);

      setTimeout(() => {
        goToSatisfactionSurvey();
      }, 1500);
      return;
    }

    if (isGuided && currentQuestion) {
      const userMsg: Message = {
        id: Date.now(),
        text,
        sender: "user",
      };

      setMessages((prev) => [...prev, userMsg]);

      // Upsert la réponse (utile si on redemande les centres d'intérêt)
      const newAnswers = [
        ...answers.filter((a) => a.questionId !== currentQuestion.questionId),
        { questionId: currentQuestion.questionId, response: text },
      ];
      setAnswers(newAnswers);

      // Si c'est la première question (centres d'intérêt), récupérer les recommandations
      if (currentQuestion.questionId === 1) {
        setIsLoading(true);
        try {
          const res = await fetch("/api/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ interests: text }),
          });

          const data = await res.json();
          const fetchedRecs: Stand[] = Array.isArray(data.recommendations)
            ? data.recommendations.flatMap((rec: any) => 
                rec.stands?.map((stand: any) => ({
                  standCode: stand.standCode,
                  exhibitorId: rec.exhibitorId,
                  exhibitorName: rec.exhibitorName,
                  posX: stand.position?.x || 0,
                  posY: stand.position?.y || 0,
                  status: stand.status || 'confirmed',
                })) || []
              )
            : [];

          // Si on ne trouve rien, ne pas enchaîner sur le temps : redemander les centres d'intérêt
          if (fetchedRecs.length === 0) {
            setRecommendations([]);
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 1,
                  text:
                    "Je n'ai pas trouvé de stands correspondant. Pouvez-vous préciser ce que vous voulez voir à la FIM ? Quels sont vos centres d'intérêt ?",
                  sender: "bot",
                },
              ]);
            }, 300);

            setCurrentQuestionIndex(0);
            return;
          }

          setRecommendations(fetchedRecs);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: "recommendations",
              sender: "bot",
            },
          ]);
        } catch (error) {
          console.error("Error fetching recommendations:", error);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 1,
                text:
                  "Je n'arrive pas à récupérer les recommandations pour le moment. Pouvez-vous redire vos centres d'intérêt ?",
                sender: "bot",
              },
            ]);
          }, 300);

          setCurrentQuestionIndex(0);
          return;
        } finally {
          setIsLoading(false);
        }

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              text: guidedQuestions[1].question,
              sender: "bot",
            },
          ]);
        }, 500);

        setCurrentQuestionIndex(1);
        return;
      }

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < guidedQuestions.length) {
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: guidedQuestions[nextIndex].question,
              sender: "bot",
            },
          ]);
        }, 300);
      } else {
        setIsGuided(false);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: "Merci ! Je garde vos centres d'intérêt en mémoire. Vous pouvez maintenant discuter librement avec moi ou me demander des stands à visiter.",
              sender: "bot",
            },
          ]);
        }, 300);
      }
      return;
    }

    const userMsg: Message = {
      id: Date.now(),
      text,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMsg]);

    // 👉 ADD LOADING MESSAGE
    const loadingId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        text: "thinking",
        sender: "bot",
      },
    ]);

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", text);
      formData.append("agentId", String(currentAI?.id));
      formData.append("agentName", currentAI?.name || "Unknown");

      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const fullText = data.reply || "No response from bot";
      let index = 0;

      // replace loading bubble with empty bot message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === loadingId ? { ...msg, text: "" } : msg)),
      );

      const interval = setInterval(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === loadingId
              ? { ...msg, text: fullText.slice(0, index + 1) }
              : msg,
          ),
        );

        index++;

        if (index >= fullText.length) {
          clearInterval(interval);
          setIsLoading(false);

          // Si des recommandations sont incluses dans la réponse, les afficher
          if (data.stands && data.stands.length > 0) {
            setTimeout(() => {
              // Convertir les stands du nouveau format vers l'ancien format attendu
              const convertedStands: Stand[] = data.stands.map((stand: any) => ({
                standCode: stand.standCode || 'N/A',
                exhibitorId: 0,
                exhibitorName: stand.exhibitorName,
                posX: stand.position?.x || 0,
                posY: stand.position?.y || 0,
                status: "confirmed",
              }));

              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now() + 1,
                  text: "recommendations",
                  sender: "bot",
                },
              ]);
              setRecommendations(convertedStands);

              // Après avoir affiché les recommandations, poser la question suivante
              setTimeout(() => {
                setIsGuided(true);
                setCurrentQuestionIndex(2); // Question "Que souhaitez-vous faire maintenant ?"
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now() + 2,
                    text: guidedQuestions[2].question,
                    sender: "bot",
                  },
                ]);
              }, 2000); // Attendre 2 secondes après l'affichage des recommandations
            }, 500);
          }
        }
      }, 20);
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                text: "Erreur de connexion à n8n",
              }
            : msg,
        ),
      );

      setIsLoading(false);
    }
  };

  const handleChooseOption = (choice: QuestionChoice) => {
    if (!currentQuestion) return;

    const userMsg: Message = {
      id: Date.now(),
      text: choice.label,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMsg]);
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.questionId,
        response: choice.label,
        choiceId: choice.choiceId,
        value: choice.value,
      },
    ];
    setAnswers(newAnswers);

    // Si c'est la dernière question (question 3), traiter selon le choix
    if (currentQuestion.questionId === 3) {
      if (choice.value === "end_guide") {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: "Merci de votre visite ! Nous vous redirigeons vers le questionnaire de satisfaction.",
              sender: "bot",
            },
          ]);
        }, 300);
        
        setTimeout(() => {
          goToSatisfactionSurvey();
        }, 1500);
        return;
      } else if (choice.value === "explore_more") {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: "Dites-moi ce qui vous intéresse et je vous proposerai d'autres stands à découvrir !",
              sender: "bot",
            },
          ]);
        }, 300);
        setIsGuided(false);
        return;
      } else if (choice.value === "start_visit") {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              text: `Parfait ! Basé sur vos intérêts, voici les stands recommandés à visiter en ${newAnswers.find((a) => a.questionId === 2)?.response || "ce temps"}. Cliquez sur un stand pour voir sa localisation sur la carte.`,
              sender: "bot",
            },
            {
              id: Date.now() + 2,
              text: "recommendations",
              sender: "bot",
            },
          ]);
        }, 300);
        setIsGuided(false);
        return;
      }
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < guidedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: guidedQuestions[nextIndex].question,
            sender: "bot",
          },
        ]);
      }, 300);
    } else {
      setIsGuided(false);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: "Merci ! Je garde vos centres d'intérêt en mémoire. Vous pouvez maintenant discuter librement avec moi ou me demander des stands à visiter.",
            sender: "bot",
          },
        ]);
      }, 300);
    }
  };

  const handleSelectStand = (stand: Stand) => {
    console.log("Stand sélectionné:", stand);

    // TODO: Naviguer vers la carte avec le stand sélectionné
    // Pour l'instant, on ne déclenche pas le mode guidé
  };

  const typeMessage = (text: string, messageId: number) => {
    let index = 0;

    const interval = setInterval(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: text.slice(0, index + 1) }
            : msg,
        ),
      );

      index++;

      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 20); // speed (lower = faster)
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-50 p-2 rounded-lg font-sans dark:bg-[#F2F0EF]">
      <main className="flex flex-1 w-full flex-col bg-white dark:bg-white max-w-4xl mx-auto shadow-sm overflow-hidden rounded-lg">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* --- MESSENGER STYLE HEADER --- */}
          <HeaderChatBox
            id={currentAI ? currentAI.id : 0}
            name={currentAI ? currentAI.name : "robot 47"}
            description={currentAI ? currentAI.description : "nothing to show"}
            imageUrl={currentAI?.imageUrl}
          />
          {/* --- MESSAGE BOX BODY --- */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.text === "thinking" ? (
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-bl-none">
                  <TypingBubble />
                </div>
              ) : msg.text === "recommendations" ? (
                <RecommendationBubble
                  stands={recommendations}
                  onSelectStand={handleSelectStand}
                />
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-[#2d4a53] text-white rounded-br-none"
                      : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
        {/* INPUT BOX */}
        {isGuided && currentQuestion?.type === "choice" && currentQuestion.choices ? (
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 dark:bg-zinc-950">
            <ChoiceButtons choices={currentQuestion.choices} onChoose={handleChooseOption} />
          </div>
        ) : null}

        <InputChatbox
          id={currentAI ? currentAI.id : 0}
          name={currentAI ? currentAI.name : "Robot"}
          placeholder={
            isGuided
              ? currentQuestion?.type === "text"
                ? currentQuestion.question
                : "Choisissez une option ou écrivez votre réponse"
              : "Demande-moi un stand ou pose-moi une question"
          }
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}
