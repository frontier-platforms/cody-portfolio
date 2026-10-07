"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics";

const TABS = [
  { href: "/lab/calgary", label: "Permits", dataset: "permits" },
  { href: "/lab/housing", label: "Housing + ML", short: "Housing", dataset: "housing" },
  { href: "/lab/flames", label: "Flames", dataset: "flames" },
] as const;

/** Route-based tabs: each dataset is its own static page and its own JS chunk. */
export function LabTabs() {
  const pathname = usePathname();
  const active = TABS.find((t) => pathname.startsWith(t.href));

  useEffect(() => {
    if (active) track("lab_tab_viewed", { dataset: active.dataset });
  }, [active]);

  return (
    <nav aria-label="Labs" className="-mb-px flex min-w-0 gap-1 overflow-x-auto sm:gap-1">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={active?.href === t.href ? "page" : undefined}
          className="shrink-0 whitespace-nowrap border-b-2 border-transparent px-2 py-3 text-sm text-text-muted transition-colors hover:text-text aria-[current=page]:border-accent aria-[current=page]:font-semibold aria-[current=page]:text-text sm:px-3"
        >
          {"short" in t ? (
            <>
              <span className="sm:hidden">{t.short}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </>
          ) : (
            t.label
          )}
        </Link>
      ))}
    </nav>
  );
}
