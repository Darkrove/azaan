import type { Metadata } from "next";
import { Poppins, Lora, Fira_Code } from "next/font/google";
import "./global.css";
import { cn, constructMetadata } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const fontSans = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Lora({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Fira_Code({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = constructMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head/>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
