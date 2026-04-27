"use client";

import { useEffect, useRef, useState } from "react";
import InputChatbox from "./chat/component/InputChatbox";
import HeaderChatBox from "./chat/component/HeaderChatbox";
import TypingBubble from "./chat/component/TypingBubble";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
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

  // prends en charge les messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Salut! je suis  Wally FIM. Comment puis-je vous aider?",
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
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === "user"
                    ? "bg-[#2d4a53] text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text === "thinking" ? <TypingBubble /> : msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* INPUT BOX */}
        <InputChatbox
          id={currentAI ? currentAI.id : 0}
          name={currentAI ? currentAI.name : "Robot"}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}
