import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Square, X, Layers, Code, GitBranch, Bug, HelpCircle } from "lucide-react";

interface ChatComposerProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onStop: () => void;
  repoContext?: { id: string; name: string; owner: string };
  onClearRepoContext?: () => void;
  showStarters?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
  onStop,
  repoContext,
  onClearRepoContext,
  showStarters = false,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStarterClick = (promptText: string) => {
    onSendMessage(promptText);
  };

  return (
    <div className="space-y-4 w-full max-w-3xl mx-auto">
      {/* Prompt Starters */}
      {showStarters && (
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
            Suggested Prompts
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                handleStarterClick(
                  repoContext
                    ? `Can you explain the high-level architecture and key directories of ${repoContext.name}?`
                    : "Can you help me choose an open-source repository to start contributing to?"
                )
              }
              className="p-3 rounded-2xl border border-border bg-white dark:bg-space-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left flex items-start space-x-2.5 group shadow-sm"
            >
              <Layers className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Explain a repository
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  Architecture, core files, and contribution patterns
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleStarterClick("How do I cleanly rebase my feature branch on top of upstream main without merge conflicts?")
              }
              className="p-3 rounded-2xl border border-border bg-white dark:bg-space-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left flex items-start space-x-2.5 group shadow-sm"
            >
              <GitBranch className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Help me learn Git
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  Rebasing, resolving conflicts, and pristine PRs
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleStarterClick("Explain discriminated unions in TypeScript and why open-source maintainers prefer them.")
              }
              className="p-3 rounded-2xl border border-border bg-white dark:bg-space-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left flex items-start space-x-2.5 group shadow-sm"
            >
              <Code className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Explain a programming concept
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  Generics, AsyncIO, borrow checker, or state machines
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleStarterClick("I'm getting a git push rejection error: 'fetch first'. How do I resolve it safely?")
              }
              className="p-3 rounded-2xl border border-border bg-white dark:bg-space-900 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left flex items-start space-x-2.5 group shadow-sm"
            >
              <Bug className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Help me debug code
                </span>
                <span className="text-[11px] text-muted-foreground line-clamp-1">
                  Identify runtime exceptions or git workflow traps
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-3xl border border-border bg-white dark:bg-space-900 shadow-xl overflow-hidden focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {/* Context Chip Header if attached */}
        {repoContext && (
          <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800/60 border-b border-border flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300">
              <span className="text-muted-foreground font-mono text-[11px]">Context:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                {repoContext.owner}/{repoContext.name}
              </span>
            </div>
            {onClearRepoContext && (
              <button
                type="button"
                onClick={onClearRepoContext}
                className="text-muted-foreground hover:text-neutral-900 dark:hover:text-white p-1 rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition-colors"
                title="Remove repository context"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Text Area */}
        <div className="p-3 sm:p-4 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              repoContext
                ? `Ask Orbit AI about ${repoContext.name}...`
                : "Ask Orbit AI anything about open source, code, or Git..."
            }
            rows={1}
            className="w-full resize-none bg-transparent text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-muted-foreground outline-none max-h-[180px] py-1"
            aria-label="Message Orbit AI"
          />

          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="p-2.5 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors shrink-0 shadow-md"
              title="Stop generation"
            >
              <Square className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className={`p-2.5 rounded-2xl transition-all shrink-0 ${
                input.trim()
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/30 scale-100"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer info: Keyboard hint & Model info */}
        <div className="px-4 py-2 bg-neutral-50/60 dark:bg-neutral-900/40 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Press <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 font-mono text-[10px]">Shift+Enter</kbd> for newline
          </span>
          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400">
            Orbit AI
          </span>
        </div>
      </div>
    </div>
  );
};
