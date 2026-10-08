/**
 * The business side of my background: sales, marketing, operations and
 * finance. Shown on the home page and About so the data and product work
 * reads as one part of the picture, not all of it. Facts only, from the
 * resume. Copy follows BRAND.md section 2.
 */
export type Capability = {
  area: string;
  where: string;
  body: string;
  proof?: { href: string; label: string };
};

export const business: Capability[] = [
  {
    area: "Sales",
    where: "Canucks",
    body: "I started in sales, managing a book of 800+ member accounts. I know what a rep needs from the CRM.",
    proof: { href: "/work/canucks-bi", label: "From sales to running BI" },
  },
  {
    area: "Marketing",
    where: "Neo Financial",
    body: "I ran marketing operations: a team of analysts, the martech stack and its budget. My degree is in marketing.",
    proof: { href: "/work/neo-attribution", label: "The attribution work" },
  },
  {
    area: "Business operations",
    where: "Canucks and Neo",
    body: "I led a HubSpot to Salesforce move, including vendor negotiation. At Neo, I checked vendor contracts against usage before renewals.",
    proof: { href: "/work/canucks-bi", label: "The CRM migration" },
  },
  {
    area: "Finance",
    where: "City of Surrey",
    body: "I worked in municipal finance, running a property tax deferment program and overseeing a tax sale.",
    proof: { href: "/about#experience", label: "City of Surrey roles" },
  },
];

/** Skills by area, for the About page. Business areas come first on purpose. */
export const skills: { area: string; items: string[] }[] = [
  {
    area: "Sales and revenue",
    items: ["Membership sales", "Pricing and forecasting", "Salesforce", "HubSpot"],
  },
  {
    area: "Marketing",
    items: ["Attribution", "CAC and LTV", "Paid media measurement", "Martech budgets", "Reverse ETL"],
  },
  {
    area: "Operations and finance",
    items: ["Vendor negotiation", "Contracts and renewals", "Project management (PMP)", "Municipal finance"],
  },
  { area: "Product", items: ["Product launches", "Cross-team pods", "AI products", "Data products"] },
  {
    area: "Data and engineering",
    items: ["SQL", "dbt", "Snowflake", "Databricks", "Python", "Airflow", "XGBoost"],
  },
];
