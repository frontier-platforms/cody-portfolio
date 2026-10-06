import data from "@/public/data/manifest.json";
import type { Manifest } from "./types";

/** Metadata from the last production run, written by scripts/run-pipeline.ts. */
export const manifest = data as Manifest;
