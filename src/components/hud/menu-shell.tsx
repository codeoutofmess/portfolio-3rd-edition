import { ViewTransition } from "react";
import { BracketPanel } from "./bracket-panel";

interface MenuShellProps {
  children: React.ReactNode;
  /** "compact" is the one fixed size shared by menu/about/work/contact.
   *  "large" is only for case studies — the box morphs between the two
   *  on navigation because both share the same ViewTransition name. */
  size?: "compact" | "large";
}

export function MenuShell({ children, size = "compact" }: MenuShellProps) {
  return (
    <ViewTransition name="menu-shell">
      <BracketPanel
        className={
          size === "compact"
            ? "flex h-[540px] min-h-0 w-[min(700px,92vw)] flex-col overflow-y-auto overflow-x-hidden border border-line bg-panel/70 p-8 sm:p-10"
            : "w-[min(768px,92vw)] border border-line bg-panel/60 p-6 sm:p-10"
        }
      >
        {children}
      </BracketPanel>
    </ViewTransition>
  );
}
