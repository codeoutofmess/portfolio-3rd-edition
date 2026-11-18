"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dialWidth } from "@/lib/use-mobile";

/** On a phone the name in the top bar ends here (it starts 56px down and its line is 32px tall). */
const NAME_BOTTOM = 88;
/** The least room kept between the row and the name above it, and between the row and the dial below it. */
const MIN_GAP = 18;
/** Where the dial's top labels sit above its centre, as a share of the dial's width (with the Work ring showing, and
 * without), plus the labels' own height in px. Keep in step with r1Phone, r2 and the phone label size in dial-menu.tsx. */
const LABEL_TOP = { outer: 0.345, inner: 0.23 };
const LABEL_PX = 13;

/**
 * How big one slide is on a phone, and where the row sits. Wide enough for a whole label (two lines if needed), and sized
 * so that the last slide showing is cut in half at the right edge, which tells you the row scrolls. The row sits midway
 * between the name and the dial; on a short screen the slides shrink so it still keeps clear of both. Files are the same
 * size on every view (sized to clear the Work ring), but where that ring isn't showing the row sits lower, in the middle
 * of the room it really has.
 */
export function useSlideSize(outer: boolean) {
  const [size, setSize] = useState(() => ({ W: innerWidth, H: innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ W: innerWidth, H: innerHeight });
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);
  const { W, H } = size;
  const dialW = dialWidth(W, H);
  // From the bottom of the name to the top of the dial's labels.
  const space = (k: number) => H / 2 - dialW * k - LABEL_PX - NAME_BOTTOM;
  const pad = 16;
  // Names are two lines, or three on a very small screen where slides are narrow; a little smaller on narrow slides, so
  // whole file names (freelance.txt) still fit across a line.
  const lines = (s: number) => (s < 80 ? 3 : 2);
  const font = (s: number) => (s < 92 ? 10 : s < 104 ? 11 : 12);
  // A file's picture is 80% of the slide wide and 78% as tall, then a 6px gap, its name, and 4px under the row.
  const rowH = (s: number) => s * 0.8 * 0.78 + 6 + font(s) * 1.2 * lines(s) + 4;
  // Exactly `whole` slides and half of the next: the fewest (so the biggest files) that still fit the room.
  let whole = Math.max(3, Math.ceil((W - pad) / 124 - 0.5));
  let slide = (W - pad) / (whole + 0.5);
  while (rowH(slide) > space(LABEL_TOP.outer) - 2 * MIN_GAP && slide > 56) slide = (W - pad) / (++whole + 0.5);
  const top = NAME_BOTTOM + Math.max(0, (space(outer ? LABEL_TOP.outer : LABEL_TOP.inner) - rowH(slide)) / 2);
  return { slide, file: slide * 0.8, top, lines: lines(slide), font: font(slide) };
}

export interface Slide {
  key: string;
  label: string;
  /** Draws the file's picture at this width (the row is as tall as 78% of it). */
  render: (fileWidth: number) => React.ReactNode;
  href?: string;
  external?: boolean;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  /** Shown as the file you last picked. */
  selected?: boolean;
  name?: string;
}

/**
 * A row of files that scrolls sideways, for phones. One line, files a good size with their whole names under them (broken
 * onto a second line when needed), and the next file always peeking in from the right edge.
 */
export function FileSlider({ slides, open, resetKey, outer = false }: { slides: Slide[]; open: boolean; resetKey?: string; outer?: boolean }) {
  const { slide, file, top, lines, font } = useSlideSize(outer);
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    row.current?.scrollTo({ left: 0 });
  }, [resetKey, open]);

  return (
    <div
      ref={row}
      aria-hidden={!open}
      inert={!open}
      style={{ top }}
      className={`fixed inset-x-0 z-[6] flex snap-x snap-proximity overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-pl-4 pb-1 pl-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden transition-opacity duration-300 ${
        open ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {slides.map((s, i) => {
        const inner = (
          <>
            <span className="mx-auto block" style={{ width: file }}>
              {s.render(file)}
            </span>
            <span
              style={{ WebkitLineClamp: lines, fontSize: font }}
              className={`mx-auto mt-1.5 w-[calc(100%-6px)] overflow-hidden break-words text-center font-file font-medium leading-[1.2] [display:-webkit-box] [-webkit-box-orient:vertical] ${s.selected ? "bg-ink text-bg" : ""}`}
            >
              {s.label.replace(/(\.[a-z]+)$/i, "\u200b$1") /* a name that has to wrap breaks before its extension, not in the middle of it */}
            </span>
          </>
        );
        const cls = "block shrink-0 snap-start select-none text-center outline-none active:opacity-70";
        const style = { width: slide, animation: open ? `file-details 0.45s ease-out ${Math.min(i, 8) * 40}ms backwards` : undefined };
        return s.href ? (
          s.external ? (
            <a key={s.key} href={s.href} className={cls} style={style} draggable={false}>
              {inner}
            </a>
          ) : (
            <Link key={s.key} href={s.href} className={cls} style={style} draggable={false}>
              {inner}
            </Link>
          )
        ) : (
          <button key={s.key} type="button" aria-label={`${s.label}: tap to open`} onClick={s.onClick} className={cls} style={style}>
            {inner}
          </button>
        );
      })}
      {/* room after the last file, so it can scroll fully into view */}
      <span aria-hidden className="block shrink-0" style={{ width: 24 }} />
    </div>
  );
}
