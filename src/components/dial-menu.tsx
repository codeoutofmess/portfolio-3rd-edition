"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { notes } from "@/content/notes";
import { HomeChrome } from "@/components/home-chrome";
import type { Anchor } from "@/components/panel-window";
import type { WorkItem } from "@/components/work-scatter";
import { TypedTspans } from "@/components/typed-text";
import { useIntroPhase } from "@/lib/intro";
import { sound } from "@/lib/sound";
import { dialWidth, useMobile, useViewport } from "@/lib/use-mobile";
import type { Discipline } from "@/lib/work";

// Each view's code is fetched only when it is first needed (and warmed up in a quiet moment shortly after the page is
// ready), so the first screen carries just the dial and its chrome.
const load = {
  about: () => import("@/components/about-window").then((m) => m.AboutWindow),
  catchMe: () => import("@/components/catch-me").then((m) => m.CatchMe),
  contact: () => import("@/components/contact-window").then((m) => m.ContactWindow),
  notes: () => import("@/components/notes-scatter").then((m) => m.NotesScatter),
  note: () => import("@/components/note-window").then((m) => m.NoteWindow),
  work: () => import("@/components/work-scatter").then((m) => m.WorkScatter),
};
const AboutWindow = dynamic(load.about, { ssr: false });
const CatchMe = dynamic(load.catchMe, { ssr: false });
const ContactWindow = dynamic(load.contact, { ssr: false });
const NotesScatter = dynamic(load.notes, { ssr: false });
const NoteWindow = dynamic(load.note, { ssr: false });
const WorkScatter = dynamic(load.work, { ssr: false });

type Option = { id: string; label: string; angle: number; href?: string; filter?: Discipline };

// Angles in degrees, screen space: 0 = right, -90 = top. Main angles are where each
// dot starts its orbit; sub angles are offsets from wherever Work was when it opened.
const MAIN: Option[] = [
  { id: "work", label: "Work", angle: -90 }, // opens the work ring and scatters the projects
  { id: "contact", label: "Contact", angle: 0 }, // opens the mail window
  { id: "about", label: "About", angle: 90 }, // opens the about window
  { id: "archive", label: "Archive", angle: 180 }, // the projects that aren't selected work
];
const SUB: Option[] = [
  { id: "graphic", label: "Graphic", angle: -38, filter: "graphic" },
  { id: "ux", label: "UX", angle: 0, filter: "ux" },
  { id: "dev", label: "Dev", angle: 38, filter: "web" },
];

/** Tuning, in viewBox units (the dial is 1000 wide). */
const CONFIG = {
  r1: 170, // menu ring
  r1Phone: 205, // a wider menu ring on phones, so it's easier to see and tap (keep --ring in globals.css in step)
  labelPhone: 12.5, // label height on phones, in screen px whatever the dial's size
  r2: 320, // work ring
  dot: 9, // dot radius
  labelGap: 16, // dot edge to label baseline, clear of the hover ring
  orbit: 4, // degrees per second; outer ring turns the other way
  dead: 50, // knob must leave this radius before anything is hovered
  subZone: 245, // past this radius (with Work open) the outer ring is hovered
  mainSpread: 35, // degrees either side of a dot that count as hovering it
  subSpread: 18,
  folderExit: 650, // ms for the Work folders to fly into the dial before Contact or About opens
  dwell: 500, // ms of steady hover before it selects
  jitter: 40, // moving further than this restarts the dwell, so sweeping past is only a hover
  rubber: 0.18, // drag past the limit moves the knob this much
};

const rad = (deg: number) => (deg * Math.PI) / 180;
// Rounded so server and client trig agree (hydration).
const polar = (r: number, deg: number) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))].map((v) => Math.round(v * 100) / 100);
// The orbit angle grows without limit, so wrap with a true modulo (JS % goes negative and the hover test broke after a minute or so).
const angleGap = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);
const find = (id?: string) => [...MAIN, ...SUB].find((o) => o.id === id);

/** Circle paths for curved labels: clockwise from the bottom (upright on the top half)
 * and counter-clockwise from the top (upright on the bottom half). */
const ringPaths = (ring: string, r: number) => {
  const R = r + CONFIG.dot + CONFIG.labelGap;
  return [
    <path key="cw" id={`${ring}-cw`} d={`M0 ${R}A${R} ${R} 0 1 1 0 ${-R}A${R} ${R} 0 1 1 0 ${R}`} />,
    <path key="ccw" id={`${ring}-ccw`} d={`M0 ${-R}A${R} ${R} 0 1 0 0 ${R}A${R} ${R} 0 1 0 0 ${-R}`} />,
  ];
};
/** Which path a label rides at this angle, and where along it (percent). */
const labelAt = (ring: string, deg: number) => {
  const a = ((((deg + 180) % 360) + 360) % 360) - 180;
  const bottom = a > 0;
  const travel = bottom ? -90 - a : a - 90;
  return {
    href: `#${ring}-${bottom ? "ccw" : "cw"}`,
    offset: `${(((((travel % 360) + 360) % 360) / 3.6)).toFixed(2)}%`,
    // On the bottom path the glyphs hang outward from the baseline.
    baseline: bottom ? ("hanging" as const) : ("auto" as const),
  };
};

const VIEWS = ["work", "about", "contact", "archive"];

export function DialMenu({ items }: { items: WorkItem[] }) {
  const router = useRouter();
  const mobile = useMobile();
  const mobileRef = useRef(false);
  mobileRef.current = mobile;
  const { W, H } = useViewport();
  const r1 = mobile ? CONFIG.r1Phone : CONFIG.r1;
  const r1Ref = useRef(r1);
  r1Ref.current = r1;
  // Phone labels are sized in screen px: the dial's units shrink with the dial.
  const labelUnits = mobile && W ? (CONFIG.labelPhone * 1000) / dialWidth(W, H) : undefined;
  // While the opening loader plays, the real dial waits at its starting angle, so the hand-off from the loader's balls is seamless.
  const introRef = useRef(true);
  introRef.current = useIntroPhase() === "wait";
  const tap = useRef<{ id: string; t: number; x: number; y: number } | null>(null); // a press that started on a dot: a tap if it ends quickly and close by
  const lastLocal = useRef({ x: 0, y: 0 });
  // The address says which view is open (kept in step below), so Back from a project lands on the same view.
  const q = useSearchParams().get("view");
  const initialView = VIEWS.includes(q ?? "") ? q : null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState<string>();
  const [path, setPath] = useState<string[]>(initialView ? [initialView] : []); // e.g. ["work", "ux"]
  const [still, setStill] = useState(0); // bumps whenever the dwell restarts
  const anchor = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const onUpRef = useRef(() => {});
  const orbit = useRef({ main: 0, sub: 0, subBase: -90 });
  // The pointer over the dial holds it still.
  const held = useRef({ pointer: false });
  const nodes = useRef<Record<string, { g: SVGGElement | null; label: SVGTextElement | null; tp: SVGTextPathElement | null }>>({});
  const workOpen = path[0] === "work";
  const leaf = find(path.at(-1));
  // The windows and files read the screen size, so they only render in the browser (matters when a view is open from the start).
  const client = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [opened, setOpened] = useState(initialView === "work" || initialView === "archive"); // projects mount on first open, then stay loaded
  const [contactOpened, setContactOpened] = useState(initialView === "contact");
  const [aboutOpened, setAboutOpened] = useState(initialView === "about");
  const [wins, setWins] = useState<string[]>([]); // open text-file windows, back to front
  const [slots, setSlots] = useState<Record<string, number>>({}); // each window's cascade position
  const [selectedNote, setSelectedNote] = useState<string>();
  const [anchors, setAnchors] = useState<Record<string, Anchor>>({}); // where each file window opens from: the file clicked, plus a little chance
  const [panelDelay, setPanelDelay] = useState(0); // wait for the Work folders to clear before a window opens
  const [workFilter, setWorkFilter] = useState<Discipline | "all">("all"); // kept while Work animates out
  const filter = workFilter;
  const archiveOpen = path[0] === "archive";
  // Work holds the selected projects (narrowed by the ring); Archive holds the rest.
  const count = items.filter((it) => (archiveOpen ? !it.selected : it.selected && (filter === "all" || it.groups.includes(filter)))).length;

  /** Open a text file, or bring it to the front if it is already open. New windows take the first free cascade slot. */
  const focusNote = (id: string) => {
    if (!wins.includes(id)) {
      const used = new Set(wins.map((w) => slots[w]));
      setSlots((sl) => ({ ...sl, [id]: [0, 1, 2, 3].find((k) => !used.has(k)) ?? 0 }));
    }
    setWins((w) => [...w.filter((x) => x !== id), id]);
  };

  const angleOf = (o: Option) =>
    MAIN.includes(o) ? o.angle + orbit.current.main : orbit.current.subBase + o.angle + orbit.current.sub;

  // Orbit: written straight to the DOM each frame, React only renders the start positions. The dial keeps turning, but
  // holds still while the pointer is over it or it's being held, so the labels are easy to hit.
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let speed = introRef.current ? 0 : 1; // the opening loader holds the orbit still until it is done
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(now - last, 50) / 1000;
      last = now;
      const inUse = dragging.current || held.current.pointer;
      const target = reduce || introRef.current || inUse ? 0 : 1;
      speed += (target - speed) * (1 - Math.exp(-dt * 4));
      if (inUse) speed = 0; // in use: hold still at once
      if (target === 0 && speed < 0.002) speed = 0; // come to a true stop rather than creeping forever
      orbit.current.main += CONFIG.orbit * speed * dt;
      orbit.current.sub -= CONFIG.orbit * speed * dt;
      for (const o of [...MAIN, ...SUB]) {
        const n = nodes.current[o.id];
        if (!n?.g || !n.label || !n.tp) continue;
        const main = MAIN.includes(o);
        const a = angleOf(o);
        const [x, y] = polar(main ? r1Ref.current : CONFIG.r2, a);
        n.g.style.transform = `translate(${x}px, ${y}px)`;
        const l = labelAt(main ? "r1" : "r2", a);
        if (n.tp.getAttribute("href") !== l.href) {
          n.tp.setAttribute("href", l.href);
          n.label.setAttribute("dominant-baseline", l.baseline);
        }
        n.tp.setAttribute("startOffset", l.offset);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Whatever interrupts a drag (alt-tab, a dialog, the tab being hidden), let go of the dial.
  useEffect(() => {
    const stop = () => onUpRef.current();
    addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, []);

  // Once the page is ready and the browser has a quiet moment, fetch the other views' code so opening them is instant.
  useEffect(() => {
    const warm = () => Object.values(load).forEach((f) => void f());
    type Idle = { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    const w = window as unknown as Idle; // not every browser has it (Safari)
    const id = w.requestIdleCallback ? w.requestIdleCallback(warm, { timeout: 6000 }) : window.setTimeout(warm, 4000);
    addEventListener("pointerdown", warm, { once: true }); // or as soon as someone starts using the dial
    return () => {
      removeEventListener("pointerdown", warm);
      if (w.requestIdleCallback) w.cancelIdleCallback?.(id);
      else clearTimeout(id);
    };
  }, []);

  // Escape closes the file window on top.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && wins.length > 0 && setWins((w) => w.slice(0, -1));
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [wins.length]);

  // Keep the address in step with the open view, so Back and reload return to it.
  useEffect(() => {
    history.replaceState(null, "", path[0] ? `/?view=${path[0]}` : "/");
  }, [path]);

  /** Land on a dial item: from a held hover, or (on phones) straight from a tap. */
  function choose(id: string, tapped = false) {
    if (mobile) navigator.vibrate?.(10);
    sound.select();
    if (SUB.some((s) => s.id === id)) {
      // Tapping the filter that's already on switches it off again.
      const off = tapped && path.at(-1) === id;
      setWorkFilter(off ? "all" : (find(id)?.filter ?? "all"));
      return setPath(off ? ["work"] : ["work", id]);
    }
    if (id === "work") setWorkFilter("all");
    setPanelDelay(workOpen ? CONFIG.folderExit : 0);
    if (id === "contact") setContactOpened(true);
    if (id === "about") setAboutOpened(true);
    if (id !== "about") setWins([]);
    if (id === "archive") setOpened(true);
    if (id === "work") {
      // Open the outer ring centred on Work's current position.
      orbit.current.subBase = angleOf(MAIN[0]) - orbit.current.sub;
      setOpened(true);
    }
    setPath([id]);
    // Pages open as soon as they are selected: no need to let go first.
    const href = find(id)?.href;
    if (href) router.push(href);
  }
  const chooseRef = useRef(choose);
  chooseRef.current = choose;

  // Hover only becomes a selection after it has held still for CONFIG.dwell.
  useEffect(() => {
    if (!drag || !hover || path.at(-1) === hover) return;
    const t = setTimeout(() => {
      tap.current = null; // held long enough to be a selection, not a tap
      chooseRef.current(hover);
    }, CONFIG.dwell);
    return () => clearTimeout(t);
  }, [drag, hover, path, still]);

  const toLocal = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    const s = 1000 / r.width;
    return { x: (e.clientX - r.left - r.width / 2) * s, y: (e.clientY - r.top - r.height / 2) * s };
  };

  const nearest = (list: Option[], a: number, spread: number) =>
    list
      .map((o) => ({ o, gap: angleGap(a, angleOf(o)) }))
      .filter((m) => m.gap < spread)
      .sort((p, q) => p.gap - q.gap)[0]?.o.id;

  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    if (e.buttons === 0) return onUp(); // the release was missed (focus left the window, say): stop following the pointer
    const { x, y } = toLocal(e);
    lastLocal.current = { x, y };
    const d = Math.hypot(x, y);
    const a = (Math.atan2(y, x) * 180) / Math.PI;

    const limit = workOpen ? CONFIG.r2 : r1Ref.current - 16;
    const k = d > limit ? (limit + (d - limit) * CONFIG.rubber) / d : 1;
    setKnob({ x: x * k, y: y * k });

    let h: string | undefined;
    // Out on the Work ring only a Work item counts, unless the knob is pointed at a menu item instead.
    if (workOpen && d > CONFIG.subZone) h = nearest(SUB, a, CONFIG.subSpread) ?? nearest(MAIN, a, CONFIG.mainSpread);
    else if (d > CONFIG.dead) h = nearest(MAIN, a, CONFIG.mainSpread);
    if (h !== hover || Math.hypot(x - anchor.current.x, y - anchor.current.y) > CONFIG.jitter) {
      anchor.current = { x, y };
      setStill((n) => n + 1);
    }
    setHover(h);
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // a right-click would open the context menu and swallow the release, leaving the dial stuck
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    dragging.current = true;
    setDrag(true);
    tap.current = null;
    if (mobile) {
      // A press that lands on a dot (a 48px circle round it, more than the 44px minimum) is a tap candidate: if it ends quickly it goes straight there.
      const { x, y } = toLocal(e);
      const reach = 24 * (1000 / svgRef.current!.getBoundingClientRect().width); // 24px, in dial units
      let best: { id: string; d: number } | null = null;
      for (const o of [...MAIN, ...(workOpen ? SUB : [])]) {
        const [px, py] = polar(MAIN.includes(o) ? r1Ref.current : CONFIG.r2, angleOf(o));
        const d = Math.hypot(x - px, y - py);
        if (d <= reach && (!best || d < best.d)) best = { id: o.id, d };
      }
      if (best) tap.current = { id: best.id, t: performance.now(), x, y };
    }
    onMove(e); // grabbing anywhere inside the ring moves the knob straight to the pointer
  };

  // The selection stays highlighted after release; the knob just springs back to the centre.
  function onUp(commit = false) {
    if (!dragging.current) return;
    const t = tap.current;
    tap.current = null;
    if (commit && t && performance.now() - t.t < 450 && Math.hypot(lastLocal.current.x - t.x, lastLocal.current.y - t.y) < 40) chooseRef.current(t.id, true);
    dragging.current = false;
    setDrag(false);
    setHover(undefined);
    setKnob({ x: 0, y: 0 });
  }

  onUpRef.current = () => onUp();

  const status = leaf ?? find(hover);

  const node = (id: string) => (nodes.current[id] ??= { g: null, label: null, tp: null });

  const renderDot = (o: Option, ring: "r1" | "r2", startAngle: number, size: string) => {
    const on = path.includes(o.id);
    const lit = on || hover === o.id;
    const [x, y] = polar(ring === "r1" ? r1 : CONFIG.r2, startAngle);
    const l = labelAt(ring, startAngle);
    return (
      <g key={o.id}>
        <g ref={(g) => void (node(o.id).g = g)} transform={`translate(${x} ${y})`}>
          <circle
            r={CONFIG.dot}
            className={`fill-ink origin-center transition-transform duration-300 [transform-box:fill-box] ${lit ? "scale-[1.35]" : ""}`}
          />
          {lit && (
            <circle
              key={on ? "on" : `${hover}-${still}`}
              r={CONFIG.dot + 9}
              pathLength={1}
              strokeDasharray="1"
              transform="rotate(-90)"
              className={`fill-none stroke-ink ${on ? "" : "animate-[dial-dwell_0.5s_linear_forwards] [stroke-dashoffset:1]"}`}
              strokeWidth={1.5}
            />
          )}
        </g>
        <text
          ref={(t) => void (node(o.id).label = t)}
          textAnchor="middle"
          dominantBaseline={l.baseline}
          className={`fill-ink font-medium uppercase tracking-[0.2em] ${size}`}
          style={labelUnits ? { fontSize: labelUnits } : undefined}
        >
          <textPath ref={(t) => void (node(o.id).tp = t)} href={l.href} startOffset={l.offset}>
            <TypedTspans text={o.label} delay={MAIN.includes(o) ? 130 * MAIN.indexOf(o) : 550} />
          </textPath>
        </text>
      </g>
    );
  };

  return (
    <main className="flex min-h-svh items-center justify-center overflow-hidden max-md:min-h-dvh">
      {/* Keyboard and screen-reader route to the same places. */}
      {/* Shown as its own solid bar over the top icons while it has focus, so nothing sits under it. */}
      <nav
        aria-label="Main menu"
        className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:inset-x-0 focus-within:top-0 focus-within:z-[70] focus-within:flex focus-within:flex-wrap focus-within:gap-1 focus-within:border-b focus-within:border-line focus-within:bg-bg focus-within:px-4 focus-within:py-4 focus-within:text-[15px] focus-within:font-medium"
      >
        {MAIN.map((o) =>
          o.href ? (
            <Link key={o.id} href={o.href} className="rounded-md px-3 py-2 hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-ink">
              {o.label}
            </Link>
          ) : (
            <button
              key={o.id}
              type="button"
              aria-current={path[0] === o.id ? "page" : undefined}
              onClick={() => chooseRef.current(o.id)}
              className="rounded-md px-3 py-2 hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-ink aria-[current=page]:underline aria-[current=page]:underline-offset-4"
            >
              {o.label}
            </button>
          ),
        )}
      </nav>

      <svg
        ref={svgRef}
        viewBox="-500 -500 1000 1000"
        aria-hidden
        className="pointer-events-none relative z-[40] w-[var(--dial)] select-none touch-none"
      >
        <defs>
          {ringPaths("r1", r1)}
          {ringPaths("r2", CONFIG.r2)}
        </defs>
        {/* No drawn ring: the four dots are enough to read as a circle round the knob. */}
        {MAIN.map((m) => renderDot(m, "r1", m.angle, "text-[15px] max-sm:text-[24px]"))}

        {/* Work ring: appears once Work is selected */}
        <g
          className={`origin-center transition-[transform,opacity] duration-500 ease-[cubic-bezier(.2,1.4,.4,1)] ${
            workOpen ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
          }`}
        >
          {SUB.map((s) => renderDot(s, "r2", -90 + s.angle, "text-[14px] max-sm:text-[22px]"))}
        </g>

        {/* Status in the middle while dragging */}
        <g className={`transition-opacity duration-200 ${drag && status ? "opacity-100" : "opacity-0"}`}>
          <text y={mobile ? -8 : -4} textAnchor="middle" className={`text-[26px] max-sm:text-[40px] font-medium ${leaf ? "fill-ink" : "fill-ink-dim"}`}>
            {path.map((id) => find(id)!.label).join(" / ") || status?.label}
          </text>
          <text y={mobile ? 34 : 24} textAnchor="middle" className="fill-ink-dim text-[17px] max-sm:text-[28px]">
            {leaf ? (leaf.href ? "opening" : workOpen || archiveOpen ? `${count} projects` : leaf.id === "contact" ? "write a message" : "about me") : "hold to select"}
          </text>
        </g>

        {/* Needle while dragging */}
        {drag && <line x2={knob.x} y2={knob.y} className="stroke-ink" strokeWidth={1.5} />}

        {/* Grab anywhere inside the menu ring */}
        <circle
          data-dial-grab
          r={mobile ? (workOpen ? CONFIG.r2 + 40 : r1 + 30) : r1}
          className={`pointer-events-auto fill-transparent ${drag ? "cursor-grabbing" : "cursor-grab"}`}
          onPointerDown={onDown}
          onPointerEnter={() => (held.current.pointer = true)}
          onPointerLeave={() => (held.current.pointer = false)}
          onPointerMove={onMove}
          onPointerUp={() => onUp(true)}
          onPointerCancel={() => onUp()}
          onLostPointerCapture={() => onUp()}
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Knob */}
        <g
          style={{
            transform: `translate(${knob.x}px, ${knob.y}px)`,
            transition: drag ? "none" : "transform 0.6s cubic-bezier(.3,1.7,.5,1)",
          }}
          className="pointer-events-none"
        >
          <circle r={13} className="fill-ink" />
        </g>
        <text
          y={58}
          textAnchor="middle"
          className={`pointer-events-none fill-ink-dim text-[18px] max-sm:text-[34px] transition-opacity ${drag || path.length ? "opacity-0" : "opacity-100"}`}
        >
          <TypedTspans text={mobile ? "tap or drag" : "hold and drag"} delay={1150} />
        </text>
      </svg>

      <HomeChrome headline={!mobile || !path.length} />
      {client && <CatchMe />}
      {client && aboutOpened && (
        <>
          <NotesScatter
            notes={notes}
            open={path[0] === "about"}
            delay={panelDelay}
            selectedId={selectedNote}
            openIds={wins}
            onSelect={setSelectedNote}
            onOpen={(id, from) => {
              if (!wins.includes(id)) {
                sound.select(); // only when a window actually opens, not when one is brought forward
                setAnchors((a) => ({ ...a, [id]: { x: from.left, y: from.top, w: from.width, h: from.height, r1: Math.random(), r2: Math.random() } }));
              }
              setSelectedNote(id);
              focusNote(id);
            }}
          />
          <AboutWindow
            open={path[0] === "about"}
            delay={panelDelay}
            onClose={() => {
              setPath([]);
              setWins([]);
            }}
          />
          {notes.map((n) => (
            <NoteWindow
              key={n.id}
              note={n}
              open={path[0] === "about" && wins.includes(n.id)}
              slot={slots[n.id] ?? 0}
              z={21 + wins.indexOf(n.id)}
              anchor={anchors[n.id]}
              onFocus={() => focusNote(n.id)}
              onClose={() => setWins((w) => w.filter((x) => x !== n.id))}
            />
          ))}
        </>
      )}
      {client && contactOpened && <ContactWindow open={path[0] === "contact"} delay={panelDelay} onClose={() => setPath([])} />}
      {client && opened && <WorkScatter items={items} filter={filter} view={archiveOpen ? "archive" : "work"} open={workOpen || archiveOpen} />}
    </main>
  );
}
