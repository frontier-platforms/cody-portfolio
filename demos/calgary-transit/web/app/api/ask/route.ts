import Anthropic from "@anthropic-ai/sdk";
import { MODEL, SYSTEM_PROMPT, TOOLS } from "@/lib/agent/prompt";

let client: Anthropic | null = null;

const MAX_MESSAGES = 16;
const MAX_QUESTION_CHARS = 500;
const RATE_LIMIT = { windowMs: 60_000, max: 20 };
const hits = new Map<string, number[]>();

// Best-effort per-instance limit so a public URL can't run up the API bill quickly.
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT.max;
}

function invalid(messages: unknown): string | null {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > MAX_MESSAGES) return "Conversation is too long. Start a new question.";
  const first = messages[0] as { role?: string; content?: unknown };
  if (first.role !== "user" || typeof first.content !== "string") return "first message must be the user's question";
  if (first.content.length > MAX_QUESTION_CHARS) return `Questions are limited to ${MAX_QUESTION_CHARS} characters.`;
  return null;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many questions in a minute. Try again shortly." }, { status: 429 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "The AI agent isn't configured on this deployment." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { messages?: unknown } | null;
  const problem = invalid(body?.messages);
  if (problem) return Response.json({ error: problem }, { status: 400 });

  try {
    client ??= new Anthropic();
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      cache_control: { type: "ephemeral" },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: body!.messages as Anthropic.Beta.BetaMessageParam[],
    });
    return Response.json({ content: response.content, stop_reason: response.stop_reason });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "The model is busy. Try again in a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "The AI agent isn't configured on this deployment." }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      return Response.json({ error: `Model request failed (${error.status}).` }, { status: 502 });
    }
    throw error;
  }
}
