import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/case/Callout";
import { CanucksRevenue } from "@/components/case/CanucksRevenue";
import { InsightsRouting } from "@/components/case/InsightsRouting";
import { KeyNumbers } from "@/components/case/KeyNumbers";
import { Media } from "@/components/case/Media";
import { MedallionDiagram } from "@/components/case/MedallionDiagram";
import { NeoAttribution } from "@/components/case/NeoAttribution";
import { Todo } from "@/components/case/Todo";

const components: MDXComponents = {
  Callout,
  CanucksRevenue,
  InsightsRouting,
  KeyNumbers,
  MedallionDiagram,
  Media,
  NeoAttribution,
  Todo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
