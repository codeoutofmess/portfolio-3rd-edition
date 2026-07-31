import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import Image from "next/image";
import { ShellBox } from "@/components/hud/shell-box";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Resume" };

const PREVIEW_URL = "/resume-preview.png";

function fileExists(publicPath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", publicPath));
}

export default function ResumePage() {
  const hasResume = fileExists(site.resumeUrl);
  const hasPreview = fileExists(PREVIEW_URL);

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

        {hasResume && hasPreview ? (
          <div className="mt-6 flex justify-center">
            <Image
              src={PREVIEW_URL}
              alt="Pradyumna Vishwanath's resume"
              width={1240}
              height={1754}
              className="w-full max-w-md rounded-md border border-line"
              priority
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
