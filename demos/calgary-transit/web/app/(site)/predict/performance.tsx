import type { ReactNode } from "react";
import { InfoTip } from "@/components/info-tip";
import { fmtNumber, fmtPct } from "@/lib/format";

type Confusion = { slowCaught: number; fastCaught: number; falseAlarm: number; missedSlow: number };
type Band = { band: string; predicted: number; actual: number; requests: number };
export type Evaluation = {
  confusion: Confusion;
  slowPrecision: number;
  slowRecall: number;
  calibration: Band[];
};
export type Scores = { accuracy: number; auc: number; slowPrecision: number };

const pct = (v: number) => fmtPct(v * 100);

export function Performance({
  testYear,
  metrics,
  evaluation,
  children,
}: {
  testYear: number;
  metrics: { model: Scores; baseline: Scores };
  evaluation: { model: Evaluation; baseline: Evaluation };
  /** Model details, shown in the info tip. */
  children?: ReactNode;
}) {
  const m = evaluation.model;
  const cards = [
    { label: "Accuracy", value: pct(metrics.model.accuracy), plain: "Share of predictions that were right." },
    { label: "Recall, slow requests", value: pct(m.slowRecall), plain: "Share of slow requests it flagged." },
    {
      label: "ROC AUC",
      value: fmtNumber(metrics.model.auc, 2),
      plain: "Ranking quality. 0.50 is a coin flip.",
    },
  ];

  return (
    <section aria-labelledby="performance" className="border-t border-cgy-line pt-6 lg:border-t-0 lg:pt-1">
      <div className="flex items-center gap-3">
        <h2 id="performance" className="text-xl font-bold lg:text-lg">
          How well it works on {testYear}, a year it never saw
        </h2>
        <InfoTip label="Limits and model details" up>
          <strong>Limits:</strong> a guide, not a promise. It only knows what the City records, and closure
          times drift, so it retrains every day.
          {children && <span className="mt-2 block">{children}</span>}
        </InfoTip>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(3,1fr)_1.3fr]">
        {cards.map((k) => (
          <div key={k.label} className="rounded-lg border border-cgy-line p-4 lg:p-3 tall:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cgy-grey">{k.label}</p>
            <p className="tabular mt-1 text-3xl font-bold text-cgy-slate lg:text-2xl tall:text-3xl">
              {k.value}
            </p>
            <p className="mt-1 text-sm tall:text-base">{k.plain}</p>
          </div>
        ))}
        <div className="rounded-lg bg-cgy-slate p-4 text-sm text-white lg:p-3 tall:p-4 tall:text-base">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">The model</p>
          <p className="mt-1 font-bold">Supervised · binary classification</p>
          <p className="mt-1 text-white/85">
            XGBoost gradient-boosted trees, trained on 2022 to 2024 and retrained daily.
          </p>
        </div>
      </div>
    </section>
  );
}
