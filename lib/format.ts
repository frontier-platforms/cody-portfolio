/**
 * Dates rendered on the server and again in the browser must match, or React
 * reports a hydration error. Formatting in one fixed time zone (Calgary) keeps
 * them identical, and naming the zone keeps the time clear to every visitor.
 */
const ZONE = "America/Edmonton";

export const formatRunTime = (iso: string) =>
  new Date(iso).toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ZONE,
  }) +
  " " +
  (new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, timeZoneName: "short" })
    .formatToParts(new Date(iso))
    .find((p) => p.type === "timeZoneName")?.value ?? "MT");

export const formatRunDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { dateStyle: "medium", timeZone: ZONE });
