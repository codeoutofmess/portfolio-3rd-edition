"use client";

import { useEffect, useRef, useState } from "react";
import { sound } from "@/lib/sound";

/** Tuning, in CSS px and seconds. */
const CONFIG = {
  size: 54, // ball diameter
  gravity: 700, // px/s²: about 1.4s from top to bottom, time enough to catch it
  enter: 220, // downward speed as it comes in through the top of the screen
  throwMax: 1600, // fastest it can be flung on release
  throwUp: 300, // upward speed on release (px/s) that counts as a throw; a gentler let-go is just dropping it
  max: 8, // balls in play at once
  slop: 30, // px beyond the ball's edge that still counts as a catch
  lag: 0.09, // s: you aim at where the ball was a moment ago, so its recent path counts too
};

type Ball = { id: number; x: number; y: number; vx: number; vy: number; rot: number; vr: number; held: boolean; caught: boolean; thrown: boolean };

/**
 * A small game on the home page. Tapping empty space sends a "catch me" ball down from above the screen, through
 * a random point on the top edge; it falls right through the bottom unless you catch it. Press on it to catch it and it stays in your
 * hand, following the pointer. Let go and it falls again (flung if you were moving). It only counts as lost if it was never caught,
 * or if you threw it up and it came back down uncaught; simply letting go of it does not.
 */
export function CatchMe() {
  // What React draws: each ball's id and whether it's held. Live positions live in `balls` and go straight to the DOM.
  const [list, setList] = useState<{ id: number; held: boolean }[]>([]);
  const [score, setScore] = useState({ caught: 0, lost: 0 });
  const balls = useRef(new Map<number, Ball>());
  const els = useRef(new Map<number, HTMLButtonElement>());
  const nextId = useRef(1);
  const setHeld = (id: number, held: boolean) => setList((l) => l.map((b) => (b.id === id ? { ...b, held } : b)));

  // A tap on bare page (not the dial, a folder, a window or any control) sends a ball in from a random point along the top.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let down: { x: number; y: number; bare: boolean } | null = null;
    const bare = (t: EventTarget | null) => t instanceof Element && (t.matches("main") || t === document.body || t === document.documentElement);
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY, bare: e.button === 0 && bare(e.target) });
    const onUp = (e: PointerEvent) => {
      const d = down;
      down = null;
      if (!d?.bare || !bare(e.target) || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
      if (balls.current.size >= CONFIG.max) return;
      const id = nextId.current++;
      balls.current.set(id, {
        id,
        x: CONFIG.size / 2 + Math.random() * (innerWidth - CONFIG.size), // anywhere along the top, not where you tapped
        y: -CONFIG.size, // just above the top edge
        vx: (Math.random() * 2 - 1) * 90, // and a slight slant, so it isn't a straight drop
        vy: CONFIG.enter,
        rot: Math.random() * 360,
        vr: (Math.random() * 2 - 1) * 90,
        held: false,
        caught: false,
        thrown: false,
      });
      setList((l) => [...l, { id, held: false }]);
    };
    addEventListener("pointerdown", onDown);
    addEventListener("pointerup", onUp);
    return () => {
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", onUp);
    };
  }, []);

  // Physics, written straight to the DOM each frame, but only while there is a ball to move (otherwise nothing runs).
  const active = list.length > 0;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - last, 40) / 1000;
      last = now;
      const gone: Ball[] = []; // balls that have fallen through the floor
      for (const b of balls.current.values()) {
        if (!b.held) {
          b.vy += CONFIG.gravity * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vr * dt;
          if (b.x < CONFIG.size / 2 || b.x > innerWidth - CONFIG.size / 2) b.vx *= -0.6; // walls keep it on screen
          b.x = Math.min(innerWidth - CONFIG.size / 2, Math.max(CONFIG.size / 2, b.x));
          if (b.y - CONFIG.size / 2 > innerHeight) gone.push(b); // through the floor
        }
        const el = els.current.get(b.id);
        if (el) el.style.transform = `translate(${b.x - CONFIG.size / 2}px, ${b.y - CONFIG.size / 2}px) rotate(${b.rot}deg)`;
      }
      if (gone.length) {
        gone.forEach((b) => balls.current.delete(b.id));
        setList((l) => l.filter((b) => !gone.some((g) => g.id === b.id)));
        // Lost: one that was never caught, or one that was thrown up and not caught again. Just letting go of a ball isn't a loss.
        const lost = gone.filter((b) => !b.caught || b.thrown).length;
        if (lost) setScore((s) => ({ ...s, lost: s.lost + lost }));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  /** Catch: the ball sticks to the pointer until it's released, then falls with the hand's last speed. */
  function grab(el: HTMLButtonElement, e: PointerEvent, id: number) {
    const b = balls.current.get(id);
    if (!b) return;
    el.setPointerCapture(e.pointerId);
    b.held = true;
    b.caught = true;
    b.thrown = false; // caught it again
    b.vx = b.vy = b.vr = 0;
    setHeld(id, true);
    sound.select();
    setScore((s) => ({ ...s, caught: s.caught + 1 }));
    const off = { x: b.x - e.clientX, y: b.y - e.clientY };
    let track = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
    el.onpointermove = (m) => {
      b.x = m.clientX + off.x;
      b.y = m.clientY + off.y;
      track = [...track.slice(-4), { x: m.clientX, y: m.clientY, t: m.timeStamp }];
    };
    el.onpointerup = el.onpointercancel = () => {
      el.onpointermove = el.onpointerup = el.onpointercancel = null;
      const a = track[0];
      const z = track.at(-1)!;
      const dt = Math.max(0.016, (z.t - a.t) / 1000);
      const clamp = (v: number) => Math.max(-CONFIG.throwMax, Math.min(CONFIG.throwMax, v));
      b.vx = clamp((z.x - a.x) / dt);
      b.vy = clamp((z.y - a.y) / dt);
      b.vr = b.vx * 0.4;
      b.thrown = b.vy < -CONFIG.throwUp;
      b.held = false;
      setHeld(id, false);
    };
  }

  // Catching is forgiving: a press close to a ball, or where it just was, counts. Runs first (capture) so the dial and the page
  // underneath never see a press that caught something.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const reach = CONFIG.size / 2 + CONFIG.slop;
      let best: { b: Ball; d: number } | null = null;
      for (const b of balls.current.values()) {
        if (b.held) continue;
        const d = Math.min(Math.hypot(e.clientX - b.x, e.clientY - b.y), Math.hypot(e.clientX - (b.x - b.vx * CONFIG.lag), e.clientY - (b.y - b.vy * CONFIG.lag)));
        if (d <= reach && (!best || d < best.d)) best = { b, d };
      }
      const el = best && els.current.get(best.b.id);
      if (!best || !el) return;
      e.stopPropagation();
      e.preventDefault();
      grab(el, e, best.b.id);
    };
    addEventListener("pointerdown", onDown, true);
    return () => removeEventListener("pointerdown", onDown, true);
  });

  const played = score.caught + score.lost > 0;

  return (
    <>
      {list.map(({ id, held }) => (
        <button
          key={id}
          ref={(el) => void (el ? els.current.set(id, el) : els.current.delete(id))}
          type="button"
          data-hold
          aria-label="Catch me"
          className={`fixed left-0 top-0 z-[60] grid touch-none select-none place-items-center rounded-full bg-ink p-0 text-center font-display text-[11px] font-bold uppercase leading-[0.95] tracking-[0.04em] text-bg ${
            held ? "shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)]" : ""
          }`}
          style={{ width: CONFIG.size, height: CONFIG.size, transform: `translate(-100px, -100px)` }}
        >
          catch
          <br />
          me
        </button>
      ))}
      {played && (
        <p aria-live="polite" aria-label={`caught ${score.caught}, lost ${score.lost}`} className="pointer-events-none fixed inset-x-0 top-[52px] z-[16] text-center text-[12px] tabular-nums text-ink-soft font-medium">
          <ScoreLine caught={score.caught} lost={score.lost} />
        </p>
      )}
    </>
  );
}

const STEP = 22; // ms per character typed: about 45 a second
const Caret = () => <span className="ml-px inline-block h-[0.9em] w-[0.4em] translate-y-[0.1em] bg-current" />;
const instant = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The score. The first time it appears the whole line types out; after that only a number that changed is edited:
 * its old digits are deleted one by one, then the new ones typed, like someone fixing it by hand.
 */
function ScoreLine({ caught, lost }: { caught: number; lost: number }) {
  const [first] = useState({ caught, lost }); // the numbers the line first types out with
  const intro = `caught ${first.caught} · lost ${first.lost}`;
  const [n, setN] = useState(0);
  useEffect(() => {
    let i = 0;
    const timer = window.setInterval(() => {
      i = instant() ? intro.length : i + 1;
      setN(i);
      if (i >= intro.length) clearInterval(timer);
    }, STEP);
    return () => clearInterval(timer);
  }, [intro]);

  if (n < intro.length) {
    return (
      <span aria-hidden>
        {intro.slice(0, n)}
        <Caret />
        <span className="invisible">{intro.slice(n)}</span>
      </span>
    );
  }
  return (
    <span aria-hidden>
      caught <EditedNumber value={caught} from={first.caught} /> · lost <EditedNumber value={lost} from={first.lost} />
    </span>
  );
}

/**
 * A number that, when it changes, backspaces its old digits and types the new ones, at an unhurried pace. It keeps
 * the width of its widest digits and the caret floats over it, so the rest of the line never shifts.
 */
function EditedNumber({ value, from }: { value: number; from: number }) {
  const [shown, setShown] = useState(String(from));
  const live = useRef(String(from)); // what's on screen right now, for picking up mid-edit
  const target = String(value);
  useEffect(() => {
    if (live.current === target) return;
    const jump = instant();
    let paused = false;
    const timer = window.setInterval(() => {
      const cur = live.current;
      if (!jump && cur === "" && !paused) return void (paused = true); // a beat between deleting and typing
      const next = jump ? target : target.startsWith(cur) ? target.slice(0, cur.length + 1) : cur.slice(0, -1);
      live.current = next;
      setShown(next);
      if (next === target) clearInterval(timer);
    }, 130);
    return () => clearInterval(timer);
  }, [target]);
  const width = Math.max(target.length, String(from).length, shown.length);
  return (
    <span className="inline-block text-left" style={{ minWidth: `${width}ch` }}>
      {shown}
      {shown !== target && (
        <span className="relative inline-block w-0">
          <span className="absolute left-px top-[0.05em] inline-block h-[0.9em] w-[0.4em] bg-current" />
        </span>
      )}
    </span>
  );
}
