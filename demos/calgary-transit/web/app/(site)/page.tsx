import Link from "next/link";

const STEPS = [
  {
    href: "/presentation",
    step: "1",
    title: "The case study",
    label: "Presentation",
    body: "The data product I led at StellarAlgo: the problem, the product, how I built it and what it delivered.",
  },
  {
    href: "/approach",
    step: "2",
    title: "The approach",
    label: "Approach",
    body: "The same five steps on City of Calgary data, and the pipeline behind them.",
  },
  {
    href: "/dashboard",
    step: "3",
    title: "The result",
    label: "Dashboard",
    body: "Calgary Transit's recovery and rider feedback, queried live from the same tables.",
  },
  {
    href: "/predict",
    step: "4",
    title: "The prediction",
    label: "Predict",
    body: "A machine learning model on the same tables: will a 311 request close within a week?",
  },
  {
    href: "/ask",
    step: "5",
    title: "Self-serve",
    label: "Ask the data",
    body: "Ask in plain English. Answers come from the same tables, with the SQL shown.",
  },
];

export default function Home() {
  return (
    // Fills the screen below the header so the four tiles are always visible on a laptop.
    <div className="flex min-h-[calc(100dvh-58px)] flex-col">
      <section className="flex flex-1 items-center bg-cgy-slate text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 [@media(min-height:820px)]:py-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Data product case study
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl [@media(min-height:820px)]:sm:text-5xl">
            One source of truth, so every number matches.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">
            At StellarAlgo I brought every client&apos;s data into one layer that reporting, AI and our CRM
            could trust. This site applies the same approach to City of Calgary open data, so you can see it
            working.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/presentation"
              className="rounded bg-cgy-red px-5 py-2.5 font-semibold text-white hover:bg-cgy-red-dark"
            >
              Start the presentation
            </Link>
            <Link
              href="/approach"
              className="rounded border border-white/40 px-5 py-2.5 font-semibold text-white hover:border-white"
            >
              See the approach
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 [@media(min-height:820px)]:py-8">
        {STEPS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex gap-3 rounded-lg border border-cgy-line border-t-4 border-t-cgy-red bg-white p-4 transition-shadow hover:shadow-md"
          >
            <span className="text-2xl font-bold leading-none text-cgy-red">{s.step}</span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-cgy-grey">
                {s.label}
              </span>
              <span className="block text-lg font-bold text-cgy-slate group-hover:text-cgy-red">
                {s.title}
              </span>
              <span className="mt-1 block text-sm">{s.body}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
