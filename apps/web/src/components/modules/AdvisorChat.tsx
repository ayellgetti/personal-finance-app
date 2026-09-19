import { useEffect, useRef, useState } from "react";
import { Bot, Lock, Plus, Send, Sparkles, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/store";
import { ApiError } from "@/lib/api";
import {
  getAdvisorChat,
  listAdvisorChats,
  messagesFromConversation,
  removeAdvisorChat,
  sendAdvisorChatMessage,
  type AdvisorChatSummary,
  type ChatMessage,
} from "@/lib/finance/advisor-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function ChatPaywall() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-hero shadow-[var(--shadow-card)]">
        <Lock className="h-9 w-9 text-primary-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">Upgrade to chat with your advisor</h2>
        <p className="max-w-sm text-muted-foreground">
          AI Chat is available for paid subscribers. Upgrade your plan to get
          real-time, conversational financial guidance grounded in your actual
          numbers.
        </p>
      </div>
      <div className="max-w-xs w-full space-y-3 rounded-2xl border bg-card p-5 text-left shadow-sm">
        <p className="text-sm font-semibold text-foreground">What you get</p>
        {[
          "Ask anything about your loans, goals & investments",
          "Answers grounded in your live financial data",
          "Saved conversations you can reopen later",
          "Powered by the same OpenAI model as the advisor report",
        ].map((item) => (
          <div key={item} className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="text-sm text-muted-foreground">{item}</span>
          </div>
        ))}
      </div>
      <Button disabled className="rounded-xl px-8">
        Upgrade — coming soon
      </Button>
    </div>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border bg-card text-card-foreground",
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={cn("mt-1 text-xs", isUser ? "text-primary-foreground/60" : "text-muted-foreground")}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  "What should I focus on to improve my financial health?",
  "How can I pay off my loans faster?",
  "Am I on track for financial freedom?",
  "Where should I invest my monthly surplus?",
];

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function AdvisorChat() {
  const { user } = useAuth();
  const isPaid = user?.isPaid === true;

  const [conversations, setConversations] = useState<AdvisorChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isPaid) return;
    void listAdvisorChats()
      .then(setConversations)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Could not load saved chats");
      });
  }, [isPaid]);

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
  };

  const openConversation = async (id: string) => {
    if (id === activeId || isLoading) return;
    setIsOpening(true);
    try {
      const conversation = await getAdvisorChat(id);
      setActiveId(conversation.id);
      setMessages(messagesFromConversation(conversation));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not open that chat");
    } finally {
      setIsOpening(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await removeAdvisorChat(id);
      setConversations((prev) => prev.filter((item) => item.id !== id));
      if (activeId === id) startNewChat();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not delete that chat");
    }
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const reply = await sendAdvisorChatMessage(trimmed, messages, activeId ?? undefined);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: reply.message,
        timestamp: new Date(),
      };
      setActiveId(reply.conversationId);
      setConversations((prev) => {
        const next = prev.filter((item) => item.id !== reply.conversationId);
        return [
          {
            id: reply.conversationId,
            title: reply.title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...next,
        ];
      });
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(trimmed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-3xl border bg-background shadow-[var(--shadow-card)]">
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-hero px-6 py-5 text-primary-foreground">
        <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/15 backdrop-blur-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">AI Financial Advisor</h2>
            <p className="text-xs text-primary-foreground/70">
              {isPaid ? "Ask anything about your finances" : "Upgrade to unlock conversational AI"}
            </p>
          </div>
          {isPaid && (
            <span className="ml-auto rounded-full bg-background/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              Paid
            </span>
          )}
        </div>
      </div>

      {!isPaid ? (
        <ChatPaywall />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="border-b border-border md:w-72 md:shrink-0 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              <h3 className="font-display text-sm font-semibold">Chats</h3>
              <Button type="button" size="sm" variant="secondary" className="rounded-xl" onClick={startNewChat}>
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 md:max-h-full md:flex-col md:overflow-y-auto md:px-3">
              {conversations.length === 0 ? (
                <p className="px-1 text-xs text-muted-foreground">Started chats will appear here.</p>
              ) : (
                conversations.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex min-w-48 items-center gap-1 rounded-xl border px-2 py-2 md:min-w-0",
                      activeId === item.id ? "border-primary bg-primary/5" : "border-border bg-card",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void openConversation(item.id)}
                      disabled={isOpening || isLoading}
                      className="min-w-0 flex-1 text-left text-sm font-medium disabled:opacity-50"
                    >
                      <span className="line-clamp-2">{item.title}</span>
                    </button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      aria-label={`Delete ${item.title}`}
                      onClick={() => void deleteConversation(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">How can I help you today?</p>
                    <p className="text-sm text-muted-foreground">
                      I have access to your financial data and can answer questions about your loans,
                      goals, savings, and more.
                    </p>
                  </div>
                  <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => void sendMessage(prompt)}
                        disabled={isLoading}
                        className="rounded-xl border bg-card px-4 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                  ))}
                  {isLoading && <TypingIndicator />}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            <div className="border-t bg-card px-4 py-4 md:px-6">
              <div className="flex items-end gap-3 rounded-2xl border bg-background px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your loans, savings, goals…"
                  rows={1}
                  disabled={isLoading}
                  className="min-h-0 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 disabled:opacity-50"
                />
                <Button
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  onClick={() => void sendMessage(input)}
                  className="h-8 w-8 shrink-0 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Grounded in your live financial data · Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
