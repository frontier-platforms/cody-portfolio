import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/case/Callout";
import { KeyNumbers } from "@/components/case/KeyNumbers";
import { Media } from "@/components/case/Media";
import { Todo } from "@/components/case/Todo";

const components: MDXComponents = {
  Callout,
  KeyNumbers,
  Media,
  Todo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
