"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const SECTIONS = [
  { href: "/presentation", label: "Presentation" },
  { href: "/approach", label: "Approach" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/predict", label: "Predict" },
  { href: "/ask", label: "Ask the data" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="-mx-2 flex max-w-full overflow-x-auto whitespace-nowrap text-sm font-semibold sm:flex-wrap">
      {SECTIONS.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded px-2 py-1.5 transition-colors ${
              active ? "text-cgy-red" : "text-cgy-charcoal hover:text-cgy-red"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
