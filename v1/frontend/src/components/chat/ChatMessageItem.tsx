import React, { useState } from "react";
import { ChatMessage } from "../../types";
import { Sparkles, User, Copy, Check, Terminal, Layers } from "lucide-react";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isAssistant = message.role === "assistant";
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Safe markdown and code blocks renderer
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Extract language and code
        const lines = part.slice(3, -3).trim().split("\n");
        const firstLine = lines[0].trim();
        const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
        const language = hasLang ? firstLine : "code";
        const code = hasLang ? lines.slice(1).join("\n") : lines.join("\n");
        const codeId = `code-${index}`;

        return (
          <div key={index} className="my-3 rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-md">
            <div className="px-4 py-2 bg-neutral-900/90 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span className="capitalize">{language}</span>
              </span>
              <button
                type="button"
                onClick={() => copyCode(code, codeId)}
                className="flex items-center space-x-1 px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                title="Copy code to clipboard"
              >
                {copiedCodeId === codeId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Render regular paragraphs, bullet points and bold formatting safely
      return (
        <div key={index} className="space-y-2 text-xs sm:text-sm leading-relaxed">
          {part.split("\n\n").map((para, pIdx) => {
            if (!para.trim()) return null;

            if (para.startsWith("### ")) {
              return (
                <h3 key={pIdx} className="text-base font-bold text-neutral-900 dark:text-white pt-2">
                  {para.replace("### ", "")}
                </h3>
              );
            }

            if (para.startsWith("- ") || para.startsWith("* ")) {
              const items = para.split("\n").filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
              return (
                <ul key={pIdx} className="list-disc list-inside space-y-1 pl-1 text-neutral-700 dark:text-neutral-300">
                  {items.map((item, iIdx) => (
                    <li key={iIdx}>
                      {renderInlineFormatting(item.replace(/^[-*]\s+/, ""))}
                    </li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={pIdx} className="text-neutral-800 dark:text-neutral-200">
                {renderInlineFormatting(para)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    // Process **bold** and `code`
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return <strong key={idx} className="font-semibold text-neutral-900 dark:text-white">{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            {token.slice(1, -1)}
          </code>
        );
      }
      return token;
    });
  };

  return (
    <div className={`py-4 px-4 sm:px-6 rounded-3xl transition-colors ${
      isAssistant
        ? "bg-white/80 dark:bg-space-900/80 border border-border shadow-sm"
        : "bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/60 dark:border-indigo-900/40"
    }`}>
      {/* Sender Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
            isAssistant
              ? "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-sm"
              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
          }`}>
            {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white">
              {isAssistant ? "Orbit AI" : "You"}
            </span>
            {isAssistant && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                Google Gemma
              </span>
            )}
          </div>
        </div>

        {/* Repository Context Chip if attached */}
        {message.repoContext && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-border text-[10px] font-mono text-muted-foreground">
            <Layers className="w-3 h-3 text-indigo-500" />
            <span>{message.repoContext.owner}/{message.repoContext.name}</span>
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="pl-9">
        {renderFormattedContent(message.content)}
      </div>
    </div>
  );
};
