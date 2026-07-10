"use client";

import { useEffect, useState } from "react";

/**
 * Bold, unmissable reading-position readout fixed to the right edge.
 * Note: the outer element must stay `fixed` without the `.hud-frame` class —
 * `.hud-frame` forces `position: relative` and (being a plain CSS rule
 * loaded after Tailwind's utilities) wins the cascade, silently turning
 * `fixed` into `relative` so the whole thing scrolls away with the page.
 * The corner brackets live on an inner wrapper instead.
 */
export function ScrollPercent() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    // Direct update on every scroll/resize tick — no rAF throttle. This is a
    // single cheap readout, not a per-pixel drag, so the throttle wasn't
    // buying anything, and it's one less thing that can silently stall.
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      setPct(Math.round(progress * 100));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      aria-label={`${pct}% read — back to top`}
      className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 sm:block"
    >
      <span className="hud-frame flex flex-col items-center gap-1 border border-line bg-panel/90 px-3 py-4 backdrop-blur-sm">
        <span className="hud-corner hud-corner-tl" aria-hidden />
        <span className="hud-corner hud-corner-tr" aria-hidden />
        <span className="hud-corner hud-corner-bl" aria-hidden />
        <span className="hud-corner hud-corner-br" aria-hidden />
        <span className="text-[10px] tracking-widest text-ink-dim">READ</span>
        <span className="font-mono text-2xl font-bold tabular-nums text-accent">
          {pct}
        </span>
        <span className="text-[10px] tracking-widest text-ink-dim">%</span>
        <span className="mt-2 h-16 w-1 overflow-hidden rounded-full bg-white/10">
          <span
            className="block w-full rounded-full bg-accent transition-all duration-150"
            style={{ height: `${pct}%` }}
          />
        </span>
      </span>
    </button>
  );
}
