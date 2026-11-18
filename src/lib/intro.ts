import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Where the opening animation has got to, so the page's own text can type itself in once the loader is done.
 * wait: the loader is still playing, so text is hidden. typing: the loader has finished its count; text types in.
 * done: no intro this visit (or it has finished), so text is simply there.
 */
type Phase = "wait" | "typing" | "done";

let phase: Phase | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function decide(): Phase {
  const seen = document.documentElement.dataset.seen; // set before first paint when this visit already had its intro
  return seen || matchMedia("(prefers-reduced-motion: reduce)").matches ? "done" : "wait";
}
const get = (): Phase => (phase ??= decide());

/** The loader calls this when its counter has gone: the page's text starts typing. */
export function startTyping() {
  if (get() === "wait") {
    phase = "typing";
    emit();
  }
}

export function useIntroPhase(): Phase {
  return useSyncExternalStore(
    (cb) => (subs.add(cb), () => void subs.delete(cb)),
    get,
    () => "done", // the server renders everything; the loader sits on top of it
  );
}

const SPEED = 70; // characters a second

/** How many characters of `text` to show: none while the loader plays, then typed in at 45 a second after `delay` ms. */
export function useIntroText(text: string, delay = 0) {
  const phase = useIntroPhase();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (phase !== "typing") return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.max(0, Math.floor(((now - t0 - delay) / 1000) * SPEED));
      setN(Math.min(text.length, k));
      if (k < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, text, delay]);
  return phase === "done" ? text.length : phase === "wait" ? 0 : n;
}
