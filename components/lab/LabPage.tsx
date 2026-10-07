import Link from "next/link";
import { PipelineSection } from "@/components/pipeline/PipelineSection";
import { Section } from "@/components/ui/Section";
import { labFor } from "@/lib/lab/catalog";
import { datasets, type DatasetKey } from "@/lib/lab/datasets";
import { pipelines } from "@/lib/pipelines/index";
import { manifest } from "@/lib/pipelines/manifest";
import { AskDemo } from "./LabDemos";

type Extra = { id: string; label: string; intro: React.ReactNode; content: React.ReactNode };

/**
 * Shared shell for a Lab tab: dashboard, optional extra sections (the housing
 * tab adds its model), Ask the data, and the pipeline behind all of it.
 */
export function LabPage({
  dataset,
  intro,
  dashboard,
  extras = [],
}: {
  dataset: DatasetKey;
  intro?: React.ReactNode;
  dashboard: React.ReactNode;
  extras?: Extra[];
}) {
  const pipeline = pipelines[dataset];
  const lab = labFor(dataset);
  const sections: Extra[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      intro: (
        <>
          {intro}
          <p className="text-xs">Source: {datasets[dataset].source}</p>
        </>
      ),
      content: dashboard,
    },
    ...extras,
    {
      id: "ask",
      label: "Ask the data",
      intro: (
        <>
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
        </>
      ),
      content: <AskDemo dataset={dataset} />,
    },
    {
      id: "pipeline",
      label: "Pipeline",
      intro: (
        <p>
          The data above comes from a tested, scheduled pipeline: raw (bronze), cleaned (silver) and
          business-ready (gold) layers, the same pattern I used to rebuild StellarAlgo’s platform. The same
          definitions run weekly on GitHub Actions and, when you press the button, in your browser.
        </p>
      ),
      content: <PipelineSection pipeline={pipeline} run={manifest.pipelines[dataset]} />,
    },
  ];

  return (
    <>
      <header className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
        <p className="label">
          <span className="text-accent">Lab {lab.number}</span> · {lab.kicker}
        </p>
        <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">{lab.title}</h1>
        <p className="mt-4 max-w-measure text-pretty text-lg text-text-muted">{lab.lede}</p>
      </header>

      <nav aria-label="On this page" className="mx-auto mt-6 max-w-site px-4 sm:px-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="link">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map((s, i) => (
        <Section
          key={s.id}
          index={String(i + 1).padStart(2, "0")}
          label={s.label}
          id={s.id}
          className={i === 0 ? "mt-12" : "mt-24"}
        >
          <div className="mb-6 max-w-measure space-y-3 text-text-muted">{s.intro}</div>
          {s.content}
        </Section>
      ))}
    </>
  );
}
