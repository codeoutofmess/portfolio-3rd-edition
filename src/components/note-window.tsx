"use client";

import { useEffect, useRef, useState } from "react";
import { PanelWindow, useReveal, type Anchor } from "@/components/panel-window";
import type { Note } from "@/content/notes";
import { useMobile } from "@/lib/use-mobile";

/**
 * A picture file's window content: the picture centred, as big as fits, never stretched or cropped, with its own
 * transparent corners and a soft shadow so it sits like a real card on the surface. It loads only once the window has
 * opened, and fades in with a slight scale-up (just a fade for reduced motion). On a phone it can be pinched to zoom.
 */
function ImageView({ image, open }: { image: NonNullable<Note["image"]>; open: boolean }) {
  const shown = useReveal(open);
  const mobile = useMobile();
  const [seen, setSeen] = useState(false);
  if (open && !seen) setSeen(true); // from now on the picture stays loaded

  const card = seen && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      alt={image.alt}
      width={image.w}
      height={image.h}
      decoding="async"
      draggable={false}
      className="card-lift block h-auto max-h-[64svh] w-full select-none object-contain max-md:max-h-[calc(50svh_-_0.27*var(--dial)_-_132px)]"
    />
  );
  return (
    <div className="grid min-h-0 flex-1 place-items-center overflow-hidden px-5 pb-9 pt-6 max-md:px-2 max-md:pb-2 max-md:pt-2">
      <div
        className={`w-full transition-[opacity,transform] duration-500 ease-out motion-reduce:scale-100 ${shown ? "scale-100 opacity-100" : "scale-[0.96] opacity-0"}`}
        style={{ transitionDelay: shown ? "120ms" : "0ms" }}
      >
        {mobile ? <PinchZoom open={open}>{card}</PinchZoom> : card}
      </div>
    </div>
  );
}

/** A video file's window content: the video as big as fits, playing on a loop (it has no sound) once the window opens. */
function VideoView({ video, open }: { video: NonNullable<Note["video"]>; open: boolean }) {
  const shown = useReveal(open);
  const ref = useRef<HTMLVideoElement>(null);
  const [seen, setSeen] = useState(false);
  if (open && !seen) setSeen(true); // only starts loading once someone opens it
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (open) v.play().catch(() => {}); // a browser that blocks autoplay still shows the play button
    else v.pause();
  }, [open, seen]);
  return (
    <div className="grid min-h-0 flex-1 place-items-center overflow-hidden px-5 pb-6 pt-4 max-md:px-2 max-md:pb-2 max-md:pt-2">
      <div
        className={`h-full min-h-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:scale-100 ${shown ? "scale-100 opacity-100" : "scale-[0.96] opacity-0"}`}
        style={{ transitionDelay: shown ? "120ms" : "0ms" }}
      >
        {seen && (
          <video
            ref={ref}
            src={video.src}
            poster={video.poster}
            aria-label={video.label}
            controls
            muted
            loop
            playsInline
            preload="metadata"
            className="card-lift block h-[64svh] max-h-full w-auto max-w-full rounded-[3px] bg-black object-contain max-md:h-[56svh]"
            style={{ aspectRatio: "9 / 16" }}
          />
        )}
      </div>
    </div>
  );
}

/** Two fingers pinch it bigger (up to 4 times) and one finger moves it around once it's zoomed; a double tap zooms in or back out. */
function PinchZoom({ open, children }: { open: boolean; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const view = useRef({ s: 1, x: 0, y: 0 });
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ s: number; x: number; y: number; mid: { x: number; y: number }; dist: number; cx: number; cy: number } | null>(null);
  const lastTap = useRef(0);

  const apply = () => {
    const el = box.current;
    if (!el) return;
    const { s, x, y } = view.current;
    el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  };
  const clamp = (s: number, x: number, y: number) => {
    const el = box.current!;
    const lx = (el.offsetWidth * (s - 1)) / 2;
    const ly = (el.offsetHeight * (s - 1)) / 2;
    return { s, x: Math.max(-lx, Math.min(lx, x)), y: Math.max(-ly, Math.min(ly, y)) };
  };
  useEffect(() => {
    if (!open) {
      view.current = { s: 1, x: 0, y: 0 };
      apply();
    }
  }, [open]);

  const begin = () => {
    const [a, b] = [...pts.current.values()];
    const r = box.current!.getBoundingClientRect();
    start.current = {
      ...view.current,
      mid: b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a,
      dist: b ? Math.hypot(a.x - b.x, a.y - b.y) : 0,
      // where the picture's centre sits on screen when it isn't moved or zoomed
      cx: r.left + r.width / 2 - view.current.x,
      cy: r.top + r.height / 2 - view.current.y,
    };
  };
  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    begin();
    if (pts.current.size === 1) {
      const now = performance.now();
      if (now - lastTap.current < 300) {
        view.current = view.current.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2, x: 0, y: 0 };
        apply();
      }
      lastTap.current = now;
    }
  };
  const move = (e: React.PointerEvent) => {
    const g = start.current;
    if (!pts.current.has(e.pointerId) || !g) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const [a, b] = [...pts.current.values()];
    if (!b && g.s === 1) return; // one finger only moves it once it is zoomed in
    const mid = b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a;
    const s = b ? Math.min(4, Math.max(1, g.s * (Math.hypot(a.x - b.x, a.y - b.y) / g.dist))) : g.s;
    // Keep the spot under the fingers' midpoint where it was, then follow the fingers.
    const px = (g.mid.x - g.cx - g.x) / g.s;
    const py = (g.mid.y - g.cy - g.y) / g.s;
    view.current = clamp(s, mid.x - g.cx - s * px, mid.y - g.cy - s * py);
    apply();
  };
  const up = (e: React.PointerEvent) => {
    pts.current.delete(e.pointerId);
    if (pts.current.size) begin();
    if (view.current.s < 1.02) view.current = { s: 1, x: 0, y: 0 };
    apply();
  };

  return (
    <div className="touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div ref={box} className="origin-center will-change-transform">
        {children}
      </div>
    </div>
  );
}

/** One of the scattered files, opened. Several can be open at once, cascading over the About window so the files stay clickable. */
export function NoteWindow({ note, open, slot, z, anchor, onClose, onFocus }: { note: Note; open: boolean; slot: number; z: number; anchor?: Anchor; onClose: () => void; onFocus: () => void }) {
  return (
    <PanelWindow open={open} slot={slot} z={z} anchor={anchor} modal onFocus={onFocus} onClose={onClose} title={note.file} label={`${note.file}`} mono>
      {note.image ? (
        <ImageView image={note.image} open={open} />
      ) : note.video ? (
        <VideoView video={note.video} open={open} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 text-[13px] leading-[1.6] font-medium">
          <p className="font-bold">{note.heading}</p>
          {note.meta && <p className="text-ink-dim">{note.meta}</p>}
          <ul className="mt-4 space-y-3 text-ink-soft">
            {note.lines.map((l) => {
              // "Label   value" lines (skills.txt) become two columns, since the text isn't monospaced.
              const cols = !note.bullets && l.match(/^(\S.*?)\s{2,}(.*)$/);
              return cols ? (
                <li key={l} className="grid grid-cols-[112px_1fr] gap-3">
                  <span className="text-ink-dim">{cols[1]}</span>
                  <span>{cols[2]}</span>
                </li>
              ) : (
                <li key={l} className={note.bullets ? "pl-4 -indent-4" : ""}>
                  {note.bullets ? `> ${l}` : l}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </PanelWindow>
  );
}
