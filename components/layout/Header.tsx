import Link from "next/link";
import { nav } from "@/lib/site";
import { CommandMenu, type CommandItem } from "./CommandMenu";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

/**
 * BRAND.md section 6: name at left in the body face, five links at right, no
 * hamburger above 640px. Below 640px the links drop to a second row so
 * nothing scrolls sideways at 360px.
 */
export function Header({ commandItems }: { commandItems: CommandItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-14 max-w-site items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Link href="/" className="inline-flex min-h-11 shrink-0 items-center font-semibold">
          Cody Chandler
        </Link>
        <div className="ml-auto flex items-center sm:gap-2">
          <div className="hidden sm:flex">
            <NavLinks items={nav} />
          </div>
          <CommandMenu items={commandItems} />
          <ThemeToggle />
        </div>
      </div>
      <div className="flex px-2 pb-1 sm:hidden">
        <NavLinks items={nav} />
      </div>
    </header>
  );
}
