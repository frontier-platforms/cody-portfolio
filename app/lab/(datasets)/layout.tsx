import Link from "next/link";
import { LabTabs } from "@/components/lab/LabTabs";
import { TelemetryButton } from "@/components/telemetry/TelemetryButton";

/** Shared chrome for the individual labs: a way back to the index, tabs between labs, and telemetry. */
export default function LabDatasetLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="sticky top-26 z-30 sm:top-14 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
        <div className="mx-auto flex max-w-site items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link href="/lab" className="shrink-0 py-3 font-mono text-xs text-text-muted hover:text-text">
            ← <span className="hidden sm:inline">All labs</span>
            <span className="sm:hidden">Labs</span>
          </Link>
          <span aria-hidden className="h-4 w-px bg-border" />
          <LabTabs />
          <div className="ml-auto shrink-0">
            <TelemetryButton location="lab_tabs" />
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
