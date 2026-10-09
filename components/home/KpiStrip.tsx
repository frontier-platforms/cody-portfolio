import Link from "next/link";
import type { Kpi } from "@/lib/kpis";

/**
 * BRAND.md section 6, metric strip: four centred accent numbers with a short
 * label and where it's from. Compact so it shares the first screen with the
 * hero; two by two on phones.
 */
export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {items.map((k) => (
        <li key={k.label}>
          <Link
            href={k.href}
            className="flex h-full flex-col items-center rounded-md border border-border px-3 py-4 text-center transition-colors hover:border-accent sm:px-4"
          >
            <span className="num text-3xl text-accent sm:text-4xl">{k.value}</span>
            <span className="mt-2 text-sm text-text-muted">{k.label}</span>
            <span className="meta mt-auto pt-3">{k.source}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
