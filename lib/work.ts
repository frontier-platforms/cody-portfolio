import { readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

/**
 * Case studies live in content/work/*.mdx. Each file exports `meta`, which is
 * validated here so a typo fails the build instead of shipping a broken page.
 */
const NumberSchema = z.object({
  value: z.string(),
  label: z.string(),
  /** Optional starting point, rendered as "before → value". */
  before: z.string().optional(),
  /** Marks a number still waiting on real data. Hidden in production. */
  todo: z.boolean().optional(),
});

export const WorkMetaSchema = z.object({
  title: z.string(),
  company: z.string(),
  /** Shown with the company on project cards (BRAND.md section 6). */
  industry: z.string(),
  role: z.string(),
  /** e.g. "2023 to 2025". Optional until confirmed. */
  period: z.string().optional(),
  /** One line for cards and meta descriptions. BRAND.md section 2: 140 characters or fewer. */
  summary: z.string().max(140),
  /** Short label used on the home page "problems" list and cards. */
  problem: z.string(),
  status: z.enum(["shipped", "in progress", "side venture"]),
  stack: z.array(z.string()),
  numbers: z.array(NumberSchema),
  order: z.number(),
});

export type WorkMeta = z.infer<typeof WorkMetaSchema>;
export type KeyNumber = z.infer<typeof NumberSchema>;
export type Work = WorkMeta & { slug: string };

const WORK_DIR = path.join(process.cwd(), "content/work");

export async function getWorkSlugs() {
  const files = await readdir(WORK_DIR);
  return files.filter((f) => f.endsWith(".mdx")).map((f) => f.replace(/\.mdx$/, ""));
}

export async function getWork(slug: string) {
  const mod = await import(`@/content/work/${slug}.mdx`);
  const meta = WorkMetaSchema.parse(mod.meta);
  return { meta: { ...meta, slug } as Work, Content: mod.default as React.ComponentType };
}

/** Side ventures (Valve, Signl List) are shown apart from professional work. */
export function isSideProject(work: Work) {
  return work.status === "side venture";
}

export async function getAllWork(): Promise<Work[]> {
  const slugs = await getWorkSlugs();
  const all = await Promise.all(slugs.map(async (s) => (await getWork(s)).meta));
  return all.sort((a, b) => a.order - b.order);
}

/** In production, numbers flagged as TODO are dropped rather than shown. */
export function visibleNumbers(numbers: KeyNumber[]) {
  return process.env.NODE_ENV === "production" ? numbers.filter((n) => !n.todo) : numbers;
}
