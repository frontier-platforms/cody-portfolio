/**
 * Brand check: enforces the machine-checkable rules in BRAND.md.
 *
 *   npm run lint:brand
 *
 * Errors fail the run (and CI). Warnings are printed for a human to judge,
 * because sentence boundaries in JSX can't be read reliably.
 *
 * Checked:
 *   - tokens.css matches BRAND.md section 10 exactly
 *   - no hardcoded colors outside tokens.css (section 3, "never hardcode")
 *   - no one-off sizes: arbitrary text, spacing, radius, tracking, leading
 *     or shadow values in class names (sections 4 and 5)
 *   - spacing classes only use the --space steps (section 5)
 *   - no font weights other than 400 and 600, no off-scale text sizes,
 *     no breakpoints other than 640px and 960px, no shadows
 *   - no em dashes and no banned phrases in copy (section 2)
 *   - case studies use Problem, Role, Solution, Outcome in order, have a
 *     summary of 140 characters or fewer, and keep MDX sentences under
 *     20 words with no exclamation marks (section 2)
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SCAN = ["app", "components", "lib", "content", "mdx-components.tsx"];
const EXTS = new Set([".ts", ".tsx", ".css", ".mdx"]);

const BANNED = [
  "leverage",
  "synergy",
  "passionate about",
  "delve",
  "unlock",
  "empower",
  "seamless",
  "robust",
  "cutting-edge",
  "game-changer",
  "journey",
  "tapestry",
  "elevate",
  "harness",
  "in today's fast-paced world",
  "not just",
  "i'm excited to",
  "results-driven",
  "thought leader",
  "at the intersection of",
];

const SPACE_STEPS = new Set(["0", "px", "1", "2", "3", "4", "6", "8", "12", "16", "20", "24"]);
const TEXT_SIZES = new Set(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]);

type Issue = { file: string; line: number; level: "error" | "warn"; rule: string; text: string };
const issues: Issue[] = [];
const report = (file: string, line: number, level: Issue["level"], rule: string, text: string) =>
  issues.push({ file: path.relative(ROOT, file), line, level, rule, text: text.trim().slice(0, 120) });

async function walk(target: string): Promise<string[]> {
  const full = path.join(ROOT, target);
  if (EXTS.has(path.extname(full))) return [full];
  const out: string[] = [];
  for (const entry of await readdir(full, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(target, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (EXTS.has(path.extname(entry.name))) out.push(path.join(ROOT, p));
  }
  return out;
}

/** Class-name tokens found in a line: className="…", template strings and cn-style string args. */
function classTokens(line: string) {
  const out: string[] = [];
  for (const m of line.matchAll(/(?:className|class)=\{?[`"']([^`"']*)[`"']/g))
    out.push(...m[1].split(/\s+/));
  for (const m of line.matchAll(/`([^`]*\b(?:text|bg|border|p[xytrbl]?|m[xytrbl]?|gap|rounded)-[^`]*)`/g))
    out.push(...m[1].split(/\s+/));
  return out.filter(Boolean).map((c) => c.replace(/^[a-z-]+:/g, "").replace(/^!/, ""));
}

function checkClasses(file: string, lineNo: number, line: string) {
  for (const raw of classTokens(line)) {
    const cls = raw.split(":").pop()!;
    const variant = raw.includes(":") ? raw.split(":").slice(0, -1) : [];
    if (variant.some((v) => ["md", "xl", "2xl"].includes(v)))
      report(file, lineNo, "error", "breakpoint", `${raw}: use sm (640px) or lg (960px)`);
    if (
      /^(text|p[xytrbl]?|m[xytrbl]?|-m[xytrbl]?|gap(-[xy])?|space-[xy]|rounded(-[a-z]+)?|tracking|leading|shadow)-\[/.test(
        cls,
      )
    )
      report(file, lineNo, "error", "one-off value", `${raw}: use a token`);
    const spacing = cls.match(/^-?(?:p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy])-([\d.]+|px)$/);
    if (spacing && !SPACE_STEPS.has(spacing[1]))
      report(
        file,
        lineNo,
        "error",
        "spacing step",
        `${raw}: allowed steps are ${[...SPACE_STEPS].join(", ")}`,
      );
    const size = cls.match(/^text-(\w+)$/);
    if (size && /^(\d?xs|sm|base|lg|\d?xl)$/.test(size[1]) && !TEXT_SIZES.has(size[1]))
      report(file, lineNo, "error", "type scale", `${raw}: largest size is text-4xl`);
    if (/^font-(thin|extralight|light|normal|medium|bold|extrabold|black)$/.test(cls))
      report(file, lineNo, "error", "font weight", `${raw}: use font-regular or font-semibold`);
    if (/^max-w-(xs|sm|md|lg|\d?xl)$/.test(cls))
      report(
        file,
        lineNo,
        "error",
        "width",
        `${raw}: use max-w-site (--container) or max-w-measure (--measure)`,
      );
    if (/^shadow(-|$)/.test(cls) && cls !== "shadow-none")
      report(file, lineNo, "error", "shadow", `${raw}: no shadows`);
  }
}

/** Visible copy on a line: JSX text, string literals and MDX prose. Code comments are skipped. */
function copyOf(line: string, ext: string) {
  if (/^\s*(\/\/|\*|\/\*)/.test(line)) return "";
  if (/^\s*(import|export)\b/.test(line)) return "";
  // Whole line, minus class names: JSX copy often wraps across lines, so quoted strings alone miss it.
  return line.replace(/className=(\{`[^`]*`\}|"[^"]*")/g, "");
}

function checkCopy(file: string, lineNo: number, line: string, ext: string) {
  const copy = copyOf(line, ext).toLowerCase().replaceAll("’", "'");
  if (!copy) return;
  if (copy.includes("—")) report(file, lineNo, "error", "em dash", line);
  for (const phrase of BANNED) {
    if (new RegExp(`\\b${phrase.replace(/[-']/g, (c) => `\\${c}`)}`, "i").test(copy))
      report(file, lineNo, "error", "banned phrase", `"${phrase}": ${line}`);
  }
}

function sentences(text: string) {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_`#>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split(/(?<=[.?!])\s+(?=[A-Z“"(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function checkCaseStudy(file: string, source: string) {
  const headings = [...source.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  const expected = ["Problem", "Role", "Solution", "Outcome"];
  if (headings.join("|") !== expected.join("|"))
    report(
      file,
      1,
      "error",
      "case study format",
      `headings are [${headings.join(", ")}], need [${expected.join(", ")}]`,
    );

  const summary = source.match(/summary:\s*\n?\s*["'`]([^"'`]+)["'`]/)?.[1];
  if (!summary) report(file, 1, "error", "case study format", "missing summary");
  else if (summary.length > 140)
    report(file, 1, "error", "summary length", `${summary.length} characters (max 140): ${summary}`);

  const body = source.replace(/export const meta[\s\S]*?\n};\n/, "");
  body.split("\n").forEach((line, i) => {
    if (/^(#|<|import|export|\s*$)/.test(line) || /^\s+[a-z]+=/.test(line)) return;
    const prose = line.replace(/^[-*\d.]+\s+/, "");
    if (prose.includes("!")) report(file, i + 1, "error", "exclamation mark", line);
    for (const s of sentences(prose)) {
      const words = s.split(/\s+/).length;
      if (words >= 20) report(file, i + 1, "error", "sentence length", `${words} words: ${s}`);
    }
  });
}

async function checkTokens() {
  const brand = await readFile(path.join(ROOT, "BRAND.md"), "utf8");
  const block = brand.match(/## 10\. Tokens \(tokens\.css\)\n\n```css\n([\s\S]*?)```/)?.[1];
  const tokens = await readFile(path.join(ROOT, "app/tokens.css"), "utf8").catch(() => null);
  if (!block) report("BRAND.md", 1, "error", "tokens", "section 10 CSS block not found");
  else if (tokens !== block)
    report(
      "app/tokens.css",
      1,
      "error",
      "tokens",
      "differs from BRAND.md section 10. Regenerate it from the guide.",
    );
}

async function main() {
  await checkTokens();
  const files = (await Promise.all(SCAN.map(walk))).flat();

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (rel === "app/tokens.css") continue;
    const ext = path.extname(file);
    const source = await readFile(file, "utf8");
    const lines = source.split("\n");

    lines.forEach((line, i) => {
      const n = i + 1;
      const withoutAnchors = line.replace(/href="#[^"]*"|`#\$\{/g, "");
      if (
        /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/.test(withoutAnchors) &&
        !/^\s*(\/\/|\*)/.test(line)
      )
        report(file, n, "error", "hardcoded color", line);
      if (/\b(rgba?|hsla?)\(/.test(line) && !/^\s*(\/\/|\*)/.test(line))
        report(file, n, "error", "hardcoded color", line);
      if (ext !== ".css") checkClasses(file, n, line);
      checkCopy(file, n, line, ext);
    });

    if (rel.startsWith("content/work/")) checkCaseStudy(file, source);
  }

  const errors = issues.filter((i) => i.level === "error");
  for (const i of issues)
    console.log(`${i.level === "error" ? "✗" : "!"} ${i.file}:${i.line}  [${i.rule}] ${i.text}`);
  console.log(
    `\nBrand check: ${errors.length} error(s), ${issues.length - errors.length} warning(s) across ${files.length} files.`,
  );
  if (errors.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
