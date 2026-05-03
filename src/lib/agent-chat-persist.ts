import type { UIMessage } from "ai";

const MAX_AGENT_CHAT_BYTES = 500_000;

/**
 * `useChat` message objects can include non-JSON data; normalize to a plain array
 * so PATCH bodies and Prisma stringification never throw.
 */
export function serializeAgentMessagesForApi(messages: UIMessage[]): unknown[] {
  try {
    const s = JSON.stringify(messages, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (typeof value === "function" || typeof value === "symbol")
        return undefined;
      return value;
    });
    return JSON.parse(s) as unknown[];
  } catch {
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: typeof m.content === "string" ? m.content : "",
    }));
  }
}

/** Parse stored LP agent chat JSON into UI messages. */
export function parseAgentChatJson(raw: string | null | undefined): UIMessage[] {
  if (!raw?.trim()) return [];
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return [];
    return p as UIMessage[];
  } catch {
    return [];
  }
}

/** Serialize for PATCH body validation (approximate byte size). */
export function agentChatJsonTooLarge(messages: unknown[]): boolean {
  try {
    return JSON.stringify(messages).length > MAX_AGENT_CHAT_BYTES;
  } catch {
    return true;
  }
}
