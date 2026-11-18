import type { Metadata } from "next";
import { Barlow_Condensed, Bricolage_Grotesque, Geist_Mono, Instrument_Sans } from "next/font/google";
import { BallCursor } from "@/components/ball-cursor";
import { Loader, type LoaderFile } from "@/components/loader";
import { behanceProjects } from "@/content/behance";
import { notes } from "@/content/notes";
import { coverFor, getAllProjects, SHORT_NAMES } from "@/lib/work";
import { SiteChrome } from "@/components/site-chrome";
import { site } from "@/lib/site";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Monospace for the file windows and labels and the case study text.
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

// Project titles on the case study pages.
// Only the case study pages use it, so it is not fetched ahead of time on every page.
const titleFont = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["400", "500"], preload: false });

// Condensed display face for headings and labels.
const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t="dark";document.documentElement.dataset.theme=t}catch(e){}try{if(sessionStorage.getItem("intro-seen")&&!/[?&]intro/.test(location.search))document.documentElement.dataset.seen="1"}catch(e){}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} — Designer & front-end developer, Wellington`,
  description:
    "I design and build websites end to end. UX Master's, React, Three.js, full-stack when needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The real files the loader flies in: every project folder (with its cover) and the About text files.
  const files: LoaderFile[] = [
    ...getAllProjects().map((p) => ({ kind: "folder" as const, name: SHORT_NAMES[p.slug] ?? p.title, cover: coverFor(p.slug, p.coverImage) })),
    ...behanceProjects.map((b) => ({ kind: "folder" as const, name: b.name, cover: b.cover })),
    ...notes.map((n) => ({ kind: "page" as const, name: n.file })),
  ];
  return (
    <html lang="en" className={`${instrumentSans.variable} ${mono.variable} ${display.variable} ${titleFont.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Before first paint: the visitor's saved theme, else dark. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="relative flex min-h-full flex-col bg-bg font-sans text-ink">
        <Loader files={files} />
        <SiteChrome />
        <BallCursor />
        {children}
      </body>
    </html>
  );
}
