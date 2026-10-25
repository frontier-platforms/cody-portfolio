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
}: {
  testYear: number;
  metrics: { model: Scores; baseline: Scores };
  evaluation: { model: Evaluation; baseline: Evaluation };
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
      plain: "Of requests that took longer than a week.",
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
    <section aria-labelledby="performance" className="border-t border-cgy-line pt-6">
      <h2 id="performance" className="text-xl font-bold">
        How well it works on {testYear}, a year it never saw
      </h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-[repeat(3,1fr)_1.3fr]">
        {cards.map((k) => (
          <div key={k.label} className="rounded-lg border border-cgy-line p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-cgy-grey">{k.label}</p>
            <p className="tabular mt-1 text-3xl font-bold text-cgy-slate">{k.value}</p>
            <p className="mt-1 text-sm">{k.plain}</p>
            <p className="mt-1 text-xs text-cgy-grey">Rule of thumb: {k.base}</p>
          </div>
        ))}
        <div className="rounded-lg bg-cgy-paper p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-cgy-grey">Per 1,000 requests</p>
          <p className="mt-2">
            <strong className="tabular text-cgy-slate">{c.slowCaught + c.fastCaught}</strong> predicted
            correctly
          </p>
          <p>
            <strong className="tabular text-cgy-slate">{c.missedSlow}</strong> slow requests missed (rule of
            thumb: {b.confusion.missedSlow})
          </p>
          <p>
            <strong className="tabular text-cgy-slate">{c.falseAlarm}</strong> false alarms
          </p>
        </div>
      </div>
    </section>
  );
}
