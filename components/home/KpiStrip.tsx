import Link from "next/link";
import type { Kpi } from "@/lib/kpis";

/**
 * BRAND.md section 6, metric: large mono number in --color-text, small muted
 * label underneath. Accent only on the single most important one.
 */
export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((k) => (
        <li key={k.label}>
          <Link
            href={k.href}
            className="flex h-full flex-col rounded-md border border-border p-6 transition-colors hover:border-accent"
          >
            {k.before && <span className="num text-sm text-text-muted">from {k.before}</span>}
            <span className={`num text-3xl ${k.key ? "text-accent" : ""}`}>{k.value}</span>
            <span className="mt-2 text-sm text-text-muted">{k.label}</span>
            <span className="meta mt-auto pt-4">{k.source}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
