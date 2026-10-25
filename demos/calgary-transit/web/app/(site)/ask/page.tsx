import type { Metadata } from "next";
import { Ask } from "./ask";

export const metadata: Metadata = { title: "Ask the data" };

export default function AskPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">AI agent over the gold layer</p>
      <h1 className="mt-1 text-3xl font-bold">Ask the data</h1>
      <p className="mt-2 text-cgy-charcoal">
        Ask in plain English. Claude writes SQL against the documented tables, it runs here in your browser, and every
        answer shows its work.
      </p>
      <Ask />
    </div>
  );
}
