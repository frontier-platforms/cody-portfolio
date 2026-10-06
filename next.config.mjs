import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
  async redirects() {
    return [{ source: "/lab", destination: "/lab/calgary", permanent: false }];
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
