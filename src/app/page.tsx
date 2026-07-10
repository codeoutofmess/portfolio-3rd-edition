"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BracketPanel } from "@/components/hud/bracket-panel";
import { site } from "@/lib/site";

const BUILD_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
}).format(new Date());

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        router.push("/menu");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <main
      onClick={() => router.push("/menu")}
      className="relative flex min-h-screen cursor-pointer flex-col justify-between p-6 sm:p-10"
    >
      <div className="fade-up flex items-start justify-between" style={{ animationDelay: "0ms" }}>
        <div>
          <p className="text-xs italic text-ink-soft">CREATED BY</p>
          <p className="text-sm font-semibold tracking-wide text-ink">
            {site.name.toUpperCase()}
          </p>
          <p className="mt-3 text-xs text-ink-dim">{BUILD_DATE.toUpperCase()}</p>
        </div>

        <div
          className="flex flex-col items-end gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          {site.availableToWork && (
            <BracketPanel tinted className="border border-line px-4 py-2">
              <span className="text-xs tracking-widest text-accent">
                AVAILABLE TO WORK
              </span>
            </BracketPanel>
          )}
          <a
            href="/contact"
            className="text-sm tracking-wide text-ink underline decoration-ink-dim underline-offset-4 hover:text-accent"
          >
            GET IN TOUCH
          </a>
        </div>
      </div>

      <div
        className="fade-up pointer-events-none text-center"
        style={{ animationDelay: "150ms" }}
      >
        <h1 className="text-xl font-medium tracking-[0.15em] text-ink sm:text-3xl">
          {site.tagline.toUpperCase()}
        </h1>
      </div>

      <div className="fade-up flex items-end justify-between" style={{ animationDelay: "300ms" }}>
        <BracketPanel tinted className="border border-line px-5 py-4">
          <p className="text-xs tracking-wide text-ink-soft">DESIGNER // DEVELOPER</p>
          <p className="mt-1 text-xs tracking-wide text-ink-soft">PORTFOLIO</p>
          <p className="mt-1 text-xs tracking-wide text-accent">{site.edition}</p>
        </BracketPanel>

        <div className="flex flex-col items-center gap-4">
          <p className="max-w-[16rem] text-center text-sm italic tracking-wide text-ink-soft sm:text-base">
            CLICK ANYWHERE OR PRESS SPACE BAR TO EXPLORE
          </p>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-ink-soft"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M15 9l-4.5 1.5L9 15l4.5-1.5L15 9z" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>

        <div className="hidden w-40 sm:block" aria-hidden />
      </div>
    </main>
  );
}
