import Link from "next/link";
import type { Work } from "@/lib/work";
import { visibleNumbers } from "@/lib/work";

/**
 * BRAND.md section 6, project card: mono label (industry and company), title,
 * one-line summary, one metric in mono. The whole card is the link. Border,
 * no shadow, --radius-md, border turns accent on hover.
 */
export function ProjectCard({ work }: { work: Work }) {
  const metric = visibleNumbers(work.numbers)[0];
  return (
    <Link
      href={`/work/${work.slug}`}
      className="group flex h-full flex-col rounded-md border border-border bg-surface p-6 transition-colors hover:border-accent"
    >
      <span className="meta">
        {work.industry} · {work.company}
      </span>
      <span className="mt-3 block text-xl font-semibold leading-snug">{work.title}</span>
      <span className="mt-2 block text-text-muted">{work.summary}</span>
      {metric && (
        <span className="mt-auto block pt-6">
          <span className="num block text-2xl">
            {metric.before && <span className="text-text-muted">{metric.before} → </span>}
            {metric.value}
          </span>
          <span className="block text-sm text-text-muted">{metric.label}</span>
        </span>
      )}
    </Link>
  );
}

export function ProjectGrid({ items }: { items: Work[] }) {
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {items.map((w) => (
        <li key={w.slug}>
          <ProjectCard work={w} />
        </li>
      ))}
    </ul>
  );
}
