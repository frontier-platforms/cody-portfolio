import type { Metadata } from "next";
import Link from "next/link";
import { ProjectGrid } from "@/components/work/ProjectCard";
import { getAllWork, isSideProject } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Case studies in data platforms, attribution and BI, plus side projects: Valve and Signl List.",
};

export default async function WorkIndex() {
  const work = await getAllWork();
  const professional = work.filter((w) => !isSideProject(w));
  const side = work.filter(isSideProject);

  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <p className="label">Work</p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">What I changed, and how.</h1>
      <p className="mt-6 max-w-measure text-lg text-text-muted">
        Each case study leads with the result. The detail is underneath for anyone who wants it.
      </p>

      <section aria-labelledby="professional" className="mt-12">
        <h2 id="professional" className="text-2xl sm:text-3xl">
          Professional work
        </h2>
        <div className="mt-6">
          <ProjectGrid items={professional} />
        </div>
      </section>

      <section aria-labelledby="side-projects" className="mt-12 scroll-mt-24 sm:mt-16">
        <h2 id="side-projects" className="text-2xl sm:text-3xl">
          Side projects
        </h2>
        <p className="mt-2 max-w-measure text-text-muted">
          Things I build outside the day job. Building keeps my judgment honest about what’s hard and what’s
          fast.
        </p>
        <div className="mt-6">
          <ProjectGrid items={side} />
        </div>
        <p className="mt-6 max-w-measure text-text-muted">
          This site is one too. The{" "}
          <Link href="/lab" className="link">
            Lab
          </Link>{" "}
          runs three data products on Calgary data, with dbt, Airflow and an XGBoost model.
        </p>
      </section>
    </div>
  );
}
