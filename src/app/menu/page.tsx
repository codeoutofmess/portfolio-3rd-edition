import Link from "next/link";
import { HudMenu } from "@/components/hud/hud-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";

export default function MenuPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <Link
        href="/"
        className="absolute left-6 top-6 flex w-fit items-center gap-2 text-xs tracking-widest text-ink-dim hover:text-accent"
      >
        <span className="rounded border border-line px-2 py-1">Esc</span>
        EXIT
      </Link>

      <HudMenu
        items={[
          { label: "About me", href: "/about" },
          { label: "Work", href: "/menu/work" },
          { label: "Contact", href: "/contact" },
        ]}
        backHref="/"
      />
      <KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />
    </main>
  );
}
