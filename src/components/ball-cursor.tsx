"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, input, textarea, select, label, [role=link], .cursor-grab";

/**
 * Replaces the mouse pointer with a ball the size of the dial's knob. Only for a mouse or trackpad (touch keeps
 * nothing). It inverts whatever is under it so it shows on light and dark alike, swells a little over things you
 * can click, and steps aside while you're dragging the dial or holding a catch-me ball, so that is the cursor.
 */
export function BallCursor() {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("ball-cursor");
    const o = outer.current!;
    const i = inner.current!;
    let onDial = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      o.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      o.style.opacity = onDial ? "0" : "1";
      const hot = !!(e.target as Element | null)?.closest?.(INTERACTIVE);
      i.style.transform = `scale(${hot ? 1.6 : 1})`;
    };
    const down = (e: PointerEvent) => {
      onDial = !!(e.target as Element | null)?.closest?.("[data-dial-grab], [data-hold]");
      o.style.opacity = onDial ? "0" : "1";
      if (!onDial) i.style.transform = "scale(0.8)";
    };
    const up = (e: PointerEvent) => {
      onDial = false;
      move(e);
    };
    const leave = () => (o.style.opacity = "0");

    addEventListener("pointermove", move);
    addEventListener("pointerdown", down, true); // capture: the dial and the game ball stop the event before it reaches window
    addEventListener("pointerup", up);
    document.addEventListener("pointerleave", leave);
    addEventListener("blur", leave);
    return () => {
      root.classList.remove("ball-cursor");
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", down, true);
      removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
      removeEventListener("blur", leave);
    };
  }, []);

  return (
    <div
      ref={outer}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] opacity-0 mix-blend-difference transition-opacity duration-150"
    >
      {/* Same size as the knob: 26 of the dial's 1000 units, at the dial's own width */}
      <div
        ref={inner}
        className="-ml-[calc(var(--ball)/2)] -mt-[calc(var(--ball)/2)] h-[var(--ball)] w-[var(--ball)] rounded-full bg-white transition-transform duration-200 ease-out [--ball:calc(var(--dial)*0.026)]"
      />
    </div>
  );
}
