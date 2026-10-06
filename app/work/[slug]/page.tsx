import type { Metadata } from "next";
import Link from "next/link";
import { KeyNumbers } from "@/components/case/KeyNumbers";
import { StackList } from "@/components/ui/StackList";
import { getAllWork, getWork, getWorkSlugs, visibleNumbers } from "@/lib/work";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getWorkSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { meta } = await getWork((await params).slug);
  return { title: meta.title, description: meta.summary };
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const { meta, Content } = await getWork(slug);
  const all = await getAllWork();
  const next = all[(all.findIndex((w) => w.slug === slug) + 1) % all.length];
  const numbers = visibleNumbers(meta.numbers);

  return (
    <article className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-16">
      <Link href="/work" className="label hover:text-ink">
        ← All work
      </Link>

      <header className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="label">
            {meta.company} · {meta.role}
            {meta.period && ` · ${meta.period}`}
          </p>
          <h1 className="mt-3 max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            {meta.title}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-muted">{meta.summary}</p>
        </div>
        <aside className="self-end">
          <p className="label mb-2">Stack</p>
          <StackList items={meta.stack} />
        </aside>
      </header>

      {numbers.length > 0 && (
        <section aria-label="Key numbers" className="mt-12">
          <KeyNumbers numbers={numbers} />
        </section>
      )}

      <div className="prose-cc mx-auto mt-14 max-w-2xl">
        <Content />
      </div>

      <nav aria-label="Next case study" className="mx-auto mt-20 max-w-2xl border-t border-line pt-6">
        <p className="label">Next</p>
        <Link href={`/work/${next.slug}`} className="group mt-2 block">
          <span className="text-xl font-semibold group-hover:text-accent-ink">{next.title}</span>
          <span className="mt-1 block text-sm text-muted">{next.company}</span>
        </Link>
      </nav>
    </article>
  );
}
