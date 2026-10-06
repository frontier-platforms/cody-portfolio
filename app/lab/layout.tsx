import { LabTabs } from "@/components/lab/LabTabs";
import { TelemetryButton } from "@/components/telemetry/TelemetryButton";

export default function LabLayout({ children }: LayoutProps<"/lab">) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
        <p className="label">Lab</p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Real Calgary data, with the whole pipeline showing.
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-muted">
          Each tab is a small data product: a tested pipeline, a dashboard, and an AI that writes SQL.
          Everything runs in DuckDB in your browser, and you can run the pipeline yourself against the live
          source.
        </p>
      </div>
      <div className="sticky top-14 z-30 mt-10 border-y border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <LabTabs />
          <TelemetryButton location="lab_tabs" />
        </div>
      </div>
      {children}
    </>
  );
}
