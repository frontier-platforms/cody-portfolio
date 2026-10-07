import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { skills } from "@/lib/business";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Cody Chandler: technology and data leader in Calgary, with a sales, marketing and finance background.",
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
    years: "2017 to 2021",
    about: "Municipal government serving 700,000+ residents",
    roles: [
      { title: "Presiding Election Official (part-time)", dates: "Sep 2018 to Oct 2022" },
      { title: "Accountant, Parks, Recreation & Culture", dates: "Oct 2020 to Sep 2021" },
      { title: "Finance Clerk, Property & Payment Services", dates: "Apr 2017 to Oct 2020" },
    ],
  },
];

type Credential = { name: string; from: string; year: string };

const education: Credential[] = [
  { name: "BBA, Marketing concentration, Dean’s Honour Roll", from: "Simon Fraser University", year: "" },
  {
    name: "Professional Certificate, Data Science & Machine Learning (Exceptional)",
    from: "MIT",
    year: "2023",
  },
];

// Newest first.
const certifications: Credential[] = [
  { name: "Certified in Cybersecurity (CC)", from: "ISC2", year: "2026" },
  { name: "Certified Cloud Practitioner", from: "AWS", year: "2025" },
  { name: "dbt Fundamentals", from: "dbt Labs", year: "2024" },
  { name: "PMP", from: "Project Management Institute", year: "2023" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <div className="grid gap-12 lg:grid-cols-[1fr_18rem]">
        <div>
          <p className="label">About</p>
          <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">
            I work where data meets the people who sell, market and decide.
          </h1>
          <div className="prose-cc mt-8">
            <p>
              I’m Cody, a technology and data leader in Calgary. I’ve spent 10+ years in pro sports, fintech,
              SaaS and city government. I’ve built and led analytics, marketing operations and product teams.
            </p>
            <p>
              The common thread is turning data into decisions a business can act on. At StellarAlgo, that
              meant same-day data for sports clients and our first AI products. At Neo Financial, it meant
              attribution and customer value models that set the marketing budget. At the Canucks, it meant a
              BI team built from zero, and the analysis behind two strong revenue seasons.
            </p>
            <p>
              I started on the business side, and I’ve never left it. I worked in municipal finance at the
              City of Surrey. I sold memberships at the Canucks, managing 800+ accounts worth over $2M. At
              Neo, I ran marketing operations: the analysts, the martech stack, its budget and the vendor
              contracts. My degree is in marketing.
            </p>
            <p>
              So I judge data work by what it changes for the people selling, marketing and running the
              business.
            </p>
            <p>
              I still build. Valve, Signl List and the Lab on this site are mine. It keeps my estimates
              honest.
            </p>
            <p>
              I’m open to senior full-time and contract roles, and to consulting. Consulting runs through{" "}
              <a href={site.frontier} className="link">
                Frontier Platforms
              </a>
              , where I build Valve and Signl List.
            </p>
            <p>
              Outside work, I volunteered with the Canucks Autism Network for five years. I also volunteered
              with the Vancouver Whitecaps for several years, helping with event-day activations, programs and
              accreditation. These days you’ll find me golfing, playing basketball, out for a walk or getting
              coffee.
            </p>
          </div>

          <h2 id="skills" className="mt-16 text-2xl sm:text-3xl">
            What I bring
          </h2>
          <dl className="mt-6 border-t border-border">
            {skills.map((s) => (
              <div key={s.area} className="grid gap-1 border-b border-border py-4 sm:grid-cols-[14rem_1fr]">
                <dt className="font-semibold">{s.area}</dt>
                <dd className="text-text-muted">{s.items.join(" · ")}</dd>
              </div>
            ))}
          </dl>

          <h2 id="experience" className="mt-16 text-2xl sm:text-3xl">
            Experience
          </h2>
          <p className="mt-2 max-w-measure text-text-muted">
            The detail is on{" "}
            <a href={site.linkedin ?? "#"} className="link">
              LinkedIn
            </a>{" "}
            and in my{" "}
            <a href={site.resume} className="link">
              resume
            </a>
            .
          </p>
          <ol className="mt-6 border-t border-border">
            {experience.map((e) => (
              <li key={e.org} className="grid gap-3 border-b border-border py-6 sm:grid-cols-[14rem_1fr]">
                <div>
                  <h3 className="text-base">{e.org}</h3>
                  <p className="meta mt-1">
                    {e.years} · {e.place}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{e.about}</p>
                </div>
                <ul className="prose-cc max-w-none">
                  {e.roles.map((r) => (
                    <li key={r.title} className="flex flex-col sm:flex-row sm:justify-between sm:gap-4">
                      <span>{r.title}</span>
                      <span className="meta shrink-0 sm:pt-1">{r.dates}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>

          <CredentialList title="Education" items={education} />
          <CredentialList title="Certifications" items={certifications} />
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <Image
            src="/media/cody.jpg"
            alt="Cody Chandler, smiling, in a grey collared shirt against a plain white background"
            width={576}
            height={576}
            priority
            sizes="(min-width: 960px) 18rem, 100vw"
            className="aspect-square w-full rounded-md border border-border object-cover"
          />
          <p className="mt-4 text-sm text-text-muted">{site.location}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/contact" className="btn btn-primary">
              Contact
            </Link>
            <a
              href={site.resume}
              className="btn"
              data-track="cta_clicked"
              data-track-cta="resume"
              data-track-location="about"
            >
              Resume (PDF)
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CredentialList({ title, items }: { title: string; items: Credential[] }) {
  return (
    <>
      <h2 className="mt-16 text-2xl sm:text-3xl">{title}</h2>
      <ul className="mt-6 border-t border-border">
        {items.map((c) => (
          <li
            key={c.name}
            className="flex flex-col border-b border-border py-3 sm:flex-row sm:justify-between"
          >
            <span>
              {c.name} <span className="text-text-muted">· {c.from}</span>
            </span>
            {c.year && <span className="meta sm:pt-1">{c.year}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}
