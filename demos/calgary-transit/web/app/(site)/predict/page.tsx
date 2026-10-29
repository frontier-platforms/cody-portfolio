import type { Metadata } from "next";
import { InfoTip } from "@/components/info-tip";
import { Predictor } from "./predictor";

export const metadata: Metadata = { title: "Predict" };

const WHY = [
  [
    "The issue",
    "About half of transit 311 requests take longer than a week, and nobody can tell which when they're filed.",
  ],
  ["What it does", "Scores each request the moment it arrives, using only what's known then."],
  [
    "So what",
    "311 can set honest expectations with riders and send likely-slow requests to the right team first.",
  ],
];

export default function PredictPage() {
  return (
    // On laptops and up, the page fills the window below the header, and the model panels take the spare height.
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:flex lg:min-h-[calc(100dvh-60px)] lg:flex-col lg:pb-6 lg:pt-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">
        Machine learning on the same layer
      </p>
      <div className="mt-1 flex items-center gap-3">
        <h1 className="text-3xl font-bold">Will this 311 request be closed within a week?</h1>
        <InfoTip label="About the model">
          <strong>Type:</strong> supervised machine learning, binary classification. It predicts yes or no
          (closed within 7 days) and gives a probability.
          <span className="mt-2 block">
            <strong>Algorithm:</strong> XGBoost, gradient-boosted decision trees: 300 small trees, each
            correcting the errors of the ones before.
          </span>
          <span className="mt-2 block">
            <strong>Inputs:</strong> request type, category, community, channel, month and weekday, plus how
            fast this type has closed in the last 90 days and the 30-day workload.
          </span>
          <span className="mt-2 block">
            <strong>Training:</strong> 2022 to 2024 requests, tested on 2025, then retrained daily by Airflow.
          </span>
        </InfoTip>
      </div>
      <p className="mt-2 text-sm sm:hidden">
        About half of requests take longer than a week. This scores each one when it&apos;s filed, so 311 can
        set expectations and triage.
      </p>
      {/* Hidden on short laptop screens so the model and its results fit without scrolling. */}
      <div className="mt-3 hidden gap-3 sm:grid-cols-3 sm:[@media(min-height:760px)]:grid">
        {WHY.map(([label, text]) => (
          <div key={label} className="border-l-4 border-cgy-red pl-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-cgy-grey">{label}</p>
            <p className="mt-0.5 text-sm leading-snug">{text}</p>
          </div>
        ))}
      </div>
      <Predictor />
    </div>
  );
}
