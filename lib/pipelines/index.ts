import flames from "./generated/flames.json";
import housing from "./generated/housing.json";
import permits from "./generated/permits.json";
import type { Pipeline } from "./types";

/**
 * Pipeline definitions generated from dbt by pipeline/publish.py. Edit the dbt
 * project (dbt/models), not these files: the weekly run regenerates them.
 */
export const pipelines = {
  permits: permits as unknown as Pipeline,
  housing: housing as unknown as Pipeline,
  flames: flames as unknown as Pipeline,
} satisfies Record<Pipeline["id"], Pipeline>;

export type { Pipeline } from "./types";
