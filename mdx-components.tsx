import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/case/Callout";
import { InsightsRouting } from "@/components/case/InsightsRouting";
import { KeyNumbers } from "@/components/case/KeyNumbers";
import { Media } from "@/components/case/Media";
import { MedallionDiagram } from "@/components/case/MedallionDiagram";
import { Todo } from "@/components/case/Todo";

const components: MDXComponents = {
  Callout,
  InsightsRouting,
  KeyNumbers,
  MedallionDiagram,
  Media,
  Todo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
