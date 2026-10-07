import Link from "next/link";
import { site } from "@/lib/site";

const linkClass = "inline-flex min-h-11 items-center underline-offset-[3px] hover:text-text hover:underline";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-site flex-col gap-2 px-4 py-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          {site.name} · {site.location}
        </p>
        <ul className="flex flex-wrap gap-x-6">
          <li>
            <a
              className={linkClass}
              href={`mailto:${site.email}`}
              data-track="cta_clicked"
              data-track-cta="email"
              data-track-location="footer"
            >
              Email
            </a>
          </li>
          <li>
            <a
              className={linkClass}
              href={site.resume}
              data-track="cta_clicked"
              data-track-cta="resume"
              data-track-location="footer"
            >
              Resume
            </a>
          </li>
          {site.linkedin && (
            <li>
              <a
                className={linkClass}
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
              className={linkClass}
              href={site.github}
              data-track="cta_clicked"
              data-track-cta="github"
              data-track-location="footer"
            >
              GitHub
            </a>
          </li>
          <li>
            <Link className={linkClass} href="/projects">
              Projects
            </Link>
          </li>
          <li>
            <Link className={linkClass} href="/colophon">
              How this site is built
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
