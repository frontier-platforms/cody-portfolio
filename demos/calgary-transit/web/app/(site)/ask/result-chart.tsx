"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS, C } from "@/components/charts/palette";
import type { QueryResult } from "@/lib/duckdb";
import { fmtCompact, fmtNumber } from "@/lib/format";

const TIME = /(^|_)(year|month|quarter|date|week|day)$/i;
const SERIES_COLORS = [C.red, C.slate, C.silver];
const label = (c: string) => c.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase());

/** A year (1900–2100) or a date-like string such as 2024-05 or 2024-05-01. */
function looksLikeTime(v: unknown): boolean {
  if (typeof v === "number") return Number.isInteger(v) && v >= 1900 && v <= 2100;
  if (typeof v === "string") return /^\d{4}(-\d{2}){0,2}/.test(v);
  return v instanceof Date;
}

type Spec = { x: string; ys: string[]; line: boolean; rows: QueryResult["rows"] };

/** How to chart a result: a line over time, or bars per category. Null when it isn't worth a chart. */
export function chartSpec({ columns, rows }: QueryResult, hint?: { x: string; y: string[] }): Spec | null {
  if (rows.length < 2 || rows.length > 120) return null;

  const isNumber = (c: string) =>
    rows.some((r) => typeof r[c] === "number") &&
    rows.every((r) => r[c] === null || typeof r[c] === "number");
  const varies = (c: string) => new Set(rows.map((r) => r[c])).size > 1;
  // A time axis needs a time-like name, time-like values and one value per row, so a count named
  // e.g. "requests_last_full_year" or a repeated "first_year" is never mistaken for the axis.
  const isTime = (c: string) =>
    TIME.test(c) &&
    rows.every((r) => looksLikeTime(r[c])) &&
    new Set(rows.map((r) => r[c])).size === rows.length;

  let x: string | undefined;
  let ys: string[];
  if (hint && columns.includes(hint.x) && hint.y.some((y) => columns.includes(y) && isNumber(y))) {
    x = hint.x;
    ys = hint.y.filter((y) => columns.includes(y) && isNumber(y)).slice(0, 3);
  } else {
    // For categories, the text column with the most distinct values is the most specific label
    // (fare product rather than rider group).
    const distinct = (c: string) => new Set(rows.map((r) => r[c])).size;
    const textCols = columns.filter((c) => typeof rows[0][c] === "string");
    x = columns.find(isTime) ?? [...textCols].sort((a, b) => distinct(b) - distinct(a))[0];
    // Constant columns (a "months" count of 12 on every row) aren't worth plotting.
    // Helper counts (rows, months of data) aren't measures worth plotting.
    const helper = /^(n|count|rows|row_count|months|n_months|months_of_data)$/i;
    const candidates = columns.filter(
      (c) => c !== x && !TIME.test(c) && !helper.test(c) && isNumber(c) && varies(c),
    );
    // The main series is the biggest measure; others join only on a similar scale, so a share or a
    // month count never flattens it.
    const peak = (c: string) => Math.max(...rows.map((r) => Math.abs(Number(r[c] ?? 0))));
    const main = [...candidates].sort((a, b) => peak(b) - peak(a))[0];
    ys = main ? candidates.filter((c) => c === main || (peak(c) >= peak(main) / 4 && peak(c) > 0)) : [];
  }
  if (!x || !ys.length) return null;

  const timeAxis = rows.every((r) => looksLikeTime(r[x]));
  // A line needs at least three points; two years read better as bars.
  const line = timeAxis && rows.length >= 3;
  ys = ys.slice(0, line ? 3 : 2);
  const data = timeAxis
    ? [...rows].sort((a, b) => String(a[x]).localeCompare(String(b[x])))
    : [...rows].sort((a, b) => Number(b[ys[0]] ?? 0) - Number(a[ys[0]] ?? 0)).slice(0, 10);
  return { x, ys, line, rows: data };
}

/** A quick chart of the answer's data. */
export function ResultChart({ spec }: { spec: Spec }) {
  const { x, ys, line, rows } = spec;
  const many = ys.length > 1;
  const tooltip = (
    <Tooltip
      formatter={(v, name) => [
        fmtNumber(Number(v), Number.isInteger(Number(v)) ? 0 : 2),
        label(String(name)),
      ]}
    />
  );
  const legend = many && <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => label(String(v))} />;

  return (
    <figure className="rounded border border-cgy-line p-3">
      <figcaption className="mb-2 text-sm font-semibold text-cgy-slate">
        {ys.map(label).join(", ")} by {label(x).toLowerCase()}
      </figcaption>
      <ResponsiveContainer
        width="100%"
        height={line ? 240 : Math.max(160, rows.length * (many ? 40 : 28)) + (many ? 24 : 0)}
      >
        {line ? (
          <LineChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey={x} {...AXIS} minTickGap={24} />
            <YAxis {...AXIS} width={48} tickFormatter={(v: number) => fmtCompact(v)} />
            {tooltip}
            {legend}
            {ys.map((y, i) => (
              <Line
                key={y}
                type="monotone"
                dataKey={y}
                stroke={SERIES_COLORS[i]}
                strokeWidth={2.5}
                dot={rows.length <= 20}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        ) : (
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.line} horizontal={false} />
            <XAxis type="number" {...AXIS} tickFormatter={(v: number) => fmtCompact(v)} />
            <YAxis type="category" dataKey={x} {...AXIS} width={170} interval={0} />
            {tooltip}
            {legend}
            {ys.map((y, i) => (
              <Bar
                key={y}
                dataKey={y}
                fill={SERIES_COLORS[i]}
                radius={[0, 2, 2, 0]}
                maxBarSize={26}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    </figure>
  );
}
