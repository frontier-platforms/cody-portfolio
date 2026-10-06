import type { KeyNumber } from "@/lib/work";

/** Row of headline numbers. "before → after" pairs get the arrow treatment. */
export function KeyNumbers({ numbers }: { numbers: KeyNumber[] }) {
  if (numbers.length === 0) return null;
  return (
    <dl className="grid grid-cols-1 border-t border-line sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
      {numbers.map((n) => (
        <div key={n.label} className="border-b border-line py-5 sm:pr-6">
          <dt className="sr-only">{n.label}</dt>
          <dd className="num flex items-baseline gap-2 text-3xl font-medium sm:text-4xl">
            {n.before && (
              <>
                <span className="text-muted line-through decoration-1">{n.before}</span>
                <span aria-label="to" className="text-accent">
                  →
                </span>
              </>
            )}
            <span className={n.todo ? "text-muted" : undefined}>{n.value}</span>
          </dd>
          <dd className="mt-1.5 text-sm text-muted">
            {n.label}
            {n.todo && <span className="ml-2 font-mono text-xs text-accent-ink">[TODO]</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
