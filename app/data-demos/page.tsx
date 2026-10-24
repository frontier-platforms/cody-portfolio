import type { Metadata } from "next";

// Shared by direct link only: not in the nav, the sitemap or the command menu, and not indexed.
export const metadata: Metadata = {
  title: "Data demos",
  description: "Working data products built end to end on public data.",
  robots: { index: false, follow: false },
};

type Demo = {
  href: string;
  meta: string;
  title: string;
  summary: string;
  metric: { value: string; label: string };
};

const DEMOS: Demo[] = [
  {
    // Served by a separate Next.js app (demos/calgary-transit/web), so this is a full page load.
    href: "/data-demos/calgary-transit",
    meta: "Public sector · City of Calgary open data",
    title: "Calgary Transit data product",
    summary:
      "Ridership, service hours and 311 requests in one governed layer, with a live dashboard and an AI agent that shows its SQL.",
    metric: { value: "27", label: "dbt tests on every daily run" },
  },
];

export default function DataDemos() {
  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <p className="label">Data demos</p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">
        Working data products, built end to end.
      </h1>
      <p className="mt-6 max-w-measure text-lg text-text-muted">
        Each one runs on real public data. I built the pipeline, the tests, the dashboard and the AI layer.
      </p>

      <ul className="mt-12 grid gap-4 lg:grid-cols-2">
        {DEMOS.map((d) => (
          <li key={d.href}>
            <a
              href={d.href}
              className="group flex h-full flex-col rounded-md border border-border bg-surface p-6 transition-colors hover:border-accent"
            >
              <span className="meta">{d.meta}</span>
              <span className="mt-3 block text-xl font-semibold leading-snug">{d.title}</span>
              <span className="mt-2 block text-text-muted">{d.summary}</span>
              <span className="mt-auto block pt-6">
                <span className="num block text-2xl">{d.metric.value}</span>
                <span className="block text-sm text-text-muted">{d.metric.label}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
