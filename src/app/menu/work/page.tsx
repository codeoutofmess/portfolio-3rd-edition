import { ShellBox } from "@/components/hud/shell-box";
import { HudMenu } from "@/components/hud/hud-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";

export default function WorkCategoryPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <ShellBox backHref="/menu" size="compact">
        <HudMenu
          items={[
            { label: "Dev work", href: "/menu/work/dev" },
            { label: "Design work", href: "/menu/work/design" },
          ]}
          backHref="/menu"
        />
      </ShellBox>
      <KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />
    </main>
  );
}
