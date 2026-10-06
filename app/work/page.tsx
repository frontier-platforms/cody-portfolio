import type { Metadata } from "next";
import { WorkList } from "@/components/home/WorkList";
import { getAllWork } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies in data platforms, marketing attribution, CRM and AI products.",
};

export default async function WorkIndex() {
  const work = await getAllWork();
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-20">
      <p className="label">Case studies</p>
      <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        The problem, what I did about it, and what changed.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">
        Each one starts with a short summary. The detail is underneath for anyone who wants to dig in.
      </p>
      <div className="mt-12">
        <WorkList items={work} />
      </div>
    </div>
  );
}
