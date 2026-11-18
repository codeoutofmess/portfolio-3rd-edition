"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PanelWindow } from "@/components/panel-window";
import { site } from "@/lib/site";
import { useMobile } from "@/lib/use-mobile";

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "w-full border-b border-line bg-transparent py-2 text-[16px] lg:text-[14px] outline-none transition-colors placeholder:text-ink-dim focus:border-ink font-medium";

/** Mail compose window. */
export function ContactWindow({ open, delay = 0, onClose }: { open: boolean; delay?: number; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const mobile = useMobile();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(f)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSentTo(String(f.get("email")));
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  return (
    <PanelWindow open={open} delay={delay} onClose={onClose} title="New message" label="Send me a message" tall modal={!mobile} maxWidth={560}>
      {status === "sent" ? (
        <div className="grid flex-1 place-items-center px-6 py-12 text-center">
          <div className="animate-[file-details_0.5s_ease-out_backwards]">
            <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 fill-none stroke-ink [stroke-linecap:round] [stroke-linejoin:round]" strokeWidth={1.4} aria-hidden>
              <circle cx="12" cy="12" r="9.5" />
              <path d="m7.8 12.4 2.8 2.8 5.6-6" />
            </svg>
            <h2 className="mt-4 font-display text-[28px] font-bold uppercase leading-none">Message sent</h2>
            <p role="status" className="mt-3 text-[14px] leading-snug text-ink-soft font-medium">
              Thanks, I&apos;ve got it. I&apos;ll reply to {sentTo} within a day or two.
            </p>
            <button type="button" onClick={() => setStatus("idle")} className="mt-5 text-[13px] underline underline-offset-4 hover:text-ink-soft font-medium">
              Write another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3 border-b border-line py-2 text-[14px] font-medium">
            <span className="w-14 text-[11px] uppercase tracking-[0.08em] text-ink-dim font-medium">To</span>
            <span>Pradyumna Vishwanath</span>
            <span className="min-w-0 break-all text-ink-dim">&lt;{site.email}&gt;</span>
          </div>
          <label className="flex items-baseline gap-3">
            <span className="w-14 shrink-0 text-[11px] uppercase tracking-[0.08em] text-ink-dim font-medium">Name</span>
            <input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" className={field} />
          </label>
          <label className="flex items-baseline gap-3">
            <span className="w-14 shrink-0 text-[11px] uppercase tracking-[0.08em] text-ink-dim font-medium">From</span>
            <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="you@email.com" className={field} />
          </label>
          <label className="flex items-baseline gap-3">
            <span className="w-14 shrink-0 text-[11px] uppercase tracking-[0.08em] text-ink-dim font-medium">Subject</span>
            <input name="subject" maxLength={150} placeholder="What's it about?" className={field} />
          </label>
          {/* Honeypot: hidden from people, tempting to bots */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px]" />
          <label className="mt-2 flex min-h-[120px] flex-1">
            <span className="sr-only">Message</span>
            <textarea
              name="message"
              required
              maxLength={5000}
              placeholder="Tell me roughly what you're building and what stage it's at…"
              className="min-h-[120px] w-full flex-1 resize-none bg-transparent py-2 text-[16px] lg:text-[14px] leading-relaxed outline-none placeholder:text-ink-dim font-medium"
            />
          </label>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link href="/links" className="text-[13px] font-medium text-ink-dim underline-offset-4 hover:text-ink hover:underline">
                All my links
              </Link>
              <p role="alert" className="text-[13px] text-ink-soft font-medium">
                {status === "error" ? error : ""}
              </p>
            </div>
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-full bg-ink px-5 py-2 text-[13px] font-medium text-bg transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {status === "sending" ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      )}
    </PanelWindow>
  );
}
