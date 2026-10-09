import Image from "next/image";
import Link from "next/link";
import { AcrossTheBusiness } from "@/components/home/AcrossTheBusiness";
import { KpiStrip } from "@/components/home/KpiStrip";
import { Playbook } from "@/components/home/Playbook";
import { Section } from "@/components/ui/Section";
import { ProjectGrid } from "@/components/work/ProjectCard";
import { labs } from "@/lib/lab/catalog";
import { visibleKpis } from "@/lib/kpis";
import { site } from "@/lib/site";
import { getAllWork, isCompact, isSideProject } from "@/lib/work";

export default async function Home() {
  const all = await getAllWork();
  // Work: professional work, including City of Surrey (a 2 by 2 grid).
  const selected = all.filter((w) => !isSideProject(w));
  // Problems I've solved: recent work, so earlier roles are left out.
  const work = selected.filter((w) => !isCompact(w));

  return (
    <>
      {/* Hero and metrics share the first screen: centred in the window on tall monitors, compact on laptops. */}
      <div className="flex flex-col justify-center py-8" style={{ minHeight: "calc(100svh - 3.5rem)" }}>
        {/* BRAND.md section 6, hero: one h1, one sentence, one primary button, one secondary button. */}
        <section className="mx-auto w-full max-w-site px-4 pb-8 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/media/cody.jpg"
              alt="Cody Chandler"
              width={48}
              height={48}
              priority
              className="size-12 rounded-full border border-border object-cover"
            />
            <div>
              <p className="label">Calgary, Alberta</p>
              <p className="text-sm text-text-muted">Open to employment and contract opportunities</p>
            </div>
          </div>
          <h1 className="mt-4 max-w-measure text-balance text-2xl sm:mt-6 sm:text-4xl">
            I help teams grow revenue with better data and products.
          </h1>
          <p className="mt-4 max-w-measure text-pretty text-lg text-text-muted">
            I lead data and product teams, with a background in sales, marketing and finance.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="btn btn-primary btn-lg"
              data-track="cta_clicked"
              data-track-cta="contact"
              data-track-location="home_hero"
            >
              Contact
            </Link>
            <Link
              href="/lab"
              className="btn btn-lg group bg-surface"
              data-track="cta_clicked"
              data-track-cta="lab"
              data-track-location="home_hero"
            >
              See my work in action
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </section>

        <section aria-label="Results" className="mx-auto w-full max-w-site px-4 sm:px-6">
          <KpiStrip items={visibleKpis()} />
        </section>
      </div>

      <Section index="01" label="Work" className="mt-4 sm:mt-6">
        {/* The metric cards above already carry these numbers. */}
        <ProjectGrid items={selected} showMetric={false} />
        <p className="mt-6">
          <Link href="/work#side-projects" className="link inline-flex min-h-11 items-center">
            See my side projects: Signl List and Valve
          </Link>
        </p>
      </Section>

      <Section index="02" label="Across the business" className="mt-12 sm:mt-16">
        <p className="mb-6 max-w-measure text-text-muted">
          I’ve sold memberships, run marketing operations and worked in municipal finance. That’s why my data
          work starts with the people who use it.
        </p>
        <AcrossTheBusiness />
      </Section>

      <Section index="03" label="How I help teams" className="mt-12 sm:mt-16">
        <p className="mb-6 max-w-measure text-text-muted">
          Four things I do on every data team. Each one links to the work that shows it.
        </p>
        <Playbook />
      </Section>

      <Section index="04" label="The Lab" className="mt-12 sm:mt-16">
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
      <Section index="05" label="Work with me" className="mt-12 sm:mt-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-xl">Employment and contract roles</h3>
            <p className="mt-2 max-w-measure text-text-muted">
              I’m looking for senior roles in Calgary across data, product, marketing and business operations.
              I’ve led product, analytics and marketing operations teams, and I still write the SQL.
            </p>
            <p className="mt-4 flex flex-wrap gap-x-6">
              <Link
                href="/contact?reason=hiring"
                className="link inline-flex min-h-11 items-center"
                data-track="cta_clicked"
                data-track-cta="role"
                data-track-location="home"
              >
                Talk about a role
              </Link>
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
            <h3 className="text-xl">Problems I’ve solved</h3>
            <p className="mt-2 max-w-measure text-text-muted">
              The kind of problem I’m good at. Each links to the work.
            </p>
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
    </>
  );
}
