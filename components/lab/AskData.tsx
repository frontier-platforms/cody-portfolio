"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";
import { checkSql, datasets, type DatasetKey } from "@/lib/lab/datasets";
import { BarChart, LineChart } from "./charts";
import { runQuery, type Row } from "./db";

type Answer = {
  explanation: string;
  sql: string | null;
  chart?: "bar" | "line" | "table";
  x?: string;
  y?: string;
};
type Result = { rows: Row[]; columns: string[]; ms: number };

export function AskData({ dataset }: { dataset: DatasetKey }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<"idle" | "thinking" | "running">("idle");
  const [error, setError] = useState<string | null>(null);

  /** Runs SQL in the browser. Returns false if it was rejected or failed. */
  async function execute(query: string) {
    const check = checkSql(query);
    if (!check.ok) {
      setError(check.reason);
      return false;
    }
    setStatus("running");
    setError(null);
    try {
      // The outer LIMIT is a hard cap regardless of what the query asks for.
      setResult(await runQuery(`SELECT * FROM (${check.sql}) LIMIT 200`, `ask: ${dataset}`));
      return true;
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
      return false;
    } finally {
      setStatus("idle");
    }
  }

  async function ask(q: string, source: "typed" | "example") {
    if (q.trim().length < 3) return;
    const started = performance.now();
    track("ask_submitted", { dataset, source, length: q.length });
    const done = (outcome: "answered" | "declined" | "error") =>
      track("ask_completed", { dataset, outcome, latency_ms: Math.round(performance.now() - started) });
    setQuestion(q);
    setStatus("thinking");
    setError(null);
    setAnswer(null);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset, question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setAnswer(data);
      if (data.sql) {
        setSql(data.sql);
        done((await execute(data.sql)) ? "answered" : "error");
      } else {
        setStatus("idle");
        done("declined");
      }
    } catch (e) {
      setError((e as Error).message);
      setStatus("idle");
      done("error");
    }
  }

  const ds = datasets[dataset];

  return (
    <div className="border border-border bg-surface rounded-md">
      <div className="space-y-4 p-4 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question, "typed");
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="ask-input" className="sr-only">
            Your question about {ds.label}
          </label>
          <input
            id="ask-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={300}
            placeholder={ds.examples[0]}
            className="min-w-0 flex-1 border border-border bg-bg px-3 py-3 text-base outline-none focus:border-text rounded-md"
          />
          <button
            type="submit"
            disabled={status !== "idle"}
            className="btn btn-primary justify-center disabled:opacity-60"
          >
            {status === "thinking" ? "Writing SQL…" : status === "running" ? "Running…" : "Ask"}
          </button>
        </form>
        <ul className="flex flex-wrap gap-2" aria-label="Example questions">
          {ds.examples.map((ex) => (
            <li key={ex}>
              <button
                type="button"
                onClick={() => ask(ex, "example")}
                disabled={status !== "idle"}
                className="border border-border px-2 py-1 text-left text-xs text-text-muted transition-colors hover:border-text hover:text-text rounded-md"
              >
                {ex}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div aria-live="polite" className="border-t border-border">
        {error && <p className="px-4 py-3 font-mono text-sm text-accent sm:px-6">{error}</p>}
        {answer && <p className="px-4 pt-4 text-base sm:px-6">{answer.explanation}</p>}
        {result && answer && <ResultView result={result} answer={answer} />}
      </div>

      {(answer?.sql || sql) && (
        <details className="group border-t border-border" open={false}>
          <summary className="cursor-pointer list-none px-4 py-2 font-mono text-xs text-text-muted hover:text-text sm:px-6">
            <span className="group-open:hidden">SQL Claude wrote. Edit and re-run it ↓</span>
            <span className="hidden group-open:inline">Hide SQL ↑</span>
          </summary>
          <div className="space-y-2 px-4 pb-4 sm:px-6">
            <label htmlFor="sql-editor" className="sr-only">
              SQL query
            </label>
            <textarea
              id="sql-editor"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={Math.min(14, sql.split("\n").length + 1)}
              spellCheck={false}
              className="w-full border border-border bg-bg p-3 font-mono text-xs leading-relaxed outline-none focus:border-text rounded-md"
            />
            <button
              type="button"
              onClick={() => {
                track("ask_sql_rerun", { dataset });
                execute(sql);
              }}
              disabled={status !== "idle"}
              className="btn text-sm"
            >
              Run SQL
            </button>
          </div>
        </details>
      )}
    </div>
  );
}

function ResultView({ result, answer }: { result: Result; answer: Answer }) {
  const { rows, columns, ms } = result;
  const x = answer.x && columns.includes(answer.x) ? answer.x : null;
  const y = answer.y && columns.includes(answer.y) ? answer.y : null;
  const numeric = y != null && rows.every((r) => typeof r[y] === "number" || r[y] == null);

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6">
      <p className="num text-xs text-text-muted">
        {rows.length} row{rows.length === 1 ? "" : "s"} · {Math.max(1, Math.round(ms))} ms in your browser
      </p>
      {answer.chart === "bar" && x && numeric && rows.length <= 40 && (
        <BarChart
          data={rows.map((r) => ({ label: String(r[x]), value: Number(r[y!] ?? 0) }))}
          summary={`Bar chart of ${y} by ${x}.`}
        />
      )}
      {answer.chart === "line" && x && numeric && rows.length > 1 && (
        <LineChart
          series={[
            {
              name: y!,
              color: "var(--color-data-1)",
              width: 2,
              points: rows.map((r, i) => ({ x: i + 1, y: Number(r[y!] ?? 0) })),
            },
          ]}
          xLabel={`${x} →`}
          yLabel={y!}
          summary={`Line chart of ${y} over ${x}.`}
        />
      )}
      <div className="max-h-80 overflow-auto border border-border rounded-md">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-bg">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="whitespace-nowrap border-b border-border px-3 py-2 font-mono text-xs font-regular text-text-muted"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((c) => (
                  <td
                    key={c}
                    className={`whitespace-nowrap px-3 py-2 ${typeof r[c] === "number" ? "num text-right" : ""}`}
                  >
                    {formatCell(c, r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellFormat = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });

/** Years and ids print as-is; other numbers get separators. */
function formatCell(column: string, value: Row[string]) {
  if (typeof value !== "number") return String(value ?? "");
  if (/year|id$|game/i.test(column)) return String(value);
  return cellFormat.format(value);
}
