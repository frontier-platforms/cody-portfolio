import Link from "next/link";
import type { Work } from "@/lib/work";
import { visibleNumbers } from "@/lib/work";

/** Ruled list of case studies, used on the home page and the work index. */
export function WorkList({ items }: { items: Work[] }) {
  return (
    <ol className="border-t border-line">
      {items.map((w, i) => {
        const lead = visibleNumbers(w.numbers)[0];
        return (
          <li key={w.slug} className="border-b border-line">
            <Link
              href={`/work/${w.slug}`}
              className="group grid gap-x-6 gap-y-2 py-6 sm:grid-cols-[3rem_1fr_13rem] sm:items-baseline"
            >
              <span className="num text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="label">{w.company}</span>
                <span className="mt-1 block text-xl font-semibold tracking-tight transition-colors group-hover:text-accent-ink sm:text-2xl">
                  {w.title}
                </span>
                <span className="mt-2 block max-w-2xl text-pretty text-muted">{w.summary}</span>
              </span>
              {lead && (
                <span className="sm:text-right">
                  <span className="num block whitespace-nowrap text-xl font-medium sm:text-2xl">
                    {lead.before && <span className="text-muted">{lead.before} → </span>}
                    {lead.value}
                  </span>
                  <span className="block text-xs text-muted">{lead.label}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
