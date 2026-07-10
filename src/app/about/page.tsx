import type { Metadata } from "next";
import { ShellBox } from "@/components/hud/shell-box";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <ShellBox backHref="/menu" size="compact">
        <p className="text-xs tracking-widest text-accent">{"// ABOUT ME"}</p>
        <div className="mt-6 space-y-5 text-sm leading-relaxed text-ink-soft">
          <p>
            I started on the software engineering side, which is probably why I
            get twitchy around designs that look great in Figma and fall apart
            the moment real data or an engineer&apos;s deadline hits them. I
            care about the version that actually ships.
          </p>
          <p>
            Most of what&apos;s here started as university design work — full
            research-to-prototype case studies — and I&apos;m now doing the
            same thing for real clients: sitting with a messy problem,
            figuring out what&apos;s actually wrong, and building something
            that holds up.
          </p>
          <p>
            Outside of client work I&apos;m usually deep in a personal project,
            mostly because it&apos;s the fastest way to learn a new tool
            without waiting for someone to greenlight it.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4 text-xs tracking-widest">
          <a href="/contact" className="text-accent hover:underline">
            GET IN TOUCH →
          </a>
          <a
            href={site.socials.linkedin}
            target="_blank"
            rel="noreferrer"
            className="text-ink-dim hover:text-ink"
          >
            LINKEDIN
          </a>
          <a
            href={site.socials.behance}
            target="_blank"
            rel="noreferrer"
            className="text-ink-dim hover:text-ink"
          >
            BEHANCE
          </a>
        </div>
      </ShellBox>
    </main>
  );
}
