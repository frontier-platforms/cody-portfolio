import type { Metadata } from "next";
import { Predictor } from "./predictor";

export const metadata: Metadata = { title: "Predict" };

export default function PredictPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">Machine learning on the same layer</p>
      <h1 className="mt-1 text-3xl font-bold">Will this 311 request be closed within a week?</h1>
      <p className="mt-2 max-w-3xl">
        An XGBoost model trained on the governed 311 data, using only what&apos;s known when a request is filed. Change
        the inputs and it predicts live in your browser.
      </p>
      <Predictor />
    </div>
  );
}
