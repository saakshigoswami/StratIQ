/**
 * Coach Assistant chatbot panel.
 * Answers coaching/analytics questions using only project data (POST /chat/query).
 * No generic LLM — deterministic, data-driven responses.
 */
import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatQuery, type ChatQueryResponse } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  metrics_used?: string[];
  timestamp: Date;
}

const EXAMPLE_QUESTIONS = [
  "Who performed best in early game?",
  "Compare player performance across early, mid, late game",
  "Which map favors aggressive play?",
  "Show insights for match m1",
  "What went wrong in late game?",
];

function formatAnswer(text: string): React.ReactNode {
  // Simple **bold** rendering
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

interface CoachAssistantProps {
  game: "valorant" | "lol";
  isOpen: boolean;
  onClose: () => void;
}

const CoachAssistant = ({ game, isOpen, onClose }: CoachAssistantProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I'm the Coach Assistant. I answer questions using your match and phase data only. Try: \"Who performed best in early game?\" or \"Show insights for match m1\".",
      timestamp: new Date(),
    };
    return [welcome];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res: ChatQueryResponse = await chatQuery(q, game);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.answer,
        confidence: res.confidence,
        metrics_used: res.metrics_used?.length ? res.metrics_used : undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const errMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I couldn't reach the server. Make sure the backend is running and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[380px] max-h-[520px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageSquare className="w-4 h-4 text-primary" />
          Coach Assistant
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close chat">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[320px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground border border-border"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">
                {msg.role === "assistant" ? formatAnswer(msg.content) : msg.content}
              </div>
              {msg.role === "assistant" && (msg.confidence != null || (msg.metrics_used?.length ?? 0) > 0) && (
                <div className="mt-1.5 pt-1.5 border-t border-border/50 flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
                  {msg.confidence != null && (
                    <span>Confidence: {Math.round(msg.confidence * 100)}%</span>
                  )}
                  {msg.metrics_used && msg.metrics_used.length > 0 && (
                    <span>Metrics: {msg.metrics_used.join(", ")}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2 bg-muted border border-border text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Example questions */}
      <div className="px-4 pb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Try asking</p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_QUESTIONS.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="text-[11px] px-2 py-1 rounded-md bg-muted/80 hover:bg-muted text-foreground border border-border transition-colors disabled:opacity-50"
            >
              {q.length > 32 ? q.slice(0, 32) + "…" : q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 pt-0 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about performance, phases, maps…"
            className="flex-1 min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
            aria-label="Chat input"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-destructive">{error}</p>
        )}
      </form>
    </div>
  );
};

export default CoachAssistant;
