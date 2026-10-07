import Link from "next/link";
import { playbook } from "@/lib/playbook";

/** Four steps, each with proof from a case study and a lab. */
export function Playbook() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {playbook.map((step, i) => (
        <li key={step.title} className="flex flex-col rounded-md border border-border p-6">
          <p className="num text-sm text-text-muted">{String(i + 1).padStart(2, "0")}</p>
          <h3 className="mt-2 text-xl">{step.title}</h3>
          <p className="mt-2 text-text-muted">{step.body}</p>
          <ul className="mt-auto pt-4">
            {step.proof.map((p) => (
              <li key={p.href + p.label}>
                <Link href={p.href} className="link inline-flex min-h-11 items-center text-sm">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
