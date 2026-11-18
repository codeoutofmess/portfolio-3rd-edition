"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** "← Work", back to the Work view on the dial. Esc does the same. */
export function BackToWork({ className = "" }: { className?: string }) {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.push("/?view=work");
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [router]);
  return (
    <Link href="/?view=work" className={`text-[14.5px] text-ink-soft hover:text-ink ${className}`}>
      ← Work
    </Link>
  );
}
