"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PageArt } from "@/components/page-art";
import { startTyping } from "@/lib/intro";

const BG = "#0e0e0d"; // the dark page colour; the loader is always dark, white ball on dark
const INK = "#f1f1ee";

/** One real file from the site: a project folder with its cover, or one of the About text files. */
export type LoaderFile = { kind: "folder"; name: string; cover?: string } | { kind: "page"; name: string };

const rad = (d: number) => (d * Math.PI) / 180;
// Rounded so the server and the browser agree on the numbers.
const at = (r: number, deg: number) => [Math.round(r * Math.cos(rad(deg)) * 100) / 100, Math.round(r * Math.sin(rad(deg)) * 100) / 100];

/**
 * Where each file comes from: a random direction, far enough out to be off the screen on any shape of window, and a
 * random moment to set off. A small seeded generator keeps the numbers identical on the server and in the browser.
 */
function arrivals(n: number) {
  let seed = 11;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return Array.from({ length: n }, () => {
    const a = rand() * Math.PI * 2;
    // Scaled so the larger of the two offsets is 70 to 95 (vw or vh): always a good way past the edge, even on the diagonals.
    const far = (70 + rand() * 25) / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    return {
      x: Math.round(Math.cos(a) * far * 10) / 10,
      y: Math.round(Math.sin(a) * far * 10) / 10,
      go: Math.round((1.0 + rand() * 0.9) * 100) / 100,
    };
  });
}

function File({ f }: { f: LoaderFile }) {
  if (f.kind === "page")
    return (
      <>
        <span className="relative mx-auto block" style={{ width: "66%", height: "78%" }}>
          <PageArt strong={false} />
        </span>
        <span className="mt-1.5 block truncate text-center font-file text-[12px] font-medium">{f.name}</span>
      </>
    );
  return (
    <>
      <span className="relative block" style={{ height: "78%" }}>
        <span className="absolute left-0 top-0 h-[16%] w-[40%] rounded-t-[6px] bg-[var(--folder-back)]" />
        <span className="absolute inset-x-0 bottom-0 top-[9%] rounded-[6px] bg-[var(--folder-back)]" />
        <span className="absolute inset-x-0 bottom-0 top-[22%] overflow-hidden rounded-[6px] bg-[var(--folder-front)] ring-1 ring-ink/15">
          {/* Small optimised copies, fetched lazily: nothing is downloaded for visitors who skip the intro */}
          {f.cover && <Image src={f.cover} alt="" fill sizes="72px" className="object-cover object-top" />}
        </span>
      </span>
      <span className="mt-1.5 block truncate text-center font-file text-[12px] font-medium">{f.name}</span>
    </>
  );
}

/**
 * The opening animation, once per visit (per browser tab) or whenever the address has ?intro. It starts as one white
 * ball, the menu dial's knob, alone. Four more balls shoot out of it and circle, with no ring showing. Only then do
 * the site's real files (every project folder and About's text files) come in from beyond the screen, from all sides,
 * and melt away as they reach the middle, the way folders do when you switch between Work and Archive. A large counter holds at 0, then climbs to 100 on a curve that speeds up and eases off
 * for the last tenth; the balls turn on that same curve. At 100 the menu ring draws itself, from the top ball right round
 * back to it. Then the overlay fades and the page's own text types itself in (see lib/intro). All the movement is CSS, so it plays from the first paint; React only reads the counter
 * and removes the overlay.
 */
export function Loader({ files }: { files: LoaderFile[] }) {
  const [gone, setGone] = useState(false);
  const [n, setN] = useState(0);
  const plan = arrivals(files.length);

  useEffect(() => {
    if (document.documentElement.dataset.seen) {
      // Already shown this visit (the page hid it before first paint); drop it from the page.
      const t = setTimeout(() => setGone(true));
      return () => clearTimeout(t);
    }
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The counter follows a hidden clock animation (its opacity is the progress, 0 to 1), so it agrees with the orbiting
    // balls, which run on the very same curve, however late the page hydrates.
    const clock = document.querySelector(".intro-clock");
    let raf = 0;
    const tick = () => {
      const t = clock ? Number(getComputedStyle(clock).opacity) : 1;
      setN(Math.round(t * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(reduce ? () => setN(100) : tick);

    const stage = document.querySelector(".intro-root");
    const finish = () => {
      try {
        sessionStorage.setItem("intro-seen", "1");
      } catch {}
      startTyping();
      setGone(true);
    };
    const onEnd = (e: Event) => {
      const name = (e as AnimationEvent).animationName;
      if (name === "intro-away" || name === "intro-fadeout") finish();
    };
    // The overlay starts to fade: the page's own text starts to type in beneath it.
    const onStart = (e: Event) => (e as AnimationEvent).animationName === "intro-away" && startTyping();
    stage?.addEventListener("animationend", onEnd);
    stage?.addEventListener("animationstart", onStart);
    // Hydration can finish after the whole show has played, and a browser might never report the end: don't wait forever.
    const late = setTimeout(() => stage?.getAnimations().every((a) => a.playState === "finished") && finish());
    const backup = setTimeout(finish, 8000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(late);
      clearTimeout(backup);
      stage?.removeEventListener("animationend", onEnd);
      stage?.removeEventListener("animationstart", onStart);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className="intro-root fixed inset-0 z-[300] overflow-hidden"
      // Always dark: the page's tokens, set to their dark values for everything inside, so the real files look as they do there.
      style={{ background: BG, color: INK, ["--color-ink" as string]: INK, ["--color-bg" as string]: BG, ["--folder-back" as string]: "#3b3b38", ["--folder-front" as string]: "#4d4d49" }}
    >
      {/* The site's real files, coming in from off screen */}
      {files.map((f, i) => {
        const p = plan[i];
        const w = f.kind === "page" ? "84px" : "68px"; // the same width as on the site: Work folders 68px, About text files 84px
        return (
          <span
            key={i}
            aria-hidden
            className="intro-piece absolute left-1/2 top-1/2 block"
            style={
              {
                width: w,
                height: `calc(${w} * 0.78 + 24px)`,
                marginLeft: `calc(${w} / -2)`,
                marginTop: `calc(${w} * -0.39)`,
                "--x": `${p.x}vw`,
                "--y": `${p.y}vh`,
                "--go": `${p.go}s`,
              } as React.CSSProperties
            }
          >
            <File f={f} />
          </span>
        );
      })}

      {/* The dial: the same size and place as the real one, so the hand-off is seamless */}
      <svg viewBox="-500 -500 1000 1000" aria-hidden className="absolute left-1/2 top-1/2 w-[var(--dial)] -translate-x-1/2 -translate-y-1/2">
        {/* four balls shoot out of the centre and then circle the ring */}
        <g className="intro-orbit" style={{ transform: "scale(var(--ring))" }}>
          {[-90, 0, 90, 180].map((a, i) => {
            const [x, y] = at(170, a);
            return <circle key={a} cx={x} cy={y} r={9} fill={INK} className="intro-shot" style={{ "--bx": `${x}px`, "--by": `${y}px`, animationDelay: `${0.5 + i * 0.055}s` } as React.CSSProperties} />;
          })}
        </g>
        {/* the single white ball the whole thing grows from: the dial's knob */}
        <circle r={13} fill={INK} className="intro-knob" />
      </svg>

      <p className="intro-count absolute bottom-[3vh] left-[3.5vw] font-display text-[clamp(110px,25vw,380px)] font-semibold leading-[0.78] tabular-nums tracking-[-0.02em]">
        {String(n).padStart(3, "0")}
      </p>
      <i aria-hidden className="intro-clock absolute h-0 w-0" />
    </div>
  );
}
