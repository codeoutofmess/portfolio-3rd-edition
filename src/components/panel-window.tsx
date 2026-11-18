"use client";

import { useEffect, useRef, useState } from "react";
import { dialWidth } from "@/lib/use-mobile";

/** `open`, but only from the frame after mounting, so a window that mounts open still animates in. */
export function useReveal(open: boolean) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return open && ready;
}

const MIN = { w: 320, h: 240 };

/**
 * Where a window opens from: the file that was clicked (its screen box) and two random numbers between 0 and 1 for the
 * small differences that stop every window opening in exactly the same spot.
 */
export type Anchor = { x: number; y: number; w: number; h: number; r1: number; r2: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** On a wide screen: beside the file, a little off to one side and up or down, kept on screen. */
function nearFile(a: Anchor, W: number, H: number) {
  const width = Math.min(500, W - 48);
  const guess = Math.min(380, H - 160); // roughly how tall it will be, for keeping it on screen
  let left = a.x + a.w + 18 + a.r1 * 36;
  if (left + width > W - 24) left = a.x - 18 - width - a.r1 * 36; // no room to the right: open to its left
  left = clamp(left, 24, W - width - 24);
  const top = clamp(a.y + a.h / 2 - guess / 2 + (a.r2 - 0.5) * 80, 72, H - guess - 56);
  return { left, top, width, maxHeight: H - top - 56 };
}

/** Screen size and where the windows go: beside the dial when there's room, otherwise below it. */
export function usePanelLayout() {
  const [size, setSize] = useState(() => ({ W: innerWidth, H: innerHeight }));
  useEffect(() => {
    const onResize = () => setSize({ W: innerWidth, H: innerHeight });
    addEventListener("resize", onResize);
    return () => removeEventListener("resize", onResize);
  }, []);
  const { W, H } = size;
  // Same dial size as in dial-menu; the menu ring plus its labels reach about 27% of it.
  const dial = dialWidth(W, H) * 0.27;
  const beside = W / 2 - dial - 40 - 24 >= 340;
  const gap = W / 2 + dial + 40; // distance from the screen edge to the window's inner edge
  return { W, H, dial, beside, gap };
}

// The three window buttons wear the macOS colours: red closes, yellow minimises, green expands. The little sign shows on hover.
const dotBase = "group grid h-3 w-3 place-items-center rounded-full text-black/60 transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:brightness-110";
const dotRed = `${dotBase} bg-[#ff5f57]`;
const dotYellow = `${dotBase} bg-[#febc2e]`;
const dotGreen = `${dotBase} bg-[#28c840]`;
const glyph = "h-2 w-2 fill-none stroke-current opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [stroke-linecap:round]";

/**
 * Window frame for Contact, About and the note files. Sits beside the dial (below it on narrow screens), scales in and out, and has three dots: close, minimise to the title bar, and expand to fill the screen.
 * The title bar drags it anywhere on screen. On wide screens the bottom-left corner can be dragged to resize. It sits under the dial so the menu stays usable.
 */
export function PanelWindow({
  open,
  delay = 0,
  slot,
  z = 20,
  onFocus,
  anchor,
  modal = false,
  tall = false,
  perch,
  below = 0,
  maxWidth,
  onClose,
  title,
  label,
  mono = false,
  children,
}: {
  open: boolean;
  /** ms to wait before opening, e.g. while the Work folders fly out. */
  delay?: number;
  /** Cascade position (0, 1, 2...) when several windows are open at once: each sits a little lower and further in. */
  slot?: number;
  /** Stacking order among windows; the dial always stays above them. */
  z?: number;
  onFocus?: () => void;
  /** Open near the file this came from, instead of in the default spot. On a phone it just opens centrally with a small random drift. */
  anchor?: Anchor;
  /** Where the window can't sit beside the dial: pop up in the middle of the screen over everything (dimming it), with a large close cross. */
  modal?: boolean;
  /** On a phone: stretch down to the bottom edge of the screen. */
  tall?: boolean;
  /** Sits on top of the title bar, outside the frame (the dancer). Shown only at normal size beside the dial. */
  perch?: React.ReactNode;
  /** Room to keep free under the window (beside the dial), e.g. for the pass card: the window then sits at the top. */
  below?: number;
  /** Widest the centred pop-up gets, so it doesn't stretch across a tablet or laptop. */
  maxWidth?: number;
  onClose: () => void;
  title: string;
  label: string;
  /** Plain text-file look. */
  mono?: boolean;
  children: React.ReactNode;
}) {
  const shown = useReveal(open);
  const ref = useRef<HTMLDivElement>(null);
  const { W, H, dial, beside, gap } = usePanelLayout();
  const [minimised, setMinimised] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [moved, setMoved] = useState({ x: 0, y: 0 }); // how far the window has been dragged from its default spot
  const [wasOpen, setWasOpen] = useState(open);

  // Each time it opens afresh it starts at normal size.
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      setMinimised(false);
      setExpanded(false);
      setDims(null);
      // On a phone (or any screen where windows sit below the dial) the window stays central, with a small random drift.
      setMoved(anchor && !beside ? { x: (anchor.r1 - 0.5) * 24, y: (anchor.r2 - 0.5) * 28 - 4 } : { x: 0, y: 0 });
    }
  }


  const inset = slot === undefined ? 0 : 40 + slot * 20;
  const down = slot === undefined ? 0 : 20 + slot * 28;
  let box: React.CSSProperties;
  if (expanded) box = { left: 24, right: 24, top: 72, bottom: 72 };
  else if (anchor && beside) box = { ...nearFile(anchor, W, H), ...(dims ? { width: dims.w, height: minimised ? undefined : dims.h, maxHeight: undefined } : {}), translate: `${moved.x}px ${moved.y}px` };
  else if (!beside && modal) box = { left: 16, right: 16, top: "50%", maxHeight: H * 0.74, maxWidth, marginInline: "auto", translate: `${moved.x}px calc(-50% + ${moved.y}px)` };
  else if (!beside) box = { left: 16, right: 16, top: H / 2 + dial + 16, bottom: minimised ? undefined : tall ? 10 : 56, translate: `${moved.x}px ${moved.y}px` };
  else if (dims) box = { right: 24, width: dims.w, height: minimised ? undefined : dims.h, top: "50%", translate: `${moved.x}px calc(-50% + ${down + moved.y}px)` };
  else if (below) box = { left: gap + inset, right: 24, top: 72 + down, maxHeight: H - 72 - below - down, translate: `${moved.x}px ${moved.y}px` };
  else box = { left: gap + inset, right: 24, top: "50%", maxHeight: H - (perch ? 260 : 200) - down, translate: `${moved.x}px calc(-50% + ${down + moved.y}px)` };

  /** Drag the window by its title bar. It can go anywhere, but at least part of the bar stays on screen. */
  function startMove(e: React.PointerEvent<HTMLDivElement>) {
    if (expanded || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    const r = ref.current!.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, mx: moved.x, my: moved.y };
    const bar = e.currentTarget;
    bar.setPointerCapture(e.pointerId);
    bar.onpointermove = (m) => {
      const dx = Math.min(W - 96 - r.left, Math.max(96 - r.right, m.clientX - start.x));
      const dy = Math.min(H - 44 - r.top, Math.max(-r.top, m.clientY - start.y));
      setMoved({ x: start.mx + dx, y: start.my + dy });
    };
    bar.onpointerup = bar.onpointercancel = () => {
      bar.onpointermove = null;
      bar.onpointerup = null;
      bar.onpointercancel = null;
    };
  }

  function startResize(e: React.PointerEvent<HTMLButtonElement>) {
    const r = ref.current!.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    handle.onpointermove = (m) =>
      setDims({
        w: Math.min(W - 48, Math.max(MIN.w, start.w - (m.clientX - start.x))),
        h: Math.min(H - 120, Math.max(MIN.h, start.h + (m.clientY - start.y))),
      });
    handle.onpointerup = () => {
      handle.onpointermove = null;
      handle.onpointerup = null;
    };
  }

  const popup = modal && !beside; // a phone: pops up in the middle, over the dial, with the screen dimmed behind it
  return (
    <>
      {popup && (
        <div
          aria-hidden
          onClick={onClose}
          className={`fixed inset-0 z-[55] bg-black/55 transition-opacity duration-300 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
      )}
    <section
      ref={ref}
      aria-label={label}
      aria-hidden={!open}
      inert={!open}
      className={`fixed flex flex-col transition-[opacity,transform,filter] duration-500 ease-[cubic-bezier(.2,1,.3,1)] ${
        shown ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0 blur-[2px]"
      }`}
      onPointerDown={onFocus}
      style={{ ...box, zIndex: popup ? 60 + z : z, transformOrigin: beside ? "left center" : popup ? "center center" : "center top", transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {!expanded && perch}
      <div
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-line bg-bg shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)] ${mono ? "font-file" : ""}`}
      >
        <div
          className={`flex shrink-0 touch-none items-center gap-2 border-b border-line px-4 py-2.5 ${expanded ? "" : "cursor-grab active:cursor-grabbing"}`}
          onPointerDown={startMove}
          onDoubleClick={() => setMinimised((m) => !m)}
        >
          <span className="flex gap-1.5">
            <button type="button" aria-label={`Close ${title}`} title="Close" className={dotRed} onClick={onClose}>
              <svg viewBox="0 0 8 8" className={`${glyph}`} strokeWidth={1.3}>
                <path d="m1.5 1.5 5 5M6.5 1.5l-5 5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={minimised ? "Restore" : "Minimise"}
              title={minimised ? "Restore" : "Minimise"}
              className={`${dotYellow} ${popup ? "hidden" : ""}`}
              onClick={() => setMinimised((m) => !m)}
            >
              <svg viewBox="0 0 8 8" className={glyph} strokeWidth={1.3}>
                <path d="M1.5 4h5" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={expanded ? "Shrink" : "Expand"}
              title={expanded ? "Shrink" : "Expand"}
              className={`${dotGreen} ${popup ? "hidden" : ""}`}
              onClick={() => {
                setExpanded((x) => !x);
                setMinimised(false);
              }}
            >
              <svg viewBox="0 0 8 8" className={glyph} strokeWidth={1.3}>
                <path d="M4 1.5v5M1.5 4h5" />
              </svg>
            </button>
          </span>
          <span className="flex-1 select-none text-center text-[13px] text-ink-soft font-medium">{title}</span>
          {popup ? (
            <button type="button" aria-label={`Close ${title}`} onClick={onClose} className="-my-2 -mr-3 grid h-11 w-11 place-items-center text-ink">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current [stroke-linecap:round]" strokeWidth={1.6} aria-hidden>
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          ) : (
            <span className="w-[42px]" />
          )}
        </div>

        {/* Minimising folds the body away to leave just the title bar */}
        <div
          className={`grid min-h-0 transition-[grid-template-rows] duration-300 ease-out ${minimised ? "grid-rows-[0fr]" : "flex-1 grid-rows-[1fr]"}`}
        >
          <div className="flex min-h-0 flex-col overflow-hidden">{children}</div>
        </div>

        {beside && !expanded && !minimised && (
          <button
            type="button"
            aria-label="Resize window"
            title="Drag to resize"
            onPointerDown={startResize}
            className="absolute bottom-0 left-0 h-4 w-4 cursor-nesw-resize touch-none text-ink-dim"
          >
            <svg viewBox="0 0 16 16" className="h-full w-full fill-none stroke-current" strokeWidth={1}>
              <path d="M1 7 9 15M1 11l4 4" />
            </svg>
          </button>
        )}
      </div>
    </section>
    </>
  );
}
