import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Instrumentation } from "@/components/telemetry/Instrumentation";
import { TelemetryPanel } from "@/components/telemetry/TelemetryPanel";
import { token } from "@/lib/brand-tokens";
import { site } from "@/lib/site";
import { getAllWork } from "@/lib/work";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { type: "website", siteName: site.name, locale: "en_CA" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // Light by default, whatever the system setting.
  themeColor: token("--color-bg"),
};

// The page renders with data-theme="light", so it opens in light mode even when
// the system is dark. A saved choice from the toggle is applied before paint.
const themeScript = `(()=>{try{const t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const work = await getAllWork();
  const commandItems = work.map((w) => ({ href: `/work/${w.slug}`, label: w.title, hint: w.company }));

  return (
    <html lang="en-CA" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-text focus:px-3 focus:py-2 focus:text-bg"
        >
          Skip to content
        </a>
        <Header commandItems={commandItems} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <TelemetryPanel />
        <Instrumentation />
        <Analytics />
      </body>
    </html>
  );
}
