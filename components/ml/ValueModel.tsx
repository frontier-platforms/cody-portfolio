"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart } from "@/components/lab/charts";
import { Segmented } from "@/components/lab/controls";
import { runQuery } from "@/components/lab/db";
import { track } from "@/lib/analytics";
import { estimate, FEATURE_LABELS, type HomeInput, type HousingModel } from "@/lib/ml/housing";
import { telemetry } from "@/lib/telemetry";

const MODEL_URL = "/data/housing-model.json";

const money = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n / 1e3).toLocaleString()}K`;
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * The housing value model in the browser: an explained estimate, the model
 * card, and a panel to train your own model on a sample of the data.
 */
export function ValueModel() {
  const [production, setProduction] = useState<HousingModel | null>(null);
  const [yours, setYours] = useState<HousingModel | null>(null);
  const [active, setActive] = useState<"production" | "yours">("production");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const started = performance.now();
    fetch(MODEL_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Model file ${res.status}`);
        const text = await res.text();
        telemetry.load({
          table: "value_model (json)",
          bytes: text.length,
          fetchMs: performance.now() - started,
          loadMs: 0,
        });
        setProduction(JSON.parse(text) as HousingModel);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="font-mono text-sm text-accent">Couldn’t load the model: {error}</p>;
  if (!production) return <p className="label">Loading model…</p>;

  const model = active === "yours" && yours ? yours : production;

  return (
    <div className="space-y-6">
      <Predictor model={model} production={production} which={active} />
      {yours && (
        <Segmented
          label="Model used for estimates"
          options={[
            { value: "production", label: "Production model" },
            { value: "yours", label: "Your model" },
          ]}
          value={active}
          onChange={setActive}
        />
      )}
      <ModelCard model={production} />
      <TrainYourOwn
        production={production}
        onTrained={(m) => {
          setYours(m);
          setActive("yours");
        }}
      />
    </div>
  );
}

function Predictor({
  model,
  production,
  which,
}: {
  model: HousingModel;
  production: HousingModel;
  which: "production" | "yours";
}) {
  // Inputs, community list and typical values come from the production model,
  // which saw every home; a small trained sample might miss some communities.
  const communities = useMemo(
    () => Object.keys(production.typical).sort((a, b) => a.localeCompare(b)),
    [production],
  );
  const zonings = useMemo(
    () =>
      Object.keys(production.encoders.zoning.values)
        .filter((z) => z !== "∅")
        .sort(),
    [production],
  );

  const [input, setInput] = useState<HomeInput>(() => prefill(production, "MOUNT PLEASANT", "Detached"));
  const usesHere = Object.keys(production.typical[input.community] ?? {}).sort();
  const typical = production.typical[input.community]?.[input.use];
  const result = estimate(model, input);

  function choose(community: string, use: string) {
    const next = prefill(production, community, use);
    setInput(next);
    track("model_estimated", { property_group: next.use, model: which });
  }

  const describe: Record<keyof HomeInput, string> = {
    community: titleCase(input.community),
    use: input.use,
    zoning: input.zoning ?? "unknown",
    year_built: input.year_built ? String(input.year_built) : "unknown",
    lot_sqft: input.lot_sqft ? `${input.lot_sqft.toLocaleString()} sq ft` : "unknown",
  };
  const maxEffect = Math.max(...result.effects.map((e) => Math.abs(Math.log(e.effect))), 0.05);

  return (
    <section className="grid border border-border bg-surface lg:grid-cols-[22rem_1fr] rounded-md">
      <form
        className="space-y-4 border-b border-border p-6 lg:border-b-0 lg:border-r"
        onSubmit={(e) => e.preventDefault()}
      >
        <h3 className="font-semibold">Describe a home</h3>
        <Field label="Community">
          <select
            value={input.community}
            onChange={(e) => choose(e.target.value, input.use)}
            className="w-full border border-border bg-bg px-2 py-2 text-sm rounded-md"
          >
            {communities.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Property type">
          <select
            value={input.use}
            onChange={(e) => choose(input.community, e.target.value)}
            className="w-full border border-border bg-bg px-2 py-2 text-sm rounded-md"
          >
            {usesHere.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year built">
            <input
              type="number"
              min={1880}
              max={2027}
              value={input.year_built ?? ""}
              onChange={(e) =>
                setInput({ ...input, year_built: e.target.value ? Number(e.target.value) : null })
              }
              className="num w-full border border-border bg-bg px-2 py-2 text-sm rounded-md"
            />
          </Field>
          <Field label="Lot size (sq ft)">
            <input
              type="number"
              min={0}
              step={100}
              value={input.lot_sqft ?? ""}
              onChange={(e) =>
                setInput({ ...input, lot_sqft: e.target.value ? Number(e.target.value) : null })
              }
              className="num w-full border border-border bg-bg px-2 py-2 text-sm rounded-md"
            />
          </Field>
        </div>
        <Field label="Zoning">
          <select
            value={input.zoning ?? ""}
            onChange={(e) => setInput({ ...input, zoning: e.target.value || null })}
            className="w-full border border-border bg-bg px-2 py-2 text-sm rounded-md"
          >
            {zonings.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-text-muted">
          Changing community or type fills in what’s typical there. For condos, lot size is the whole
          building’s lot.
        </p>
      </form>

      <div className="p-6" aria-live="polite">
        <p className="label">Estimated 2026 assessment{which === "yours" ? " · your model" : ""}</p>
        <p className="num mt-2 text-4xl font-regular sm:text-4xl">{money(result.value)}</p>
        <p className="mt-1 text-sm text-text-muted">
          80% range {money(result.low)} to {money(result.high)}
          {typical && (
            <>
              {" "}
              · typical {input.use.toLowerCase()} in {titleCase(input.community)}: {money(typical.value)} (
              {typical.homes.toLocaleString()} homes)
            </>
          )}
        </p>

        <h4 className="label mt-6 text-text">Why this number</h4>
        <ol className="mt-3 space-y-2 text-sm">
          <li className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
            <span>City-wide starting point</span>
            <span className="num">{money(result.start)}</span>
          </li>
          {[...result.effects]
            .sort((a, b) => Math.abs(Math.log(b.effect)) - Math.abs(Math.log(a.effect)))
            .map((e) => {
              const log = Math.log(e.effect);
              const width = `${(Math.abs(log) / maxEffect) * 50}%`;
              return (
                <li
                  key={e.feature}
                  className="grid grid-cols-[1fr_5rem_3.25rem] items-center gap-3 sm:grid-cols-[1fr_12rem_4rem]"
                >
                  <span className="min-w-0 leading-snug">
                    {FEATURE_LABELS[e.feature]}{" "}
                    <span className="text-text-muted">· {describe[e.feature]}</span>
                  </span>
                  <span className="relative h-2 bg-border" aria-hidden>
                    <span className="absolute inset-y-0 left-1/2 w-px bg-text-muted" />
                    <span
                      className={`absolute inset-y-0 ${log >= 0 ? "left-1/2 bg-accent" : "right-1/2 bg-ink"}`}
                      style={{ width }}
                    />
                  </span>
                  <span className="num text-right">
                    {log >= 0 ? "+" : "−"}
                    {pct(Math.abs(e.effect - 1), 0)}
                  </span>
                </li>
              );
            })}
          <li className="flex items-baseline justify-between gap-3 border-t border-border pt-2 font-semibold">
            <span>Estimate</span>
            <span className="num">{money(result.value)}</span>
          </li>
        </ol>
        <p className="mt-3 text-xs text-text-muted">
          Each effect is that input’s contribution, read off the path this home takes through every tree.
          Multiply the starting point by each effect to get the estimate.
        </p>
      </div>
    </section>
  );
}

function prefill(model: HousingModel, community: string, use: string): HomeInput {
  const uses = model.typical[community] ?? {};
  const chosen = uses[use] ? use : (Object.keys(uses)[0] ?? use);
  const t = uses[chosen];
  return {
    community,
    use: chosen,
    zoning: t?.zoning ?? null,
    year_built: t?.year_built ?? null,
    lot_sqft: t?.lot_sqft ?? null,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function ModelCard({ model }: { model: HousingModel }) {
  const m = model.metrics.model;
  const b = model.metrics.baseline;
  const rows: [string, string, string][] = [
    ["Median error", pct(m.mdape), pct(b.mdape)],
    ["Within 10% of assessment", pct(m.within10), pct(b.within10)],
    ["Mean absolute error", money(m.mae), money(b.mae)],
    ["R²", m.r2.toFixed(3), b.r2.toFixed(3)],
  ];
  const improvement = 1 - m.mdape / b.mdape;

  return (
    <section className="grid gap-px border border-border bg-border lg:grid-cols-2 rounded-md">
      <div className="bg-surface p-6">
        <h3 className="font-semibold">Model card</h3>
        <p className="mt-1 text-sm text-text-muted">
          Scored on {model.rows.test.toLocaleString()} homes the model never saw. Typical error is{" "}
          {pct(improvement, 0)} lower than the obvious baseline: the median for that property type in that
          community.
        </p>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs text-text-muted">
            <tr>
              <th className="py-2 font-regular">Holdout</th>
              <th className="py-2 text-right font-regular">This model</th>
              <th className="py-2 text-right font-regular">Community median</th>
            </tr>
          </thead>
          <tbody className="num">
            {rows.map(([label, a, c]) => (
              <tr key={label} className="border-t border-border">
                <td className="py-2 font-sans">{label}</td>
                <td className="py-2 text-right">{a}</td>
                <td className="py-2 text-right text-text-muted">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 className="label mt-6 text-text">What drives it</h4>
        <ul className="mt-3 space-y-2 text-sm">
          {model.importance.map((f) => (
            <li key={f.feature} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
              <span>{FEATURE_LABELS[f.feature]}</span>
              <span className="h-1.5 bg-border" aria-hidden>
                <span className="block h-full bg-accent" style={{ width: `${f.share * 100}%` }} />
              </span>
              <span className="num text-right text-xs text-text-muted">{pct(f.share, 0)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-text-muted">Share of total split gain across all trees.</p>
      </div>

      <div className="bg-surface p-6">
        <h4 className="label text-text">Learning curve</h4>
        <p className="mt-1 text-sm text-text-muted">
          Error (RMSE of log value) after each tree. Holdout tracking training closely means it isn’t
          overfitting.
        </p>
        <div className="mt-3">
          <Curve curve={model.learningCurve} />
        </div>
        <h4 className="label mt-6 text-text">How it’s built</h4>
        <ul className="prose-cc mt-3 text-sm">
          <li>
            Gradient-boosted trees, {model.gbm.trees.length} trees, depth {model.params.depth}, learning rate{" "}
            {model.params.learning_rate}. scikit-learn’s HistGradientBoostingRegressor, trained in Python.
          </li>
          <li>
            Trained on {model.rows.train.toLocaleString()} homes in {(model.trainMs / 1000).toFixed(0)} s
            during the weekly pipeline, after every data test passes.
          </li>
          <li>
            Categories are target-encoded out of fold, so a home’s own value never leaks into its features.
          </li>
          <li>The same homes are held out every run (hashed on roll number), so versions are comparable.</li>
        </ul>
        <h4 className="label mt-6 text-text">Limits</h4>
        <ul className="prose-cc mt-3 text-sm">
          <li>It predicts the City’s assessment, not what a home would sell for.</li>
          <li>
            Public data has no floor area, bedrooms or condition, so two homes on the same street can differ
            more than it can see.
          </li>
          <li>Condo lot size is the building’s lot, which says little about a single unit.</li>
        </ul>
      </div>
    </section>
  );
}

function Curve({ curve, live }: { curve: HousingModel["learningCurve"]; live?: boolean }) {
  if (curve.length < 2) return <div className="h-[200px] border border-dashed border-border rounded-md" />;
  return (
    <>
      <LineChart
        height={200}
        fitY
        series={[
          {
            name: "train",
            color: "var(--color-data-4)",
            width: 1.5,
            points: curve.map((c) => ({ x: c.tree, y: c.train })),
          },
          {
            name: "holdout",
            color: "var(--color-data-1)",
            width: 2,
            points: curve.map((c) => ({ x: c.tree, y: c.valid })),
          },
        ]}
        xLabel="trees →"
        yLabel="RMSE (log)"
        summary={`Learning curve over ${curve.length} trees${live ? ", updating as it trains" : ""}.`}
      />
      <p className="mt-1 flex gap-4 text-xs text-text-muted">
        <span>
          <span className="mr-1 inline-block h-0.5 w-3 bg-accent align-middle" />
          holdout {curve.at(-1)!.valid.toFixed(4)}
        </span>
        <span>
          <span className="mr-1 inline-block h-0.5 w-3 bg-data-4 align-middle" />
          train {curve.at(-1)!.train.toFixed(4)}
        </span>
      </p>
    </>
  );
}

const SIZES = [10_000, 25_000, 50_000, 100_000];

type WorkerMessage =
  | { type: "status"; text: string }
  | { type: "progress"; tree: number; train: number; valid: number }
  | { type: "done"; model: HousingModel }
  | { type: "error"; message: string };

let worker: Worker | null = null;

/** Trains with ml/housing_model.py in a Web Worker running Pyodide (Python on WebAssembly). */
function trainInPython(
  columns: Record<string, unknown[]>,
  params: Partial<HousingModel["params"]>,
  onMessage: (m: Exclude<WorkerMessage, { type: "done" | "error" }>) => void,
) {
  worker ??= new Worker("/ml/train-worker.js");
  const w = worker;
  return new Promise<HousingModel>((resolve, reject) => {
    w.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const m = event.data;
      if (m.type === "done") resolve(m.model);
      else if (m.type === "error") reject(new Error(m.message));
      else onMessage(m);
    };
    w.onerror = (e) => reject(new Error(e.message || "Worker failed"));
    w.postMessage({ type: "train", columns, params });
  });
}

const COLUMNS = ["key", "community", "use", "zoning", "year_built", "lot_sqft", "assessed_value"] as const;

function TrainYourOwn({
  production,
  onTrained,
}: {
  production: HousingModel;
  onTrained: (m: HousingModel) => void;
}) {
  const [rows, setRows] = useState(25_000);
  const [trees, setTrees] = useState(150);
  const [depth, setDepth] = useState(5);
  const [learningRate, setLearningRate] = useState(0.15);
  const [curve, setCurve] = useState<HousingModel["learningCurve"]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<HousingModel | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setCurve([]);
    setResult(null);
    const started = performance.now();
    try {
      setStatus(`Sampling ${rows.toLocaleString()} homes with DuckDB…`);
      const sample = await runQuery(
        `SELECT * FROM (
           SELECT roll_number AS key, community, use, zoning, year_built, lot_sqft, assessed_value
           FROM housing_homes
           WHERE assessed_value BETWEEN 50000 AND 20000000
         ) USING SAMPLE reservoir(${rows} ROWS) REPEATABLE (42)`,
        "ml: training sample",
      );
      const columns = Object.fromEntries(
        COLUMNS.map((c) => [c, sample.rows.map((r) => (typeof r[c] === "bigint" ? Number(r[c]) : r[c]))]),
      );
      const points: HousingModel["learningCurve"] = [];
      let trainingStarted = 0;
      const trained = await trainInPython(
        columns,
        { trees, depth, learning_rate: learningRate, min_leaf: 20, seed: 42 },
        (m) => {
          if (m.type === "status") {
            setStatus(m.text);
            return;
          }
          trainingStarted ||= performance.now();
          points.push({ tree: m.tree, train: m.train, valid: m.valid });
          setCurve([...points]);
          setStatus(
            `Training tree ${m.tree} of ${trees} in Python · ${((performance.now() - trainingStarted) / 1000).toFixed(1)} s`,
          );
        },
      );
      // Prefill data is a production concern; reuse it so the predictor keeps working.
      const model: HousingModel = { ...trained, typical: production.typical, uses: production.uses };
      const ms = performance.now() - started;
      setResult(model);
      setStatus(
        `Trained ${trees} trees on ${model.rows.train.toLocaleString()} homes in ${(model.trainMs / 1000).toFixed(1)} s with scikit-learn, in your browser.`,
      );
      onTrained(model);
      track("model_trained", {
        rows,
        trees,
        depth,
        learning_rate: learningRate,
        median_error_pct: Math.round(model.metrics.model.mdape * 1000) / 10,
        duration_ms: Math.round(ms),
      });
    } catch (e) {
      setStatus(`Training failed: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  const compare = result
    ? [
        ["Median error", pct(result.metrics.model.mdape), pct(production.metrics.model.mdape)],
        ["Within 10%", pct(result.metrics.model.within10), pct(production.metrics.model.within10)],
        ["R²", result.metrics.model.r2.toFixed(3), production.metrics.model.r2.toFixed(3)],
        ["Training homes", result.rows.train.toLocaleString(), production.rows.train.toLocaleString()],
      ]
    : [];

  return (
    <section className="border border-border bg-surface rounded-md">
      <header className="border-b border-border px-6 py-4">
        <h3 className="font-semibold">Train your own, in Python, in your browser</h3>
        <p className="mt-1 text-sm text-text-muted">
          This runs ml/housing_model.py, the file the weekly pipeline uses, with scikit-learn on Pyodide. The
          first run downloads Python and scikit-learn, up to 37 MB. Watch the holdout error fall as trees are
          added.
        </p>
      </header>
      <div className="grid gap-6 p-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs text-text-muted">Training sample</p>
            <Segmented
              label="Training sample"
              options={SIZES.map((s) => ({ value: String(s), label: `${s / 1000}K` }))}
              value={String(rows)}
              onChange={(v) => setRows(Number(v))}
            />
          </div>
          <Slider label="Trees" value={trees} min={25} max={400} step={25} onChange={setTrees} />
          <Slider label="Tree depth" value={depth} min={2} max={8} step={1} onChange={setDepth} />
          <Slider
            label="Learning rate"
            value={learningRate}
            min={0.05}
            max={0.5}
            step={0.05}
            onChange={setLearningRate}
            format={(v) => v.toFixed(2)}
          />
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="btn btn-primary w-full justify-center disabled:opacity-60"
          >
            {running ? "Training…" : "Train in Python"}
          </button>
          {status && (
            <p className="num text-xs text-text-muted" aria-live="polite">
              {status}
            </p>
          )}
        </div>
        <div>
          <Curve curve={curve} live />
          {result && (
            <table className="mt-4 w-full text-left text-sm">
              <thead className="text-xs text-text-muted">
                <tr>
                  <th className="py-2 font-regular">Holdout</th>
                  <th className="py-2 text-right font-regular">Your model</th>
                  <th className="py-2 text-right font-regular">Production</th>
                </tr>
              </thead>
              <tbody className="num">
                {compare.map(([label, a, c]) => (
                  <tr key={label} className="border-t border-border">
                    <td className="py-2 font-sans">{label}</td>
                    <td className="py-2 text-right">{a}</td>
                    <td className="py-2 text-right text-text-muted">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {result && (
            <p className="mt-2 text-xs text-text-muted">
              Your model is now powering the estimate above. Switch back with the toggle under it.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex justify-between text-xs text-text-muted">
        {label}
        <span className="num text-text">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
    </label>
  );
}
