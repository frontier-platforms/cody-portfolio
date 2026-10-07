import { track as vercelTrack } from "@vercel/analytics";
import { telemetry } from "./telemetry";

/**
 * Tracking plan as code. Every product analytics event the site can send is
 * declared here with its properties. `track()` validates against the plan, so
 * an event that drifts from it is caught in development and never sent in
 * production. The colophon renders this object as the published plan.
 *
 * Privacy rules: no free text (questions people type are never sent), no
 * identifiers, no cookies. Vercel Web Analytics receives the events.
 */
type PropSpec = { type: "string"; values?: readonly string[] } | { type: "number" } | { type: "boolean" };

type EventSpec = { description: string; props: Record<string, PropSpec> };

const dataset = { type: "string", values: ["permits", "housing", "flames"] } as const;

export const trackingPlan = {
  lab_tab_viewed: {
    description: "A Lab dataset tab is opened.",
    props: { dataset },
  },
  lab_filter_changed: {
    description: "A dashboard control changes value.",
    props: { dataset, control: { type: "string" }, value: { type: "string" } },
  },
  lab_sql_viewed: {
    description: "Someone opens the SQL behind a chart.",
    props: { dataset, panel: { type: "string" } },
  },
  ask_submitted: {
    description: "A question is sent to Claude. The question text is not tracked.",
    props: { dataset, source: { type: "string", values: ["typed", "example"] }, length: { type: "number" } },
  },
  ask_completed: {
    description: "Claude's answer comes back and runs, or fails.",
    props: {
      dataset,
      outcome: { type: "string", values: ["answered", "declined", "error"] },
      latency_ms: { type: "number" },
    },
  },
  ask_sql_rerun: {
    description: "Someone edits the generated SQL and runs it themselves.",
    props: { dataset },
  },
  pipeline_run_started: {
    description: "A live pipeline run starts in the browser.",
    props: { dataset },
  },
  pipeline_run_completed: {
    description: "A live pipeline run finishes.",
    props: {
      dataset,
      outcome: { type: "string", values: ["success", "failed"] },
      rows_in: { type: "number" },
      tests_failed: { type: "number" },
      duration_ms: { type: "number" },
    },
  },
  model_estimated: {
    description: "The value model produces an estimate. Inputs other than property type are not tracked.",
    props: { property_group: { type: "string" }, model: { type: "string", values: ["production", "yours"] } },
  },
  model_trained: {
    description: "Someone trains their own value model in the browser.",
    props: {
      rows: { type: "number" },
      trees: { type: "number" },
      depth: { type: "number" },
      learning_rate: { type: "number" },
      median_error_pct: { type: "number" },
      duration_ms: { type: "number" },
    },
  },
  telemetry_opened: {
    description: "The Telemetry panel is opened.",
    props: { location: { type: "string" } },
  },
  command_menu_opened: {
    description: "The ⌘K menu is opened.",
    props: {},
  },
  cta_clicked: {
    description: "A contact or hiring call to action is clicked.",
    props: {
      cta: {
        type: "string",
        values: ["contact", "email", "resume", "linkedin", "booking", "github", "case_studies"],
      },
      location: { type: "string" },
    },
  },
} as const satisfies Record<string, EventSpec>;

export type EventName = keyof typeof trackingPlan;

type PropValue<S extends PropSpec> = S extends { type: "string"; values: readonly (infer V)[] }
  ? V
  : S extends { type: "string" }
    ? string
    : S extends { type: "number" }
      ? number
      : boolean;

export type EventProps<N extends EventName> = {
  [K in keyof (typeof trackingPlan)[N]["props"]]: (typeof trackingPlan)[N]["props"][K] extends PropSpec
    ? PropValue<(typeof trackingPlan)[N]["props"][K]>
    : never;
};

/** Checks props against the plan at runtime (data attributes bypass the type checker). */
export function validate(name: string, props: Record<string, unknown>) {
  const spec = (trackingPlan as Record<string, EventSpec>)[name];
  if (!spec) return [`"${name}" is not in the tracking plan`];
  const issues: string[] = [];
  for (const [key, rule] of Object.entries(spec.props)) {
    const v = props[key];
    if (v === undefined) issues.push(`missing ${key}`);
    else if (typeof v !== rule.type) issues.push(`${key} should be a ${rule.type}`);
    else if (rule.type === "string" && rule.values && !rule.values.includes(v as string))
      issues.push(`${key}="${v}" isn't an allowed value`);
  }
  for (const key of Object.keys(props)) if (!(key in spec.props)) issues.push(`unexpected ${key}`);
  return issues;
}

export function track<N extends EventName>(name: N, props: EventProps<N>) {
  trackUnchecked(name, props as Record<string, string | number | boolean>);
}

/** For events assembled at runtime (e.g. from data-track attributes). */
export function trackUnchecked(name: string, props: Record<string, string | number | boolean>) {
  const issues = validate(name, props);
  const valid = issues.length === 0;
  telemetry.event({ name, props, valid, issues });
  if (!valid) {
    if (process.env.NODE_ENV !== "production") console.warn(`[analytics] ${name}: ${issues.join("; ")}`);
    return;
  }
  vercelTrack(name, props);
}
