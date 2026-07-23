import { ShellBox } from "@/components/hud/shell-box";
import { HudMenu } from "@/components/hud/hud-menu";
import { KeyHintGrid } from "@/components/hud/key-hint";
import { CenteredPage } from "@/components/hud/centered-page";

export default function MenuPage() {
  return (
    <CenteredPage hint={<KeyHintGrid top={["Esc", "↑", "Enter"]} bottom={["←", "↓", "→"]} />}>
      <ShellBox backHref="/" backLabel="EXIT" size="compact">
        <HudMenu
          items={[
            { label: "About me", href: "/about" },
            { label: "Work", href: "/menu/work" },
            { label: "Resume", href: "/resume" },
            { label: "Contact", href: "/contact" },
          ]}
          backHref="/"
        />
      </ShellBox>
    </CenteredPage>
  );
}
