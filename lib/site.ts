/** Single source for names, links and navigation used across the site. */
export const site = {
  name: "Cody Chandler",
  title: "Cody Chandler · Data, product and growth",
  description:
    "Calgary-based data and product leader. I build data platforms, analytics and AI features that sales, marketing and leadership use to make decisions.",
  location: "Calgary, Alberta",
  email: "codypchandler@gmail.com",
  linkedin: "https://www.linkedin.com/in/codypchandler/" as string | null,
  github: "https://github.com/frontier-platforms",
  // TODO(cody): booking link (Cal.com, Calendly or similar). Until then, email is the fallback.
  booking: null as string | null,
  // TODO(cody): drop a general-purpose resume.pdf into /public.
  resume: "/resume.pdf",
  // Set NEXT_PUBLIC_SITE_URL once the custom domain is connected; Vercel's own domain is the fallback.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
} as const;

export const nav = [
  { href: "/work", label: "Work" },
  { href: "/projects", label: "Projects" },
  { href: "/lab", label: "Lab" },
  { href: "/about", label: "About" },
] as const;
