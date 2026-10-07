"use client";

import { track } from "@/lib/analytics";
import type { DatasetKey } from "@/lib/lab/datasets";

/**
 * A chart panel with its SQL one click away. Showing the query is the point:
 * every number on the Lab page can be checked.
 */
export function QueryCard({
  dataset,
  title,
  subtitle,
  sql,
  ms,
  loading,
  error,
  children,
  className = "",
}: {
  dataset: DatasetKey;
  title: string;
  subtitle?: string;
  sql: string;
  ms?: number | null;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col border border-border bg-surface ${className}`}>
      <header className="flex items-start justify-between gap-4 px-4 pt-4 sm:px-6">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
        </div>
        <span className="num shrink-0 pt-1 text-xs text-text-muted" aria-live="polite">
          {loading ? "running…" : ms != null ? `${Math.max(1, Math.round(ms))} ms` : ""}
        </span>
      </header>
      <div className={`flex-1 px-4 py-4 sm:px-6 ${loading ? "opacity-50" : ""}`}>
        {error ? <p className="font-mono text-sm text-accent">Query failed: {error}</p> : children}
      </div>
      <details
        className="group border-t border-border"
        onToggle={(e) => e.currentTarget.open && track("lab_sql_viewed", { dataset, panel: title })}
      >
        <summary className="cursor-pointer list-none px-4 py-2 font-mono text-xs text-text-muted hover:text-text sm:px-6">
          <span className="group-open:hidden">Show SQL ↓</span>
          <span className="hidden group-open:inline">Hide SQL ↑</span>
        </summary>
        <pre className="overflow-x-auto bg-bg px-4 py-3 font-mono text-xs leading-relaxed sm:px-6">
          <code>{sql.trim()}</code>
        </pre>
      </details>
    </section>
  );
}
