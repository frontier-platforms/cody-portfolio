import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "mdx"],
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
  // Data demos are separate Next.js apps (multi-zones) under demos/. Each is its own Vercel
  // project; these rewrites serve it under this domain. Unset locally, the paths 404.
  async rewrites() {
    const calgary = process.env.CALGARY_TRANSIT_URL;
    if (!calgary) return [];
    return [
      { source: "/data-demos/calgary-transit", destination: `${calgary}/data-demos/calgary-transit` },
      {
        source: "/data-demos/calgary-transit/:path+",
        destination: `${calgary}/data-demos/calgary-transit/:path+`,
      },
    ];
  },
};

export default createMDX({})(nextConfig);
