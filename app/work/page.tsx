import type { Metadata } from "next";
import Link from "next/link";
import { ProjectGrid } from "@/components/work/ProjectCard";
import { getAllWork } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies in data platforms, attribution, BI and AI products.",
};

export default async function WorkIndex() {
  const work = await getAllWork();
  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <p className="label">Work</p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">What I changed, and how.</h1>
      <p className="mt-6 max-w-measure text-lg text-text-muted">
        Each case study leads with the result. The detail is underneath for anyone who wants it.
      </p>

      <div className="mt-12">
        <ProjectGrid items={work} />
      </div>

      <p className="mt-12 max-w-measure text-text-muted">
        I also build things outside the day job.{" "}
        <Link href="/projects" className="link">
          See the projects
        </Link>
        .
      </p>
    </div>
  );
}
