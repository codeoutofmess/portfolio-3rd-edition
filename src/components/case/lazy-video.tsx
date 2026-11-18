"use client";

import { useEffect, useRef } from "react";

/**
 * A silent looping screen recording that only loads and plays while it is on (or just about to be on) screen. Until then
 * only its small poster picture is downloaded, so a long case study doesn't pull every recording at once, and
 * recordings you have scrolled past stop playing and stop using the processor.
 */
export function LazyVideo({ src, poster, label, className }: { src: string; poster: string; label?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) void v.play().catch(() => {}); // loads the recording the first time
        else v.pause();
      },
      { rootMargin: "250px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} className={className} />;
}
