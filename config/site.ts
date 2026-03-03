import { env } from "@/env.mjs";

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mailSupport: string;
  links: {
    twitter: string;
    github: string;
  };
};

const site_url = env.NEXT_PUBLIC_APP_URL;

export const siteConfig: SiteConfig = {
  name: "Azaan - Prayer Times",
  description:
    "Local prayer times in your area.",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "",
    github: "https://github.com/darkrove/azaan",
  },
  mailSupport: "support@next-starter.fake",
};