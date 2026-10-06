"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { nav, site } from "@/lib/site";
import { openTelemetry } from "@/components/telemetry/open";

export type CommandItem = { href: string; label: string; hint?: string };

const TELEMETRY = "#telemetry";

const baseItems: CommandItem[] = [
  { href: "/", label: "Home" },
  ...nav.map((n) => ({ href: n.href, label: n.label })),
  { href: "/lab/calgary", label: "Calgary building permits", hint: "Lab" },
  { href: "/lab/housing", label: "Calgary housing values", hint: "Lab" },
  { href: "/lab/housing#model", label: "Home value predictor", hint: "Lab · ML" },
  { href: "/lab/flames", label: "Flames shot map", hint: "Lab" },
  { href: "/lab/calgary#pipeline", label: "Run a pipeline live", hint: "Lab · data" },
  { href: "/lab/calgary#ask", label: "Ask the data", hint: "Lab · AI" },
  { href: TELEMETRY, label: "Open telemetry", hint: "Queries · events · vitals" },
  { href: "/colophon", label: "How this site is built" },
  { href: `mailto:${site.email}`, label: "Email Cody", hint: site.email },
];

/** ⌘K / Ctrl+K jump menu. Built on <dialog> so focus trapping and Esc come free. */
export function CommandMenu({ items }: { items: CommandItem[] }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const all = useMemo(() => [...baseItems.slice(0, 5), ...items, ...baseItems.slice(5)], [items]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(q));
  }, [all, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function open() {
    track("command_menu_opened", {});
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
  }

  function go(item: CommandItem | undefined) {
    if (!item) return;
    dialog.current?.close();
    if (item.href === TELEMETRY) openTelemetry("command_menu");
    else if (item.href.startsWith("mailto:")) window.location.href = item.href;
    else router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Open command menu"
        className="hidden items-center gap-1.5 border border-line px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-ink hover:text-ink sm:flex"
      >
        <span aria-hidden>⌘K</span>
        <span className="sr-only">Search pages</span>
      </button>
      <dialog
        ref={dialog}
        aria-label="Jump to a page"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto mt-[12vh] w-[min(36rem,calc(100vw-2rem))] border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/40"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onInputKey}
          placeholder="Jump to…"
          aria-label="Search pages"
          aria-controls="command-results"
          aria-activedescendant={results[active] ? `cmd-${active}` : undefined}
          className="w-full border-b border-line bg-transparent px-4 py-3 text-base outline-none placeholder:text-muted"
        />
        <ul id="command-results" role="listbox" className="max-h-80 overflow-y-auto py-1">
          {results.map((item, i) => (
            <li
              key={item.href + item.label}
              id={`cmd-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className="flex cursor-pointer items-center justify-between px-4 py-2 text-sm aria-selected:bg-accent-soft"
            >
              <span>{item.label}</span>
              {item.hint && <span className="font-mono text-xs text-muted">{item.hint}</span>}
            </li>
          ))}
          {results.length === 0 && <li className="px-4 py-3 text-sm text-muted">No matches.</li>}
        </ul>
      </dialog>
    </>
  );
}
