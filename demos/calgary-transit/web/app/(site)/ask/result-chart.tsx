"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS, C } from "@/components/charts/palette";
import type { QueryResult } from "@/lib/duckdb";
import { fmtCompact, fmtNumber } from "@/lib/format";

const TIME = /(^|_)(year|month|quarter|date|week|day)$/i;
const label = (c: string) => c.replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase());

/** A quick chart of the answer's data: a line over time, or a bar per category. Nothing for a single number. */
export function ResultChart({ result }: { result: QueryResult }) {
  const { columns, rows } = result;
  if (rows.length < 2 || rows.length > 120) return null;

  const x = columns.find((c) => TIME.test(c)) ?? columns.find((c) => typeof rows[0][c] === "string");
  const y = columns.find((c) => c !== x && typeof rows[0][c] === "number" && !TIME.test(c));
  if (!x || !y) return null;

  const overTime = TIME.test(x);
  const data = overTime
    ? [...rows].sort((a, b) => String(a[x]).localeCompare(String(b[x])))
    : [...rows].sort((a, b) => Number(b[y]) - Number(a[y])).slice(0, 10);

  return (
    <figure className="rounded border border-cgy-line p-3">
      <figcaption className="mb-2 text-sm font-semibold text-cgy-slate">
        {label(y)} by {label(x).toLowerCase()}
      </figcaption>
      <ResponsiveContainer width="100%" height={overTime ? 220 : Math.max(160, data.length * 28)}>
        {overTime ? (
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey={x} {...AXIS} minTickGap={24} />
            <YAxis {...AXIS} width={48} tickFormatter={(v: number) => fmtCompact(v)} />
            <Tooltip formatter={(v) => [fmtNumber(Number(v), Number.isInteger(Number(v)) ? 0 : 2), label(y)]} />
            <Line type="monotone" dataKey={y} stroke={C.red} strokeWidth={2.5} dot={data.length <= 20} />
          </LineChart>
        ) : (
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.line} horizontal={false} />
            <XAxis type="number" {...AXIS} tickFormatter={(v: number) => fmtCompact(v)} />
            <YAxis type="category" dataKey={x} {...AXIS} width={160} interval={0} />
            <Tooltip formatter={(v) => [fmtNumber(Number(v), Number.isInteger(Number(v)) ? 0 : 2), label(y)]} />
            <Bar dataKey={y} fill={C.red} radius={[0, 2, 2, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </figure>
  );
}
