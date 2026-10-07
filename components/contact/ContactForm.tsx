"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { site } from "@/lib/site";

/**
 * Contact form. Posts straight to Formspree, which stores each submission and
 * emails it to me. No Formspree script loads; this is a plain fetch.
 * The form ID is public by design (it's in every request the browser sends),
 * so it lives here; NEXT_PUBLIC_FORMSPREE_ID overrides it, e.g. for testing.
 */
const FORM_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "xaeqejzp";

const REASONS = [
  { value: "hiring", label: "A full-time role" },
  { value: "project", label: "A consulting project" },
  { value: "other", label: "Something else" },
] as const;

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const reasonRef = useRef<HTMLSelectElement>(null);

  // Links like /contact?reason=project preselect the topic.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("reason");
    const match = REASONS.find((r) => r.value === wanted);
    if (match && reasonRef.current) reasonRef.current.value = match.value;
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const reason = String(data.get("reason")) as (typeof REASONS)[number]["value"];
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${FORM_ID}`, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("sent");
      form.reset();
      track("contact_submitted", { reason, outcome: "sent" });
    } catch {
      setStatus("error");
      track("contact_submitted", { reason, outcome: "error" });
    }
  }

  if (!FORM_ID)
    return (
      <p className="text-text-muted">
        The form isn’t set up yet. Email me at{" "}
        <a href={`mailto:${site.email}`} className="link">
          {site.email}
        </a>
        .
      </p>
    );

  if (status === "sent")
    return (
      <div className="rounded-md border border-border bg-surface p-6" role="status">
        <p className="font-semibold">Thanks, it’s in my inbox.</p>
      </div>
    );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input name="name" required autoComplete="name" className="field" />
        </Field>
        <Field label="Email">
          <input name="email" type="email" required autoComplete="email" className="field" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company (optional)">
          <input name="company" autoComplete="organization" className="field" />
        </Field>
        <Field label="What’s it about?">
          <select ref={reasonRef} name="reason" className="field" defaultValue="hiring">
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Message">
        <textarea name="message" required rows={6} className="field" />
      </Field>
      {/* Bots fill hidden fields; Formspree drops any submission with _gotcha set. */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input type="hidden" name="_subject" value="New message from your website" />

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={status === "sending"} className="btn btn-primary disabled:opacity-60">
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        {status === "error" && (
          <p className="text-sm text-text-muted" role="alert">
            That didn’t send. Email me at{" "}
            <a href={`mailto:${site.email}`} className="link">
              {site.email}
            </a>{" "}
            instead.
          </p>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-text-muted">{label}</span>
      {children}
    </label>
  );
}
