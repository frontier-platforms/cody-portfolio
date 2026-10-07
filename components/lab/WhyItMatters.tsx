import type { LabEntry } from "@/lib/lab/catalog";

/**
 * The part AI can't write for you: what each technique is worth to a sales or
 * marketing team, and the judgment calls behind the build.
 */
export function WhyItMatters({ lab }: { lab: LabEntry }) {
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div>
        <h3 className="text-xl">In a sales or marketing team</h3>
        <p className="mt-2 max-w-measure text-text-muted">The same techniques, applied to revenue data.</p>
        <ul className="mt-6 space-y-4">
          {lab.inYourTeam.map((item) => (
            <li key={item.technique} className="rounded-md border border-border bg-surface p-4">
              <p className="meta">{item.technique}</p>
              <p className="mt-2">{item.translation}</p>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-xl">Decisions and trade-offs</h3>
        <p className="mt-2 max-w-measure text-text-muted">What I chose, why, and what it cost.</p>
        <ol className="mt-6 border-t border-border">
          {lab.decisions.map((d) => (
            <li key={d.decision} className="border-b border-border py-4">
              <p className="font-semibold">{d.decision}</p>
              <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[6rem_1fr]">
                <dt className="meta sm:pt-1">Why</dt>
                <dd>{d.why}</dd>
                <dt className="meta sm:pt-1">Trade-off</dt>
                <dd className="text-text-muted">{d.tradeoff}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
