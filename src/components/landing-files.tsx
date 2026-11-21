"use client";

import { useEffect, useState } from "react";
import type { Note } from "@/content/notes";
import { PageArt, VideoTile } from "@/components/page-art";
import { useIntroPhase } from "@/lib/intro";
import { dialWidth } from "@/lib/use-mobile";

/**
 * Where the landing files sit. On a wide screen: left of the dial, in the upper part of the space between the screen's
 * edge and the menu, leaving room below for the live chess board. Without room beside the dial: a row above it.
 */
export function landingSpot(W: number, H: number, dial: number, notes: Note[]) {
  const w = W < 600 ? 60 : 76;
  const fh = w * 0.78 + 22; // icon plus name
  // Names are shown whole, so each file takes as much room as the longest name.
  const step = Math.max(w, Math.max(...notes.map((n) => n.file.length)) * 7 + 8) + 18;
  const row = (notes.length - 1) * step + w;
  const room = W / 2 - dial; // from the screen's left edge to the menu's
  const beside = room >= row + 80;
  const x0 = beside ? (room - row) / 2 : W / 2 - row / 2;
  const y = beside ? Math.max(88, H / 2 - fh - 150) : Math.max(W < 600 ? 128 : 96, H / 2 - dial - fh - 40);
  return { w, fh, step, x0, y, beside };
}

/** The live chess demo files on the landing view (see landingSpot). One click opens a file. */
export function LandingFiles({ notes, open, openIds, onOpen }: { notes: Note[]; open: boolean; openIds: string[]; onOpen: (id: string, from: DOMRect) => void }) {
  const [size, setSize] = useState(() => ({ W: innerWidth, H: innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ W: innerWidth, H: innerHeight });
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);
  const [hover, setHover] = useState<string>();
  const intro = useIntroPhase();
  const shown = open && intro !== "wait"; // after the opening loader, like the rest of the page

  const { W, H } = size;
  const dial = dialWidth(W, H) * 0.27; // menu ring plus labels
  const { w, step, x0, y } = landingSpot(W, H, dial, notes);

  return (
    <>
      {notes.map((n, i) => {
        const on = hover === n.id;
        const isOpen = openIds.includes(n.id);
        return (
          <button
            key={n.id}
            type="button"
            tabIndex={shown ? undefined : -1}
            aria-hidden={!shown}
            inert={!shown}
            aria-label={`${n.file}: ${n.hint}`}
            title={n.hint}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover((v) => (v === n.id ? undefined : v))}
            onFocus={() => setHover(n.id)}
            onBlur={() => setHover((v) => (v === n.id ? undefined : v))}
            onClick={(e) => onOpen(n.id, e.currentTarget.getBoundingClientRect())}
            className="fixed left-0 top-0 z-[5] block touch-manipulation select-none outline-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(.2,1,.3,1)]"
            style={{
              width: w,
              transform: `translate(${x0 + i * step}px, ${y + (shown ? 0 : 10)}px)`,
              opacity: shown ? 1 : 0,
              pointerEvents: shown ? undefined : "none",
              transitionDelay: shown ? `${300 + i * 80}ms` : "0ms",
            }}
          >
            <span className="block transition-transform duration-500 ease-[cubic-bezier(.2,1,.3,1)]" style={{ transform: on ? "rotate(-4deg)" : undefined }}>
              <span className="relative mx-auto flex items-center justify-center" style={{ width: w * 0.66, height: w * 0.78 }}>
                {n.video ? <VideoTile src={n.video.thumb} h={w * 0.78} strong={isOpen} /> : <PageArt strong={isOpen} label="txt" />}
              </span>
              <span
                className={`relative left-1/2 mt-1.5 block w-max -translate-x-1/2 whitespace-nowrap px-1 text-center font-file text-[11px] font-medium ${isOpen ? "underline underline-offset-2" : ""}`}
              >
                {n.file}
              </span>
            </span>
          </button>
        );
      })}
    </>
  );
}
