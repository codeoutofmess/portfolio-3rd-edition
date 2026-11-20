"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChessLive } from "@/components/chess-live";
import { TypedText } from "@/components/typed-text";
import { useIntroPhase } from "@/lib/intro";
import { sound, useSound } from "@/lib/sound";
import { site } from "@/lib/site";

const html = () => document.documentElement;

// Fullscreen, with the older WebKit names (Safari up to 16, iPad). iPhone Safari has no page fullscreen at all.
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitFullscreenEnabled?: boolean; webkitExitFullscreen?: () => Promise<void> };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };

function useFullscreen() {
  const isFull = useSyncExternalStore(
    (cb) => {
      document.addEventListener("fullscreenchange", cb);
      document.addEventListener("webkitfullscreenchange", cb);
      return () => {
        document.removeEventListener("fullscreenchange", cb);
        document.removeEventListener("webkitfullscreenchange", cb);
      };
    },
    () => !!((document as FsDoc).fullscreenElement ?? (document as FsDoc).webkitFullscreenElement),
    () => null,
  );
  const supported = useSyncExternalStore(
    () => () => {},
    () => !!(document.fullscreenEnabled || (document as FsDoc).webkitFullscreenEnabled),
    () => false,
  );
  const toggle = () => {
    const doc = document as FsDoc;
    const el = html() as FsEl;
    const run = isFull
      ? (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document)
      : (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
    run?.catch?.(() => {}); // the browser may refuse (e.g. not triggered by a click); nothing to do then
  };
  return { isFull, supported, toggle };
}

function useTheme() {
  return useSyncExternalStore(
    (cb) => {
      const mo = new MutationObserver(cb);
      mo.observe(html(), { attributes: true, attributeFilter: ["data-theme"] });
      return () => mo.disconnect();
    },
    () => html().dataset.theme ?? "light",
    () => null,
  );
}

const icon = "h-[18px] w-[18px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]";
const btn = "pointer-events-auto grid h-8 w-8 place-items-center text-ink-soft transition-colors hover:text-ink";

const Sun = (
  <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </svg>
);
const Moon = (
  <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
  </svg>
);
const SoundOn = (
  <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
const Expand = (
  <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
    <path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />
  </svg>
);
const Compress = (
  <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
    <path d="M20 10h-6V4M14 10l6.5-6.5M4 14h6v6M10 14l-6.5 6.5" />
  </svg>
);
const SoundOff = (
  <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4Z" />
    <path d="m16 9.5 5 5M21 9.5l-5 5" />
  </svg>
);

const SOCIALS = [
  {
    label: "Behance",
    tip: "Behance",
    href: site.socials.behance,
    icon: (
      <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
        <path d="M3 6h5.5a2.7 2.7 0 0 1 0 5.4H3ZM3 11.4h6a3 3 0 0 1 0 6H3ZM3 6v11.4" />
        <path d="M14.5 8.2h6M14.2 14.3h6.6a3.3 3.3 0 1 0-1 2.7" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    tip: "LinkedIn",
    href: site.socials.linkedin,
    icon: (
      <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
        <path d="M8 10.5V16M8 7.8v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1 1 2.1 2.6V16" />
      </svg>
    ),
  },
  {
    label: "GitHub",
    tip: "GitHub",
    href: site.socials.github,
    icon: (
      <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
        <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.2 6.5l-2.4 11" />
      </svg>
    ),
  },
  {
    label: "Email",
    tip: "Email me",
    href: `mailto:${site.email}`,
    icon: (
      <svg viewBox="0 0 24 24" className={icon} strokeWidth={1.6} aria-hidden>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },
];

/** Corner labels and icon buttons around the home dial. Sits under the project blur. */
/**
 * Small plain-text label under a top-bar button. It types itself out quickly when the button is hovered or focused
 * and vanishes when you leave. Edge buttons anchor it inward so it never runs off screen.
 */
function Tip({ text, align = "center" }: { text: string; align?: "left" | "center" | "right" }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    let timer = 0;
    const show = () => {
      clearInterval(timer);
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(text.length);
      let i = 0;
      timer = window.setInterval(() => {
        setN(++i);
        if (i >= text.length) clearInterval(timer);
      }, 22); // about 45 characters a second
    };
    const hide = () => {
      clearInterval(timer);
      setN(0);
    };
    host.addEventListener("pointerenter", show);
    host.addEventListener("pointerleave", hide);
    host.addEventListener("focus", show);
    host.addEventListener("blur", hide);
    return () => {
      clearInterval(timer);
      host.removeEventListener("pointerenter", show);
      host.removeEventListener("pointerleave", hide);
      host.removeEventListener("focus", show);
      host.removeEventListener("blur", hide);
    };
  }, [text]);

  const pos = align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2";
  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute top-full mt-1.5 whitespace-nowrap text-[12px] font-medium leading-none tracking-normal text-ink ${pos}`}
    >
      {text.slice(0, n)}
      {n > 0 && n < text.length && <span className="ml-px inline-block h-[0.9em] w-[0.4em] translate-y-[0.1em] bg-current" />}
      {/* the untyped rest holds the width, so right-aligned labels type from a fixed left edge */}
      <span className="invisible">{text.slice(n)}</span>
    </span>
  );
}

/**
 * The top bar: social icons, my name (refreshes the site) and the sound, theme and full screen toggles.
 * The same on every page. On pages that scroll, a soft fade in the page colour keeps it readable over content.
 */
export function TopBar({ fade = false }: { fade?: boolean }) {
  const theme = useTheme();
  const soundOn = useSound();
  const fs = useFullscreen();
  const intro = useIntroPhase(); // the icons fade in once the loader has gone
  const iconFade = `transition-opacity duration-500 delay-[500ms] ${intro === "wait" ? "opacity-0" : "opacity-100"}`;

  const setTheme = (t: "light" | "dark") => {
    html().dataset.theme = t;
    try {
      localStorage.setItem("theme", t);
    } catch {}
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[15] h-24 text-[13px] sm:h-16 leading-snug font-medium">
      {fade && <div aria-hidden className="absolute inset-x-0 top-0 h-[118px] sm:h-[88px] bg-[linear-gradient(to_bottom,var(--color-bg)_62%,transparent)]" />}
      <h1 className="absolute inset-x-0 top-14 text-center text-[19px] sm:top-4 sm:text-[22px] font-medium leading-8 tracking-tighter">
        {/* The name refreshes the site: a full reload, fresh on the home dial with nothing open. */}
        <button type="button" aria-label={`${site.name}: refresh the site`} onClick={() => location.assign("/")} className="group pointer-events-auto relative">
          <TypedText text={site.name} delay={350} />
          <sup className="align-top text-[0.4em]">®</sup>
          <Tip text="Refresh" />
        </button>
      </h1>

      <div className={`absolute left-5 top-4 flex gap-2 ${iconFade}`}>
        {SOCIALS.map((s) => (
          <a
            key={s.label}
            href={s.href}
            aria-label={s.label}
            className={`group relative ${btn}`}
          >
            {s.icon}
            <Tip text={s.tip} align="left" />
          </a>
        ))}
      </div>

      <div className={`absolute right-5 top-4 flex gap-2 ${iconFade}`}>
        <button
          type="button"
          className={`group relative ${btn}`}
          aria-label={soundOn ? "Turn sound off (quiet mode)" : "Turn sound on"}
          aria-pressed={soundOn}
          onClick={() => sound.set(!soundOn)}
        >
          {soundOn ? SoundOn : SoundOff}
          <Tip text={soundOn ? "Mute" : "Turn sound on"} align="right" />
        </button>
        <button
          type="button"
          className={`group relative ${btn}`}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? Sun : Moon}
          <Tip text={theme === "dark" ? "Light mode" : "Dark mode"} align="right" />
        </button>
        {fs.supported && (
          <button
            type="button"
            className={`group relative ${btn}`}
            aria-label={fs.isFull ? "Exit full screen" : "Enter full screen"}
            aria-pressed={!!fs.isFull}
            onClick={fs.toggle}
          >
            {fs.isFull ? Compress : Expand}
            <Tip text={fs.isFull ? "Exit full screen" : "Full screen"} align="right" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Live Wellington date and time, bottom left (desktop only), set like instrument readout. Client-only so the server render never disagrees with it. */
function WellingtonTime() {
  const intro = useIntroPhase();
  const [r, setR] = useState<{ zone: string; line: string } | null>(null);
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-NZ", {
      timeZone: "Pacific/Auckland",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset",
    });
    const tick = () => {
      const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
      setR({
        zone: (p.timeZoneName ?? "").replace("GMT", "UTC"),
        line: `${p.weekday} ${p.day} ${p.month} ${p.year} · ${p.hour}:${p.minute}:${p.second}`.toUpperCase(),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className={`absolute bottom-4 left-5 hidden font-file text-[11px] uppercase leading-[1.5] tracking-[0.08em] tabular-nums transition-opacity duration-500 delay-[800ms] sm:block ${intro === "wait" ? "opacity-0" : "opacity-100"} font-medium`}>
      {r && (
        <>
          <span className="text-ink-dim">Wellington NZ · 41.29°S 174.78°E · {r.zone}</span>
          <br />
          {r.line}
        </>
      )}
    </p>
  );
}

/** The pulsing dot and "Available to work", when I am. */
export function Available({ className = "" }: { className?: string }) {
  if (!site.availableToWork) return null;
  return (
    <p className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-ink opacity-50 motion-reduce:hidden" />
        <span className="relative h-2 w-2 rounded-full bg-ink" />
      </span>
      <TypedText text="Available to work" delay={950} />
    </p>
  );
}

/** Home page chrome: the top bar plus the edition and availability labels along the bottom, and my live chess game
 * while I'm playing (on the landing view only). */
export function HomeChrome({ landing = false }: { landing?: boolean }) {
  return (
    <>
      <TopBar />
      <div className="pointer-events-none fixed inset-0 z-[15] text-[13px] leading-snug font-medium">
      <div className="absolute inset-x-0 bottom-11 text-center sm:bottom-16 lg:bottom-4">
        <p className="text-[18px] font-normal"><TypedText text={`Portfolio — ${site.edition.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())}`} delay={550} /></p>
        <p className="mt-1.5 font-file text-ink-soft"><TypedText text="Designer / Developer" delay={750} /></p>
      </div>

      <WellingtonTime />

      <Available className="absolute inset-x-0 bottom-4 sm:inset-x-auto sm:right-5" />

      </div>

      <ChessLive show={landing} />
    </>
  );
}
