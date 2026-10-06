import Link from "next/link";
import { nav } from "@/lib/site";
import { CommandMenu, type CommandItem } from "./CommandMenu";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ commandItems }: { commandItems: CommandItem[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 font-mono text-sm font-medium">
          <span
            aria-hidden
            className="inline-block size-2 bg-accent transition-transform group-hover:rotate-45"
          />
          <span className="sm:hidden">cc</span>
          <span className="hidden sm:inline">cody chandler</span>
        </Link>
        <NavLinks items={nav} />
        <div className="ml-auto flex items-center gap-1">
          <CommandMenu items={commandItems} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
