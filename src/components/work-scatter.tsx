"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileSlider, type Slide } from "@/components/file-slider";
import { dialWidth, useMobile, useReducedMotion } from "@/lib/use-mobile";
import type { Discipline } from "@/lib/work";

export interface WorkItem {
  slug: string;
  name: string;
  cover?: string;
  href: string;
  /** Lives on another site (Behance). */
  external?: boolean;
  groups: Discipline[];
  /** Sits in the ring round the dial rather than scattered outside it. */
  selected?: boolean;
  summary?: string;
  facts: [string, string][];
}

/** Tuning, in CSS px. */
const CONFIG = {
  layout: "grid" as "rings" | "grid", // concentric circles round the dial, or spread over a grid
  ringGap: 1.5, // distance between circles, in file heights
  ringArc: 1.6, // spacing along a circle, in file widths
  ringFill: 0.45, // share of a circle's slots that may be used, so no circle is packed full
  ringSpread: 0.6, // files on one circle stay at least this fraction of an even gap apart
  width: 68, // file width before shrinking to fit
  minWidth: 46, // below this, files may sit behind the dial (tiny phones)
  aspect: 0.78, // folder height / width
  label: 46, // space for the name under the thumbnail: up to three lines, so names are never cut short
  cell: 1.6, // grid cell size relative to a file: the space between files
  margin: 48, // kept clear round the screen edges
  dialClear: 44, // kept clear beyond the dial's outer ring
  dialWeight: 1.2, // how strongly files keep away from the dial when spreading
  edgeWeight: 1.6, // ...and from the screen edges
  halfStep: 0.4, // chance a file slides half a cell sideways or up/down, to break up the grid lines
  hoverTilt: -4, // degrees a folder tips when hovered
  typeSpeed: 700, // characters per second for the details typing in
  stagger: 28, // ms between files flying out the first time
  outStep: 20, // ms between files flying out on later opens and view switches (they fly back in 12ms apart)
  panel: 230, // details panel width
  chrome: 96, // top and bottom strip kept clear for the corner labels and icons
};

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Grid cells for files of width w, kept clear of the dial and a margin round the screen. */
export interface KeepOut {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const hits = (k: KeepOut | KeepOut[] | undefined, x: number, y: number, w: number, h: number): boolean =>
  Array.isArray(k) ? k.some((r) => hits(r, x, y, w, h)) :
  !!k && x < k.x1 && x + w > k.x0 && y < k.y1 && y + h > k.y0;

export function grid(w: number, W: number, H: number, avoidR: number, keepOut?: KeepOut | KeepOut[]) {
  const h = w * CONFIG.aspect + CONFIG.label;
  const cw = w * CONFIG.cell;
  const ch = h * CONFIG.cell;
  const cols = Math.floor((W - 2 * CONFIG.margin) / cw);
  const rows = Math.floor((H - 2 * Math.max(CONFIG.margin, CONFIG.chrome)) / ch);
  const ox = (W - cols * cw) / 2;
  const oy = (H - rows * ch) / 2;
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cw + (cw - w) / 2;
      const y = oy + r * ch + (ch - h) / 2;
      if ((w < CONFIG.minWidth || distToDial(x, y, w, h, W, H) > avoidR + CONFIG.dialClear) && !hits(keepOut, x, y, w, h)) cells.push({ x, y });
    }
  }
  return { h, cw, ch, cells };
}

/** Nearest point of a file's box to the dial centre. */
function distToDial(x: number, y: number, w: number, h: number, W: number, H: number) {
  return Math.hypot(Math.max(x, Math.min(W / 2, x + w)) - W / 2, Math.max(y, Math.min(H / 2, y + h)) - H / 2);
}

/** Files on concentric circles round the dial; slots that would leave the screen are dropped. */
function rings(n: number, W: number, H: number, avoidR: number, seed: number) {
  const top = Math.max(CONFIG.margin, CONFIG.chrome);
  for (let w = CONFIG.width; ; w *= 0.97) {
    const h = w * CONFIG.aspect + CONFIG.label;
    const rand = rng(seed);
    const rows: { x: number; y: number; a: number }[][] = [];
    for (let r = avoidR + CONFIG.dialClear + h / 2; r < Math.hypot(W, H) / 2; r += h * CONFIG.ringGap) {
      const count = Math.floor((2 * Math.PI * r) / (w * CONFIG.ringArc));
      const turn = rand() * ((2 * Math.PI) / count);
      const row: { x: number; y: number; a: number }[] = [];
      for (let i = 0; i < count; i++) {
        const a = turn + (i * 2 * Math.PI) / count;
        const x = W / 2 + r * Math.cos(a) - w / 2;
        const y = H / 2 + r * Math.sin(a) - h / 2;
        if (x >= CONFIG.margin && x + w <= W - CONFIG.margin && y >= top && y + h <= H - top) row.push({ x, y, a });
      }
      rows.push(row);
    }
    // Use the fewest inner circles that can hold n files at ringFill, so no circle is packed full.
    let used = 0;
    let cap = 0;
    while (used < rows.length && cap * CONFIG.ringFill < n) cap += rows[used++].length;
    if (cap * CONFIG.ringFill < n) continue;
    const circles = rows.slice(0, used).filter((r) => r.length);

    // Share the files between those circles in proportion to their room, then pick spread-apart random slots on each.
    const total = circles.reduce((t, r) => t + r.length, 0);
    const counts = circles.map((r) => Math.min(r.length, Math.round((n * r.length) / total)));
    for (let i = 0; counts.reduce((t, c) => t + c, 0) !== n; i = (i + 1) % counts.length) {
      const diff = n - counts.reduce((t, c) => t + c, 0);
      if (diff > 0 && counts[i] < circles[i].length) counts[i]++;
      else if (diff < 0 && counts[i] > 0) counts[i]--;
    }
    const spots: { x: number; y: number }[] = [];
    circles.forEach((row, ci) => {
      const free = [...row];
      const mine: typeof row = [];
      const gap = (2 * Math.PI) / Math.max(counts[ci], 1);
      const apart = (c: (typeof row)[number]) =>
        Math.min(...mine.map((m) => Math.abs(((c.a - m.a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI)), Infinity);
      while (mine.length < counts[ci]) {
        const ok = free.filter((c) => apart(c) >= gap * CONFIG.ringSpread);
        const pool = ok.length ? ok : [free.reduce((best, c) => (apart(c) > apart(best) ? c : best))];
        const pick = pool[Math.floor(rand() * pool.length)];
        free.splice(free.indexOf(pick), 1);
        mine.push(pick);
      }
      spots.push(...mine);
    });
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [spots[i], spots[j]] = [spots[j], spots[i]];
    }
    return { w, h, spots };
  }
}

/**
 * Files sit in grid cells spread over the whole screen, away from both the dial and the screen edges.
 * Each file takes the free cell whose nearest neighbour, the dial ring or a screen edge is farthest
 * away, so nothing clusters; some files then slide half a cell to break up the grid lines.
 * Which project lands where is shuffled.
 */
export function scatter(n: number, W: number, H: number, avoidR: number, seed: number, opts: { width?: number; keepOut?: KeepOut | KeepOut[] } = {}) {
  if (!n) return { w: CONFIG.width, h: 0, spots: [] };
  if (CONFIG.layout === "rings") return rings(n, W, H, avoidR, seed);
  let w = opts.width ?? CONFIG.width;
  let g = grid(w, W, H, avoidR, opts.keepOut);
  while (g.cells.length < n && w > 14) g = grid((w *= 0.97), W, H, avoidR, opts.keepOut);
  // A space too small to keep clear of the dial and the reserved text, even with tiny folders: drop those rules, and as a
  // last resort reuse spots, rather than never finishing (this used to freeze the page on a very small screen).
  if (g.cells.length < n) g = grid(w, W, H, 0);
  if (!g.cells.length) g.cells.push({ x: W / 2 - w / 2, y: H / 2 - g.h / 2 });
  for (let i = 0, base = g.cells.length; g.cells.length < n; i++) g.cells.push({ ...g.cells[i % base] });
  const { h, cw, ch, cells } = g;

  const rand = rng(seed);
  const room = (x: number, y: number) =>
    Math.min(
      (distToDial(x, y, w, h, W, H) - avoidR) * CONFIG.dialWeight,
      Math.min(x, y, W - x - w, H - y - h) * CONFIG.edgeWeight,
    );
  const picked: { x: number; y: number }[] = [];
  while (picked.length < n) {
    let best = 0;
    let bestD = -1;
    cells.forEach((c, i) => {
      const d = Math.min(room(c.x, c.y), ...picked.map((p) => Math.hypot(p.x - c.x, p.y - c.y)));
      if (d > bestD + 0.5 || (Math.abs(d - bestD) <= 0.5 && rand() < 0.3)) [best, bestD] = [i, d];
    });
    picked.push(cells.splice(best, 1)[0]);
  }
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  for (const p of picked) {
    if (rand() > CONFIG.halfStep) continue;
    const horizontal = rand() < 0.5;
    const sign = rand() < 0.5 ? -1 : 1;
    const x = p.x + (horizontal ? (sign * cw) / 2 : 0);
    const y = p.y + (horizontal ? 0 : (sign * ch) / 2);
    const minGap = Math.min(cw - w, ch - h) * 0.6;
    const ok =
      (w < CONFIG.minWidth || distToDial(x, y, w, h, W, H) > avoidR + CONFIG.dialClear) &&
      !hits(opts.keepOut, x, y, w, h) &&
      Math.min(x, W - x - w) >= CONFIG.margin / 2 &&
      Math.min(y, H - y - h) >= CONFIG.chrome &&
      picked.every((q) => q === p || Math.max(Math.abs(q.x - x) - w, Math.abs(q.y - y) - h) >= minGap);
    if (ok) Object.assign(p, { x, y });
  }
  return { w, h, spots: picked };
}

/** A folder with the project's still on its cover; the cover tips open when `on`. */
export function Folder({ it, on, style }: { it: WorkItem; on: boolean; style: React.CSSProperties }) {
  return (
    <span className="relative block" style={style}>
      <span className="absolute left-0 top-0 h-[16%] w-[40%] rounded-t-[6px] bg-[var(--folder-back)]" />
      <span className="absolute inset-x-0 bottom-0 top-[9%] rounded-[6px] bg-[var(--folder-back)]" />
      <span
        className={`absolute inset-x-0 bottom-0 top-[22%] origin-bottom overflow-hidden rounded-[6px] bg-[var(--folder-front)] ring-1 ring-ink/15 transition-transform duration-300 ${
          on ? "[transform:perspective(260px)_rotateX(-14deg)]" : ""
        }`}
      >
        {it.cover && <Image src={it.cover} alt="" fill sizes="120px" className="object-cover object-top" />}
      </span>
    </span>
  );
}

const TITLE = 34; // height of the "selected work" window's title bar
const PAD = 14; // space between the window's edge and its folders

/** The "selected work" window: `cols` folders across, as many rows as it takes, with a title bar on top. */
export function selectedFrame(n: number, cols: number, w: number, h: number) {
  const c = Math.max(1, Math.min(cols, n));
  const rows = Math.ceil(n / c);
  const px = w + 10; // column pitch
  const py = h + 8; // row pitch
  return { cols: c, px, py, fw: c * px - 10 + 2 * PAD, fh: TITLE + rows * py - 8 + 2 * PAD };
}

/**
 * The Work layout. The "selected" projects are set out together as one tidy grid inside a "selected work" window: to the
 * right of the dial on a wide screen ("side"), below it on a phone ("below"). The window is wider than tall: six
 * folders across and two rows for twelve. The rest are scattered on the left, away from the dial and the window. Every
 * folder is the same size, so only position says what matters.
 * `spots` lines up with `items`; `rank` is each folder's order of arrival; `frame` is the window's box, if any.
 */
export function layoutWork(items: { selected?: boolean }[], W: number, H: number, avoidR: number, seed: number, opts: { width?: number; top?: number; gap?: number; mode?: "side" | "below" | "free"; clear?: KeepOut; reserve?: KeepOut[] } = {}) {
  const top = opts.top ?? 64; // clear of the name above and the labels below
  const gap = opts.gap ?? 28; // between the dial's labels and the window
  const mode = opts.mode ?? "side"; // "free": no window, scatter over the whole screen (the Archive)
  const sel = mode === "free" ? [] : items.flatMap((it, i) => (it.selected ? [i] : []));
  const rest = items.flatMap((it, i) => (sel.includes(i) ? [] : [i]));

  let w = opts.width ?? CONFIG.width;
  let h = 0;
  let spots: { x: number; y: number }[] = [];
  let keepOut: KeepOut[] = [];
  let frame: { x: number; y: number; w: number; h: number } | null = null;
  for (; ; w *= 0.97) {
    h = w * CONFIG.aspect + CONFIG.label;
    spots = new Array(items.length);
    frame = null;
    let fits = true;
    if (sel.length) {
      fits = false;
      // Six across and two down while the folders can stay a decent size; on narrow screens, fewer across.
      for (const cols of w >= 48 || mode === "below" ? [6] : [4, 3, 2, 1]) {
        const f = selectedFrame(sel.length, Math.min(cols, Math.ceil(sel.length / 2)), w, h);
        const x = mode === "below" ? W / 2 - f.fw / 2 : W / 2 + avoidR + gap;
        const y = mode === "below" ? H / 2 + avoidR + gap : H / 2 - f.fh / 2;
        if (x < 16 || x + f.fw > W - 16 || y < top || y + f.fh > H - top) continue;
        sel.forEach((i, k) => (spots[i] = { x: x + PAD + (k % f.cols) * f.px, y: y + TITLE + PAD + Math.floor(k / f.cols) * f.py }));
        frame = { x, y, w: f.fw, h: f.fh };
        fits = true;
        break;
      }
    }
    // Scattered folders keep a clear margin from the window.
    keepOut = frame ? [{ x0: frame.x - 40, y0: frame.y - 40, x1: frame.x + frame.w + 40, y1: frame.y + frame.h + 40 }] : [];
    if (opts.clear) keepOut.push(opts.clear); // a further patch they must stay out of (the phone's opening view)
    if (opts.reserve) keepOut.push(...opts.reserve); // room kept free for the details text
    if (mode === "side") keepOut.push({ x0: W / 2, y0: 0, x1: W, y1: H }); // the whole right half belongs to the window
    if (w < 28 || (fits && grid(w, W, H, avoidR, keepOut).cells.length >= rest.length)) break;
  }

  const out = scatter(rest.length, W, H, avoidR, seed, { width: w, keepOut });
  rest.forEach((i, j) => (spots[i] = out.spots[j]));
  const rank = new Array<number>(items.length);
  sel.forEach((i, j) => (rank[i] = j));
  rest.forEach((i, j) => (rank[i] = j));
  return { w, h, spots, rank, selCount: sel.length, frame };
}

/** The window the selected projects sit in. Just the frame and its title bar; the folders are laid over it. */
export function SelectedWindow({ style, className = "" }: { style: React.CSSProperties; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none rounded-[10px] border border-line bg-bg shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] transition-[transform,opacity,width,height] duration-500 ease-[cubic-bezier(.2,1,.3,1)] ${className}`}
      style={style}
    >
      <div className="flex items-center gap-2 border-b border-line px-3.5" style={{ height: TITLE }}>
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-ink/20" />
          <span className="h-3 w-3 rounded-full bg-ink/20" />
          <span className="h-3 w-3 rounded-full bg-ink/20" />
        </span>
        <span className="flex-1 pr-[42px] text-center font-file text-[13px] text-ink-soft font-medium">selected work</span>
      </div>
    </div>
  );
}

type WorkProps = { items: WorkItem[]; filter: Discipline | "all"; view: "work" | "archive"; open: boolean };

/** Work and Archive: a row you scroll sideways on phones, folders scattered round the dial everywhere else. */
export function WorkScatter(props: WorkProps) {
  // Chosen here, before any layout is worked out, so a phone never does the desktop layout's sums.
  const mobile = useMobile();
  return mobile ? <WorkSlider {...props} /> : <WorkDesktop {...props} />;
}

/** A phone: the projects in one row, names under them (two lines if needed), the next folder peeking in from the right. */
function WorkSlider({ items, filter, view, open }: WorkProps) {
  const shown = useMemo(() => items.filter((it) => (view === "archive" ? !it.selected : it.selected && (filter === "all" || it.groups.includes(filter)))), [items, filter, view]);
  const slides: Slide[] = shown.map((it) => ({
    key: it.slug,
    label: it.name,
    href: it.href,
    external: it.external,
    render: (w) => <Folder it={it} on={false} style={{ height: w * CONFIG.aspect }} />,
  }));
  return <FileSlider slides={slides} open={open} resetKey={`${view}-${filter}`} outer={view === "work"} />;
}

function WorkDesktop({ items, filter, view, open }: { items: WorkItem[]; filter: Discipline | "all"; view: "work" | "archive"; open: boolean }) {
  // Only mounted after the first user interaction, so window is safe to read here.
  const [size, setSize] = useState(() => ({ W: innerWidth, H: innerHeight }));
  const [hover, setHover] = useState<string>();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onResize = () => setSize({ W: innerWidth, H: innerHeight });
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  // Work shows the selected projects (narrowed by the Graphic / UX / Dev ring); Archive shows all the others, scattered.
  const shown = useMemo(() => items.filter((it) => (view === "archive" ? !it.selected : it.selected && (filter === "all" || it.groups.includes(filter)))), [items, filter, view]);
  const { W, H } = size;
  // Matches the dial's outer ring plus its labels (see the svg width in dial-menu).
  const avoidR = dialWidth(W, H) * 0.37 + 12;
  const dialR = avoidR - 12; // the dial's outer ring and labels
  // The details text has two fixed places, one on each side of the dial, between the dial and the files. Both are kept
  // clear of files when the files are laid out, so the text never covers one. If the screen is too tight for the full
  // width, the text column narrows a little before the files are made smaller.
  const { w, h, spots, rank, selCount, frame, pw, left, right } = useMemo(() => {
    let out: ReturnType<typeof layoutWork> & { pw: number; left: { x: number; y: number }; right: { x: number; y: number } };
    // [text width, height to keep clear]: the longest project text, measured, is 460px tall at 230px wide; narrower wraps taller.
    const room = H - 2 * (CONFIG.chrome - 24); // the height the details can use between the top bar and the bottom labels
    for (const [want, tall] of [[CONFIG.panel, 480], [205, 520], [180, 570]]) {
      const ph = Math.min(tall, room);
      const pw = Math.min(want, W - 32);
      const y = Math.max(CONFIG.chrome - 24, Math.min(H - ph - (CONFIG.chrome - 24), H / 2 - ph / 2));
      const left = { x: Math.max(16, W / 2 - dialR - 16 - pw), y };
      const right = { x: Math.min(W - pw - 16, W / 2 + dialR + 16), y };
      const reserve = [left, right].map((p) => ({ x0: p.x - 8, y0: p.y - 8, x1: p.x + pw + 8, y1: p.y + ph + 8 }));
      out = { ...layoutWork(shown, W, H, avoidR, shown.length * 7919 + filter.length, { mode: "free", reserve }), pw, left, right };
      if (out.w >= 50) break; // the files are still a good size
    }
    // A window too small for both the files and kept-clear text (a phone turned sideways, say): let the text share the
    // space with the files instead of squeezing them to nothing.
    if (out!.w < 40) out = { ...layoutWork(shown, W, H, avoidR, shown.length * 7919 + filter.length, { mode: "free" }), pw: out!.pw, left: out!.left, right: out!.right };
    return out!;
  }, [shown, W, H, avoidR, dialR, filter]);

  const k = open ? shown.findIndex((it) => it.slug === hover) : -1;
  const active = shown[k];
  // The details show in the fixed place on the same side of the dial as the hovered folder.
  let panel: React.CSSProperties | undefined;
  if (active) {
    const spot = spots[k].x + w / 2 < W / 2 ? left : right;
    panel = { left: spot.x, top: spot.y, width: pw };
  }

  return (
    <>
      {frame && (
        <SelectedWindow
          style={{
            width: frame.w,
            height: frame.h,
            transform: open ? `translate(${frame.x}px, ${frame.y}px)` : `translate(${W / 2 - frame.w / 2}px, ${H / 2 - frame.h / 2}px) scale(0.2)`,
            opacity: open ? 1 : 0,
          }}
          className="fixed left-0 top-0 z-[4]"
        />
      )}
      {/* Every project stays mounted. Those outside the filter shrink back into the dial; the rest glide to their new places. */}
      {items.map((it) => {
        const i = shown.indexOf(it);
        const live = open && i >= 0;
        const s = spots[i] ?? { x: 0, y: 0 };
        const on = live && it.slug === hover;
        const File = it.external ? "a" : Link;
        return (
          <File
            key={it.slug}
            href={it.href}
            tabIndex={live ? undefined : -1}
            aria-hidden={!live}
            inert={!live}
            onClick={(e) => {
              // No hover on touch screens: first tap shows the details, second tap opens.
              if (!on && matchMedia("(hover: none)").matches) {
                e.preventDefault();
                setHover(it.slug);
              }
            }}
            onMouseEnter={() => setHover(it.slug)}
            onMouseLeave={() => setHover((v) => (v === it.slug ? undefined : v))}
            onFocus={() => setHover(it.slug)}
            onBlur={() => setHover((v) => (v === it.slug ? undefined : v))}
            className={`fixed left-0 top-0 block outline-none transition-[transform,opacity] motion-reduce:[transition-property:opacity] duration-500 ease-[cubic-bezier(.2,1,.3,1)] animate-[file-in_0.9s_cubic-bezier(.2,1,.3,1)_backwards] ${
              on ? "z-30" : "z-[5]"
            }`}
            style={
              {
                width: w,
                // Closed: fly back into the dial and fade out.
                transform: live ? `translate(${s.x}px, ${s.y}px)` : `translate(${W / 2 - w / 2}px, ${H / 2 - h / 2}px) scale(0.2)`,
                opacity: live ? 1 : 0,
                pointerEvents: live ? undefined : "none",
                // One by one, quickly, both ways: out in arrival order, back in down the list.
                transitionDelay: live ? (reduce ? undefined : `${rank[i] * CONFIG.outStep}ms`) : `${items.indexOf(it) * 12}ms`,
                // The ring arrives first; the scattered folders follow 200ms after its last one. Reduced motion: all at once.
                animationDelay: `${reduce || i < 0 ? 0 : it.selected ? rank[i] * CONFIG.stagger : selCount * CONFIG.stagger + 200 + rank[i] * CONFIG.stagger}ms`,
                "--from-x": `${W / 2 - w / 2}px`,
                "--from-y": `${H / 2 - h / 2}px`,
              } as React.CSSProperties
            }
          >
            {/* The hover tilt lives on this inner layer, so the one-by-one delay above never slows it down. */}
            <span className="block transition-transform duration-500 ease-[cubic-bezier(.2,1,.3,1)]" style={{ transform: on ? `rotate(${CONFIG.hoverTilt}deg)` : undefined }}>
              <Folder it={it} on={on} style={{ height: w * CONFIG.aspect }} />
              {/* The whole name, wrapped onto up to three lines; it may reach a little past the folder's right edge. */}
              <span className="mt-1.5 line-clamp-3 block w-[calc(100%+12px)] break-words font-file text-[11px] leading-[1.25] font-medium">{it.name}</span>
            </span>
          </File>
        );
      })}

      {active && panel && (
        <Details key={active.slug} item={active} index={k} total={shown.length} style={panel} />
      )}
    </>
  );
}

/** Counts up the characters typed so far, from mount, at CONFIG.typeSpeed. Everything at once for reduced motion. */
function useTyped(total: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const next = instant ? total : Math.min(total, Math.floor(((now - start) / 1000) * CONFIG.typeSpeed));
      setN(next);
      if (next < total) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);
  return n;
}

/** Shows the part of `text` typed so far; the rest is laid out but invisible, so the card never changes size. */
function Typed({ text, from, n }: { text: string; from: number; n: number }) {
  const shown = Math.max(0, Math.min(text.length, n - from));
  const typing = shown > 0 && shown < text.length;
  return (
    <>
      {text.slice(0, shown)}
      {typing && <span className="ml-px inline-block h-[0.9em] w-[0.45em] translate-y-[0.1em] bg-current" />}
      <span className="invisible">{text.slice(shown)}</span>
    </>
  );
}

/** The hovered project's details, typed in straight on the page. A soft halo in the page colour keeps them readable over anything behind. */
function Details({ item, index, total, style }: { item: WorkItem; index: number; total: number; style: React.CSSProperties }) {
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
  const facts = item.facts.filter(([, v]) => v);
  const link = item.external ? "Open on Behance ↗" : "Open case study →";
  // Lay every string end to end, so each starts typing where the previous one finished.
  const parts = [counter, item.name, item.summary ?? "", ...facts.flat(), link];
  const starts = parts.map((_, i) => parts.slice(0, i).reduce((t, x) => t + x.length, 0));
  const n = useTyped(starts.at(-1)! + link.length);
  let i = 0;
  const at = () => starts[i++];

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed z-30 text-ink [text-shadow:0_0_2px_var(--color-bg),0_0_8px_var(--color-bg),0_0_14px_var(--color-bg)]"
      style={style}
    >
      <p className="text-[13px] tabular-nums opacity-60 font-medium">
        <Typed text={counter} from={at()} n={n} />
      </p>
      <h2 className="mt-1 font-display text-[38px] font-bold uppercase leading-[0.95] tracking-[-0.005em]">
        <Typed text={item.name} from={at()} n={n} />
      </h2>
      {(() => {
        const from = at();
        return item.summary ? (
          <p className="mt-2 text-[14px] leading-snug opacity-85 font-medium">
            <Typed text={item.summary} from={from} n={n} />
          </p>
        ) : null;
      })()}
      <dl className="mt-4 grid grid-cols-[64px_1fr] gap-x-3 gap-y-1.5 text-[13px] leading-snug font-medium">
        {facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-[11px] uppercase tracking-[0.08em] opacity-55 font-medium">
              <Typed text={label} from={at()} n={n} />
            </dt>
            <dd>
              <Typed text={value} from={at()} n={n} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[13px] underline underline-offset-4 font-medium">
        <Typed text={link} from={at()} n={n} />
      </p>
    </div>
  );
}
