import Link from "next/link";
import type { LabEntry } from "@/lib/lab/catalog";
import type { ManifestEntry } from "@/lib/pipelines/types";
import { AskDemo } from "./LabDemos";

/**
 * The top of a lab: what it is, three findings the pipeline computed on its
 * last run, and a question bar for this dataset. Each lab opens on its own
 * numbers, so the three pages don't load looking the same.
 */
export function LabHero({ lab, run }: { lab: LabEntry; run: ManifestEntry | undefined }) {
  const highlights = run?.highlights ?? [];
  return (
    <header className="mx-auto max-w-site px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="label">
        <span className="text-accent">Lab {lab.number}</span> · {lab.kicker}
      </p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">{lab.title}</h1>
      <p className="mt-4 max-w-measure text-pretty text-lg text-text-muted">{lab.lede}</p>

      {highlights.length > 0 && (
        <dl className="mt-8 grid gap-4 sm:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.label} className="flex flex-col-reverse justify-end border-l border-border pl-4">
              <dt className="text-sm text-text-muted">
                {h.label}
                {h.detail && <span className="block text-xs">{h.detail}</span>}
              </dt>
              <dd className="num text-2xl">{h.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {run && (
        <p className="meta mt-4">
          Computed by the pipeline on{" "}
          {new Date(run.runAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}.{" "}
          <a href="#pipeline" className="link">
            See how
          </a>
        </p>
      )}

      <div id="ask" className="mt-8 scroll-mt-24">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-body text-base font-semibold">{lab.askLabel}</h2>
          <p className="text-xs text-text-muted">
            Claude writes the SQL, your browser runs it.{" "}
            <Link href="/colophon#ai" className="link">
              Guardrails
            </Link>
          </p>
        </div>
        <AskDemo dataset={lab.dataset} />
      </div>
    </header>
  );
}
