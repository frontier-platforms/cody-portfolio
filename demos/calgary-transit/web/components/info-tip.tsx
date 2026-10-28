"use client";

import { useState, type ReactNode } from "react";

/** A small ⓘ button that shows a note on hover, focus or tap. */
/** `up` opens the note above the button, for tips near the bottom of the screen. */
export function InfoTip({ label, children, up }: { label: string; children: ReactNode; up?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-cgy-silver text-sm font-bold text-cgy-grey hover:border-cgy-slate hover:text-cgy-slate"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className={`absolute left-0 ${up ? "bottom-9" : "top-9"} z-20 w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-cgy-slate p-4 text-sm font-normal leading-relaxed text-white shadow-lg sm:left-1/2 sm:-translate-x-1/2`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
