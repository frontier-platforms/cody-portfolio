"use client";

import type { ManifestEntry, Pipeline } from "@/lib/pipelines/types";
import { useLiveResults } from "./live-results";

/** The lab header's three findings: from the production run, or recomputed by a live run in this tab. */
export function Findings({ pipeline, run }: { pipeline: Pipeline["id"]; run: ManifestEntry | undefined }) {
  const live = useLiveResults(pipeline).find((r) => r.highlights);
  const highlights = live?.highlights ?? run?.highlights ?? [];

  return (
    <>
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
      {(live || run) && (
        <p className="meta mt-4" aria-live="polite">
          {live
            ? "Recomputed by your live run, just now."
            : `Computed by the pipeline on ${new Date(run!.runAt).toLocaleDateString("en-CA", { dateStyle: "medium" })}.`}{" "}
          <a href="#pipeline" className="link">
            See how
          </a>
        </p>
      )}
    </>
  );
}
