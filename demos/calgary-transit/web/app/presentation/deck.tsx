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
const CHANNEL = "calgary-deck";

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

const noopSubscribe = () => () => {};

function useDeckState() {
  const index = useSyncExternalStore(subscribeHash, readHash, () => 0);
  const channel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    channel.current = new BroadcastChannel(CHANNEL);
    channel.current.onmessage = (e: MessageEvent<{ index: number }>) => setHash(e.data.index);
    return () => channel.current?.close();
  }, []);

  const go = useCallback((next: number) => {
    const i = clamp(next);
    setHash(i);
    channel.current?.postMessage({ index: i });
  }, []);

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

function Notes({ index }: { index: number }) {
  const s = SLIDES[index];
  return (
    <div className="text-[15px] leading-relaxed text-white/90">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
        Slide {index + 1} · about {s.minutes < 1 ? `${Math.round(s.minutes * 60)} sec` : `${s.minutes} min`}
      </p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        {s.notes.map((n, i) => (
          <li
            key={i}
            className={
              n.includes("[Your story")
                ? "text-cgy-gold"
                : n.startsWith("LIVE DEMO")
                  ? "font-semibold text-white"
                  : ""
            }
          >
            {n}
          </li>
        ))}
      </ul>
    </div>
  );
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
  const [showNotes, setShowNotes] = useState(false);
  const presenter = useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).get("view") === "presenter",
    () => false,
  );

  const extra = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "n") {
        setShowNotes((v) => !v);
        return true;
      }
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

  if (presenter) return <PresenterView index={index} go={go} />;

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
      {showNotes && (
        <div className="max-h-[30vh] shrink-0 overflow-y-auto border-t border-white/10 px-6 py-3">
          <Notes index={index} />
        </div>
      )}
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
        <ToolbarButton onClick={() => setShowNotes((v) => !v)} label="Speaker notes (N)">
          Notes
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            window.open(
              withBase(`/presentation?view=presenter#${index + 1}`),
              "presenter",
              "width=1100,height=760",
            )
          }
          label="Open presenter view in a new window"
        >
          Presenter
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

function PresenterView({ index, go }: { index: number; go: (i: number) => void }) {
  // Only rendered in the browser (the presenter flag is false on the server), so Date.now() is safe here.
  const [start, setStart] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.max(0, Math.floor((now - start) / 1000));
  const planned = SLIDES.slice(0, index).reduce((m, s) => m + s.minutes, 0);
  const over = secs / 60 > planned + 1;

  return (
    <div className="fixed inset-0 z-50 grid grid-cols-[1.4fr_1fr] grid-rows-[auto_1fr] gap-4 bg-[#2a2d31] p-4 text-white">
      <div className="col-span-2 flex items-center gap-4 text-sm">
        <span className="font-bold">Presenter view</span>
        <span className="text-white/60">Keys here move the main window too.</span>
        <span className={`ml-auto tabular text-lg font-bold ${over ? "text-cgy-gold" : ""}`}>
          {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}
        </span>
        <span className="tabular text-white/60">plan: ~{Math.round(planned)} min in by this slide</span>
        <button
          type="button"
          onClick={() => {
            setStart(Date.now());
            setNow(Date.now());
          }}
          className="rounded bg-white/10 px-2 py-1 text-xs font-semibold hover:bg-white/20"
        >
          Reset timer
        </button>
      </div>
      <div className="flex min-h-0 flex-col gap-3">
        <Scaled index={index} className="min-h-0 flex-1" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="rounded bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20"
          >
            ← Previous
          </button>
          <span className="tabular text-sm text-white/70">
            {index + 1} / {TOTAL}
          </span>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="rounded bg-cgy-red px-3 py-1.5 text-sm font-semibold hover:bg-cgy-red-dark"
          >
            Next →
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-col gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Next</p>
          {index < TOTAL - 1 ? (
            <Scaled index={index + 1} className="h-48" />
          ) : (
            <p className="text-white/60">Last slide</p>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto rounded bg-white/5 p-4">
          <Notes index={index} />
        </div>
      </div>
    </div>
  );
}
