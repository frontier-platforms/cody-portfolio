// The demo is served at codychandler.ca/data-demos/calgary-transit (a Next.js multi-zone).
// Links through next/link and router get the base path automatically; raw URLs (fetch,
// <a href>, window.open, DuckDB file URLs) go through withBase.
export const BASE_PATH = "/data-demos/calgary-transit";
export const withBase = (path: string) => `${BASE_PATH}${path}`;

export const CODE_URL = "https://github.com/frontier-platforms/cody-portfolio/tree/main/demos/calgary-transit";
export const DBT_DOCS_URL = withBase("/dbt-docs.html");
