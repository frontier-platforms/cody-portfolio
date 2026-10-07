import type { Metadata } from "next";
import Link from "next/link";
import { StackList } from "@/components/ui/StackList";
import { getAllWork, getWork, getWorkSlugs } from "@/lib/work";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getWorkSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { meta } = await getWork((await params).slug);
  return { title: meta.title, description: meta.summary };
}

/** BRAND.md section 2: Problem, Role, Solution, Outcome. The MDX carries the sections; this is the frame. */
export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const { meta, Content } = await getWork(slug);
  const all = await getAllWork();
  const next = all[(all.findIndex((w) => w.slug === slug) + 1) % all.length];

  return (
    <article className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <Link href="/work" className="meta inline-flex min-h-11 items-center hover:text-text">
        ← All work
      </Link>

      <header className="mt-6 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="meta">
            {meta.industry} · {meta.company}
            {meta.period && ` · ${meta.period}`}
          </p>
          <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">{meta.title}</h1>
          <p className="mt-6 max-w-measure text-pretty text-lg text-text-muted">{meta.summary}</p>
        </div>
        <aside className="self-end">
          <p className="label mb-2">Stack</p>
          <StackList items={meta.stack} />
        </aside>
      </header>

      <div className="prose-cc mt-12 border-t border-border pt-4">
        <Content />
      </div>

      <nav aria-label="Next case study" className="mt-20 max-w-measure border-t border-border pt-6">
        <p className="label">Next</p>
        <Link href={`/work/${next.slug}`} className="group mt-2 block">
          <span className="text-xl font-semibold group-hover:underline">{next.title}</span>
          <span className="mt-1 block text-sm text-text-muted">{next.company}</span>
        </Link>
      </nav>
    </article>
  );
}
