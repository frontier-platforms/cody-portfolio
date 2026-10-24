import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/paths";

const nextConfig: NextConfig = {
  // Served inside codychandler.ca as a multi-zone; the portfolio rewrites this path here.
  basePath: BASE_PATH,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
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
