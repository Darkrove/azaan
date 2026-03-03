import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Metadata } from "next";

import { siteConfig } from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    keywords: [
      "prayer times",
      "azaan",
      "islamic prayer times",
      "muslim prayer times",
      "salat times",
      "namaz times",
      "salah times",
      "ramadan times",
      "eid times",
    ],
    authors: [
      {
        name: "sajjad",
      },
    ],
    creator: "sajjad",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title,
      description,
      siteName: title,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@sajjad",
    },
    icons,
    metadataBase: new URL(siteConfig.url),
    manifest: `${siteConfig.url}/site.webmanifest`,
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}