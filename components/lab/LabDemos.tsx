"use client";

import dynamic from "next/dynamic";
import type { DatasetKey } from "@/lib/lab/datasets";
import { LazyMount } from "./LazyMount";

// Each demo is its own chunk, fetched only when LazyMount reveals it.
const PermitsDashboard = dynamic(() => import("./PermitsDashboard").then((m) => m.PermitsDashboard), {
  ssr: false,
});
const FlamesDashboard = dynamic(() => import("./FlamesDashboard").then((m) => m.FlamesDashboard), {
  ssr: false,
});
const AskData = dynamic(() => import("./AskData").then((m) => m.AskData), { ssr: false });

export function PermitsDemo() {
  return (
    <LazyMount minHeight={900} label="Calgary permits">
      <PermitsDashboard />
    </LazyMount>
  );
}

export function FlamesDemo() {
  return (
    <LazyMount minHeight={900} label="Flames data">
      <FlamesDashboard />
    </LazyMount>
  );
}

export function AskDemo({ dataset }: { dataset: DatasetKey }) {
  return (
    <LazyMount minHeight={220} label="Ask the data">
      <AskData dataset={dataset} />
    </LazyMount>
  );
}
