import type { Metadata } from "next";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">The result</p>
      <h1 className="mt-1 text-3xl font-bold">Calgary Transit: recovery and rider experience</h1>
      <p className="mt-2 max-w-3xl">
        Built for service planners and leadership. Every number is a live SQL query against the governed gold tables,
        running in your browser: the same tables the AI agent answers from.
      </p>
      <Dashboard />
    </div>
  );
}
