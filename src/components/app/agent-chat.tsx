"use client";

import { useChat } from "ai/react";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Sparkles } from "lucide-react";
import type { UIMessage } from "ai";
import {
  parseAgentChatJson,
  serializeAgentMessagesForApi,
} from "@/lib/agent-chat-persist";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "smart-lp-agent-chat";

/** Gemini-adjacent palette (not official branding). */
const geminiSurface = "bg-[#f0f4f9]";
const geminiUserBubble = "bg-[#d3e3fd]";
const geminiSend = "bg-[#1a73e8] hover:bg-[#1557b0]";

function chatStorageKey(landingPageId: string) {
  return `${STORAGE_PREFIX}:${landingPageId}`;
}

function loadPersistedMessages(landingPageId: string): UIMessage[] {
  try {
    const raw = localStorage.getItem(chatStorageKey(landingPageId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

type Props = {
  landingPageId: string;
  /** Last saved transcript from the server; local-only history is merged if this is empty. */
  serverAgentChatJson?: string | null;
  /** Called when an assistant turn completes (e.g. after tools save the LP). */
  onAssistantTurnComplete?: () => void;
  /** Optional layout classes (e.g. `h-full` for side-by-side with preview). */
  className?: string;
};

function textFromMessage(m: {
  content?: unknown;
  parts?: { type: string; text?: string }[];
}): string {
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("");
  }
  return "";
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 pl-1" aria-hidden>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-pulse rounded-full bg-zinc-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

function AgentChatLoaded({
  landingPageId,
  serverAgentChatJson,
  onAssistantTurnComplete,
  className,
}: Props) {
  const initialMessages = useMemo(() => {
    const fromDb = parseAgentChatJson(
      serverAgentChatJson === null || serverAgentChatJson === undefined
        ? undefined
        : serverAgentChatJson,
    );
    if (fromDb.length > 0) return fromDb;
    return loadPersistedMessages(landingPageId);
  }, [landingPageId, serverAgentChatJson]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      id: `lp-agent-${landingPageId}`,
      api: "/api/chat",
      body: { landingPageId },
      initialMessages,
      maxSteps: 12,
      onFinish: () => {
        onAssistantTurnComplete?.();
      },
    });

  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/lp/${landingPageId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentMessages: serializeAgentMessagesForApi(messages),
            }),
            credentials: "same-origin",
          });
          if (res.ok) {
            try {
              localStorage.removeItem(chatStorageKey(landingPageId));
            } catch {
              /* private mode */
            }
          }
        } catch {
          /* offline */
        }
      })();
    }, 800);
    return () => window.clearTimeout(t);
  }, [messages, landingPageId]);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errText = error ? String((error as Error).message ?? error) : "";
  const showQuotaHint =
    /quota|billing|exceeded|resource|limit|429/i.test(errText);

  const MAX_COMPOSER_H = 200;

  const syncComposerHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_H)}px`;
  }, []);

  useEffect(() => {
    syncComposerHeight();
  }, [input, syncComposerHeight]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div
      className={cn(
        "flex min-h-[min(80vh,720px)] flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 shadow-sm lg:h-full lg:min-h-0",
        geminiSurface,
        className,
      )}
    >
      <header className="shrink-0 border-b border-zinc-200/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200/80">
            <Sparkles className="h-[18px] w-[18px] text-[#1a73e8]" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-medium tracking-tight text-zinc-900">
              Campaign agent
            </h2>
            <p className="truncate text-xs text-zinc-500">
              Share your goal and site — theme, LP draft, tags &amp; Wix
            </p>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="min-h-[200px] min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-3 sm:px-4 lg:min-h-0 [scrollbar-gutter:stable]"
          role="region"
          aria-label="Campaign agent messages"
        >
          <ul className="flex flex-col gap-5">
            {messages.length === 0 ? (
              <li className="px-1 py-8 text-center text-[15px] leading-relaxed text-zinc-600">
                Try asking for a campaign goal and your website, for example:{' '}
                <span className="text-zinc-800">
                  &quot;Goal is demo bookings for my dental practice. Our site is
                  https://example.com&quot;
                </span>
              </li>
            ) : null}
            {messages.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="flex w-full justify-end">
                  <div
                    className={cn(
                      "max-w-[min(100%,26rem)] rounded-[1.15rem] px-3.5 py-2.5 text-[15px] leading-relaxed text-zinc-900 shadow-sm sm:max-w-[min(100%,32rem)]",
                      geminiUserBubble,
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {textFromMessage(m as UIMessage)}
                    </div>
                  </div>
                </li>
              ) : (
                <li key={m.id} className="flex w-full justify-start gap-2.5">
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200/70"
                    aria-hidden
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#1a73e8]" />
                  </div>
                  <div className="min-w-0 max-w-[min(100%,36rem)] pt-0.5 text-[15px] leading-relaxed text-zinc-800">
                    <div className="whitespace-pre-wrap break-words">
                      {textFromMessage(m as UIMessage)}
                    </div>
                  </div>
                </li>
              ),
            )}
            {isLoading ? (
              <li className="flex items-center gap-2 pl-0.5 text-sm text-zinc-500">
                <ThinkingDots />
                <span className="sr-only">Assistant is replying</span>
              </li>
            ) : null}
            {error ? (
              <li className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
                <span className="font-medium">Something went wrong</span>
                <span className="mt-1 block text-red-700">{errText}</span>
                {showQuotaHint ? (
                  <span className="mt-2 block text-xs text-red-800/90">
                    For Gemini, confirm <code className="rounded bg-red-100/80 px-1">GOOGLE_GENERATIVE_AI_API_KEY</code> in{" "}
                    <code className="rounded bg-red-100/80 px-1">.env</code>, enable the Generative Language API, and check
                    quota / billing in Google AI Studio.
                  </span>
                ) : null}
              </li>
            ) : null}
            <div ref={endRef} className="h-px shrink-0" />
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className={cn(
            "shrink-0 border-t border-zinc-200/60 p-3 sm:p-4",
            geminiSurface,
          )}
        >
          <div className="flex min-h-[48px] min-w-0 items-end gap-2 rounded-3xl bg-white py-2 pl-4 pr-2 shadow-sm transition-shadow focus-within:shadow-md">
            <textarea
              ref={textareaRef}
              name="message"
              rows={1}
              value={input}
              onChange={(e) => {
                handleInputChange(
                  e as unknown as React.ChangeEvent<HTMLInputElement>,
                );
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                if (e.shiftKey) return;
                e.preventDefault();
                if (isLoading || !input.trim()) return;
                e.currentTarget.form?.requestSubmit();
              }}
              placeholder="Ask anything about your landing page…"
              disabled={isLoading}
              className="max-h-[200px] min-h-[44px] min-w-0 flex-1 resize-none overflow-y-auto rounded-none border-0 bg-transparent px-0 py-2 text-[15px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 shadow-none ring-0 ring-offset-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none disabled:opacity-60"
              aria-label="Message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className={cn(
                "mb-0.5 h-10 w-10 shrink-0 rounded-full text-white shadow-sm",
                geminiSend,
              )}
            >
              <Send className="h-4 w-4" strokeWidth={2.25} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Avoids SSR mismatch; inner chat hydrates from DB (or legacy localStorage when DB transcript is empty). */
export function AgentChat(props: Props) {
  const { className, ...rest } = props;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex min-h-[min(80vh,720px)] flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 shadow-sm lg:h-full lg:min-h-0",
          geminiSurface,
          className,
        )}
      >
        <header className="shrink-0 border-b border-zinc-200/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white shadow-sm ring-1 ring-zinc-200/80" />
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-zinc-200/80" />
              <div className="h-3 w-48 max-w-full rounded bg-zinc-200/60" />
            </div>
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-[200px] flex-1 px-4 py-4 lg:min-h-0" />
          <div className="shrink-0 border-t border-zinc-200/60 p-3 sm:p-4">
            <div className="flex min-h-12 items-end gap-2 rounded-3xl bg-white px-4 py-2 shadow-sm">
              <div className="mb-2 min-h-6 flex-1 rounded bg-zinc-100" />
              <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <AgentChatLoaded {...rest} className={className} />;
}
