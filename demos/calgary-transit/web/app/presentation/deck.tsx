"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SLIDES } from "./slides";
import { SlideFrame } from "./slide-kit";
import { withBase } from "@/lib/paths";

const W = 1280;
const H = 720;
const TOTAL = SLIDES.length;

function clamp(i: number) {
  return Math.max(0, Math.min(TOTAL - 1, i));
}

function readHash(): number {
  const n = Number(window.location.hash.replace("#", ""));
  return Number.isFinite(n) && n >= 1 ? clamp(n - 1) : 0;
}

function useFitScale(ref: React.RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(el.clientWidth / W, el.clientHeight / H));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scale;
}

function Scaled({ index, className = "" }: { index: number; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const scale = useFitScale(box);
  return (
    <div ref={box} className={`flex items-center justify-center overflow-hidden ${className}`}>
      {scale > 0 && (
        <div style={{ width: W * scale, height: H * scale }} className="relative shadow-2xl">
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
            className="absolute left-0 top-0"
          >
            <SlideFrame slide={SLIDES[index]} index={index} total={TOTAL} />
          </div>
        </div>
      )}
    </div>
  );
}

// The URL hash (#3) is the source of truth for the current slide, so a reload keeps your place.
const hashListeners = new Set<() => void>();

function setHash(i: number) {
  history.replaceState(null, "", `#${i + 1}`);
  hashListeners.forEach((l) => l());
}

function subscribeHash(listener: () => void) {
  hashListeners.add(listener);
  window.addEventListener("hashchange", listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener("hashchange", listener);
  };
}

function useDeckState() {
  const index = useSyncExternalStore(subscribeHash, readHash, () => 0);
  const go = useCallback((next: number) => setHash(clamp(next)), []);

  return { index, go };
}

function useKeys(index: number, go: (i: number) => void, extra: (e: KeyboardEvent) => boolean = () => false) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (extra(e)) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) go(index + 1);
      else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) go(index - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(TOTAL - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, extra]);
}

function ToolbarButton({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded px-2.5 py-1 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

export const DOWNLOADS = [
  { href: withBase("/downloads/data-product-case-study.pdf"), label: "PDF" },
  { href: withBase("/downloads/data-product-case-study.pptx"), label: "PowerPoint" },
];

function DownloadMenu() {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded px-2.5 py-1 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
        Download ▾
      </summary>
      <div className="absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-md bg-white text-sm shadow-xl">
        {DOWNLOADS.map((d) => (
          <a
            key={d.href}
            href={d.href}
            download
            className="block px-3 py-2 font-semibold text-cgy-slate hover:bg-cgy-mist"
          >
            {d.label}
          </a>
        ))}
      </div>
    </details>
  );
}

export function Deck() {
  const { index, go } = useDeckState();
  const router = useRouter();

  const extra = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "f") {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
        return true;
      }
      // In fullscreen the browser uses Esc to leave fullscreen; outside it, Esc leaves the presentation.
      if (e.key === "Escape" && !document.fullscreenElement) {
        router.push("/");
        return true;
      }
      return false;
    },
    [router],
  );
  useKeys(index, go, extra);

  const elapsed = SLIDES.slice(0, index).reduce((m, s) => m + s.minutes, 0);
  return (
    <div className="fixed inset-0 flex flex-col bg-[#2a2d31]">
      <div className="relative min-h-0 flex-1">
        <Scaled index={index} className="absolute inset-0 px-3 pb-2 pt-3" />
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
          className="absolute inset-y-0 left-0 w-1/5 cursor-w-resize"
        />
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => go(index + 1)}
          className="absolute inset-y-0 right-0 w-1/5 cursor-e-resize"
        />
      </div>
      <div className="flex shrink-0 items-center gap-1 border-t border-white/10 px-3 py-1.5">
        <Link
          href="/"
          title="Exit (Esc)"
          className="rounded bg-white/10 px-3 py-1 text-sm font-semibold text-white hover:bg-cgy-red"
        >
          ✕ Exit
        </Link>
        <div className="mx-2 h-1 flex-1 overflow-hidden rounded bg-white/10">
          <div
            className="h-1 bg-cgy-red transition-all"
            style={{ width: `${((index + 1) / TOTAL) * 100}%` }}
          />
        </div>
        <span className="tabular px-2 text-xs text-white/50">~{Math.round(elapsed)} min in</span>
        <ToolbarButton onClick={() => go(index - 1)} label="Previous (←)">
          ←
        </ToolbarButton>
        <span className="tabular px-1 text-sm text-white/70">
          {index + 1} / {TOTAL}
        </span>
        <ToolbarButton onClick={() => go(index + 1)} label="Next (→)">
          →
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            document.fullscreenElement
              ? document.exitFullscreen()
              : document.documentElement.requestFullscreen().catch(() => {})
          }
          label="Fullscreen (F)"
        >
          Fullscreen
        </ToolbarButton>
        <DownloadMenu />
      </div>
    </div>
  );
}
