import React from "react";
import { ChatSession } from "../../types";
import { Plus, MessageSquare, Trash2, Sparkles, Layers, ShieldCheck } from "lucide-react";
import { formatRelativeTime } from "../../lib/utils";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => {
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
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
            <div key={session.id} className="group relative">
            <button
              onClick={() => onSelectSession(session.id)}
              className={`w-full p-2.5 pr-9 rounded-xl text-left transition-all flex items-start space-x-2.5 ${
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
            {confirmId === session.id ? (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button onClick={() => { onDeleteSession(session.id); setConfirmId(null); }} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-rose-500/90 text-white hover:bg-rose-500">Delete</button>
                <button onClick={() => setConfirmId(null)} className="px-1.5 py-1 rounded-lg text-[10px] text-muted-foreground hover:text-white">Cancel</button>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setConfirmId(session.id); }} title="Delete conversation" aria-label={`Delete conversation ${session.title}`}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-rose-400 hover:bg-rose-500/10 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            </div>
          );
        })}
      </div>

      {/* Assistant card */}
      <div className="p-3 rounded-2xl liquid-lens space-y-1">
        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-white">
          <Sparkles className="w-3.5 h-3.5 text-tangerine-100" />
          <span>Orbit AI</span>
        </div>
        <p className="text-[10px] text-white/70 leading-tight">
          Your open-source mentor. Connect a repository from its panel and Orbit AI answers using that repo's own docs.
        </p>
      </div>
    </div>
  );
};
