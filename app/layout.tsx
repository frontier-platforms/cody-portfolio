import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Instrumentation } from "@/components/telemetry/Instrumentation";
import { TelemetryPanel } from "@/components/telemetry/TelemetryPanel";
import { getAllWork } from "@/lib/work";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { type: "website", siteName: site.name, locale: "en_CA" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#141311" },
  ],
};

// Runs before paint so the page never flashes the wrong theme.
const themeScript = `(()=>{try{const t=localStorage.getItem("theme");const d=t?t==="dark":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const work = await getAllWork();
  const commandItems = work.map((w) => ({ href: `/work/${w.slug}`, label: w.title, hint: w.company }));

  return (
    <html
      lang="en-CA"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
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
