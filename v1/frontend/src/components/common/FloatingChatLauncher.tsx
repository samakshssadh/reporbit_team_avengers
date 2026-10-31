import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Sparkles, X, Maximize2, Send, Layers } from "lucide-react";
import { ChatMessageItem } from "../chat/ChatMessageItem";
import { apiService } from "../../services/api";
import { ChatMessage } from "../../types";

export const FloatingChatLauncher: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isFloatingChatOpen,
    setIsFloatingChatOpen,
    chatSessions,
    activeSessionId,
    addMessageToSession,
  } = useApp();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession =
    chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];

  useEffect(() => {
    if (isFloatingChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession?.messages, isFloatingChatOpen]);

  // Hide the floating launcher on the full Orbit AI chat page as required by prompt!
  if (activeTab === "chat") return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toISOString(),
      repoContext: activeSession.repoContext,
      model: "User",
    };

    addMessageToSession(activeSession.id, userMsg);
    setIsLoading(true);

    try {
      const history = [...activeSession.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiService.sendChatMessage(
        history,
        activeSession.repoContext
      );

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: res.message,
        timestamp: new Date().toISOString(),
        repoContext: activeSession.repoContext,
        model: res.model,
      };

      addMessageToSession(activeSession.id, assistantMsg);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandToFullPage = () => {
    setIsFloatingChatOpen(false);
    setActiveTab("chat");
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isFloatingChatOpen && (
        <button
          onClick={() => setIsFloatingChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open Orbit AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-xs font-semibold tracking-tight">Orbit AI</span>
          {activeSession.repoContext && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
              {activeSession.repoContext.name}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Drawer / Panel */}
      {isFloatingChatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[540px] max-h-[85vh] bg-white dark:bg-space-900 rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/80 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                  Orbit AI Assistant
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {activeSession.repoContext
                    ? `Context: ${activeSession.repoContext.name}`
                    : "Google Gemma"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleExpandToFullPage}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Expand to Full Page Chat"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsFloatingChatOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeSession.messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-border text-xs text-muted-foreground flex items-center space-x-2">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Gemma is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mini Composer */}
          <div className="p-3 bg-neutral-50/50 dark:bg-neutral-900/40 border-t border-border">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Ask Gemma a question..."
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-space-900 border border-border rounded-xl outline-none focus:border-indigo-500 text-neutral-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
