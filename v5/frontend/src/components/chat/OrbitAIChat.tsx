import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatComposer } from "./ChatComposer";
import { apiService } from "../../services/api";
import { ChatMessage } from "../../types";
import { Sparkles, AlertCircle, ArrowDown, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { TypingDots } from "../common/OrbitLoader";

export const OrbitAIChat: React.FC = () => {
  const {
    chatSessions,
    activeSessionId,
    setActiveSessionId,
    createChatSession,
    addMessageToSession,
    deleteChatSession,
    pendingPrompt,
    clearPendingPrompt,
    setActiveTab,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeSession =
    chatSessions.find((s) => s.id === activeSessionId) || chatSessions[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to latest message if near bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
      repoContext: activeSession.repoContext,
      model: "User",
    };

    addMessageToSession(activeSession.id, userMsg);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Map session history for prompt
      const history = [...activeSession.messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await apiService.sendChatMessage(
        history,
        activeSession.repoContext,
        controller.signal
      );

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: response.message,
        timestamp: new Date().toISOString(),
        repoContext: activeSession.repoContext,
        model: response.model,
      };

      addMessageToSession(activeSession.id, assistantMsg);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError("Failed to get response from Orbit AI. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Prompts sent from other pages (repo panel, roadmap, Learn) are sent automatically once.
  useEffect(() => {
    if (pendingPrompt && pendingPrompt.sessionId === activeSession?.id && !isLoading) {
      const text = pendingPrompt.text;
      clearPendingPrompt();
      handleSendMessage(text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrompt, activeSession?.id]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    createChatSession();
  };

  const isFreshSession = activeSession.messages.length <= 1;

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto border-x border-border/40 overflow-hidden bg-white/50 dark:bg-space-950/50">
      {/* Sidebar */}
      {sidebarOpen && (
        <ChatSidebar
          sessions={chatSessions}
          activeSessionId={activeSession.id}
          onSelectSession={setActiveSessionId}
          onNewChat={handleNewChat}
          onDeleteSession={deleteChatSession}
        />
      )}

      {/* Main Conversation Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Chat Bar */}
        <div className="px-4 py-3 border-b border-border bg-white/80 dark:bg-space-900/80 backdrop-blur flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            <div>
              <h2 className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {activeSession.title}
              </h2>
              {activeSession.repoContext && (
                <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded-full liquid-lens text-white">
                  🔗 Connected to {activeSession.repoContext.owner}/{activeSession.repoContext.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={() => deleteChatSession(activeSession.id)} className="text-[11px] px-2.5 py-1 rounded-full text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition" title="Delete this conversation">Delete chat</button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
          {/* Welcome Intro on fresh session */}
          {isFreshSession && (
            <div className="text-center py-6 max-w-xl mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                What would you like to explore?
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Orbit AI is grounded in open-source repository architectures, contribution roadmaps, and Git best practices.
              </p>
            </div>
          )}

          {/* Render Messages */}
          <div className="max-w-3xl mx-auto space-y-4">
            {activeSession.messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}

            {/* Pending / Generating Indicator */}
            {isLoading && (
              <div className="p-4 rounded-3xl glass flex items-center gap-3 text-xs text-white/70">
                <div className="orbit-loader" style={{ ["--s" as any]: "28px" }}><span className="ring" /><span className="core" /></div>
                <span>Orbit AI is thinking</span><TypingDots />
              </div>
            )}

            {/* One-tap questions when a repository is connected */}
            {activeSession.repoContext && !isLoading && activeSession.messages.length <= 2 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {["Explain this repository simply", "Where should I start contributing?", "How do I set it up locally?", "Which good first issue suits me?"].map((q) => (
                  <button key={q} onClick={() => handleSendMessage(q)} className="text-xs px-3 py-1.5 rounded-full glass text-white/80 hover:text-white hover:border-tangerine-400/50 transition">{q}</button>
                ))}
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/40 text-xs text-red-900 dark:text-red-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer Area at Bottom */}
        <div className="p-4 bg-white/60 dark:bg-space-950/60 backdrop-blur-md border-t border-border">
          <ChatComposer
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onStop={handleStop}
            repoContext={activeSession.repoContext}
            showStarters={isFreshSession}
          />
        </div>
      </div>
    </div>
  );
};
