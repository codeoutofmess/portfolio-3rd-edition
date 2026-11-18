import { useSyncExternalStore } from "react";

// One soft pebble click (public/sounds/click.wav, from Mixkit's free sound effects). Used sparingly: one click when
// something on screen actually changes (a dial choice lands, a file opens), never for hovering or plain clicks.
// Off unless the visitor has turned it on (and then remembered; browsers only start audio after the first click or key press).
let on = false;
let ctx: AudioContext | undefined;
let click: AudioBuffer | undefined;
let lastAt = 0;
const listeners = new Set<() => void>();

try {
  on = localStorage.getItem("sound") === "on"; // off unless the visitor has turned it on
} catch {}

async function load() {
  if (!ctx || click) return;
  try {
    const res = await fetch("/sounds/click.wav");
    click = await ctx.decodeAudioData(await res.arrayBuffer());
  } catch {} // no sound file or no decoder: stay silent
}

/** Plays the click. `rate` shifts its pitch, `vol` its level; sounds closer than 35 ms apart are dropped so quick movement can't rattle. */
function play(rate: number, vol: number) {
  if (on && !ctx) {
    // Sound was left on from an earlier visit: start the audio engine on the first interaction.
    try {
      ctx = new AudioContext();
      void load();
    } catch {}
  }
  if (!on || !ctx || !click) return;
  if (ctx.state === "suspended") void ctx.resume();
  const now = performance.now();
  if (now - lastAt < 35) return;
  lastAt = now;
  try {
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = click;
    src.playbackRate.value = rate;
    g.gain.value = vol;
    src.connect(g).connect(ctx.destination);
    src.start();
  } catch {} // sound is decoration: it must never break the menu
}

export const sound = {
  /** Call from a click: browsers only allow audio after a gesture. */
  set(next: boolean) {
    on = next;
    try {
      localStorage.setItem("sound", next ? "on" : "off");
    } catch {}
    if (next) {
      try {
        ctx ??= new AudioContext();
        void ctx.resume();
        void load().then(() => play(1, 0.32)); // confirms sound is on
      } catch {
        on = false; // no audio available here
      }
    }
    listeners.forEach((l) => l());
  },
  /** Something on screen changes because of a choice: a dial item lands, a file opens. */
  select: () => play(1, 0.32),
};

export function useSound() {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => void listeners.delete(cb)),
    () => on,
    () => false,
  );
}
