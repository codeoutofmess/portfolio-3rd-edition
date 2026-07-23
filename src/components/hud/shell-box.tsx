"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MenuShell } from "./menu-shell";

interface ShellBoxProps {
  children: React.ReactNode;
  backHref: string;
  backLabel?: string;
  size?: "compact" | "large";
}

/** The back link sits directly above the box, width-matched to it, so it
 *  always reads as attached to the box rather than pinned to the viewport. */
export function ShellBox({
  children,
  backHref,
  backLabel = "BACK",
  size = "compact",
}: ShellBoxProps) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.push(backHref);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, backHref]);

  return (
    <div
      className={`flex min-h-0 flex-col ${
        size === "compact" ? "w-[min(700px,92vw)]" : "w-[min(768px,92vw)]"
      }`}
    >
      <Link
        href={backHref}
        className="mb-3 flex w-fit shrink-0 items-center gap-2 text-xs tracking-widest text-ink-dim hover:text-accent"
      >
        <span className="rounded border border-line px-2 py-1">Esc</span>
        {backLabel}
      </Link>
      <MenuShell size={size}>{children}</MenuShell>
    </div>
  );
}
