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
  const b = evaluation.baseline;
  const c = m.confusion;
  const cards = [
    {
      label: "Accuracy",
      value: pct(metrics.model.accuracy),
      plain: "Right about 7 times in 10.",
      base: pct(metrics.baseline.accuracy),
    },
    {
      label: "Slow requests caught",
      value: pct(m.slowRecall),
      plain: "Of those that took over a week.",
      base: pct(b.slowRecall),
    },
    {
      label: "AUC",
      value: fmtNumber(metrics.model.auc, 2),
      plain: "Ranking quality. A coin flip is 0.50.",
      base: fmtNumber(metrics.baseline.auc, 2),
    },
  ];

  return (
    <section aria-labelledby="performance" className="border-t border-cgy-line pt-6 lg:border-t-0 lg:pt-1">
      <div className="flex items-center gap-3">
        <h2 id="performance" className="text-xl font-bold lg:text-lg">
          How well it works on {testYear}, a year it never saw
        </h2>
        <InfoTip label="Limits and model details" up>
          <strong>Limits:</strong> a guide, not a promise. It only knows what the City records, more than a
          quarter of requests have no community, and closure times drift, so it retrains every day.
          {children && <span className="mt-2 block">{children}</span>}
        </InfoTip>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-[repeat(3,1fr)_1.3fr]">
        {cards.map((k) => (
          <div key={k.label} className="rounded-lg border border-cgy-line p-4 lg:p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cgy-grey">{k.label}</p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="tabular text-3xl font-bold text-cgy-slate lg:text-2xl">{k.value}</span>
              <span className="text-xs text-cgy-grey">rule of thumb {k.base}</span>
            </p>
            <p className="mt-1 text-sm">{k.plain}</p>
          </div>
        ))}
        <div className="rounded-lg bg-cgy-paper p-4 text-sm lg:p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-cgy-grey">Per 1,000 requests</p>
          <p className="mt-1">
            <strong className="tabular text-cgy-slate">{c.slowCaught + c.fastCaught}</strong> predicted
            correctly
          </p>
          <p>
            <strong className="tabular text-cgy-slate">{c.missedSlow}</strong> slow missed (rule of thumb:{" "}
            {b.confusion.missedSlow})
          </p>
          <p>
            <strong className="tabular text-cgy-slate">{c.falseAlarm}</strong> false alarms
          </p>
        </div>
      </div>
    </section>
  );
}
