import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  source,
  children,
  className = "",
}: {
  title: string;
  subtitle?: ReactNode;
  source?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-lg border border-cgy-line bg-white p-4 sm:p-5 ${className}`}>
      <header className="mb-4">
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-cgy-grey">{subtitle}</p>}
      </header>
      {children}
      {source && (
        <p className="mt-3 font-mono text-[11px] text-cgy-grey">
          gold.<span className="text-cgy-charcoal">{source}</span>
        </p>
      )}
    </section>
  );
}

export function PanelState({ error, height = 260 }: { error?: string | null; height?: number }) {
  return (
    <div className="flex items-center justify-center rounded bg-cgy-paper text-sm text-cgy-grey" style={{ height }}>
      {error ? <span className="px-4 text-cgy-red">Query failed: {error}</span> : "Loading from DuckDB…"}
    </div>
  );
}
