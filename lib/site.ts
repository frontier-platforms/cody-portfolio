/** Single source for names, links and navigation used across the site. */
export const site = {
  name: "Cody Chandler",
  title: "Cody Chandler · Technology and data leader",
  description:
    "Data and product leader in Calgary, with a background in sales, marketing and finance. I help teams grow revenue with better data and products.",
  location: "Calgary, Alberta",
  email: "codypchandler@gmail.com",
  linkedin: "https://www.linkedin.com/in/codypchandler/" as string | null,
  github: "https://github.com/frontier-platforms",
  // TODO(cody): booking link (Cal.com, Calendly or similar). Until then, email is the fallback.
  booking: null as string | null,
  resume: "/resume.pdf",
  // Set NEXT_PUBLIC_SITE_URL once the custom domain is connected; Vercel's own domain is the fallback.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
} as const;

/** BRAND.md section 6 (v1.3): Work, Lab, About, Contact. */
export const nav = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
