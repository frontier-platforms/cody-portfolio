import type { Metadata } from "next";
import { Todo } from "@/components/case/Todo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email Cody Chandler about senior data and product roles, or a focused data project.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-20">
      <p className="label">Contact</p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">
        Email is the fastest way to reach me.
      </h1>
      <p className="mt-6 max-w-measure text-lg text-text-muted">
        I read everything and reply to anything specific. Tell me about the role or the problem.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href={`mailto:${site.email}`}
          className="btn btn-primary"
          data-track="cta_clicked"
          data-track-cta="email"
          data-track-location="contact"
        >
          {site.email}
        </a>
        <a
          href={site.resume}
          className="btn"
          data-track="cta_clicked"
          data-track-cta="resume"
          data-track-location="contact"
        >
          Resume (PDF)
        </a>
        {site.linkedin && (
          <a
            href={site.linkedin}
            className="btn"
            rel="me"
            data-track="cta_clicked"
            data-track-cta="linkedin"
            data-track-location="contact"
          >
            LinkedIn
          </a>
        )}
        {site.booking ? (
          <a
            href={site.booking}
            className="btn"
            data-track="cta_clicked"
            data-track-cta="booking"
            data-track-location="contact"
          >
            Book a 30-minute call
          </a>
        ) : (
          <Todo>Booking link for a 30-minute intro call.</Todo>
        )}
      </div>
      <p className="mt-8 text-sm text-text-muted">{site.location}</p>
    </div>
  );
}
