import type { Metadata } from "next";
import { Available } from "@/components/home-chrome";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Links", description: `Where to find ${site.name}.` };

const LINKS: [string, string][] = [
  ["Portfolio", "https://pradyumna-design.com"],
  ["LinkedIn", site.socials.linkedin],
  ["Behance", site.socials.behance],
  ["GitHub", site.socials.github],
  ["Email", `mailto:${site.email}`],
];

/** Where the QR code on the ID card lands: my links as big buttons, under the same top bar as every page. */
export default function LinksPage() {
  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-col items-center px-5 pb-16 pt-[100px] sm:pt-[64px]">
      <p className="text-center font-file text-[13px] font-medium text-ink-soft">Designer / Developer · Wellington, NZ</p>
      <Available className="mt-2 text-[13px] font-medium" />
      <ul className="mt-8 flex w-full flex-col gap-3">
        {LINKS.map(([label, href]) => (
          <li key={label}>
            <a
              href={href}
              className="flex min-h-14 items-center justify-between rounded-[10px] border border-line px-5 text-[17px] font-medium transition-colors hover:bg-ink hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {label}
              <span aria-hidden className="text-ink-dim">→</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
