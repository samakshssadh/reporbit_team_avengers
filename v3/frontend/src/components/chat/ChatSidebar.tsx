import React from "react";
import { ChatSession } from "../../types";
import { Plus, MessageSquare, Trash2, Sparkles, Layers, ShieldCheck } from "lucide-react";
import { formatRelativeTime } from "../../lib/utils";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
}) => {
  return (
    <div className="w-full md:w-64 flex flex-col h-full bg-neutral-50/70 dark:bg-space-950/70 border-r border-border p-4 space-y-4">
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="w-full py-2.5 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/20 transition-all group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
        <span>New Conversation</span>
      </button>

      {/* Sessions History List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground block px-2 mb-2">
          Conversations
        </span>

        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;

          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start space-x-2.5 ${
                isActive
                  ? "bg-white dark:bg-space-900 border border-indigo-200 dark:border-indigo-800 shadow-sm"
                  : "hover:bg-neutral-200/50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300"
              }`}
            >
              <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`} />
              <div className="min-w-0 flex-1">
                <span className={`text-xs font-medium block truncate ${isActive ? "text-indigo-950 dark:text-white font-semibold" : ""}`}>
                  {session.title}
                </span>
                <div className="flex items-center space-x-1.5 text-[10px] text-muted-foreground mt-0.5">
                  {session.repoContext ? (
                    <span className="font-mono text-indigo-500 truncate">
                      {session.repoContext.name}
                    </span>
                  ) : (
                    <span>General</span>
                  )}
                  <span>•</span>
                  <span>{formatRelativeTime(session.updatedAt)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Model Spec Footer Badge (Compliant with Track 2 Rules) */}
      <div className="p-3 rounded-2xl bg-white dark:bg-space-900 border border-border space-y-1.5 shadow-sm">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-neutral-900 dark:text-white">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Active Intelligence</span>
        </div>
        <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
          Google Gemma
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Open-weight model running locally or via API backend. Non-decorative, core reasoning.
        </p>
      </div>
    </div>
  );
};
