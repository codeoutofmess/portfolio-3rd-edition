"use client";

import { PanelWindow, usePanelLayout, useReveal } from "@/components/panel-window";
import { site } from "@/lib/site";

const COPY = [
  "I'm motivated by finding a better way to do something, even when the existing system looks near perfect. I ask why things are the way they are, then refine them or build something new from the answer.",
  "Everything is design, and anything designed by human ego has room to improve. That includes my own work.",
];

const LINKS = [
  ["LinkedIn", site.socials.linkedin],
  ["Behance", site.socials.behance],
  ["GitHub", site.socials.github],
  ["Résumé", site.resumeUrl],
] as const;

/** Me, dancing, standing on the window's title bar: at the left beside the dial, at the right on a phone (clear of the dial's labels). */
function Dancer() {
  const { beside } = usePanelLayout();
  return (
    <picture className={`pointer-events-none absolute bottom-full block w-[76px] translate-y-[3px] ${beside ? "left-8" : "right-8"}`}>
      <source media="(prefers-reduced-motion: reduce)" srcSet="/images/about/dancer-still.webp" />
      <img src="/images/about/dancer.webp" alt="Pradyumna dancing" width={200} height={259} className="h-auto w-full" />
    </picture>
  );
}

/** About, set as a small text file with the dancer on top. */
export function AboutWindow({ open, delay = 0, onClose }: { open: boolean; delay?: number; onClose: () => void }) {
  const shown = useReveal(open);
  const step = (i: number): React.CSSProperties => ({ transitionDelay: shown ? `${delay + 150 + i * 80}ms` : "0ms" });
  const rise = `transition-[opacity,transform] duration-500 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`;

  return (
    <PanelWindow open={open} delay={delay} onClose={onClose} title="about.txt" label="About me" mono tall perch={<Dancer />}>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 text-[13px] leading-[1.6] font-medium">
        <p style={step(0)} className={rise}>
          {site.name}
          <br />
          <span className="text-ink-dim">
            {site.role} · Wellington
          </span>
        </p>
        <div className="mt-4 space-y-3">
          {COPY.map((p, i) => (
            <p key={i} style={step(i + 1)} className={`text-ink-soft ${rise}`}>
              {p}
            </p>
          ))}
        </div>
        <p style={step(4)} className={`mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-dashed border-line pt-4 ${rise}`}>
          {LINKS.map(([label, href]) => (
            <a key={label} href={href} className="text-ink-dim underline-offset-4 hover:text-ink hover:underline">
              {label}
            </a>
          ))}
        </p>
      </div>
    </PanelWindow>
  );
}
