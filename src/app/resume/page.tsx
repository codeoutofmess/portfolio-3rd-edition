import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { ShellBox } from "@/components/hud/shell-box";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Resume" };

function resumeExists(): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", site.resumeUrl));
}

export default function ResumePage() {
  const hasResume = resumeExists();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <ShellBox backHref="/menu" size="large">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs tracking-widest text-accent">{"// RESUME"}</p>
          {hasResume && (
            <a
              href={site.resumeUrl}
              download
              className="rounded border border-line px-4 py-2 text-xs tracking-widest text-accent hover:bg-white/5"
            >
              DOWNLOAD ↓
            </a>
          )}
        </div>

        {hasResume ? (
          <div className="mt-6 overflow-hidden rounded-md border border-line bg-white">
            <embed
              src={site.resumeUrl}
              type="application/pdf"
              className="h-[70vh] w-full"
            />
          </div>
        ) : (
          <div className="mt-6 flex h-64 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line text-center">
            <p className="text-sm text-ink-soft">
              Resume not uploaded yet — check back soon.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="text-xs tracking-widest text-accent hover:underline"
            >
              OR EMAIL ME FOR A COPY
            </a>
          </div>
        )}
      </ShellBox>
    </main>
  );
}
