"use client";
import { useState } from "react";
import axios from "axios"; // Added missing import

type Message = {
  id: number | string;
  text: string;
  sender: "user" | "bot";
  file?: { name: string }; // Keep track of files in history
};

type AgentCardProps = {
  id: string | number;
  name?: string;
  description?: string;
  imageUrl?: string | "";
  color?: string | "blue-500";
};

export default function InputChatbox({ id, name }: AgentCardProps) {
  const N8N_URL = process.env.NEXT_PUBLIC_N8N_URL_TEST;

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I'm Alexa. How can I help you today?", sender: "bot" },
  ]);

  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null); // State to hold the staged file

  const handleSend = async () => {
    // Check if there is either text or a file to send
    if (!input.trim() && !attachedFile) return;

    const userMsg: Message = {
      id: Date.now(),
      text: input,
      sender: "user",
      file: attachedFile ? { name: attachedFile.name } : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    
    // Capture current values to send before clearing state
    const textToSend = input;
    const fileToSend = attachedFile;

    setInput("");
    setAttachedFile(null); 

    try {
      const formData = new FormData();
      formData.append("message", textToSend);
      formData.append("agentId", String(id));
      formData.append("agentName", name || "Unknown");

      if (fileToSend) {
        formData.append("file", fileToSend);
      }

      const response = await axios.post(N8N_URL as string, formData);

      const botMsg: Message = {
        id: Date.now() + 1,
        text: response.data.reply || "No response from bot",
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Axios Error:", error);
      const errorMsg: Message = {
        id: Date.now() + 2,
        text: "Erreur de connexion à n8n",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="border-t border-gray-100 p-4 bg-white dark:bg-zinc-900">
      <div className="max-w-3xl mx-auto">
        
        {/* --- FILE PREVIEW AREA --- */}
        {attachedFile && (
          <div className="mb-2 flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 w-fit p-2 rounded-lg animate-in fade-in slide-in-from-bottom-1">
            <div className="bg-blue-500 p-1.5 rounded text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.414a4 4 0 00-5.656-5.656l-6.415 6.414a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
              {attachedFile.name}
            </span>
            <button 
              onClick={() => setAttachedFile(null)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* --- INPUT BOX --- */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 rounded-2xl px-4 py-2 border border-gray-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <label className="cursor-pointer p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.5l-10.74 10.74a1.5 1.5 0 1 1-2.122-2.122l8.12-8.12"
              />
            </svg>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setAttachedFile(file); // Store file in state
              }}
            />
          </label>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={"Demandez quelque chose à " + name + "..."}
            className="flex-1 bg-transparent outline-none text-sm py-2 text-gray-800 dark:text-gray-200"
          />

          <button
            onClick={handleSend}
            className="bg-[#2d4a53] text-white rounded-xl p-2 hover:opacity-90 transition-opacity active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}