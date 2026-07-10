import type { ReactNode } from "react";

interface BracketPanelProps {
  children: ReactNode;
  className?: string;
  tinted?: boolean;
}

/** A panel framed with camera-reticle corner brackets, HUD-style. */
export function BracketPanel({ children, className = "", tinted = false }: BracketPanelProps) {
  return (
    <div
      className={`hud-frame ${tinted ? "bg-tint" : ""} ${className}`}
    >
      <span className="hud-corner hud-corner-tl" aria-hidden />
      <span className="hud-corner hud-corner-tr" aria-hidden />
      <span className="hud-corner hud-corner-bl" aria-hidden />
      <span className="hud-corner hud-corner-br" aria-hidden />
      {children}
    </div>
  );
}
