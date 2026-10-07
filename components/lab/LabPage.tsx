import { PipelineSection } from "@/components/pipeline/PipelineSection";
import { Section } from "@/components/ui/Section";
import { labFor } from "@/lib/lab/catalog";
import { datasets, type DatasetKey } from "@/lib/lab/datasets";
import { pipelines } from "@/lib/pipelines/index";
import { manifest } from "@/lib/pipelines/manifest";
import { LabHero } from "./LabHero";
import { WhyItMatters } from "./WhyItMatters";

type Extra = { id: string; label: string; intro: React.ReactNode; content: React.ReactNode };

/**
 * Shared shell for a lab: a header with this dataset's findings and question
 * bar, then the dashboard, any extra sections (housing adds its model), why it
 * matters to a business, and the pipeline behind all of it.
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
  const run = manifest.pipelines[dataset];
  const sections: Extra[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      intro: (
        <>
          {intro}
          <p className="text-sm">Source: {datasets[dataset].source}</p>
        </>
      ),
      content: dashboard,
    },
    ...extras,
    {
      id: "why",
      label: "Why it matters",
      intro: (
        <p>Anyone can generate a dashboard now. The value is knowing what to build, and what it’s for.</p>
      ),
      content: <WhyItMatters lab={lab} />,
    },
    {
      id: "pipeline",
      label: "Pipeline",
      intro: (
        <p>
          Every number above comes from this pipeline: raw, cleaned and business-ready layers, with tests and
          a contract. It runs weekly on GitHub Actions, and in your browser when you press the button.
        </p>
      ),
      content: <PipelineSection pipeline={pipeline} run={run} history={manifest.history?.[dataset] ?? []} />,
    },
  ];

  return (
    <>
      <LabHero lab={lab} run={run} />

      <nav aria-label="On this page" className="mx-auto mt-8 max-w-site px-4 sm:px-6">
        <ul className="flex flex-wrap gap-x-6 font-mono text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="link inline-flex min-h-11 items-center">
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
          className={i === 0 ? "mt-8" : "mt-12 sm:mt-16"}
        >
          <div className="mb-6 max-w-measure space-y-3 text-text-muted">{s.intro}</div>
          {s.content}
        </Section>
      ))}
    </>
  );
}
