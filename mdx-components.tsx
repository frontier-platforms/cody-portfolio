import type { MDXComponents } from "mdx/types";
import { Callout } from "@/components/case/Callout";
import { Media } from "@/components/case/Media";
import { Todo } from "@/components/case/Todo";

const components: MDXComponents = {
  Callout,
  Media,
  Todo,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
