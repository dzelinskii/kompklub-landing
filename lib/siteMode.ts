export type SiteMode = "teaser" | "live";

export function getSiteMode(): SiteMode {
  return process.env.SITE_MODE === "live" ? "live" : "teaser";
}
