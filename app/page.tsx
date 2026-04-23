"use client";

import { useState } from "react";
import InputChatbox from "./component/InputChatbox";
import HeaderChatBox from "./component/HeaderChatbox";

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
    name: "Agent FIM",
    description:
      "Tri intelligent des e‑mails, synthèse des réunions, préparation des réponses, priorisation des actions, agenda augmenté.",
    imageUrl: "/image/848c342a56e7854dec45b9349c21dfe5.gif",
    color: "shadow-green-500",
  });

  // prends en charge les messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm Alexa. How can I help you today?",
      sender: "bot",
    },
    {
      id: 2,
      text: "Hellooo, I need help with my team management.",
      sender: "user",
    },
  ]);

  //   envoyer des messages
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg: Message = {
        id: Date.now() + 1,
        text: "I'm working on that for you...",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
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
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        {/* INPUT BOX */}
        <InputChatbox
          id={currentAI ? currentAI.id : 0}
          name={currentAI ? currentAI.name : "Robot"}
        />
      </main>
    </div>
  );
}
