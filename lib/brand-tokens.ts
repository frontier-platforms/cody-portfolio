import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Token values read from app/tokens.css at build time, for the few places CSS
 * variables can't reach: generated images (Open Graph, favicon) and the
 * browser theme-color meta tag. Server-only.
 */
const css = readFileSync(path.join(process.cwd(), "app/tokens.css"), "utf8");

function block(selector: RegExp) {
  const body = css.match(selector)?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

export const lightTokens = block(/:root\s*\{([\s\S]*?)\n\}/);
export const darkTokens = block(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/);

export function token(name: string, theme: "light" | "dark" = "light") {
  const value = (theme === "dark" ? darkTokens[name] : undefined) ?? lightTokens[name];
  if (!value) throw new Error(`Unknown token ${name}`);
  return value;
}
