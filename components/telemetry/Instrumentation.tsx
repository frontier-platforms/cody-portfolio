"use client";

import { useEffect } from "react";
import { trackUnchecked } from "@/lib/analytics";
import { telemetry } from "@/lib/telemetry";

/**
 * Site-wide instrumentation, mounted once in the root layout:
 *  - Core Web Vitals via the web-vitals library, into the telemetry store.
 *  - Declarative click tracking: any element with data-track="event_name"
 *    and data-track-<prop>="value" attributes sends that event, validated
 *    against the tracking plan. Server components stay server components.
 */
export function Instrumentation() {
  useEffect(() => {
    import("web-vitals").then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      const report = (m: { name: string; value: number; rating: "good" | "needs-improvement" | "poor" }) =>
        telemetry.vital({ name: m.name, value: m.value, rating: m.rating });
      onLCP(report);
      onINP(report);
      onCLS(report);
      onFCP(report);
      onTTFB(report);
    });

    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const props: Record<string, string> = {};
      for (const [key, value] of Object.entries(el.dataset)) {
        if (key.startsWith("track") && key !== "track" && value != null) {
          props[key.slice(5).replace(/^./, (c) => c.toLowerCase())] = value;
        }
      }
      trackUnchecked(el.dataset.track!, props);
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
