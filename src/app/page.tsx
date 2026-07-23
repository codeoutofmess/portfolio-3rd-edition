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
      className="relative flex h-dvh cursor-pointer flex-col justify-between overflow-hidden p-5 sm:p-10"
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

      <div
        className="fade-up flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3"
        style={{ animationDelay: "300ms" }}
      >
        <BracketPanel
          tinted
          className="border border-line px-4 py-3 text-center sm:px-5 sm:py-4 sm:text-left"
        >
          <p className="text-xs tracking-wide text-accent">DESIGNER // DEVELOPER</p>
          <p className="mt-1 text-xs tracking-wide text-ink-soft">PORTFOLIO</p>
          <p className="mt-1 text-xs tracking-wide text-ink-soft">{site.edition}</p>
        </BracketPanel>

        <div className="flex flex-shrink-0 flex-col items-center gap-3 sm:gap-4">
          <p className="text-center text-[11px] italic tracking-wide text-ink-soft sm:whitespace-nowrap sm:text-sm md:text-base">
            <span className="sm:hidden">TAP TO EXPLORE</span>
            <span className="hidden sm:inline">
              CLICK ANYWHERE OR PRESS SPACE BAR TO EXPLORE
            </span>
          </p>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line sm:h-14 sm:w-14">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-ink-soft sm:h-6 sm:w-6"
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
