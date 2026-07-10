"use client";

import { useEffect, useState } from "react";

/** Bold, unmissable reading-position readout fixed to the right edge. */
export function ScrollPercent() {
  const [pct, setPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      setPct(Math.round(progress * 100));
      setVisible(window.scrollY > 80);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      aria-label={`${pct}% read — back to top`}
      className={`hud-frame fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-1 border border-line bg-panel/80 px-3 py-4 backdrop-blur-sm transition-opacity duration-300 sm:flex ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
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
    </button>
  );
}
