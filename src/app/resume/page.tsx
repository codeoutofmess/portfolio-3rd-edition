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
    <ShellBox>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">Resume</h1>
          <div className="flex flex-wrap gap-3">
            <a
              href={site.resumeDevUrl}
              download
              className="border border-ink px-4 py-2 text-[14.5px] hover:bg-ink hover:text-bg"
            >
              Developer resume ↓
            </a>
            <a
              href={site.resumeUxUrl}
              download
              className="border border-ink px-4 py-2 text-[14.5px] hover:bg-ink hover:text-bg"
            >
              UX resume ↓
            </a>
          </div>
        </div>

        {hasResume && hasPreview ? (
          <div className="mt-6 flex justify-center">
            <Image
              src={PREVIEW_URL}
              alt="Pradyumna Vishwanath's resume"
              width={1240}
              height={1754}
              className="w-full max-w-md border border-line"
              priority
            />
          </div>
        ) : (
          <div className="mt-6 flex h-64 flex-col items-center justify-center gap-2 border border-dashed border-line text-center">
            <p className="text-base text-ink-soft">
              Resume not uploaded yet — check back soon.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="text-[14.5px] underline"
            >
              Or email me for a copy
            </a>
          </div>
        )}
    </ShellBox>
  );
}
