import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          {site.name} · {site.location}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          <li>
            <a
              className="hover:text-ink"
              href={`mailto:${site.email}`}
              data-track="cta_clicked"
              data-track-cta="email"
              data-track-location="footer"
            >
              Email
            </a>
          </li>
          {site.linkedin && (
            <li>
              <a
                className="hover:text-ink"
                href={site.linkedin}
                rel="me"
                data-track="cta_clicked"
                data-track-cta="linkedin"
                data-track-location="footer"
              >
                LinkedIn
              </a>
            </li>
          )}
          <li>
            <a
              className="hover:text-ink"
              href={site.github}
              data-track="cta_clicked"
              data-track-cta="github"
              data-track-location="footer"
            >
              GitHub
            </a>
          </li>
          <li>
            <Link className="hover:text-ink" href="/colophon">
              How this site is built
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
