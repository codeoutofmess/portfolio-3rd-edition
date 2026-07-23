"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BracketPanel } from "./bracket-panel";

export interface HudCardItem {
  label: string;
  href: string;
  logo?: string;
  fallback: string;
  summary: string;
  tags: string[];
}

interface HudCardMenuProps {
  items: HudCardItem[];
  backHref?: string;
}

const VISIBLE = 3;
const CARD_PX = 144; // h-36/w-36
const GAP_PX = 16; // gap-4

/**
 * A 3-card viewport onto the project list, sliding to reveal more as you
 * move past the edges — so the card size and description panel stay
 * identical no matter how many projects exist. A detail panel below the
 * row shows the highlighted project's description and tags in a
 * fixed-height area (no reflow between short and long copy), and left/right
 * chevrons make it obvious there's more to see.
 */
export function HudCardMenu({ items, backHref }: HudCardMenuProps) {
  const [index, setIndex] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const router = useRouter();
  const active = items[index];

  // windowStart is derived from index, but updated in the same event as
  // index (not via a reactive effect) so scrolling the 3-card viewport
  // stays a single, atomic state change per interaction.
  function selectIndex(next: number) {
    const clamped = Math.max(0, Math.min(next, items.length - 1));
    setIndex(clamped);
    setWindowStart((prev) => {
      if (clamped < prev) return clamped;
      if (clamped > prev + VISIBLE - 1) return clamped - VISIBLE + 1;
      return prev;
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        selectIndex(index + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        selectIndex(index - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        router.push(items[index].href);
      } else if (e.key === "Escape" && backHref) {
        e.preventDefault();
        router.push(backHref);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items, router, backHref]);

  const canGoLeft = windowStart > 0;
  const canGoRight = windowStart + VISIBLE < items.length;
  const viewportWidth = VISIBLE * CARD_PX + (VISIBLE - 1) * GAP_PX;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6">
      {/* Desktop/keyboard: fixed 3-card window with chevrons + synced
       *  description panel below. Untouched from the original design. */}
      <div className="hidden items-center gap-2 sm:flex">
        <button
          type="button"
          onClick={() => selectIndex(index - 1)}
          disabled={!canGoLeft}
          aria-label="Previous project"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-dim transition-opacity ${
            canGoLeft ? "hover:border-accent/60 hover:text-accent" : "opacity-0"
          }`}
        >
          ←
        </button>

        <div
          className="overflow-hidden"
          style={{ width: `${viewportWidth}px` }}
        >
          <div
            className="flex gap-4 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${windowStart * (CARD_PX + GAP_PX)}px)`,
            }}
          >
            {items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onPointerEnter={() => selectIndex(i)}
                title={item.label}
                className="block shrink-0"
                style={{ width: `${CARD_PX}px` }}
              >
                <BracketPanel
                  tinted={i === index}
                  className={`flex h-36 w-36 flex-col items-center justify-center gap-2 border p-3 text-center transition-colors ${
                    i === index ? "border-accent/60" : "border-line"
                  }`}
                >
                  {item.logo ? (
                    <div className="relative h-14 w-14">
                      <Image src={item.logo} alt={item.label} fill className="object-contain" />
                    </div>
                  ) : (
                    <span
                      className={`px-1 text-sm font-bold leading-snug tracking-wide ${
                        i === index ? "text-accent" : "text-ink-dim"
                      }`}
                    >
                      {item.fallback}
                    </span>
                  )}
                  <span className="sr-only">{item.label}</span>
                </BracketPanel>
              </Link>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => selectIndex(index + 1)}
          disabled={!canGoRight}
          aria-label="Next project"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink-dim transition-opacity ${
            canGoRight ? "hover:border-accent/60 hover:text-accent" : "opacity-0"
          }`}
        >
          →
        </button>
      </div>

      <div className="hidden w-full max-w-md text-center sm:block">
        <p className="text-xs font-semibold tracking-widest text-ink">
          {active.label.toUpperCase()}
        </p>
        <div className="mt-2 flex h-24 items-start justify-center overflow-hidden">
          <p key={active.href} className="fade-up text-sm leading-relaxed text-ink-soft">
            {active.summary}
          </p>
        </div>
        <div className="flex min-h-[3.25rem] flex-wrap items-center justify-center gap-2">
          {active.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-line px-2 py-1 text-[10px] tracking-widest text-accent"
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Mobile: every card in one native-scroll, snap-to-card strip that
       *  fits inside the box — swipe to browse, tap to open. No windowing
       *  math, no edge button needed to reach the last project. */}
      <MobileCardStrip items={items} />
    </div>
  );
}

function MobileCardStrip({ items }: { items: HudCardItem[] }) {
  const [atEnd, setAtEnd] = useState(items.length <= 2);

  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:hidden">
      <div
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className="flex w-28 shrink-0 snap-start flex-col items-center gap-2"
          >
            <BracketPanel className="flex h-28 w-28 flex-col items-center justify-center gap-2 border border-line p-3 text-center">
              {item.logo ? (
                <div className="relative h-12 w-12">
                  <Image src={item.logo} alt={item.label} fill className="object-contain" />
                </div>
              ) : (
                <span className="px-1 text-sm font-bold leading-snug tracking-wide text-ink-dim">
                  {item.fallback}
                </span>
              )}
            </BracketPanel>
            <span className="text-center text-[10px] font-semibold leading-snug tracking-widest text-ink">
              {item.fallback.toUpperCase()}
            </span>
          </Link>
        ))}
      </div>
      <p
        className={`text-center text-[10px] tracking-widest text-ink-dim transition-opacity ${
          atEnd ? "opacity-0" : "opacity-100"
        }`}
      >
        SWIPE FOR MORE →
      </p>
    </div>
  );
}
