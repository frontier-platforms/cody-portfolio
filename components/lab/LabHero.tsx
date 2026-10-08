import type { LabEntry } from "@/lib/lab/catalog";
import type { ManifestEntry } from "@/lib/pipelines/types";
import { Findings } from "./Findings";

/**
 * The top of a lab: what it is and three findings the pipeline computed on
 * its last run. Each lab opens on its own numbers, so the three pages don't
 * load looking the same. The question bar sits below the dashboard.
 */
export function LabHero({ lab, run }: { lab: LabEntry; run: ManifestEntry | undefined }) {
  return (
    <header className="mx-auto max-w-site px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="label">
        <span className="text-accent">Lab {lab.number}</span> · {lab.kicker}
      </p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">{lab.title}</h1>
      <p className="mt-4 max-w-measure text-pretty text-lg text-text-muted">{lab.lede}</p>

      <Findings pipeline={lab.dataset} run={run} />
    </header>
  );
}
