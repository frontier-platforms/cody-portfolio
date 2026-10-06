import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getWorkSlugs } from "@/lib/work";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/work", "/projects", "/lab/calgary", "/lab/flames", "/about", "/colophon"];
  const work = (await getWorkSlugs()).map((s) => `/work/${s}`);
  return [...pages, ...work].map((path) => ({ url: `${site.url}${path}` }));
}
