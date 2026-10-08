"use client";

/**
 * Small hand-rolled SVG charts. No chart library: these cover exactly what the
 * Lab needs and keep the bundle light. All charts scale to their container
 * width through viewBox and expose a text summary to screen readers.
 */
import { useEffect, useRef, useState } from "react";

/**
 * Tracks an element's rendered width so charts draw in real pixels. Axis text
 * then stays a readable 10px on a phone instead of shrinking with a fixed viewBox.
 */
function useWidth<T extends Element>(fallback = 640) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

const fmt = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });
export const formatNumber = (n: number) =>
  Math.abs(n) >= 1e9
    ? `${fmt.format(n / 1e9)}B`
    : Math.abs(n) >= 1e6
      ? `${fmt.format(n / 1e6)}M`
      : Math.abs(n) >= 1e4
        ? `${fmt.format(n / 1e3)}K`
        : fmt.format(n);

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = v / p;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => m <= s) ?? 10;
  return step * p;
}

type Datum = { label: string; value: number };

/** Vertical bars. Hover a bar to read its value. Optionally falls back to ranked bars when labels won't fit. */
export function BarChart({
  data,
  height = 220,
  color = "var(--color-data-1)",
  highlight,
  summary,
  formatValue = formatNumber,
  rankIfCrowded = false,
}: {
  data: Datum[];
  height?: number;
  color?: string;
  highlight?: (d: Datum) => boolean;
  summary: string;
  formatValue?: (n: number) => string;
  /** For arbitrary results: switch to ranked horizontal bars when labels won't fit under the bars. */
  rankIfCrowded?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [ref, W] = useWidth<HTMLElement>();
  const pad = { t: 16, r: 8, b: 24, l: 52 };
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const bw = (W - pad.l - pad.r) / Math.max(data.length, 1);
  const y = (v: number) => pad.t + (height - pad.t - pad.b) * (1 - v / max);
  const labelEvery = Math.ceil(data.length / Math.max(4, Math.floor(W / 52)));
  const active = hover != null ? data[hover] : null;

  // Names and other long labels collide under narrow bars, so rank them horizontally instead.
  const longest = Math.max(...data.map((d) => d.label.length), 0);
  if (rankIfCrowded && longest * 7.5 > bw * labelEvery - 8) {
    return (
      <div ref={ref as React.RefObject<HTMLDivElement>}>
        <RankBars data={data} color={color} formatValue={formatValue} summary={summary} />
      </div>
    );
  }

  return (
    <figure ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={summary}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--color-border)" />
            <text
              x={pad.l - 6}
              y={y(max * f) + 4}
              textAnchor="end"
              className="fill-text-muted font-mono text-xs"
            >
              {formatValue(max * f)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={d.label}>
            <rect
              x={pad.l + i * bw + bw * 0.12}
              y={y(d.value)}
              width={bw * 0.76}
              height={Math.max(0, height - pad.b - y(d.value))}
              fill={highlight && !highlight(d) ? "var(--color-data-4)" : color}
              opacity={hover == null || hover === i ? 1 : 0.45}
            />
            <rect
              x={pad.l + i * bw}
              y={pad.t}
              width={bw}
              height={height - pad.t - pad.b}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {i % labelEvery === 0 && (
              <text
                x={pad.l + i * bw + bw / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-text-muted font-mono text-xs"
              >
                {d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption aria-live="polite" className="num h-5 text-xs text-text-muted">
        {active ? `${active.label}: ${formatValue(active.value)}` : " "}
      </figcaption>
    </figure>
  );
}

/** Horizontal ranked bars, for top-N lists. Labels sit above each bar so long names fit on phones. */
export function RankBars({
  data,
  color = "var(--color-data-1)",
  formatValue = formatNumber,
  summary,
  max: fixedMax,
}: {
  data: Datum[];
  color?: string;
  formatValue?: (n: number) => string;
  summary: string;
  /** Shared scale when several lists sit side by side. */
  max?: number;
}) {
  const max = fixedMax ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <ol className="space-y-3" aria-label={summary}>
      {data.map((d) => (
        <li key={d.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="truncate">{d.label}</span>
            <span className="num text-text-muted">{formatValue(d.value)}</span>
          </div>
          <div className="mt-1 h-1.5 bg-border" aria-hidden>
            <div className="h-full" style={{ width: `${(d.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

type Series = {
  name: string;
  points: { x: number; y: number }[];
  color: string;
  width?: number;
};

/** Multi-series line chart over a numeric x axis. */
export function LineChart({
  series,
  height = 240,
  xLabel,
  yLabel,
  summary,
  yMax,
  fitY = false,
  reference,
}: {
  series: Series[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
  summary: string;
  yMax?: number;
  /** Fit the y axis to the data instead of starting at zero. */
  fitY?: boolean;
  reference?: { y: number; label: string };
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const pad = { t: 16, r: 12, b: 28, l: 52 };
  const all = series.flatMap((s) => s.points);
  const xMax = Math.max(...all.map((p) => p.x), 1);
  const ys = all.map((p) => p.y).filter((v) => Number.isFinite(v));
  const minY = fitY ? Math.max(0, Math.floor(Math.min(...ys) * 20) / 20 - 0.05) : 0;
  const maxY =
    yMax ?? (fitY ? Math.ceil(Math.max(...ys) * 20) / 20 : niceMax(Math.max(...ys, reference?.y ?? 0)));
  const x = (v: number) => pad.l + ((W - pad.l - pad.r) * v) / xMax;
  const y = (v: number) => pad.t + (height - pad.t - pad.b) * (1 - (v - minY) / (maxY - minY));

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${height}`} className="h-auto w-full" role="img" aria-label={summary}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const v = minY + (maxY - minY) * f;
          return (
            <g key={f}>
              <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--color-border)" />
              <text x={pad.l - 6} y={y(v) + 4} textAnchor="end" className="fill-text-muted font-mono text-xs">
                {fitY ? v.toFixed(2) : formatNumber(v)}
              </text>
            </g>
          );
        })}
        {reference && (
          <g>
            <line
              x1={pad.l}
              x2={W - pad.r}
              y1={y(reference.y)}
              y2={y(reference.y)}
              stroke="var(--color-text-muted)"
              strokeDasharray="3 4"
            />
            <text x={pad.l + 4} y={y(reference.y) - 5} className="fill-text-muted font-mono text-xs">
              {reference.label}
            </text>
          </g>
        )}
        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color}
            strokeWidth={s.width ?? 1.5}
            strokeLinejoin="round"
            points={s.points.map((p) => `${x(p.x)},${y(p.y)}`).join(" ")}
          />
        ))}
        {xLabel && (
          <text x={W - pad.r} y={height - 6} textAnchor="end" className="fill-text-muted font-mono text-xs">
            {xLabel}
          </text>
        )}
        {yLabel && (
          <text x={pad.l} y={10} className="fill-text-muted font-mono text-xs">
            {yLabel}
          </text>
        )}
      </svg>
    </div>
  );
}
