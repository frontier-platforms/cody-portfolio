import type { Metadata } from "next";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    // On laptops and up, the page fills the window below the header so every chart is visible without scrolling.
    <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:h-[calc(100dvh-60px)] lg:min-h-[620px] lg:pb-5 lg:pt-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-cgy-red">The result</p>
      <Dashboard />
    </div>
  );
}
