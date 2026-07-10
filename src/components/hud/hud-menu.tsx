"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface HudMenuItem {
  label: string;
  href: string;
}

interface HudMenuProps {
  items: HudMenuItem[];
  backHref?: string;
}

/** Arrow-key/Enter/Esc navigable list. Renders bare — the caller supplies
 *  the surrounding box (see MenuShell / ShellBox). Mouse works too. */
export function HudMenu({ items, backHref }: HudMenuProps) {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => (i + 1) % items.length);
      } else if (e.key === "ArrowUp") {
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
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onPointerEnter={() => setIndex(i)}
            className={`block rounded-sm border px-4 py-2.5 text-sm tracking-[0.15em] transition-colors ${
              i === index
                ? "border-accent/50 bg-tint text-ink"
                : "border-transparent text-ink-dim hover:text-ink-soft"
            }`}
          >
            {item.label.toUpperCase()}
          </Link>
        </li>
      ))}
    </ul>
  );
}
