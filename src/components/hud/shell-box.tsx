"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Page column under the site chrome, with a back link and Esc to go back. */
export function ShellBox({
  children,
  backHref = "/",
  backLabel = "Back",
}: {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(backHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, backHref]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-32 sm:px-10 md:pt-32">
      <Link href={backHref} className="text-[14.5px] text-ink-soft hover:text-ink">
        ← {backLabel}
      </Link>
      <div className="mt-10">{children}</div>
    </div>
  );
}
