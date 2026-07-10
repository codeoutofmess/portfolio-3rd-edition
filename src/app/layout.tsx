import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { DotGrid } from "@/components/hud/dot-grid";
import { site } from "@/lib/site";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} — ${site.role} [terminal build]`,
  description: "Experimental terminal/HUD variant of the portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-bg font-mono text-ink">
        <DotGrid />
        {children}
      </body>
    </html>
  );
}
