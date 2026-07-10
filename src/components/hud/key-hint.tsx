export function KeyHint({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-14 w-24 items-center justify-center rounded-md border border-line text-sm text-ink-soft">
      {children}
    </span>
  );
}

/** Two rows of three keys, matching a keyboard's arrow-cluster layout. */
export function KeyHintGrid({
  top,
  bottom,
}: {
  top: React.ReactNode[];
  bottom: React.ReactNode[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {top.map((key, i) => (
        <KeyHint key={`t${i}`}>{key}</KeyHint>
      ))}
      {bottom.map((key, i) => (
        <KeyHint key={`b${i}`}>{key}</KeyHint>
      ))}
    </div>
  );
}
