import { ShellBox } from "@/components/hud/shell-box";
import { HudMenu } from "@/components/hud/hud-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";

export default function MenuPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <ShellBox backHref="/" backLabel="EXIT" size="compact">
        <HudMenu
          items={[
            { label: "About me", href: "/about" },
            { label: "Work", href: "/menu/work" },
            { label: "Contact", href: "/contact" },
          ]}
          backHref="/"
        />
      </ShellBox>
      <KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />
    </main>
  );
}
