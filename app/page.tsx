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
  const work = all.filter((w) => !isSideProject(w) && !isCompact(w));

  return (
    <>
      {/* BRAND.md section 6, hero: one h1, one sentence, one primary button, one text link. */}
      <section className="mx-auto max-w-site px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
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
            <p className="text-sm text-text-muted">Open to full-time, contract and consulting work</p>
          </div>
        </div>
        <h1 className="mt-6 max-w-measure text-balance text-2xl sm:text-4xl">
          I help teams grow revenue with better data and products.
        </h1>
        <p className="mt-6 max-w-measure text-pretty text-lg text-text-muted">
          I lead data and product teams, with a background in sales, marketing and finance.
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

      <Section index="01" label="Selected work" className="mt-12 sm:mt-16">
        <ProjectGrid items={work} />
        <p className="mt-6">
          <Link href="/work#side-projects" className="link inline-flex min-h-11 items-center">
            See my side projects: Valve and Signl List
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
          Four things I do on every data team. Each links to where I’ve done it, and to a lab where you can
          see it run.
        </p>
        <Playbook />
      </Section>

      <Section index="04" label="Work with me" className="mt-12 sm:mt-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-xl">Full-time and contract roles</h3>
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
            <h3 className="text-xl">Consulting</h3>
            <p className="mt-2 max-w-measure text-text-muted">
              I take on focused data, analytics and product projects through Frontier Platforms. It’s the
              company where I build Valve and Signl List. Problems like these:
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
            <p className="mt-4 flex flex-wrap gap-x-6">
              <Link
                href="/contact?reason=project"
                className="link inline-flex min-h-11 items-center"
                data-track="cta_clicked"
                data-track-cta="consulting"
                data-track-location="home"
              >
                Start a project
              </Link>
              <a
                href={site.frontier}
                className="link inline-flex min-h-11 items-center"
                data-track="cta_clicked"
                data-track-cta="frontier"
                data-track-location="home"
              >
                Frontier Platforms ↗
              </a>
            </p>
          </div>
        </div>
      </Section>

      <Section index="05" label="The Lab" className="mt-12 sm:mt-16">
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
