/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Send, Sparkles, MessageSquare, Plus, Trash2, Bot, User, Check, AlertCircle } from "lucide-react";
import { ChatMessage, ChatSession } from "../types";

interface ChatViewProps {
  userEmail: string;
  isDarkMode: boolean;
}

export default function ChatView({ userEmail, isDarkMode }: ChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from localStorage on init
  useEffect(() => {
    const cached = localStorage.getItem(`magic_chats_${userEmail}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Cache parsing error", e);
      }
    } else {
      // Bootstrapped starter session
      const starterId = "session_" + Date.now();
      const starter: ChatSession = {
        id: starterId,
        title: "Magic AI Welcome",
        ownerId: userEmail,
        updatedAt: Date.now(),
        messages: [
          {
            id: "msg_1",
            sender: "ai",
            text: "Hello! My name is **Magic AI**. I am styled securely on dynamic cloud endpoints to help you compile files, structure layouts, or refine copy. What magical query can we solve today?",
            timestamp: Date.now() - 1000
          }
        ]
      };
      setSessions([starter]);
      setActiveSessionId(starterId);
    }
  }, [userEmail]);

  // Persist sessions
  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem(`magic_chats_${userEmail}`, JSON.stringify(updated));
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, loading]);

  const createNewSession = () => {
    const newId = "session_" + Date.now();
    const newS: ChatSession = {
      id: newId,
      title: `Session ${sessions.length + 1}`,
      ownerId: userEmail,
      updatedAt: Date.now(),
      messages: [
        {
          id: "w_msg_" + Date.now(),
          sender: "ai",
          text: "I expanded a blank terminal canvas. Ask me anything, or pick one of the quick start chips below!",
          timestamp: Date.now()
        }
      ]
    };
    const updated = [newS, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newId);
  };

  const deleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== idToDelete);
    if (filtered.length === 0) {
      const resetId = "session_" + Date.now();
      const resetS: ChatSession = {
        id: resetId,
        title: "Default Chat",
        ownerId: userEmail,
        updatedAt: Date.now(),
        messages: [{ id: "m", sender: "ai", text: "Ready to assist you.", timestamp: Date.now() }]
      };
      saveSessions([resetS]);
      setActiveSessionId(resetId);
    } else {
      saveSessions(filtered);
      if (activeSessionId === idToDelete) {
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const rawPrompt = (textToSend || inputMsg).trim();
    if (!rawPrompt) return;

    if (!textToSend) {
      setInputMsg("");
    }
    setErrorMsg(null);

    if (!activeSession) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: "us_" + Date.now(),
      sender: "user",
      text: rawPrompt,
      timestamp: Date.now()
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    let updatedTitle = activeSession.title;

    // Rename title if it was the default starter title
    if (activeSession.title.startsWith("Session ") || activeSession.title === "Magic AI Welcome" || activeSession.title === "Default Chat") {
      updatedTitle = rawPrompt.substring(0, 24) + (rawPrompt.length > 24 ? "..." : "");
    }

    const updatedSessions = sessions.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          title: updatedTitle,
          messages: updatedMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    });
    saveSessions(updatedSessions);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          userEmail
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Synthesis node returned a server error.");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: data.text,
        timestamp: Date.now()
      };

      const finalSessions = sessions.map(s => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: [...updatedMessages, aiMsg],
            updatedAt: Date.now()
          };
        }
        return s;
      });
      saveSessions(finalSessions);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to contact Gemini servers.");
    } finally {
      setLoading(false);
    }
  };

  const quickStartChips = [
    "Write a short bedtime story about a sleepy robot",
    "Explain quantum computing like I'm 5 years old",
    "Give me 3 energetic names for an organic cold press brand",
    "Combine neon styling secrets with responsive flexboxes"
  ];

  return (
    <div id="chat-tab" className="flex flex-col h-full bg-transparent">
      {/* Session Header Rail */}
      <div className={`p-3 px-4 border-b ${isDarkMode ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-white'} flex gap-2 overflow-x-auto items-center scrollbar-none shrink-0`}>
        <button
          id="btn-new-chat"
          onClick={createNewSession}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>

        {sessions.map(s => {
          const isActive = s.id === activeSessionId;
          return (
            <div
              key={s.id}
              onClick={() => {
                setActiveSessionId(s.id);
                setErrorMsg(null);
              }}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                isActive
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : isDarkMode
                  ? 'bg-slate-800/40 border-slate-805 text-slate-400 hover:bg-slate-800/80 hover:text-slate-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-3 h-3 flex-shrink-0" />
              <span className="max-w-[100px] truncate">{s.title}</span>
              <button
                id={`delete-session-${s.id}`}
                onClick={(e) => deleteSession(e, s.id)}
                className="opacity-50 hover:opacity-100 p-0.5 hover:bg-black/10 rounded transition-all ml-1"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeSession?.messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isAi ? "mr-auto" : "ml-auto flex-row-reverse"
              }`}
            >
              {/* Avatar Icon */}
              <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                isAi
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                  : 'bg-gradient-to-br from-purple-600 to-pink-500 text-white'
              }`}>
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Text Bubble */}
              <div className="space-y-1">
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isAi
                    ? isDarkMode
                      ? 'bg-slate-800/60 text-slate-200 border border-slate-700/40 shadow-sm'
                      : 'bg-slate-50 text-slate-800 border border-slate-200/60 shadow-sm'
                    : 'bg-[#4F46E5] text-white shadow-md'
                }`}>
                  {/* Simplistic renderer supporting markdown headers & bolding */}
                  <span className="whitespace-pre-wrap">
                    {msg.text.split("**").map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="font-extrabold text-indigo-300">{part}</strong> : part
                    )}
                  </span>
                </div>
                <div className="text-[9px] opacity-40 px-1 text-right">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / AI Thinking Bubble */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-start">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-purple-200 animate-spin" />
            </div>
            <div className={`p-4 rounded-2xl ${isDarkMode ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-slate-200'} shadow-sm flex items-center gap-1.5`}>
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-red-300 text-xs flex gap-2 items-center">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Empty Canvas Suggestion List */}
        {activeSession?.messages.length <= 1 && (
          <div className="pt-6 text-center space-y-4">
            <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">
              ✨ Prompt Inspiration
            </p>
            <div className="grid grid-cols-1 gap-2 max-w-sm mx-auto px-4">
              {quickStartChips.map((chip, idx) => (
                <button
                  id={`chip-${idx}`}
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className={`p-3 text-left leading-normal text-[11px] font-semibold rounded-2xl border transition-all ${
                    isDarkMode
                      ? 'bg-[#1E293B]/40 border-slate-800 text-slate-300 hover:bg-[#1E293B]/80 hover:text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-800 shadow-sm'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Tray */}
      <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800 bg-[#0F172A]' : 'border-slate-200 bg-white'} shrink-0`}>
        <div className="flex gap-2 items-center">
          <input
            id="chat-user-input"
            type="text"
            placeholder="Talk with Magic AI..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className={`flex-1 py-3 px-4 rounded-xl text-xs border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDarkMode
                ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-400'
                : 'bg-slate-50 border-slate-250 text-slate-800 placeholder-slate-400 shadow-inner'
            }`}
            disabled={loading}
          />
          <button
            id="chat-send-btn"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMsg.trim()}
            className="p-3 rounded-xl bg-[#4F46E5] hover:opacity-95 text-white shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
          >
            <Send className="w-4 h-4 animate-pulse" />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2">
          Magic AI will securely process queries dynamically inline. All rights preserved.
        </p>
      </div>
    </div>
  );
}
