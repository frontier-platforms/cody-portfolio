import Link from "next/link";
import { NavLinks } from "@/components/nav-links";

export function SiteHeader() {
  return (
    <header className="border-b border-cgy-line bg-white">
      <div className="h-1.5 bg-cgy-red" />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-lg font-bold text-cgy-navy group-hover:text-cgy-red">Calgary Transit</span>
          <span className="text-sm font-semibold text-cgy-grey">Data Product</span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
