"use client";

import { useSyncExternalStore } from "react";
import { telemetry } from "@/lib/telemetry";
import { openTelemetry } from "./open";

/** Opens the Telemetry panel. The dot pulses briefly whenever a query runs. */
export function TelemetryButton({ location }: { location: string }) {
  const count = useSyncExternalStore(
    telemetry.subscribe,
    () => telemetry.getSnapshot().queries.length,
    () => 0,
  );

  return (
    <button
      type="button"
      onClick={() => openTelemetry(location)}
      aria-label="Open telemetry"
      className="flex items-center gap-2 border border-border px-3 py-2 sm:py-1 font-mono text-xs text-text-muted transition-colors hover:border-text hover:text-text rounded-md"
    >
      <span key={count} aria-hidden className="size-2 rounded-full bg-accent" />
      <span className="sr-only sm:not-sr-only">Telemetry</span>
      <span className="num hidden sm:inline">· {count} queries</span>
    </button>
  );
}
