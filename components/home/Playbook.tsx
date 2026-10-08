import Link from "next/link";
import { playbook } from "@/lib/playbook";

/** Four steps. Each whole card links to the one page that proves it. */
export function Playbook() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {playbook.map((step, i) => (
        <li key={step.title}>
          <Link
            href={step.link.href}
            className="group flex h-full flex-col rounded-md border border-border p-6 transition-colors hover:border-accent"
          >
            <span className="num text-sm text-text-muted">{String(i + 1).padStart(2, "0")}</span>
            <span className="mt-2 text-xl font-semibold leading-snug">{step.title}</span>
            <span className="mt-2 text-text-muted">{step.body}</span>
            <span className="mt-auto pt-6 text-sm text-accent group-hover:underline">
              {step.link.label}{" "}
              <span aria-hidden className="inline-block transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
