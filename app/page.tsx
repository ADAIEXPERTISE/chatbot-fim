"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import InputChatbox from "./chat/component/InputChatbox";
import HeaderChatBox from "./chat/component/HeaderChatbox";
import TypingBubble from "./chat/component/TypingBubble";
import ChoiceButtons from "./chat/component/ChoiceButtons";
import { guidedQuestions, QuestionChoice, GuidedQuestion } from "./chat/data/questions";

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
  zoneName?: string;
};

type ExhibitorWithStands = {
  exhibitorId: number;
  exhibitorName: string;
  stands: Stand[];
};

type EventItem = {
  eventId: string;
  eventDate: string;
  dayLabel: string;
  eventType: string;
  title: string;
  venueName: string;
  startTime: string;
  endTime: string;
  organizerOrBrand: string;
  targetAudience: string;
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
  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);
  const [keywordChoices, setKeywordChoices] = useState<QuestionChoice[] | null>(null);
  const [showKeywordQuestion, setShowKeywordQuestion] = useState(false);
  const [exhibitorChoices, setExhibitorChoices] = useState<QuestionChoice[] | null>(null);
  const [showExhibitorQuestion, setShowExhibitorQuestion] = useState(false);
  const [exhibitorsList, setExhibitorsList] = useState<Stand[]>([]);
  const [selectedExhibitorForModal, setSelectedExhibitorForModal] = useState<Stand | ExhibitorWithStands | null>(null);
  const [showExhibitorModal, setShowExhibitorModal] = useState(false);
  const [sponsorChoices, setSponsorChoices] = useState<QuestionChoice[] | null>(null);
  const [showSponsorQuestion, setShowSponsorQuestion] = useState(false);
  const [sponsorsList, setSponsorsList] = useState<Stand[]>([]);
  const [infoChoices, setInfoChoices] = useState<QuestionChoice[] | null>(null);
  const [showInfoQuestion, setShowInfoQuestion] = useState(false);
  const [conferenceChoices, setConferenceChoices] = useState<QuestionChoice[] | null>(null);
  const [showConferenceQuestion, setShowConferenceQuestion] = useState(false);
  const [conferencesList, setConferencesList] = useState<Array<{ eventId: string; title: string; startTime: string; endTime: string; venueName: string; eventDate: string; organizerOrBrand: string }>>([]);
  const [foodCourtChoices, setFoodCourtChoices] = useState<QuestionChoice[] | null>(null);
  const [showFoodCourtQuestion, setShowFoodCourtQuestion] = useState(false);
  const [foodCourtList, setFoodCourtList] = useState<Stand[]>([]);
  const [showExhibitorMapModal, setShowExhibitorMapModal] = useState(false);
  const [showContinueChoiceModal, setShowContinueChoiceModal] = useState(false);
  const eventDate = new Date().toISOString().split('T')[0];
  const messageIdRef = useRef(2);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateMessageId = (): number => {
    messageIdRef.current += 1;
    return messageIdRef.current;
  };

  const formatFrenchDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const keywordQuestion: GuidedQuestion | null = showKeywordQuestion
    ? {
        questionId: 100,
        question: "Quel domaine vous intéresse ?",
        type: "choice",
        choices: keywordChoices || [],
      }
    : null;

  const exhibitorQuestion: GuidedQuestion | null = showExhibitorQuestion
    ? {
        questionId: 101,
        question: "Choisissez un exposant :",
        type: "choice",
        choices: exhibitorChoices || [],
      }
    : null;

  const sponsorQuestion: GuidedQuestion | null = showSponsorQuestion
    ? {
        questionId: 103,
        question: "Choisissez un sponsor :",
        type: "choice",
        choices: sponsorChoices || [],
      }
    : null;

  const infoQuestion: GuidedQuestion | null = showInfoQuestion
    ? {
        questionId: 104,
        question: "Informations diverses :",
        type: "choice",
        choices: infoChoices || [],
      }
    : null;

  const conferenceQuestion: GuidedQuestion | null = showConferenceQuestion
    ? {
        questionId: 102,
        question: "Choisissez une conférence :",
        type: "choice",
        choices: conferenceChoices || [],
      }
    : null;

  const foodCourtQuestion: GuidedQuestion | null = showFoodCourtQuestion
    ? {
        questionId: 105,
        question: "Choisissez un restaurant :",
        type: "choice",
        choices: foodCourtChoices || [],
      }
    : null;

  const currentQuestion = foodCourtQuestion ?? conferenceQuestion ?? exhibitorQuestion ?? sponsorQuestion ?? infoQuestion ?? keywordQuestion ?? guidedQuestions[currentQuestionIndex];

  const goToSatisfactionSurvey = () => {
    // Rediriger vers la page de satisfaction
    window.location.href = "/satisfaction";
  };

  const router = useRouter();

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

  const fetchSponsors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sponsors");
      const data = await res.json();
      const sponsorStands: Stand[] = Array.isArray(data.exhibitors)
        ? data.exhibitors.flatMap((exhibitor: any) =>
            exhibitor.stands?.map((stand: any) => ({
              standCode: stand.standCode,
              exhibitorId: exhibitor.exhibitorId,
              exhibitorName: exhibitor.exhibitorName,
              posX: stand.position?.x || 0,
              posY: stand.position?.y || 0,
              status: stand.status || "confirmed",
            })) || []
          )
        : [];

      const sponsorMap = new Map<number, Stand>();
      sponsorStands.forEach((stand) => {
        if (!sponsorMap.has(stand.exhibitorId)) {
          sponsorMap.set(stand.exhibitorId, stand);
        }
      });

      const uniqueSponsorStands = Array.from(sponsorMap.values());
      const sponsorNames = uniqueSponsorStands.map((sponsor) => sponsor.exhibitorName || "Sponsor inconnu");

      if (uniqueSponsorStands.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Aucun sponsor trouvé pour le moment. Essayez une autre option.",
            sender: "bot",
          },
        ]);
      } else {
        setSponsorsList(uniqueSponsorStands);
        setSponsorChoices(
          uniqueSponsorStands.map((sponsor, index) => ({
            choiceId: index,
            label: sponsor.exhibitorName || `Sponsor ${index + 1}`,
            value: String(sponsor.exhibitorId),
          })),
        );
        setShowSponsorQuestion(true);
        setIsGuided(true);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Voici la liste des sponsors présents à la FIM :",
            sender: "bot",
          },
          {
            id: generateMessageId(),
            text: sponsorNames.join("\n"),
            sender: "bot",
          },
        ]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des sponsors :", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Impossible de récupérer les sponsors pour le moment.",
          sender: "bot",
        },
      ]);
      setIsGuided(false);
    } finally {
      setIsLoading(false);
      setCurrentQuestionIndex(0);
    }
  };

  const fetchEventsByType = async (eventType: string, label: string) => {
    setIsLoading(true);
    setConferenceChoices(null);
    setShowConferenceQuestion(false);
    try {
      const queryString = new URLSearchParams({
        type: eventType,
        date: eventDate,
      }).toString();
      const res = await fetch(`/api/events?${queryString}`);
      const data = await res.json();
      const events: EventItem[] = Array.isArray(data.events) ? data.events : [];

      if (events.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: `Aucun événement de type ${label} n'a été trouvé pour le moment.`,
            sender: "bot",
          },
        ]);
        setIsGuided(false);
      } else {
        const normalizedEvents = events.map((event) => ({
          eventId: event.eventId,
          title: event.title,
          eventDate: event.eventDate,
          startTime: event.startTime,
          endTime: event.endTime,
          venueName: event.venueName,
          organizerOrBrand: event.organizerOrBrand || "",
        }));

        setConferencesList(normalizedEvents);
        setConferenceChoices(
          normalizedEvents.map((event, index) => ({
            choiceId: index,
            label: event.title,
            value: event.eventId,
          })),
        );
        setShowConferenceQuestion(true);
        setIsGuided(true);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: `Voici les événements de type ${label} :`,
            sender: "bot",
          },
        ]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des événements :", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Impossible de récupérer les événements pour le moment.",
          sender: "bot",
        },
      ]);
      setIsGuided(false);
    } finally {
      setIsLoading(false);
      setCurrentQuestionIndex(0);
    }
  };

  const fetchKeywords = async () => {
    setIsLoading(true);
    setExhibitorsList([]);
    setExhibitorChoices(null);
    setShowExhibitorQuestion(false);
    setConferenceChoices(null);
    setShowConferenceQuestion(false);
    try {
      const res = await fetch("/api/keywords");
      const data = await res.json();
      const choices: QuestionChoice[] = Array.isArray(data.keywords)
        ? data.keywords.map((keyword: any, index: number) => ({
            choiceId: keyword.keyword_id || index,
            label: keyword.keyword_name,
            value: String(keyword.keyword_id),
          }))
        : [];

      if (choices.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Aucun domaine n'a été trouvé pour les exposants.",
            sender: "bot",
          },
        ]);
        setIsGuided(false);
      } else {
        setKeywordChoices(choices);
        setShowKeywordQuestion(true);
        setIsGuided(true);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Quel domaine vous intéresse ?",
            sender: "bot",
          },
        ]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des domaines :", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Impossible de charger la liste des domaines pour les exposants.",
          sender: "bot",
        },
      ]);
      setIsGuided(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExhibitorsByKeyword = async (keywordId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/exhibitors?keywordId=${encodeURIComponent(keywordId)}`);
      const data = await res.json();
      const exhibitors: Array<{ exhibitor_id: number; exhibitor_name: string; stand_code?: string; pos_x?: number; pos_y?: number; status?: string; zone_name?: string }> =
        Array.isArray(data.exhibitors)
          ? data.exhibitors
          : [];
      const normalizedExhibitors = exhibitors.map((exhibitor) => ({
        standCode: exhibitor.stand_code || "",
        exhibitorId: exhibitor.exhibitor_id,
        exhibitorName: exhibitor.exhibitor_name,
        posX: exhibitor.pos_x ?? 0,
        posY: exhibitor.pos_y ?? 0,
        status: exhibitor.status || "confirmed",
        zoneName: exhibitor.zone_name || "",
      }));

      if (normalizedExhibitors.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Aucun exposant trouvé pour ce domaine.",
            sender: "bot",
          },
        ]);
        setIsGuided(false);
        setShowKeywordQuestion(false);
        setKeywordChoices(null);
        setSelectedMainTopic(null);
      } else {
        setExhibitorsList(normalizedExhibitors);
        setExhibitorChoices(
          normalizedExhibitors.map((exhibitor, index) => ({
            choiceId: index,
            label: exhibitor.exhibitorName,
            value: String(exhibitor.exhibitorId),
          })),
        );
        setShowExhibitorQuestion(true);
        setIsGuided(true);
        setShowKeywordQuestion(false);
        setKeywordChoices(null);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Voici les exposants correspondant à ce domaine :",
            sender: "bot",
          },
        ]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des exposants :", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Impossible de récupérer les exposants pour le moment.",
          sender: "bot",
        },
      ]);
      setIsGuided(false);
    } finally {
      setIsLoading(false);
      setCurrentQuestionIndex(0);
    }
  };

  const fetchExhibitorDetails = async (exhibitorId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/exhibitors?exhibitorId=${encodeURIComponent(exhibitorId)}`);
      const data = await res.json();
      const stands: Array<{ exhibitor_id: number; exhibitor_name: string; stand_code?: string; pos_x?: number; pos_y?: number; status?: string; zone_name?: string }> =
        Array.isArray(data.exhibitors)
          ? data.exhibitors
          : [];

      if (stands.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Aucun stand trouvé pour cet exposant.",
            sender: "bot",
          },
        ]);
        setIsGuided(false);
      } else {
        // Créer un objet avec l'exposant et tous ses stands
        const exhibitorWithStands = {
          exhibitorId: stands[0].exhibitor_id,
          exhibitorName: stands[0].exhibitor_name,
          stands: stands.map((stand) => ({
            standCode: stand.stand_code || "",
            posX: stand.pos_x ?? 0,
            posY: stand.pos_y ?? 0,
            status: stand.status || "confirmed",
            zoneName: stand.zone_name || "",
          })),
        };

        setSelectedExhibitorForModal(exhibitorWithStands);
        setShowExhibitorModal(true);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de l'exposant :", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Impossible de récupérer les détails de l'exposant.",
          sender: "bot",
        },
      ]);
      setIsGuided(false);
    } finally {
      setIsLoading(false);
      setCurrentQuestionIndex(0);
    }
  };

  const fetchFoodCourtExhibitors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/exhibitors?keywordIds=4,3`);
      const data = await res.json();
      const exhibitors: Array<{ exhibitor_id: number; exhibitor_name: string; stand_code?: string; pos_x?: number; pos_y?: number; status?: string; zone_name?: string }> =
        Array.isArray(data.exhibitors)
          ? data.exhibitors
          : [];
      const normalizedExhibitors = exhibitors.map((exhibitor) => ({
        standCode: exhibitor.stand_code || "",
        exhibitorId: exhibitor.exhibitor_id,
        exhibitorName: exhibitor.exhibitor_name,
        posX: exhibitor.pos_x ?? 0,
        posY: exhibitor.pos_y ?? 0,
        status: exhibitor.status || "confirmed",
        zoneName: exhibitor.zone_name || "",
      }));

      if (normalizedExhibitors.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Aucun restaurant trouvé dans le food court pour le moment.",
            sender: "bot",
          },
        ]);
        setIsGuided(false);
      } else {
        setFoodCourtList(normalizedExhibitors);
        setFoodCourtChoices(
          normalizedExhibitors.map((exhibitor, index) => ({
            choiceId: index,
            label: exhibitor.exhibitorName,
            value: String(exhibitor.exhibitorId),
          })),
        );
        setShowFoodCourtQuestion(true);
        setShowInfoQuestion(false);
        setIsGuided(true);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Voici les restaurants disponibles dans le food court :",
            sender: "bot",
          },
        ]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des restaurants :", error);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Impossible de récupérer les restaurants pour le moment.",
          sender: "bot",
        },
      ]);
      setIsGuided(false);
    } finally {
      setIsLoading(false);
      setCurrentQuestionIndex(0);
    }
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
    if (showExhibitorMapModal && canvasRef.current && selectedExhibitorForModal) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = '/plan/plan.png';
      img.onload = () => {
        // Redimensionner le canvas à la taille de l'image
        canvas.width = img.width;
        canvas.height = img.height;

        // Dessiner l'image
        ctx.drawImage(img, 0, 0);

        // Dessiner les marqueurs pour tous les stands
        const standsToDraw = 'stands' in selectedExhibitorForModal
          ? selectedExhibitorForModal.stands
          : [selectedExhibitorForModal];

        standsToDraw.forEach((stand, index) => {
          const posX = stand.posX ?? 0;
          const posY = stand.posY ?? 0;

          // Cercle rouge plus grand avec contour
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(posX, posY, 50, 0, Math.PI * 2);
          ctx.fill();

          // Contour blanc
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(posX, posY, 50, 0, Math.PI * 2);
          ctx.stroke();

          // Texte avec le code du stand
          ctx.fillStyle = '#000000';
          ctx.font = '14px Arial';
          const label = stand.standCode || `Stand ${index + 1}`;
          ctx.fillText(label, posX + 18, posY - 8);
        });
      };
    }
  }, [showExhibitorMapModal, selectedExhibitorForModal]);


  const handleSendMessage = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;

    if (!isGuided && isEndOfVisitMessage(text)) {
      const userMsg: Message = {
        id: generateMessageId(),
        text,
        sender: "user",
      };
      setMessages((prev) => [...prev, userMsg]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
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
        id: generateMessageId(),
        text,
        sender: "user",
      };

      setMessages((prev) => [...prev, userMsg]);

      if (currentQuestion.type === "choice") {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Merci de choisir une option parmi les boutons ci-dessous.",
            sender: "bot",
          },
        ]);
        return;
      }

      const newAnswers = [
        ...answers.filter((a) => a.questionId !== currentQuestion.questionId),
        { questionId: currentQuestion.questionId, response: text },
      ];
      setAnswers(newAnswers);

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < guidedQuestions.length) {
        setCurrentQuestionIndex(nextIndex);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: generateMessageId(),
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
              id: generateMessageId(),
              text: "Merci ! Vous pouvez maintenant discuter librement avec moi ou me demander des stands à visiter.",
              sender: "bot",
            },
          ]);
        }, 300);
      }
      return;
    }

    const userMsg: Message = {
      id: generateMessageId(),
      text,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMsg]);

    const loadingId = generateMessageId();
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

          if (data.stands && data.stands.length > 0) {
            setTimeout(() => {
              const convertedStands: Stand[] = data.stands.map((stand: any) => ({
                standCode: stand.standCode || 'N/A',
                exhibitorId: 0,
                exhibitorName: stand.exhibitorName,
                posX: stand.position?.x || 0,
                posY: stand.position?.y || 0,
                status: "confirmed",
              }));

              // TODO: Afficher les stands dans le modal ou d'une autre manière
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
  const handleGoBack = () => {
    if (showConferenceQuestion) {
      setShowConferenceQuestion(false);
      setConferenceChoices(null);
      setConferencesList([]);
      setCurrentQuestionIndex(0);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: guidedQuestions[0].question,
          sender: "bot",
        },
      ]);
    } else if (showExhibitorQuestion) {
      setShowExhibitorQuestion(false);
      setExhibitorChoices(null);
      setExhibitorsList([]);
      setShowKeywordQuestion(true);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Quel domaine vous intéresse ?",
          sender: "bot",
        },
      ]);
    } else if (showSponsorQuestion) {
      setShowSponsorQuestion(false);
      setSponsorChoices(null);
      setSponsorsList([]);
      setSelectedMainTopic(null);
      setCurrentQuestionIndex(0);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: guidedQuestions[0].question,
          sender: "bot",
        },
      ]);
    } else if (showInfoQuestion) {
      setShowInfoQuestion(false);
      setInfoChoices(null);
      setSelectedMainTopic(null);
      setCurrentQuestionIndex(0);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: guidedQuestions[0].question,
          sender: "bot",
        },
      ]);
    } else if (showFoodCourtQuestion) {
      setShowFoodCourtQuestion(false);
      setFoodCourtChoices(null);
      setFoodCourtList([]);
      setShowInfoQuestion(true);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: "Choisissez une information :",
          sender: "bot",
        },
      ]);
    } else if (showKeywordQuestion) {
      setShowKeywordQuestion(false);
      setKeywordChoices(null);
      setSelectedMainTopic(null);
      setCurrentQuestionIndex(0);
      setMessages((prev) => [
        ...prev,
        {
          id: generateMessageId(),
          text: guidedQuestions[0].question,
          sender: "bot",
        },
      ]);
    }
  };

  const canGoBack = showExhibitorQuestion || showKeywordQuestion || showConferenceQuestion || showSponsorQuestion || showInfoQuestion || showFoodCourtQuestion;

  const handleChooseOption = async (choice: QuestionChoice) => {
    if (!currentQuestion) return;

    const userMsg: Message = {
      id: generateMessageId(),
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

    if (currentQuestion.questionId === 1) {
      setSelectedMainTopic(choice.value);
      if (choice.value === "exhibitor") {
        await fetchKeywords();
        return;
      }

      if (choice.value === "sponsors") {
        await fetchSponsors();
        return;
      }

      if (choice.value === "Informations diverses") {
        const infoOptions: QuestionChoice[] = [
          { choiceId: 1, label: "FAQ", value: "faq" },
          { choiceId: 2, label: "Billeterie", value: "billeterie" },
          { choiceId: 3, label: "Food court", value: "foodcourt" },
          { choiceId: 4, label: "Où est l'organisateur", value: "organisateur" },
        ];
        setInfoChoices(infoOptions);
        setShowInfoQuestion(true);
        setShowKeywordQuestion(false);
        setShowExhibitorQuestion(false);
        setShowSponsorQuestion(false);
        setShowConferenceQuestion(false);
        setIsGuided(true);
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Choisissez une information :",
            sender: "bot",
          },
          {
            id: generateMessageId(),
            text: infoOptions.map((option) => option.label).join("\n"),
            sender: "bot",
          },
        ]);
        return;
      }

      if (
        choice.value === "Conférence" ||
        choice.value === "Table ronde" ||
        choice.value === "Atelier" ||
        choice.value === "Speed recruiting"
      ) {
        await fetchEventsByType(choice.value, choice.label);
        return;
      }
    }

    if (currentQuestion.questionId === 100 && selectedMainTopic === "exhibitor") {
      await fetchExhibitorsByKeyword(choice.value);
      return;
    }

    if (currentQuestion.questionId === 101 && selectedMainTopic === "exhibitor") {
      await fetchExhibitorDetails(choice.value);
      return;
    }

    if (currentQuestion.questionId === 103) {
      const selectedSponsor = sponsorsList.find(
        (s) => String(s.exhibitorId) === choice.value,
      );

      if (selectedSponsor) {
        setSelectedExhibitorForModal({
          exhibitorId: selectedSponsor.exhibitorId,
          exhibitorName: selectedSponsor.exhibitorName || "Sponsor",
          standCode: selectedSponsor.standCode || "",
        });
        setShowExhibitorModal(true);
      }

      return;
    }

    if (currentQuestion.questionId === 104) {
      if (choice.value === "faq") {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Redirection vers la page FAQ...",
            sender: "bot",
          },
        ]);
        router.push("/faq");
        return;
      }

      if (choice.value === "billeterie") {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Achetez vos billets à l'entrée ou sur le site Ticket place.",
            sender: "bot",
          },
        ]);
        return;
      }

      if (choice.value === "foodcourt") {
        await fetchFoodCourtExhibitors();
        return;
      }

      if (choice.value === "organisateur") {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: "Où est l'organisateur : le bureau organisateur se trouve à l'accueil principal.",
            sender: "bot",
          },
        ]);
        return;
      }
    }

    if (currentQuestion.questionId === 105) {
      const selectedFoodCourt = foodCourtList.find(
        (f) => String(f.exhibitorId) === choice.value,
      );

      if (selectedFoodCourt) {
        setSelectedExhibitorForModal(selectedFoodCourt);
        setShowExhibitorModal(true);
      }

      return;
    }

    if (currentQuestion.questionId === 102) {
      const selectedConference = conferencesList.find(
        (e) => e.eventId === choice.value,
      );

      if (selectedConference) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
            text: `Détails de l'événement :\n${selectedConference.title}\nDate : ${formatFrenchDate(selectedConference.eventDate)}\nHeure : ${selectedConference.startTime} - ${selectedConference.endTime}\nLieu : ${selectedConference.venueName}\nOrganisateur : ${selectedConference.organizerOrBrand}`,
            sender: "bot",
          },
        ]);
      }

      // Conserver la liste des événements affichée et ne pas repasser en input libre.
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < guidedQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: generateMessageId(),
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
            id: generateMessageId(),
            text: "Merci ! Vous pouvez maintenant poser une nouvelle question ou recommencer le choix.",
            sender: "bot",
          },
        ]);
      }, 300);
    }
  };

  const handleShowExhibitorOnMap = () => {
    setShowExhibitorModal(false);
    setShowExhibitorMapModal(true);
  };

  const handleCloseExhibitorModal = () => {
    setShowExhibitorModal(false);
    setSelectedExhibitorForModal(null);
  };

  const handleCloseExhibitorMapModal = () => {
    setShowExhibitorMapModal(false);
    setShowContinueChoiceModal(true);
  };

  const handleContinueVisit = () => {
    setShowContinueChoiceModal(false);
    setSelectedExhibitorForModal(null);
  };

  const handleFinishVisit = () => {
    setShowContinueChoiceModal(false);
    window.location.href = "/satisfaction";
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
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 dark:bg-zinc-950 max-h-[50vh] overflow-y-auto">
            {canGoBack && (
              <button
                onClick={handleGoBack}
                className="mb-3 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
              >
                <span>←</span>
                <span>Retour</span>
              </button>
            )}
            <ChoiceButtons choices={currentQuestion.choices} onChoose={handleChooseOption} />
          </div>
        ) : null}

        {(!isGuided || currentQuestion?.type === "text") && (
          <InputChatbox
            id={currentAI ? currentAI.id : 0}
            name={currentAI ? currentAI.name : "Robot"}
            placeholder={
              isGuided
                ? currentQuestion?.type === "text"
                  ? currentQuestion.question
                  : "Choisissez une option ci-dessus"
                : "Demande-moi un stand ou pose-moi une question"
            }
            onSendMessage={handleSendMessage}
          />
        )}
      </main>

      {/* EXHIBITOR MODAL */}
      {showExhibitorModal && selectedExhibitorForModal && (
        <div className="fixed inset-0 bg- bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Détails de l'exposant</h2>
              <button
                onClick={handleCloseExhibitorModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Nom de l'exposant</p>
                <p className="text-base font-semibold text-gray-900">
                  {'stands' in selectedExhibitorForModal ? selectedExhibitorForModal.exhibitorName : selectedExhibitorForModal.exhibitorName}
                </p>
              </div>

              {'stands' in selectedExhibitorForModal ? (
                // Afficher tous les stands de l'exposant
                <div>
                  <p className="text-sm text-gray-600 mb-2">Stands</p>
                  <div className="max-h-72 overflow-auto space-y-2 pr-2">
                    {selectedExhibitorForModal.stands.map((stand, index) => (
                      <div key={index} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{stand.standCode}</p>
                            {stand.zoneName && (
                              <p className="text-xs text-gray-600">Zone: {stand.zoneName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{stand.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Afficher un seul stand (pour sponsors)
                selectedExhibitorForModal.standCode && (
                  <div>
                    <p className="text-sm text-gray-600">Stand</p>
                    <p className="text-base font-semibold text-gray-900">
                      {selectedExhibitorForModal.standCode}
                    </p>
                  </div>
                )
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleShowExhibitorOnMap}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                >
                  Voir sur la carte
                </button>
                <button
                  onClick={handleCloseExhibitorModal}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExhibitorMapModal && selectedExhibitorForModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-screen h-screen shadow-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Plan du salon</h2>
              <button
                onClick={handleCloseExhibitorMapModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50">
              <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {showContinueChoiceModal && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900">Que souhaitez-vous faire ?</h2>
            <p className="mt-3 text-gray-600">
              Voulez-vous continuer la visite
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleContinueVisit}
                className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Continuer la visite
              </button>
              <button
                onClick={handleFinishVisit}
                className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
