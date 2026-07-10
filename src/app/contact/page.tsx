import type { Metadata } from "next";
import { DetailShell } from "@/components/hud/detail-shell";
import { BracketPanel } from "@/components/hud/bracket-panel";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <DetailShell backHref="/menu">
      <p className="text-xs tracking-widest text-accent">{"// LET'S TALK"}</p>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-soft">
        The fastest way to reach me is email. Tell me roughly what
        you&apos;re building and what stage it&apos;s at — I&apos;ll
        usually reply within a day or two.
      </p>

      <BracketPanel tinted className="mt-8 inline-block border border-line px-6 py-4">
        <a
          href={`mailto:${site.email}`}
          className="text-sm tracking-wide text-accent hover:underline"
        >
          {site.email}
        </a>
      </BracketPanel>

      <div className="mt-8 flex gap-4 text-xs tracking-widest text-ink-dim">
        <a
          href={site.socials.linkedin}
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink"
        >
          LINKEDIN
        </a>
        <a
          href={site.socials.behance}
          target="_blank"
          rel="noreferrer"
          className="hover:text-ink"
        >
          BEHANCE
        </a>
      </div>
    </DetailShell>
  );
}
