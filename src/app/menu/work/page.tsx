import { ShellBox } from "@/components/hud/shell-box";
import { HudMenu } from "@/components/hud/hud-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";
import { CenteredPage } from "@/components/hud/centered-page";

export default function WorkCategoryPage() {
  return (
    <CenteredPage hint={<KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />}>
      <ShellBox backHref="/menu" size="compact">
        <HudMenu
          items={[
            { label: "Dev work", href: "/menu/work/dev" },
            { label: "Design work", href: "/menu/work/design" },
          ]}
          backHref="/menu"
        />
      </ShellBox>
    </CenteredPage>
  );
}
