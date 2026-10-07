import Link from "next/link";
import { business } from "@/lib/business";

/** Sales, marketing, operations and finance experience, each with proof. */
export function AcrossTheBusiness() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {business.map((c) => (
        <li key={c.area} className="flex flex-col rounded-md border border-border p-6">
          <p className="meta">{c.where}</p>
          <h3 className="mt-2 text-xl">{c.area}</h3>
          <p className="mt-2 text-text-muted">{c.body}</p>
          {c.proof && (
            <p className="mt-auto pt-4">
              <Link href={c.proof.href} className="link inline-flex min-h-11 items-center text-sm">
                {c.proof.label}
              </Link>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
