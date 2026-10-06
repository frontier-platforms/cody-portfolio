import { flamesPipeline } from "./flames";
import { housingPipeline } from "./housing";
import { permitsPipeline } from "./permits";
import type { Pipeline } from "./types";

export const pipelines: Record<Pipeline["id"], Pipeline> = {
  permits: permitsPipeline,
  housing: housingPipeline,
  flames: flamesPipeline,
};

export type { Pipeline } from "./types";
