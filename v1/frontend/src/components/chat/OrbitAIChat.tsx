import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { ChatSidebar } from "./ChatSidebar";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatComposer } from "./ChatComposer";
import { apiService } from "../../services/api";
import { ChatMessage } from "../../types";
import { Sparkles, AlertCircle, ArrowDown, PanelLeftOpen, PanelLeftClose } from "lucide-react";

export const OrbitAIChat: React.FC = () => {
  const {
    chatSessions,
    activeSessionId,
    setActiveSessionId,
    createChatSession,
    addMessageToSession,
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
                <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                  Attached to {activeSession.repoContext.owner}/{activeSession.repoContext.name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/50">
              Gemma Powered
            </span>
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
              <div className="p-4 rounded-3xl bg-white/80 dark:bg-space-900/80 border border-border shadow-sm flex items-center space-x-3 text-xs text-muted-foreground">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>Orbit AI (Gemma) is reasoning...</span>
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
