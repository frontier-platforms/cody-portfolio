# Data demos

Self-contained data products, each with its own pipeline and web app. They are listed on the unlinked
`/data-demos` page and shared by direct link.

Each web app is a separate Next.js app (a [multi-zone](https://nextjs.org/docs/app/guides/multi-zones)) with a
`basePath` under `/data-demos/`. It deploys as its own Vercel project, and the portfolio's `next.config.mjs`
rewrites the path to it. The demos keep their own styles, dependencies and checks, so the portfolio's brand
lint, TypeScript, ESLint, Prettier and Ruff settings exclude this folder.

| Demo | Path | Vercel root directory | Portfolio env var |
|---|---|---|---|
| [Calgary Transit](calgary-transit/README.md) | `/data-demos/calgary-transit` | `demos/calgary-transit/web` | `CALGARY_TRANSIT_URL` |
