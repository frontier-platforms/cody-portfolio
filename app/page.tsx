import Image from "next/image";
import Link from "next/link";
import { KpiStrip } from "@/components/home/KpiStrip";
import { Section } from "@/components/ui/Section";
import { ProjectGrid } from "@/components/work/ProjectCard";
import { labs } from "@/lib/lab/catalog";
import { visibleKpis } from "@/lib/kpis";
import { site } from "@/lib/site";
import { getAllWork } from "@/lib/work";

export default async function Home() {
  const work = await getAllWork();

  return (
    <>
      {/* BRAND.md section 6, hero: one h1, one sentence, one primary button, one text link. */}
      <section className="mx-auto max-w-site px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-24">
        <div className="flex items-center gap-3">
          <Image
            src="/media/cody.jpg"
            alt="Cody Chandler"
            width={48}
            height={48}
            priority
            className="size-12 rounded-full border border-border object-cover"
          />
          <p className="label">Calgary, Alberta</p>
        </div>
        <h1 className="mt-6 max-w-measure text-balance text-2xl sm:text-4xl">
          I build data platforms that change how teams make money.
        </h1>
        <p className="mt-6 max-w-measure text-pretty text-lg text-text-muted">
          I’m a technology and data leader who turns data platforms and product work into measurable business
          outcomes.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Link
            href="/contact"
            className="btn btn-primary"
            data-track="cta_clicked"
            data-track-cta="contact"
            data-track-location="home_hero"
          >
            Contact
          </Link>
          <Link
            href="/work"
            className="link inline-flex min-h-11 items-center"
            data-track="cta_clicked"
            data-track-cta="case_studies"
            data-track-location="home_hero"
          >
            View work
          </Link>
        </div>
      </section>

      <section aria-label="Results" className="mx-auto max-w-site px-4 sm:px-6">
        <KpiStrip items={visibleKpis()} />
      </section>

      <Section index="01" label="Selected work" className="mt-24">
        <ProjectGrid items={work} />
      </Section>

      <Section index="02" label="Where I help" className="mt-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-xl">For hiring teams</h3>
            <p className="mt-2 max-w-measure text-text-muted">
              I’m looking for senior data, product and strategy roles in Calgary. I’ve led product, analytics
              and marketing operations teams, and I still write the SQL.
            </p>
            <p className="mt-4">
              <a
                href={site.resume}
                className="link inline-flex min-h-11 items-center"
                data-track="cta_clicked"
                data-track-cta="resume"
                data-track-location="home"
              >
                Download my resume
              </a>
            </p>
          </div>
          <div>
            <h3 className="text-xl">For teams with a data problem</h3>
            <p className="mt-2 max-w-measure text-text-muted">I take on focused projects like these.</p>
            <ul className="mt-4 border-t border-border">
              {work.map((w) => (
                <li key={w.slug} className="border-b border-border">
                  <Link
                    href={`/work/${w.slug}`}
                    className="group flex min-h-11 items-center justify-between gap-4 py-2"
                  >
                    <span className="group-hover:underline">“{w.problem}.”</span>
                    <span className="meta shrink-0">{w.company.split(" ")[0]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section index="03" label="The Lab" className="mt-24">
        <p className="mb-8 max-w-measure text-text-muted">
          Three small data products on Calgary data. Each one has a tested pipeline you can run live in your
          browser.
        </p>
        <ul className="grid gap-4 lg:grid-cols-3">
          {labs.map((lab) => (
            <li key={lab.href}>
              <Link
                href={lab.href}
                className="flex h-full flex-col rounded-md border border-border p-6 transition-colors hover:border-accent"
              >
                <span className="meta">{lab.kicker}</span>
                <span className="mt-3 text-xl font-semibold leading-snug">{lab.title}</span>
                <span className="mt-2 text-text-muted">{lab.lede}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          <Link href="/lab" className="link inline-flex min-h-11 items-center">
            See all three labs and how they’re built
          </Link>
        </p>
      </Section>
    </>
  );
}
