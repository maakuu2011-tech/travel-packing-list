const fallbackSiteUrl = "https://tabijitaku-list.pages.dev";
const configuredSiteUrl = process.env.PUBLIC_SITE_URL?.trim();

export const SITE_URL = (configuredSiteUrl || fallbackSiteUrl).replace(/\/+$/, "");

