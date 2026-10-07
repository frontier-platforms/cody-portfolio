import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  async redirects() {
    // Projects folded into the Work page (BRAND.md v1.3 nav).
    return [{ source: "/projects", destination: "/work#projects", permanent: true }];
  },
  async headers() {
    return [
      {
        // Parquet files are rebuilt by scripts, not per deploy, so cache them hard
        // but let the browser revalidate.
        source: "/data/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default createMDX({})(nextConfig);
