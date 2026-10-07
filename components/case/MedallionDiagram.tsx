/**
 * PRIME's architecture: data sources, the medallion layers in Snowflake, and
 * who consumes the result. Generic names only, nothing internal. BRAND.md
 * section 6, architecture diagram: bordered cards with data-color markers,
 * left to right on desktop, stacked on phones.
 */
const sources = [
  "Ticketing and accounts",
  "App config and logs",
  "Automations data",
  "Segment data",
  "Client and league reference files",
];

type Layer = { name: string; marker: string; note: string; groups: { title: string; items: string[] }[] };

const layers: Layer[] = [
  {
    name: "Bronze",
    marker: "bg-data-2",
    note: "Raw, as it arrived. Personal data masked here.",
    groups: [
      { title: "Ticketing", items: ["Tickets", "Events", "Customer accounts"] },
      { title: "Fan data platform", items: ["Cohorts", "Users", "Segments", "Tenants"] },
      { title: "Automations", items: ["Runs", "Details"] },
      { title: "Reference", items: ["Clients", "Leagues"] },
    ],
  },
  {
    name: "Silver",
    marker: "bg-data-4",
    note: "Dimensionally modelled. One definition across every property.",
    groups: [
      { title: "Dimensions", items: ["Events", "Automations", "Platform users", "Accounts"] },
      { title: "Facts", items: ["Ticketing", "Platform activity", "Segments", "Automation runs"] },
      { title: "Aggregates", items: ["Email by day", "Fan acquisition", "Platform activity"] },
    ],
  },
  {
    name: "Gold",
    marker: "bg-data-1",
    note: "Consumption endpoints. Rebuilt every run, tested first.",
    groups: [
      {
        title: "Endpoints",
        items: ["Team trends", "Automations", "Segment activity", "Platform activity", "Email campaigns"],
      },
    ],
  },
];

const consumers = ["Client success platform", "Data sharing with clients", "BI dashboards", "AI assistants"];

function Band({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <p className="rounded-md border border-border bg-surface px-4 py-2 text-center font-semibold">
        {title}
      </p>
      <div className="mt-3 flex-1">{children}</div>
    </div>
  );
}

function Hop({ label }: { label: string }) {
  return (
    <span className="flex items-center justify-center gap-1 py-1 text-xs text-text-muted lg:flex-col lg:py-0">
      <span aria-hidden className="lg:hidden">
        ↓
      </span>
      <span aria-hidden className="hidden lg:inline">
        →
      </span>
      {label}
    </span>
  );
}

export function MedallionDiagram() {
  return (
    <figure className="diagram my-8">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,3.4fr)_auto_minmax(0,1fr)] lg:items-stretch">
        <Band title="Data sources">
          <ul className="h-full space-y-2 rounded-md border border-border bg-surface p-4 text-sm">
            {sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Band>

        <Hop label="Airflow" />

        <Band title="PRIME process, in Snowflake">
          <ol className="grid h-full gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
            {layers.map((l, i) => (
              <li key={l.name} className="contents">
                <div className="rounded-md border border-border bg-surface p-4">
                  <span aria-hidden className={`block h-1 w-8 rounded-full ${l.marker}`} />
                  <p className="mt-3 font-semibold">{l.name}</p>
                  <p className="mt-1 text-xs text-text-muted">{l.note}</p>
                  {l.groups.map((g) => (
                    <div key={g.title} className="mt-3">
                      <p className="meta">{g.title}</p>
                      <ul className="mt-1 text-sm">
                        {g.items.map((it) => (
                          <li key={it}>{it}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {i < layers.length - 1 && <Hop label="dbt" />}
              </li>
            ))}
          </ol>
        </Band>

        <Hop label="Serve" />

        <Band title="Consume">
          <ul className="h-full space-y-2 rounded-md border border-border bg-surface p-4 text-sm">
            {consumers.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Band>
      </div>
      <figcaption className="mt-4 text-sm text-text-muted">
        Airflow loads each source into bronze. dbt models silver and gold, once, in Snowflake. Every consumer
        reads the same gold endpoints, so internal teams and clients see the same numbers.
      </figcaption>
    </figure>
  );
}
