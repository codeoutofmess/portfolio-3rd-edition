"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BracketPanel } from "./bracket-panel";

export function DetailShell({
  children,
  backHref,
}: {
  children: React.ReactNode;
  backHref: string;
}) {
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6 sm:p-10">
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="flex w-fit items-center gap-2 text-xs tracking-widest text-ink-dim hover:text-accent"
      >
        <span className="rounded border border-line px-2 py-1">Esc</span>
        BACK
      </button>
      <BracketPanel className="border border-line bg-panel/60 p-6 sm:p-10">
        {children}
      </BracketPanel>
    </main>
  );
}
