import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/paths";

const nextConfig: NextConfig = {
  // Served inside codychandler.ca as a multi-zone; the portfolio rewrites this path here.
  basePath: BASE_PATH,
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The Turbopack filesystem cache served stale Tailwind CSS after a colour change (in dev, and
    // on Vercel, which restores .next/cache). The app builds in seconds, so skip the cache.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
  // This app sits inside the portfolio repo, which has its own lockfile and postcss config.
  // Pin the root here so the build never picks up the portfolio's files.
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [{ source: "/how-it-works", destination: "/approach", permanent: true }];
  },
};

export default nextConfig;
