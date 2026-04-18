import type { Metadata } from "next";
import { Noto_Sans_Armenian } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const notoSansArmenian = Noto_Sans_Armenian({
  subsets: ["armenian", "latin"],
  variable: "--font-noto-hy",
  display: "swap",
});

export const metadata: Metadata = {
  title: siteConfig.heroTitle,
  description: siteConfig.heroSubtitle,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" className={`${notoSansArmenian.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  );
}
