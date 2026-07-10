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
}

interface HudCardMenuProps {
  items: HudCardItem[];
  backHref?: string;
}

/** Horizontal row of logo cards, navigable with left/right arrows, Enter, Esc. */
export function HudCardMenu({ items, backHref }: HudCardMenuProps) {
  const [index, setIndex] = useState(0);
  const router = useRouter();

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
  );
}
