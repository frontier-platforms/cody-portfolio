"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items }: { items: readonly { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-0.5 sm:gap-1 sm:pl-4">
      {items.map((item) => {
        // Match on the top-level section so /lab/flames highlights "Lab".
        const section = `/${item.href.split("/")[1]}`;
        const active = pathname === section || pathname.startsWith(`${section}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="px-1.5 py-1 text-sm text-muted transition-colors hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-accent aria-[current=page]:underline-offset-[6px] sm:px-2"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
