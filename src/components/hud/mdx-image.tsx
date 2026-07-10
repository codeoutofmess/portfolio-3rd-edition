/** Filenames of images with real transparency that go invisible on a dark page. */
const NEEDS_WHITE_BG = new Set([
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
]);

export function MdxImage({ src = "", alt = "" }: { src?: string; alt?: string }) {
  const filename = src.split("/").pop() ?? "";
  const needsWhiteBg = NEEDS_WHITE_BG.has(filename);

  return (
    <span
      className={`block ${needsWhiteBg ? "rounded-md bg-white p-4" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="rounded-md" />
    </span>
  );
}
