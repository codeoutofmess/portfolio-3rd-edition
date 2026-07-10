import { HudMenu } from "@/components/hud/hud-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";

export default function MenuPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-6">
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
