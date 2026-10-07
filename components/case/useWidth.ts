"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Width of an element in CSS pixels, kept current as it resizes. Charts draw
 * at their real size with it, so SVG text stays at the brand's type scale
 * instead of growing and shrinking with a viewBox.
 */
export function useWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}
