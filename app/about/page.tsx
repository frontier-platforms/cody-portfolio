import type { Metadata } from "next";
import Image from "next/image";
import { Todo } from "@/components/case/Todo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "Cody Chandler: data, product and growth leader in Calgary. Background, resume and contact.",
};

type Role = { title: string; dates: string };
type Employer = { org: string; place: string; years: string; about: string; roles: Role[] };

const experience: Employer[] = [
  {
    org: "StellarAlgo",
    place: "Calgary",
    years: "2025 to present",
    about: "Fan data platform for pro sports and entertainment",
    roles: [
      { title: "Director, Product", dates: "Jan 2026 to present" },
      { title: "Director, Product Innovation & Analytics", dates: "Jan 2025 to Jan 2026" },
    ],
  },
  {
    org: "Neo Financial",
    place: "Calgary",
    years: "2023 to 2025",
    about: "Digital banking, credit and rewards",
    roles: [{ title: "Director, Marketing Operations & Analytics", dates: "Dec 2023 to Jan 2025" }],
  },
  {
    org: "Canucks Sports & Entertainment",
    place: "Vancouver",
    years: "2019 to 2023",
    about: "Canucks (NHL), Abbotsford Canucks (AHL), Warriors (NLL), Rogers Arena",
    roles: [
      { title: "Manager, Business Intelligence", dates: "Jul 2022 to Dec 2023" },
      { title: "Business Analyst, Business Intelligence", dates: "Jul 2021 to Jul 2022" },
      { title: "Account Executive, Membership Experience", dates: "Aug 2019 to Apr 2020" },
    ],
  },
  {
    org: "City of Surrey",
    place: "Surrey, BC",
    years: "2017 to 2022",
    about: "Municipal government serving 700,000+ residents",
    roles: [
      { title: "Presiding Election Official (part-time)", dates: "Sep 2018 to Oct 2022" },
      { title: "Accountant, Parks, Recreation & Culture", dates: "Oct 2020 to Sep 2021" },
      { title: "Finance Clerk, Property & Payment Services", dates: "Apr 2017 to Oct 2020" },
    ],
  },
];

const credentials = [
  { name: "PMP", from: "Project Management Institute", year: "2023" },
  { name: "Data Science & Machine Learning (Exceptional)", from: "MIT", year: "2023" },
  { name: "dbt Fundamentals", from: "dbt Labs", year: "2024" },
  { name: "Certified Cloud Practitioner", from: "AWS", year: "2025" },
  { name: "Certified in Cybersecurity (CC)", from: "ISC2", year: "2026" },
  { name: "BBA, Marketing concentration, Dean’s Honour Roll", from: "Simon Fraser University", year: "" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
        <div>
          <p className="label">About</p>
          <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            I work where data meets the people who sell, market and decide.
          </h1>
          <div className="prose-cc mt-8 max-w-2xl">
            <p>
              I’m Cody, a data and product leader in Calgary with more than 10 years across pro sports,
              fintech, SaaS and city government. I’ve built and led analytics, marketing operations and
              product teams.
            </p>
            <p>
              The common thread is turning data into decisions a business can act on. At StellarAlgo that
              meant fresh, trusted data for sports clients and the first AI products on top of it. At Neo
              Financial it meant attribution and customer value models that marketing could plan a budget
              around. At the Canucks it meant building a BI team from zero and the analysis behind two strong
              revenue seasons.
            </p>
            <p>
              I started on the business side: city finance, then selling memberships. That’s why I measure
              data work by what it changes for the people using it.
            </p>
            <p>
              I still build. Valve, Signl List and the Lab on this site are mine, written in the same stack
              I’d ask a team to use. It keeps my estimates honest.
            </p>
            <p>Outside work, I volunteered with the Canucks Autism Network for five years.</p>
            <Todo>A line about life in Calgary or what you do outside work, if you want one.</Todo>
          </div>

          <h2 id="experience" className="label mt-14 text-ink">
            Experience
          </h2>
          <ol className="mt-4 border-t border-line">
            {experience.map((e) => (
              <li key={e.org} className="grid gap-3 border-b border-line py-5 sm:grid-cols-[14rem_1fr]">
                <div>
                  <p className="font-semibold">{e.org}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    {e.years} · {e.place}
                  </p>
                  <p className="mt-1 text-xs text-muted">{e.about}</p>
                </div>
                <ul className="space-y-1.5">
                  {e.roles.map((r) => (
                    <li key={r.title} className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
                      <span>{r.title}</span>
                      <span className="shrink-0 font-mono text-xs text-muted sm:pt-1">{r.dates}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <h2 className="label mt-14 text-ink">Education and certifications</h2>
          <ul className="mt-4 border-t border-line">
            {credentials.map((c) => (
              <li
                key={c.name}
                className="flex flex-col border-b border-line py-3 sm:flex-row sm:justify-between"
              >
                <span>
                  {c.name} <span className="text-muted">· {c.from}</span>
                </span>
                {c.year && <span className="font-mono text-xs text-muted sm:pt-1">{c.year}</span>}
              </li>
            ))}
          </ul>
        </div>

        <aside id="contact" className="h-fit border border-line bg-surface lg:sticky lg:top-24">
          <Image
            src="/media/cody.jpg"
            alt="Cody Chandler"
            width={640}
            height={640}
            priority
            sizes="(min-width: 1024px) 20rem, 100vw"
            className="aspect-square w-full border-b border-line object-cover"
          />
          <div className="p-6">
            <p className="label text-accent-ink">Contact</p>
            <p className="mt-3 text-lg font-semibold tracking-tight">
              Hiring, or have a problem worth solving?
            </p>
            <p className="mt-2 text-sm text-muted">
              Email is fastest. I read everything and reply to anything specific.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <a
                href={`mailto:${site.email}`}
                className="btn btn-primary justify-center"
                data-track="cta_clicked"
                data-track-cta="email"
                data-track-location="about"
              >
                {site.email}
              </a>
              {site.booking ? (
                <a
                  href={site.booking}
                  className="btn justify-center"
                  data-track="cta_clicked"
                  data-track-cta="booking"
                  data-track-location="about"
                >
                  Book a 30-minute call
                </a>
              ) : (
                <Todo>Booking link for a 30-minute intro call.</Todo>
              )}
              <a
                href={site.resume}
                className="btn justify-center"
                data-track="cta_clicked"
                data-track-cta="resume"
                data-track-location="about"
              >
                Download resume (PDF)
              </a>
              {site.linkedin && (
                <a
                  href={site.linkedin}
                  className="btn justify-center"
                  rel="me"
                  data-track="cta_clicked"
                  data-track-cta="linkedin"
                  data-track-location="about"
                >
                  LinkedIn
                </a>
              )}
            </div>
            <p className="mt-5 text-xs text-muted">{site.location}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
