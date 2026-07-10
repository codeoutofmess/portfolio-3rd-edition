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

/**
 * Horizontal row of logo cards, navigable with left/right arrows, Enter, Esc.
 * A detail panel below the row shows the highlighted project's description
 * and tags, updating live as the selection changes — keeps the cards small
 * and uniform while still surfacing real content, all within the same
 * fixed-size box (no per-card copy that would force cards to grow).
 */
export function HudCardMenu({ items, backHref }: HudCardMenuProps) {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const active = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + items.length) % items.length);
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
  }, [index, items, router, backHref]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8">
      <div className="flex flex-wrap items-stretch justify-center gap-4">
        {items.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            onPointerEnter={() => setIndex(i)}
            title={item.label}
            className="block"
          >
            <BracketPanel
              tinted={i === index}
              className={`flex h-32 w-32 flex-col items-center justify-center gap-2 border p-3 text-center transition-colors sm:h-36 sm:w-36 ${
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

      <div key={active.href} className="fade-up w-full max-w-md text-center">
        <p className="text-xs font-semibold tracking-widest text-ink">
          {active.label.toUpperCase()}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {active.summary}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
    </div>
  );
}
