import { flamesPipeline } from "./flames";
import { permitsPipeline } from "./permits";
import type { Pipeline } from "./types";

export const pipelines: Record<Pipeline["id"], Pipeline> = {
  permits: permitsPipeline,
  flames: flamesPipeline,
};

export type { Pipeline } from "./types";
