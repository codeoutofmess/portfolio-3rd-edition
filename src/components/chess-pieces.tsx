import { useId } from "react";

/** Our own chess pieces, drawn as shaded silhouettes: every piece stands on the same two-step round base and straight stem,
 * and only the head changes, with the pieces getting taller from pawn to king. Each is one outline (no overlapping parts)
 * on a 100 by 100 grid, shown cropped so it fills its square. Ivory and ebony, the same in light and dark mode. */
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

// The shared base and stem, from the stem's top right corner, round the base, back up to its top left.
const base = (top: number) => `M63 ${top} V78 H69 V84 H74 V90 H26 V84 H31 V78 H37 V${top}`;

const HEADS: Record<PieceType, string> = {
  // a small ball on a short, slimmer stem and base than the other pieces
  p: "M58 64 V78 H65 V84 H69 V90 H31 V84 H35 V78 H42 V64 H44.4 A8 8 0 1 1 55.6 64 Z",
  // a wider crenellated block
  r: `${base(52)} H35 V38 H41 V44 H47 V38 H53 V44 H59 V38 H65 V52 Z`,
  // a horse's head facing right, with one ear
  n: `${base(62)} V60 C37 48 42 38 52 35 L57 31 L59 39 L71 49 L72 56 L63 62 Z`,
  // a collar, then a pointed mitre with a slit cut into its right side
  b: `${base(58)} H33 V54 H41 C37 46 42 36 50 30 C53 31 56 33 59 37 L52 45 L61 43 C62 46 62 50 59 54 H67 V58 Z`,
  // a collar, a narrow neck, then a three-point crown
  q: `${base(50)} H33 V46 H41 V36 H37 L34 27 L42 31 L50 22 L58 31 L66 27 L63 36 H59 V46 H67 V50 Z`,
  // a collar, a rounded crown and a cross on top
  k: `${base(48)} H33 V44 H41 C34 38 34 28 42 26 H46 V20 H42 V16 H46 V11 H54 V16 H58 V20 H54 V26 H58 C66 28 66 38 59 44 H67 V48 Z`,
};

// Lit from the upper left like a studio shot: each piece is shaded across its width as if round, with a soft sheen
// down the stem, light catching the top of each base step, and a shadow on the board.
const LOOK = {
  // Shading colours are --pw-0..3 and --pb-0..3 in globals.css: the side that matches the page is greyed a little so
  // it stands out (white goes darker grey in light mode, black goes lighter grey in dark mode).
  w: { stops: [0, 1, 2, 3].map((i) => `var(--pw-${i})`), edge: "rgba(0, 0, 0, 0.32)", sheen: 0.9, rim: "#ffffff" },
  b: { stops: [0, 1, 2, 3].map((i) => `var(--pb-${i})`), edge: "rgba(255, 255, 255, 0.22)", sheen: 0.28, rim: "#8a8a84" },
};

export function Piece({ type, color }: { type: PieceType; color: "w" | "b" }) {
  const id = "pc" + useId().replace(/[^a-zA-Z0-9]/g, ""); // safe inside url(#...)
  const look = LOOK[color];
  return (
    <svg viewBox="14 8 72 86" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`${id}f`} x1="0" x2="1" y1="0" y2="0">
          {look.stops.map((c, i) => <stop key={i} offset={[0, 0.38, 0.62, 1][i]} style={{ stopColor: c }} />)}
        </linearGradient>
        <clipPath id={`${id}c`}>
          <path d={HEADS[type]} />
        </clipPath>
      </defs>
      <ellipse cx="50" cy="90.5" rx="27" ry="2.6" fill="rgba(0, 0, 0, 0.28)" />
      <path d={HEADS[type]} fill={`url(#${id}f)`} />
      <g clipPath={`url(#${id}c)`}>
        <rect x="42.5" y="8" width="3.5" height="70" fill="#ffffff" opacity={look.sheen * 0.45} />
        <rect x="26" y="78" width="48" height="1.2" fill={look.rim} opacity="0.7" />
        <rect x="26" y="84" width="48" height="1.2" fill={look.rim} opacity="0.7" />
      </g>
      <path d={HEADS[type]} fill="none" stroke={look.edge} strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}
