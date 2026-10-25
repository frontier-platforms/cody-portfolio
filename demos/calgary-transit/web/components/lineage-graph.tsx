import lineage from "@/public/data/lineage.json";

// Drawn from dbt's manifest (published by the pipeline), so it matches the dbt docs lineage.
// The ML model and the app pages are added at the end.

type Node = { id: string; layer: string };

const COL_X = [0, 290, 580, 870];
const BOX_W = 250;
const APP_W = 150;
const BOX_H = 30;
const ROW = 42;
const TOP = 34;

const STYLE: Record<string, { stroke: string; fill: string; text: string }> = {
  Sources: { stroke: "#b7b9bb", fill: "#ffffff", text: "#4b4f55" },
  Reference: { stroke: "#005670", fill: "#ffffff", text: "#005670" },
  Silver: { stroke: "#4b4f55", fill: "#f6f6f6", text: "#4b4f55" },
  Gold: { stroke: "#c8102e", fill: "#ffffff", text: "#a6192e" },
  ML: { stroke: "#c8102e", fill: "#c8102e", text: "#ffffff" },
  App: { stroke: "#4b4f55", fill: "#4b4f55", text: "#ffffff" },
};

const APPS: { id: string; from: string[] }[] = [
  { id: "Dashboard", from: ["transit_monthly_kpis", "service_requests_monthly", "data_contract_status"] },
  {
    id: "Ask the data",
    from: [
      "transit_monthly_kpis",
      "ridership_by_fare_product",
      "service_requests_monthly",
      "service_requests_by_community",
      "data_contract_status",
    ],
  },
  { id: "Predict", from: ["resolution_model"] },
];

export function LineageGraph() {
  const nodes = lineage.nodes as Node[];
  const by = (layer: string) => nodes.filter((n) => n.layer === layer);
  const columns: { title: string; items: Node[]; gapAfter?: number }[] = [
    {
      title: "Sources and reference",
      items: [...by("Sources"), ...by("Reference")],
      gapAfter: by("Sources").length,
    },
    { title: "Silver", items: by("Silver") },
    { title: "Gold and ML", items: [...by("Gold"), ...by("ML")], gapAfter: by("Gold").length },
    { title: "Used by", items: APPS.map((a) => ({ id: a.id, layer: "App" })) },
  ];

  const heights = columns.map((c) => c.items.length * ROW + (c.gapAfter ? 14 : 0));
  const tallest = Math.max(...heights);
  const pos = new Map<string, { x: number; y: number }>();
  columns.forEach((c, ci) => {
    const offset = TOP + (tallest - heights[ci]) / 2;
    c.items.forEach((n, i) =>
      pos.set(n.id, { x: COL_X[ci], y: offset + i * ROW + (c.gapAfter && i >= c.gapAfter ? 14 : 0) }),
    );
  });

  const edges: [string, string][] = [
    ...(lineage.edges as [string, string][]),
    ...APPS.flatMap((a) => a.from.map((f) => [f, a.id] as [string, string])),
  ].filter(([a, b]) => pos.has(a) && pos.has(b));

  const width = COL_X[3] + APP_W + 4;
  const height = TOP + tallest;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`-2 0 ${width + 4} ${height + 4}`}
        className="w-full min-w-[760px]"
        role="img"
        aria-label="Data lineage from Calgary open data sources through silver and gold dbt models to the model, dashboard, agent and predictor"
      >
        {columns.map((c, ci) => (
          <text
            key={c.title}
            x={COL_X[ci]}
            y={14}
            fontSize={12}
            fontWeight={700}
            fill="#6f7277"
            letterSpacing="0.06em"
          >
            {c.title.toUpperCase()}
          </text>
        ))}
        {edges.map(([a, b]) => {
          const s = pos.get(a)!;
          const t = pos.get(b)!;
          const x1 = s.x + BOX_W;
          const y1 = s.y + BOX_H / 2;
          const x2 = t.x;
          const y2 = t.y + BOX_H / 2;
          const mid = (x1 + x2) / 2;
          return (
            <path
              key={`${a}-${b}`}
              d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
              fill="none"
              stroke="#b7b9bb"
              strokeWidth={1.2}
            />
          );
        })}
        {columns.flatMap((c) =>
          c.items.map((n) => {
            const p = pos.get(n.id)!;
            const st = STYLE[n.layer];
            const w = n.layer === "App" ? APP_W : BOX_W;
            return (
              <g key={n.id}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={w}
                  height={BOX_H}
                  rx={5}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeWidth={1.5}
                />
                <text
                  x={p.x + 10}
                  y={p.y + 19.5}
                  fontSize={12}
                  fill={st.text}
                  fontFamily={n.layer === "App" ? undefined : "var(--font-mono-face), monospace"}
                  fontWeight={n.layer === "App" || n.layer === "ML" ? 700 : 400}
                >
                  {n.id}
                </text>
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
