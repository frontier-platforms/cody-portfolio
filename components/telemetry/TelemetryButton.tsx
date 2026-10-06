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
      className="flex items-center gap-2 border border-line px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-ink hover:text-ink"
    >
      <span
        key={count}
        aria-hidden
        className="size-1.5 animate-[ping_0.6s_ease-out_1] rounded-full bg-accent"
      />
      Telemetry
      <span className="num hidden sm:inline">· {count} queries</span>
    </button>
  );
}
