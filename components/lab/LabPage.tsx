import Link from "next/link";
import { PipelineSection } from "@/components/pipeline/PipelineSection";
import { Section } from "@/components/ui/Section";
import { datasets, type DatasetKey } from "@/lib/lab/datasets";
import { pipelines } from "@/lib/pipelines/index";
import { manifest } from "@/lib/pipelines/manifest";
import { AskDemo } from "./LabDemos";

/** Shared shell for a Lab tab: dashboard, Ask the data, and the pipeline behind both. */
export function LabPage({
  dataset,
  intro,
  dashboard,
}: {
  dataset: DatasetKey;
  intro: React.ReactNode;
  dashboard: React.ReactNode;
}) {
  const pipeline = pipelines[dataset];
  return (
    <>
      <nav aria-label="On this page" className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-sm">
          <li>
            <a href="#dashboard" className="link">
              Dashboard
            </a>
          </li>
          <li>
            <a href="#ask" className="link">
              Ask the data
            </a>
          </li>
          <li>
            <a href="#pipeline" className="link">
              Pipeline
            </a>
          </li>
        </ul>
      </nav>

      <Section index="01" label="Dashboard" id="dashboard" className="mt-10">
        <div className="mb-6 max-w-2xl space-y-3 text-muted">
          {intro}
          <p className="text-xs">Source: {datasets[dataset].source}</p>
        </div>
        {dashboard}
      </Section>

      <Section index="02" label="Ask the data" id="ask" className="mt-24">
        <div className="mb-6 max-w-2xl space-y-3 text-muted">
          <p>
            Ask a question in plain English. Claude writes one SQL query, the site checks it, and your browser
            runs it. You get the answer, a chart and the SQL, and you can edit the SQL and run it yourself.
          </p>
          <p className="text-xs">
            Claude only sees your question and the table schemas.{" "}
            <Link href="/colophon#ai" className="link">
              How the guardrails work
            </Link>
            .
          </p>
        </div>
        <AskDemo dataset={dataset} />
      </Section>

      <Section index="03" label="Pipeline" id="pipeline" className="mt-24">
        <div className="mb-6 max-w-2xl space-y-3 text-muted">
          <p>
            The data above comes from a tested, scheduled pipeline: raw (bronze), cleaned (silver) and
            business-ready (gold) layers, the same pattern I used to rebuild StellarAlgo’s platform. The same
            definitions run weekly on GitHub Actions and, when you press the button, in your browser.
          </p>
        </div>
        <PipelineSection pipeline={pipeline} run={manifest.pipelines[dataset]} />
      </Section>
    </>
  );
}
