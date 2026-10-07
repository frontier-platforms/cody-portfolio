"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Nav links: underline on hover, and on the current section. */
export function NavLinks({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center">
      {items.map((item) => {
        const section = `/${item.href.split("/")[1]}`;
        const active = pathname === section || pathname.startsWith(`${section}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="inline-flex min-h-11 items-center px-2 text-sm text-on-accent underline-offset-[3px] transition-colors hover:underline aria-[current=page]:font-semibold aria-[current=page]:underline sm:px-3 sm:text-base"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
