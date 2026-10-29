"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import { getConnection, query, type QueryResult } from "@/lib/duckdb";
import { checkSql } from "@/lib/agent/sql-guard";
import { fmtNumber } from "@/lib/format";
import { ResultChart, chartSpec } from "./result-chart";
import { withBase } from "@/lib/paths";

export type ChartHint = { x: string; y: string[] };

/** The agent marks the query to chart with a leading comment: `-- chart: x=year y=bus,ctrain`. */
function parseChartHint(sql: string): ChartHint | undefined {
  const m = sql.match(/--[ \t]*chart:[ \t]*x[ \t]*=[ \t]*(\w+)[ \t]+y[ \t]*=[ \t]*([\w, \t]+)/i);
  if (!m) return undefined;
  const y = m[2]
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  return y.length ? { x: m[1], y } : undefined;
}
type Step = { sql: string; chart?: ChartHint; result?: QueryResult; error?: string };
type Turn = {
  question: string;
  steps: Step[];
  answer?: string;
  error?: string;
  status: "thinking" | "querying" | "done";
};
type ApiResponse = { content?: Anthropic.Beta.BetaContentBlock[]; stop_reason?: string; error?: string };

const MAX_ROUNDS = 8;
// Years, months and codes read better without thousands separators.
const PLAIN_COLUMN = /(^|_)(year|month|quarter|weekday|code|id)$/i;
const MAX_ROWS_TO_MODEL = 100;

// Each one has a clear, chartable answer in the gold tables.
const SUGGESTIONS = [
  "How has ridership recovered since the pandemic?",
  "Has CTrain or bus recovered more since 2019?",
  "Which fare products have grown since 2019?",
  "Is each service hour carrying as many riders as in 2019?",
  "Which communities file the most transit 311 requests?",
  "Which 311 request types take longest to close?",
];

async function ask(messages: Anthropic.Beta.BetaMessageParam[]): Promise<ApiResponse> {
  const res = await fetch(withBase("/api/ask"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = (await res.json().catch(() => ({}))) as ApiResponse;
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}

async function runTool(sql: string): Promise<{ step: Step; content: string; isError: boolean }> {
  const problem = checkSql(sql);
  if (problem) return { step: { sql, error: problem }, content: problem, isError: true };
  try {
    const result = await query(sql);
    const payload = {
      columns: result.columns,
      row_count: result.rows.length,
      rows: result.rows.slice(0, MAX_ROWS_TO_MODEL),
      truncated: result.rows.length > MAX_ROWS_TO_MODEL,
    };
    return { step: { sql, result }, content: JSON.stringify(payload), isError: false };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { step: { sql, error: message }, content: message, isError: true };
  }
}

export function Ask() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const busy = turns.some((t) => t.status !== "done");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const update = (index: number, patch: (t: Turn) => Turn) =>
    setTurns((all) => all.map((t, i) => (i === index ? patch(t) : t)));

  async function run(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    // One answer at a time: a new question replaces the last one.
    const index = 0;
    setTurns([{ question: q, steps: [], status: "thinking" }]);
    getConnection().catch(() => {});

    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: q }];
    try {
      for (let round = 0; round < MAX_ROUNDS; round++) {
        const response = await ask(messages);
        const content = response.content ?? [];
        messages.push({ role: "assistant", content: content as Anthropic.Beta.BetaContentBlockParam[] });

        if (response.stop_reason === "refusal") {
          update(index, (t) => ({
            ...t,
            status: "done",
            error: "The model declined to answer this question.",
          }));
          return;
        }
        const toolUses = content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
        if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
          const answer = content
            .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
            .map((b) => b.text)
            .join("\n\n")
            .trim();
          update(index, (t) => ({ ...t, status: "done", answer: answer || "No answer was returned." }));
          return;
        }

        update(index, (t) => ({ ...t, status: "querying" }));
        const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const use of toolUses) {
          const sql =
            typeof (use.input as { sql?: unknown }).sql === "string"
              ? (use.input as { sql: string }).sql
              : "";
          const { step, content: out, isError } = await runTool(sql);
          const hint = parseChartHint(sql);
          update(index, (t) => ({ ...t, steps: [...t.steps, hint ? { ...step, chart: hint } : step] }));
          results.push({ type: "tool_result", tool_use_id: use.id, content: out, is_error: isError });
        }
        messages.push({ role: "user", content: results });
        update(index, (t) => ({ ...t, status: "thinking" }));
      }
      update(index, (t) => ({
        ...t,
        status: "done",
        error: "The agent ran out of steps for this question.",
      }));
    } catch (e) {
      update(index, (t) => ({ ...t, status: "done", error: e instanceof Error ? e.message : String(e) }));
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    run(input);
  }

  return (
    <div className="mt-8">
      <form
        onSubmit={submit}
        className="rounded-lg border border-cgy-silver bg-white p-2 focus-within:border-cgy-blue"
      >
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <textarea
          id="question"
          ref={inputRef}
          rows={2}
          maxLength={500}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run(input);
            }
          }}
          placeholder="e.g. How many trips did Calgary Transit carry in 2024?"
          className="w-full resize-none border-0 bg-transparent px-2 py-1 text-base outline-none"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-1">
          <span className="text-xs text-cgy-grey">Enter to ask · Shift+Enter for a new line</span>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded bg-cgy-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-cgy-red-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => run(s)}
            className="rounded-full border border-cgy-line bg-cgy-paper px-3 py-1 text-left text-sm text-cgy-slate hover:border-cgy-red hover:text-cgy-red disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {turns[0] && (
        <div className="mt-8">
          <TurnView turn={turns[0]} />
        </div>
      )}
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  // Chart the richest result: follow-up queries are often small checks, the main series is usually the largest.
  // The agent marks the query to chart; otherwise use the largest result, since follow-ups are often small checks.
  const specs = turn.steps.map((s) => (s.result ? chartSpec(s.result, s.chart) : null));
  const hinted = turn.steps.findLastIndex((s, i) => s.chart && specs[i]);
  const chart =
    hinted >= 0
      ? specs[hinted]
      : specs.filter((c) => c !== null).sort((a, b) => b.rows.length - a.rows.length)[0];
  return (
    <article className="rounded-lg border border-cgy-line bg-white">
      <header className="border-b border-cgy-line bg-cgy-paper px-4 py-3">
        <p className="font-semibold text-cgy-slate">{turn.question}</p>
      </header>
      <div className="space-y-4 p-4">
        {turn.answer && <Answer text={turn.answer} />}
        {turn.status === "done" && chart && <ResultChart spec={chart} />}
        {turn.error && <p className="text-sm text-cgy-red">{turn.error}</p>}
        {turn.status !== "done" && (
          <p className="flex items-center gap-2 text-sm text-cgy-grey">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cgy-red" />
            {turn.status === "querying" ? "Running the query…" : "Working on it…"}
          </p>
        )}
        {turn.steps.length > 0 && turn.status === "done" && (
          <details className="group rounded border border-cgy-line">
            <summary className="cursor-pointer list-none px-3 py-2 text-sm font-semibold text-cgy-slate hover:text-cgy-red">
              <span className="mr-1 inline-block transition-transform group-open:rotate-90">›</span>
              Show how this was answered ({turn.steps.length} SQL{" "}
              {turn.steps.length === 1 ? "query" : "queries"})
            </summary>
            <div className="space-y-3 border-t border-cgy-line p-3">
              {turn.steps.map((s, i) => (
                <StepView key={i} step={s} />
              ))}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

function StepView({ step }: { step: Step }) {
  const rows = step.result?.rows ?? [];
  const cols = step.result?.columns ?? [];
  return (
    <div className="overflow-hidden rounded border border-cgy-line">
      <pre className="overflow-x-auto bg-cgy-slate p-3 font-mono text-xs leading-relaxed text-white">
        {step.sql.trim()}
      </pre>
      {step.error ? (
        <p className="bg-white px-3 py-2 text-xs text-cgy-red">
          Error: {step.error} (the agent sees this and retries)
        </p>
      ) : (
        <div className="max-h-48 overflow-auto">
          <table className="tabular w-full text-left text-xs">
            <thead className="sticky top-0 bg-cgy-mist">
              <tr>
                {cols.map((c) => (
                  <th key={c} className="whitespace-nowrap px-3 py-1.5 font-semibold text-cgy-slate">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((r, i) => (
                <tr key={i} className="border-t border-cgy-line">
                  {cols.map((c) => (
                    <td key={c} className="whitespace-nowrap px-3 py-1">
                      {typeof r[c] === "number" && !PLAIN_COLUMN.test(c)
                        ? fmtNumber(r[c] as number, Number.isInteger(r[c]) ? 0 : 2)
                        : String(r[c] ?? "–")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 10 && (
            <p className="px-3 py-1.5 text-xs text-cgy-grey">First 10 of {rows.length} rows.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Answer({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-lg leading-relaxed text-cgy-charcoal">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{inline(p)}</p>
      ))}
    </div>
  );
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="text-cgy-slate">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="rounded bg-cgy-mist px-1 font-mono text-[13px]">
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}
