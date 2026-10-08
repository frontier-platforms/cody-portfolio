/** Single source for names, links and navigation used across the site. */
export const site = {
  name: "Cody Chandler",
  title: "Cody Chandler · Data and product leader",
  description:
    "Data and product leader in Calgary, with a background in sales, marketing and finance. I help teams grow revenue with better data and products.",
  location: "Calgary, Alberta",
  email: "codypchandler@gmail.com",
  linkedin: "https://www.linkedin.com/in/codypchandler/" as string | null,
  // The site's own repo: the only public one, so every GitHub link points here.
  github: "https://github.com/frontier-platforms/cody-portfolio",
  // Frontier Platforms, where Signl List and Valve are built.
  frontier: "https://www.frontier-platforms.com",
  // Google Calendar appointment page.
  booking: "https://calendar.app.google/JwNxKy9XtQ5vicds8" as string | null,
  resume: "/resume.pdf",
  // Set NEXT_PUBLIC_SITE_URL once the custom domain is connected; Vercel's own domain is the fallback.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
} as const;

/** BRAND.md section 6: Home, Work, Lab, About, Contact. */
export const nav = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
