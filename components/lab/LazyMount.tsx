"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders children only once the placeholder scrolls near the viewport. The
 * Lab's DuckDB engine and Parquet files are downloaded by those children, so
 * nothing heavy loads until someone actually reaches a demo.
 */
export function LazyMount({
  children,
  minHeight,
  label,
}: {
  children: React.ReactNode;
  minHeight: number;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={visible ? undefined : { minHeight }}>
      {visible ? (
        children
      ) : (
        <div
          className="grid h-full place-items-center border border-dashed border-line"
          style={{ minHeight }}
        >
          <span className="label">Loading {label}…</span>
        </div>
      )}
    </div>
  );
}
