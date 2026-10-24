import type { Metadata } from "next";
import { Open_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Calgary Transit Data Product",
    template: "%s · Calgary Transit Data Product",
  },
  description:
    "A governed transit data layer built on City of Calgary open data: Airflow, dbt and DuckDB, with a live dashboard and an AI agent that shows its SQL.",
  // Shared by direct link only.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${openSans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
