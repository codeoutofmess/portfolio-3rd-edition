"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Note } from "@/content/notes";
import { FileSlider, type Slide } from "@/components/file-slider";
import { ImageTile, PageArt, VideoTile } from "@/components/page-art";
import { dialWidth, useMobile } from "@/lib/use-mobile";
import { grid, type KeepOut } from "@/components/work-scatter";

/** Where each group's cluster centres, as a fraction of the screen. Experience top left, the rest below it. */
const ANCHOR = { experience: [0.17, 0.31], about: [0.25, 0.74] } as const;
const PHONE_ANCHOR = { experience: [0.28, 0.24], about: [0.76, 0.24] } as const;


/** Offsets from the cluster's centre, in file widths (x) and file heights (y). Wide and uneven on purpose. */
const CLUSTER = {
  experience: [
    [-1.55, -0.7],
    [0.5, -1.15],
    [-0.75, 0.95],
    [1.25, 0.75],
    [2.85, -0.35],
  ],
  about: [
    [-1.95, -0.45],
    [0.25, 0.85],
    [2.3, -0.5],
  ],
} as const;

/** Prompt that types out just under the mouse while a file is hovered, and follows it. Text only, inverted like the ball cursor. */
function CursorTip({ text, x, y }: { text: string; x: number; y: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const move = (e: PointerEvent) => ref.current && (ref.current.style.transform = `translate(${e.clientX + 12}px, ${e.clientY + 24}px)`);
    addEventListener("pointermove", move);
    let i = 0;
    const t = setInterval(() => {
      setN(++i);
      if (i >= text.length) clearInterval(t);
    }, 22);
    return () => {
      removeEventListener("pointermove", move);
      clearInterval(t);
    };
  }, [text]);
  return (
    <span ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] whitespace-nowrap font-file text-[12px] text-white mix-blend-difference font-medium" style={{ transform: `translate(${x + 12}px, ${y + 24}px)` }}>
      {text.slice(0, n)}
    </span>
  );
}

type Props = {
  notes: Note[];
  open: boolean;
  /** ms to wait before flying in, e.g. while the Work folders fly out. */
  delay?: number;
  selectedId?: string;
  openIds: string[];
  onSelect: (id: string) => void;
  onOpen: (id: string, from: DOMRect) => void;
};

/** The About files: scattered round the dial on a wide screen, a row you scroll sideways on a phone. */
export function NotesScatter(props: Props) {
  const mobile = useMobile();
  return mobile ? <NotesSlider {...props} /> : <NotesDesktop {...props} />;
}

/** A phone: one row, the picture and video files first, one tap opens a file. */
function NotesSlider({ notes, open, selectedId, openIds, onSelect, onOpen }: Props) {
  const ordered = [...notes.filter((n) => n.image || n.video), ...notes.filter((n) => !n.image && !n.video)];
  const slides: Slide[] = ordered.map((n) => ({
    key: n.id,
    label: n.file,
    selected: open && selectedId === n.id,
    onClick: (e) => (onSelect(n.id), onOpen(n.id, e.currentTarget.getBoundingClientRect())),
    render: (w) =>
      n.image ? (
        <span className="flex items-center justify-center" style={{ width: w, height: w * 0.78 }}>
          <ImageTile src={n.image.thumb} w={w} strong={openIds.includes(n.id)} />
        </span>
      ) : n.video ? (
        <span className="mx-auto flex items-center justify-center" style={{ width: w * 0.66, height: w * 0.78 }}>
          <VideoTile src={n.video.thumb} h={w * 0.78} strong={openIds.includes(n.id)} />
        </span>
      ) : (
        <span className="relative mx-auto block" style={{ width: w * 0.66, height: w * 0.78 }}>
          <PageArt strong={openIds.includes(n.id)} label="txt" />
        </span>
      ),
  }));
  return <FileSlider slides={slides} open={open} />;
}

/**
 * Text files round the dial, like the Work folders, but in two tight clusters: the experience files
 * together, the skills, hobbies and ID files together. One click or tap opens a file.
 */
function NotesDesktop({ notes, open, delay = 0, selectedId, openIds, onSelect, onOpen }: Props) {
  const [size, setSize] = useState(() => ({ W: innerWidth, H: innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ W: innerWidth, H: innerHeight });
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);

  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [hoverId, setHoverId] = useState<string>(); // the same hover as the Work folders: the file tips and tilts
  const { W, H } = size;
  const dial = dialWidth(W, H) * 0.27; // menu ring plus labels
  // The About window sits right of the dial (below it on narrow screens): keep files out of its way.
  const beside = W / 2 - dial - 40 - 24 >= 340;

  const { w, h, spots } = useMemo(() => {
    const keepOut: KeepOut[] = beside
      ? [{ x0: W / 2 + dial + 28, y0: 0, x1: W, y1: H }]
      : [{ x0: 0, y0: H / 2 + dial + 8, x1: W, y1: H }];
    let w = W < 600 ? 58 : 84;
    let g = grid(w, W, H, dial, keepOut);
    while (g.cells.length < notes.length) g = grid((w *= 0.97), W, H, dial, keepOut);

    // Each group is a loose, hand-placed cluster around its anchor: offsets in file widths and heights, so the files
    // break the grid. The experience files sit tight together; skills and hobbies are spread a little wider. If a
    // cluster runs into the dial, the About window or the screen edge, the whole cluster slides away from it.
    const spots: Record<string, { x: number; y: number }> = {};
    const fh = g.h;
    // The clusters spread out as far as the screen allows: full width on a big screen, tighter on a small one.
    const spread = Math.min(1, Math.max(0.55, Math.min(W / 1500, H / 900)));
    const top = 72;
    const bottom = beside ? H - 72 : H / 2 + dial; // below the dial is the About window on narrow screens
    const right = beside ? W / 2 + dial + 20 : W - 16;
    for (const group of ["experience", "about"] as const) {
      const mine = notes.filter((n) => n.group === group && !n.image);
      const offs = CLUSTER[group];
      // Phones have only a strip above the dial, so the two clusters sit side by side there.
      const [ax, ay] = W < 600 ? PHONE_ANCHOR[group] : ANCHOR[group];
      let cx = ax * W;
      let cy = ay * H;
      const place = () => mine.map((_, i) => ({ x: cx + offs[i][0] * spread * w - w / 2, y: cy + offs[i][1] * spread * fh - fh / 2 }));
      for (let tries = 0; tries < 200; tries++) {
        const ps = place();
        const x0 = Math.min(...ps.map((q) => q.x));
        const x1 = Math.max(...ps.map((q) => q.x + w));
        const y0 = Math.min(...ps.map((q) => q.y));
        const y1 = Math.max(...ps.map((q) => q.y + fh));
        const sx = x0 < 16 ? 16 - x0 : x1 > right ? right - x1 : 0;
        const sy = y0 < top ? top - y0 : y1 > bottom ? bottom - y1 : 0;
        cx += sx;
        cy += sy;
        let moved = sx !== 0 || sy !== 0;
        // Off the dial: nudge the cluster straight away from the screen centre.
        const hit = ps.some((q) => Math.hypot(Math.max(q.x, Math.min(W / 2, q.x + w)) - W / 2, Math.max(q.y, Math.min(H / 2, q.y + fh)) - H / 2) < dial + 16);
        if (hit) {
          const dx = cx - W / 2;
          const dy = cy - H / 2;
          const d = Math.hypot(dx, dy) || 1;
          cx += (dx / d) * 8;
          cy += (dy / d) * 8;
          moved = true;
        }
        if (!moved) break;
      }
      place().forEach((q, i) => (spots[mine[i].id] = q));
    }
    // ID.png starts midway between the two clusters; the step below makes room round it.
    const middle = (group: string) => {
      const ps = notes.filter((n) => n.group === group && !n.image).map((n) => spots[n.id]);
      return [ps.reduce((t, p) => t + p.x, 0) / ps.length, ps.reduce((t, p) => t + p.y, 0) / ps.length];
    };
    const [ex, ey] = middle("experience");
    const [bx, by] = middle("about");
    for (const n of notes) if (n.image) spots[n.id] = { x: (ex + bx) / 2, y: (ey + by) / 2 };
    // Names are shown whole, so a file takes up as much room as its name. Wherever two files (or two names) would touch,
    // nudge them apart, then keep them clear of the screen edge and the dial. This is what lets a small window still fit them all.
    // ID.png asks for 20px more on each side, so it stands a little apart.
    const loose = notes.map((n) => ({ id: n.id, bw: n.image ? w + 40 : Math.max(w, n.file.length * 6.8 + 8), x: spots[n.id].x + w / 2, y: spots[n.id].y + fh / 2 }));
    for (let iter = 0; iter < 120; iter++) {
      let moved = false;
      for (let i = 0; i < loose.length; i++) {
        for (let j = i + 1; j < loose.length; j++) {
          const a = loose[i];
          const b = loose[j];
          const dx = b.x - a.x || 0.1;
          const dy = b.y - a.y || 0.1;
          const ox = (a.bw + b.bw) / 2 + 10 - Math.abs(dx);
          const oy = fh + 6 - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            moved = true;
            if (ox < oy) {
              const k = (ox / 2) * Math.sign(dx);
              a.x -= k;
              b.x += k;
            } else {
              const k = (oy / 2) * Math.sign(dy);
              a.y -= k;
              b.y += k;
            }
          }
        }
      }
      for (const f of loose) {
        f.x = Math.min(right - f.bw / 2, Math.max(16 + f.bw / 2, f.x));
        f.y = Math.min(bottom - fh / 2, Math.max(top + fh / 2, f.y));
        const nx = Math.max(f.x - f.bw / 2, Math.min(W / 2, f.x + f.bw / 2));
        const ny = Math.max(f.y - fh / 2, Math.min(H / 2, f.y + fh / 2));
        const d = Math.hypot(nx - W / 2, ny - H / 2);
        if (d < dial + 16) {
          const vx = f.x - W / 2;
          const vy = f.y - H / 2;
          const vd = Math.hypot(vx, vy) || 1;
          f.x += (vx / vd) * (dial + 16 - d + 1);
          f.y += (vy / vd) * (dial + 16 - d + 1);
          moved = true;
        }
      }
      if (!moved) break;
    }
    loose.forEach((f) => (spots[f.id] = { x: f.x - w / 2, y: f.y - fh / 2 }));
    // Small tablets: there is only a short strip above the dial, so the files sit in one tidy grid, five across, in the order they are listed.
    if (W < 900) {
      const cols = 5;
      const pitch = (W - 24) / cols;
      const ww = Math.min(w, pitch - 6);
      const hh = ww * 0.78 + 22;
      const phone: Record<string, { x: number; y: number }> = {};
      notes.forEach((n, i) => (phone[n.id] = { x: 12 + (i % cols) * pitch + (pitch - ww) / 2, y: top + 14 + Math.floor(i / cols) * (hh + 12) }));
      return { w: ww, h: hh, spots: phone };
    }
    return { w, h: g.h, spots };
  }, [notes, W, H, dial, beside]);

  return (
    <>
      {notes.map((n, i) => {
        const s = spots[n.id];
        const selected = open && selectedId === n.id;
        const isOpen = open && openIds.includes(n.id);
        const on = open && hoverId === n.id;
        return (
          <button
            key={n.id}
            type="button"
            tabIndex={open ? undefined : -1}
            aria-hidden={!open}
            inert={!open}
            aria-label={`${n.file}: click to open`}
            onPointerEnter={(e) => e.pointerType === "mouse" && setTip({ text: n.hint, x: e.clientX, y: e.clientY })}
            onPointerLeave={() => setTip(null)}
            onMouseEnter={() => setHoverId(n.id)}
            onMouseLeave={() => setHoverId((v) => (v === n.id ? undefined : v))}
            onFocus={() => setHoverId(n.id)}
            onBlur={() => setHoverId((v) => (v === n.id ? undefined : v))}
            onClick={(e) => (onSelect(n.id), onOpen(n.id, e.currentTarget.getBoundingClientRect()))} // one click or tap opens a file
            onKeyDown={(e) => e.key === "Enter" && onOpen(n.id, e.currentTarget.getBoundingClientRect())}
            className="group fixed left-0 top-0 z-[5] block touch-manipulation select-none text-left outline-none transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,1,.3,1)] animate-[file-in_0.9s_cubic-bezier(.2,1,.3,1)_backwards]"
            style={
              {
                width: w,
                transform: open ? `translate(${s.x}px, ${s.y}px)` : `translate(${W / 2 - w / 2}px, ${H / 2 - h / 2}px) scale(0.2)`,
                opacity: open ? 1 : 0,
                pointerEvents: open ? undefined : "none",
                // One by one, quickly, both ways.
                transitionDelay: open ? `${delay + i * 20}ms` : `${i * 12}ms`,
                animationDelay: `${delay + i * 40}ms`,
                "--from-x": `${W / 2 - w / 2}px`,
                "--from-y": `${H / 2 - h / 2}px`,
              } as React.CSSProperties
            }
          >
            {/* The hover tilt lives on this inner layer, so the one-by-one delay above never slows it down. */}
            <span className="block transition-transform duration-500 ease-[cubic-bezier(.2,1,.3,1)]" style={{ transform: on ? "rotate(-4deg)" : undefined }}>
            {/* A small page with a folded corner and a few lines of text, or for a picture, the picture itself in a frame (as macOS shows it) */}
            <span
              className={`relative mx-auto flex origin-bottom items-center justify-center transition-transform duration-300 ${on ? "[transform:perspective(260px)_rotateX(-14deg)]" : ""}`}
              style={{ width: n.image ? w : w * 0.66, height: w * 0.78 }}
            >
              {n.image ? (
                <ImageTile src={n.image.thumb} w={w} strong={selected || isOpen} />
              ) : n.video ? (
                <VideoTile src={n.video.thumb} h={w * 0.78} strong={selected || isOpen} />
              ) : (
                <PageArt strong={selected || isOpen} label="txt" />
              )}
            </span>
            {/* The whole name, centred under the file, however long it is */}
            <span
              className={`relative left-1/2 mt-1.5 block w-max -translate-x-1/2 whitespace-nowrap px-1 text-center font-file text-[11px] ${selected ? "bg-ink text-bg" : isOpen ? "underline underline-offset-2" : ""} font-medium`}
            >
              {n.file}
            </span>
            </span>
          </button>
        );
      })}
      {open && tip && <CursorTip key={tip.text} text={tip.text} x={tip.x} y={tip.y} />}
    </>
  );
}
