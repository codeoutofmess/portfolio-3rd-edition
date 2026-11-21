/** The small page icon the About text and image files share. */
export function PageArt({ strong, label = "txt", thumb }: { strong: boolean; label?: string; thumb?: string }) {
  return (
    <>
      <span className={`absolute inset-0 ${strong ? "bg-ink/60" : "bg-ink/25"}`} style={{ clipPath: "polygon(0 0, 68% 0, 100% 26%, 100% 100%, 0 100%)" }} />
      <span className="absolute inset-[1px] bg-[var(--folder-front)]" style={{ clipPath: "polygon(0 0, 68% 0, 100% 26%, 100% 100%, 0 100%)" }} />
      <span className="absolute right-0 top-0 h-[26%] w-[32%] bg-ink/15" style={{ clipPath: "polygon(0 0, 100% 100%, 0 100%)" }} />
      {thumb ? (
        // An image file shows a tiny picture of itself where the text lines would be.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" draggable={false} className="absolute inset-x-[14%] top-[27%] w-[72%] rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.35)]" style={{ aspectRatio: "1712 / 1080" }} />
      ) : (
        <span className="absolute inset-x-[14%] top-[32%] space-y-[6%]">
          <span className="block h-[2px] w-full bg-ink/30" />
          <span className="block h-[2px] w-[82%] bg-ink/30" />
          <span className="block h-[2px] w-[92%] bg-ink/30" />
        </span>
      )}
      <span className="absolute bottom-[7%] left-[14%] font-file text-[9px] uppercase tracking-wider text-ink-dim font-medium">{label}</span>
    </>
  );
}


/**
 * An image file, the way macOS shows one: the picture itself in a white frame with a soft shadow, not a page with lines.
 * `w` is the icon's width; the frame is a little narrower and as tall as the picture needs.
 */
export function ImageTile({ src, w, strong }: { src: string; w: number; strong?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      className={`block h-auto rounded-[3px] border-[3px] border-white bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.12)] ${strong ? "outline outline-2 outline-ink/50" : ""}`}
      style={{ width: w * 0.96, aspectRatio: "1712 / 1080" }}
    />
  );
}

/** A video file, the way macOS shows one: a still from it in a white frame, with a small play mark. Upright (phone) video. */
export function VideoTile({ src, h, strong }: { src: string; h: number; strong?: boolean }) {
  return (
    <span className="relative block" style={{ height: h, aspectRatio: "9 / 16" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        className={`block h-full w-full rounded-[3px] border-[3px] border-white bg-white object-cover shadow-[0_4px_10px_-2px_rgba(0,0,0,0.5),0_0_0_1px_rgba(0,0,0,0.12)] ${strong ? "outline outline-2 outline-ink/50" : ""}`}
      />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-[35%] -translate-y-1/2 border-y-[6px] border-l-[10px] border-y-transparent border-l-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
      />
    </span>
  );
}
