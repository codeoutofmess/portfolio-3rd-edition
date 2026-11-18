"use client";

import { useIntroText } from "@/lib/intro";

/** Text that types itself in after the opening loader. The untyped rest is laid out but invisible, so nothing shifts. */
export function TypedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const n = useIntroText(text, delay);
  return (
    <>
      {text.slice(0, n)}
      <span className="invisible">{text.slice(n)}</span>
    </>
  );
}

/** The same for text inside an SVG (the dial's labels): one tspan per letter, so the spacing along the curve never changes. */
export function TypedTspans({ text, delay = 0 }: { text: string; delay?: number }) {
  const n = useIntroText(text, delay);
  return (
    <>
      {[...text].map((c, i) => (
        <tspan key={i} fillOpacity={i < n ? 1 : 0}>
          {c}
        </tspan>
      ))}
    </>
  );
}
