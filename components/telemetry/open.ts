import { track } from "@/lib/analytics";

export const OPEN_EVENT = "telemetry:open";

/** Any component can open the panel; it listens for this window event. */
export function openTelemetry(location: string) {
  track("telemetry_opened", { location });
  window.dispatchEvent(new Event(OPEN_EVENT));
}
