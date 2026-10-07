import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getWorkSlugs } from "@/lib/work";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    "",
    "/work",
    "/lab",
    "/lab/calgary",
    "/lab/housing",
    "/lab/flames",
    "/about",
    "/contact",
    "/colophon",
  ];
  const work = (await getWorkSlugs()).map((s) => `/work/${s}`);
  return [...pages, ...work].map((path) => ({ url: `${site.url}${path}` }));
}
