import { useSyncExternalStore } from "react";

/** Phones: anything under 768px wide. Always false on the server and during hydration, then true/false from the real screen. */
const QUERY = "(max-width: 767.98px)";

export function useMobile() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia(QUERY).matches,
    () => false,
  );
}

/** The dial's width: a little smaller on phones, so the row of files above it has room. Keep in step with --dial in globals.css. */
export const dialWidth = (W: number, H: number) => Math.min(W * (W < 768 ? 0.82 : 0.94), H * 0.72, 600);

/** The window's width and height, kept up to date. 0 x 0 on the server. */
export function useViewport() {
  const size = useSyncExternalStore(
    (cb) => {
      addEventListener("resize", cb);
      return () => removeEventListener("resize", cb);
    },
    () => `${innerWidth}x${innerHeight}`,
    () => "0x0",
  );
  const [W, H] = size.split("x").map(Number);
  return { W, H };
}

/** The visitor's "reduce motion" setting. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}
