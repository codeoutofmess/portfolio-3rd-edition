import Link from "next/link";
import { CatchMe } from "@/components/catch-me";

const button =
  "flex min-h-12 items-center justify-center rounded-[10px] border border-line px-6 text-[16px] font-medium transition-colors hover:bg-ink hover:text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** Any address that doesn't exist: say so plainly, offer a way back, and keep the catch-me game, under the usual top bar. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[520px] flex-col items-center justify-center px-5 text-center">
      <p className="font-file text-[13px] font-medium uppercase tracking-[0.08em] text-ink-dim">404</p>
      <h2 className="mt-3 text-[26px] font-medium leading-tight sm:text-[32px]">This page doesn&apos;t exist, or it moved.</h2>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={button}>
          Go home
        </Link>
        <Link href="/?view=work" className={button}>
          See my work
        </Link>
      </div>
      <p className="mt-10 text-[13px] font-medium text-ink-dim">While you&apos;re here, tap any empty space.</p>
      {/* The same catch-me game as the home page: a tap on bare page drops a ball. */}
      <CatchMe />
    </main>
  );
}
