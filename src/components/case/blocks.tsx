import { LazyVideo } from "@/components/case/lazy-video";

/** Building blocks for the image-led case studies: big media, pairs of media, and short numbered steps. */

/** Images with real transparency that go invisible on a dark page get a white mount. */
const NEEDS_WHITE_BG = new Set(
  [
    "solution-concept.png",
    "step-1-personal-details.png",
    "step-2-background.png",
    "step-3-values-policies.png",
    "step-4-experience.png",
    "step-5-statement.png",
    "step-6-photo.png",
    "existing-resources.png",
    "wireframe.png",
    "research-link-diagram.svg",
    "architecture.svg",
    "pipeline.svg",
    "patrol-timeline.svg",
  ].map((f) => f.replace(/\.[^.]+$/, "")), // by name without the extension, so a file can change format
);

/** One image, GIF or screen recording (.mp4), full width of the column, with an optional one-line caption. */
export function Media({
  src,
  alt = "",
  caption,
}: {
  src: string;
  alt?: string;
  caption?: string;
}) {
  const file = src.split("/").pop() ?? "";
  const white = NEEDS_WHITE_BG.has(file.replace(/\.[^.]+$/, ""));
  // Phone screenshots ("phone*.jpg") stay phone sized, so they sit beside a desktop shot instead of towering over it.
  const phone = file.startsWith("phone");
  const video = file.endsWith(".mp4");
  return (
    <figure
      className={`my-0 min-w-0 ${phone ? "mx-auto w-full max-w-[300px] sm:w-[280px] sm:flex-none" : "w-full flex-1"}`}
    >
      <div
        className={`overflow-hidden rounded-[6px] border border-line ${white ? "bg-white p-4 sm:p-8" : "bg-ink/5"}`}
      >
        {video ? (
          // Screen recordings: silent, looping, sharp at full width. The poster shows until it loads, which happens as it nears the screen.
          <LazyVideo
            src={src}
            poster={src.replace(/\.mp4$/, "-poster.jpg")}
            label={alt || caption}
            className="block h-auto w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- mixed sizes and animated GIFs; plain img keeps them as made
          <img
            src={src}
            alt={alt || caption || ""}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full"
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-[14px] leading-snug text-ink-dim font-medium">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Two media side by side (stacked on phones). */
export function Pair({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
      {children}
    </div>
  );
}

/** A short numbered step: a label on the left, two or three sentences on the right. */
export function Step({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-2 py-4 lg:grid-cols-[180px_1fr] lg:gap-8">
      <h2 className="font-display text-[22px] font-semibold uppercase leading-none tracking-[0.02em]">
        <span className="mr-2 text-ink-dim">{n}</span>
        {title}
      </h2>
      <div className="max-w-[62ch] space-y-3 text-[14px] leading-relaxed text-ink-soft [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}
