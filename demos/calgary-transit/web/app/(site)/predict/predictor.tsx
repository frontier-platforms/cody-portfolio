"use client";

import { useEffect, useMemo, useState } from "react";
import { explain, type GbmModel } from "@/lib/ml/gbm";
import { Performance, type Evaluation, type Scores } from "./performance";
import { withBase } from "@/lib/paths";
import { fmtDate, fmtNumber, fmtPct, titleCase } from "@/lib/format";

type Encoder = { mean: number; values: Record<string, number> };
type Model = {
  trainedAt: string;
  library: string;
  trees: number;
  rows: { train: number; test: number; final: number };
  labelledThrough: string;
  testYear: number;
  trainFrom: number;
  metrics: { model: Scores; baseline: Scores };
  evaluation: { model: Evaluation; baseline: Evaluation };
  encoders: Record<string, Encoder>;
  gbm: GbmModel;
  options: {
    service_name: string[];
    intake_channel: string[];
    community: string[];
    categoryOf: Record<string, string>;
    programOf: Record<string, string>;
  };
  context: Record<string, { recent_pace: number | null; workload_30d: number }>;
};

const LABELS: Record<string, string> = {
  service_name: "Request type",
  service_category: "Category",
  program: "Program",
  intake_channel: "Channel",
  community: "Community",
  recent_pace: "Recent pace for this type",
  workload_30d: "Recent workload",
  month: "Time of year",
  weekday: "Day of the week",
};

const NOT_RECORDED = "Not recorded";
const today = () => new Date().toISOString().slice(0, 10);
const enc = (e: Encoder, key: string) => e.values[key] ?? e.mean;

export function Predictor() {
  const [model, setModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("CT - Bus Stops");
  const [community, setCommunity] = useState(NOT_RECORDED);
  const [channel, setChannel] = useState("App");
  // Empty until the model has loaded in the browser, so "today" is never read during prerender.
  const [date, setDate] = useState("");

  useEffect(() => {
    fetch(withBase("/data/resolution_model.json"))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Model failed to load (${r.status})`))))
      .then((m: Model) => {
        setModel(m);
        if (!m.options.service_name.includes("CT - Bus Stops")) setType(m.options.service_name[0]);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const result = useMemo(() => {
    if (!model) return null;
    const filed = date || today();
    const d = new Date(`${filed}T12:00:00`);
    const ctx = model.context[type] ?? { recent_pace: null, workload_30d: 0 };
    const category = model.options.categoryOf[type] ?? "";
    const program = model.options.programOf[type] ?? "";
    const values: Record<string, number> = {
      service_name: enc(model.encoders.service_name, type),
      service_category: enc(model.encoders.service_category, category),
      program: enc(model.encoders.program, program),
      intake_channel: enc(model.encoders.intake_channel, channel),
      community: enc(model.encoders.community, community),
      recent_pace: ctx.recent_pace ?? Number.NaN,
      workload_30d: ctx.workload_30d,
      month: d.getMonth() + 1,
      weekday: d.getDay(),
    };
    const row = model.gbm.features.map((f) => values[f]);
    const { probability, contributions } = explain(model.gbm, row);
    const drivers = model.gbm.features
      .map((f, i) => ({ feature: f, value: contributions[i] }))
      .filter((d) => Math.abs(d.value) > 0.01)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5);
    return { probability, drivers, ctx, category, filed };
  }, [model, type, community, channel, date]);

  if (error) return <p className="mt-8 text-cgy-red">{error}</p>;
  if (!model || !result) return <p className="mt-8 text-cgy-grey">Loading the model…</p>;

  const likely = result.probability >= 0.5;
  const maxDriver = Math.max(...result.drivers.map((d) => Math.abs(d.value)), 0.01);
  const typesByCategory = Object.entries(
    model.options.service_name.reduce<Record<string, string[]>>((acc, s) => {
      (acc[model.options.categoryOf[s] ?? "Other"] ??= []).push(s);
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="mt-6 space-y-6 lg:mt-4 lg:flex lg:flex-1 lg:flex-col lg:space-y-4">
      <div className="grid gap-6 lg:flex-1 lg:grid-cols-[1fr_1.2fr] lg:gap-4">
        <form
          className="space-y-3 rounded-lg border border-cgy-line p-5 lg:flex lg:flex-col lg:justify-center tall:space-y-5 tall:p-7"
          onSubmit={(e) => e.preventDefault()}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-cgy-grey">A new request</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Request type">
              <select value={type} onChange={(e) => setType(e.target.value)} className={INPUT}>
                {typesByCategory.map(([cat, names]) => (
                  <optgroup key={cat} label={cat}>
                    {names.map((n) => (
                      <option key={n} value={n}>
                        {n.replace(/^CT( AC)? - /, "")}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Community">
              <select value={community} onChange={(e) => setCommunity(e.target.value)} className={INPUT}>
                <option value={NOT_RECORDED}>Not recorded</option>
                {model.options.community.map((c) => (
                  <option key={c} value={c}>
                    {titleCase(c)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Channel">
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className={INPUT}>
                {model.options.intake_channel.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Filed on">
              <input
                type="date"
                value={result.filed}
                onChange={(e) => setDate(e.target.value || today())}
                className={INPUT}
              />
            </Field>
          </div>
          <p className="text-sm text-cgy-grey tall:text-base">
            Today&apos;s context for this type:{" "}
            {result.ctx.recent_pace === null
              ? "no recent requests"
              : `${fmtPct(result.ctx.recent_pace * 100)} closed within a week over the last 90 days`}
            , and {fmtNumber(result.ctx.workload_30d)} {result.category.toLowerCase()} requests in the last 30
            days.
          </p>
        </form>

        <section
          className="order-first rounded-lg bg-cgy-paper p-5 lg:order-none lg:flex lg:flex-col lg:justify-center tall:p-7"
          aria-live="polite"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-cgy-grey">
            Chance it&apos;s closed within 7 days
          </p>
          <div className="mt-2 flex items-baseline gap-4">
            <p className="tabular text-6xl font-bold text-cgy-slate lg:text-5xl tall:text-7xl">
              {fmtPct(result.probability * 100)}
            </p>
            <p
              className={`text-lg font-semibold tall:text-2xl ${likely ? "text-cgy-green" : "text-cgy-orange"}`}
            >
              {likely ? "Likely closed within a week" : "Likely to take longer"}
            </p>
          </div>
          <div className="mt-3 h-2 rounded bg-cgy-line tall:h-3">
            <div
              className="h-full rounded bg-cgy-red transition-all"
              style={{ width: `${result.probability * 100}%` }}
            />
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-cgy-grey">
            What moved this prediction
          </p>
          <ul className="mt-2 space-y-1.5 tall:mt-4 tall:space-y-3.5">
            {result.drivers.map((d) => (
              <li
                key={d.feature}
                className="grid grid-cols-[170px_1fr] items-center gap-3 text-sm tall:grid-cols-[210px_1fr] tall:text-base"
              >
                <span className="font-semibold text-cgy-slate">{LABELS[d.feature] ?? d.feature}</span>
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2.5 rounded tall:h-3.5 ${d.value > 0 ? "bg-cgy-green" : "bg-cgy-orange"}`}
                    style={{ width: `${(Math.abs(d.value) / maxDriver) * 70}%` }}
                  />
                  <span className="text-xs text-cgy-grey tall:text-sm">
                    {d.value > 0 ? "faster" : "slower"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Performance testYear={model.testYear} metrics={model.metrics} evaluation={model.evaluation}>
        {model.library}, {model.trees} trees. After testing, retrained on {fmtNumber(model.rows.final)}{" "}
        requests from {model.trainFrom} to {fmtDate(model.labelledThrough)}. Retrained every day by Airflow;
        this page scores it in your browser, checked against XGBoost on every run.
      </Performance>
    </div>
  );
}

const INPUT =
  "mt-1 w-full rounded border border-cgy-silver bg-white px-2 py-2 text-sm tall:py-2.5 tall:text-base";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-cgy-slate tall:text-base">
      {label}
      {children}
    </label>
  );
}
