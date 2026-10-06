import Link from "next/link";
import type { Kpi } from "@/lib/kpis";

/** Proof points styled like a results row: number, what it means, and where it came from. */
export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <ul className="grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
      {items.map((k) => (
        <li key={k.label} className="border-b border-r border-line">
          <Link href={k.href} className="group flex h-full flex-col p-5 transition-colors hover:bg-surface">
            <span className="num text-3xl font-medium sm:text-[2.5rem] sm:leading-none">
              {k.before && (
                <span className="text-muted">
                  {k.before}
                  <span className="text-accent"> → </span>
                </span>
              )}
              <span className={k.todo ? "text-muted" : undefined}>{k.value}</span>
            </span>
            <span className="mt-3 text-pretty text-sm">{k.label}</span>
            <span className="mt-auto pt-4 font-mono text-[0.7rem] uppercase tracking-wider text-muted group-hover:text-accent-ink">
              ↳ {k.source}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
