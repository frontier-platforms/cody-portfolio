import type { Metadata } from "next";
import { Todo } from "@/components/case/Todo";
import { ContactForm } from "@/components/contact/ContactForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Cody Chandler about senior data and product roles, or a consulting project through Frontier Platforms.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-site px-4 pt-12 sm:px-6 sm:pt-16">
      <p className="label">Contact</p>
      <h1 className="mt-3 max-w-measure text-balance text-2xl sm:text-4xl">
        Tell me about the role or the project.
      </h1>
      <p className="mt-6 max-w-measure text-lg text-text-muted">
        I’m open to full-time roles and consulting. Consulting runs through Frontier Platforms. I read
        everything and reply to anything specific.
      </p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_18rem]">
        <ContactForm />

        <aside>
          <p className="label">Or reach me directly</p>
          <ul className="mt-4 space-y-2">
            <li>
              <a
                href={`mailto:${site.email}`}
                className="link inline-flex min-h-11 items-center"
                data-track="cta_clicked"
                data-track-cta="email"
                data-track-location="contact"
              >
                {site.email}
              </a>
            </li>
            {site.linkedin && (
              <li>
                <a
                  href={site.linkedin}
                  className="link inline-flex min-h-11 items-center"
                  rel="me"
                  data-track="cta_clicked"
                  data-track-cta="linkedin"
                  data-track-location="contact"
                >
                  LinkedIn
                </a>
              </li>
            )}
            <li>
              <a
                href={site.frontier}
                className="link inline-flex min-h-11 items-center"
                data-track="cta_clicked"
                data-track-cta="frontier"
                data-track-location="contact"
              >
                Frontier Platforms ↗
              </a>
            </li>
            <li>
              <a
                href={site.resume}
                className="link inline-flex min-h-11 items-center"
                data-track="cta_clicked"
                data-track-cta="resume"
                data-track-location="contact"
              >
                Resume (PDF)
              </a>
            </li>
            {site.booking ? (
              <li>
                <a
                  href={site.booking}
                  className="link inline-flex min-h-11 items-center"
                  data-track="cta_clicked"
                  data-track-cta="booking"
                  data-track-location="contact"
                >
                  Book a 30-minute call
                </a>
              </li>
            ) : (
              <li>
                <Todo>Booking link for a 30-minute intro call.</Todo>
              </li>
            )}
          </ul>
          <p className="mt-6 text-sm text-text-muted">{site.location}</p>
        </aside>
      </div>
    </div>
  );
}
